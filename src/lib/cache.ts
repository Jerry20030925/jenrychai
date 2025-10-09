// 简单的内存缓存实现
interface CacheItem<T> {
  value: T;
  timestamp: number;
  ttl: number; // 生存时间（毫秒）
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize = 2000; // 增加最大缓存项数
  private accessCounts = new Map<string, number>(); // 访问计数

  set<T>(key: string, value: T, ttl: number = 5 * 60 * 1000): void {
    // 如果缓存已满，删除最少访问的项
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
    this.accessCounts.set(key, 0);
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.accessCounts.delete(key);
      return null;
    }

    // 增加访问计数
    const count = this.accessCounts.get(key) || 0;
    this.accessCounts.set(key, count + 1);

    return item.value as T;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // 清理过期项
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        this.accessCounts.delete(key);
      }
    }
  }

  // 淘汰最少使用的项
  private evictLeastUsed(): void {
    let leastUsedKey = '';
    let minCount = Infinity;
    
    for (const [key, count] of this.accessCounts.entries()) {
      if (count < minCount) {
        minCount = count;
        leastUsedKey = key;
      }
    }
    
    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
      this.accessCounts.delete(leastUsedKey);
    }
  }

  // 预热缓存
  warmup<T>(key: string, value: T, ttl: number = 10 * 60 * 1000): void {
    if (!this.has(key)) {
      this.set(key, value, ttl);
    }
  }
}

// 全局缓存实例
const cache = new MemoryCache();

// 定期清理过期项（每5分钟）
setInterval(() => {
  cache.cleanup();
}, 5 * 60 * 1000);

export { cache };

// 缓存键生成器
export function generateCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}:${parts.join(':')}`;
}

// 常用缓存键
export const CACHE_KEYS = {
  USER_MEMORIES: (userId: string, query: string) => 
    generateCacheKey('memories', userId, query.slice(0, 50)),
  SEARCH_RESULTS: (query: string) => 
    generateCacheKey('search', query.slice(0, 50)),
  WEB_CONTEXT: (query: string) => 
    generateCacheKey('web', query.slice(0, 50)),
  CONVERSATION: (conversationId: string) => 
    generateCacheKey('conv', conversationId),
} as const;
