"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data?.error || "发送失败");
      }
      
      setMessage(data.message);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "发送失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-white to-slate-50 dark:from-black dark:to-neutral-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm space-y-4 border rounded-2xl p-6 shadow-lg bg-white/90 dark:bg-neutral-900/90 backdrop-blur"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="logo" className="h-6 w-auto" />
        </div>
        
        <h1 className="text-xl font-semibold text-center">忘记密码</h1>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          请输入您的邮箱地址，我们将发送重设密码的链接给您
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            placeholder="请输入邮箱地址"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded"
            >
              {error}
            </motion.div>
          )}
          
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded"
            >
              {message}
            </motion.div>
          )}
          
          <motion.button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full bg-blue-600 text-white rounded py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            {loading ? "发送中..." : "发送重设链接"}
          </motion.button>
        </form>

        <div className="text-center space-y-2">
          <p className="text-xs text-neutral-500">
            记起密码了？<Link className="underline hover:text-blue-600" href="/login">返回登录</Link>
          </p>
          <p className="text-xs text-neutral-500">
            没有账号？<Link className="underline hover:text-blue-600" href="/register">立即注册</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
