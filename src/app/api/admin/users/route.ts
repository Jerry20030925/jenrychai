import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const prisma = new PrismaClient();

    // 获取所有用户
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    await prisma.$disconnect();

    return NextResponse.json(users);

  } catch (error) {
    console.error('获取用户数据失败:', error);
    
    return NextResponse.json({
      error: '获取用户数据失败',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
