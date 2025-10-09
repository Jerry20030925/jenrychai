import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['@prisma/client'],
  images: {
    domains: ['localhost', 'www.google.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
  },
  // 性能优化
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  // 代码分割优化
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['framer-motion', 'react-markdown'],
  },
  // 构建优化
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // 减少响应头大小 - 已移动到 serverExternalPackages
  // 添加正确的重定向规则
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'jenrychai.com',
          },
        ],
        destination: 'https://www.jenrychai.com/:path*',
        permanent: true,
      },
    ];
  },
  // 简化headers配置以避免重定向问题
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
