import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 
            process.env.POSTGRES_PRISMA_URL || 
            process.env.SUPABASE_DATABASE_URL ||
            "postgresql://postgres:k7p0azBccg7saihX@db.bsqsvmldrjyasgitprik.supabase.co:5432/postgres?sslmode=require",
        },
      },
    });

    // 测试数据库连接
    await prisma.$connect();
    
    // 测试简单查询
    const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as current_time`;
    
    // 测试用户表
    const userCount = await prisma.user.count();
    
    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: 'Supabase数据库连接成功',
      data: {
        testQuery: result,
        userCount: userCount,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('数据库连接测试失败:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Supabase数据库连接失败',
      error: error instanceof Error ? error.message : String(error),
      fallback: '将使用内存存储作为备用方案'
    }, { status: 200 }); // 返回200状态码，因为内存存储是有效的备用方案
  }
}