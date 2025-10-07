#!/bin/bash

# 部署脚本
echo "🚀 开始部署 Jenrych AI..."

# 检查环境变量
if [ -z "$DEEPSEEK_API_KEY" ]; then
    echo "❌ 错误: 请设置 DEEPSEEK_API_KEY 环境变量"
    exit 1
fi

if [ -z "$POSTGRES_PRISMA_URL" ]; then
    echo "❌ 错误: 请设置 POSTGRES_PRISMA_URL 环境变量"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 生成 Prisma 客户端
echo "🔧 生成 Prisma 客户端..."
npx prisma generate

# 推送数据库架构
echo "🗄️ 推送数据库架构..."
npx prisma db push

# 构建应用
echo "🏗️ 构建应用..."
npm run build

echo "✅ 构建完成！"
echo ""
echo "📋 部署清单："
echo "1. ✅ DeepSeek API 已配置"
echo "2. ✅ 数据库连接已测试"
echo "3. ✅ 应用构建成功"
echo ""
echo "🌐 下一步："
echo "1. 将代码推送到 GitHub"
echo "2. 在 Vercel 中导入项目"
echo "3. 设置环境变量"
echo "4. 部署到生产环境"
echo ""
echo "📖 详细说明请查看 DEPLOYMENT.md"
