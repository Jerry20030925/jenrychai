"use client";

import { useState } from "react";
import { PasswordResetEmail, WelcomeEmail } from "@/lib/email-templates";

export default function EmailPreviewPage() {
  const [activeTab, setActiveTab] = useState<'reset' | 'welcome'>('reset');
  const [language, setLanguage] = useState<'zh' | 'en' | 'ja' | 'ko'>('zh');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">邮件模板预览</h1>
        
        {/* 语言选择器 */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-lg p-1 shadow-sm">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'zh' | 'en' | 'ja' | 'ko')}
              className="px-4 py-2 rounded-md border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
              <option value="ko">한국어</option>
            </select>
          </div>
        </div>
        
        {/* 标签页 */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('reset')}
              className={`px-6 py-2 rounded-md transition-colors ${
                activeTab === 'reset'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {language === 'en' ? 'Password Reset' : 
               language === 'ja' ? 'パスワードリセット' : 
               language === 'ko' ? '비밀번호 재설정' : '密码重设邮件'}
            </button>
            <button
              onClick={() => setActiveTab('welcome')}
              className={`px-6 py-2 rounded-md transition-colors ${
                activeTab === 'welcome'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {language === 'en' ? 'Welcome Email' : 
               language === 'ja' ? 'ウェルカムメール' : 
               language === 'ko' ? '환영 이메일' : '欢迎邮件'}
            </button>
          </div>
        </div>

        {/* 邮件预览 */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 border-b">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="ml-4 text-sm text-gray-600">
                {activeTab === 'reset' ? 
                  (language === 'en' ? 'Password Reset Email' : 
                   language === 'ja' ? 'パスワードリセットメール' : 
                   language === 'ko' ? '비밀번호 재설정 이메일' : '密码重设邮件') : 
                  (language === 'en' ? 'Welcome Email' : 
                   language === 'ja' ? 'ウェルカムメール' : 
                   language === 'ko' ? '환영 이메일' : '欢迎邮件')} - 预览
              </span>
            </div>
          </div>
          
          <div className="p-0">
            {activeTab === 'reset' ? (
              <PasswordResetEmail
                name={language === 'en' ? 'John' : language === 'ja' ? '田中' : language === 'ko' ? '김철수' : '张三'}
                resetUrl="https://jenrychai.com/reset-password?token=abc123def456"
                expiresInMinutes={15}
                language={language}
              />
            ) : (
              <WelcomeEmail
                name={language === 'en' ? 'Jane' : language === 'ja' ? '佐藤' : language === 'ko' ? '이영희' : '李四'}
                loginUrl="https://jenrychai.com"
                language={language}
              />
            )}
          </div>
        </div>

        {/* 说明文字 */}
        <div className="mt-8 text-center text-gray-600">
          <p className="mb-2">
            这些是使用 React Email 组件生成的邮件模板
          </p>
          <p className="text-sm">
            在实际发送时，邮件会通过 Resend 服务发送给用户
          </p>
        </div>
      </div>
    </div>
  );
}
