const { createClient } = require('@supabase/supabase-js');

// Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 环境变量');
  console.log('需要设置:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function initDatabase() {
  console.log('🚀 开始初始化 Supabase 数据库...');

  try {
    // 创建用户表
    console.log('📝 创建 users 表...');
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT,
          image TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (usersError) {
      console.error('❌ 创建 users 表失败:', usersError);
    } else {
      console.log('✅ users 表创建成功');
    }

    // 创建对话表
    console.log('📝 创建 conversations 表...');
    const { error: conversationsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS conversations (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          title TEXT NOT NULL,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (conversationsError) {
      console.error('❌ 创建 conversations 表失败:', conversationsError);
    } else {
      console.log('✅ conversations 表创建成功');
    }

    // 创建消息表
    console.log('📝 创建 messages 表...');
    const { error: messagesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (messagesError) {
      console.error('❌ 创建 messages 表失败:', messagesError);
    } else {
      console.log('✅ messages 表创建成功');
    }

    // 创建记忆表
    console.log('📝 创建 memories 表...');
    const { error: memoriesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS memories (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          category TEXT NOT NULL,
          importance INTEGER DEFAULT 5,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (memoriesError) {
      console.error('❌ 创建 memories 表失败:', memoriesError);
    } else {
      console.log('✅ memories 表创建成功');
    }

    // 创建索引
    console.log('📝 创建索引...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);',
      'CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category);'
    ];

    for (const indexSql of indexes) {
      const { error } = await supabase.rpc('exec_sql', { sql: indexSql });
      if (error) {
        console.error('❌ 创建索引失败:', error);
      }
    }

    console.log('✅ 索引创建完成');

    console.log('🎉 数据库初始化完成！');
    console.log('📊 表结构:');
    console.log('- users: 用户信息');
    console.log('- conversations: 对话记录');
    console.log('- messages: 消息内容');
    console.log('- memories: 用户记忆');

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };
