import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { findUserByEmail } from "@/lib/database-hybrid";

export async function GET(request: NextRequest) {
  try {
    // 从URL参数获取邮箱
    const url = new URL(request.url);
    const email = url.searchParams.get('email');

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

    let result: any = {
      success: true,
      message: 'Supabase数据库连接成功',
    };

    // 测试数据库连接
    await prisma.$connect();

    // 测试简单查询
    const testQuery = await prisma.$queryRaw`SELECT 1 as test, NOW() as current_time`;

    // 测试用户表
    const userCount = await prisma.user.count();

    result.data = {
      testQuery: testQuery,
      userCount: userCount,
      timestamp: new Date().toISOString()
    };

    // 如果提供了邮箱，查找该用户
    if (email) {
      console.log('🔍 测试查找用户:', email);

      // 1. 从Prisma直接查找
      const dbUser = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true
        }
      });

      // 2. 从混合存储查找
      const hybridUser = await findUserByEmail(email);

      result.data.userLookup = {
        email: email,
        prisma: dbUser || null,
        hybrid: hybridUser ? {
          id: hybridUser.id,
          email: hybridUser.email,
          name: hybridUser.name,
          hasPassword: !!hybridUser.password,
          hasPasswordHash: !!hybridUser.passwordHash
        } : null
      };
    }

    await prisma.$disconnect();

    return NextResponse.json(result);

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
