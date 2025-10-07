// 简化的认证配置用于测试
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authOptionsSimple: NextAuthOptions = {
  session: { 
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  debug: true, // 开启调试模式
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("🔐 Simple auth - credentials:", credentials);
        
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing credentials");
          return null;
        }

        const { email, password } = credentials;
        
        // 简单的硬编码认证
        if (email === "admin@example.com" && password === "admin123") {
          console.log("✅ Simple auth - Admin login successful");
          return {
            id: "admin_user",
            name: "Admin User",
            email: "admin@example.com",
            image: null
          };
        }
        
        console.log("❌ Simple auth - Invalid credentials");
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log("🔐 Simple JWT callback - user:", user?.email);
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      console.log("🔐 Simple session callback - token:", token?.sub);
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
  secret: process.env.NEXTAUTH_SECRET || "test-secret",
  pages: {
    signIn: "/login",
    error: "/login",
  },
};
