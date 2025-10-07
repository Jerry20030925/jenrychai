import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 检查环境变量
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;
    
    if (!dbUrl) {
      return NextResponse.json({ 
        error: 'No database URL found',
        env: {
          DATABASE_URL: !!process.env.DATABASE_URL,
          POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
          POSTGRES_URL: !!process.env.POSTGRES_URL,
        }
      }, { status: 500 });
    }

    // 尝试连接数据库
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });

    // 测试连接
    await prisma.$connect();
    
    // 尝试创建表（如果不存在）
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT,
          image TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS conversations (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          user_id TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `;
      
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          conversation_id TEXT NOT NULL,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          prompt_tokens INTEGER,
          completion_tokens INTEGER,
          total_tokens INTEGER,
          FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
        );
      `;
      
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS memories (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          content TEXT NOT NULL,
          category TEXT NOT NULL,
          importance INTEGER DEFAULT 5,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `;
      
      return NextResponse.json({ 
        success: true, 
        message: 'Database initialized successfully',
        tables: ['users', 'conversations', 'messages', 'memories']
      });
    } catch (createError) {
      console.error('Table creation error:', createError);
      return NextResponse.json({ 
        success: true, 
        message: 'Database connected but table creation failed',
        error: createError instanceof Error ? createError.message : 'Unknown error'
      });
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({ 
      error: 'Database initialization failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      env: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
        POSTGRES_URL: !!process.env.POSTGRES_URL,
      }
    }, { status: 500 });
  }
}