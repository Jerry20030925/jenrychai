"use client";

import { useEffect, useRef, useState, memo, useCallback } from "react";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { motion, AnimatePresence } from "framer-motion";

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};

type PendingAttachment = {
  images: string[]; // data URL(s)
  files: Array<{ name: string; content: string }>;
};

type Usage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
} | null;

// 提取正文与参考链接（模块级，供各组件复用）
function extractReferences(content: string): { body: string; refs: Array<{ index: number; url: string }> } {
  if (!content || content === "<typing/>") return { body: content, refs: [] };
  const marker = "\n\n参考：\n";
  const idx = content.lastIndexOf(marker);
  if (idx === -1) return { body: content, refs: [] };
  const body = content.slice(0, idx);
  const tail = content.slice(idx + marker.length);
  const lines = tail.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const refs = lines
    .map((line) => {
      const match = line.match(/\[(\d+)\]\s+(https?:[^\s]+)$/);
      if (!match) return null;
      return { index: Number(match[1]), url: match[2] };
    })
    .filter(Boolean) as Array<{ index: number; url: string }>;
  return { body, refs };
}

// 参考链接展开/收起的简易多语言
function getRefsI18n(lang: string): { collapse: string; expand: (n: number) => string } {
  switch (lang) {
    case "en":
      return { collapse: "Hide references", expand: (n) => `Show references (${n})` };
    case "ja":
      return { collapse: "参考を閉じる", expand: (n) => `参考を表示（${n}）` };
    case "ko":
      return { collapse: "출처 접기", expand: (n) => `출처 표시 (${n})` };
    default:
      return { collapse: "收起参考", expand: (n) => `展开参考（${n}）` };
  }
}

// 单条助手消息内容渲染（Memo）
const MessageBody = memo(function MessageBody({
  id,
  content,
  open,
  onToggle,
  lang,
}: {
  id: string;
  content: string;
  open: boolean;
  onToggle: () => void;
  lang: string;
}) {
  const data = extractReferences(content);
  const body = data.body;
  const refs = data.refs;
  const hasRefs = refs.length > 0;
  const refsI18n = getRefsI18n(lang);
  return (
    <div>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {body}
      </ReactMarkdown>
      {hasRefs && (
        <div className="mt-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="text-xs underline text-blue-600 dark:text-blue-400"
            onClick={onToggle}
          >
            {open ? refsI18n.collapse : refsI18n.expand(refs.length)}
          </motion.button>
          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="mt-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/60 p-2 text-xs max-w-full"
              >
                <ul className="space-y-1 list-disc pl-5">
                  {refs.map((r) => (
                    <li key={r.index}>
                      <a className="text-blue-600 hover:underline break-all" href={r.url} target="_blank" rel="noreferrer">
                        [{r.index}] {r.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
});

export default function Home() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<UiMessage[]>([]);
  
  // 直接使用messages，不需要memoization
  
  // Debug: 打印消息状态 (开发环境)
  useEffect(() => {
    // 静默监控消息变化
  }, [messages.length]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<string>("deepseek-chat");
  const [streamEnabled, setStreamEnabled] = useState<boolean>(true);
  const [webEnabled, setWebEnabled] = useState<boolean>(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [lastUsage, setLastUsage] = useState<Usage>(null);
  const [conversations, setConversations] = useState<Array<{ id: string; title?: string | null }>>([]);
  const [loadingConvs, setLoadingConvs] = useState<boolean>(true);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  // 监控conversations状态变化 - 简化版本
  useEffect(() => {
    // 静默监控，不输出日志
  }, [conversations.length]);
  const endRef = useRef<HTMLDivElement | null>(null);
  const heroInputRef = useRef<HTMLInputElement | null>(null);
  const bottomInputRef = useRef<HTMLTextAreaElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      const stored = localStorage.getItem("sidebarOpen");
      if (stored === "1" || stored === "0") {
        return stored === "1";
      }
      return true; // 默认返回true，避免SSR不一致
    } catch {
      return true;
    }
  });
  const [showHero, setShowHero] = useState<boolean>(true);
  const [refsOpenMap, setRefsOpenMap] = useState<Record<string, boolean>>({});
  const stopTimerRef = useRef<number | null>(null);
  const [pending, setPending] = useState<PendingAttachment>({ images: [], files: [] });
  const chunkBufferRef = useRef<string>("");
  const flushTimerRef = useRef<number | null>(null);
  // 思考动画：确保至少显示一段时间
  const [thinkingIds, setThinkingIds] = useState<Record<string, number>>({});
  const thinkingMapRef = useRef<Record<string, number>>({});
  function markThinkingStart(id: string) {
    const now = Date.now();
    thinkingMapRef.current[id] = now;
    setThinkingIds({ ...thinkingMapRef.current });
  }
  function markThinkingStop(id: string, minMs = 2000) {
    const start = thinkingMapRef.current[id] || Date.now();
    const delay = Math.max(0, minMs - (Date.now() - start));
    window.setTimeout(() => {
      delete thinkingMapRef.current[id];
      setThinkingIds({ ...thinkingMapRef.current });
    }, delay);
  }
  const listRef = useRef<HTMLDivElement | null>(null);
  const [autoScroll, setAutoScroll] = useState<boolean>(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState<boolean>(false);
  
  // 手动滚动到底部
  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollToBottom(false);
  };

  // 触感反馈
  const triggerHapticFeedback = () => {
    if (typeof window !== "undefined" && 'vibrate' in navigator) {
      navigator.vibrate(50); // 轻微震动50ms
    }
  };

  // 多语言建议问题
  const getSuggestionsForLang = useCallback((lang: string) => {
    const suggestions = {
      zh: [
        "帮我写一个Python函数",
        "解释一下量子计算的基本原理", 
        "如何优化网站性能？",
        "推荐几本好书"
      ],
      en: [
        "Help me write a Python function",
        "Explain quantum computing principles",
        "How to optimize website performance?",
        "Recommend some good books"
      ],
      ja: [
        "Python関数を書いてください",
        "量子コンピューティングの基本原理を説明してください",
        "ウェブサイトのパフォーマンスを最適化するには？",
        "良い本を推薦してください"
      ],
      ko: [
        "Python 함수를 작성해주세요",
        "양자 컴퓨팅의 기본 원리를 설명해주세요",
        "웹사이트 성능을 최적화하는 방법은?",
        "좋은 책을 추천해주세요"
      ]
    };
    return suggestions[lang as keyof typeof suggestions] || suggestions.zh;
  }, []);

  const suggestionSets = [
    getSuggestionsForLang("zh"),
    getSuggestionsForLang("en"),
    getSuggestionsForLang("ja"),
    getSuggestionsForLang("ko"),
    [
      "帮我调试代码",
      "解释区块链技术",
      "如何学习新技能？",
      "推荐实用工具"
    ]
  ];
  
  const [currentSuggestionSet, setCurrentSuggestionSet] = useState(0);
  const [suggestions, setSuggestions] = useState(suggestionSets[0]);
  
  // 图片修改需求状态
  const [imageEditPrompt, setImageEditPrompt] = useState("");
  
  // 图片生成提示词状态
  const [imageGenPrompt, setImageGenPrompt] = useState("");
  const [showImageGenInput, setShowImageGenInput] = useState(false);
  
  // 定时切换建议问题
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSuggestionSet(prev => {
        const next = (prev + 1) % suggestionSets.length;
        setSuggestions(suggestionSets[next]);
        return next;
      });
    }, 8000); // 每8秒切换一次
    
    return () => clearInterval(interval);
  }, []);

  // 简易多语言
  const [siteLang, setSiteLang] = useState<string>("zh");

  // 初始化语言和localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      const storedLang = localStorage.getItem("siteLang") || "zh";
      setSiteLang(storedLang);
    } catch (error) {
      console.error("Failed to load language from localStorage:", error);
    }
    
    try {
      const storedLoginHint = localStorage.getItem("loginHintClosed") === "1";
      setLoginHintClosed(storedLoginHint);
    } catch (error) {
      console.error("Failed to load login hint state from localStorage:", error);
    }
  }, []);

  // 语言切换时更新建议问题
  useEffect(() => {
    const updateSuggestionsForLang = () => {
      const langSuggestions = getSuggestionsForLang(siteLang);
      setSuggestions(langSuggestions);
    };

    updateSuggestionsForLang();
  }, [siteLang, getSuggestionsForLang]);
  
  const [greeting, setGreeting] = useState<string>("我们先从哪里开始呢?");
  
  // 根据语言更新问候语
  useEffect(() => {
    const greetings = {
      zh: "我们先从哪里开始呢?",
      en: "Where shall we start?",
      ja: "どこから始めましょうか？",
      ko: "어디서부터 시작할까요?"
    };
    setGreeting((greetings as any)[siteLang] || greetings.zh);
  }, [siteLang]);
  
  // 监听语言变化事件
  useEffect(() => {
    function handleLangChange(e: Event) {
      const newLang = (e as CustomEvent).detail;
      console.log("Language changed to:", newLang);
      setSiteLang(newLang);
    }
    
    if (typeof window !== "undefined") {
      window.addEventListener("app:lang", handleLangChange);
      return () => window.removeEventListener("app:lang", handleLangChange);
    }
  }, []);
  const i18n = {
    zh: {
      conversations: "会话",
      loading: "加载中...",
      empty: "暂无会话",
      delete: "删除",
      inputHero: "输入你的问题",
      inputBottom: "输入你的问题，按回车发送",
      pressToSpeak: "按住说话",
      releaseToStop: "松开停止",
      upload: "上传图片/文件",
      thinkMode: "启用思考模式",
      webMode: "启用联网搜索",
      scrollHelp: "Esc 或 Cmd/Ctrl+. 可停止生成。",
      thinking: "思考中…",
      expandRefs: (n: number) => `展开参考（${n}）`,
      collapseRefs: "收起参考",
    },
    en: {
      conversations: "Conversations",
      loading: "Loading...",
      empty: "No conversations",
      delete: "Delete",
      inputHero: "Type your question",
      inputBottom: "Type your question and press Enter",
      pressToSpeak: "Hold to talk",
      releaseToStop: "Release to stop",
      upload: "Upload image/file",
      thinkMode: "Enable Thinking Mode",
      webMode: "Enable Web Search",
      scrollHelp: "Press Esc or Cmd/Ctrl+. to stop.",
      thinking: "Thinking…",
      expandRefs: (n: number) => `Show references (${n})`,
      collapseRefs: "Hide references",
    },
    ja: {
      conversations: "会話",
      loading: "読み込み中...",
      empty: "会話はありません",
      delete: "削除",
      inputHero: "質問を入力",
      inputBottom: "質問を入力して Enter で送信",
      pressToSpeak: "長押しで話す",
      releaseToStop: "離して停止",
      upload: "画像/ファイルをアップロード",
      thinkMode: "思考モードを有効化",
      webMode: "ウェブ検索を有効化",
      scrollHelp: "Esc または Cmd/Ctrl+. で停止",
      thinking: "思考中…",
      expandRefs: (n: number) => `参考を表示（${n}）`,
      collapseRefs: "参考を閉じる",
    },
    ko: {
      conversations: "대화",
      loading: "로딩 중...",
      empty: "대화가 없습니다",
      delete: "삭제",
      inputHero: "질문을 입력",
      inputBottom: "질문을 입력하고 Enter를 누르세요",
      pressToSpeak: "길게 눌러 말하기",
      releaseToStop: "떼면 중지",
      upload: "이미지/파일 업로드",
      thinkMode: "생각 모드 사용",
      webMode: "웹 검색 사용",
      scrollHelp: "Esc 또는 Cmd/Ctrl+. 로 중지",
      thinking: "생각 중…",
      expandRefs: (n: number) => `출처 표시 (${n})`,
      collapseRefs: "출처 접기",
    },
  } as const;
  const t = (k: keyof typeof i18n.zh): any => (i18n as any)[siteLang]?.[k] ?? (i18n as any).zh[k];
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [showScrollToTop, setShowScrollToTop] = useState<boolean>(false);
  const [toast, setToast] = useState<string>("");
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [loginHintClosed, setLoginHintClosed] = useState<boolean>(false);
  // 新增状态
  const [webSearchStatus, setWebSearchStatus] = useState<'idle' | 'searching' | 'success' | 'error'>('idle');
  const [showWebToast, setShowWebToast] = useState<boolean>(false);
  const [typingEffect, setTypingEffect] = useState<boolean>(false);
  // 语音输入
  const [recording, setRecording] = useState<boolean>(false);
  const recogRef = useRef<any>(null);
  // 功能菜单与思考模式
  const [showFeatureHero, setShowFeatureHero] = useState<boolean>(false);
  const [showFeatureBottom, setShowFeatureBottom] = useState<boolean>(false);
  const [thinkMode, setThinkMode] = useState<boolean>(false);
  const heroFileRef = useRef<HTMLInputElement | null>(null);
  const bottomFileRef = useRef<HTMLInputElement | null>(null);
  const heroMenuRef = useRef<HTMLDivElement | null>(null);
  const bottomMenuRef = useRef<HTMLDivElement | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isClient, setIsClient] = useState<boolean>(false);
  // 列表滚动值，用于气泡轻微浮动
  const [scrollT, setScrollT] = useState<number>(0);
  // 文本选择浮动工具条
  const [selectionText, setSelectionText] = useState<string>("");
  const [selectionPos, setSelectionPos] = useState<{ x: number; y: number } | null>(null);

  function formatTime(iso?: string): string {
    if (typeof window === "undefined") return "";
    try {
      const d = iso ? new Date(iso) : new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    } catch {
      return "";
    }
  }

  function extractReferences(content: string): { body: string; refs: Array<{ index: number; url: string }> } {
    if (!content || content === "<typing/>") return { body: content, refs: [] };
    const marker = "\n\n参考：\n";
    const idx = content.lastIndexOf(marker);
    if (idx === -1) return { body: content, refs: [] };
    const body = content.slice(0, idx);
    const tail = content.slice(idx + marker.length);
    const lines = tail.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    const refs = lines
      .map((line) => {
        const match = line.match(/\[(\d+)\]\s+(https?:[^\s]+)$/);
        if (!match) return null;
        return { index: Number(match[1]), url: match[2] };
      })
      .filter(Boolean) as Array<{ index: number; url: string }>;
    return { body, refs };
  }

  // 禁用自动滚动，只允许用户手动滚动
  // useEffect(() => {
  //   if (autoScroll && messages.length > 0) {
  //     setTimeout(() => {
  //       endRef.current?.scrollIntoView({ behavior: "smooth" });
  //     }, 100);
  //   }
  // }, [messages.length, autoScroll]);

  const scrollRafRef = useRef<number | null>(null);
  function onListScroll() {
    const el = listRef.current;
    if (!el) return;
    if (scrollRafRef.current !== null) return; // rAF 节流
    scrollRafRef.current = window.requestAnimationFrame(() => {
      const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      // 禁用自动滚动，让用户完全控制
      setAutoScroll(false);
      // 只在用户主动滚动且不在底部时显示滚动按钮
      setShowScrollToBottom(distanceToBottom >= 120 && el.scrollTop > 100);
      setShowScrollToTop(el.scrollTop > 160);
      setScrollT(el.scrollTop);
      if (scrollRafRef.current) {
        window.cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
    });
  }

  // 使用内部滚动容器来控制对话滚动体验
  // IntersectionObserver：自动给 .reveal 元素添加 show 类，实现惰性出现
  useEffect(() => {
    if (typeof window === "undefined") return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).classList.add("show");
          io.unobserve(e.target);
        }
      });
    }, { root: listRef.current ?? null, threshold: 0.01 });
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".reveal:not(.show)"));
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [messages.length, listRef.current]);

  // 停止快捷键：Esc 与 Cmd+.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isCmdDot = (e.key === "." && (e.metaKey || e.ctrlKey));
      const isCommandK = (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey));
      if (e.key === "Escape" || isCmdDot) {
        if (abortRef.current) {
          e.preventDefault();
          stopGeneration();
        }
      }
      if (isCommandK) {
        e.preventDefault();
        heroInputRef.current?.focus();
        const inp = document.querySelector('input[placeholder*="输入你的问题"], input[placeholder*="询问任何问题"]') as HTMLInputElement | null;
        inp?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // 动态问候语：根据本地时间更新
  useEffect(() => {
    function computeGreeting(): string {
      const displayName = (session?.user?.name as string | undefined) || undefined;
      const l = siteLang;
      const hour = new Date().getHours();
      let prefix = "";
      if (l === "en") {
        prefix = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
      } else if (l === "ja") {
        prefix = hour < 12 ? "おはようございます" : hour < 18 ? "こんにちは" : "こんばんは";
      } else if (l === "ko") {
        prefix = hour < 12 ? "좋은 아침" : hour < 18 ? "좋은 오후" : "좋은 저녁";
      } else {
        prefix = hour < 5 ? "凌晨好" : hour < 12 ? "早上好" : hour < 14 ? "中午好" : hour < 18 ? "下午好" : "晚上好";
      }
      return displayName ? `${prefix}，${displayName}` : `${prefix}`;
    }
    
    // 只在客户端计算时间相关的问候语
    if (typeof window !== "undefined") {
      setGreeting(computeGreeting());
      const timer = window.setInterval(() => setGreeting(computeGreeting()), 60 * 1000);
      return () => window.clearInterval(timer);
    }
  }, [session?.user?.name, siteLang]);

  // 监听选择文本，显示浮动工具条
  useEffect(() => {
    function onMouseUp() {
      const sel = window.getSelection?.();
      const text = sel ? String(sel.toString()).trim() : "";
      if (text) {
        const range = sel!.getRangeAt(0).cloneRange();
        const rect = range.getBoundingClientRect();
        setSelectionText(text);
        setSelectionPos({ x: rect.left + rect.width / 2, y: rect.top + window.scrollY });
      } else {
        setSelectionPos(null);
        setSelectionText("");
      }
    }
    window.addEventListener("mouseup", onMouseUp);
    return () => window.removeEventListener("mouseup", onMouseUp);
  }, []);

  // 语音识别（Web Speech API）
  function startVoiceInput() {
    try {
      const W: any = window as any;
      const Recognition = W.SpeechRecognition || W.webkitSpeechRecognition;
      if (!Recognition) {
        setToast("当前浏览器不支持语音输入");
        window.setTimeout(() => setToast(""), 1500);
        return;
      }
      const recog = new Recognition();
      recogRef.current = recog;
      recog.lang = "zh-CN";
      recog.interimResults = true;
      recog.onresult = (e: any) => {
        let str = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          str += e.results[i][0].transcript;
        }
        setInput((prev) => (prev ? prev + " " : "") + str);
      };
      recog.onend = () => { setRecording(false); };
      setRecording(true);
      recog.start();
    } catch {}
  }

  function stopVoiceInput() {
    try { recogRef.current?.stop(); } catch {}
    setRecording(false);
  }

  function toggleVoiceInput() {
    if (recording) stopVoiceInput(); else startVoiceInput();
  }

  // 朗读助手消息（Speech Synthesis）
  function speak(text: string) {
    try {
      if (!text || text === "<typing/>") return;
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "zh-CN";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
      setToast("正在朗读…");
      window.setTimeout(() => setToast(""), 1200);
    } catch {}
  }

  async function ensureConversation(proposedTitle?: string) {
    if (conversationId) return conversationId;
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: (proposedTitle && proposedTitle.slice(0, 30)) || messages[0]?.content?.slice(0, 30) || "新的对话" }),
      });
      if (!res.ok) throw new Error("create conv failed");
      const data = await res.json();
      const id = data?.conversation?.id as string;
      if (id) {
        setConversationId(id);
        loadConversations().catch(error => {
          console.error("❌ Error loading conversations after create:", error);
        });
        // 新建后立即把当前消息列表标记到该会话（仅用于前端显示），后端保存由 /api/chat 完成
        // 保证侧栏立刻出现新会话
        return id;
      }
    } catch {}
    return null;
  }

  async function loadConversations() {
    try {
      setLoadingConvs(true);
      
      const res = await fetch("/api/conversations", {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      if (Array.isArray(data?.conversations)) {
        const list = data.conversations.map((c: any) => ({ 
          id: c.id, 
          title: c.title || `对话 ${c.id.slice(-6)}` 
        }));
        setConversations(list);
        
        // 展示侧边栏当有历史记录时
        if (list.length > 0) {
          setSidebarOpen(true);
          if (typeof window !== "undefined" && !isMobile) {
            setSidebarOpen(true);
            try {
              localStorage.setItem("sidebarOpen", "1");
            } catch (error) {
              console.error("Failed to save sidebar state:", error);
            }
          }
        }
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error("❌ Failed to load conversations:", error);
      setConversations([]);
    } finally {
      setLoadingConvs(false);
    }
  }

  async function selectConversation(id: string) {
    try {
      if (!id || typeof id !== 'string') {
        return;
      }
      
    setConversationId(id);
    setLastUsage(null);
    setShowHero(false);
      setMessages([]);
      
      const res = await fetch(`/api/conversations/${id}/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!res.ok) {
        setMessages([]);
        return;
      }
      
      const data = await res.json();
      
      if (Array.isArray(data?.messages)) {
        const ui: UiMessage[] = data.messages.map((m: any, index: number) => ({ 
          id: m.id || `msg_${index}_${m.role}`, 
          role: m.role === "assistant" ? "assistant" : "user", 
          content: m.content || ""
        }));
        setMessages(ui);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("❌ Failed to load messages:", error);
      setMessages([]);
    }
  }

  async function deleteConversation(id: string) {
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (conversationId === id) {
      setConversationId(null);
      setMessages([]);
      setLastUsage(null);
    }
    loadConversations().catch(error => {
      console.error("❌ Error loading conversations after delete:", error);
    });
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: UiMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    
    // 设置联网搜索状态
    if (webEnabled) {
      setWebSearchStatus('searching');
      setToast('🌐 正在联网搜索最新信息，请稍等...');
      setTimeout(() => setToast(''), 3000);
    }

    try {
      const convId = await ensureConversation(userMsg.content);
      
      // 立即切换到对话模式
      setShowHero(false);

      // 先立即插入占位气泡，再等待网络响应，避免头像延迟出现
      const assistantId = `assistant_${Date.now()}`;
      // 先插入一个"思考中"占位气泡：只显示头像与徽标，不渲染正文
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "<typing/>", createdAt: new Date().toISOString() }]);
      if (thinkMode) markThinkingStart(assistantId);

      // 显示加载提示
      setToast("🤖 正在处理中，请稍候...");

      // 使用流式处理以获得更好的用户体验
      const lang = siteLang; // 使用状态中的语言设置
      
      // 根据语言设置系统提示
      const systemPrompts = {
        zh: "你是 Jenrych AI，一个乐于助人的中文 AI 助手。请用中文回答。",
        en: "You are Jenrych AI, a helpful AI assistant. Please respond in English.",
        ja: "あなたはJenrych AIです。親切なAIアシスタントです。日本語で回答してください。",
        ko: "당신은 Jenrych AI입니다. 도움이 되는 AI 어시스턴트입니다. 한국어로 답변해 주세요."
      };
      
      if (process.env.NODE_ENV === 'development') {
        console.log("Sending request to /api/chat with language:", lang);
      }
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stream: true,
          model,
          conversationId: convId,
          messages: [
            { role: "system", content: (systemPrompts as any)[lang] || systemPrompts.zh },
            ...(Array.isArray(messages) ? [...messages, userMsg] : [userMsg]).map((m) => ({ role: m.role, content: m.content })),
          ],
          web: webEnabled,
          attachments: {
            ...pending,
            imageEditPrompt: imageEditPrompt.trim() || undefined
          },
          lang,
          think: thinkMode,
        }),
      });
      if (process.env.NODE_ENV === 'development') {
        console.log("API Response status:", res.status, "ok:", res.ok);
      }
      
      if (!res.ok) {
        const errorData = await res.json();
        // 根据错误类型显示不同的消息
        if (errorData?.type === "insufficient_balance") {
          throw new Error("API余额不足，请检查DeepSeek账户余额");
        } else if (errorData?.type === "unauthorized") {
          throw new Error("API密钥无效，请检查配置");
        } else if (errorData?.type === "rate_limit") {
          throw new Error("请求过于频繁，请稍后再试");
        } else if (errorData?.type === "model_not_exist") {
          throw new Error("AI模型不存在或不可用，请联系管理员");
        } else {
          throw new Error(errorData?.error || "请求失败");
        }
      }

      // 处理流式响应
      const reader = res.body?.getReader();
      if (!reader) throw new Error("无法读取响应流");
      
      const decoder = new TextDecoder();
      let fullContent = "";
      setStreamingMessageId(assistantId);
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          
          // 实时更新消息内容，添加打字机效果
          setMessages((prev) => Array.isArray(prev) ? prev.map((m) => 
            m.id === assistantId ? { ...m, content: fullContent } : m
          ) : []);
          
          // 只在用户主动发送消息时滚动
          // 移除自动滚动，让用户控制滚动
        }
      } finally {
        reader.releaseLock();
        setStreamingMessageId(null);
      }
      
      // 更新最终消息内容
      if (fullContent) {
        setMessages((prev) => Array.isArray(prev) ? prev.map((m) => (m.id === assistantId ? { ...m, content: fullContent } : m)) : []);
      } else {
        setMessages((prev) => Array.isArray(prev) ? prev.map((m) => (m.id === assistantId ? { ...m, content: "抱歉，本次回答未能生成内容，请重试。" } : m)) : []);
      }
      
      if (thinkMode) markThinkingStop(assistantId);
      
      // 显示成功提示
      setToast('✅ 回答完成');
      setTimeout(() => setToast(''), 1500);
      
      // 更新联网搜索状态
      if (webEnabled) {
        setWebSearchStatus('success');
        setToast('✅ 联网搜索完成，已整合最新信息');
        setTimeout(() => {
          setWebSearchStatus('idle');
          setToast('');
        }, 2000);
      }
      
      // 流式响应中没有usage信息，暂时跳过
      // setLastUsage({
      //   prompt_tokens: data?.usage?.prompt_tokens,
      //   completion_tokens: data?.usage?.completion_tokens,
      //   total_tokens: data?.usage?.total_tokens,
      // });
      setPending({ images: [], files: [] });
      setImageEditPrompt("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "发送失败";
      
      // 更新联网搜索状态为错误
      if (webEnabled) {
        setWebSearchStatus('error');
        setToast('❌ 联网搜索失败，使用离线知识回答');
        setTimeout(() => {
          setWebSearchStatus('idle');
          setToast('');
        }, 3000);
      }
      
      const assistantMsg: UiMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `❌ 抱歉，出现了错误：${message}\n\n请检查网络连接或稍后重试。如果问题持续存在，请尝试重新生成回答。`,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setLoading(false);
    }
  }

  async function retryLast() {
    if (loading) return;
    const lastUser = Array.isArray(messages) ? [...messages].reverse().find((m) => m.role === "user") : undefined;
    if (!lastUser) return;
    setInput(lastUser.content);
    // 复用 sendMessage 流程
    const fakeEvent = { preventDefault: () => {} } as unknown as React.FormEvent;
    sendMessage(fakeEvent).catch(error => {
      console.error("❌ Error in sendMessage:", error);
    });
  }

  // 图像生成功能
  const generateImage = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;
    
    try {
      setLoading(true);
      
      // 添加生成中的图像到待发送区域
      setPending(prev => ({
        ...prev,
        images: [...prev.images, `data:image/svg+xml;base64,${btoa(`
          <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f3f4f6"/>
            <circle cx="200" cy="150" r="20" fill="#3b82f6" opacity="0.3">
              <animate attributeName="r" values="20;30;20" dur="1s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1s" repeatCount="indefinite"/>
            </circle>
            <text x="200" y="180" text-anchor="middle" font-family="Arial" font-size="14" fill="#6b7280">生成中...</text>
          </svg>
        `)}`]
      }));
      
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, size: "1024x1024" })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.imageUrl) {
        // 更新待发送区域的图像
        setPending(prev => ({
          ...prev,
          images: Array.isArray(prev.images) ? prev.images.map((img, index) => 
            index === prev.images.length - 1 ? data.imageUrl : img
          ) : []
        }));
        
        // 添加提示信息到输入框
        setInput(`根据提示词"${prompt}"生成的图像已准备就绪，可以发送给AI进行分析或修改`);
        
        // 添加成功提示
        setToast("✅ 图像生成完成！");
        setTimeout(() => setToast(""), 3000);
      } else {
        throw new Error(data.error || "图像生成失败");
      }
    } catch (error) {
      console.error("图像生成错误:", error);
      const message = error instanceof Error ? error.message : "图像生成失败";
      
      // 移除生成中的图像
      setPending(prev => ({
        ...prev,
        images: prev.images.slice(0, -1)
      }));
      
      setToast(`❌ 图像生成失败：${message}`);
      setTimeout(() => setToast(""), 5000);
    } finally {
      setLoading(false);
    }
  }, []);

  const stopGeneration = useCallback(() => {
    try { readerRef.current?.cancel(); } catch {}
    try { abortRef.current?.abort(); } catch {}
    abortRef.current = null;
    readerRef.current = null;
    setLoading(false);
    setStreamingMessageId(null);
    // 清理流式消息状态
    setMessages(prev => Array.isArray(prev) ? prev.map(m => 
      m.content === "<typing/>" ? { ...m, content: "生成已停止" } : m
    ) : []);
  }, []);

  // 移动端长按“发送/停止”触发停止
  function onSendButtonTouchStart() {
    if (!abortRef.current) return;
    // 600ms 长按
    stopTimerRef.current = window.setTimeout(() => {
      stopGeneration();
    }, 600);
  }
  function onSendButtonTouchEnd() {
    if (stopTimerRef.current) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  }

  function onPrimaryClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (loading && abortRef.current) {
      stopGeneration();
      return;
    }
    const fakeEvent = { preventDefault: () => {} } as unknown as React.FormEvent;
    sendMessage(fakeEvent).catch(error => {
      console.error("❌ Error in sendMessage:", error);
      setToast('发送消息失败');
    });
  }

  const removePendingImage = useCallback((index: number) => {
    setPending((prev) => ({ 
      ...prev, 
      images: Array.isArray(prev.images) ? prev.images.filter((_, i) => i !== index) : [] 
    }));
  }, []);

  const removePendingFile = useCallback((index: number) => {
    setPending((prev) => ({ 
      ...prev, 
      files: Array.isArray(prev.files) ? prev.files.filter((_, i) => i !== index) : [] 
    }));
  }, []);

  const newConversation = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setLastUsage(null);
    setShowHero(true);
    // 清理待发送的附件
    setPending({ images: [], files: [] });
    setImageEditPrompt("");
    setImageGenPrompt("");
    setShowImageGenInput(false);
    setTimeout(() => heroInputRef.current?.focus(), 0);
  }, []);

  async function copyMessage(text: string) {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(text);
      setToast("已复制到剪贴板");
      window.setTimeout(() => setToast(""), 1500);
    } catch {}
  }

  function shareMessage(text: string) {
    if (typeof window === "undefined") return;
    try {
      if (navigator.share) {
        navigator.share({ text });
        setToast("分享面板已打开");
      } else {
        copyMessage(text).catch(error => {
          console.error("❌ Error copying message:", error);
          setToast('复制失败');
        });
      }
      window.setTimeout(() => setToast(""), 1500);
    } catch {}
  }

  // 保证首条消息可见：当消息条数很少时固定滚动到顶部
  useEffect(() => {
    if (!listRef.current) return;
    if (messages.length <= 1) {
      listRef.current.scrollTop = 0;
    }
  }, [messages.length]);

  async function addFilesFromList(fileList: FileList | File[]) {
    const files: File[] = Array.from(fileList as any);
    const images: string[] = [];
    const texts: Array<{ name: string; content: string }> = [];
    for (const f of files) {
      const mime = (f as File).type || "";
      const name = (f as File).name || "";
      if (mime.startsWith("image/")) {
        const url = await new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result || ""));
          r.readAsDataURL(f);
        });
        images.push(url);
      } else if (mime.startsWith("text/") || /\.(md|txt|csv|json|xml|log)$/i.test(name)) {
        const text = await (f as any).text();
        texts.push({ name, content: text });
      } else if (/\.pdf$/i.test(name)) {
        // 暂不解析 PDF，作为参考信息注入文本
        const kb = Math.round(((f as File).size || 0) / 1024);
        texts.push({ name, content: `[PDF] ${name} (${kb} KB)` });
      }
    }
    if (images.length || texts.length) {
      setPending((prev) => ({ images: [...prev.images, ...images], files: [...prev.files, ...texts] }));
    }
  }

  // 使用上面已经定义的status变量

  // 初始化侧边栏和web搜索状态
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      const stored = localStorage.getItem("sidebarOpen");
      if (stored === "1" || stored === "0") {
        setSidebarOpen(stored === "1");
      } else {
        // 默认在桌面端显示侧边栏
        setSidebarOpen(!isMobile);
      }
    } catch (error) {
      console.error("Failed to load sidebar state:", error);
    }
    
    try {
      const storedWeb = localStorage.getItem("webEnabled");
      if (storedWeb === "1") setWebEnabled(true);
      else if (storedWeb === "0") setWebEnabled(false);
    } catch (error) {
      console.error("Failed to load web search state:", error);
    }
  }, []);

  // 登录状态变化时，刷新会话；未登录则清空本地会话视图
  useEffect(() => {
    if (status === "authenticated") {
      loadConversations().catch(error => {
        console.error("❌ Error loading conversations:", error);
      });
    } else if (status === "unauthenticated") {
      setConversations([]);
      setConversationId(null);
      setMessages([]);
      setLastUsage(null);
      setShowHero(true);
      setLoadingConvs(false);
    } else {
      setLoadingConvs(true);
    }
  }, [status]);

  // 顶部 NavBar 控件事件：侧栏开关 & 新建会话
  useEffect(() => {
    function onToggle() {
      setSidebarOpen((v) => {
        const next = !v;
        if (typeof window !== "undefined") {
          try { 
            localStorage.setItem("sidebarOpen", next ? "1" : "0"); 
            window.dispatchEvent(new CustomEvent("app:sidebar-open-changed", { detail: next })); 
          } catch (error) {
            console.error("Failed to save sidebar state:", error);
          }
        }
        return next;
      });
    }
    function onNew() { newConversation(); }
    window.addEventListener("app:sidebar-toggle", onToggle as any);
    window.addEventListener("app:new-conversation", onNew as any);
    return () => {
      window.removeEventListener("app:sidebar-toggle", onToggle as any);
      window.removeEventListener("app:new-conversation", onNew as any);
    };
  }, []);

  // 监听全局退出事件，清空本地 UI 状态
  useEffect(() => {
    function onSignedOut() {
      setConversations([]);
      setConversationId(null);
      setMessages([]);
      setLastUsage(null);
      setShowHero(true);
    }
    window.addEventListener("app:signed-out", onSignedOut as any);
    return () => window.removeEventListener("app:signed-out", onSignedOut as any);
  }, []);

  // 全局错误处理 - 简化版本
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    function handleError(event: ErrorEvent) {
      console.error("❌ Global error:", event.error);
    }
    
    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      console.error("❌ Unhandled promise rejection:", event.reason);
    }
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // 监听窗口尺寸，得到移动端标记
  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsClient(true);
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // 点击外部收起功能菜单
  useEffect(() => {
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (showFeatureHero && heroMenuRef.current && !heroMenuRef.current.contains(t)) setShowFeatureHero(false);
      if (showFeatureBottom && bottomMenuRef.current && !bottomMenuRef.current.contains(t)) setShowFeatureBottom(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showFeatureHero, showFeatureBottom]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("sidebarOpen", sidebarOpen ? "1" : "0");
        window.dispatchEvent(new CustomEvent("app:sidebar-open-changed", { detail: sidebarOpen }));
      } catch (error) {
        console.error("Failed to save sidebar state:", error);
      }
    }
  }, [sidebarOpen]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("webEnabled", webEnabled ? "1" : "0");
      } catch (error) {
        console.error("Failed to save web search state:", error);
      }
    }
  }, [webEnabled]);

  // 调试认证状态 - 简化版本
  if (process.env.NODE_ENV === 'development') {
    console.log("🔍 Auth status:", status);
  }

  // 检查是否显示登录提示条
  const showLoginHint = status === "unauthenticated" && !loginHintClosed;
  
  // 关闭登录提示条
  const closeLoginHint = () => {
    if (typeof window !== "undefined") {
      try { localStorage.setItem("loginHintClosed", "1"); } catch {}
    }
    setLoginHintClosed(true);
  };
  
  return (
    <div className={`relative min-h-screen flex bg-gradient-to-b from-white to-gray-50 dark:from-black dark:to-neutral-950 overflow-hidden floating-dots safe-area-inset ${showLoginHint ? 'pt-20' : 'pt-12'}`}>
      <div className="pointer-events-none absolute -z-10 inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.12),_transparent_60%),radial-gradient(ellipse_at_bottom,_rgba(236,72,153,0.12),_transparent_60%)]" />
      {/* 侧边栏（桌面） */}
      <AnimatePresence initial={false}>
      {sidebarOpen && (
        <motion.aside
          initial={{ x: -288, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -288, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed top-[44px] left-0 flex w-72 h-[calc(100vh-44px)] border-r border-neutral-200 dark:border-neutral-800 flex-col bg-white dark:bg-neutral-900 mobile-scroll z-50 shadow-lg"
        >
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between sticky top-0 z-10 bg-white dark:bg-neutral-950">
            <span className="text-sm font-medium">{t("conversations")}</span>
          </div>
          <div className="flex-1 overflow-y-auto bg-white dark:bg-neutral-900 mobile-scroll hide-scrollbar smooth-scroll conversation-list sidebar-content">
            {loadingConvs ? (
              <div className="p-4 text-xs text-neutral-500 bg-white dark:bg-neutral-900">{t("loading")}</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-xs text-neutral-500 bg-white dark:bg-neutral-900">{t("empty")}</div>
            ) : (
              conversations.map((c, i) => (
                <div key={c.id} className={`px-4 py-3 text-sm flex items-center justify-between cursor-pointer bg-white dark:bg-neutral-900 ${conversationId === c.id ? "active" : ""}`} style={{ transitionDelay: `${Math.min(i*30, 400)}ms` }}>
                  <button 
                    className="truncate text-left flex-1" 
                    onClick={() => {
                      selectConversation(c.id).catch(error => {
                        console.error("❌ Error in selectConversation click handler:", error);
                      });
                    }}
                    style={{ 
                      color: '#1f2937',
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontWeight: '600',
                      textShadow: 'none',
                      opacity: '1',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}
                  >
                    {c.title || `对话 ${c.id.slice(-6)}`}
                  </button>
                  <button 
                    className="ml-2 px-2 py-1 rounded" 
                    onClick={() => deleteConversation(c.id)}
                    style={{ 
                      color: '#ef4444',
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontWeight: '500',
                      textShadow: 'none',
                      opacity: '1',
                      fontSize: '12px',
                      lineHeight: '1.5'
                    }}
                  >
                    {t("delete")}
                  </button>
                </div>
              ))
            )}
          </div>
        </motion.aside>
      )}
      </AnimatePresence>

      {/* 侧边栏（移动端抽屉） */}
      <AnimatePresence initial={false}>
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <motion.div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ type: "tween", duration: 0.25 }}
            className="absolute top-0 bottom-0 left-0 mobile-sidebar bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 shadow-xl flex flex-col mobile-scroll"
          >
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between sticky top-0 z-10 bg-white dark:bg-neutral-950">
              <span className="text-sm font-medium">{t("conversations")}</span>
            </div>
            <div className="flex-1 overflow-y-auto mobile-scroll hide-scrollbar smooth-scroll conversation-list sidebar-content">
              {loadingConvs ? (
                <div className="p-4 text-xs text-neutral-500">{t("loading")}</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-xs text-neutral-500">{t("empty")}</div>
              ) : (
                conversations.map((c, i) => (
                  <div key={c.id} className={`px-4 py-3 text-sm flex items-center justify-between cursor-pointer touch-feedback bg-white dark:bg-neutral-950 ${conversationId === c.id ? "active" : ""}`} style={{ transitionDelay: `${Math.min(i*30, 400)}ms` }}>
                    <button 
                      className="truncate text-left flex-1 touch-target" 
                      onClick={() => { 
                        selectConversation(c.id).catch(error => {
                          console.error("❌ Error in mobile selectConversation click handler:", error);
                        });
                        setSidebarOpen(false); 
                      }}
                      style={{ 
                        color: '#1f2937',
                        backgroundColor: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontWeight: '600',
                        textShadow: 'none',
                        opacity: '1',
                        fontSize: '14px',
                        lineHeight: '1.5'
                      }}
                    >
                      {c.title || `对话 ${c.id.slice(-6)}`}
                    </button>
                    <button 
                      className="ml-2 px-2 py-1 rounded touch-target touch-feedback" 
                      onClick={() => deleteConversation(c.id)}
                      style={{ 
                        color: '#ef4444',
                        backgroundColor: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontWeight: '500',
                        textShadow: 'none',
                        opacity: '1',
                        fontSize: '12px',
                        lineHeight: '1.5'
                      }}
                    >
                      {t("delete")}
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.aside>
        </div>
      )}
      </AnimatePresence>
      {/* 已由顶部导航控制展开/折叠，这里移除独立按钮 */}

      <div className={`flex-1 min-h-0 h-full flex flex-col items-center w-full max-w-6xl mx-auto gap-0 px-4 md:px-6 lg:px-8 mobile-spacing ${showLoginHint ? 'mt-0' : 'mt-0'} ${sidebarOpen ? 'md:ml-72' : 'md:ml-0'} transition-all duration-300 ease-in-out`}>
      <AnimatePresence mode="wait">
      {showHero && messages.length === 0 && (
      <motion.header 
        key="hero-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ 
          opacity: 0, 
          y: -50, 
          scale: 0.95,
          transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } 
        }}
        className={`fixed inset-0 w-full flex flex-col items-center justify-center text-center z-10 pointer-events-none ${showLoginHint ? 'mt-8' : 'mt-0'}`}>
        <div className={`pointer-events-auto w-full max-w-4xl px-4 md:px-6 lg:px-8 mobile-spacing ${showLoginHint ? 'mt-4' : 'mt-0'}`}>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="mb-6 text-center"
        >
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800 dark:text-neutral-100 mb-6">
          {greeting}
        </h1>
        </motion.div>
        
        {/* 建议问题 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSuggestionSet}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto"
          >
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={`${currentSuggestionSet}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              onClick={() => {
                triggerHapticFeedback();
                setInput(suggestion);
                heroInputRef.current?.focus();
              }}
              whileHover={{ 
                scale: 1.02,
                y: -2,
                transition: { duration: 0.2 }
              }}
              whileTap={{ 
                scale: 0.98,
                transition: { duration: 0.1 }
              }}
              className="group relative p-4 text-left text-sm bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-700/50 rounded-2xl hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-blue-400/10 transition-all duration-300 overflow-hidden"
            >
              {/* 圆形气泡背景效果 */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* 内容 */}
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500 group-hover:bg-blue-600 transition-colors duration-200" />
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                    建议 {index + 1}
                  </span>
                </div>
                <div className="text-neutral-800 dark:text-neutral-200 font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200">
                  {suggestion}
                </div>
              </div>
              
              {/* 悬停时的光效 */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </motion.button>
          ))}
          </motion.div>
        </AnimatePresence>
        <form onSubmit={sendMessage} className="w-full">
          <div className="mx-auto max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 shadow-[0_0_0_3px_rgba(59,130,246,0.12)] flex items-center gap-2 p-1.5 overflow-visible glow mobile-reduced-effects ${(pending.images.length > 0 || pending.files.length > 0) ? 'rounded-b-none border-b-0' : 'rounded-full'}`}
            >
              <div className="ml-0 flex items-center justify-center w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-r border-neutral-200 dark:border-neutral-700">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M9 3.75a5.25 5.25 0 1 0 0 10.5A5.25 5.25 0 0 0 9 3.75Zm0 9a3.75 3.75 0 1 1 0-7.5 3.75 3.75 0 0 1 0 7.5Zm6.53 2.22-2.47-2.47a.75.75 0 1 0-1.06 1.06l2.47 2.47a.75.75 0 0 0 1.06-1.06Z" fill="currentColor" />
                </svg>
              </div>
              <input
                ref={heroInputRef}
                className="flex-1 bg-transparent px-2 py-2 text-sm md:text-base focus:outline-none"
                placeholder={t("inputHero")}
                value={input}
                onFocus={() => { if (isClient && isMobile) setSidebarOpen(false); }}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <input ref={heroFileRef} type="file" accept="image/*,.txt,.md,.json,.csv,.log" multiple className="hidden" onChange={async (e)=>{ const fs = Array.from(e.target.files||[]); const images:string[]=[]; const texts:Array<{name:string;content:string}>=[]; for(const f of fs){ if(f.type.startsWith('image/')){ const url = await new Promise<string>((r)=>{ const fr=new FileReader(); fr.onload=()=>r(String(fr.result||'')); fr.readAsDataURL(f); }); images.push(url);} else { const t=await f.text(); texts.push({name:f.name, content:t}); } } setPending((prev)=>({ images:[...prev.images,...images], files:[...prev.files,...texts] })); e.currentTarget.value=''; }} />
              <div className="hidden sm:flex items-center gap-1 pr-1 text-neutral-500">
                {/* 功能按钮 */}
                <div className="relative">
                  <button type="button" onClick={() => setShowFeatureHero((v)=>!v)} className="rounded-full bg-white/5 dark:bg-white/10 border border-white/20 backdrop-blur p-2 touch-target touch-feedback" aria-label="功能">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" fill="currentColor"/></svg>
                </button>
                  {showFeatureHero && (
                    <motion.div ref={heroMenuRef} initial={{ opacity: 0, y: isMobile ? 12 : 6, scale: isMobile ? 1 : 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: isMobile ? 12 : 6, scale: isMobile ? 1 : 0.98 }} transition={{ type: 'spring', stiffness: 320, damping: 24 }} className="absolute top-11 right-0 z-20 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg w-48 p-2 space-y-1 mobile-modal">
                      <button onMouseDown={startVoiceInput} onMouseUp={stopVoiceInput} onTouchStart={startVoiceInput} onTouchEnd={stopVoiceInput} className={`w-full text-left text-sm rounded-lg px-2 py-3 md:py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 touch-feedback ${recording ? 'text-red-600' : ''}`}>{recording ? t('releaseToStop') : t('pressToSpeak')}</button>
                      <button onClick={() => heroFileRef.current?.click()} className="w-full text-left text-sm rounded-lg px-2 py-3 md:py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 touch-feedback">{t('upload')}</button>
                      <label className="flex items-center gap-2 w-full text-left text-sm rounded-lg px-2 py-3 md:py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer touch-feedback">
                        <input type="checkbox" checked={thinkMode} onChange={(e)=>setThinkMode(e.target.checked)} className="rounded" />
                        {t('thinkMode')}
                      </label>
                      <label className="flex items-center gap-2 w-full text-left text-sm rounded-lg px-2 py-3 md:py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer touch-feedback">
                        <input 
                          type="checkbox" 
                          checked={webEnabled} 
                          onChange={(e) => {
                            setWebEnabled(e.target.checked);
                            if (e.target.checked) {
                              setShowWebToast(true);
                              setTimeout(() => setShowWebToast(false), 2000);
                            }
                          }} 
                          className="rounded" 
                        />
                        <span className={`web-indicator ${webEnabled ? 'active' : 'inactive'}`}>
                          {t('webMode')}
                        </span>
                        {webEnabled && (
                          <span className="text-[10px] text-green-600 ml-1">✓</span>
                        )}
                      </label>
                    </motion.div>
                  )}
                </div>
              </div>
              {/* 移动端：联网开关 */}
              <label className="flex sm:hidden items-center gap-1 pr-2 text-neutral-500 cursor-pointer transition-transform active:scale-95">
                  <input
                    type="checkbox"
                    checked={webEnabled}
                    onChange={(e) => setWebEnabled(e.target.checked)}
                    className="peer sr-only"
                  />
                <span className="rounded-full bg-white/5 dark:bg-white/10 border border-white/20 backdrop-blur p-2 flex items-center gap-1 peer-checked:bg-blue-600/20 peer-checked:border-blue-500/40 transition-colors touch-target" aria-label="联网">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-8 10h16M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                  </span>
                </label>
              {/* 移动端：上传 */}
              <label className="flex sm:hidden items-center gap-1 pr-2 text-neutral-500 cursor-pointer transition-transform active:scale-95">
                <input
                  type="file"
                  accept="image/*,.txt,.md,.json,.csv,.log"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    const images: string[] = [];
                    const texts: Array<{ name: string; content: string }> = [];
                    for (const f of files) {
                      if (f.type.startsWith("image/")) {
                        const url = await new Promise<string>((resolve) => {
                          const r = new FileReader();
                          r.onload = () => resolve(String(r.result || ""));
                          r.readAsDataURL(f);
                        });
                        images.push(url);
                      } else {
                        const text = await f.text();
                        texts.push({ name: f.name, content: text });
                      }
                    }
                    setPending((prev) => ({ images: [...prev.images, ...images], files: [...prev.files, ...texts] }));
                    e.currentTarget.value = "";
                  }}
                  className="hidden"
                />
                <span className="rounded-full bg-white/5 dark:bg-white/10 border border-white/20 backdrop-blur p-2 touch-target" aria-label="上传">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                  </span>
                </label>
              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.9, rotate: -5 }}
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: "0 8px 30px rgba(59,130,246,0.4)",
                  rotate: 5
                }}
                className={`rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm w-12 h-12 md:w-10 md:h-10 mr-1 disabled:opacity-60 relative glow flex items-center justify-center touch-target group transition-all duration-300 ${loading ? 'shake' : ''}`}
              >
                {loading ? (
                    <span className="inline-block w-3 h-3 rounded-full border-2 border-white/60 border-t-transparent animate-spin"></span>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 12L20 4l-8 16-1.6-6.4L4 12Z" fill="currentColor"/></svg>
                )}
              </motion.button>
            </motion.div>
          </div>
        </form>
        </div>
      </motion.header>
      )}
      </AnimatePresence>
      <main
        className={`w-full max-w-4xl flex-1 pb-6 ${dragOver ? "dropzone" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={async (e) => {
          e.preventDefault();
          setDragOver(false);
          await addFilesFromList(e.dataTransfer.files);
        }}
      >
        {(pending.images.length > 0 || pending.files.length > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full reveal show"
          >
            <div className="rounded-b-2xl border border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/80 p-3 shadow-lg border-t-0 -mt-px">
              <div className="text-xs text-neutral-500 mb-2">
                {siteLang==='zh'? '待发送附件' : siteLang==='en' ? 'Pending attachments' : siteLang==='ja' ? '送信予定の添付' : '보낼 첨부파일'}
                {pending.images.length > 0 && (
                  <span className="ml-2 text-green-600 dark:text-green-400">
                    (将使用Google Vision API分析图片)
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {pending.images.map((src, i) => (
                  <motion.div 
                    key={`img-${i}`}
                    initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.8, rotate: 5 }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                    whileHover={{ scale: 1.05, rotate: 2 }}
                    className="relative w-24 h-24 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 pulse-border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="preview" className="w-full h-full object-cover" loading="lazy" />
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removePendingImage(i)} 
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 text-xs hover:bg-red-700 transition-colors"
                    >
                      ×
                    </motion.button>
                  </motion.div>
                ))}
                {pending.files.map((f, i) => (
                  <div key={`file-${i}`} className="relative rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white/80 dark:bg-neutral-800/60 px-3 py-2 shadow-sm flex items-center gap-2 min-w-[200px]">
                    <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-700 text-neutral-600 flex items-center justify-center">PDF</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{f.name}</div>
                      <div className="text-[11px] text-neutral-500 truncate">{siteLang==='zh'? '即将发送' : siteLang==='en' ? 'To be sent' : siteLang==='ja' ? '送信予定' : '전송 예정'}</div>
                    </div>
                    <button onClick={() => removePendingFile(i)} className="text-red-600 text-xs">{t('delete')}</button>
                  </div>
                ))}
              </div>
              
              {/* 图片修改需求输入 */}
              {pending.images.length > 0 && (
                <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                      图片修改需求（可选）
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={imageEditPrompt}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImageEditPrompt(e.target.value)}
                      placeholder="描述你希望如何修改这些图片..."
                      className="flex-1 px-3 py-2 text-sm bg-white/50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400"
                    />
                    {imageEditPrompt && (
                      <button
                        type="button"
                        onClick={() => setImageEditPrompt('')}
                        className="px-3 py-2 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
                      >
                        清除
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
        <div
          ref={listRef}
          onScroll={onListScroll}
          className="flex-1 space-y-4 px-4 py-4 overflow-y-auto overscroll-contain"
          style={{ 
            height: showHero 
              ? (showLoginHint ? 'calc(100vh - 200px)' : 'calc(100vh - 120px)')
              : (showLoginHint ? 'calc(100vh - 200px)' : 'calc(100vh - 120px)'), 
            WebkitOverflowScrolling: 'touch',
            paddingTop: showHero ? '0' : '16px',
            paddingBottom: '16px',
            minHeight: '200px'
          }}
        >
            <AnimatePresence initial={false}>
            {messages.map((m, idx) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    transition: { 
                      type: "spring", 
                      stiffness: 420, 
                      damping: 30, 
                      delay: Math.min(idx * 0.02, 0.3) 
                    }
                  }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  style={{ 
                    y: idx < 10 ? Math.sin((scrollT + idx * 64) / 140) * 1.2 : 0, 
                    contentVisibility: 'auto' as any, 
                    containIntrinsicSize: '24px' as any,
                    willChange: 'transform, opacity'
                  }}
                  className={`transition-colors duration-200 ${streamingMessageId === m.id ? 'bg-neutral-50 dark:bg-neutral-800/30' : ''}`}
                >
                  <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2 sm:gap-3 mb-3 sm:mb-4 max-w-4xl mx-auto px-2 sm:px-0`}>
                    {/* 头像 */}
                    {m.role === "assistant" && (
                      <div className="relative flex-shrink-0 w-8 h-8 md:w-7 md:h-7">
                        {(thinkMode && (m.content === "<typing/>" || thinkingIds[m.id])) && (
                          <div className="absolute -inset-1 rounded-full">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 animate-pulse"></div>
                            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500/70 border-r-purple-500/70 animate-spin"></div>
                          </div>
                        )}
                        <div className={`relative z-10 w-8 h-8 rounded-full shadow-lg ring-1 ring-white/20 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center transition-transform duration-200 ${(thinkMode && (m.content === "<typing/>" || thinkingIds[m.id])) ? 'scale-110 shadow-xl' : 'hover:scale-105'}`}>
                          <span className={`bg-gradient-to-br from-pink-500 via-amber-400 to-indigo-500 bg-clip-text text-transparent font-extrabold text-lg transition-all duration-300 ${(thinkMode && (m.content === "<typing/>" || thinkingIds[m.id])) ? 'animate-pulse' : ''}`}>J</span>
                        </div>
                      </div>
                    )}
                  <div
                    className={
                      "inline-block max-w-[85%] sm:max-w-[90%] md:max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 sm:px-5 py-3 sm:py-4 text-sm md:text-base leading-relaxed shadow-sm hover:shadow-md transition-shadow duration-200 " +
                      (m.role === "user"
                        ? "bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-br-md ml-auto"
                        : "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-bl-md")
                    }
                  >
                    {m.role === "assistant" ? (
                      m.content === "<typing/>" ? (
                        <div className="flex items-center gap-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0ms', animationDuration: '1.5s' }}></div>
                            <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" style={{ animationDelay: '200ms', animationDuration: '1.5s' }}></div>
                            <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full animate-pulse" style={{ animationDelay: '400ms', animationDuration: '1.5s' }}></div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <MessageBody
                            id={m.id}
                            content={m.content + (streamingMessageId === m.id ? "▊" : "")}
                            open={!!(refsOpenMap[m.id])}
                            onToggle={() => setRefsOpenMap((prev) => ({ ...prev, [m.id]: !prev[m.id] }))}
                            lang={siteLang}
                          />
                          {/* 放到气泡内部底部的操作区 */}
                          <div className="mt-3 pt-2 border-t border-neutral-200 dark:border-neutral-600 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => copyMessage(m.content)}
                                className="hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                title="复制消息"
                              >
                                📋 复制
                              </button>
                              <button
                                onClick={() => shareMessage(m.content)}
                                className="hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                title="分享消息"
                              >
                                🔗 分享
                              </button>
                              <button
                                onClick={retryLast}
                                className="hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                title="重新生成"
                              >
                                🔄 重试
                              </button>
                            </div>
                            <div className="text-xs opacity-60 flex items-center gap-2">
                              {m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : '刚刚'}
                              {streamingMessageId === m.id && (
                                <span className="text-blue-500 animate-pulse">正在输入...</span>
                              )}
                            </div>
                          </div>
                        </>
                      )
                    ) : (
                      m.content
                    )}
                  </div>
                    {m.role === "user" && (
                      <div className="flex-shrink-0 w-8 h-8 md:w-7 md:h-7 rounded-full overflow-hidden shadow ring-1 ring-white/10">
                        {/* 导航已展示用户头像；此处用同样的 session.image 更自然，简单起见使用占位背景 */}
                        <div className="w-full h-full bg-neutral-700 text-white text-[10px] flex items-center justify-center">我</div>
                      </div>
                    )}
                </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={endRef} />
          </div>
      </main>

      {/* 对话进行中：显示底部输入框 */}
      {/* 图片生成输入区域 */}
      <AnimatePresence>
        {showImageGenInput && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-20 left-2 right-2 sm:left-4 sm:right-4 z-30 mx-auto max-w-4xl px-2 sm:px-4"
          >
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 shadow-[0_0_0_3px_rgba(59,130,246,0.12)] flex items-center gap-2 p-1.5 overflow-visible glow mobile-reduced-effects">
              <div className="flex items-center gap-2 px-2">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  {siteLang === 'zh' ? '图像生成' : 
                   siteLang === 'en' ? 'Image Gen' :
                   siteLang === 'ja' ? '画像生成' :
                   siteLang === 'ko' ? '이미지 생성' : '图像生成'}
                </span>
              </div>
              <input
                type="text"
                value={imageGenPrompt}
                onChange={useCallback((e: React.ChangeEvent<HTMLInputElement>) => setImageGenPrompt(e.target.value), [])}
                placeholder={siteLang === 'zh' ? '描述你想要生成的图像...' : 
                           siteLang === 'en' ? 'Describe the image you want to generate...' :
                           siteLang === 'ja' ? '生成したい画像を説明してください...' :
                           siteLang === 'ko' ? '생성하고 싶은 이미지를 설명해주세요...' : '描述你想要生成的图像...'}
                className="flex-1 bg-transparent px-2 sm:px-3 py-2 text-sm md:text-base focus:outline-none resize-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (imageGenPrompt.trim()) {
                      generateImage(imageGenPrompt);
                      setImageGenPrompt("");
                      setShowImageGenInput(false);
                    }
                  }
                }}
              />
              <motion.button
                onClick={() => {
                  if (imageGenPrompt.trim()) {
                    generateImage(imageGenPrompt);
                    setImageGenPrompt("");
                    setShowImageGenInput(false);
                  }
                }}
                disabled={!imageGenPrompt.trim() || loading}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                className="rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm w-10 h-10 disabled:opacity-50 disabled:cursor-not-allowed relative glow flex items-center justify-center touch-target group transition-all duration-300"
                title={siteLang === 'zh' ? '生成图像' : 
                       siteLang === 'en' ? 'Generate Image' :
                       siteLang === 'ja' ? '画像を生成' :
                       siteLang === 'ko' ? '이미지 생성' : '生成图像'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.button>
              <motion.button
                onClick={() => setShowImageGenInput(false)}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                className="rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-sm w-10 h-10 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex items-center justify-center touch-target"
                title={siteLang === 'zh' ? '关闭' : 
                       siteLang === 'en' ? 'Close' :
                       siteLang === 'ja' ? '閉じる' :
                       siteLang === 'ko' ? '닫기' : '关闭'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
      {(!showHero || messages.length > 0) && (
        <motion.form 
          key="chat-input"
          initial={{ opacity: 0, y: 120, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 120, scale: 0.95 }}
          transition={{ 
            type: "spring", 
            stiffness: 240, 
            damping: 18, 
            delay: 0.3,
            scale: { duration: 0.4 }
          }}
          onSubmit={sendMessage} 
          className="fixed bottom-0 left-0 right-0 z-20 bg-transparent backdrop-blur-sm">
          <div className="mx-auto max-w-4xl px-2 sm:px-4 py-2 mobile-spacing safe-area-bottom" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)' }}>
            <div className={`rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md shadow-lg flex items-center gap-2 p-2 overflow-visible mobile-reduced-effects hover:shadow-xl transition-shadow duration-200 ${(pending.images.length > 0 || pending.files.length > 0) ? 'rounded-t-none border-t-0' : ''}`}>
              {/* 功能按钮（语音/上传/思考模式） */}
              <div className="relative">
                <button type="button" onClick={() => setShowFeatureBottom((v)=>!v)} className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 md:w-9 md:h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 border border-neutral-200 dark:border-neutral-700 touch-target touch-feedback" aria-label="功能">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" fill="currentColor"/></svg>
                </button>
                {showFeatureBottom && (
                  <motion.div ref={bottomMenuRef} initial={{ opacity: 0, y: isMobile ? 12 : 6, scale: isMobile ? 1 : 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: isMobile ? 12 : 6, scale: isMobile ? 1 : 0.98 }} transition={{ type: 'spring', stiffness: 320, damping: 24 }} className="absolute bottom-11 left-0 z-20 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg w-48 p-2 space-y-1 mobile-modal">
                    <button onMouseDown={startVoiceInput} onMouseUp={stopVoiceInput} onTouchStart={startVoiceInput} onTouchEnd={stopVoiceInput} className={`w-full text-left text-sm rounded-lg px-3 py-3 md:py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 touch-feedback group transition-all duration-200 flex items-center gap-3 menu-item-enhanced ${recording ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : ''}`}>
                      <span className="text-lg group-hover:scale-110 transition-transform duration-200 icon-hover">{recording ? '🎤' : '🎙️'}</span>
                      <span>{recording ? '松开停止' : '按住说话'}</span>
                    </button>
                    <button onClick={() => bottomFileRef.current?.click()} className="w-full text-left text-sm rounded-lg px-3 py-3 md:py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 touch-feedback group transition-all duration-200 flex items-center gap-3 menu-item-enhanced">
                      <span className="text-lg group-hover:scale-110 transition-transform duration-200 icon-hover">📎</span>
                      <span>上传图片/文件</span>
                    </button>
                    <label className="flex items-center gap-3 w-full text-left text-sm rounded-lg px-3 py-3 md:py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer touch-feedback group transition-all duration-200 menu-item-enhanced">
                      <input type="checkbox" checked={thinkMode} onChange={(e)=>setThinkMode(e.target.checked)} className="rounded w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2" />
                      <span className="text-lg group-hover:scale-110 transition-transform duration-200 icon-hover">🧠</span>
                      <span className="text-neutral-700 dark:text-neutral-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        启用思考模式
                      </span>
                    </label>
                    <label className="flex items-center gap-3 w-full text-left text-sm rounded-lg px-3 py-3 md:py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer touch-feedback group transition-all duration-200 menu-item-enhanced">
                      <input 
                        type="checkbox" 
                        checked={webEnabled} 
                        onChange={(e) => {
                          setWebEnabled(e.target.checked);
                          if (e.target.checked) {
                            setShowWebToast(true);
                            setTimeout(() => setShowWebToast(false), 2000);
                          }
                        }} 
                        className="rounded w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2" 
                      />
                      <span className="text-lg group-hover:scale-110 transition-transform duration-200 icon-hover">🌐</span>
                      <span className={`text-neutral-700 dark:text-neutral-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${webEnabled ? 'text-green-600 dark:text-green-400' : ''}`}>
                        启用联网搜索
                      </span>
                      {webEnabled && (
                        <span className="text-xs text-green-600 ml-auto animate-pulse">✓</span>
                      )}
                    </label>
                  </motion.div>
                )}
              </div>
              <textarea
                ref={bottomInputRef}
                className="flex-1 bg-transparent px-3 sm:px-5 py-3 sm:py-4 text-sm md:text-base focus:outline-none resize-none min-h-[44px] sm:min-h-[48px] max-h-32 overflow-y-auto placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                placeholder={loading ? 
                  (siteLang === 'zh' ? "正在处理中..." : 
                   siteLang === 'en' ? "Processing..." :
                   siteLang === 'ja' ? "処理中..." :
                   siteLang === 'ko' ? "처리 중..." : "正在处理中...") :
                  (siteLang === 'zh' ? "输入你的问题，按回车发送，Shift+回车换行" : 
                   siteLang === 'en' ? "Enter your question, press Enter to send, Shift+Enter to wrap line" :
                   siteLang === 'ja' ? "質問を入力してください、Enterで送信、Shift+Enterで改行" :
                   siteLang === 'ko' ? "질문을 입력하세요, Enter로 전송, Shift+Enter로 줄바꿈" : "输入你的问题，按回车发送，Shift+回车换行")
                }
                value={input}
                onChange={useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  setInput(e.target.value);
                  // 使用 requestAnimationFrame 优化高度调整
                  requestAnimationFrame(() => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                  });
                }, [])}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!loading && input.trim()) {
                      const fakeEvent = { preventDefault: () => {} } as unknown as React.FormEvent;
                      sendMessage(fakeEvent).catch(error => {
      console.error("❌ Error in sendMessage:", error);
      setToast('发送消息失败');
    });
                    }
                  } else if (e.key === 'Escape') {
                    // ESC键清空输入
                    setInput('');
                  }
                }}
                onFocus={() => {
                  // 聚焦时不自动滚动，让用户控制
                }}
                disabled={loading}
                rows={1}
              />
              {/* 隐藏的文件输入供功能菜单触发 */}
              <input ref={bottomFileRef} type="file" accept="image/*,.txt,.md,.json,.csv,.log" multiple className="hidden" onChange={async (e)=>{ const fs = Array.from(e.target.files||[]); const images:string[]=[]; const texts:Array<{name:string;content:string}>=[]; for(const f of fs){ if(f.type.startsWith('image/')){ const url = await new Promise<string>((r)=>{ const fr=new FileReader(); fr.onload=()=>r(String(fr.result||'')); fr.readAsDataURL(f); }); images.push(url);} else { const t=await f.text(); texts.push({name:f.name, content:t}); } } setPending((prev)=>({ images:[...prev.images,...images], files:[...prev.files,...texts] })); e.currentTarget.value=''; }} />
              {/* 图像生成按钮 */}
              <button
                onClick={() => setShowImageGenInput(!showImageGenInput)}
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                title="生成图像"
                disabled={loading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {/* 移动端：不再单独展示联网/上传，统一在功能按钮中 */}
              <button
                type="button"
                aria-label={loading && abortRef.current ? "停止生成" : "发送"}
                onClick={onPrimaryClick}
                onTouchStart={onSendButtonTouchStart}
                onTouchEnd={onSendButtonTouchEnd}
                className={`rounded-full ${loading ? 'bg-gradient-to-r from-red-600 to-red-700' : 'bg-gradient-to-r from-blue-600 to-blue-700'} text-white text-sm w-10 h-10 sm:w-12 sm:h-12 md:w-10 md:h-10 flex items-center justify-center disabled:opacity-60 relative glow send-ripple touch-target transition-all duration-300 group ${input.trim() ? 'bounce-in' : ''}`}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {loading && abortRef.current ? (
                    <motion.span key="stop" className="icon-morph" initial={{ opacity: 0, rotate: -90, scale: 0.6 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: 90, scale: 0.6 }} transition={{ duration: 0.18 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 6h12v12H6z" fill="currentColor"/></svg>
                    </motion.span>
                  ) : (
                    <motion.span key="send" className="icon-morph" initial={{ opacity: 0, rotate: 90, scale: 0.6 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: -90, scale: 0.6 }} transition={{ duration: 0.18 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 12L20 4l-8 16-1.6-6.4L4 12Z" fill="currentColor"/></svg>
                    </motion.span>
                  )}
                </AnimatePresence>
                {loading && abortRef.current && <span className="progress-ring" />}
              </button>
            </div>
          <div className="mt-2 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center gap-3">
              {lastUsage && (
                <span className="text-neutral-400 dark:text-neutral-500 text-xs">
                  {lastUsage.total_tokens} tokens
                </span>
              )}
            </div>
            <div className="flex-1 text-center text-neutral-400 dark:text-neutral-500 text-xs">
              {siteLang === 'zh' ? 'AI 生成内容可能不准确，请核对关键信息' : 
               siteLang === 'en' ? 'AI generated content may be inaccurate, please verify key information' :
               siteLang === 'ja' ? 'AI生成コンテンツは不正確な場合があります。重要な情報を確認してください' :
               siteLang === 'ko' ? 'AI 생성 콘텐츠는 부정확할 수 있으니 중요한 정보를 확인해주세요' : 'AI 生成内容可能不准确，请核对关键信息'}
            </div>
          </div>
          </div>
        </motion.form>
      )}
      </AnimatePresence>
      {/* 回到最新 */}
      {showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          className="fixed right-4 md:right-6 bottom-20 md:bottom-16 z-20 rounded-full bg-blue-600 text-white w-11 h-11 md:w-10 md:h-10 flex items-center justify-center shadow-lg hover:shadow-xl transition-all touch-target"
          aria-label="回到最新"
          title="回到最新"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4v12m0 0l-4-4m4 4 4-4M4 20h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}
      {showScrollToTop && (
        <button
          onClick={() => { const el = listRef.current; if (el) el.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="fixed right-4 md:right-6 bottom-36 md:bottom-32 z-20 rounded-full bg-neutral-800 text-white w-11 h-11 md:w-10 md:h-10 flex items-center justify-center shadow-lg hover:shadow-xl transition-all touch-target"
          aria-label="回到顶部"
          title="回到顶部"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 20V8m0 0 4 4m-4-4-4 4M4 4h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}
      {toast && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-30 bg-black/80 text-white text-xs md:text-sm px-3 py-1.5 rounded-full mobile-spacing bounce-in">{toast}</div>
      )}
      {showWebToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 bg-green-600/90 text-white text-sm px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm bounce-in">
          🌐 联网搜索已启用，下次对话将包含实时信息
        </div>
      )}
      {/* 通用弹窗：帮助 */}
      <AnimatePresence>
        {showHelp && (
          <div className="fixed inset-0 z-50">
            <motion.div className="absolute inset-0 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowHelp(false)} />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-md rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">提示与快捷键</div>
                <button onClick={() => setShowHelp(false)} className="text-neutral-500 hover:text-neutral-800">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                </button>
              </div>
              <div className="mt-3 text-sm text-neutral-600 dark:text-neutral-300 space-y-2">
                <p>Esc 或 Cmd/Ctrl+. 可停止生成。</p>
                <p>Cmd/Ctrl+K 聚焦输入框。</p>
                <p>可上传图片与文本文件，或开启联网检索。</p>
              </div>
              <div className="mt-4 text-right">
                <button onClick={() => setShowHelp(false)} className="text-xs rounded-full border px-3 py-1">知道了</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </div>
    </div>
  );
}
