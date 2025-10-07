#!/bin/bash

echo "🚀 开始生产环境部署..."

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ 请先安装 Vercel CLI: npm i -g vercel"
    exit 1
fi

# 生成 Prisma Client
echo "📦 生成 Prisma Client..."
npx prisma generate

# 构建项目
echo "🔨 构建项目..."
npm run build

# 检查构建是否成功
if [ $? -ne 0 ]; then
    echo "❌ 构建失败，请检查错误信息"
    exit 1
fi

echo "✅ 本地构建成功！"
echo ""
echo "📋 接下来需要在 Vercel 控制台设置以下环境变量："
echo ""
echo "必需的环境变量："
echo "- DATABASE_URL: 你的 Supabase 数据库连接字符串"
echo "- NEXTAUTH_SECRET: 32位随机字符串 (可用: openssl rand -base64 32)"
echo "- NEXTAUTH_URL: 你的生产域名 (如: https://your-app.vercel.app)"
echo ""
echo "可选的环境变量："
echo "- DEEPSEEK_API_KEY: AI API 密钥"
echo "- RESEND_API_KEY: 邮件服务密钥"
echo "- RESEND_FROM_EMAIL: 发件人邮箱"
echo ""
echo "🌐 设置完环境变量后，运行以下命令部署："
echo "vercel --prod"
echo ""
echo "或者访问 Vercel 控制台进行一键部署。"
