const { execSync } = require('child_process');

async function setupSupabaseDB() {
  try {
    console.log('🔍 设置Supabase数据库...');
    
    // 获取Supabase数据库URL
    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('❌ 未找到SUPABASE_URL环境变量');
      return;
    }
    
    console.log('✅ 找到Supabase URL:', supabaseUrl.replace(/\/\/.*@/, '//***@'));
    
    // 设置DATABASE_URL为Supabase URL
    process.env.DATABASE_URL = supabaseUrl;
    
    // 推送schema到Supabase
    console.log('📤 推送schema到Supabase...');
    execSync('npx prisma db push', { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: supabaseUrl }
    });
    
    console.log('✅ Supabase数据库设置完成');
    
  } catch (error) {
    console.error('❌ 设置Supabase数据库失败:', error.message);
  }
}

setupSupabaseDB();
