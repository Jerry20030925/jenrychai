const { PrismaClient } = require('@prisma/client');

// 旧数据库（Prisma Postgres）
const oldPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.OLD_DATABASE_URL, // 旧数据库URL
    },
  },
});

// 新数据库（Supabase）
const newPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL, // 新数据库URL
    },
  },
});

async function migrateData() {
  try {
    console.log('🔄 Starting data migration...');
    
    // 迁移用户数据
    console.log('📊 Migrating users...');
    const users = await oldPrisma.user.findMany();
    for (const user of users) {
      await newPrisma.user.upsert({
        where: { id: user.id },
        update: user,
        create: user,
      });
    }
    console.log(`✅ Migrated ${users.length} users`);
    
    // 迁移会话数据
    console.log('📊 Migrating conversations...');
    const conversations = await oldPrisma.conversation.findMany();
    for (const conversation of conversations) {
      await newPrisma.conversation.upsert({
        where: { id: conversation.id },
        update: conversation,
        create: conversation,
      });
    }
    console.log(`✅ Migrated ${conversations.length} conversations`);
    
    // 迁移消息数据
    console.log('📊 Migrating messages...');
    const messages = await oldPrisma.message.findMany();
    for (const message of messages) {
      await newPrisma.message.upsert({
        where: { id: message.id },
        update: message,
        create: message,
      });
    }
    console.log(`✅ Migrated ${messages.length} messages`);
    
    // 迁移反馈数据
    console.log('📊 Migrating feedback...');
    const feedbacks = await oldPrisma.feedback.findMany();
    for (const feedback of feedbacks) {
      await newPrisma.feedback.upsert({
        where: { id: feedback.id },
        update: feedback,
        create: feedback,
      });
    }
    console.log(`✅ Migrated ${feedbacks.length} feedbacks`);
    
    console.log('🎉 Data migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await oldPrisma.$disconnect();
    await newPrisma.$disconnect();
  }
}

migrateData();
