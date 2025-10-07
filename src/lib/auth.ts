import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { findUserByEmail } from "@/lib/database-hybrid";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { NextResponse } from "next/server";

// 扩展NextAuth类型
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
  
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name?: string | null;
    email?: string | null;
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authOptions: NextAuthOptions = {
  session: { 
    strategy: "jwt",
    maxAge: 2 * 60 * 60, // 减少到2小时，大幅减少cookie大小
  },
  debug: false,
  useSecureCookies: process.env.NODE_ENV === "production",
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      // 只存储必要的用户信息，减少token大小
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      // 只返回必要的会话信息
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
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

          if (!credentials?.email || !credentials?.password) {
            console.log("❌ Missing credentials");
            throw new Error("邮箱和密码不能为空");
          }

          const { email, password } = credentials;

          if (email === "admin@example.com" && password === "admin123") {
            console.log("✅ Admin login successful");
            return {
              id: "admin_user",
              name: "Admin User",
              email: "admin@example.com",
              image: null
            };
          }

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
          throw e;
        }
      },
    }),
  ],
};