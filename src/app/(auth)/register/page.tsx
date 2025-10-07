"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, language: 'zh' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "注册失败");
      // 注册成功后自动登录
      const loginRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/",
      });
      if ((loginRes as any)?.ok && !(loginRes as any)?.error) {
        window.location.assign((loginRes as any)?.url || "/");
      } else {
        throw new Error((loginRes as any)?.error || "自动登录失败");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "注册失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-white to-slate-50 dark:from-black dark:to-neutral-950">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 border rounded-2xl p-6 shadow-lg bg-white/90 dark:bg-neutral-900/90 backdrop-blur"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="logo" className="h-6 w-auto" />
        </div>
        <h1 className="text-xl font-semibold text-center">注册</h1>
        <input
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="昵称（可选）"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="邮箱"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="密码（至少 6 位）"
          type="password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded py-2 text-sm disabled:opacity-60"
        >
          {loading ? "注册中" : "注册"}
        </button>
        <div className="text-center space-y-1">
          <p className="text-xs text-neutral-500">
            已有账号？<Link className="underline hover:text-blue-600" href="/login">去登录</Link>
          </p>
          <p className="text-xs text-neutral-500">
            忘记密码？<Link className="underline hover:text-blue-600" href="/forgot-password">重设密码</Link>
          </p>
        </div>
      </form>
    </div>
  );
}


