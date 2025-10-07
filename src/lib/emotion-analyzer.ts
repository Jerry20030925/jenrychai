// 情绪分析器 - 分析文本情绪并返回对应的表情
export interface EmotionResult {
  emotion: string;
  emoji: string;
  intensity: number; // 0-1
  confidence: number; // 0-1
}

// 情绪关键词映射
const emotionKeywords = {
  // 积极情绪
  happy: {
    keywords: ['开心', '高兴', '快乐', '兴奋', '满意', '喜欢', '爱', '棒', '好', '成功', '胜利', '庆祝', '笑', '哈哈', '😊', '😄', '😁', '🥳'],
    emoji: '😊',
    intensity: 0.8
  },
  excited: {
    keywords: ['激动', '兴奋', '期待', '迫不及待', '太棒了', 'amazing', 'awesome', 'fantastic', 'incredible', 'wow', '哇', '太厉害了'],
    emoji: '🤩',
    intensity: 0.9
  },
  love: {
    keywords: ['爱', '喜欢', 'love', '❤️', '💕', '💖', '💝', '💗', '💘', '心', '心动', '迷恋'],
    emoji: '😍',
    intensity: 0.9
  },
  grateful: {
    keywords: ['谢谢', '感谢', '感激', 'thank', 'thanks', 'appreciate', '感恩', '🙏'],
    emoji: '🙏',
    intensity: 0.7
  },
  
  // 消极情绪
  sad: {
    keywords: ['难过', '伤心', '悲伤', '失望', '沮丧', 'sad', 'depressed', 'upset', '😢', '😭', '😔'],
    emoji: '😢',
    intensity: 0.8
  },
  angry: {
    keywords: ['生气', '愤怒', '恼火', 'angry', 'mad', 'furious', 'annoyed', '😠', '😡', '🤬'],
    emoji: '😠',
    intensity: 0.8
  },
  worried: {
    keywords: ['担心', '焦虑', '紧张', 'worried', 'anxious', 'nervous', 'concerned', '😰', '😟', '😕'],
    emoji: '😰',
    intensity: 0.7
  },
  confused: {
    keywords: ['困惑', '迷茫', '不懂', '不明白', 'confused', 'puzzled', '🤔', '😕', '❓'],
    emoji: '🤔',
    intensity: 0.6
  },
  
  // 中性情绪
  neutral: {
    keywords: ['嗯', '好的', 'ok', 'okay', '知道了', '明白', '了解', 'ok'],
    emoji: '😐',
    intensity: 0.3
  },
  thinking: {
    keywords: ['思考', '考虑', '想想', 'think', 'consider', 'ponder', '🤔', '💭'],
    emoji: '🤔',
    intensity: 0.5
  },
  serious: {
    keywords: ['严肃', '认真', '重要', 'serious', 'important', 'critical', 'urgent', '紧急', '严重'],
    emoji: '😐',
    intensity: 0.6
  },
  
  // 技术相关
  technical: {
    keywords: ['代码', '编程', '技术', '开发', 'code', 'programming', 'tech', 'debug', 'bug', 'function', 'API', '数据库', '算法'],
    emoji: '💻',
    intensity: 0.7
  },
  learning: {
    keywords: ['学习', '学会', '掌握', 'learn', 'study', 'understand', '知识', '技能', '教程', '教学'],
    emoji: '📚',
    intensity: 0.7
  },
  creative: {
    keywords: ['创意', '创作', '设计', 'creative', 'design', 'art', '创作', '灵感', '想法', '创新'],
    emoji: '🎨',
    intensity: 0.8
  }
};

// 分析文本情绪
export function analyzeEmotion(text: string): EmotionResult {
  if (!text || text.trim().length === 0) {
    return {
      emotion: 'neutral',
      emoji: '😐',
      intensity: 0.3,
      confidence: 0.5
    };
  }

  const lowerText = text.toLowerCase();
  const emotions = Object.entries(emotionKeywords);
  
  let bestMatch = {
    emotion: 'neutral',
    emoji: '😐',
    intensity: 0.3,
    confidence: 0.3
  };

  let maxScore = 0;

  for (const [emotion, config] of emotions) {
    let score = 0;
    let matchCount = 0;

    // 检查关键词匹配
    for (const keyword of config.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        score += config.intensity;
        matchCount++;
      }
    }

    // 计算置信度
    const confidence = Math.min(matchCount / config.keywords.length * 2, 1);
    const finalScore = score * confidence;

    if (finalScore > maxScore) {
      maxScore = finalScore;
      bestMatch = {
        emotion,
        emoji: config.emoji,
        intensity: Math.min(score, 1),
        confidence
      };
    }
  }

  // 如果没有匹配到任何情绪，返回中性
  if (maxScore === 0) {
    return {
      emotion: 'neutral',
      emoji: '😐',
      intensity: 0.3,
      confidence: 0.5
    };
  }

  return bestMatch;
}

// 根据AI回复内容分析AI的情绪
export function analyzeAIEmotion(content: string): EmotionResult {
  const emotion = analyzeEmotion(content);
  
  // AI特有的情绪调整
  if (content.includes('抱歉') || content.includes('对不起') || content.includes('sorry')) {
    return {
      emotion: 'apologetic',
      emoji: '😅',
      intensity: 0.7,
      confidence: 0.8
    };
  }
  
  if (content.includes('恭喜') || content.includes('祝贺') || content.includes('congratulations')) {
    return {
      emotion: 'congratulatory',
      emoji: '🎉',
      intensity: 0.8,
      confidence: 0.8
    };
  }
  
  if (content.includes('建议') || content.includes('推荐') || content.includes('建议')) {
    return {
      emotion: 'helpful',
      emoji: '💡',
      intensity: 0.6,
      confidence: 0.7
    };
  }
  
  if (content.includes('警告') || content.includes('注意') || content.includes('warning')) {
    return {
      emotion: 'warning',
      emoji: '⚠️',
      intensity: 0.8,
      confidence: 0.8
    };
  }
  
  return emotion;
}

// 获取情绪动画类名
export function getEmotionAnimationClass(emotion: string, intensity: number): string {
  const baseClass = 'emotion-emoji';
  const intensityClass = intensity > 0.7 ? 'high-intensity' : intensity > 0.4 ? 'medium-intensity' : 'low-intensity';
  
  return `${baseClass} ${intensityClass} emotion-${emotion}`;
}

// 获取情绪颜色
export function getEmotionColor(emotion: string): string {
  const colors = {
    happy: '#FFD700',
    excited: '#FF6B6B',
    love: '#FF69B4',
    grateful: '#32CD32',
    sad: '#87CEEB',
    angry: '#FF4500',
    worried: '#FFA500',
    confused: '#9370DB',
    neutral: '#A9A9A9',
    thinking: '#4682B4',
    serious: '#696969',
    technical: '#00CED1',
    learning: '#228B22',
    creative: '#FF1493',
    apologetic: '#FFB6C1',
    congratulatory: '#FFD700',
    helpful: '#98FB98',
    warning: '#FF8C00'
  };
  
  return colors[emotion as keyof typeof colors] || '#A9A9A9';
}
