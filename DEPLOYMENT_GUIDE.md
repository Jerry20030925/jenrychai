# 🚀 生产环境部署指南

## ✅ 已完成的配置

- ✅ 将 Prisma schema 切换为 PostgreSQL
- ✅ 生产环境禁用 SQLite 回退，要求 DATABASE_URL
- ✅ 添加 postinstall 脚本自动生成 Prisma Client
- ✅ 本地构建测试通过

## 📋 部署步骤

### 1. 准备 Supabase 数据库

1. 访问 [Supabase Console](https://supabase.com/dashboard)
2. 创建新项目或使用现有项目
3. 在 Settings → Database 中复制连接字符串
4. 格式：`postgresql://postgres:password@db.xxx.supabase.co:5432/postgres?sslmode=require`

### 2. 设置 Vercel 环境变量

在 Vercel 项目设置 → Environment Variables 中添加：

#### 必需变量：
```bash
DATABASE_URL=postgresql://postgres:your_password@db.your_project.supabase.co:5432/postgres?sslmode=require
DIRECT_URL=postgresql://postgres:your_password@db.your_project.supabase.co:5432/postgres?sslmode=require
NEXTAUTH_SECRET=your-32-character-secret-key-here
NEXTAUTH_URL=https://your-domain.vercel.app
```

#### 可选变量：
```bash
DEEPSEEK_API_KEY=your-deepseek-api-key
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=Jenrych AI <noreply@yourdomain.com>
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

### 3. 生成 NEXTAUTH_SECRET

```bash
# 方法1: 使用 openssl
openssl rand -base64 32

# 方法2: 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. 初始化数据库

在本地设置 DATABASE_URL 后运行：

```bash
# 生成 Prisma Client
npx prisma generate

# 推送数据库结构到 Supabase
npx prisma db push
```

### 5. 部署到 Vercel

#### 方法1: 使用 Vercel CLI
```bash
# 安装 Vercel CLI (如果未安装)
npm i -g vercel

# 部署到生产环境
vercel --prod
```

#### 方法2: 使用 Git 推送
```bash
git add .
git commit -m "准备生产环境部署"
git push origin main
```

然后在 Vercel 控制台点击 "Redeploy"

### 6. 验证部署

1. 访问 `https://your-domain.vercel.app/api/db-status`
2. 应该看到：`{"success":true,"message":"PostgreSQL数据库连接正常"}`
3. 访问 `https://your-domain.vercel.app/admin/users` 查看用户管理界面
4. 测试用户注册和登录功能

## 🔧 故障排除

### 常见问题：

1. **构建失败**: 检查是否设置了所有必需的环境变量
2. **数据库连接失败**: 确认 DATABASE_URL 格式正确，Supabase 项目已启动
3. **NextAuth 错误**: 确认 NEXTAUTH_SECRET 已设置且足够长
4. **Prisma 错误**: 确认已运行 `npx prisma generate`

### 检查清单：

- [ ] Supabase 项目已创建并运行
- [ ] DATABASE_URL 和 DIRECT_URL 已设置
- [ ] NEXTAUTH_SECRET 已生成并设置
- [ ] NEXTAUTH_URL 指向正确的生产域名
- [ ] 数据库结构已推送到 Supabase
- [ ] 本地构建成功 (`npm run build`)

## 📊 部署后功能

- ✅ 用户注册和登录
- ✅ 数据持久化存储
- ✅ 用户管理界面 (`/admin/users`)
- ✅ 数据库状态检查 (`/api/db-status`)
- ✅ 支持 100+ 用户

## 🎯 下一步

部署成功后，您可以：
1. 测试用户注册功能
2. 配置自定义域名
3. 设置监控和日志
4. 优化性能和安全设置

---

**注意**: 生产环境使用 PostgreSQL 数据库，数据会持久化保存。本地开发环境如果没有设置 DATABASE_URL，会使用内存存储。
