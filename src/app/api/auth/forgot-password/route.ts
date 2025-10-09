import { randomBytes } from "crypto";
import { Resend } from "resend";
import { PasswordResetEmail } from "@/lib/email-templates";
import { prisma } from "@/lib/prisma";
import { findUserByEmail } from "@/lib/database-hybrid";

export async function POST(request: Request): Promise<Response> {
  try {
    const { email, language = 'zh' } = await request.json();
    
    if (!email) {
      return new Response(JSON.stringify({ error: "请输入邮箱地址" }), { status: 400 });
    }

    // 检查邮箱是否存在
    const user = await findUserByEmail(email);
    console.log("🔍 User lookup result:", user ? `Found: ${user.email}` : 'Not found');

    // 为了安全，即使邮箱不存在也返回成功（防止邮箱枚举攻击）
    if (!user) {
      console.log("⚠️ Email not registered, but returning success for security");
      return new Response(JSON.stringify({
        message: "如果该邮箱已注册，您将收到重设密码的邮件"
      }), { status: 200 });
    }

    // 生成重置令牌
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15分钟后过期

    // 保存到数据库
    if (prisma) {
      try {
        // 先删除该邮箱的所有旧令牌
        await prisma.passwordResetToken.deleteMany({
          where: { email }
        });

        // 创建新令牌
        await prisma.passwordResetToken.create({
          data: {
            email,
            token,
            expires
          }
        });

        console.log("💾 Token saved to database:", token);
        console.log("📧 For email:", email);
        console.log("⏰ Expires at:", expires);
      } catch (dbError) {
        console.error("❌ Failed to save token to database:", dbError);
        // 如果数据库保存失败，仍然返回成功（安全考虑）
        return new Response(JSON.stringify({
          message: "如果该邮箱已注册，您将收到重设密码的邮件"
        }), { status: 200 });
      }
    } else {
      console.log("⚠️ Prisma not available, cannot store token");
      return new Response(JSON.stringify({
        error: "服务暂时不可用，请稍后重试"
      }), { status: 503 });
    }

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

    if (!token) {
      console.log("❌ No token provided");
      return new Response(JSON.stringify({ error: "缺少重置令牌" }), { status: 400 });
    }

    if (!prisma) {
      console.log("❌ Database not available");
      return new Response(JSON.stringify({ error: "服务暂时不可用" }), { status: 503 });
    }

    // 从数据库查询令牌
    const resetData = await prisma.passwordResetToken.findUnique({
      where: { token }
    });

    if (!resetData) {
      console.log("❌ Token not found in database");
      return new Response(JSON.stringify({ error: "重置令牌无效或已过期" }), { status: 400 });
    }

    const now = new Date();
    console.log("⏰ Token expires:", resetData.expires);
    console.log("⏰ Current time:", now);
    console.log("⏰ Is expired:", resetData.expires < now);

    if (resetData.expires < now) {
      console.log("❌ Token has expired");
      // 删除过期令牌
      await prisma.passwordResetToken.delete({
        where: { id: resetData.id }
      });
      return new Response(JSON.stringify({ error: "重置令牌无效或已过期" }), { status: 400 });
    }

    console.log("✅ Token is valid for email:", resetData.email);
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
