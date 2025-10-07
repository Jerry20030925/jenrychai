import { NextRequest, NextResponse } from 'next/server';
import { userOperations } from '@/lib/supabase-client';

export async function GET(request: NextRequest) {
  try {
    // 使用 Supabase REST API 获取所有用户
    const users = await userOperations.findAll();
    return NextResponse.json(users);

  } catch (error) {
    console.error('获取用户数据失败:', error);
    
    return NextResponse.json({
      error: '获取用户数据失败',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
