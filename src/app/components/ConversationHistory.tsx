"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface ConversationHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  currentConversationId?: string;
}

export default function ConversationHistory({
  isOpen,
  onClose,
  onNewConversation,
  onSelectConversation,
  currentConversationId
}: ConversationHistoryProps) {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // 获取对话历史 - 直接从数据库获取，不显示加载动画
  const fetchConversations = async () => {
    if (!session?.user?.email) return;

    try {
      const response = await fetch('/api/conversations', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
        console.log('✅ 已加载对话记录:', data.conversations?.length || 0, '条');
      } else {
        console.error('❌ 获取对话历史失败:', response.status);
      }
    } catch (error) {
      console.error('❌ 获取对话历史失败:', error);
    }
  };

  // 预加载：组件挂载时就获取一次
  useEffect(() => {
    if (session?.user?.email) {
      fetchConversations();
    }
  }, [session?.user?.email]);

  // 打开时刷新
  useEffect(() => {
    if (isOpen && session?.user?.email) {
      fetchConversations();
    }
  }, [isOpen]);

  // 搜索对话
  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 格式化时间 - 更详细的时间显示
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    // 1分钟内
    if (diffInSeconds < 60) {
      return '刚刚';
    }
    
    // 1小时内
    if (diffInMinutes < 60) {
      return `${diffInMinutes}分钟前`;
    }
    
    // 24小时内
    if (diffInHours < 24) {
      return `${diffInHours}小时前`;
    }
    
    // 昨天
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return '昨天';
    }
    
    // 7天内
    if (diffInDays < 7) {
      return `${diffInDays}天前`;
    }
    
    // 今年内显示月日
    if (date.getFullYear() === now.getFullYear()) {
      return `${date.getMonth() + 1}月${date.getDate()}号`;
    }
    
    // 更早的显示年月日
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}号`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: -400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -400, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="w-80 h-full bg-white dark:bg-gray-900 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full overflow-hidden">
            {/* 头部 */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  对话历史
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              
              {/* 新建对话按钮 */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onNewConversation}
                className="w-full flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 4v16M4 12h16"/>
                </svg>
                新建对话
              </motion.button>
            </div>

            {/* 搜索框 */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="搜索对话..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 对话列表 - 独立滚动区域 */}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <p className="mt-2 text-sm">暂无对话历史</p>
                </div>
              ) : (
                <div className="p-2">
                  {filteredConversations.map((conversation) => (
                    <motion.div
                      key={conversation.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onSelectConversation(conversation.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        currentConversationId === conversation.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {conversation.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(conversation.updatedAt)}
                          </span>
                          {currentConversationId === conversation.id && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
