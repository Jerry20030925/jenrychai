'use client';

import { useState, useEffect } from 'react';

interface FaviconIconProps {
  url: string;
  title: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

export default function FaviconIcon({ 
  url, 
  title, 
  size = 'md', 
  onClick,
  className = '' 
}: FaviconIconProps) {
  const [faviconUrl, setFaviconUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // 获取网站域名
  const getDomain = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };

  // 生成favicon URL
  const generateFaviconUrl = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      // 尝试多个favicon服务
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return '';
    }
  };

  // 备用favicon服务
  const fallbackFaviconUrls = (url: string): string[] => {
    try {
      const domain = new URL(url).hostname;
      return [
        `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
        `https://favicons.githubusercontent.com/${domain}`,
        `https://icons.duckduckgo.com/ip3/${domain}.ico`,
        `https://${domain}/favicon.ico`
      ];
    } catch {
      return [];
    }
  };

  // 尝试加载favicon
  useEffect(() => {
    const loadFavicon = async () => {
      setIsLoading(true);
      setHasError(false);

      const urls = fallbackFaviconUrls(url);
      
      for (const faviconUrl of urls) {
        try {
          const response = await fetch(faviconUrl, { 
            method: 'HEAD',
            mode: 'no-cors'
          });
          
          // 如果请求成功，设置favicon
          setFaviconUrl(faviconUrl);
          setIsLoading(false);
          return;
        } catch (error) {
          continue;
        }
      }
      
      // 如果所有URL都失败，使用默认图标
      setHasError(true);
      setIsLoading(false);
    };

    loadFavicon();
  }, [url]);

  // 尺寸映射
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  // 默认图标
  const DefaultIcon = () => (
    <div className={`${sizeClasses[size]} bg-gray-200 rounded flex items-center justify-center`}>
      <svg className="w-3/4 h-3/4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
      </svg>
    </div>
  );

  return (
    <div 
      className={`${sizeClasses[size]} relative group cursor-pointer ${className}`}
      onClick={onClick}
      title={`${title} - ${getDomain(url)}`}
    >
      {isLoading ? (
        <div className={`${sizeClasses[size]} bg-gray-100 rounded animate-pulse flex items-center justify-center`}>
          <div className="w-3/4 h-3/4 bg-gray-300 rounded"></div>
        </div>
      ) : hasError || !faviconUrl ? (
        <DefaultIcon />
      ) : (
        <img
          src={faviconUrl}
          alt={`${title} favicon`}
          className={`${sizeClasses[size]} rounded object-cover border border-gray-200 hover:border-blue-300 transition-colors`}
          onError={() => setHasError(true)}
        />
      )}
      
      {/* 悬停提示 */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
        {title}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
}

