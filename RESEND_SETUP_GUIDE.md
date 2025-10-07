# Resend 邮件服务设置指南

本指南将帮助您设置 Resend 邮件服务，用于发送忘记密码邮件。

## 1. 注册 Resend 账户

1. 访问 [Resend 官网](https://resend.com)
2. 点击 "Sign Up" 注册账户
3. 验证您的邮箱地址

## 2. 获取 API 密钥

1. 登录 Resend 控制台
2. 进入 "API Keys" 页面
3. 点击 "Create API Key"
4. 输入密钥名称（如：jenrych-ai-production）
5. 选择权限（建议选择 "Sending access"）
6. 复制生成的 API 密钥（格式：`re_xxxxxxxxxx`）

## 3. 验证域名（推荐）

### 3.1 添加域名
1. 在 Resend 控制台进入 "Domains" 页面
2. 点击 "Add Domain"
3. 输入您的域名（如：jenrychai.com）
4. 按照提示添加 DNS 记录

### 3.2 DNS 记录设置
添加以下 DNS 记录到您的域名：

**TXT 记录（用于验证）：**
```
Name: @
Value: resend._domainkey
```

**CNAME 记录（用于跟踪）：**
```
Name: resend
Value: resend.com
```

### 3.3 验证域名
1. 等待 DNS 记录生效（通常需要几分钟到几小时）
2. 在 Resend 控制台点击 "Verify Domain"
3. 验证成功后，您可以使用 `noreply@yourdomain.com` 作为发件人

## 4. 配置环境变量

### 4.1 在 Vercel 中设置
```bash
# 设置 Resend API 密钥
npx vercel env add RESEND_API_KEY
# 输入您的 API 密钥：re_xxxxxxxxxx

# 设置发件人邮箱
npx vercel env add RESEND_FROM_EMAIL
# 输入：Your App Name <noreply@yourdomain.com>
```

### 4.2 在本地开发环境设置
创建 `.env.local` 文件：
```env
RESEND_API_KEY=re_xxxxxxxxxx
RESEND_FROM_EMAIL=Your App Name <noreply@yourdomain.com>
```

## 5. 测试邮件发送

### 5.1 使用测试邮箱
Resend 提供测试邮箱功能：
- 在开发环境中，邮件会发送到 `delivered@resend.dev`
- 您可以在 Resend 控制台的 "Logs" 页面查看邮件

### 5.2 测试忘记密码功能
1. 访问您的应用
2. 点击 "忘记密码？"
3. 输入任意邮箱地址
4. 检查 Resend 控制台的 "Logs" 页面
5. 或使用测试邮箱 `delivered@resend.dev`

## 6. 生产环境配置

### 6.1 域名验证
确保您的域名已通过 Resend 验证，这样可以：
- 提高邮件送达率
- 避免被标记为垃圾邮件
- 使用自定义发件人地址

### 6.2 监控邮件发送
1. 在 Resend 控制台查看发送统计
2. 监控邮件送达率和打开率
3. 设置邮件发送限制和告警

## 7. 常见问题

### Q: 邮件发送失败怎么办？
A: 检查以下几点：
- API 密钥是否正确
- 发件人邮箱是否已验证
- 域名是否已通过验证
- 查看 Resend 控制台的错误日志

### Q: 如何提高邮件送达率？
A: 建议：
- 验证您的域名
- 设置 SPF、DKIM 记录
- 避免使用垃圾邮件关键词
- 保持合理的发送频率

### Q: 可以发送多少邮件？
A: Resend 的免费计划：
- 每月 3,000 封邮件
- 每天 100 封邮件
- 如需更多，请升级到付费计划

## 8. 安全建议

1. **保护 API 密钥**：
   - 不要在代码中硬编码 API 密钥
   - 使用环境变量存储
   - 定期轮换密钥

2. **限制发送频率**：
   - 实现发送频率限制
   - 防止滥用忘记密码功能

3. **验证收件人**：
   - 确保邮箱地址格式正确
   - 避免发送到无效邮箱

## 9. 代码示例

### 发送忘记密码邮件
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const { data, error } = await resend.emails.send({
  from: 'Your App <noreply@yourdomain.com>',
  to: ['user@example.com'],
  subject: '重设密码',
  html: '<p>请点击链接重设密码...</p>',
});
```

### 错误处理
```typescript
if (error) {
  console.error('邮件发送失败:', error);
  // 处理错误
} else {
  console.log('邮件发送成功:', data);
}
```

## 10. 邮件模板预览

我们使用 React Email 组件创建了美观的邮件模板：

### 10.1 查看邮件模板
访问 `/email-preview` 页面可以预览所有邮件模板：
- 密码重设邮件
- 欢迎邮件

### 10.2 自定义邮件模板
邮件模板位于 `src/lib/email-templates.tsx`，您可以：
- 修改邮件样式和布局
- 添加更多邮件类型
- 自定义品牌元素

### 10.3 邮件模板特点
- ✅ 响应式设计，适配各种邮件客户端
- ✅ 使用 React Email 组件，易于维护
- ✅ 支持中文和英文
- ✅ 包含安全提示和品牌元素
- ✅ 优雅的视觉设计

## 11. 支持

- [Resend 官方文档](https://resend.com/docs)
- [React Email 文档](https://react.email/docs)
- [Resend 支持中心](https://resend.com/support)
- [GitHub Issues](https://github.com/resend/resend/issues)

---

完成以上设置后，您的应用就可以通过 Resend 发送真实的忘记密码邮件了！
