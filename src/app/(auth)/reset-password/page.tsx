"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError("缺少重置令牌");
      setValidating(false);
      return;
    }

    // 验证令牌
    fetch(`/api/auth/forgot-password?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setTokenValid(true);
        } else {
          setError("重置令牌无效或已过期");
        }
      })
      .catch(() => {
        setError("验证令牌失败");
      })
      .finally(() => {
        setValidating(false);
      });
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }
    
    if (password.length < 6) {
      setError("密码至少需要6位");
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data?.error || "重设失败");
      }
      
      setMessage(data.message);
      
      // 3秒后跳转到登录页面
      setTimeout(() => {
        router.push('/login');
      }, 3000);
      
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "重设失败");
    } finally {
      setLoading(false);
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-white to-slate-50 dark:from-black dark:to-neutral-950">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">验证令牌中...</p>
        </motion.div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-white to-slate-50 dark:from-black dark:to-neutral-950">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-4 border rounded-2xl p-6 shadow-lg bg-white/90 dark:bg-neutral-900/90 backdrop-blur text-center"
        >
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-red-600">令牌无效</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            重置令牌无效或已过期，请重新申请密码重设
          </p>
          <Link 
            href="/forgot-password"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
          >
            重新申请
          </Link>
        </motion.div>
      </div>
    );
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
        
        <h1 className="text-xl font-semibold text-center">重设密码</h1>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          请输入您的新密码
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            placeholder="新密码（至少6位）"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            minLength={6}
          />
          
          <input
            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            placeholder="确认新密码"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            minLength={6}
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
              <br />
              <span className="text-xs">3秒后自动跳转到登录页面...</span>
            </motion.div>
          )}
          
          <motion.button
            type="submit"
            disabled={loading || !password.trim() || !confirmPassword.trim()}
            className="w-full bg-blue-600 text-white rounded py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            {loading ? "重设中..." : "重设密码"}
          </motion.button>
        </form>

        <div className="text-center">
          <p className="text-xs text-neutral-500">
            记起密码了？<Link className="underline hover:text-blue-600" href="/login">返回登录</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-white to-slate-50 dark:from-black dark:to-neutral-950">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </motion.div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
