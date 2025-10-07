This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Jenrych AI

一个用 DeepSeek API 驱动的中文 AI 问答网站。

### 环境变量

创建 `.env.local` 并填写：

```
# DeepSeek API 配置
DEEPSEEK_API_KEY=sk-fe6b55b3677d493cbeac4c8fec658b5e
DEEPSEEK_MODEL=deepseek-chat

# 数据库配置 (PostgreSQL)
POSTGRES_PRISMA_URL=postgresql://postgres:password@localhost:5432/jenrych_ai?schema=public
DATABASE_URL=postgresql://postgres:password@localhost:5432/jenrych_ai?schema=public

# NextAuth 配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=请替换为随机字符串（可用 `openssl rand -hex 32` 生成）

# 可选：Tavily 网络搜索 API
# TAVILY_API_KEY=your-tavily-api-key
```

若部署到 Vercel/服务器，请在对应平台的环境变量面板设置以上变量。

### 快速开始

1. **安装依赖**
```bash
npm install
```

2. **设置数据库**
```bash
# 启动 PostgreSQL 服务
brew services start postgresql@15

# 创建数据库
createdb jenrych_ai

# 推送数据库架构
npx prisma db push
```

3. **启动开发服务器**
```bash
npm run dev
```

浏览器打开 http://localhost:3000

### 部署

使用提供的部署脚本：

```bash
./deploy.sh
```

详细部署说明请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
