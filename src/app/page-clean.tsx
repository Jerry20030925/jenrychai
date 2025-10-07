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

export default function CleanPage() {
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
  const [recording, setRecording] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [currentSuggestionSet, setCurrentSuggestionSet] = useState(0);
  const [greeting, setGreeting] = useState("今天有什么可以帮到你?");
  const [showSettings, setShowSettings] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [messageCount, setMessageCount] = useState(0);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [showMessageActions, setShowMessageActions] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(3);
  
  const listRef = useRef<HTMLDivElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const heroFileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 建议问题
  const suggestionSets = [
    ["帮我写一份简历", "解释一下量子计算", "推荐几本好书", "如何学习编程"],
    ["翻译这段文字", "总结这篇文章", "写一首诗", "制定学习计划"],
    ["解释这个概念", "分析这个数据", "推荐实用工具", "解决这个问题"]
  ];

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

  // 建议问题轮换
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSuggestionSet(prev => {
        const next = (prev + 1) % suggestionSets.length;
        setSuggestions(suggestionSets[next]);
        return next;
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // 初始化建议问题
  useEffect(() => {
    setSuggestions(suggestionSets[0]);
  }, []);

  // 动态问候语
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
    
    if (typeof window !== "undefined") {
      setGreeting(computeGreeting());
      const timer = window.setInterval(() => setGreeting(computeGreeting()), 60 * 1000);
      return () => window.clearInterval(timer);
    }
  }, [session?.user?.name, siteLang]);

  // 自动滚动
  useEffect(() => {
    if (autoScroll && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  // 输入变化处理
  useEffect(() => {
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    if (input.trim()) {
      setIsTyping(true);
      const timeout = setTimeout(() => {
        setIsTyping(false);
      }, 1000);
      setTypingTimeout(timeout);
    } else {
      setIsTyping(false);
    }
    
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [input, typingTimeout]);

  // 活动时间更新
  useEffect(() => {
    const updateActivity = () => setLastActivity(new Date());
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keypress', updateActivity);
    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keypress', updateActivity);
    };
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
    setRetryCount(0);
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
    setMessageCount(prev => prev + 1);

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
      setRetryCount(0);
      
      // 重新加载对话列表
      loadConversations();
    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => [...prev, { 
        id: `error_${Date.now()}`, 
        role: "assistant", 
        content: "抱歉，发生了错误。" 
      }]);
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  // 重试最后一条消息
  const retryLastMessage = useCallback(async () => {
    if (messages.length === 0 || retryCount >= maxRetries) return;
    
    const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
    if (!lastUserMessage) return;
    
    setInput(lastUserMessage.content);
    setRetryCount(prev => prev + 1);
  }, [messages, retryCount, maxRetries]);

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

  // 语音输入
  const startVoiceInput = useCallback(() => {
    if (typeof window === "undefined") return;
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setToast("当前浏览器不支持语音输入");
      setTimeout(() => setToast(""), 1500);
      return;
    }

    const Recognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new Recognition();
    
    recognition.lang = siteLang === 'en' ? 'en-US' : 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setRecording(true);
      setToast("正在听取...");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setToast("语音识别完成");
      setTimeout(() => setToast(""), 1500);
    };

    recognition.onerror = () => {
      setRecording(false);
      setToast("语音识别失败");
      setTimeout(() => setToast(""), 1500);
    };

    recognition.onend = () => {
      setRecording(false);
    };

    recognition.start();
  }, [siteLang]);

  const stopVoiceInput = useCallback(() => {
    setRecording(false);
  }, []);

  // 图片生成
  const generateImage = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.imageUrl) {
        setPending(prev => ({
          ...prev,
          images: [...prev.images, data.imageUrl]
        }));
        setInput(`根据提示词"${prompt}"生成的图像已准备就绪，可以发送给AI进行分析或修改`);
        setToast("图片生成成功！");
        setTimeout(() => setToast(""), 2000);
      } else {
        setToast("图片生成失败");
        setTimeout(() => setToast(""), 2000);
      }
    } catch (error) {
      console.error("Error generating image:", error);
      setToast("图片生成失败");
      setTimeout(() => setToast(""), 2000);
    } finally {
      setLoading(false);
    }
  }, []);

  // 复制消息
  const copyMessage = useCallback(async (text: string) => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(text);
      setToast("已复制到剪贴板");
      setTimeout(() => setToast(""), 1500);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, []);

  // 删除消息
  const deleteMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
    setShowMessageActions(null);
  }, []);

  // 选择消息
  const toggleMessageSelection = useCallback((messageId: string) => {
    setSelectedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  }, []);

  return (
    <div className="min-h-screen bg-white flex">
      {/* 侧边栏 */}
      <motion.div
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 0 }}
        className="bg-white border-r border-gray-200 overflow-hidden"
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">历史对话</h2>
            <div className="flex gap-2">
              <button
                onClick={newConversation}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                title="新建对话"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                title="设置"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 00-1.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
          
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-gray-50 rounded-lg"
            >
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                    className="rounded"
                  />
                  自动滚动
                </label>
                <div className="text-xs text-gray-500">
                  消息数: {messageCount}
                </div>
                <div className="text-xs text-gray-500">
                  最后活动: {lastActivity ? lastActivity.toLocaleTimeString() : "无"}
                </div>
              </div>
            </motion.div>
          )}
          
          <div className="space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`w-full text-left p-2 rounded-lg hover:bg-gray-100 text-gray-700 ${
                  conversationId === conv.id ? 'bg-blue-50 text-blue-700' : ''
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
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DS</span>
              </div>
              <span className="text-lg font-semibold text-gray-800">DeepSeek</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Status: {status}</span>
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
              className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-600"
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        {/* 欢迎界面 */}
        {showHero && (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="text-center max-w-2xl mb-12">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-2xl">DS</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">{greeting}</h1>
            </div>

            {/* 建议问题 */}
            <div className="w-full max-w-4xl mb-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="wait">
                  {suggestions.map((suggestion, index) => (
                    <motion.button
                      key={`${currentSuggestionSet}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      onClick={() => {
                        setInput(suggestion);
                        heroInputRef.current?.focus();
                      }}
                      className="p-4 text-left bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-700"
                    >
                      {suggestion}
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* 输入区域 */}
            <div className="w-full max-w-4xl">
              <motion.form 
                onSubmit={sendMessage} 
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="relative">
                  <input
                    ref={heroInputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="给 DeepSeek 发送消息"
                    className="w-full p-4 pr-20 border border-gray-300 rounded-2xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => heroFileRef.current?.click()}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.64 16.2a2 2 0 01-2.83-2.83l8.49-8.49" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <motion.button
                      type="submit"
                      disabled={loading || !input.trim()}
                      className="p-2 bg-blue-500 text-white rounded-full disabled:opacity-50 hover:bg-blue-600"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </motion.button>
                  </div>
                </div>
                
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
              </motion.form>
              
              {/* 功能按钮 */}
              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={() => setThinkMode(!thinkMode)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    thinkMode 
                      ? 'bg-blue-50 border-blue-200 text-blue-700' 
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  深度思考
                </button>
                <button
                  onClick={() => setWebEnabled(!webEnabled)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    webEnabled 
                      ? 'bg-blue-50 border-blue-200 text-blue-700' 
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  联网搜索
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
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <div className="font-semibold mb-1 text-sm">
                      {message.role === "user" ? "You" : "AI"}
                    </div>
                    <div className="prose prose-sm max-w-none">
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
            
            {/* 重试按钮 */}
            {retryCount < maxRetries && (
              <div className="flex justify-center">
                <button
                  onClick={retryLastMessage}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  重试最后一条消息 ({retryCount}/{maxRetries})
                </button>
              </div>
            )}
          </div>
        )}

        {/* 附件预览区域 */}
        {(pending.images.length > 0 || pending.files.length > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 border-t border-gray-200 bg-white"
          >
            <div className="text-sm text-gray-600 mb-2">
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
                <div key={`file-${i}`} className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            )}
          </motion.div>
        )}

        {/* 输入区域 */}
        {!showHero && (
          <div className="p-4 border-t border-gray-200 bg-white">
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
                placeholder="给 DeepSeek 发送消息"
                className="flex-1 p-3 border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-400"
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
                className="p-3 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-600"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.64 16.2a2 2 0 01-2.83-2.83l8.49-8.49" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <motion.button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg disabled:opacity-50 hover:bg-blue-600"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {loading ? "发送中..." : "发送"}
              </motion.button>
            </motion.form>
          </div>
        )}
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
