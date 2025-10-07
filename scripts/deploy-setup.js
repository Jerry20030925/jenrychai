const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:k7p0azBccg7saihX@db.bsqsvmldrjyasgitprik.supabase.co:5432/postgres?sslmode=require",
    },
  },
});

async function setupDatabase() {
  try {
    console.log('🔄 设置Supabase数据库...');
    
    // 测试连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
    
    // 推送schema
    console.log('🔄 推送数据库schema...');
    const { execSync } = require('child_process');
    execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
    console.log('✅ 数据库schema推送成功');
    
    // 测试创建用户
    console.log('🔄 测试用户创建...');
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashed_password_test',
        passwordHash: 'hashed_password_test',
        name: '测试用户',
        phone: '13800138000',
        bio: '这是一个测试用户'
      }
    });
    console.log('✅ 测试用户创建成功:', testUser.id);
    
    // 清理测试用户
    await prisma.user.delete({
      where: { id: testUser.id }
    });
    console.log('✅ 测试用户清理完成');
    
    console.log('🎉 数据库设置完成！');
    
  } catch (error) {
    console.error('❌ 数据库设置失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();
