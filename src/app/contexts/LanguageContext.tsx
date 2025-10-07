'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'zh' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  zh: {
    // 通用
    'common.close': '关闭',
    'common.confirm': '确认',
    'common.cancel': '取消',
    'common.save': '保存',
    'common.delete': '删除',
    'common.edit': '编辑',
    'common.search': '搜索',
    'common.loading': '加载中...',
    'common.error': '错误',
    'common.success': '成功',
    
    // 问候语
    'greeting.morning': '早上好',
    'greeting.afternoon': '下午好',
    'greeting.evening': '晚上好',
    'greeting.night': '深夜好',
    
    // 主界面
    'main.title': 'Jenrych AI - 智能AI聊天助手',
    'main.placeholder': '输入你的问题...',
    'main.send': '发送',
    'main.deepThinking': '深度思考',
    'main.webSearch': '联网搜索',
    'main.newChat': '新对话',
    'main.history': '历史记录',
    'main.settings': '设置',
    
    // 历史记录
    'history.title': '对话历史',
    'history.empty': '暂无对话历史',
    'history.searchPlaceholder': '搜索对话...',
    'history.clear': '清空历史',
    'history.newConversation': '+ 新对话',
    'history.today': '今天',
    'history.yesterday': '昨天',
    'history.thisWeek': '本周',
    'history.earlier': '更早',
    
    // 设置
    'settings.title': '设置',
    'settings.general': '通用设置',
    'settings.language': '语言设置',
    'settings.about': '关于',
    'settings.privacy': '隐私政策',
    'settings.terms': '服务条款',
    'settings.contact': '联系我们',
    
    // 通用设置
    'settings.general.autoSave': '自动保存对话',
    'settings.general.autoSaveDesc': '自动保存您的对话记录',
    'settings.general.soundEffects': '声音效果',
    'settings.general.soundEffectsDesc': '启用消息提示音',
    'settings.general.notifications': '桌面通知',
    'settings.general.notificationsDesc': '接收桌面通知提醒',
    'settings.general.streamResponse': '流式响应',
    'settings.general.streamResponseDesc': '实时显示AI回复内容',
    
    // 语言设置
    'settings.language.select': '选择语言',
    'settings.language.chinese': '简体中文',
    'settings.language.english': 'English',
    
    // 关于
    'settings.about.description': 'Jenrych AI - 您的智能AI助手',
    'settings.about.version': '版本',
    
    // 隐私政策
    'settings.privacy.title': '隐私政策',
    'settings.privacy.description': '我们尊重并保护您的隐私：',
    'settings.privacy.item1': '您的对话数据仅用于提供服务',
    'settings.privacy.item2': '我们采用加密技术保护您的信息',
    'settings.privacy.item3': '不会向第三方出售或分享您的个人数据',
    'settings.privacy.item4': '您可以随时删除您的对话记录',
    'settings.privacy.item5': '我们遵守相关数据保护法规',
    
    // 服务条款
    'settings.terms.title': '服务条款',
    'settings.terms.description': '使用本服务即表示您同意：',
    'settings.terms.item1': '遵守当地法律法规使用本服务',
    'settings.terms.item2': '不利用服务进行违法或有害活动',
    'settings.terms.item3': 'AI生成的内容仅供参考',
    'settings.terms.item4': '服务可能会不定期更新和维护',
    'settings.terms.item5': '我们保留修改服务条款的权利',
    
    // 联系我们
    'settings.contact.title': '联系我们',
    'settings.contact.description': '如有任何问题或建议，欢迎联系我们：',
    'settings.contact.email': '邮箱',
    'settings.contact.website': '网站',
    'settings.contact.feedback': '反馈',
    'settings.contact.feedbackDesc': '您可以通过设置中的反馈功能向我们提出建议',
    
    // 消息
    'message.regenerate': '重新生成',
    'message.copy': '复制',
    'message.delete': '删除',
    'message.user': '用户',
    'message.assistant': 'AI助手',
  },
  en: {
    // Common
    'common.close': 'Close',
    'common.confirm': 'Confirm',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.search': 'Search',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    
    // Greetings
    'greeting.morning': 'Good Morning',
    'greeting.afternoon': 'Good Afternoon',
    'greeting.evening': 'Good Evening',
    'greeting.night': 'Good Night',
    
    // Main
    'main.title': 'Jenrych AI - Smart AI Chat Assistant',
    'main.placeholder': 'Enter your question...',
    'main.send': 'Send',
    'main.deepThinking': 'Deep Thinking',
    'main.webSearch': 'Web Search',
    'main.newChat': 'New Chat',
    'main.history': 'History',
    'main.settings': 'Settings',
    
    // History
    'history.title': 'Chat History',
    'history.empty': 'No chat history yet',
    'history.searchPlaceholder': 'Search conversations...',
    'history.clear': 'Clear History',
    'history.newConversation': '+ New Chat',
    'history.today': 'Today',
    'history.yesterday': 'Yesterday',
    'history.thisWeek': 'This Week',
    'history.earlier': 'Earlier',
    
    // Settings
    'settings.title': 'Settings',
    'settings.general': 'General Settings',
    'settings.language': 'Language Settings',
    'settings.about': 'About',
    'settings.privacy': 'Privacy Policy',
    'settings.terms': 'Terms of Service',
    'settings.contact': 'Contact Us',
    
    // General Settings
    'settings.general.autoSave': 'Auto Save Conversations',
    'settings.general.autoSaveDesc': 'Automatically save your chat history',
    'settings.general.soundEffects': 'Sound Effects',
    'settings.general.soundEffectsDesc': 'Enable message notification sounds',
    'settings.general.notifications': 'Desktop Notifications',
    'settings.general.notificationsDesc': 'Receive desktop notification alerts',
    'settings.general.streamResponse': 'Stream Response',
    'settings.general.streamResponseDesc': 'Display AI responses in real-time',
    
    // Language Settings
    'settings.language.select': 'Select Language',
    'settings.language.chinese': '简体中文',
    'settings.language.english': 'English',
    
    // About
    'settings.about.description': 'Jenrych AI - Your Smart AI Assistant',
    'settings.about.version': 'Version',
    
    // Privacy Policy
    'settings.privacy.title': 'Privacy Policy',
    'settings.privacy.description': 'We respect and protect your privacy:',
    'settings.privacy.item1': 'Your conversation data is only used to provide services',
    'settings.privacy.item2': 'We use encryption technology to protect your information',
    'settings.privacy.item3': 'We will not sell or share your personal data with third parties',
    'settings.privacy.item4': 'You can delete your conversation records at any time',
    'settings.privacy.item5': 'We comply with relevant data protection regulations',
    
    // Terms of Service
    'settings.terms.title': 'Terms of Service',
    'settings.terms.description': 'By using this service, you agree to:',
    'settings.terms.item1': 'Use this service in compliance with local laws and regulations',
    'settings.terms.item2': 'Not use the service for illegal or harmful activities',
    'settings.terms.item3': 'AI-generated content is for reference only',
    'settings.terms.item4': 'The service may be updated and maintained from time to time',
    'settings.terms.item5': 'We reserve the right to modify the terms of service',
    
    // Contact Us
    'settings.contact.title': 'Contact Us',
    'settings.contact.description': 'If you have any questions or suggestions, please contact us:',
    'settings.contact.email': 'Email',
    'settings.contact.website': 'Website',
    'settings.contact.feedback': 'Feedback',
    'settings.contact.feedbackDesc': 'You can submit suggestions through the feedback feature in settings',
    
    // Messages
    'message.regenerate': 'Regenerate',
    'message.copy': 'Copy',
    'message.delete': 'Delete',
    'message.user': 'User',
    'message.assistant': 'AI Assistant',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('zh');

  // 从localStorage加载语言设置
  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && (savedLang === 'zh' || savedLang === 'en')) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['zh']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

