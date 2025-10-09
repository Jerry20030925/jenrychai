import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { findUserByEmail } from "@/lib/database-hybrid";

export async function POST(request: Request): Promise<Response> {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return new Response(JSON.stringify({ error: "缺少必要参数" }), { status: 400 });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: "密码至少需要6位" }), { status: 400 });
    }

    if (!prisma) {
      console.log("❌ Database not available");
      return new Response(JSON.stringify({ error: "服务暂时不可用" }), { status: 503 });
    }

    // 从数据库验证重置令牌
    console.log("🔍 Validating reset token:", token);

    const resetData = await prisma.passwordResetToken.findUnique({
      where: { token }
    });

    if (!resetData) {
      console.log("❌ Token not found in database");
      return new Response(JSON.stringify({ error: "重置令牌无效或已过期" }), { status: 400 });
    }

    if (resetData.expires < new Date()) {
      console.log("⏰ Token expired:", resetData.expires, "Current time:", new Date());
      // 删除过期令牌
      await prisma.passwordResetToken.delete({
        where: { id: resetData.id }
      });
      return new Response(JSON.stringify({ error: "重置令牌无效或已过期" }), { status: 400 });
    }

    console.log("✅ Token is valid for email:", resetData.email);

    // 查找用户
    const user = await findUserByEmail(resetData.email);

    if (!user) {
      console.log("❌ User not found for email:", resetData.email);
      // 删除令牌
      await prisma.passwordResetToken.delete({
        where: { id: resetData.id }
      });
      // 为了安全，仍返回成功
      return new Response(JSON.stringify({
        message: "密码重设成功"
      }), { status: 200 });
    }

    // 更新密码
    const newPasswordHash = await bcrypt.hash(password, 10);

    // 使用updateUserPassword更新密码到数据库和内存
    const { updateUserPassword } = await import('@/lib/database-hybrid');
    await updateUserPassword(user.id, newPasswordHash);

    // 删除已使用的重置令牌
    await prisma.passwordResetToken.delete({
      where: { id: resetData.id }
    });

    console.log(`✅ Password reset successful for: ${resetData.email}`);

    return new Response(JSON.stringify({
      message: "密码重设成功，请使用新密码登录"
    }), { status: 200 });

  } catch (error: unknown) {
    console.error("Reset password error:", error);
    const message = error instanceof Error ? error.message : "服务器错误";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
