"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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

export default function Step5Page() {
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
  const [greeting, setGreeting] = useState("我们先从哪里开始呢?");
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
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [showShare, setShowShare] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [exportFormat, setExportFormat] = useState("txt");
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [keyboardShortcuts] = useState([
    { key: "Ctrl+Enter", action: "发送消息" },
    { key: "Ctrl+N", action: "新建对话" },
    { key: "Ctrl+S", action: "保存对话" },
    { key: "Ctrl+E", action: "导出对话" },
    { key: "Ctrl+I", action: "导入对话" },
    { key: "Ctrl+?", action: "显示快捷键" },
    { key: "Ctrl+Shift+A", action: "全选消息" },
    { key: "Ctrl+Shift+D", action: "删除选中消息" },
    { key: "Ctrl+Shift+C", action: "复制选中消息" },
    { key: "Ctrl+Shift+R", action: "重试最后消息" }
  ]);
  
  const listRef = useRef<HTMLDivElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const heroFileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 建议问题
  const suggestionSets = useMemo(() => [
    ["帮我写一份简历", "解释一下量子计算", "推荐几本好书", "如何学习编程"],
    ["翻译这段文字", "总结这篇文章", "写一首诗", "制定学习计划"],
    ["解释这个概念", "分析这个数据", "推荐实用工具", "解决这个问题"]
  ], []);

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
  }, [suggestionSets]);

  // 初始化建议问题
  useEffect(() => {
    setSuggestions(suggestionSets[0]);
  }, [suggestionSets]);

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

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'Enter':
            e.preventDefault();
            if (input.trim() && !loading) {
              // 触发发送消息
              const form = document.querySelector('form');
              if (form) {
                form.requestSubmit();
              }
            }
            break;
          case 'n':
            e.preventDefault();
            // 新建对话
            setConversationId(null);
            setMessages([]);
            setShowHero(true);
            setRetryCount(0);
            break;
          case 's':
            e.preventDefault();
            // 保存对话功能
            break;
          case 'e':
            e.preventDefault();
            setShowExport(true);
            break;
          case 'i':
            e.preventDefault();
            setShowImport(true);
            break;
          case '?':
            e.preventDefault();
            setShowKeyboardShortcuts(true);
            break;
        }
      }
      
      if (e.ctrlKey && e.shiftKey) {
        switch (e.key) {
          case 'A':
            e.preventDefault();
            setSelectedMessages(new Set(messages.map(m => m.id)));
            break;
          case 'D':
            e.preventDefault();
            // 删除选中消息
            selectedMessages.forEach(id => {
              setMessages(prev => prev.filter(m => m.id !== id));
            });
            setSelectedMessages(new Set());
            break;
          case 'C':
            e.preventDefault();
            // 复制选中消息
            const selectedText = messages
              .filter(m => selectedMessages.has(m.id))
              .map(m => `${m.role}: ${m.content}`)
              .join('\n\n');
            if (typeof window !== "undefined") {
              navigator.clipboard.writeText(selectedText);
            }
            break;
          case 'R':
            e.preventDefault();
            // 重试最后一条消息
            if (retryCount < maxRetries) {
              const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
              if (lastUserMessage) {
                setInput(lastUserMessage.content);
                setRetryCount(prev => prev + 1);
              }
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [input, loading, messages, selectedMessages, retryCount, maxRetries]);

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

  // 导出对话
  const exportConversation = useCallback(() => {
    const content = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${Date.now()}.${exportFormat}`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  }, [messages, exportFormat]);

  // 导入对话
  const importConversation = useCallback(async () => {
    if (!importFile) return;
    
    try {
      const text = await importFile.text();
      const lines = text.split('\n\n');
      const importedMessages: UiMessage[] = lines.map((line, index) => {
        const [role, ...contentParts] = line.split(': ');
        return {
          id: `imported_${index}`,
          role: role as "user" | "assistant",
          content: contentParts.join(': '),
          createdAt: new Date().toISOString()
        };
      });
      
      setMessages(importedMessages);
      setShowImport(false);
      setImportFile(null);
      setToast("对话导入成功");
      setTimeout(() => setToast(""), 2000);
    } catch (error) {
      console.error("Import failed:", error);
      setToast("导入失败");
      setTimeout(() => setToast(""), 2000);
    }
  }, [importFile]);

  // 提交反馈
  const submitFeedback = useCallback(async () => {
    if (!feedbackMessage.trim() || feedbackRating === 0) return;
    
    try {
      await fetch("/api/chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: feedbackMessage,
          rating: feedbackRating,
          conversationId: conversationId
        }),
      });
      
      setShowFeedback(false);
      setFeedbackMessage("");
      setFeedbackRating(0);
      setToast("反馈提交成功");
      setTimeout(() => setToast(""), 2000);
    } catch (error) {
      console.error("Feedback failed:", error);
      setToast("反馈提交失败");
      setTimeout(() => setToast(""), 2000);
    }
  }, [feedbackMessage, feedbackRating, conversationId]);

  // 分享对话
  const shareConversation = useCallback(async () => {
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages,
          title: `分享的对话 - ${new Date().toLocaleDateString()}`
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setShareUrl(`${window.location.origin}/conversations/${data.id}`);
        setShowShare(true);
      }
    } catch (error) {
      console.error("Share failed:", error);
      setToast("分享失败");
      setTimeout(() => setToast(""), 2000);
    }
  }, [messages]);
  
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
            <div className="flex gap-2">
                  <button 
                onClick={newConversation}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                  </button>
                  <button 
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                  </button>
                </div>
          </div>
          
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
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
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="text-center max-w-2xl mb-8">
              <h1 className="text-4xl font-bold mb-4">{greeting}</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                我是你的AI助手，随时为你提供帮助。如果有任何问题或需求，请随时告诉我！
              </p>
            </div>

            {/* 建议问题 */}
            <div className="w-full max-w-4xl mb-8">
              <h2 className="text-lg font-semibold mb-4 text-center">建议问题</h2>
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
                      className="p-4 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {suggestion}
              </motion.button>
                  ))}
                </AnimatePresence>
          </div>
        </div>

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
                    className={`max-w-[80%] p-4 rounded-lg relative group ${
                      message.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    } ${selectedMessages.has(message.id) ? 'ring-2 ring-blue-500' : ''}`}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setShowMessageActions(message.id);
                    }}
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
                    
                    {/* 消息操作按钮 */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <button
                          onClick={() => copyMessage(message.content)}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          📋
                        </button>
                        <button
                          onClick={() => deleteMessage(message.id)}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          🗑️
                        </button>
                          </div>
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
        <button
              type="button"
              onMouseDown={startVoiceInput}
              onMouseUp={stopVoiceInput}
              onTouchStart={startVoiceInput}
              onTouchEnd={stopVoiceInput}
              className={`p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${recording ? 'bg-red-100 dark:bg-red-900' : ''}`}
            >
              🎤
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

      {/* 图片生成输入 */}
      <AnimatePresence>
        {showImageGenInput && (
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-2 right-2 sm:left-4 sm:right-4 z-30 mx-auto max-w-4xl px-2 sm:px-4"
          >
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg flex items-center gap-2 p-2">
              <div className="flex items-center gap-2 px-2">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  图像生成
                </span>
              </div>
              <input
                type="text"
                value={imageGenPrompt}
                onChange={(e) => setImageGenPrompt(e.target.value)}
                placeholder="描述你想要生成的图像..."
                className="flex-1 bg-transparent px-2 sm:px-3 py-2 text-sm md:text-base focus:outline-none resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
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
                className="rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm w-10 h-10 disabled:opacity-50 disabled:cursor-not-allowed relative flex items-center justify-center"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.button>
              <motion.button
                onClick={() => setShowImageGenInput(false)}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                className="rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm w-10 h-10 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.button>
              </div>
            </motion.div>
        )}
      </AnimatePresence>

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
