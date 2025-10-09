'use client';

import { useState } from 'react';
import FaviconIcon from './FaviconIcon';

interface ReferenceSource {
  url: string;
  title: string;
}

interface ReferenceSourcesProps {
  sources: ReferenceSource[];
  className?: string;
}

export default function ReferenceSources({ sources, className = '' }: ReferenceSourcesProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedSource, setSelectedSource] = useState<ReferenceSource | null>(null);

  if (!sources || sources.length === 0) {
    return null;
  }

  const handleSourceClick = (source: ReferenceSource) => {
    setSelectedSource(source);
    setShowModal(true);
  };

  const handleOpenLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    setShowModal(false);
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    // 可以添加一个toast提示
  };

  return (
    <>
      <div className={`flex flex-wrap gap-2 items-center ${className}`}>
        <span className="text-sm text-gray-600 mr-2">参考来源:</span>
        {sources.map((source, index) => (
          <FaviconIcon
            key={index}
            url={source.url}
            title={source.title}
            size="sm"
            onClick={() => handleSourceClick(source)}
            className="hover:scale-110 transition-transform"
          />
        ))}
      </div>

      {/* 模态框 */}
      {showModal && selectedSource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <FaviconIcon
                  url={selectedSource.url}
                  title={selectedSource.title}
                  size="md"
                  className="mr-3"
                />
                <div>
                  <h3 className="font-medium text-gray-900">参考来源</h3>
                  <p className="text-sm text-gray-500">{selectedSource.title}</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">链接地址</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={selectedSource.url}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                />
                <button
                  onClick={() => handleCopyLink(selectedSource.url)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm transition-colors"
                  title="复制链接"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => handleOpenLink(selectedSource.url)}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                打开链接
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

