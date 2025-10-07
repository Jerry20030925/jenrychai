"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SearchInterface from '../components/SearchInterface';
import { SearchResult } from '@/lib/semantic-search';
import RainbowLogo from '../components/RainbowLogo';
import { useSession } from 'next-auth/react';

export default function SearchPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // 加载搜索历史
  useEffect(() => {
    if (session?.user?.email) {
      const savedHistory = localStorage.getItem(`searchHistory_${session.user.email}`);
      if (savedHistory) {
        setSearchHistory(JSON.parse(savedHistory));
      }
    }
  }, [session]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // 保存搜索历史
    if (session?.user?.email && query.trim()) {
      const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem(`searchHistory_${session.user.email}`, JSON.stringify(newHistory));
    }
  };

  const handleResultClick = (result: SearchResult) => {
    // 在新窗口中打开链接
    window.open(result.url, '_blank', 'noopener,noreferrer');
  };

  const clearSearchHistory = () => {
    if (session?.user?.email) {
      setSearchHistory([]);
      localStorage.removeItem(`searchHistory_${session.user.email}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部导航 - 手机端优化 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <RainbowLogo size="sm" showText={false} />
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 hidden sm:block">
                JenrychAI 搜索
              </h1>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 sm:hidden">
                搜索
              </h1>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <a 
                href="/" 
                className="text-blue-600 dark:text-blue-400 hover:underline text-xs sm:text-sm px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                返回聊天
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-24 sm:pb-8">
        {/* 搜索历史 - 仅登录用户显示 */}
        {session?.user && searchHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">搜索历史</h3>
                <button
                  onClick={clearSearchHistory}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  清除
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.slice(0, 8).map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(item)}
                    className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* 搜索框 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <SearchInterface
            onSearch={handleSearch}
            onResultClick={handleResultClick}
            className="w-full"
          />
        </motion.div>

        {/* 搜索统计 */}
        {searchQuery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 text-sm text-gray-600 dark:text-gray-400"
          >
            搜索 "{searchQuery}" 的结果
          </motion.div>
        )}

        {/* 快捷键提示 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
            <p>💡 快捷键提示</p>
            <div className="flex flex-wrap justify-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">Ctrl</kbd>
                <span>+</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">K</kbd>
                <span>打开搜索</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">Ctrl</kbd>
                <span>+</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">/</kbd>
                <span>聚焦输入框</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">Esc</kbd>
                <span>关闭侧边栏</span>
              </span>
            </div>
          </div>
        </motion.div>

        {/* 搜索建议 */}
        {!searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                🔍 智能搜索
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                使用AI驱动的语义搜索，找到最相关的内容和答案
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                💡 搜索建议
              </h3>
              <div className="space-y-2">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  • 输入具体问题获得精确答案
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  • 使用关键词快速定位内容
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  • 支持中英文混合搜索
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                🚀 实时结果
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                搜索结果实时更新，包含最新的网络信息和AI分析
              </p>
            </div>
          </motion.div>
        )}

        {/* 热门搜索 */}
        {!searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              热门搜索
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                "ChatGPT 使用技巧",
                "AI 编程助手",
                "机器学习入门",
                "React 最佳实践",
                "Python 数据分析",
                "Web 开发教程",
                "TypeScript 学习",
                "数据库设计"
              ].map((term, index) => (
                <button
                  key={index}
                  onClick={() => setSearchQuery(term)}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
