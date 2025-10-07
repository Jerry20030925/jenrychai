#!/bin/bash

echo "🚀 开始部署修复后的应用..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 构建项目
echo "🔨 构建项目..."
npm run build

# 检查构建是否成功
if [ $? -eq 0 ]; then
    echo "✅ 构建成功！"
    echo "🚀 准备部署到 Vercel..."
    
    # 部署到 Vercel
    npx vercel --prod
    
    echo "🎉 部署完成！"
    echo "📝 修复内容："
    echo "   - 简化了 NextAuth cookie 配置"
    echo "   - 减少了 JWT token 大小"
    echo "   - 优化了请求头配置"
    echo "   - 添加了中间件来减少响应头大小"
    echo ""
    echo "🔍 如果仍然出现 494 错误，请检查："
    echo "   1. Vercel 环境变量是否正确设置"
    echo "   2. 数据库连接是否正常"
    echo "   3. 是否有其他大型 cookie 或请求头"
else
    echo "❌ 构建失败，请检查错误信息"
    exit 1
fi
