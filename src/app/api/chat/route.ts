import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { prisma } from "@/lib/prisma";
// 生成唯一ID
function generateId(prefix = '') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return prefix + timestamp + random;
}
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { searchMemories, extractMemoriesFromConversation, EmbeddingResult } from "@/lib/embedding";
import { performSemanticSearch, SearchResult } from "@/lib/semantic-search";
import { cache, CACHE_KEYS } from "@/lib/cache";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function getOpenAI(): OpenAI {
  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY || "sk-fe6b55b3677d493cbeac4c8fec658b5e",
    baseURL: "https://api.deepseek.com/v1",
  });
}

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    if (!process.env.DEEPSEEK_API_KEY && !process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "缺少 DEEPSEEK_API_KEY 环境变量" }),
        { status: 500 }
      );
    }
    
    // 获取用户会话（优雅处理错误）
    let userId: string | undefined;
    try {
      const session = await getServerSession(authOptions as any);
      userId = ((session as any)?.user as any)?.id || (session as any)?.userId as string | undefined;
      console.log("🔍 Chat API - User ID:", userId);
    } catch (error) {
      console.log("⚠️ Session error (continuing without user):", error);
      userId = undefined;
    }
    
    const openai = getOpenAI();

    const body = await request.json().catch(() => ({}));
    const messages: ChatMessage[] = Array.isArray(body?.messages)
      ? body.messages.map((msg: any) => ({
          ...msg,
          content: typeof msg.content === 'string' 
            ? msg.content.replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // 移除控制字符
                .replace(/\\/g, '\\\\') // 转义反斜杠
                .replace(/"/g, '\\"') // 转义双引号
                .replace(/\n/g, '\\n') // 转义换行符
                .replace(/\r/g, '\\r') // 转义回车符
                .replace(/\t/g, '\\t') // 转义制表符
            : msg.content
        }))
      : [];
    const model = (body?.model as string) || process.env.DEEPSEEK_MODEL || "deepseek-chat";
    // 更保守但不至于过早停止，略增长度
    const temperature = typeof body?.temperature === "number" ? body.temperature : 0.5;
    const stream = Boolean(body?.stream);
    const userLang = (body?.lang as string) || "zh";
    let conversationId: string | undefined = body?.conversationId;
    const web = Boolean(body?.web);
    const attachments = body?.attachments as
      | {
          images?: string[]; // data URLs 或公网链接
          files?: Array<{ name: string; content: string }>;
        }
      | undefined;

    if (!messages.length) {
      return new Response(
        JSON.stringify({ error: "请求体需包含 messages 数组" }),
        { status: 400 }
      );
    }

    // 如果没有会话ID，为登录用户创建新会话
    if (!conversationId && userId) {
      try {
        // 生成对话标题 - 使用AI生成简洁的标题
        const firstUserMsg = messages.find(m => m.role === 'user');
        let title = firstUserMsg?.content?.slice(0, 30) || "新的对话";
        
        // 使用AI异步生成更好的标题（不阻塞响应）
        setImmediate(async () => {
          try {
            if (firstUserMsg?.content) {
              const titleResponse = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                  model: "gpt-3.5-turbo",
                  messages: [
                    {
                      role: "system",
                      content: "你是一个标题生成专家。根据用户的问题，生成一个简洁的标题（不超过20个字）。只返回标题文本，不要任何解释或标点符号。"
                    },
                    {
                      role: "user",
                      content: firstUserMsg.content
                    }
                  ],
                  max_tokens: 30,
                  temperature: 0.7,
                }),
              });

              if (titleResponse.ok) {
                const titleData = await titleResponse.json();
                const generatedTitle = titleData.choices?.[0]?.message?.content?.trim();
                
                if (generatedTitle && conversationId) {
                  // 更新标题到数据库
                  const { updateConversationTitle } = await import("@/lib/database-hybrid");
                  await updateConversationTitle(conversationId, generatedTitle);
                  console.log("✅ AI generated title:", generatedTitle);
                }
              }
            }
          } catch (error) {
            console.log("⚠️ Failed to generate AI title:", error);
          }
        });

        // 直接使用混合存储，它会自动处理数据库连接状态
        const { createConversation } = await import("@/lib/database-hybrid");
        const newConversation = await createConversation(userId, title);
        conversationId = newConversation.id;
        console.log("✅ Created new conversation:", conversationId, "Initial title:", title);
      } catch (error) {
        console.error("❌ Failed to create conversation:", error);
      }
    }

    // 如需联网，先检索网络并拼接为额外 system 提示
    async function buildWebContext(query: string | undefined): Promise<string | null> {
      if (!web || !process.env.TAVILY_API_KEY || !query) {
        console.log("Web search skipped:", { web, hasTavilyKey: !!process.env.TAVILY_API_KEY, hasQuery: !!query });
        return null;
      }
      
      // 检查缓存
      const cacheKey = CACHE_KEYS.WEB_CONTEXT(query);
      const cached = cache.get<string>(cacheKey);
      if (cached) {
        console.log("Using cached web context for query:", query);
        return cached;
      }
      
      try {
        console.log("Starting web search for query:", query);
        const tavilyResponse = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: process.env.TAVILY_API_KEY,
            query,
            search_depth: "basic",
            max_results: 6,
            include_images: false,
            include_answer: false,
          }),
        });
        
        if (!tavilyResponse.ok) {
          console.error("Tavily API error:", tavilyResponse.status, tavilyResponse.statusText);
          return null;
        }
        
        const tavily = await tavilyResponse.json();
        console.log("Tavily response:", tavily);
        
        const results = Array.isArray(tavily?.results) ? tavily.results.slice(0, 5) : [];
        if (!results.length) {
          console.log("No search results found");
          return null;
        }
        
        const lines = results.map((r: any, i: number) => 
          `【${i + 1}】${r?.title ?? "无标题"}\n内容：${(r?.content ?? "").slice(0, 200)}...\n来源：${r?.url ?? ""}`
        ).join("\n\n");
        
        const webContext = `📡 联网搜索结果（最新信息）：\n\n${lines}\n\n✨ 请基于以上最新信息回答用户问题，并在回答末尾列出参考来源：[1][2][3]等格式。`;
        
        // 缓存结果（10分钟）
        cache.set(cacheKey, webContext, 10 * 60 * 1000);
        
        console.log("Web search completed, found", results.length, "results");
        return webContext;
      } catch (error) {
        console.error("Web search failed:", error);
        return null;
      }
    }

    const lastUserMsg = messages[messages.length - 1]?.content;

    // 并行执行网络搜索和记忆检索以减少延迟
    const [webContext, relevantMemories, searchResults] = await Promise.all([
      buildWebContext(lastUserMsg),
      // 恢复记忆检索，但限制数量以提高速度，并添加缓存
      userId ? getCachedMemories(userId, lastUserMsg || "") : Promise.resolve([]),
      // 恢复语义搜索，但限制结果数量，并添加缓存
      getCachedSearchResults(lastUserMsg || "")
    ]);

    // 缓存记忆检索结果
    async function getCachedMemories(userId: string, query: string): Promise<EmbeddingResult[]> {
      const cacheKey = CACHE_KEYS.USER_MEMORIES(userId, query);
      const cached = cache.get<EmbeddingResult[]>(cacheKey);
      if (cached) {
        console.log("Using cached memories for user:", userId);
        return cached;
      }

      try {
        const memories = await searchMemories(userId, query, 3);
        // 缓存结果（5分钟）
        cache.set(cacheKey, memories, 5 * 60 * 1000);
        return memories;
      } catch (error) {
        console.error("Memory search failed:", error);
        return [];
      }
    }

    // 缓存语义搜索结果
    async function getCachedSearchResults(query: string): Promise<SearchResult[]> {
      const cacheKey = CACHE_KEYS.SEARCH_RESULTS(query);
      const cached = cache.get<SearchResult[]>(cacheKey);
      if (cached) {
        console.log("Using cached search results for query:", query);
        return cached;
      }

      try {
        const results = await performSemanticSearch(query, 3);
        // 缓存结果（10分钟）
        cache.set(cacheKey, results, 10 * 60 * 1000);
        return results;
      } catch (error) {
        console.error("Semantic search failed:", error);
        return [];
      }
    }

    async function buildOpenAIMessages(): Promise<ChatCompletionMessageParam[]> {
      // 基础消息
      // 构建记忆上下文
      let memoryContext = "";
      if (relevantMemories.length > 0) {
        memoryContext = "\n\n相关记忆信息：\n" + 
          relevantMemories.map((memory, index) => 
            `${index + 1}. [${memory.category}] ${memory.content} (重要性: ${memory.importance}/10)`
          ).join("\n") + 
          "\n\n请根据这些记忆信息提供更个性化的回答。";
      }

      // 构建搜索上下文
      let searchContext = "";
      if (searchResults.length > 0) {
        searchContext = "\n\n实时搜索结果：\n" + 
          searchResults.map((result, index) => 
            `${index + 1}. ${result.title}\n   ${result.snippet}\n   来源: ${result.url}`
          ).join("\n\n") + 
          "\n\n请结合这些搜索结果提供准确和最新的信息，并在回答末尾提供参考链接。";
      }

      // 获取当前日期和时间
      const now = new Date();
      const dateString = now.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
      const currentDateTime = `当前日期时间：${dateString} ${now.toLocaleTimeString('zh-CN', { hour12: false })}`;

      const systemPrompt =
        body?.systemPrompt ||
        (userLang === "en"
          ? `${now.toLocaleString('en-US')}. You are a helpful AI assistant. Respond concisely and accurately.` + memoryContext + searchContext
          : userLang === "ja"
          ? `${now.toLocaleString('ja-JP')}。あなたは役立つAIアシスタントです。簡潔かつ正確に回答してください。` + memoryContext + searchContext
          : userLang === "ko"
          ? `${now.toLocaleString('ko-KR')}. 당신은 유용한 AI 어시스턴트입니다. 간결하고 정확하게 답변하세요.` + memoryContext + searchContext
          : `${currentDateTime}。你是一个专业的AI助理。用简体中文回答，简洁准确。` + memoryContext + searchContext);

      const oaMessages: ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content } as ChatCompletionMessageParam)),
      ];
      // 附件：将最后一条 user 消息升级为多模态
      const imgs = Array.isArray(attachments?.images) ? attachments!.images.slice(0, 4) : [];
      const files = Array.isArray(attachments?.files) ? attachments!.files : [];
      if (imgs.length || files.length) {
        const lastIndex = oaMessages.length - 1;
        if (lastIndex >= 0 && oaMessages[lastIndex]?.role === "user") {
          const last = oaMessages[lastIndex];
          const textParts: any[] = [];
          // 文本部分：原始提问 + 文件内容（截断）
          const fileText = files
            .map((f) => {
              const clipped = (f.content ?? "").slice(0, 50_000); // 限制体积
              // 检查是否是PDF文件
              if (f.name.toLowerCase().endsWith('.pdf')) {
                return `【PDF文件:${f.name}】\n${clipped}\n\n注意：这是PDF文件的内容，如果内容显示不完整，建议您将PDF内容复制粘贴到聊天框中以获得更准确的分析。`;
              }
              return `【文件:${f.name}】\n${clipped}`;
            })
            .join("\n\n");
          const fullText = typeof (last as any).content === "string" ? (last as any).content : "";
          const mergedText = fileText ? `${fullText}\n\n${fileText}` : fullText;
          textParts.push({ type: "text", text: mergedText });
                  // 图片部分 - 同步分析图片，确保AI能看到图片内容
                  if (imgs.length > 0) {
                    try {
                      console.log("🖼️ 开始分析图片，数量:", imgs.length);

                      // 检查是否有OpenAI API密钥
                      const openaiKey = process.env.OPENAI_API_KEY;
                      if (!openaiKey || openaiKey.length < 20) {
                        console.log("⚠️ OpenAI API密钥无效，跳过图片分析");
                        textParts.push({
                          type: "text",
                          text: `\n\n[用户上传了 ${imgs.length} 张图片，但图片分析服务不可用]`
                        });
                      } else {
                        // 使用OpenAI Vision API分析图片
                        const openaiVision = new OpenAI({
                          apiKey: process.env.OPENAI_API_KEY,
                          baseURL: "https://api.openai.com/v1",
                        });

                        // 验证和处理图片URL格式
                        const validImgs = imgs.filter((imgUrl, index) => {
                          const isDataUrl = imgUrl.startsWith('data:image/');
                          const isHttpUrl = imgUrl.startsWith('http://') || imgUrl.startsWith('https://');

                          if (isDataUrl) {
                            const supportedFormats = ['png', 'jpeg', 'jpg', 'gif', 'webp'];
                            return supportedFormats.some(format =>
                              imgUrl.startsWith(`data:image/${format}`)
                            );
                          }
                          return isHttpUrl;
                        });

                        if (validImgs.length === 0) {
                          console.log("⚠️ 没有有效的图片格式");
                          textParts.push({
                            type: "text",
                            text: `\n\n[用户上传了 ${imgs.length} 张图片，但格式不支持]`
                          });
                        } else {
                          // 同步分析图片
                          const visionCompletion = await openaiVision.chat.completions.create({
                            model: "gpt-4o",
                            messages: [
                              {
                                role: "user",
                                content: [
                                  {
                                    type: "text",
                                    text: "请详细分析这些图片的内容，包括：1. 图片中显示的主要物体和文字 2. 颜色和构图 3. 可能的用途或场景。请用中文回答，要准确描述图片内容。"
                                  },
                                  ...validImgs.slice(0, 2).map(imgUrl => ({ // 限制最多2张图片
                                    type: "image_url" as const,
                                    image_url: { url: imgUrl }
                                  }))
                                ]
                              }
                            ],
                            max_tokens: 1000
                          });

                          const visionAnalysis = visionCompletion.choices[0]?.message?.content || "无法分析图片内容";
                          console.log("✅ 图片分析完成:", visionAnalysis.substring(0, 100) + "...");
                          
                          // 将图片分析结果添加到消息中
                          textParts.push({
                            type: "text",
                            text: `\n\n[图片分析结果：${visionAnalysis}]`
                          });
                        }
                      }
                    } catch (visionError) {
                      console.error("❌ 图片分析失败:", visionError);
                      textParts.push({
                        type: "text",
                        text: `\n\n[用户上传了 ${imgs.length} 张图片，但分析失败]`
                      });
                    }
                  }
          oaMessages[lastIndex] = { role: "user", content: textParts } as any;
        }
      }
      if (webContext) oaMessages.push({ role: "system", content: webContext });
    return oaMessages;
  }

  // 处理图片分析结果
  function processImageAnalysis(visionData: any): string {
    const responses = visionData.responses?.[0];
    if (!responses) return "无法分析此图片";

    const labels = responses.labelAnnotations || [];
    const texts = responses.textAnnotations || [];
    const objects = responses.localizedObjectAnnotations || [];

    let analysis = "";
    
    if (labels.length > 0) {
      analysis += `检测到：${labels.map((l: any) => l.description).join(", ")}`;
    }
    
    if (texts.length > 0) {
      const textContent = texts.map((t: any) => t.description).join(" ");
      analysis += `。文字内容：${textContent}`;
    }
    
    if (objects.length > 0) {
      analysis += `。物体：${objects.map((o: any) => o.name).join(", ")}`;
    }

    return analysis || "图片分析完成，但未检测到明显特征";
  }

    // 流式输出
    if (stream) {
      const encoder = new TextEncoder();
      const streamBody = new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
      const oaMessages = await buildOpenAIMessages();
            const streamCompletion = await openai.chat.completions.create({
              model,
              messages: oaMessages,
              temperature,
              presence_penalty: 0.1,
              frequency_penalty: 0.15,
              // 大幅提升token限制，确保回答完整性
              max_tokens: 8192,
              stream: true,
            });
            console.log('✅ 开始流式生成，模型:', model);
            // 累积内容用于保存
            let fullText = "";
            let tokenCount = 0;
            let buffer = "";
            let isStreamComplete = false;

            for await (const part of streamCompletion as any) {
              const token = part?.choices?.[0]?.delta?.content ?? "";
              const finishReason = part?.choices?.[0]?.finish_reason;

              // 检查流是否完成
              if (finishReason) {
                console.log(`✅ 流式生成完成，原因: ${finishReason}, 总token数: ${tokenCount}`);
                isStreamComplete = true;
              }

              if (token) {
                fullText += token;
                tokenCount++;
                buffer += token;

                // 批量发送token以提高性能，每5个token或遇到标点符号时发送
                const shouldFlush = tokenCount % 5 === 0 ||
                  /[。！？\n]/.test(token) ||
                  buffer.length > 30;

                if (shouldFlush) {
                  controller.enqueue(encoder.encode(buffer));
                  buffer = "";
                }

                // 每100个token记录一次进度
                if (tokenCount % 100 === 0) {
                  console.log(`📝 已生成 ${tokenCount} tokens, ${fullText.length} 字符`);
                }
              }
            }

            // 发送剩余的buffer
            if (buffer) {
              controller.enqueue(encoder.encode(buffer));
              buffer = "";
            }

            console.log(`✅ 流式传输完成 - 总计: ${tokenCount} tokens, ${fullText.length} 字符`);
            // 追加参考链接（若开启联网）
            if (searchResults && searchResults.length > 0) {
              try {
                const references = searchResults.map((result, index) => ({
                  url: result.url,
                  title: result.title
                }));
                
                const refText = references.map((_, i) => `[${i + 1}]`).join('');
                const appendix = `\n\n参考来源：${refText}`;
                fullText += appendix;
                controller.enqueue(encoder.encode(appendix));
                
                // 在流式响应结束时发送参考链接数据
                const refData = JSON.stringify({ type: 'references', data: references });
                controller.enqueue(encoder.encode(`\n\n<ref-data>${refData}</ref-data>`));
              } catch (error) {
                console.error("处理流式参考链接失败:", error);
              }
            }
            // 保存消息（用户+助手）- 只有登录用户才保存
            if (conversationId && userId) {
              try {
                // 使用混合存储，自动处理数据库连接状态
                const { createMessage } = await import("@/lib/database-hybrid");
                await createMessage(conversationId, "user", messages[messages.length - 1]?.content || "");
                await createMessage(conversationId, "assistant", fullText);
                console.log("✅ Messages saved for user:", userId);

                // 异步提取记忆，不阻塞响应
                setImmediate(async () => {
                  try {
                    await extractMemoriesFromConversation(userId, conversationId, messages);
                    console.log("🧠 Memories extracted for conversation:", conversationId);
                  } catch (error) {
                    console.error("Error extracting memories:", error);
                  }
                });
              } catch (error) {
                console.error("❌ Failed to save messages:", error);
              }
            } else {
              console.log("⚠️ Skipping message save - no conversationId or userId");
            }
          } catch (err: any) {
            const msg = err?.message || "流式生成失败";
            controller.enqueue(encoder.encode(`\n[ERROR] ${msg}`));
          } finally {
            controller.close();
          }
        },
      });
      return new Response(streamBody, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          "X-Conversation-Id": conversationId || "",
        },
      });
    }

    // 兼容 openai v5：优先使用新的 responses API（若部署环境支持），否则回退到 chat.completions
    let choice: any = null;
    let usage: any = null;
    try {
      // 如包含图片，跳过 responses API（DeepSeek不支持图片）
      const hasImages = Array.isArray(attachments?.images) && attachments!.images.length > 0;
      if (hasImages) throw new Error("skip-responses-for-images");
      // @ts-ignore: 部分运行环境可能不存在 responses API
      const response = await (openai as any).responses?.create?.({
        model,
        input: messages,
        temperature,
      });
      const output = response?.output_text ?? response?.content?.[0]?.text;
      if (output) {
        choice = { role: "assistant", content: output };
      }
      usage = (response as any)?.usage ?? null;
    } catch (_) {
      // 忽略，回退到 chat.completions
    }

    if (!choice) {
      const oaMessages = await buildOpenAIMessages();
      const completion = await openai.chat.completions.create({
        model,
        messages: oaMessages,
        temperature,
        presence_penalty: 0.1,
        frequency_penalty: 0.2,
        // 大幅提升token限制，确保回答完整性
        max_tokens: 8192,
      });
      choice = completion.choices?.[0]?.message;
      usage = (completion as any)?.usage ?? null;
      // 若开启联网：从搜索结果中提取参考链接
      if (searchResults && searchResults.length > 0 && typeof choice?.content === "string") {
        try {
          const references = searchResults.map((result, index) => ({
            url: result.url,
            title: result.title
          }));
          
          // 将参考链接添加到消息中
          choice.references = references;
          
          // 在内容末尾添加数字引用
          const refText = references.map((_, i) => `[${i + 1}]`).join('');
          choice.content = `${choice.content}\n\n参考来源：${refText}`;
        } catch (error) {
          console.error("处理参考链接失败:", error);
        }
      }
      // 保存消息与用量 - 只有登录用户才保存
      if (conversationId && userId) {
        try {
          // 使用混合存储，自动处理数据库连接状态
          const { createMessage } = await import("@/lib/database-hybrid");
          await createMessage(conversationId, "user", messages[messages.length - 1]?.content || "");
          await createMessage(conversationId, "assistant", choice?.content || "");
          console.log("✅ Messages saved for user (non-stream):", userId);

          // 异步提取记忆，不阻塞响应
          setImmediate(async () => {
            try {
              await extractMemoriesFromConversation(userId, conversationId, messages);
              console.log("🧠 Memories extracted for conversation:", conversationId);
            } catch (error) {
              console.error("Error extracting memories:", error);
            }
          });
        } catch (error) {
          console.error("❌ Failed to save messages (non-stream):", error);
        }
      } else {
        console.log("⚠️ Skipping message save (non-stream) - no conversationId or userId");
      }
    }
    if (!choice) {
      return new Response(
        JSON.stringify({ error: "未获取到模型回复" }),
        { status: 502 }
      );
    }

    // 规范化 usage 字段
    const normalizedUsage = usage
      ? {
          prompt_tokens:
            (usage as any).prompt_tokens ?? (usage as any).input_tokens ?? null,
          completion_tokens:
            (usage as any).completion_tokens ?? (usage as any).output_tokens ?? null,
          total_tokens: (usage as any).total_tokens ?? null,
        }
      : null;

    return new Response(
      JSON.stringify({ 
        reply: choice, 
        usage: normalizedUsage,
        conversationId: conversationId || null 
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("❌ Chat API error:", error);
    const message =
      error instanceof Error ? error.message : "服务器内部错误";
    
    // 根据错误类型返回不同的状态码
    let status = 500;
    if (message.includes("402") || message.includes("Insufficient Balance")) {
      status = 402;
    } else if (message.includes("401") || message.includes("Unauthorized")) {
      status = 401;
    } else if (message.includes("429") || message.includes("Rate limit")) {
      status = 429;
    }
    
    return new Response(
      JSON.stringify({ 
        error: message,
        type: status === 402 ? "insufficient_balance" : 
              status === 401 ? "unauthorized" :
              status === 429 ? "rate_limit" : "server_error"
      }),
      { status }
    );
  }
}


