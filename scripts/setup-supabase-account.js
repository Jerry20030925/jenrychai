const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres.kvmvefczgzjdlkjnrisp:mOqVNIZSigU3eG5N@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1",
    },
  },
});

async function setupSupabaseAccount() {
  try {
    console.log('🔄 正在设置Supabase账户存储...');
    
    // 测试数据库连接
    await prisma.$connect();
    console.log('✅ Supabase数据库连接成功');
    
    // 检查用户表是否存在
    const userCount = await prisma.user.count();
    console.log(`📊 当前用户数量: ${userCount}`);
    
    // 检查是否有测试用户
    const testUser = await prisma.user.findFirst({
      where: {
        email: {
          contains: 'test'
        }
      }
    });
    
    if (testUser) {
      console.log('👤 找到测试用户:', {
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        phone: testUser.phone,
        bio: testUser.bio
      });
    }
    
    // 测试创建用户
    const testUserId = `test_user_${Date.now()}`;
    const testUserData = {
      id: testUserId,
      email: `test_${Date.now()}@example.com`,
      password: 'hashed_password_test',
      passwordHash: 'hashed_password_test',
      name: '测试用户',
      phone: '13800138000',
      bio: '这是一个测试用户账户',
    };
    
    try {
      const createdUser = await prisma.user.create({
        data: testUserData
      });
      console.log('✅ 测试用户创建成功:', createdUser.id);
      
      // 测试更新用户
      const updatedUser = await prisma.user.update({
        where: { id: testUserId },
        data: {
          name: '更新的测试用户',
          phone: '13900139000',
          bio: '这是更新后的用户信息'
        }
      });
      console.log('✅ 用户信息更新成功');
      
      // 清理测试用户
      await prisma.user.delete({
        where: { id: testUserId }
      });
      console.log('✅ 测试用户清理完成');
      
    } catch (createError) {
      console.log('⚠️ 测试用户创建失败:', createError.message);
    }
    
    console.log('🎉 Supabase账户存储设置完成！');
    
  } catch (error) {
    console.error('❌ 设置失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupSupabaseAccount();
