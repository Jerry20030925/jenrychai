"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated") return <div className="min-h-screen p-8" />;

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-semibold">用户主页</h1>
      <p className="text-neutral-500 mt-2 text-sm">欢迎回来，{session.user?.email}</p>
      <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <a className="border rounded-xl p-4 hover:shadow" href="/">前往首页聊天</a>
        <a className="border rounded-xl p-4 hover:shadow" href="/account">账户设置</a>
        <a className="border rounded-xl p-4 hover:shadow" href="/">新建对话</a>
      </div>
    </div>
  );
}


