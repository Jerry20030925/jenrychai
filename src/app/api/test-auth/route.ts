// 测试认证逻辑的API
import { authOptionsSimple } from "@/lib/auth-simple";
import NextAuth from "next-auth";

const handler = NextAuth(authOptionsSimple);

export { handler as GET, handler as POST };
