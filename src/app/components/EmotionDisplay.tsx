"use client";

import React, { useState, useEffect } from 'react';
import { analyzeEmotion, analyzeAIEmotion, getEmotionAnimationClass, getEmotionColor, EmotionResult } from '@/lib/emotion-analyzer';

interface EmotionDisplayProps {
  text: string;
  type: 'user' | 'assistant';
  showAnimation?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function EmotionDisplay({ 
  text, 
  type, 
  showAnimation = true, 
  size = 'medium',
  className = '' 
}: EmotionDisplayProps) {
  const [emotion, setEmotion] = useState<EmotionResult | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!text) return;
    
    const analyzedEmotion = type === 'user' ? analyzeEmotion(text) : analyzeAIEmotion(text);
    setEmotion(analyzedEmotion);
    
    if (showAnimation) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [text, type, showAnimation]);

  if (!emotion) return null;

  const sizeClasses = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-4xl'
  };

  const animationClass = showAnimation && isAnimating ? 'animate-bounce' : '';
  const emotionClass = getEmotionAnimationClass(emotion.emotion, emotion.intensity);
  const color = getEmotionColor(emotion.emotion);

  return (
    <div className={`emotion-display ${className}`}>
      <div 
        className={`
          ${sizeClasses[size]} 
          ${animationClass} 
          ${emotionClass}
          transition-all duration-300 ease-in-out
          hover:scale-110 cursor-pointer
        `}
        style={{ 
          color,
          filter: `drop-shadow(0 0 8px ${color}40)`,
          textShadow: `0 0 10px ${color}60`
        }}
        title={`情绪: ${emotion.emotion} (强度: ${Math.round(emotion.intensity * 100)}%)`}
      >
        {emotion.emoji}
      </div>
      
      {/* 情绪强度指示器 */}
      {emotion.intensity > 0.5 && (
        <div className="emotion-intensity-indicator mt-1">
          <div 
            className="h-1 rounded-full transition-all duration-500"
            style={{ 
              width: `${emotion.intensity * 100}%`,
              backgroundColor: color,
              boxShadow: `0 0 4px ${color}80`
            }}
          />
        </div>
      )}
    </div>
  );
}

// 情绪历史组件 - 显示最近的情绪变化
interface EmotionHistoryProps {
  emotions: EmotionResult[];
  maxItems?: number;
}

export function EmotionHistory({ emotions, maxItems = 5 }: EmotionHistoryProps) {
  const recentEmotions = emotions.slice(-maxItems);

  return (
    <div className="emotion-history flex gap-2 items-center">
      {recentEmotions.map((emotion, index) => (
        <div
          key={index}
          className="emotion-item text-lg opacity-70 hover:opacity-100 transition-opacity duration-200"
          style={{ color: getEmotionColor(emotion.emotion) }}
          title={`${emotion.emotion} (${Math.round(emotion.intensity * 100)}%)`}
        >
          {emotion.emoji}
        </div>
      ))}
    </div>
  );
}

// 情绪统计组件
interface EmotionStatsProps {
  emotions: EmotionResult[];
}

export function EmotionStats({ emotions }: EmotionStatsProps) {
  const emotionCounts = emotions.reduce((acc, emotion) => {
    acc[emotion.emotion] = (acc[emotion.emotion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalEmotions = emotions.length;
  const mostCommonEmotion = Object.entries(emotionCounts).reduce(
    (max, [emotion, count]) => count > max.count ? { emotion, count } : max,
    { emotion: 'neutral', count: 0 }
  );

  return (
    <div className="emotion-stats bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        情绪统计
      </h4>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">总情绪数</span>
          <span className="font-medium">{totalEmotions}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">最常见情绪</span>
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {emotions.find(e => e.emotion === mostCommonEmotion.emotion)?.emoji || '😐'}
            </span>
            <span className="font-medium capitalize">{mostCommonEmotion.emotion}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
