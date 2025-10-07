const { PrismaClient } = require('@prisma/client');

async function testVercelDB() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 测试Vercel数据库连接...');
    
    // 测试连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
    
    // 检查User表是否存在
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ User表存在，当前用户数量: ${userCount}`);
    } catch (error) {
      console.error('❌ User表不存在或无法访问:', error.message);
    }
    
    // 检查Conversation表
    try {
      const convCount = await prisma.conversation.count();
      console.log(`✅ Conversation表存在，当前对话数量: ${convCount}`);
    } catch (error) {
      console.error('❌ Conversation表不存在或无法访问:', error.message);
    }
    
    // 检查Message表
    try {
      const msgCount = await prisma.message.count();
      console.log(`✅ Message表存在，当前消息数量: ${msgCount}`);
    } catch (error) {
      console.error('❌ Message表不存在或无法访问:', error.message);
    }
    
    // 尝试创建测试用户
    try {
      const testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          passwordHash: 'test-hash'
        }
      });
      console.log('✅ 测试用户创建成功:', testUser.id);
      
      // 清理测试用户
      await prisma.user.delete({
        where: { id: testUser.id }
      });
      console.log('✅ 测试用户已清理');
    } catch (error) {
      console.error('❌ 创建测试用户失败:', error.message);
    }
    
  } catch (error) {
    console.error('❌ 数据库测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testVercelDB();
