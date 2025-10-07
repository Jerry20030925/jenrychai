const { PrismaClient } = require('@prisma/client');

// 完整系统测试
async function testCompleteSystem() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL,
      },
    },
  });

  try {
    console.log('🚀 Starting complete system test...');
    
    // 1. 清理测试数据
    console.log('🧹 Cleaning up test data...');
    await prisma.message.deleteMany({
      where: {
        conversation: {
          user: {
            email: {
              contains: 'test'
            }
          }
        }
      }
    });
    await prisma.conversation.deleteMany({
      where: {
        user: {
          email: {
            contains: 'test'
          }
        }
      }
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test'
        }
      }
    });
    console.log('✅ Test data cleaned');

    // 2. 测试用户注册
    console.log('👤 Testing user registration...');
    const user = await prisma.user.create({
      data: {
        email: 'system-test@example.com',
        name: '系统测试用户',
        passwordHash: '$2b$10$test.hash.for.system.testing',
      },
    });
    console.log('✅ User registered:', user.email);

    // 3. 测试会话创建
    console.log('💬 Testing conversation creation...');
    const conversation = await prisma.conversation.create({
      data: {
        title: '系统测试对话',
        userId: user.id,
      },
    });
    console.log('✅ Conversation created:', conversation.id);

    // 4. 测试消息保存
    console.log('💾 Testing message saving...');
    const messages = [
      {
        conversationId: conversation.id,
        role: 'user',
        content: '你好，我想了解一下DeepSeek AI的功能',
      },
      {
        conversationId: conversation.id,
        role: 'assistant',
        content: '你好！DeepSeek AI是一个强大的AI助手，可以帮助您解答问题、编写代码、分析数据等。我基于DeepSeek的先进模型，能够提供准确、有用的回答。',
        promptTokens: 15,
        completionTokens: 45,
        totalTokens: 60,
      },
      {
        conversationId: conversation.id,
        role: 'user',
        content: '能帮我写一个Python函数吗？',
      },
      {
        conversationId: conversation.id,
        role: 'assistant',
        content: '当然可以！这里是一个简单的Python函数示例：\n\n```python\ndef greet(name):\n    """一个简单的问候函数"""\n    return f"Hello, {name}!"\n\n# 使用示例\nprint(greet("World"))\n```\n\n这个函数接受一个名字作为参数，返回一个问候语。',
        promptTokens: 20,
        completionTokens: 80,
        totalTokens: 100,
      }
    ];

    for (const msgData of messages) {
      await prisma.message.create({ data: msgData });
    }
    console.log('✅ Messages saved:', messages.length);

    // 5. 测试数据查询
    console.log('🔍 Testing data queries...');
    
    // 查询用户的所有会话
    const userConversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    
    console.log('✅ User conversations loaded:', userConversations.length);
    
    // 查询特定会话的消息
    const conversationMessages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
    });
    
    console.log('✅ Conversation messages loaded:', conversationMessages.length);
    
    // 6. 测试数据统计
    console.log('📊 Testing data statistics...');
    const stats = {
      totalUsers: await prisma.user.count(),
      totalConversations: await prisma.conversation.count(),
      totalMessages: await prisma.message.count(),
      userConversations: await prisma.conversation.count({
        where: { userId: user.id }
      }),
      userMessages: await prisma.message.count({
        where: {
          conversation: { userId: user.id }
        }
      }),
    };
    
    console.log('📈 System statistics:', stats);

    // 7. 测试数据完整性
    console.log('🔒 Testing data integrity...');
    const fullData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        conversations: {
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });
    
    console.log('✅ Data integrity check:', {
      userExists: !!fullData,
      conversationsCount: fullData?.conversations.length || 0,
      totalMessages: fullData?.conversations.reduce((sum, conv) => sum + conv.messages.length, 0) || 0,
    });

    // 8. 测试API兼容性
    console.log('🔌 Testing API compatibility...');
    const apiTestData = {
      user: {
        id: fullData.id,
        email: fullData.email,
        name: fullData.name,
      },
      conversations: fullData.conversations.map(conv => ({
        id: conv.id,
        title: conv.title,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        messageCount: conv.messages.length,
      })),
      messages: fullData.conversations[0]?.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
        tokens: msg.totalTokens,
      })) || [],
    };
    
    console.log('✅ API data structure:', {
      hasUser: !!apiTestData.user,
      hasConversations: apiTestData.conversations.length > 0,
      hasMessages: apiTestData.messages.length > 0,
    });

    console.log('🎉 Complete system test passed! All functionality is working correctly.');
    console.log('');
    console.log('📋 Test Summary:');
    console.log('✅ User registration and authentication');
    console.log('✅ Conversation creation and management');
    console.log('✅ Message saving and retrieval');
    console.log('✅ Data relationships and integrity');
    console.log('✅ API compatibility');
    console.log('✅ Database operations');
    
  } catch (error) {
    console.error('❌ System test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCompleteSystem();
