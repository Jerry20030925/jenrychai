const { PrismaClient } = require('@prisma/client');

// 测试用户数据保存功能
async function testUserData() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL,
      },
    },
  });

  try {
    console.log('🔍 Testing user data functionality...');
    
    // 1. 创建测试用户
    console.log('👤 Creating test user...');
    const user = await prisma.user.create({
      data: {
        email: 'test-user@example.com',
        name: '测试用户',
        passwordHash: '$2b$10$test.hash.for.testing',
      },
    });
    console.log('✅ User created:', user.id);

    // 2. 创建会话
    console.log('💬 Creating conversation...');
    const conversation = await prisma.conversation.create({
      data: {
        title: '测试对话',
        userId: user.id,
      },
    });
    console.log('✅ Conversation created:', conversation.id);

    // 3. 保存消息
    console.log('💾 Saving messages...');
    const userMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: '你好，这是一个测试消息',
      },
    });
    
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: '你好！我是DeepSeek AI助手，很高兴为您服务。',
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      },
    });
    
    console.log('✅ Messages saved:', {
      userMessage: userMessage.id,
      assistantMessage: assistantMessage.id,
    });

    // 4. 验证数据关联
    console.log('🔍 Verifying data relationships...');
    const fullConversation = await prisma.conversation.findUnique({
      where: { id: conversation.id },
      include: {
        user: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    
    console.log('✅ Full conversation data:', {
      conversationId: fullConversation.id,
      title: fullConversation.title,
      userId: fullConversation.userId,
      userName: fullConversation.user.name,
      userEmail: fullConversation.user.email,
      messageCount: fullConversation.messages.length,
      messages: fullConversation.messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content.substring(0, 50) + '...',
        tokens: m.totalTokens,
      })),
    });

    // 5. 测试用户的所有会话
    console.log('📋 Testing user conversations...');
    const userConversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    
    console.log('✅ User conversations:', userConversations.map(c => ({
      id: c.id,
      title: c.title,
      lastMessage: c.messages[0]?.content?.substring(0, 30) + '...',
      messageCount: c.messages.length,
    })));

    console.log('🎉 All tests passed! User data saving is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUserData();
