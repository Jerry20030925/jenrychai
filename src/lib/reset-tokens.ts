// 共享的重置令牌存储
export const resetTokens = new Map<string, {
  email: string;
  token: string;
  expires: Date;
}>();

// 共享的用户存储（临时解决方案）
export const users = new Map<string, {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
}>();

// 清理过期的令牌
export function cleanupExpiredTokens() {
  const now = new Date();
  for (const [token, data] of resetTokens.entries()) {
    if (data.expires < now) {
      resetTokens.delete(token);
    }
  }
}

// 定期清理过期令牌（每5分钟）
if (typeof window === 'undefined') {
  setInterval(cleanupExpiredTokens, 5 * 60 * 1000);
}
