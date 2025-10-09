import { createHash, randomBytes } from "crypto";
import { Resend } from "resend";
import { PasswordResetEmail } from "@/lib/email-templates";
import { resetTokens, users } from "@/lib/reset-tokens";

export async function POST(request: Request): Promise<Response> {
  try {
    const { email, language = 'zh' } = await request.json();
    
    if (!email) {
      return new Response(JSON.stringify({ error: "请输入邮箱地址" }), { status: 400 });
    }

    // 检查邮箱是否存在（这里简化处理，实际应该查询数据库）
    // 为了演示，我们假设所有邮箱都可以重置密码
    const userExists = true; // 简化处理

    if (!userExists) {
      // 为了安全，即使邮箱不存在也返回成功
      return new Response(JSON.stringify({ 
        message: "如果该邮箱已注册，您将收到重设密码的邮件" 
      }), { status: 200 });
    }

    // 生成重置令牌
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15分钟后过期

    // 存储重置令牌
    resetTokens.set(token, {
      email,
      token,
      expires
    });

    console.log("💾 Token stored:", token);
    console.log("📧 For email:", email);
    console.log("⏰ Expires at:", expires);
    console.log("📊 Total tokens in storage:", resetTokens.size);
    console.log("🔑 All tokens:", Array.from(resetTokens.keys()).slice(0, 5));

    // 生成重置链接
    const resetUrl = `${process.env.NEXTAUTH_URL || 'https://jenrychai.com'}/reset-password?token=${token}`;
    console.log("🔗 Reset URL:", resetUrl);

    // 发送邮件（这里使用模拟邮件发送）
    try {
      await sendResetPasswordEmail(email, resetUrl, undefined, language);
      console.log(`Password reset email sent to: ${email} (${language})`);
      console.log(`Reset URL: ${resetUrl}`);
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      // 即使邮件发送失败，也返回成功（避免泄露邮箱是否存在）
    }

    return new Response(JSON.stringify({ 
      message: "如果该邮箱已注册，您将收到重设密码的邮件" 
    }), { status: 200 });

  } catch (error: unknown) {
    console.error("Forgot password error:", error);
    const message = error instanceof Error ? error.message : "服务器错误";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}

// 验证重置令牌
export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    console.log("🔍 Validating token in GET:", token);
    console.log("📊 Available tokens:", Array.from(resetTokens.keys()).slice(0, 5));
    console.log("📊 Total tokens in storage:", resetTokens.size);

    if (!token) {
      console.log("❌ No token provided");
      return new Response(JSON.stringify({ error: "缺少重置令牌" }), { status: 400 });
    }

    const resetData = resetTokens.get(token);

    if (!resetData) {
      console.log("❌ Token not found in storage");
      return new Response(JSON.stringify({ error: "重置令牌无效或已过期" }), { status: 400 });
    }

    const now = new Date();
    console.log("⏰ Token expires:", resetData.expires);
    console.log("⏰ Current time:", now);
    console.log("⏰ Is expired:", resetData.expires < now);

    if (resetData.expires < now) {
      console.log("❌ Token has expired");
      return new Response(JSON.stringify({ error: "重置令牌无效或已过期" }), { status: 400 });
    }

    console.log("✅ Token is valid");
    return new Response(JSON.stringify({
      valid: true,
      email: resetData.email
    }), { status: 200 });

  } catch (error: unknown) {
    console.error("Token validation error:", error);
    return new Response(JSON.stringify({ error: "服务器错误" }), { status: 500 });
  }
}

// 发送重设密码邮件
async function sendResetPasswordEmail(email: string, resetUrl: string, name?: string, language: string = 'zh') {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    // 使用React Email组件发送邮件
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Jenrych AI <noreply@jenrychai.com>',
      to: [email],
      subject: '重设密码 - Jenrych AI',
      react: PasswordResetEmail({ 
        name, 
        resetUrl, 
        expiresInMinutes: 15,
        language: language as 'zh' | 'en' | 'ja' | 'ko'
      }),
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error('邮件发送失败');
    }

    console.log('Password reset email sent successfully:', data);
    return { success: true, messageId: data?.id };
    
  } catch (error) {
    console.error('Failed to send reset password email:', error);
    
    // 如果Resend发送失败，回退到控制台输出（用于调试）
    console.log("=== 密码重设邮件（调试模式）===");
    console.log(`收件人: ${email}`);
    console.log(`重置链接: ${resetUrl}`);
    console.log("==================");
    
    throw error;
  }
}

// 重置令牌存储（供其他API使用）
// export { resetTokens };
