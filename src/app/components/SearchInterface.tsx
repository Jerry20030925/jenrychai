"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchResult } from '@/lib/semantic-search';
import AnimatedButton, { PulseButton, BounceButton } from './ButtonAnimations';

interface SearchInterfaceProps {
  onSearch?: (query: string) => void;
  onResultClick?: (result: SearchResult) => void;
  className?: string;
}

export default function SearchInterface({ 
  onSearch, 
  onResultClick, 
  className = '' 
}: SearchInterfaceProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [conversationResults, setConversationResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // 搜索建议数据
  const searchSuggestions = [
    "ChatGPT 最新功能",
    "AI 写作助手",
    "机器学习教程",
    "Python 编程",
    "React 开发",
    "Next.js 框架",
    "TypeScript 学习",
    "Web 开发最佳实践",
    "数据库设计",
    "API 开发指南"
  ];

  // 搜索历史（从localStorage加载）
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.trim()) {
      // 过滤建议
      const filtered = searchSuggestions
        .concat(searchHistory)
        .filter(suggestion => 
          suggestion.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 8);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  // 处理搜索
  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSuggestions([]);
    
    // 添加到搜索历史
    const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));

    try {
      // 并行搜索网络内容和对话历史
      const [webResponse, conversationResponse] = await Promise.allSettled([
        fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`),
        fetch(`/api/search-conversations?query=${encodeURIComponent(searchQuery)}&limit=5`)
      ]);

      // 处理网络搜索结果
      if (webResponse.status === 'fulfilled' && webResponse.value.ok) {
        const webResults = await webResponse.value.json();
        setSearchResults(webResults);
      }

      // 处理对话历史搜索结果
      if (conversationResponse.status === 'fulfilled' && conversationResponse.value.ok) {
        const conversationData = await conversationResponse.value.json();
        setConversationResults(conversationData.conversations || []);
      }

      onSearch?.(searchQuery);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setSuggestions([]);
      setIsFocused(false);
    }
  };

  // 处理建议点击
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  // 清除搜索
  const clearSearch = () => {
    setQuery('');
    setSearchResults([]);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  // 处理外部点击
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative w-full max-w-2xl mx-auto ${className}`}>
      {/* 搜索框 */}
      <div className="relative">
        <div className="flex items-center bg-white dark:bg-gray-800 rounded-full border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-blue-500 dark:focus-within:border-blue-400 transition-colors duration-200 shadow-sm min-h-[52px] sm:min-h-[56px]">
          {/* 搜索图标 */}
          <div className="pl-4 pr-2">
            <svg 
              className="w-5 h-5 text-gray-400 dark:text-gray-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          </div>

          {/* 输入框 */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            onFocus={() => setIsFocused(true)}
            placeholder="搜索任何内容..."
            className="flex-1 py-3 px-2 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none text-base sm:text-base"
          />

          {/* 清除按钮 */}
          {query && (
            <button
              onClick={clearSearch}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* 搜索按钮 */}
          <AnimatedButton
            onClick={() => handleSearch()}
            disabled={!query.trim() || isSearching}
            variant="ghost"
            size="sm"
            className="mr-2 p-2 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
            title="搜索 (Enter)"
          >
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </AnimatedButton>
        </div>

        {/* 搜索建议 */}
        <AnimatePresence>
          {suggestions.length > 0 && isFocused && (
            <motion.div
              ref={suggestionsRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50 max-h-80 overflow-y-auto"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="truncate">{suggestion}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 搜索结果 */}
      <AnimatePresence>
        {(searchResults.length > 0 || conversationResults.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-6 space-y-4"
          >
            <div className="text-sm text-gray-600 dark:text-gray-400">
              找到 {searchResults.length + conversationResults.length} 个结果
            </div>

            {/* 对话历史结果 */}
            {conversationResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  对话历史
                </h3>
                {conversationResults.map((conv, index) => (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                    onClick={() => window.location.href = conv.url}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {conv.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {conv.content}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                          <span>{conv.messageCount} 条消息</span>
                          <span>•</span>
                          <span>{new Date(conv.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* 网络搜索结果 */}
            {searchResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  网络搜索
                </h3>
            
            {searchResults.map((result, index) => {
              // 获取网站图标
              const getSiteIcon = (url: string) => {
                try {
                  const domain = new URL(url).hostname.replace('www.', '').toLowerCase();
                  if (domain.includes('zhihu')) return '📝';
                  if (domain.includes('baidu')) return '🔍';
                  if (domain.includes('google')) return '🌐';
                  if (domain.includes('bing')) return '🔍';
                  if (domain.includes('github')) return '💻';
                  if (domain.includes('stackoverflow')) return '❓';
                  if (domain.includes('wikipedia')) return '📚';
                  if (domain.includes('youtube')) return '📺';
                  if (domain.includes('twitter') || domain.includes('x.com')) return '🐦';
                  if (domain.includes('linkedin')) return '💼';
                  if (domain.includes('reddit')) return '🔴';
                  if (domain.includes('medium')) return '📰';
                  if (domain.includes('dev.to')) return '👨‍💻';
                  if (domain.includes('smodin')) return '📊';
                  if (domain.includes('undetectable')) return '🛡️';
                  if (domain.includes('aithor')) return '🤖';
                  return '🔗';
                } catch {
                  return '🔗';
                }
              };

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                  onClick={() => onResultClick?.(result)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 group-hover:scale-110 transition-transform duration-200">
                      <span className="text-2xl">{getSiteIcon(result.url)}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {result.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {result.snippet}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                        <span className="truncate font-mono">{result.url}</span>
                        <span>•</span>
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                          {result.source}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </div>
                </motion.div>
              );
            })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
