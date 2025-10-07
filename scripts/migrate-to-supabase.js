const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:k7p0azBccg7saihX@db.bsqsvmldrjyasgitprik.supabase.co:5432/postgres?sslmode=require",
    },
  },
});

async function migrateToSupabase() {
  try {
    console.log('🔄 开始迁移到Supabase数据库...');
    
    // 测试连接
    await prisma.$connect();
    console.log('✅ Supabase数据库连接成功');
    
    // 推送schema到数据库
    console.log('🔄 推送数据库schema...');
    const { execSync } = require('child_process');
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ 数据库schema推送成功');
    
    // 测试创建用户
    console.log('🔄 测试创建用户...');
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashed_password_test',
        passwordHash: 'hashed_password_test',
        name: '测试用户',
        phone: '13800138000',
        bio: '这是一个测试用户账户'
      }
    });
    console.log('✅ 测试用户创建成功:', testUser.id);
    
    // 测试更新用户
    const updatedUser = await prisma.user.update({
      where: { id: testUser.id },
      data: {
        name: '更新的测试用户',
        phone: '13900139000',
        bio: '这是更新后的用户信息'
      }
    });
    console.log('✅ 用户更新成功');
    
    // 清理测试用户
    await prisma.user.delete({
      where: { id: testUser.id }
    });
    console.log('✅ 测试用户清理完成');
    
    console.log('🎉 Supabase数据库迁移完成！');
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateToSupabase();