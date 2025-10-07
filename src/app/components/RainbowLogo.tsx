"use client";

import React from 'react';

interface RainbowLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export default function RainbowLogo({ 
  size = 'md', 
  showText = true, 
  className = '' 
}: RainbowLogoProps) {
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { width: '24px', height: '24px', textSize: 'text-sm' };
      case 'md':
        return { width: '32px', height: '32px', textSize: 'text-base' };
      case 'lg':
        return { width: '48px', height: '48px', textSize: 'text-lg' };
      case 'xl':
        return { width: '64px', height: '64px', textSize: 'text-xl' };
      default:
        return { width: '32px', height: '32px', textSize: 'text-base' };
    }
  };

  const { width, height, textSize } = getSizeStyles();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Logo Text */}
      {showText && (
        <span 
          className={`${textSize} font-bold bg-gradient-to-r from-orange-500 via-yellow-500 via-green-500 via-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent`}
          style={{ 
            background: 'linear-gradient(90deg, #f97316, #eab308, #22c55e, #3b82f6, #8b5cf6, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          Jenrych
        </span>
      )}
    </div>
  );
}

// 圆形彩虹logo
export function RainbowCircleLogo({ 
  size = 'md', 
  className = '' 
}: RainbowLogoProps) {
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 text-sm';
      case 'md':
        return 'w-10 h-10 text-base';
      case 'lg':
        return 'w-12 h-12 text-lg';
      case 'xl':
        return 'w-16 h-16 text-xl';
      default:
        return 'w-10 h-10 text-base';
    }
  };

  return (
    <div 
      className={`
        ${getSizeStyles()}
        rounded-full flex items-center justify-center font-bold text-white
        bg-gradient-to-r from-orange-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500
        ${className}
      `}
    >
      <span className="font-bold">J</span>
    </div>
  );
}

// 方形彩虹logo
export function RainbowSquareLogo({ 
  size = 'md', 
  className = '' 
}: RainbowLogoProps) {
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 text-sm';
      case 'md':
        return 'w-10 h-10 text-base';
      case 'lg':
        return 'w-12 h-12 text-lg';
      case 'xl':
        return 'w-16 h-16 text-xl';
      default:
        return 'w-10 h-10 text-base';
    }
  };

  return (
    <div 
      className={`
        ${getSizeStyles()}
        rounded-lg flex items-center justify-center font-bold text-white
        bg-gradient-to-r from-orange-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500
        ${className}
      `}
    >
      <span className="font-bold">J</span>
    </div>
  );
}
