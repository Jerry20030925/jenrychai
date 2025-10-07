import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const prisma = new PrismaClient();

    // 测试数据库连接
    await prisma.$connect();
    
    // 测试简单查询
    const result = await prisma.$queryRaw`SELECT 1 as test, datetime('now') as current_time`;
    
    // 测试用户表
    const userCount = await prisma.user.count();
    
    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: 'SQLite数据库连接正常',
      data: {
        testQuery: Array.isArray(result) ? result.map(r => ({
          test: Number(r.test),
          current_time: r.current_time
        })) : result,
        userCount: userCount,
        timestamp: new Date().toISOString(),
        databaseType: 'SQLite'
      }
    });

  } catch (error) {
    console.error('数据库连接测试失败:', error);
    
    return NextResponse.json({
      success: false,
      message: '数据库连接失败',
      error: error instanceof Error ? error.message : String(error),
      fallback: '将使用内存存储作为备用方案',
      timestamp: new Date().toISOString()
    }, { status: 200 }); // 返回200状态码，因为内存存储是有效的备用方案
  }
}
