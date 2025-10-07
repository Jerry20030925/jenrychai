# Vercel 部署指南

## 部署前准备

### 1. 环境变量配置
在 Vercel 项目设置中配置以下环境变量：

#### 必需的环境变量：
- `DATABASE_URL`: PostgreSQL 数据库连接字符串
- `NEXTAUTH_SECRET`: NextAuth 密钥（建议使用强随机字符串）
- `NEXTAUTH_URL`: 应用URL（Vercel会自动设置）
- `OPENAI_API_KEY`: OpenAI API 密钥

#### 可选的环境变量：
- `NODE_ENV`: 设置为 "production"

### 2. 数据库设置
推荐使用以下数据库服务：
- **Vercel Postgres** (推荐)
- **PlanetScale**
- **Supabase**
- **Neon**

## 部署步骤

### 方法一：通过 Vercel CLI
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 在项目根目录执行部署
vercel

# 生产环境部署
vercel --prod
```

### 方法二：通过 GitHub 集成
1. 将代码推送到 GitHub 仓库
2. 在 Vercel 控制台连接 GitHub 仓库
3. 配置环境变量
4. 自动部署

## 部署后验证

1. 检查部署日志是否有错误
2. 访问应用URL测试功能
3. 测试用户注册/登录
4. 测试聊天功能
5. 检查数据库连接

## 常见问题解决

### 构建失败
- 检查环境变量是否正确设置
- 确保所有依赖都已安装
- 检查 Prisma 配置

### 数据库连接问题
- 验证 DATABASE_URL 格式
- 检查数据库服务是否正常运行
- 确保数据库允许外部连接

### NextAuth 问题
- 检查 NEXTAUTH_SECRET 是否设置
- 验证 NEXTAUTH_URL 是否正确
- 检查回调URL配置

## 性能优化建议

1. 启用 Vercel 的 Edge Functions
2. 配置适当的缓存策略
3. 优化图片和静态资源
4. 监控应用性能指标
