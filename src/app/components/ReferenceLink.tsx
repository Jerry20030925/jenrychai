"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface ReferenceLinkProps {
  url: string;
  title?: string;
  index?: number;
  className?: string;
}

export default function ReferenceLink({ url, title, index, className = '' }: ReferenceLinkProps) {
  // 提取域名
  const getDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain;
    } catch {
      return '链接';
    }
  };

  // 获取网站图标
  const getSiteIcon = (url: string) => {
    const domain = getDomain(url).toLowerCase();
    
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
  };

  const handleClick = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.button
      onClick={handleClick}
      className={`
        inline-flex items-center gap-2 px-3 py-2 
        bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600
        text-gray-700 dark:text-gray-300 text-sm rounded-lg
        transition-all duration-200 border border-gray-200 dark:border-gray-600
        shadow-sm hover:shadow-md
        ${className}
      `}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      title={`点击访问: ${title || url}`}
    >
      <span className="text-lg">{getSiteIcon(url)}</span>
      <div className="flex flex-col items-start min-w-0">
        <span className="truncate max-w-32 sm:max-w-48 font-medium">
          {title || getDomain(url)}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-32 sm:max-w-48">
          {getDomain(url)}
        </span>
      </div>
      {index && (
        <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full font-medium">
          {index}
        </span>
      )}
    </motion.button>
  );
}

// 参考链接列表组件
interface ReferenceListProps {
  references: Array<{ url: string; title?: string }>;
  className?: string;
}

export function ReferenceList({ references, className = '' }: ReferenceListProps) {
  if (!references || references.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="w-full text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">参考来源：</div>
      {references.map((ref, index) => (
        <ReferenceLink
          key={index}
          url={ref.url}
          title={ref.title}
          index={index + 1}
        />
      ))}
    </div>
  );
}
