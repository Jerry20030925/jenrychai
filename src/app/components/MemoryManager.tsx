"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Memory {
  id: string;
  title: string;
  content: string;
  category: string;
  importance: number;
  similarity?: number;
  tags: string[];
  createdAt: string;
  lastAccessed?: string;
}

interface MemoryManagerProps {
  userId: string;
  onMemorySelect?: (memory: Memory) => void;
  className?: string;
}

export default function MemoryManager({ userId, onMemorySelect, className = '' }: MemoryManagerProps) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMemory, setNewMemory] = useState({
    title: '',
    content: '',
    category: 'general',
    importance: 5,
    tags: [] as string[],
  });

  const categories = [
    { value: 'all', label: '全部', emoji: '📚' },
    { value: 'preference', label: '偏好', emoji: '❤️' },
    { value: 'goal', label: '目标', emoji: '🎯' },
    { value: 'personal', label: '个人信息', emoji: '👤' },
    { value: 'skill', label: '技能', emoji: '💪' },
    { value: 'event', label: '事件', emoji: '📅' },
    { value: 'general', label: '一般', emoji: '📝' },
  ];

  // 搜索记忆
  const searchMemories = async (query: string) => {
    if (!query.trim()) {
      setMemories([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/memories?q=${encodeURIComponent(query)}&limit=10`);
      const data = await response.json();
      setMemories(data.memories || []);
    } catch (error) {
      console.error('Error searching memories:', error);
    } finally {
      setLoading(false);
    }
  };

  // 创建新记忆
  const createMemory = async () => {
    if (!newMemory.title || !newMemory.content) return;

    try {
      const response = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMemory),
      });

      if (response.ok) {
        setNewMemory({ title: '', content: '', category: 'general', importance: 5, tags: [] });
        setShowCreateForm(false);
        // 重新搜索以显示新记忆
        searchMemories(searchQuery);
      }
    } catch (error) {
      console.error('Error creating memory:', error);
    }
  };

  // 删除记忆
  const deleteMemory = async (memoryId: string) => {
    try {
      const response = await fetch(`/api/memories/${memoryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMemories(memories.filter(m => m.id !== memoryId));
      }
    } catch (error) {
      console.error('Error deleting memory:', error);
    }
  };

  // 获取重要性颜色
  const getImportanceColor = (importance: number) => {
    if (importance >= 8) return 'text-red-500';
    if (importance >= 6) return 'text-orange-500';
    if (importance >= 4) return 'text-yellow-500';
    return 'text-gray-500';
  };

  // 获取分类图标
  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.emoji || '📝';
  };

  const filteredMemories = memories.filter(memory => 
    selectedCategory === 'all' || memory.category === selectedCategory
  );

  return (
    <div className={`memory-manager ${className}`}>
      {/* 搜索栏 */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchMemories(e.target.value);
            }}
            placeholder="搜索记忆..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute right-3 top-2.5">
            {loading ? (
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* 分类筛选 */}
      <div className="mb-4 flex flex-wrap gap-2">
        {categories.map(category => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selectedCategory === category.value
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="mr-1">{category.emoji}</span>
            {category.label}
          </button>
        ))}
      </div>

      {/* 创建记忆按钮 */}
      <div className="mb-4">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          + 添加新记忆
        </button>
      </div>

      {/* 创建记忆表单 */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-4 bg-gray-50 rounded-lg"
          >
            <h3 className="text-lg font-semibold mb-3">创建新记忆</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="记忆标题"
                value={newMemory.title}
                onChange={(e) => setNewMemory({ ...newMemory, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <textarea
                placeholder="记忆内容"
                value={newMemory.content}
                onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg h-20"
              />
              <div className="flex gap-3">
                <select
                  value={newMemory.category}
                  onChange={(e) => setNewMemory({ ...newMemory, category: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {categories.slice(1).map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.emoji} {cat.label}
                    </option>
                  ))}
                </select>
                <select
                  value={newMemory.importance}
                  onChange={(e) => setNewMemory({ ...newMemory, importance: parseInt(e.target.value) })}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value={1}>1 - 低重要性</option>
                  <option value={3}>3 - 较低</option>
                  <option value={5}>5 - 中等</option>
                  <option value={7}>7 - 较高</option>
                  <option value={9}>9 - 高重要性</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={createMemory}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  创建
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  取消
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 记忆列表 */}
      <div className="space-y-3">
        {filteredMemories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? '没有找到相关记忆' : '开始搜索您的记忆'}
          </div>
        ) : (
          filteredMemories.map((memory) => (
            <motion.div
              key={memory.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getCategoryIcon(memory.category)}</span>
                  <h4 className="font-semibold text-gray-800">{memory.title}</h4>
                  <span className={`text-sm ${getImportanceColor(memory.importance)}`}>
                    ⭐ {memory.importance}
                  </span>
                </div>
                <div className="flex gap-2">
                  {onMemorySelect && (
                    <button
                      onClick={() => onMemorySelect(memory)}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                    >
                      使用
                    </button>
                  )}
                  <button
                    onClick={() => deleteMemory(memory.id)}
                    className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200"
                  >
                    删除
                  </button>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-2">{memory.content}</p>
              
              {memory.similarity && (
                <div className="text-xs text-gray-500 mb-2">
                  相似度: {Math.round(memory.similarity * 100)}%
                </div>
              )}
              
              <div className="flex flex-wrap gap-1">
                {memory.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="text-xs text-gray-400 mt-2">
                {new Date(memory.createdAt).toLocaleDateString()}
                {memory.lastAccessed && (
                  <span> • 最后访问: {new Date(memory.lastAccessed).toLocaleDateString()}</span>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
