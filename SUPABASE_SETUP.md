# Supabase 数据库设置指南

## 为什么选择 Supabase？

- ✅ **500MB 免费数据库** - 比Neon的3GB更实用
- ✅ **无连接数限制** - 真正的serverless
- ✅ **无项目数限制** - 可以创建多个项目
- ✅ **无时间限制** - 24/7 可用
- ✅ **包含认证系统** - 可以替换 NextAuth
- ✅ **实时功能** - 支持实时更新
- ✅ **文件存储** - 可以存储图片等文件

## 设置步骤

### 1. 创建 Supabase 账户

1. 访问 [Supabase Console](https://supabase.com/dashboard)
2. 点击 "Start your project"
3. 使用 GitHub 账户登录

### 2. 创建新项目

1. 点击 "New Project"
2. 选择组织（或创建新组织）
3. 输入项目名称：`jenrych-ai`
4. 输入数据库密码（请记住这个密码）
5. 选择地区：`Northeast Asia (Singapore)` 或 `Southeast Asia (Singapore)`
6. 点击 "Create new project"

### 3. 获取连接字符串

项目创建完成后，进入项目：

1. 点击左侧菜单的 "Settings"
2. 选择 "Database"
3. 找到 "Connection string" 部分
4. 复制 "URI" 连接字符串

**连接字符串格式：**
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
```

### 4. 在 Vercel 中设置环境变量

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择您的项目
3. 进入 "Settings" → "Environment Variables"
4. 添加以下环境变量：

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `DATABASE_URL` | 从Supabase复制的连接字符串 | All |
| `DIRECT_URL` | 从Supabase复制的连接字符串 | All |

### 5. 本地测试

```bash
# 1. 安装依赖
npm install

# 2. 生成 Prisma 客户端
npx prisma generate

# 3. 推送数据库结构
npx prisma db push

# 4. 启动开发服务器
npm run dev
```

### 6. 部署到 Vercel

```bash
# 部署到 Vercel
npx vercel --prod
```

## 验证设置

1. 访问您的网站
2. 创建新会话
3. 发送消息
4. 检查消息是否正确保存
5. 切换会话后消息是否仍然存在

## 优势对比

| 特性 | Prisma Postgres | Neon 免费 | Supabase 免费 |
|------|----------------|-----------|---------------|
| 连接数限制 | 10个 | 无限制 | **无限制** |
| 数据库大小 | 有限 | 3GB | **500MB** |
| 项目数 | 1个 | 20个 | **无限制** |
| 时间限制 | 无 | 5小时/分支 | **无限制** |
| 额外功能 | 仅数据库 | 仅数据库 | **认证+实时+存储** |

## 故障排除

### 连接问题
- 确保环境变量正确设置
- 检查密码是否正确
- 验证SSL设置

### 迁移问题
- 确保旧数据库可访问
- 检查数据格式兼容性
- 验证外键关系

## 支持

- [Supabase 文档](https://supabase.com/docs)
- [Vercel 集成指南](https://vercel.com/docs/storage/supabase)
- [Prisma 与 Supabase 集成](https://www.prisma.io/docs/guides/database/using-supabase-with-prisma)
