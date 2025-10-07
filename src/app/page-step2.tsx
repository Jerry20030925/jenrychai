"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

export default function Step2Page() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Array<{id: string; role: string; content: string}>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [siteLang, setSiteLang] = useState("zh");
  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = {
      id: `user_${Date.now()}`,
      role: "user",
      content: input.trim(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

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
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const assistantId = `assistant_${Date.now()}`;
      setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "" }]);

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* 侧边栏 */}
      <motion.div
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 0 }}
        className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">历史对话</h2>
          <div className="space-y-2">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">对话 1</div>
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">对话 2</div>
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
          </div>
        </div>

        {/* 聊天区域 */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4">
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

        {/* 输入区域 */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <motion.form 
            onSubmit={sendMessage} 
            className="flex gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              disabled={loading}
            />
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
    </div>
  );
}
