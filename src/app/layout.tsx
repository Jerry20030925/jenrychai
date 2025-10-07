import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Script from "next/script";
import NavBar from "./components/NavBar";

export const runtime = "nodejs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jenrych AI - 智能AI聊天助手 | 免费在线AI对话平台",
  description: "Jenrych AI是一个强大的AI聊天助手，提供智能对话、多模态分析、语义搜索等功能。支持图片、视频、PDF分析，是您的最佳AI工作伙伴。免费使用，无需注册即可体验。",
  keywords: "AI聊天,人工智能,聊天机器人,AI助手,智能对话,多模态AI,语义搜索,免费AI,在线AI,AI工具",
  metadataBase: new URL("https://jenrychai.com"),
  openGraph: {
    title: "Jenrych AI - 智能AI聊天助手 | 免费在线AI对话平台",
    description: "Jenrych AI是一个强大的AI聊天助手，提供智能对话、多模态分析、语义搜索等功能。支持图片、视频、PDF分析，是您的最佳AI工作伙伴。",
    url: "https://jenrychai.com",
    siteName: "Jenrych AI",
    type: "website",
    locale: "zh_CN",
    images: [
      {
        url: "/logo.svg",
        alt: "Jenrych AI - 智能AI聊天助手",
        width: 1200,
        height: 630,
      },
    ],
  },
  other: {
    "google-site-verification": process.env.NEXT_PUBLIC_GSC_VERIFICATION || "",
    "application-name": "Jenrych AI",
    "msapplication-TileColor": "#2563eb",
    "theme-color": "#2563eb",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jenrych AI - 智能AI聊天助手",
    description: "强大的AI聊天助手，支持多模态分析、语义搜索等功能。免费使用，无需注册。",
    images: ["/logo.svg"],
    creator: "@jenrychai",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
    shortcut: [
      { url: "/favicon.svg" },
    ],
  },
  alternates: {
    canonical: "https://jenrychai.com",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        {/* Favicon 多格式 + 缓存破除参数，兼容 Safari Pinned Tab */}
        <link rel="icon" type="image/svg+xml" href="/logo.svg?v=3" />
        <link rel="shortcut icon" href="/logo.svg?v=3" />
        <link rel="apple-touch-icon" href="/logo.svg?v=3" />
        <link rel="mask-icon" href="/logo.svg?v=3" color="#2563eb" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        {process.env.NEXT_PUBLIC_GSC_VERIFICATION && (
          <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GSC_VERIFICATION} />
        )}
        <Script id="org-schema" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Jenrych AI",
            url: "https://jenrych.ai",
            logo: "https://jenrych.ai/logo.svg",
            sameAs: [
              "https://x.com/",
            ],
            description: "Jenrych AI is an intelligent AI platform that helps you build and create with AI.",
          })}
        </Script>
        <Script id="breadcrumb-schema" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://jenrych.ai/" },
              { "@type": "ListItem", position: 2, name: "Chat" }
            ]
          })}
        </Script>
        <Script id="faq-schema" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "Jenrych AI 支持哪些语言？",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "网站界面支持 中文、English、日本語、한국어；AI 会根据你选择的语言作答。"
                }
              },
              {
                "@type": "Question",
                name: "可以上传哪些类型的文件？",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "目前支持图片与文本文件（txt、md、csv、json 等）；PDF 会以摘要形式解析。"
                }
              },
              {
                "@type": "Question",
                name: "是否支持联网搜索？",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "支持。开启“联网”后，AI 会结合实时搜索结果并在结尾提供参考链接列表。"
                }
              }
            ]
          })}
        </Script>
        <Script id="sitelinks-searchbox" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Jenrych AI",
            "alternateName": "JenrychAI",
            "description": "Jenrych AI是一个强大的AI聊天助手，提供智能对话、多模态分析、语义搜索等功能。支持图片、视频、PDF分析，是您的最佳AI工作伙伴。",
            "url": "https://jenrychai.com",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD",
              "description": "免费使用"
            },
            "featureList": [
              "智能AI对话",
              "多模态分析",
              "语义搜索",
              "图片分析",
              "视频分析",
              "PDF分析",
              "语音输入",
              "实时搜索"
            ],
            "author": {
              "@type": "Organization",
              "name": "Jenrych AI",
              "url": "https://jenrychai.com"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Jenrych AI",
              "url": "https://jenrychai.com",
              "logo": {
                "@type": "ImageObject",
                "url": "https://jenrychai.com/logo.svg"
              }
            },
            "potentialAction": {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: "https://jenrychai.com/search?q={search_term_string}"
              },
              "query-input": "required name=search_term_string"
            },
            "sameAs": [
              "https://jenrychai.com"
            ]
          })}
        </Script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} style={{ WebkitTapHighlightColor: 'transparent' }}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <NavBar />
            <main className="flex-1">
              {children}
            </main>
            <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-neutral-950/60">
              <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-4">
                    <span>© 2024 Jenrych AI</span>
                    <span className="hidden sm:inline">•</span>
                    <span>强大的AI助手平台</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <a href="/privacy" className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                      隐私政策
                    </a>
                    <span>•</span>
                    <a href="/terms" className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                      服务条款
                    </a>
                    <span>•</span>
                    <a href="/contact" className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                      联系我们
                    </a>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
