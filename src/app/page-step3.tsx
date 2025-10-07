"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};

type PendingAttachment = {
  images: string[];
  files: Array<{ name: string; content: string }>;
};

export default function Step3Page() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [siteLang, setSiteLang] = useState("zh");
  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pending, setPending] = useState<PendingAttachment>({ images: [], files: [] });
  const [showHero, setShowHero] = useState(true);
  const [conversations, setConversations] = useState<Array<{id: string; title: string}>>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState("");
  const [thinkMode, setThinkMode] = useState(false);
  const [webEnabled, setWebEnabled] = useState(false);
  const [imageEditPrompt, setImageEditPrompt] = useState("");
  const [imageGenPrompt, setImageGenPrompt] = useState("");
  const [showImageGenInput, setShowImageGenInput] = useState(false);
  
  const listRef = useRef<HTMLDivElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const heroFileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 客户端检查
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
      const onResize = () => setIsMobile(window.innerWidth < 768);
      onResize();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
  }, []);

  // 语言切换
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedLang = localStorage.getItem("siteLang") || "zh";
        setSiteLang(storedLang);
      } catch (error) {
        console.error("Failed to load language:", error);
      }
    }
  }, []);

  // 加载对话历史
  const loadConversations = useCallback(async () => {
    try {
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
        
        if (list.length > 0) {
          setSidebarOpen(true);
        }
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
      setConversations([]);
    }
  }, []);

  // 选择对话
  const selectConversation = useCallback(async (id: string) => {
    try {
      if (!id || typeof id !== 'string') {
        return;
      }
      
      setConversationId(id);
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
      console.error("Failed to load messages:", error);
      setMessages([]);
    }
  }, []);

  // 新建对话
  const newConversation = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setShowHero(true);
  }, []);

  // 发送消息
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: UiMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setShowHero(false);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "你是一个有用的AI助手。" },
            ...messages,
            userMsg
          ].map(m => ({ role: m.role, content: m.content })),
          model: "deepseek-chat",
          stream: true,
          conversationId: conversationId,
          web: webEnabled,
          attachments: {
            ...pending,
            imageEditPrompt: imageEditPrompt.trim() || undefined
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const assistantId = `assistant_${Date.now()}`;
      setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "", createdAt: new Date().toISOString() }]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;

          setMessages(prev => prev.map(m => 
            m.id === assistantId ? { ...m, content: fullContent } : m
          ));
        }
      }

      // 清空附件
      setPending({ images: [], files: [] });
      setImageEditPrompt("");
      
      // 重新加载对话列表
      loadConversations();
    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => [...prev, { 
        id: `error_${Date.now()}`, 
        role: "assistant", 
        content: "抱歉，发生了错误。" 
      }]);
    } finally {
      setLoading(false);
    }
  };

  // 文件上传处理
  const addFilesFromList = useCallback(async (files: FileList | File[]) => {
    const images: string[] = [];
    const texts: Array<{ name: string; content: string }> = [];
    
    for (const file of Array.from(files)) {
      if (file.type.startsWith("image/")) {
        const url = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.readAsDataURL(file);
        });
        images.push(url);
      } else {
        const text = await file.text();
        texts.push({ name: file.name, content: text });
      }
    }
    
    setPending(prev => ({
      images: [...prev.images, ...images],
      files: [...prev.files, ...texts]
    }));
  }, []);

  // 移除待发送图片
  const removePendingImage = useCallback((index: number) => {
    setPending(prev => ({
      ...prev,
      images: Array.isArray(prev.images) ? prev.images.filter((_, i) => i !== index) : []
    }));
  }, []);

  // 移除待发送文件
  const removePendingFile = useCallback((index: number) => {
    setPending(prev => ({
      ...prev,
      files: Array.isArray(prev.files) ? prev.files.filter((_, i) => i !== index) : []
    }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* 侧边栏 */}
      <motion.div
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 0 }}
        className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">历史对话</h2>
            <button
              onClick={newConversation}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <div className="space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  conversationId === conv.id ? 'bg-blue-100 dark:bg-blue-900' : ''
                }`}
              >
                {conv.title}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部导航 */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Status: {status}</span>
            <select
              value={siteLang}
              onChange={(e) => {
                setSiteLang(e.target.value);
                if (typeof window !== "undefined") {
                  try {
                    localStorage.setItem("siteLang", e.target.value);
                  } catch (error) {
                    console.error("Failed to save language:", error);
                  }
                }
              }}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={webEnabled}
                onChange={(e) => setWebEnabled(e.target.checked)}
                className="rounded"
              />
              联网搜索
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={thinkMode}
                onChange={(e) => setThinkMode(e.target.checked)}
                className="rounded"
              />
              思考模式
            </label>
          </div>
        </div>

        {/* 欢迎界面 */}
        {showHero && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-2xl">
              <h1 className="text-4xl font-bold mb-4">欢迎使用AI助手</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                我是你的AI助手，随时为你提供帮助。如果有任何问题或需求，请随时告诉我！
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => heroInputRef.current?.focus()}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  开始对话
                </button>
                <button
                  onClick={() => setShowImageGenInput(true)}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  生成图片
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 聊天区域 */}
        {!showHero && (
          <div 
            ref={listRef} 
            className="flex-1 overflow-y-auto p-4 space-y-4"
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={async (e) => {
              e.preventDefault();
              setDragOver(false);
              await addFilesFromList(e.dataTransfer.files);
            }}
          >
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-lg ${
                      message.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <div className="font-semibold mb-1 text-sm">
                      {message.role === "user" ? "You" : "AI"}
                    </div>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]} 
                        rehypePlugins={[rehypeHighlight]}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* 附件预览区域 */}
        {(pending.images.length > 0 || pending.files.length > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              待发送附件
            </div>
            <div className="flex flex-wrap gap-3">
              {pending.images.map((src, i) => (
                <div key={`img-${i}`} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                  <img src={src} alt="preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePendingImage(i)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
              {pending.files.map((f, i) => (
                <div key={`file-${i}`} className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <div className="w-6 h-6 bg-gray-400 rounded text-white text-xs flex items-center justify-center">F</div>
                  <span className="text-sm">{f.name}</span>
                  <button
                    onClick={() => removePendingFile(i)}
                    className="text-red-500 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            
            {pending.images.length > 0 && (
              <div className="mt-3">
                <input
                  type="text"
                  value={imageEditPrompt}
                  onChange={(e) => setImageEditPrompt(e.target.value)}
                  placeholder="描述你希望如何修改这些图片..."
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            )}
          </motion.div>
        )}

        {/* 输入区域 */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <motion.form 
            onSubmit={sendMessage} 
            className="flex gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <input
              ref={heroInputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              disabled={loading}
            />
            <input
              ref={heroFileRef}
              type="file"
              accept="image/*,.txt,.md,.json,.csv,.log"
              multiple
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                await addFilesFromList(files);
                e.currentTarget.value = '';
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => heroFileRef.current?.click()}
              className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              📎
            </button>
            <motion.button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg disabled:opacity-50 hover:bg-blue-600"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {loading ? "Sending..." : "Send"}
            </motion.button>
          </motion.form>
        </div>
      </div>

      {/* Toast 提示 */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg"
        >
          {toast}
        </motion.div>
      )}
    </div>
  );
}
