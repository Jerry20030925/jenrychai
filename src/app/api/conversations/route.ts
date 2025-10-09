import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(): Promise<Response> {
  try {
    const session = await getServerSession(authOptions as any);
    const userId = ((session as any)?.user as any)?.id || (session as any)?.userId as string | undefined;

    console.log('🔍 GET /api/conversations - User ID:', userId);
    console.log('🔍 Session details:', {
      hasSession: !!session,
      hasUser: !!(session as any)?.user,
      userId: userId,
      email: (session as any)?.user?.email
    });

    if (!userId) {
      console.log('⚠️ 用户未登录，返回空对话列表');
      return new Response(
        JSON.stringify({ conversations: [] }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // 优先使用数据库，如果失败则使用内存存储
    if (prisma) {
      try {
        console.log('📊 尝试从数据库加载对话记录...');
        const dbConversations = await prisma.conversation.findMany({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          take: 50,
          select: {
            id: true,
            title: true,
            createdAt: true,
            updatedAt: true
          }
        });

        const conversations = dbConversations.map((conv: any) => ({
          id: conv.id,
          title: conv.title,
          createdAt: conv.createdAt.toISOString(),
          updatedAt: conv.updatedAt.toISOString()
        }));

        console.log(`✅ 从数据库加载了 ${conversations.length} 条对话记录`, conversations.slice(0, 3));

        return new Response(JSON.stringify({ conversations }), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "private, max-age=10"
          },
        });
      } catch (dbError) {
        console.error("⚠️ 数据库查询失败，使用内存存储:", dbError);
      }
    } else {
      console.log('⚠️ Prisma 未初始化，使用内存存储');
    }

    // 回退到内存存储
    const { getConversationsByUserId } = await import("@/lib/database-hybrid");
    const memoryConversations = await getConversationsByUserId(userId);
    
    const conversations = memoryConversations.map((conv: any) => ({
      id: conv.id,
      title: conv.title,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString()
    }));

    console.log(`✅ 从内存加载了 ${conversations.length} 条对话记录`);

    return new Response(JSON.stringify({ conversations }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=10"
      },
    });
  } catch (error: unknown) {
    console.error("❌ Error in GET /api/conversations:", error);
    const message = error instanceof Error ? error.message : "服务器内部错误";
    return new Response(JSON.stringify({ error: message, conversations: [] }), { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const session = await getServerSession(authOptions as any);
    const userId = ((session as any)?.user as any)?.id || (session as any)?.userId as string | undefined;
    if (!userId) {
      return new Response(JSON.stringify({ error: "未登录，无法创建会话" }), { status: 401 });
    }
    
    if (!prisma) {
      return new Response(JSON.stringify({ error: "数据库不可用" }), { status: 500 });
    }
    
    const body = await request.json().catch(() => ({}));
    const title: string | undefined = body?.title;
    
    const conversation = await prisma.conversation.create({
      data: {
        title: title || "新的对话",
        userId: userId
      }
    });
    
    return new Response(JSON.stringify({ 
      conversation: {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString()
      }
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "服务器内部错误";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
