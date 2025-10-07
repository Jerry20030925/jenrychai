import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['@prisma/client'],
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
  },
  // 优化请求头大小
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
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
