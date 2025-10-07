import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  searchMemories, 
  createMemory, 
  getMemoryStats,
  extractMemoriesFromConversation 
} from '@/lib/embedding';

// 搜索记忆
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    const userId = ((session as any)?.user as any)?.id || (session as any)?.userId as string;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '5');
    const minSimilarity = parseFloat(searchParams.get('minSimilarity') || '0.3');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const memories = await searchMemories(userId, query, limit, minSimilarity);
    
    return NextResponse.json({ memories });
  } catch (error) {
    console.error('Error searching memories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 创建记忆
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    const userId = ((session as any)?.user as any)?.id || (session as any)?.userId as string;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title, 
      content, 
      category = 'general', 
      importance = 5, 
      source, 
      conversationId, 
      tags = [] 
    } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const memoryId = await createMemory(
      userId,
      title,
      content,
      category,
      importance,
      source,
      conversationId,
      tags
    );

    return NextResponse.json({ memoryId });
  } catch (error) {
    console.error('Error creating memory:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 获取记忆统计
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    const userId = ((session as any)?.user as any)?.id || (session as any)?.userId as string;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await getMemoryStats(userId);
    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error getting memory stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
