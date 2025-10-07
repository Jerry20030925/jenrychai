"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export default function AnimatedButton({ 
  children, 
  onClick, 
  className = '', 
  disabled = false,
  variant = 'primary',
  size = 'md'
}: AnimatedButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'secondary':
        return 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200';
      case 'ghost':
        return 'bg-transparent hover:bg-gray-100 text-gray-600 dark:hover:bg-gray-800 dark:text-gray-300';
      default:
        return 'bg-blue-500 hover:bg-blue-600 text-white';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'md':
        return 'px-4 py-2 text-sm';
      case 'lg':
        return 'px-6 py-3 text-base';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${getVariantStyles()}
        ${getSizeStyles()}
        rounded-lg font-medium transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
      whileHover={{ 
        scale: disabled ? 1 : 1.05,
        y: disabled ? 0 : -2
      }}
      whileTap={{ 
        scale: disabled ? 1 : 0.95,
        y: disabled ? 0 : 0
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17
      }}
    >
      {children}
    </motion.button>
  );
}

// 脉冲动画按钮
export function PulseButton({ 
  children, 
  onClick, 
  className = '', 
  disabled = false 
}: AnimatedButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        bg-blue-500 hover:bg-blue-600 text-white
        px-4 py-2 rounded-lg font-medium
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      animate={{ 
        boxShadow: [
          "0 0 0 0 rgba(59, 130, 246, 0.4)",
          "0 0 0 10px rgba(59, 130, 246, 0)",
          "0 0 0 0 rgba(59, 130, 246, 0)"
        ]
      }}
      transition={{
        boxShadow: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        },
        scale: {
          type: "spring",
          stiffness: 400,
          damping: 17
        }
      }}
    >
      {children}
    </motion.button>
  );
}

// 弹跳动画按钮
export function BounceButton({ 
  children, 
  onClick, 
  className = '', 
  disabled = false 
}: AnimatedButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        bg-green-500 hover:bg-green-600 text-white
        px-4 py-2 rounded-lg font-medium
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
        ${className}
      `}
      whileHover={{ 
        scale: disabled ? 1 : 1.1,
        y: disabled ? 0 : -5
      }}
      whileTap={{ 
        scale: disabled ? 1 : 0.9,
        y: disabled ? 0 : 0
      }}
      animate={{ 
        y: [0, -3, 0]
      }}
      transition={{
        y: {
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        },
        scale: {
          type: "spring",
          stiffness: 400,
          damping: 17
        }
      }}
    >
      {children}
    </motion.button>
  );
}

// 旋转动画按钮
export function RotateButton({ 
  children, 
  onClick, 
  className = '', 
  disabled = false 
}: AnimatedButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        bg-purple-500 hover:bg-purple-600 text-white
        px-4 py-2 rounded-lg font-medium
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
        ${className}
      `}
      whileHover={{ 
        scale: disabled ? 1 : 1.05,
        rotate: disabled ? 0 : 5
      }}
      whileTap={{ 
        scale: disabled ? 1 : 0.95,
        rotate: disabled ? 0 : -5
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17
      }}
    >
      {children}
    </motion.button>
  );
}

// 闪烁动画按钮
export function BlinkButton({ 
  children, 
  onClick, 
  className = '', 
  disabled = false 
}: AnimatedButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        bg-orange-500 hover:bg-orange-600 text-white
        px-4 py-2 rounded-lg font-medium
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
        ${className}
      `}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      animate={{ 
        opacity: [1, 0.7, 1]
      }}
      transition={{
        opacity: {
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut"
        },
        scale: {
          type: "spring",
          stiffness: 400,
          damping: 17
        }
      }}
    >
      {children}
    </motion.button>
  );
}
