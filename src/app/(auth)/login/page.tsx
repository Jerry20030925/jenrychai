"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/",
      });
      if (res?.ok && !res.error) {
        router.push(res.url || "/");
        router.refresh();
        return;
      }
      if (res?.error === "CredentialsSignin") {
        setError("邮箱或密码不正确");
      } else if (res?.error) {
        setError(res.error || "登录失败，请重试");
      } else {
        setError("无法登录，请稍后再试");
      }
    } catch (err) {
      setError("网络异常，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-white to-slate-50 dark:from-black dark:to-neutral-950">
      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="w-full max-w-sm space-y-4 border rounded-2xl p-6 shadow-lg bg-white/90 dark:bg-neutral-900/90 backdrop-blur"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="logo" className="h-6 w-auto" />
        </div>
        <h1 className="text-xl font-semibold text-center">登录</h1>
        <input
          className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
          placeholder="邮箱"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
          placeholder="密码"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-500" aria-live="assertive">{error}</p>}
        
        {/* 忘记密码链接 */}
        <div className="text-right">
          <Link 
            href="/forgot-password" 
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            忘记密码？
          </Link>
        </div>
        
        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: loading ? 1 : 1.02, boxShadow: loading ? undefined : "0 8px 30px rgba(59,130,246,0.35)" }}
          className="w-full bg-blue-600 text-white rounded py-2 text-sm disabled:opacity-60 relative overflow-hidden"
        >
          {loading ? (
            <span className="inline-flex items-center justify-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-white/60 border-t-transparent animate-spin"></span>
              登录中
            </span>
          ) : (
            "登录"
          )}
          {/* 按钮波纹 */}
          <span className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-r from-white/0 via-white/15 to-white/0" />
        </motion.button>
        <p className="text-xs text-neutral-500">
          没有账号？<Link className="underline" href="/register">去注册</Link>
        </p>
      </motion.form>
    </div>
  );
}


