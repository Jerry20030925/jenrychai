import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 检查环境变量
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasTavily = !!process.env.TAVILY_API_KEY;
    const hasDBUrl = !!process.env.DATABASE_URL;
    const hasAuthSecret = !!process.env.NEXTAUTH_SECRET;
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env_check: {
        OPENAI_API_KEY: hasOpenAI ? '✅ 已配置' : '❌ 未配置',
        TAVILY_API_KEY: hasTavily ? '✅ 已配置' : '❌ 未配置',
        DATABASE_URL: hasDBUrl ? '✅ 已配置' : '❌ 未配置',
        NEXTAUTH_SECRET: hasAuthSecret ? '✅ 已配置' : '❌ 未配置'
      },
      message: '环境变量检查完成'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
