# Vercel 环境变量设置指南

## 问题诊断

如果遇到"用户不存在"错误，即使已经注册过，说明 Vercel 环境变量配置不正确。

## 必需的环境变量

访问 Vercel 项目设置：https://vercel.com/jianwei-chens-projects/jenrych-ai/settings/environment-variables

### 1. 数据库连接（最重要！）

```env
DATABASE_URL=postgres://postgres.bsqsvmldrjyasgitprik:k7p0azBccg7saihX@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

DIRECT_URL=postgresql://postgres.bsqsvmldrjyasgitprik:k7p0azBccg7saihX@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### 2. Supabase 配置

```env
NEXT_PUBLIC_SUPABASE_URL=https://bsqsvmldrjyasgitprik.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcXN2bWxkcmp5YXNnaXRwcmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTAyNDksImV4cCI6MjA3NTMyNjI0OX0._4-Cy725_CqxEZ2WmLkhBh1HEpqEVy7qOofNLOSc_QE

SUPABASE_URL=https://bsqsvmldrjyasgitprik.supabase.co

SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcXN2bWxkcmp5YXNnaXRwcmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTAyNDksImV4cCI6MjA3NTMyNjI0OX0._4-Cy725_CqxEZ2WmLkhBh1HEpqEVy7qOofNLOSc_QE

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcXN2bWxkcmp5YXNnaXRwcmlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc1MDI0OSwiZXhwIjoyMDc1MzI2MjQ5fQ.KbS5jcOQir-ovRtjqEqhayZs-jL2RiM00DaAgw3B5mo
```

### 3. NextAuth 配置

```env
NEXTAUTH_URL=https://jenrych-6iql4ii5v-jianwei-chens-projects.vercel.app
NEXTAUTH_SECRET=your-secret-key-here-change-this-in-production
```

### 4. API Keys

```env
DEEPSEEK_API_KEY=your-deepseek-api-key
OPENAI_API_KEY=your-openai-api-key
TAVILY_API_KEY=your-tavily-api-key
```

> ⚠️ **重要**：请使用你自己的 API Keys，不要使用示例中的占位符。

### 5. Email 配置（可选）

```env
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=Jenrych AI <noreply@jenrychai.com>
```

## 设置步骤

1. **访问 Vercel 项目设置**
   - 登录 Vercel
   - 选择项目 `jenrych-ai`
   - 点击 Settings → Environment Variables

2. **添加所有环境变量**
   - 每个变量单独添加
   - 确保选择所有环境（Production, Preview, Development）
   - 特别注意 `DATABASE_URL` 必须正确！

3. **保存后重新部署**
   - 点击 Deployments
   - 找到最新部署
   - 点击 `...` → Redeploy

4. **验证部署**
   - 等待部署完成
   - 访问生产URL
   - 尝试登录

## 常见问题

### Q: 为什么本地可以登录，生产环境不行？
A: 因为 Vercel 环境变量和本地 `.env.local` 是独立的，必须在 Vercel 控制台单独设置。

### Q: DATABASE_URL 应该用哪个值？
A: 使用 **连接池 URL**（端口 6543），不要用直连 URL（端口 5432）。

### Q: 设置完环境变量后需要做什么？
A: 必须 **Redeploy**（重新部署）才能让新的环境变量生效。

### Q: 如何确认环境变量设置成功？
A: 查看部署日志，应该能看到：
- ✅ 数据库连接成功
- ✅ Supabase 配置正确
- ✅ 从数据库找到用户

## 调试步骤

1. **检查部署日志**
   ```
   访问: https://vercel.com/jianwei-chens-projects/jenrych-ai
   点击最新部署 → Logs → Build Logs
   搜索: "数据库连接" 或 "Database"
   ```

2. **测试数据库连接**
   ```
   访问: https://your-domain.com/api/test-db
   检查返回的JSON，确认数据库连接状态
   ```

3. **查看运行时日志**
   ```
   Vercel Dashboard → Functions → 最新请求
   查看登录API的日志输出
   ```

## 完整检查清单

- [ ] DATABASE_URL 已设置且正确
- [ ] DIRECT_URL 已设置
- [ ] NEXT_PUBLIC_SUPABASE_URL 已设置
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY 已设置
- [ ] NEXTAUTH_URL 已设置（生产域名）
- [ ] NEXTAUTH_SECRET 已设置
- [ ] 所有环境变量已选择 Production 环境
- [ ] 已点击 Redeploy 重新部署
- [ ] 部署成功完成
- [ ] 访问生产URL测试登录
