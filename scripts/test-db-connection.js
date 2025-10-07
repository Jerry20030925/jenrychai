const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres:k7p0azBccg7saihX@db.bsqsvmldrjyasgitprik.supabase.co:5432/postgres?sslmode=require",
      },
    },
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    console.log('🔄 测试数据库连接...');
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
    
    // 测试简单查询
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ 查询测试成功:', result);
    
  } catch (error) {
    console.error('❌ 连接失败:', error.message);
    console.error('错误详情:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
