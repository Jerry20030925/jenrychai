import { NextRequest, NextResponse } from 'next/server';
import { performSemanticSearch } from '@/lib/semantic-search';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: '查询参数无效' }, { status: 400 });
    }

    // 执行语义搜索
    const results = await performSemanticSearch(query, 10);

    return NextResponse.json(results);
  } catch (error) {
    console.error('搜索API错误:', error);
    return NextResponse.json({ error: '搜索失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: '查询参数无效' }, { status: 400 });
    }

    // 执行语义搜索
    const results = await performSemanticSearch(query, 10);

    return NextResponse.json(results);
  } catch (error) {
    console.error('搜索API错误:', error);
    return NextResponse.json({ error: '搜索失败' }, { status: 500 });
  }
}
