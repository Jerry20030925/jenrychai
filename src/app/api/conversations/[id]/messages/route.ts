import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;
    console.log("🔍 Messages API called for conversation ID:", id);
    
    const session = await getServerSession(authOptions as any);
    const userId = ((session as any)?.user as any)?.id || (session as any)?.userId as string | undefined;
    console.log("🔍 User ID from session:", userId);
    
    if (!userId) {
      console.log("❌ No user ID found, returning empty messages");
      return new Response(JSON.stringify({ messages: [] }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    
    if (!prisma) {
      return new Response(JSON.stringify({ error: "数据库不可用" }), { status: 500 });
    }
    
    // 检查会话权限并获取消息
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
    
    if (!conversation) {
      console.log("❌ No conversation found or user mismatch");
      return new Response(JSON.stringify({ error: "无权限" }), { status: 403 });
    }
    
    const messages = conversation.messages.map((msg: any) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
    }));
    
    console.log("🔍 Messages found:", messages.length);
    
    return new Response(JSON.stringify({ messages }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("❌ Messages API error:", error);
    const message = error instanceof Error ? error.message : "服务器内部错误";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
