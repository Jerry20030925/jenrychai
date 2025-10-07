import bcrypt from "bcryptjs";
import { resetTokens, users } from "@/lib/reset-tokens";

export async function POST(request: Request): Promise<Response> {
  try {
    const { token, password } = await request.json();
    
    if (!token || !password) {
      return new Response(JSON.stringify({ error: "缺少必要参数" }), { status: 400 });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: "密码至少需要6位" }), { status: 400 });
    }

    // 验证重置令牌
    console.log("🔍 Validating reset token:", token);
    console.log("📊 Available tokens:", Array.from(resetTokens.keys()));
    
    const resetData = resetTokens.get(token);
    
    if (!resetData) {
      console.log("❌ Token not found in storage");
      return new Response(JSON.stringify({ error: "重置令牌无效或已过期" }), { status: 400 });
    }
    
    if (resetData.expires < new Date()) {
      console.log("⏰ Token expired:", resetData.expires, "Current time:", new Date());
      return new Response(JSON.stringify({ error: "重置令牌无效或已过期" }), { status: 400 });
    }
    
    console.log("✅ Token is valid for email:", resetData.email);

    // 查找用户（这里简化处理，实际应该查询数据库）
    const user = Array.from(users.values()).find(u => u.email === resetData.email);
    
    if (!user) {
      // 为了安全，即使用户不存在也返回成功
      return new Response(JSON.stringify({ 
        message: "密码重设成功" 
      }), { status: 200 });
    }

    // 更新密码
    const newPasswordHash = await bcrypt.hash(password, 10);
    user.passwordHash = newPasswordHash;

    // 删除已使用的重置令牌
    resetTokens.delete(token);

    console.log(`Password reset successful for: ${resetData.email}`);

    return new Response(JSON.stringify({ 
      message: "密码重设成功，请使用新密码登录" 
    }), { status: 200 });

  } catch (error: unknown) {
    console.error("Reset password error:", error);
    const message = error instanceof Error ? error.message : "服务器错误";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
