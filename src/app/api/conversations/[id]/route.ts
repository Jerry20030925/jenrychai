import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const session = await getServerSession(authOptions as any);
    const userId = ((session as any)?.user as any)?.id || (session as any)?.userId as string | undefined;
    if (!userId) {
      return new Response(JSON.stringify({ error: "未登录" }), { status: 401 });
    }

    const { id } = await params;

    // 尝试从数据库获取
    if (prisma) {
      try {
        const conversation = await prisma.conversation.findFirst({
          where: {
            id: id,
            userId: userId
          },
          include: {
            messages: {
              orderBy: { createdAt: 'asc' }
            }
          }
        });

        if (conversation) {
          const messages = conversation.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            createdAt: msg.createdAt.toISOString()
          }));

          return new Response(JSON.stringify({
            conversation: {
              id: conversation.id,
              title: conversation.title,
              createdAt: conversation.createdAt.toISOString(),
              updatedAt: conversation.updatedAt.toISOString()
            },
            messages
          }), {
            headers: { "Content-Type": "application/json" },
          });
        }
      } catch (dbError) {
        console.log("⚠️ DB query failed for conversation detail, trying memory storage");
      }
    }

    // 从内存获取
    const { getConversationsByUserId, getMessagesByConversationId } = await import("@/lib/database-hybrid");
    const allConversations = await getConversationsByUserId(userId);
    const conversation = allConversations.find(c => c.id === id);

    if (!conversation) {
      return new Response(JSON.stringify({ error: "对话不存在" }), { status: 404 });
    }

    const memoryMessages = await getMessagesByConversationId(id);
    const messages = memoryMessages.map((msg: any) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt.toISOString()
    }));

    return new Response(JSON.stringify({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString()
      },
      messages
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("❌ Error in GET /api/conversations/[id]:", error);
    const message = error instanceof Error ? error.message : "服务器内部错误";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}