import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { findUserByEmail } from "@/lib/database-hybrid";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { NextResponse } from "next/server";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authOptions: NextAuthOptions = {
  session: { 
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 减少到1天，减少cookie大小
  },
  debug: false, // 生产环境关闭debug，减少日志输出
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name: "next-auth.session-token", // 简化cookie名称
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60, // 减少到1天
      },
    },
    csrfToken: {
      name: "next-auth.csrf-token", // 简化cookie名称
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60, // 减少到1天
      },
    },
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
              async authorize(credentials) {
                try {
                  console.log("🔐 Attempting login for:", credentials?.email);
                  
                  // 验证输入
                  if (!credentials?.email || !credentials?.password) {
                    console.log("❌ Missing credentials");
                    throw new Error("邮箱和密码不能为空");
                  }

                  const { email, password } = credentials;
                  
                  // 首先检查硬编码的admin用户
                  if (email === "admin@example.com" && password === "admin123") {
                    console.log("✅ Admin login successful");
                    return {
                      id: "admin_user",
                      name: "Admin User",
                      email: "admin@example.com",
                      image: null
                    };
                  }
                  
                  // 从混合存储查找用户
                  const user = await findUserByEmail(email);
                  if (user) {
                    console.log("👤 Found user:", user.email);
                    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
                    if (isValidPassword) {
                      console.log("✅ User login successful");
                      return {
                        id: user.id,
                        name: user.name || user.email,
                        email: user.email,
                        image: user.image
                      };
                    } else {
                      console.log("❌ Invalid password for user:", email);
                      throw new Error("密码错误");
                    }
                  } else {
                    console.log("❌ User not found:", email);
                    throw new Error("用户不存在，请先注册");
                  }
                  
                } catch (e) {
                  console.error("Authorization error:", e);
                  throw e; // 重新抛出错误，让NextAuth处理
                }
              },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log("🔐 JWT callback - user:", user?.email, "token:", token?.sub);
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      console.log("🔐 Session callback - token:", token?.sub);
      if (token?.sub) {
        (session.user as any) = {
          ...session.user,
          id: token.sub as string,
          email: token.email as string,
          name: token.name as string,
        };
      }
      return session;
    },
  },
  // 为避免生产环境未配置导致 500，这里提供一个回退值（仍建议在 Vercel 设置 NEXTAUTH_SECRET）
  secret: process.env.NEXTAUTH_SECRET || "jenrych-dev-secret-unsafe-for-local-development-only",
  pages: {
    signIn: "/login",
    error: "/login",
  },
};
