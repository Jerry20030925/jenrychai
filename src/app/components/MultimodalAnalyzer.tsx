"use client";

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnalysisResult } from '@/lib/multimodal-analyzer';

interface MultimodalAnalyzerProps {
  onAnalysisComplete?: (result: AnalysisResult) => void;
  className?: string;
}

export default function MultimodalAnalyzer({ 
  onAnalysisComplete, 
  className = '' 
}: MultimodalAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // 文件拖拽处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await analyzeFile(files[0]);
    }
  }, []);

  // 文件选择处理
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await analyzeFile(files[0]);
    }
  }, []);

  // URL分析
  const handleUrlAnalysis = useCallback(async () => {
    const url = urlInputRef.current?.value.trim();
    if (!url) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('url', url);
      formData.append('type', 'webpage');

      const response = await fetch('/api/analyze-multimodal', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setAnalysisResult(data.result);
        onAnalysisComplete?.(data.result);
      } else {
        setError(data.error || '分析失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  }, [onAnalysisComplete]);

  // 文本分析
  const handleTextAnalysis = useCallback(async () => {
    const text = textInputRef.current?.value.trim();
    if (!text) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('type', 'text');

      const response = await fetch('/api/analyze-multimodal', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setAnalysisResult(data.result);
        onAnalysisComplete?.(data.result);
      } else {
        setError(data.error || '分析失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  }, [onAnalysisComplete]);

  // 文件分析
  const analyzeFile = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // 根据文件类型确定分析类型
      let type = 'text';
      if (file.type.startsWith('image/')) {
        type = 'image';
      } else if (file.type.startsWith('video/')) {
        type = 'video';
      } else if (file.type === 'application/pdf') {
        type = 'pdf';
      } else if (file.type.startsWith('audio/')) {
        type = 'audio';
      }
      
      formData.append('type', type);

      const response = await fetch('/api/analyze-multimodal', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setAnalysisResult(data.result);
        onAnalysisComplete?.(data.result);
      } else {
        setError(data.error || '分析失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  }, [onAnalysisComplete]);

  // 获取文件类型图标
  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return '🖼️';
      case 'video': return '🎥';
      case 'pdf': return '📄';
      case 'audio': return '🎵';
      case 'webpage': return '🌐';
      case 'text': return '📝';
      default: return '📁';
    }
  };

  return (
    <div className={`multimodal-analyzer ${className}`}>
      {/* 拖拽区域 */}
      <motion.div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragOver 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="space-y-4">
          <div className="text-4xl">📁</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              拖拽文件到此处分析
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              支持图片、视频、PDF、音频、文本文件
            </p>
          </div>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            选择文件
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.pdf,audio/*,.txt,.md,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </motion.div>

      {/* URL输入 */}
      <div className="mt-4 space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          网页链接分析
        </label>
        <div className="flex gap-2">
          <input
            ref={urlInputRef}
            type="url"
            placeholder="输入网页链接..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <button
            onClick={handleUrlAnalysis}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            {isAnalyzing ? '分析中...' : '分析'}
          </button>
        </div>
      </div>

      {/* 文本输入 */}
      <div className="mt-4 space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          文本内容分析
        </label>
        <div className="space-y-2">
          <textarea
            ref={textInputRef}
            placeholder="输入要分析的文本内容..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <button
            onClick={handleTextAnalysis}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
          >
            {isAnalyzing ? '分析中...' : '分析文本'}
          </button>
        </div>
      </div>

      {/* 加载状态 */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-blue-700 dark:text-blue-300">AI正在分析中...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 错误显示 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <span className="text-red-500">❌</span>
              <span className="text-red-700 dark:text-red-300">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 分析结果 */}
      <AnimatePresence>
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4 p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
          >
            <div className="space-y-4">
              {/* 标题和类型 */}
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getFileTypeIcon(analysisResult.type)}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {analysisResult.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {analysisResult.type.toUpperCase()} • {new Date(analysisResult.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* 摘要 */}
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">📋 摘要</h4>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {analysisResult.summary}
                </p>
              </div>

              {/* 关键点 */}
              {analysisResult.keyPoints.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">🎯 关键点</h4>
                  <ul className="space-y-1">
                    {analysisResult.keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 洞察 */}
              {analysisResult.insights.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">💡 洞察</h4>
                  <ul className="space-y-1">
                    {analysisResult.insights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                        <span className="text-green-500 mt-1">💡</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 视觉元素 */}
              {analysisResult.visualElements && (
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">🎨 视觉元素</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysisResult.visualElements.colors && analysisResult.visualElements.colors.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">颜色</p>
                        <div className="flex flex-wrap gap-1">
                          {analysisResult.visualElements.colors.map((color, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                              {color}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {analysisResult.visualElements.objects && analysisResult.visualElements.objects.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">对象</p>
                        <div className="flex flex-wrap gap-1">
                          {analysisResult.visualElements.objects.map((object, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                              {object}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 元数据 */}
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">📊 信息</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {analysisResult.metadata.duration && (
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">时长</p>
                      <p className="font-medium">{Math.round(analysisResult.metadata.duration)}秒</p>
                    </div>
                  )}
                  {analysisResult.metadata.pages && (
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">页数</p>
                      <p className="font-medium">{analysisResult.metadata.pages}页</p>
                    </div>
                  )}
                  {analysisResult.metadata.size && (
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">大小</p>
                      <p className="font-medium">{(analysisResult.metadata.size / 1024).toFixed(1)}KB</p>
                    </div>
                  )}
                  {analysisResult.metadata.url && (
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">链接</p>
                      <a 
                        href={analysisResult.metadata.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-blue-500 hover:text-blue-600 truncate block"
                      >
                        {analysisResult.metadata.url}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
