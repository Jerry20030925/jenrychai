"use client";

import { useState, useRef, useEffect, useMemo, useCallback, memo } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import ConversationHistory from "./components/ConversationHistory";
import ReferenceSources from "./components/ReferenceSources";
import { useLanguage } from "./contexts/LanguageContext";

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: {
    images?: string[];
    files?: Array<{ name: string; content: string }>;
  };
  references?: Array<{ url: string; title: string }>;
};

// 解析消息内容中的参考来源
const parseReferences = (content: string): { cleanContent: string; references: Array<{ url: string; title: string }> } => {
  // 匹配 <ref-data> 标签中的JSON数据
  const refDataMatch = content.match(/<ref-data>([\s\S]*?)<\/ref-data>/);
  if (!refDataMatch) {
    return { cleanContent: content, references: [] };
  }

  try {
    const refData = JSON.parse(refDataMatch[1]);
    let references = [];
    
    // 处理两种格式：直接数组格式和包装格式
    if (Array.isArray(refData)) {
      references = refData;
    } else if (refData.type === 'references' && Array.isArray(refData.data)) {
      references = refData.data;
    }
    
    const processedReferences = references.map((item: any) => ({
      url: item.url || '',
      title: item.title || ''
    })).filter((ref: any) => ref.url && ref.title);
    
    // 移除 <ref-data> 标签，保留其他内容
    const cleanContent = content.replace(/<ref-data>[\s\S]*?<\/ref-data>/, '').trim();
    
    return { cleanContent, references: processedReferences };
  } catch (error) {
    console.error('解析参考来源失败:', error);
  }

  return { cleanContent: content, references: [] };
};

// 优化的消息组件
const MessageComponent = memo(({ message, messageActions, onMessageAction, loading }: {
  message: UiMessage;
  messageActions: { [key: string]: { liked: boolean; disliked: boolean; copied: boolean } };
  onMessageAction: (messageId: string, action: 'like' | 'dislike' | 'copy' | 'share' | 'regenerate') => void;
  loading: boolean;
}) => {
  const { cleanContent, references } = useMemo(() => parseReferences(message.content), [message.content]);
  
  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
        message.role === 'user' 
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-lg'
      }`}>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {cleanContent}
          </ReactMarkdown>
        </div>
        
        {/* 参考来源图标 */}
        {message.role === "assistant" && references.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <ReferenceSources 
              sources={references}
              className="justify-start"
            />
          </div>
        )}
        
        {/* 附件显示 */}
        {message.attachments?.images && message.attachments.images.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.attachments.images.map((img, index) => (
              <motion.div
                key={index}
                className="relative cursor-pointer"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => window.open(img, '_blank')}
              >
                <img
                  src={img}
                  alt={`上传图片 ${index + 1}`}
                  className="max-w-xs max-h-48 object-contain rounded-lg border-2 border-gray-200 dark:border-gray-600"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    console.error('Image load error:', e);
                    const target = e.target as HTMLImageElement;
                    if (target) {
                      target.style.display = 'none';
                    }
                  }}
                  onLoad={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.opacity = '1';
                  }}
                  style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
                />
              </motion.div>
            ))}
          </div>
        )}
        
        {/* 文件附件显示 */}
        {message.attachments?.files && message.attachments.files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.attachments.files.map((file, index) => (
              <motion.div
                key={index}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-xs flex items-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                <span className="truncate max-w-32">{file.name}</span>
              </motion.div>
            ))}
          </div>
        )}
        
        {/* 消息操作按钮 */}
        {message.role === 'assistant' && (
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <motion.button
              className={`p-2 rounded-lg transition-colors ${
                messageActions[message.id]?.liked 
                  ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="点赞"
              onClick={() => onMessageAction(message.id, 'like')}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.834a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
            </motion.button>
            
            <motion.button
              className={`p-2 rounded-lg transition-colors ${
                messageActions[message.id]?.disliked 
                  ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="点踩"
              onClick={() => onMessageAction(message.id, 'dislike')}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.834a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
              </svg>
            </motion.button>
            
            <motion.button
              className={`p-2 rounded-lg transition-colors ${
                messageActions[message.id]?.copied 
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="复制"
              onClick={() => onMessageAction(message.id, 'copy')}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
            </motion.button>
            
            <motion.button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="分享"
              onClick={() => onMessageAction(message.id, 'share')}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3 3 0 000-2.18l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
            </motion.button>
            
            <motion.button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="重新生成"
              onClick={() => onMessageAction(message.id, 'regenerate')}
              disabled={loading}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </motion.button>
            
            <motion.button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="更多选项"
              onClick={() => {
                console.log('更多选项:', message.id);
              }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
});

export default function HomePage() {
  const { data: session } = useSession();
  const { language, setLanguage } = useLanguage();
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [deepThinking, setDeepThinking] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [showDeepThinkingFeedback, setShowDeepThinkingFeedback] = useState(false);
  const [showWebSearchFeedback, setShowWebSearchFeedback] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<{
    images: string[];
    files: Array<{ name: string; content: string }>;
  }>({ images: [], files: [] });
  const [messageActions, setMessageActions] = useState<{[key: string]: {
    liked: boolean;
    disliked: boolean;
    copied: boolean;
  }}>({});
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // 请求去重和缓存
  const requestCache = useRef<Map<string, Promise<any>>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  // 监听历史记录显示事件
  useEffect(() => {
    const handleToggleHistory = () => setShowHistory(prev => !prev);
    const handleNewConversationEvent = () => {
      setMessages([]);
      setCurrentConversationId(undefined);
      setShowHistory(false);
      console.log('🆕 新建对话');
    };
    const handleShowSettings = () => setShowSettings(true);

    window.addEventListener('app:toggle-history', handleToggleHistory);
    window.addEventListener('app:new-conversation', handleNewConversationEvent);
    window.addEventListener('app:show-settings', handleShowSettings);

    return () => {
      window.removeEventListener('app:toggle-history', handleToggleHistory);
      window.removeEventListener('app:new-conversation', handleNewConversationEvent);
      window.removeEventListener('app:show-settings', handleShowSettings);
    };
  }, []);

  // 清理内存和取消请求
  useEffect(() => {
    return () => {
      // 清理请求缓存
      requestCache.current.clear();
      
      // 取消正在进行的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // 从数据库获取最新的用户信息
  const [currentUserName, setCurrentUserName] = useState<string>("");

  useEffect(() => {
    // 如果已登录，从API获取最新的用户信息
    if (session?.user?.email) {
      fetch('/api/account')
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          if (data.name) {
            setCurrentUserName(data.name);
          }
        })
        .catch(err => {
          console.error('获取用户信息失败:', err);
          // 失败时回退到session中的名字
          setCurrentUserName(session?.user?.name || "");
        });
    } else {
      setCurrentUserName("");
    }
  }, [session?.user?.email]); // 移除 session?.user?.name 依赖，避免不必要的重新获取

  // 根据时间生成问候语 - 使用useMemo优化
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const userName = currentUserName || session?.user?.name || "";

    let timeGreeting = "";
    if (hour >= 5 && hour < 12) {
      timeGreeting = "早上好";
    } else if (hour >= 12 && hour < 14) {
      timeGreeting = "中午好";
    } else if (hour >= 14 && hour < 18) {
      timeGreeting = "下午好";
    } else if (hour >= 18 && hour < 22) {
      timeGreeting = "晚上好";
    } else {
      timeGreeting = "夜深了";
    }

    return userName ? `${timeGreeting}，${userName}！` : `${timeGreeting}！`;
  }, [currentUserName, session?.user?.name]);

  // 处理文件上传
  const handleFileUpload = async (file: File, type: 'image' | 'file') => {
    // 检查文件大小
    const maxSize = type === 'image' ? 10 * 1024 * 1024 : 5 * 1024 * 1024; // 10MB for images, 5MB for files
    if (file.size > maxSize) {
      alert(`文件太大，请选择小于 ${maxSize / 1024 / 1024}MB 的文件`);
      return;
    }

    if (type === 'image') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setAttachments(prev => ({
          ...prev,
          images: [...prev.images, dataUrl]
        }));
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        // 限制文件内容长度
        const maxContentLength = 100000; // 100KB
        const truncatedContent = content.length > maxContentLength 
          ? content.substring(0, maxContentLength) + '\n\n[文件内容过长，已截断]'
          : content;
        
        setAttachments(prev => ({
          ...prev,
          files: [...prev.files, { name: file.name, content: truncatedContent }]
        }));
      };
      reader.readAsText(file);
    }
  };

  // 移除附件
  const removeAttachment = (type: 'image' | 'file', index: number) => {
    if (type === 'image') {
      setAttachments(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    } else {
      setAttachments(prev => ({
        ...prev,
        files: prev.files.filter((_, i) => i !== index)
      }));
    }
  };

  // 处理新建对话
  const handleNewConversation = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(undefined);
    setShowHistory(false);
    console.log('🆕 新建对话');
  }, []);

  // 处理选择对话
  const handleSelectConversation = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setCurrentConversationId(conversationId);
        setShowHistory(false);
        console.log('📖 加载对话:', conversationId);
      } else {
        throw new Error(`Failed to load conversation: ${response.status}`);
      }
    } catch (error) {
      console.error('加载对话失败:', error);
    }
  }, []);

  // 处理消息操作
  const handleMessageAction = useCallback((messageId: string, action: 'like' | 'dislike' | 'copy' | 'share' | 'regenerate') => {
    if (action === 'like') {
      setMessageActions(prev => ({
        ...prev,
        [messageId]: {
          ...prev[messageId],
          liked: !prev[messageId]?.liked,
          disliked: false // 取消点踩
        }
      }));
      console.log('👍 点赞消息:', messageId);
      setShowSuccessMessage('👍 已点赞');
      setTimeout(() => setShowSuccessMessage(null), 2000);
    } else if (action === 'dislike') {
      setMessageActions(prev => ({
        ...prev,
        [messageId]: {
          ...prev[messageId],
          disliked: !prev[messageId]?.disliked,
          liked: false // 取消点赞
        }
      }));
      console.log('👎 点踩消息:', messageId);
      setShowSuccessMessage('👎 已点踩');
      setTimeout(() => setShowSuccessMessage(null), 2000);
    } else if (action === 'copy') {
      // 复制消息内容
      const message = messages.find(m => m.id === messageId);
      if (message) {
        navigator.clipboard.writeText(message.content);
        console.log('📋 复制消息:', messageId);
        setShowSuccessMessage('📋 已复制到剪贴板');
        setTimeout(() => setShowSuccessMessage(null), 2000);
      }
    } else if (action === 'share') {
      // 分享消息
      if (navigator.share) {
        const message = messages.find(m => m.id === messageId);
        if (message) {
          navigator.share({
            title: 'AI回答',
            text: message.content,
            url: window.location.href
          });
        }
      } else {
        navigator.clipboard.writeText(window.location.href);
        console.log('🔗 分享链接已复制到剪贴板');
        setShowSuccessMessage('🔗 分享链接已复制');
        setTimeout(() => setShowSuccessMessage(null), 2000);
      }
    } else if (action === 'regenerate') {
        // 重新生成回答 - 只有用户点击时才执行
        if (!loading) {
          console.log('🔄 重新生成消息:', messageId);
          setShowSuccessMessage('🔄 正在重新生成...');
          // 这里可以添加重新生成的逻辑
          // 例如：重新发送最后一条用户消息
          const lastUserMessage = messages.filter(m => m.role === 'user').pop();
          if (lastUserMessage) {
            // 重新发送消息 - 创建一个模拟的form事件
            const mockEvent = {
              preventDefault: () => {},
              currentTarget: { checkValidity: () => true }
            } as unknown as React.FormEvent;
            handleSubmit(mockEvent);
          }
        }
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    // 允许没有文本但有附件的情况
    if ((!input.trim() && attachments.images.length === 0 && attachments.files.length === 0) || loading) return;
    
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // 创建新的AbortController
    abortControllerRef.current = new AbortController();

    const userMessage: UiMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim() || "请分析这个文件/图片",
      attachments: attachments.images.length > 0 || attachments.files.length > 0 ? attachments : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setAttachments({ images: [], files: [] });
    setLoading(true);

    // 显示相应的加载状态（不设置超时，等待流结束时清除）
    if (deepThinking) {
      setShowDeepThinkingFeedback(true);
    }
    if (webSearch) {
      setShowWebSearchFeedback(true);
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
            attachments: m.attachments
          })),
          stream: true, // 使用流式响应提高响应速度
          web: webSearch,
          enableWebSearch: webSearch,
          model: deepThinking ? "deepseek-reasoner" : "deepseek-chat",
          attachments: userMessage.attachments,
          conversationId: currentConversationId // 发送当前对话ID
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `请求失败: ${response.status} ${response.statusText}`);
      }

      // 从响应头获取conversationId
      const newConversationId = response.headers.get('X-Conversation-Id');
      if (newConversationId && !currentConversationId) {
        setCurrentConversationId(newConversationId);
        console.log('📝 Set conversation ID:', newConversationId);
      }

      // 处理流式响应
      const assistantId = `assistant_${Date.now()}`;
      setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";
      let lastUpdateTime = 0;
      const UPDATE_INTERVAL = 16; // 16ms更新一次UI (约60fps)

      if (reader) {
        try {
          let chunkCount = 0;
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              // 流结束，清除加载状态
              console.log(`✅ Stream completed - 接收到 ${chunkCount} 个chunk, 总计 ${fullContent.length} 字符`);
              setLoading(false);
              setShowDeepThinkingFeedback(false);
              setShowWebSearchFeedback(false);
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            chunkCount++;
            fullContent += chunk;
            buffer += chunk;

            // 优化UI更新策略：更频繁的更新以提高响应速度
            const now = Date.now();
            if (now - lastUpdateTime > UPDATE_INTERVAL || 
                buffer.length > 10 ||  // 减少缓冲区大小
                /[。！？\n]/.test(chunk)) {  // 遇到标点符号立即更新
              
              // 解析参考来源
              const { cleanContent, references } = parseReferences(fullContent);
              
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { 
                  ...m, 
                  content: fullContent,
                  references: references.length > 0 ? references : undefined
                } : m
              ));
              buffer = "";
              lastUpdateTime = now;
            }

            // 每50个chunk记录一次（减少日志频率）
            if (chunkCount % 50 === 0) {
              console.log(`📥 已接收 ${chunkCount} chunks, ${fullContent.length} 字符`);
            }
          }

          // 确保最后的内容被显示
          if (buffer || fullContent) {
            // 解析最终内容的参考来源
            const { cleanContent, references } = parseReferences(fullContent);
            
            setMessages(prev => prev.map(m =>
              m.id === assistantId ? { 
                ...m, 
                content: fullContent,
                references: references.length > 0 ? references : undefined
              } : m
            ));
            console.log(`✅ 最终内容已显示，总计 ${fullContent.length} 字符`);
          }
        } catch (streamError) {
          console.error("Stream reading error:", streamError);
          // 如果流式读取失败，尝试非流式响应
          const fallbackResponse = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [...messages, userMessage].map(m => ({
                role: m.role,
                content: m.content
              })),
              stream: false,
              web: webSearch,
              enableWebSearch: webSearch,
              model: deepThinking ? "deepseek-reasoner" : "deepseek-chat"
            })
          });
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            setMessages(prev => prev.map(m => 
              m.id === assistantId ? { ...m, content: fallbackData.reply?.content || "抱歉，没有收到回复" } : m
            ));
          } else {
            const errorData = await fallbackResponse.json().catch(() => ({}));
            throw new Error(errorData.error || "流式和非流式响应都失败了");
          }
        }
      } else {
        throw new Error("无法读取响应流");
      }
            } catch (error) {
              // 如果是请求被取消，不显示错误
              if (error instanceof Error && error.name === 'AbortError') {
                console.log('请求被取消');
                return;
              }
              
              console.error("Error:", error);
              const errorMsg = error instanceof Error ? error.message : "未知错误";
              setErrorMessage(`请求失败：${errorMsg}`);
              
              const errorMessage: UiMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: `抱歉，发生了错误：${errorMsg}。请检查网络连接或稍后重试。`
              };
              setMessages(prev => [...prev, errorMessage]);
            } finally {
      setLoading(false);
      setShowDeepThinkingFeedback(false);
      setShowWebSearchFeedback(false);
    }
  }, [input, attachments, loading, deepThinking, webSearch, messages, currentConversationId]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Messages Area - 独立滚动区域 */}
      {messages.length > 0 && (
        <div className="flex-1 overflow-y-auto px-4 py-4 mt-20" style={{ scrollbarGutter: 'stable' }}>
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <MessageComponent
                  message={message}
                  messageActions={messageActions}
                  onMessageAction={handleMessageAction}
                  loading={loading}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="px-4 py-4"
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-start">
              <div className={`${
                showDeepThinkingFeedback
                  ? 'bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-700'
                  : showWebSearchFeedback
                  ? 'bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border-green-200 dark:border-green-700'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              } border p-4 rounded-lg shadow-sm`}>
                <div className="flex items-center space-x-3">
                  {showDeepThinkingFeedback ? (
                    // 深度思考特殊动画
                    <div className="flex space-x-1">
                      <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse"></div>
                      <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse" style={{animationDelay: "0.2s"}}></div>
                      <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse" style={{animationDelay: "0.4s"}}></div>
                      <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse" style={{animationDelay: "0.6s"}}></div>
                    </div>
                  ) : showWebSearchFeedback ? (
                    // 联网搜索动画
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: "0.1s"}}></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></div>
                    </div>
                  ) : (
                    // 普通思考动画
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: "0.1s"}}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></div>
                    </div>
                  )}
                  {/* 移除文字，只保留动画 */}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

              {/* 错误提示 */}
              {errorMessage && (
                <div className="px-4 py-2">
                  <div className="max-w-4xl mx-auto">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                      <span className="block sm:inline">{errorMessage}</span>
                      <button
                        className="absolute top-0 bottom-0 right-0 px-4 py-3"
                        onClick={() => setErrorMessage(null)}
                      >
                        <span className="sr-only">关闭</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 成功提示 */}
              {showSuccessMessage && (
                <motion.div 
                  className="fixed top-20 right-4 z-50"
                  initial={{ opacity: 0, y: -50, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -50, scale: 0.8 }}
                  transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                >
                  <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5, repeat: 1 }}
                    >
                      {showSuccessMessage}
                    </motion.span>
                  </div>
                </motion.div>
              )}

              {/* 中央输入区域 - 没有消息时居中，有消息时在底部 */}
              <div className={`flex-shrink-0 p-4 ${messages.length === 0 ? 'flex flex-col items-center justify-center min-h-screen' : ''}`}>
                <div className="max-w-4xl mx-auto w-full">
                  {/* 欢迎信息 - 只在没有消息时显示并居中 */}
                  {messages.length === 0 && (
                    <div className="text-center mb-8">
                      <motion.div
                        className="mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-500 via-yellow-500 to-green-500 bg-clip-text text-transparent">
                          {greeting}
                        </h1>
                      </motion.div>
                    </div>
                  )}

                  {/* Function Buttons */}
                  <div className="flex justify-center gap-3 mb-6">
            <motion.button
              onClick={() => setDeepThinking(!deepThinking)}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                deepThinking
                  ? "bg-purple-500 text-white shadow-lg shadow-purple-500/50"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border dark:border-gray-700 hover:border-purple-500 hover:text-purple-500"
              }`}
            >
              <motion.svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                animate={deepThinking ? { rotate: 360 } : {}}
                transition={{ duration: 2, repeat: deepThinking ? Infinity : 0, ease: "linear" }}
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="7.5 4.21 12 6.81 16.5 4.21"/>
                <polyline points="7.5 19.79 7.5 14.6 3 12"/>
                <polyline points="21 12 16.5 14.6 16.5 19.79"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </motion.svg>
              深度思考
              {deepThinking && (
                <motion.span
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-xs"
                >
                  ✓
                </motion.span>
              )}
            </motion.button>

            <motion.button
              onClick={() => setWebSearch(!webSearch)}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                webSearch
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/50"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border dark:border-gray-700 hover:border-blue-500 hover:text-blue-500"
              }`}
            >
              <motion.svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                animate={webSearch ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 1, repeat: webSearch ? Infinity : 0 }}
              >
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </motion.svg>
              联网搜索
              {webSearch && (
                <motion.span
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-xs"
                >
                  ✓
                </motion.span>
              )}
            </motion.button>
          </div>

          {/* 附件预览 */}
          {(attachments.images.length > 0 || attachments.files.length > 0) && (
            <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="flex flex-wrap gap-2">
                {attachments.images.map((img, index) => (
                  <div key={`img-${index}`} className="relative">
                    <img
                      src={img}
                      alt={`上传图片 ${index + 1}`}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeAttachment('image', index)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {attachments.files.map((file, index) => (
                  <div key={`file-${index}`} className="relative">
                    <div className="px-3 py-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-sm">
                      📄 {file.name}
                    </div>
                    <button
                      onClick={() => removeAttachment('file', index)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

                  {/* Input Form */}
                  <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto">
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2">
              {/* 文件上传按钮 */}
              <motion.button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                whileTap={{ scale: 0.95 }}
                className="p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                title="上传文件"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
              </motion.button>

              {/* 图片上传按钮 */}
              <motion.button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                whileTap={{ scale: 0.95 }}
                className="p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                title="上传图片"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21,15 16,10 5,21"/>
                </svg>
              </motion.button>

                      {/* 输入框 */}
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="输入你的问题..."
                        className="flex-1 p-4 pr-12 border-0 rounded-lg focus:ring-0 focus:outline-none dark:bg-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        disabled={loading}
                      />

              {/* 发送按钮 */}
              <button
                type="submit"
                disabled={loading || (!input.trim() && attachments.images.length === 0 && attachments.files.length === 0)}
                className="p-3 text-blue-500 hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>

            {/* 隐藏的文件输入 */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.pdf,.doc,.docx,.csv,.json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, 'file');
              }}
              className="hidden"
            />
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, 'image');
              }}
              className="hidden"
            />
          </form>
        </div>
      </div>

      {/* 对话历史组件 */}
      <ConversationHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onNewConversation={handleNewConversation}
        onSelectConversation={handleSelectConversation}
        currentConversationId={currentConversationId}
      />

      {/* 设置模态框 */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowSettings(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">设置</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {/* 通用设置 */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6m5.196-14.196l-4.243 4.243m0 5.657l-4.243 4.243m14.196-5.196l-6 0m-6 0l-6 0m14.196 5.196l-4.243-4.243m0-5.657l-4.243-4.243"/>
                  </svg>
                  通用设置
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">自动保存对话</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">自动保存您的对话记录</p>
                    </div>
                    <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" defaultChecked />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">流式响应</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">实时显示AI回复内容</p>
                    </div>
                    <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" defaultChecked />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">声音效果</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">启用消息提示音</p>
                    </div>
                    <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" />
                  </label>
                </div>
              </div>

              {/* 语言设置 */}
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                  语言设置
                </h3>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'zh' | 'en')}
                  className="w-full px-4 py-2 border border-purple-300 dark:border-purple-700 rounded-lg bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="zh">简体中文</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">关于</h3>
                <p className="text-sm text-green-700 dark:text-green-300">Jenrych AI - 您的智能AI助手</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">版本 1.0.0</p>
              </div>

              {/* 隐私政策 */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  隐私政策
                </h3>
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <p className="font-medium">我们尊重并保护您的隐私：</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>您的对话数据仅用于提供服务</li>
                    <li>我们采用加密技术保护您的信息</li>
                    <li>不会向第三方出售或分享您的个人数据</li>
                    <li>您可以随时删除您的对话记录</li>
                    <li>我们遵守相关数据保护法规</li>
                  </ul>
                </div>
              </div>

              {/* 服务条款 */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                  </svg>
                  服务条款
                </h3>
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <p className="font-medium">使用本服务即表示您同意：</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>遵守当地法律法规使用本服务</li>
                    <li>不利用服务进行违法或有害活动</li>
                    <li>AI生成的内容仅供参考</li>
                    <li>服务可能会不定期更新和维护</li>
                    <li>我们保留修改服务条款的权利</li>
                  </ul>
                </div>
              </div>

              {/* 联系我们 */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  联系我们
                </h3>
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <p className="text-xs">如有任何问题或建议，欢迎联系我们：</p>
                  <div className="space-y-1 text-xs">
                    <p>📧 邮箱: support@jenrych.ai</p>
                    <p>🌐 网站: www.jenrych.ai</p>
                    <p>💬 反馈: 您可以通过设置中的反馈功能向我们提出建议</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowSettings(false)}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium"
              >
                关闭
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}