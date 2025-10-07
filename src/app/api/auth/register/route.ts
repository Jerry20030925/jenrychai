import bcrypt from "bcryptjs";
import { createUser, findUserByEmail } from "@/lib/database-hybrid";
import { Resend } from "resend";
import { WelcomeEmail } from "@/lib/email-templates";

export async function POST(request: Request): Promise<Response> {
  try {
    const { email, password, name, language = 'zh' } = await request.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "邮箱与密码必填" }), { status: 400 });
    }

    // 检查邮箱是否已存在
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      console.log("❌ Email already exists:", email);
      return new Response(JSON.stringify({ error: "邮箱已被注册" }), { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // 创建用户
    const newUser = await createUser(email, passwordHash, name || '');

    console.log("👤 User registered:", email, "ID:", newUser.id);

    // 发送欢迎邮件
    try {
      if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jenrychai.com";
        const displayName = name && name.trim().length > 0 ? name.trim() : undefined;
        
        const { data, error } = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Jenrych AI <noreply@jenrychai.com>',
          to: [email],
          subject: '欢迎加入 Jenrych AI！',
          react: WelcomeEmail({ 
            name: displayName, 
            loginUrl: siteUrl,
            language: language as 'zh' | 'en' | 'ja' | 'ko'
          }),
        });

        if (error) {
          console.error('Welcome email error:', error);
        } else {
          console.log('Welcome email sent successfully:', data);
        }
      }
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // 不抛出错误，注册仍然成功
    }

    return new Response(JSON.stringify({ id: newUser.id }), { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "服务器错误";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}


