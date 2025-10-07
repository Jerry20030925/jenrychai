# 部署说明

## 环境变量配置

在部署前，请确保设置以下环境变量：

### 必需的环境变量

```bash
# DeepSeek API 配置
DEEPSEEK_API_KEY=sk-fe6b55b3677d493cbeac4c8fec658b5e
DEEPSEEK_MODEL=deepseek-chat

# 数据库配置 (PostgreSQL)
POSTGRES_PRISMA_URL=your-postgres-connection-string
DATABASE_URL=your-postgres-connection-string

# NextAuth 配置
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-production-secret-key-here
```

### 可选的环境变量

```bash
# Tavily 网络搜索 API (可选)
TAVILY_API_KEY=your-tavily-api-key
```

## 部署步骤

### 1. Vercel 部署

1. 将代码推送到 GitHub 仓库
2. 在 Vercel 中导入项目
3. 设置环境变量
4. 部署

### 2. 数据库设置

1. 使用 Vercel Postgres 或 Supabase
2. 更新 `POSTGRES_PRISMA_URL` 和 `DATABASE_URL`
3. 运行数据库迁移：`npx prisma db push`

### 3. 本地测试

```bash
# 安装依赖
npm install

# 生成 Prisma 客户端
npx prisma generate

# 推送数据库架构
npx prisma db push

# 启动开发服务器
npm run dev
```

## API 测试

```bash
# 测试聊天 API
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"你好"}],"stream":false}'
```

## 注意事项

1. DeepSeek API 密钥需要充值才能使用
2. 确保数据库连接字符串正确
3. 生产环境使用强密码作为 NEXTAUTH_SECRET
4. 定期备份数据库数据
