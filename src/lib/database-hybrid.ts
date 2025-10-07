// 混合数据库存储方案 - Supabase REST API + 内存存储备份
import { PrismaClient } from '@prisma/client';
import { userOperations, conversationOperations, messageOperations, memoryOperations } from './supabase-client';

// 使用全局变量来保持内存状态（避免热重载导致数据丢失）
declare global {
  var memoryUsers: Map<string, {
    id: string;
    email: string;
    password?: string;
    passwordHash?: string;
    name?: string;
    phone?: string;
    bio?: string;
    image?: string;
    createdAt: Date;
    updatedAt: Date;
  }> | undefined;

  var memoryConversations: Map<string, {
    id: string;
    title: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  }> | undefined;

  var memoryMessages: Map<string, {
    id: string;
    conversationId: string;
    role: string;
    content: string;
    createdAt: Date;
  }> | undefined;

  var memoryMemories: Map<string, {
    id: string;
    userId: string;
    content: string;
    category: string;
    importance: number;
    createdAt: Date;
    updatedAt: Date;
  }> | undefined;
}

// 内存存储（主要）- 使用全局变量以在开发模式下保持状态
const memoryUsers = global.memoryUsers || new Map();
if (!global.memoryUsers) global.memoryUsers = memoryUsers;

const memoryConversations = global.memoryConversations || new Map();
if (!global.memoryConversations) global.memoryConversations = memoryConversations;

const memoryMessages = global.memoryMessages || new Map();
if (!global.memoryMessages) global.memoryMessages = memoryMessages;

const memoryMemories = global.memoryMemories || new Map();
if (!global.memoryMemories) global.memoryMemories = memoryMemories;

// 数据库客户端（备用）
let prisma: PrismaClient | null = null;
let dbConnectionFailed = false;

try {
  // 仅使用 Prisma 的默认数据源（由 schema + 环境变量提供）
  // 生产环境必须提供 DATABASE_URL，否则直接报错，避免使用非持久化存储
  const isProd = process.env.NODE_ENV === 'production';
  const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL || process.env.POSTGRES_PRISMA_URL || process.env.SUPABASE_DATABASE_URL;

  if (isProd && !databaseUrl) {
    throw new Error('生产环境缺少 DATABASE_URL，请在 Vercel 环境变量中设置');
  }

  prisma = new PrismaClient({
    // 若本地提供了自定义 URL，则按该 URL 连接（便于本地直连 Supabase）
    datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined as any,
    log: ['query', 'info', 'warn', 'error'],
  });

  prisma.$connect().then(() => {
    console.log('✅ 数据库连接成功');
    dbConnectionFailed = false;
  }).catch((error: unknown) => {
    console.log('❌ 数据库连接失败，将使用内存存储:', error instanceof Error ? error.message : String(error));
    dbConnectionFailed = true;
  });
} catch (error: unknown) {
  console.log('⚠️ 数据库连接失败，使用内存存储:', error instanceof Error ? error.message : String(error));
  prisma = null;
  dbConnectionFailed = true;
}

// 用户操作
export async function createUser(email: string, passwordHash: string, name: string = '', image?: string, phone?: string, bio?: string) {
  const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  
  const user = {
    id,
    email,
    password: passwordHash, // 存储密码
    passwordHash, // 保持兼容性
    name,
    phone,
    bio,
    image,
    createdAt: now,
    updatedAt: now
  };
  
  // 首先尝试使用 Supabase REST API
  try {
    const supabaseUser = await userOperations.create({
      email,
      passwordHash,
      name,
      phone,
      bio,
      image
    });
    console.log('✅ 用户已保存到 Supabase:', supabaseUser.email);
    return supabaseUser;
  } catch (error) {
    console.log('❌ Supabase 保存失败，尝试数据库:', error instanceof Error ? error.message : String(error));
    
    // 回退到 Prisma 数据库
    if (prisma && !dbConnectionFailed) {
      try {
        await prisma.user.create({
          data: {
            id,
            email,
            passwordHash,
            name,
            phone: phone || null,
            bio: bio || null,
            image
          } as any
        });
        console.log('✅ 用户已创建到数据库');
        // 同时更新内存存储作为缓存
        memoryUsers.set(id, user);
      } catch (dbError) {
        console.log('❌ 数据库创建失败，使用内存存储:', dbError);
        dbConnectionFailed = true;
        // 数据库失败时使用内存存储
        memoryUsers.set(id, user);
      }
    } else {
      // 数据库不可用时使用内存存储
      memoryUsers.set(id, user);
    }
  }
  
  return user;
}

export async function findUserByEmail(email: string) {
  // 首先尝试从 Supabase REST API 查找
  try {
    const supabaseUser = await userOperations.findByEmail(email);
    if (supabaseUser) {
      console.log('✅ 从 Supabase 找到用户:', email);
      return supabaseUser;
    }
  } catch (error) {
    console.log('❌ Supabase 查询失败，尝试数据库:', error instanceof Error ? error.message : String(error));
  }
  
  // 回退到 Prisma 数据库
  if (prisma && !dbConnectionFailed) {
    try {
      const dbUser = await prisma.user.findUnique({ where: { email } });
      if (dbUser) {
        console.log('✅ 从数据库找到用户:', email);
        // 同步到内存作为缓存
        memoryUsers.set(dbUser.id, {
          id: dbUser.id,
          email: dbUser.email,
          password: dbUser.passwordHash,
          passwordHash: dbUser.passwordHash,
          name: dbUser.name || '',
          phone: (dbUser as any).phone || '',
          bio: (dbUser as any).bio || '',
          image: dbUser.image || undefined,
          createdAt: dbUser.createdAt,
          updatedAt: dbUser.updatedAt
        });
        return memoryUsers.get(dbUser.id);
      }
    } catch (error: unknown) {
      console.log('❌ 数据库查询失败:', error instanceof Error ? error.message : String(error));
      dbConnectionFailed = true;
    }
  }
  
  // 数据库不可用时从内存查找
  for (const user of memoryUsers.values()) {
    if (user.email === email) {
      console.log('👤 从内存找到用户:', email);
      return user;
    }
  }
  
  console.log('❌ 用户未找到:', email);
  return null;
}

export async function findUserById(id: string) {
  return memoryUsers.get(id) || null;
}

export async function updateUser(id: string, data: { name?: string; phone?: string; bio?: string }) {
  const user = memoryUsers.get(id);
  if (!user) return null;

  // 更新内存中的用户信息
  const updatedUser = {
    ...user,
    name: data.name !== undefined ? data.name : user.name,
    phone: data.phone !== undefined ? data.phone : user.phone,
    bio: data.bio !== undefined ? data.bio : user.bio,
    updatedAt: new Date()
  };
  
  memoryUsers.set(id, updatedUser);

  // 尝试同步到Supabase数据库
  if (prisma && !dbConnectionFailed) {
    try {
        await prisma.user.update({
          where: { id },
          data: {
            name: data.name || null,
            phone: data.phone || null,
            bio: data.bio || null,
            updatedAt: new Date()
          } as any
        });
      console.log('✅ 用户信息已同步到Supabase数据库');
    } catch (error) {
      console.log('⚠️ 用户信息同步到Supabase数据库失败:', error);
    }
  }

  return updatedUser;
}

export async function updateUserPassword(id: string, hashedPassword: string) {
  const user = memoryUsers.get(id);
  if (!user) return false;

  // 更新内存中的密码
  user.password = hashedPassword;
  user.passwordHash = hashedPassword; // 保持兼容性
  user.updatedAt = new Date();
  memoryUsers.set(id, user);

  // 尝试同步到Supabase数据库
  if (prisma && !dbConnectionFailed) {
    try {
        await prisma.user.update({
          where: { id },
          data: { 
            passwordHash: hashedPassword,
            updatedAt: new Date()
          }
        });
      console.log('✅ 密码已同步到Supabase数据库');
    } catch (error) {
      console.log('⚠️ 密码同步到Supabase数据库失败:', error);
    }
  }

  return true;
}

// 会话操作
export async function createConversation(userId: string, title: string) {
  const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  
  const conversation = {
    id,
    title,
    userId,
    createdAt: now,
    updatedAt: now
  };
  
  memoryConversations.set(id, conversation);
  
  // 尝试同步到数据库（如果连接正常）
  if (prisma && !dbConnectionFailed) {
    try {
      await prisma.conversation.create({
        data: {
          id,
          title,
          userId
        }
      });
      console.log('✅ 会话同步到数据库成功');
    } catch (error: unknown) {
      console.log('⚠️ 会话同步到数据库失败');
      dbConnectionFailed = true;
    }
  }
  
  return conversation;
}

export async function getConversationsByUserId(userId: string) {
  const conversations = Array.from(memoryConversations.values())
    .filter(conv => conv.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  
  return conversations;
}

// 消息操作
export async function createMessage(conversationId: string, role: string, content: string) {
  const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  
  const message = {
    id,
    conversationId,
    role,
    content,
    createdAt: now
  };
  
  memoryMessages.set(id, message);
  
  // 尝试同步到数据库（如果连接正常）
  if (prisma && !dbConnectionFailed) {
    try {
      await prisma.message.create({
        data: {
          id,
          conversationId,
          role,
          content
        }
      });
      console.log('✅ 消息同步到数据库成功');
    } catch (error: unknown) {
      console.log('⚠️ 消息同步到数据库失败');
      dbConnectionFailed = true;
    }
  }
  
  return message;
}

export async function getMessagesByConversationId(conversationId: string) {
  const messages = Array.from(memoryMessages.values())
    .filter(msg => msg.conversationId === conversationId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  
  return messages;
}

// 记忆操作
export async function createMemory(userId: string, content: string, category: string, importance: number = 5) {
  const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  
  const memory = {
    id,
    userId,
    content,
    category,
    importance,
    createdAt: now,
    updatedAt: now
  };
  
  memoryMemories.set(id, memory);
  
  // 尝试同步到数据库（如果连接正常）
  if (prisma && !dbConnectionFailed) {
    try {
      await prisma.memory.create({
        data: {
          id,
          userId,
          content,
          category,
          importance
        }
      });
      console.log('✅ 记忆同步到数据库成功');
    } catch (error: unknown) {
      console.log('⚠️ 记忆同步到数据库失败');
      dbConnectionFailed = true;
    }
  }
  
  return memory;
}

export async function getMemoriesByUserId(userId: string) {
  const memories = Array.from(memoryMemories.values())
    .filter(mem => mem.userId === userId)
    .sort((a, b) => b.importance - a.importance || b.createdAt.getTime() - a.createdAt.getTime());
  
  return memories;
}

// 统计信息
export function getStats() {
  return {
    users: memoryUsers.size,
    conversations: memoryConversations.size,
    messages: memoryMessages.size,
    memories: memoryMemories.size,
    databaseConnected: prisma !== null
  };
}

// 清理内存数据
export async function updateConversationTitle(conversationId: string, title: string) {
  // 更新内存中的对话标题
  const conversation = memoryConversations.get(conversationId);
  if (conversation) {
    conversation.title = title;
    conversation.updatedAt = new Date();
  }

  // 尝试更新数据库
  if (prisma && !dbConnectionFailed) {
    try {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { 
          title,
          updatedAt: new Date()
        }
      });
      console.log('✅ 对话标题已更新到数据库');
    } catch (error) {
      console.log('⚠️ 对话标题更新到数据库失败，仅保留内存更新');
    }
  }
}

export function clearMemoryData() {
  memoryUsers.clear();
  memoryConversations.clear();
  memoryMessages.clear();
  memoryMemories.clear();
  console.log('🧹 Memory data cleared');
}

// 清理函数
export async function cleanup() {
  if (prisma) {
    try {
      await prisma.$disconnect();
    } catch (error: unknown) {
      console.log('⚠️ 数据库断开连接失败:', error instanceof Error ? error.message : String(error));
    }
  }
}
