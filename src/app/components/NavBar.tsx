"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function NavBar() {
  const { data: session, status, update } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [lang, setLang] = useState<string>(() => {
    if (typeof window === "undefined") return "zh";
    try { return localStorage.getItem("siteLang") || "zh"; } catch { return "zh"; }
  });
  useEffect(() => {
    try { localStorage.setItem("siteLang", lang); window.dispatchEvent(new CustomEvent("app:lang", { detail: lang })); } catch {}
  }, [lang]);
  const [loginHintClosed, setLoginHintClosed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try { return window.localStorage.getItem("loginHintClosed") === "1"; } catch { return false; }
  });

  // 简单 i18n（导航与提示）
  const i18n = {
    zh: {
      login: "登录",
      register: "注册",
      dashboard: "用户主页",
      account: "账户",
      logout: "退出",
      hint: "登录以保存对话、同步历史和在多端继续你的创作。",
      close: "关闭",
      collapse: "收起侧栏",
      expand: "展开侧栏",
      newChat: "新建会话",
    },
    en: {
      login: "Log in",
      register: "Sign up",
      dashboard: "Dashboard",
      account: "Account",
      logout: "Sign out",
      hint: "Log in to save chats, sync history and continue across devices.",
      close: "Dismiss",
      collapse: "Collapse sidebar",
      expand: "Expand sidebar",
      newChat: "New chat",
    },
    ja: {
      login: "ログイン",
      register: "登録",
      dashboard: "ダッシュボード",
      account: "アカウント",
      logout: "ログアウト",
      hint: "ログインして会話を保存し、履歴を同期し、複数端末で続行できます。",
      close: "閉じる",
      collapse: "サイドバーを閉じる",
      expand: "サイドバーを開く",
      newChat: "新しいチャット",
    },
    ko: {
      login: "로그인",
      register: "가입",
      dashboard: "대시보드",
      account: "계정",
      logout: "로그아웃",
      hint: "로그인하여 대화를 저장하고 기록을 동기화하세요.",
      close: "닫기",
      collapse: "사이드바 접기",
      expand: "사이드바 펼치기",
      newChat: "새 대화",
    },
  } as const;
  const t = (k: keyof typeof i18n.zh) => (i18n as any)[lang]?.[k] || i18n.zh[k];

  const [sidebarOpenNav, setSidebarOpenNav] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try { return (localStorage.getItem("sidebarOpen") ?? "1") === "1"; } catch { return true; }
  });
  const magnetRef = useRef<HTMLDivElement | null>(null);
  const [magnet, setMagnet] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isCoarse, setIsCoarse] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try { setIsCoarse(window.matchMedia("(pointer: coarse)").matches); } catch {}
  }, []);
  useEffect(() => {
    function onOpenChanged(e: Event) {
      try {
        // @ts-ignore
        const open = !!(e as any).detail;
        setSidebarOpenNav(open);
      } catch {}
    }
    if (typeof window !== "undefined") {
      window.addEventListener("app:sidebar-open-changed", onOpenChanged as any);
    }
    return () => { if (typeof window !== "undefined") window.removeEventListener("app:sidebar-open-changed", onOpenChanged as any); };
  }, []);

  return (
    <>
    <nav className="fixed top-0 inset-x-0 z-[60] w-full px-4 md:px-6 py-1 md:py-1.5 border-b border-neutral-200 dark:border-neutral-800 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-neutral-950/60 bg-white/90 dark:bg-neutral-950/80 flex items-center justify-between mobile-nav safe-area-inset">
      <div className="flex items-center gap-2">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Link href="/" className="flex items-center gap-2 font-semibold transition-opacity hover:opacity-90 pulse-border rounded-md px-1 touch-feedback">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img 
              src="/logo.svg" 
              alt="Jenrych" 
              className="h-6 w-auto md:floaty" 
              whileHover={{ rotate: [0, -5, 5, -5, 0] }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />
          </Link>
        </motion.div>
        <motion.div
          ref={magnetRef}
          onMouseMove={(e) => {
            if (isCoarse) return;
            const el = magnetRef.current; if (!el) return;
            const r = el.getBoundingClientRect();
            const dx = e.clientX - (r.left + r.width / 2);
            const dy = e.clientY - (r.top + r.height / 2);
            setMagnet({ x: dx * 0.08, y: dy * 0.08 });
          }}
          onMouseLeave={() => setMagnet({ x: 0, y: 0 })}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur px-1 py-0.5 mobile-reduced-effects"
          style={{ transform: `translate(${magnet.x}px, ${magnet.y}px)`, transition: "transform 180ms ease-out" }}
        >
          <motion.button
            aria-label={sidebarOpenNav ? t("collapse") : t("expand")}
            title={sidebarOpenNav ? t("collapse") : t("expand")}
            onClick={() => {
              try {
                window.dispatchEvent(new CustomEvent("app:toggle-history"));
                setSidebarOpenNav(prev => !prev);
              } catch {}
            }}
            className="rounded-full p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors touch-target touch-feedback"
            whileHover={{ scale: 1.05, backgroundColor: "rgba(0,0,0,0.05)" }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <motion.div
              animate={{ rotate: sidebarOpenNav ? 0 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {sidebarOpenNav ? (
                <motion.svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <path d="M8 5l8 7-8 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </motion.svg>
              ) : (
                <motion.svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </motion.svg>
              )}
            </motion.div>
          </motion.button>
          <motion.button
            aria-label={t("newChat")}
            title={t("newChat")}
            onClick={() => { try { window.dispatchEvent(new CustomEvent("app:new-conversation")); } catch {} }}
            className="rounded-full p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors touch-target touch-feedback"
            whileHover={{ scale: 1.05, backgroundColor: "rgba(0,0,0,0.05)" }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <motion.svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </motion.svg>
          </motion.button>
        </motion.div>
      </div>
      <div className="relative flex items-center gap-2 md:gap-3 text-sm">
        {/* 导航菜单 - 桌面端 - 已移除 */}
        
        {/* 搜索按钮 - 手机端优化 */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Link
            href="/search"
            className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <motion.svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              whileHover={{ rotate: 15 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </motion.svg>
            <span className="text-sm hidden sm:inline">搜索</span>
          </Link>
        </motion.div>
        
        {status === "authenticated" ? (
          <>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex items-center justify-center text-xs font-semibold touch-target touch-feedback"
              aria-label="用户菜单"
              title={session?.user?.email || session?.user?.name || "用户"}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {session?.user?.image ? (
                <img src={session.user.image as any} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                (session?.user?.name?.[0] || session?.user?.email?.[0] || "U").toUpperCase()
              )}
            </button>
            {menuOpen && (
              <>
                {/* 点击空白处关闭 */}
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-10 z-50 min-w-[180px] rounded-xl border border-neutral-200/80 dark:border-white/15 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-2xl overflow-hidden text-sm text-neutral-900 dark:text-neutral-100 mobile-modal">
                  
                  {/* 移动端导航链接 - 已移除 */}

                  {/* 账户管理 */}
                  <Link
                    href="/account"
                    onClick={() => setMenuOpen(false)}
                    className="block w-full text-left px-3 py-3 md:py-2 hover:bg-neutral-100/90 dark:hover:bg-white/10 touch-feedback flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    账户管理
                  </Link>

                  {/* 设置选项 */}
                  <motion.button
                    onClick={() => {
                      try {
                        window.dispatchEvent(new CustomEvent("app:show-settings"));
                        setMenuOpen(false);
                        if (typeof window !== "undefined" && 'vibrate' in navigator) {
                          navigator.vibrate(30);
                        }
                      } catch {}
                    }}
                    className="block w-full text-left px-3 py-3 md:py-2 hover:bg-neutral-100/90 dark:hover:bg-white/10 touch-feedback flex items-center gap-2"
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    设置
                  </motion.button>
                  
                  
                  <motion.button
                    onClick={() => {
                      try {
                        localStorage.removeItem("sidebarOpen");
                        window.dispatchEvent(new CustomEvent("app:signed-out"));
                        if (typeof window !== "undefined" && 'vibrate' in navigator) {
                          navigator.vibrate(50);
                        }
                      } catch {}
                      signOut({ callbackUrl: "/" });
                    }}
                    className="block w-full text-left px-3 py-3 md:py-2 hover:bg-neutral-100/90 dark:hover:bg-white/10 touch-feedback flex items-center gap-2"
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {t("logout")}
                  </motion.button>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <Link href="/login" className="touch-feedback px-2 py-1 rounded transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800">{t("login")}</Link>
            <Link href="/register" className="touch-feedback px-2 py-1 rounded transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800">{t("register")}</Link>
          </>
        )}
      </div>
    </nav>

    {/* 未登录提示条（平滑进出场） */}
    <AnimatePresence>
      {status === "unauthenticated" && !loginHintClosed && (
        <motion.div
          key="login-hint"
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
          className="fixed top-[60px] inset-x-0 z-30 flex items-center justify-center"
        >
          <motion.div
            layout
            className="mx-3 md:mx-0 max-w-3xl w-full bg-gradient-to-r from-blue-50/95 to-indigo-50/95 text-blue-900 border border-blue-200/80 rounded-xl px-4 py-2 text-xs md:text-sm flex items-center justify-between shadow-lg backdrop-blur-md mobile-spacing transform transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
          >
            <span className="motion-soft-in">{t("hint")}</span>
            <div className="flex items-center gap-2">
              <motion.span whileHover={{ y: -1 }} whileTap={{ scale: 0.95 }}>
                <Link href="/login" className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg btn-soft-glow transform transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95">{t("login")}</Link>
              </motion.span>
              <motion.span whileHover={{ y: -1 }} whileTap={{ scale: 0.95 }}>
                <Link href="/register" className="px-3 py-1.5 rounded-lg border border-blue-400/60 text-blue-800 bg-white/80 backdrop-blur-sm transform transition-all duration-200 hover:scale-105 hover:bg-white hover:border-blue-500 hover:shadow-md active:scale-95">{t("register")}</Link>
              </motion.span>
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.95 }}
                className="ml-1 px-2 py-1 rounded text-blue-900/70 hover:text-blue-900"
                onClick={() => { try { localStorage.setItem("loginHintClosed", "1"); } catch {}; setLoginHintClosed(true); }}
              >{t("close")}</motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}


