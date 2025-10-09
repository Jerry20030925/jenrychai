// 使用全局变量确保在开发模式下跨热重载保持状态
declare global {
  var resetTokensStore: Map<string, {
    email: string;
    token: string;
    expires: Date;
  }> | undefined;

  var usersStore: Map<string, {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    createdAt: Date;
  }> | undefined;
}

// 共享的重置令牌存储 - 使用全局变量
export const resetTokens = global.resetTokensStore || new Map<string, {
  email: string;
  token: string;
  expires: Date;
}>();

if (!global.resetTokensStore) {
  global.resetTokensStore = resetTokens;
}

// 共享的用户存储（临时解决方案）- 使用全局变量
export const users = global.usersStore || new Map<string, {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
}>();

if (!global.usersStore) {
  global.usersStore = users;
}

// 清理过期的令牌
export function cleanupExpiredTokens() {
  const now = new Date();
  let cleaned = 0;
  for (const [token, data] of resetTokens.entries()) {
    if (data.expires < now) {
      resetTokens.delete(token);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`🧹 清理了 ${cleaned} 个过期令牌`);
  }
  return cleaned;
}

// 定期清理过期令牌（每5分钟）
if (typeof window === 'undefined') {
  setInterval(cleanupExpiredTokens, 5 * 60 * 1000);
}
