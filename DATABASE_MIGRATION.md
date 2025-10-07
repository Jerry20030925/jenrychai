# 数据库迁移指南

## 从 Prisma Postgres 迁移到 Vercel Postgres

### 问题
- 当前数据库连接数限制只有10个
- 导致消息保存失败
- 需要更好的连接池管理

### 解决方案
迁移到 Vercel Postgres，提供更好的连接池和更高的连接数限制。

## 迁移步骤

### 1. 在 Vercel 中创建新数据库

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择您的项目
3. 进入 "Storage" 标签
4. 点击 "Create Database"
5. 选择 "Postgres"
6. 选择 "Hobby" 计划（免费，有更好的连接池）

### 2. 获取环境变量

在 Vercel 数据库页面，复制以下环境变量：
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL` 
- `POSTGRES_URL_NON_POOLING`

### 3. 更新 Vercel 环境变量

在 Vercel 项目设置中添加新的环境变量：
1. 进入项目设置
2. 选择 "Environment Variables"
3. 添加上述三个环境变量
4. 确保所有环境都选中（Production, Preview, Development）

### 4. 本地测试

```bash
# 1. 安装依赖
npm install

# 2. 生成 Prisma 客户端
npm run db:generate

# 3. 推送数据库结构
npm run db:push

# 4. 运行迁移脚本（可选，如果需要迁移现有数据）
npm run migrate
```

### 5. 部署

```bash
# 部署到 Vercel
npx vercel --prod
```

## 验证迁移

1. 访问网站
2. 创建新会话
3. 发送消息
4. 检查消息是否正确保存
5. 切换会话后消息是否仍然存在

## 优势

- **更好的连接池管理** - Vercel Postgres 有内置连接池
- **更高的连接数限制** - Hobby 计划支持更多并发连接
- **更好的性能** - 优化的查询性能
- **与 Vercel 平台集成** - 更好的部署体验

## 回滚计划

如果迁移出现问题，可以：
1. 恢复 `DATABASE_URL` 环境变量
2. 恢复 Prisma schema 中的 `url` 配置
3. 重新部署

## 注意事项

- 迁移前请备份现有数据
- 确保新数据库环境变量正确设置
- 测试所有功能是否正常工作
