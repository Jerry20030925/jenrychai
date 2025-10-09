import { prisma } from "@/lib/prisma";

// 清理过期的密码重置令牌
export async function POST(): Promise<Response> {
  try {
    if (!prisma) {
      return new Response(JSON.stringify({ error: "数据库不可用" }), { status: 503 });
    }

    const now = new Date();

    // 删除所有过期的令牌
    const result = await prisma.passwordResetToken.deleteMany({
      where: {
        expires: {
          lt: now
        }
      }
    });

    console.log(`🧹 清理了 ${result.count} 个过期的密码重置令牌`);

    return new Response(JSON.stringify({
      message: `清理成功`,
      count: result.count
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error("清理令牌失败:", error);
    const message = error instanceof Error ? error.message : "服务器错误";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}

// 也支持GET请求，便于定时任务调用
export async function GET(): Promise<Response> {
  return POST();
}
