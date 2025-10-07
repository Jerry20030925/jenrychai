// 测试内存存储的完整流程
const BASE_URL = 'https://jenrych-nyw5de9v9-jianwei-chens-projects.vercel.app';

async function testMemoryFlow() {
  console.log('🧪 开始测试内存存储流程...\n');

  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'testpassword123';
  const newPassword = 'newpassword456';

  try {
    // 1. 直接测试忘记密码（不需要注册）
    console.log('1️⃣ 请求忘记密码...');
    const forgotResponse = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: testEmail,
        language: 'zh'
      })
    });
    
    const forgotResult = await forgotResponse.text();
    console.log('📧 忘记密码请求结果:', forgotResult);
    
    if (!forgotResponse.ok) {
      throw new Error(`忘记密码请求失败: ${forgotResponse.status}`);
    }

    // 2. 检查Vercel日志获取真实令牌
    console.log('\n2️⃣ 请检查Vercel日志获取真实令牌：');
    console.log('   访问: https://vercel.com/jianwei-chens-projects/jenrych-ai');
    console.log('   在 Functions 标签页查看日志，找到类似这样的行：');
    console.log('   💾 Token stored: abc123def456...');
    console.log('   🔗 Reset URL: https://jenrychai.com/reset-password?token=abc123def456...');
    
    // 3. 使用测试令牌重设密码
    const testToken = 'test-token-for-demo';
    console.log(`\n3️⃣ 使用测试令牌重设密码: ${testToken}`);
    
    const resetResponse = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        token: testToken, 
        password: newPassword 
      })
    });
    
    const resetResult = await resetResponse.text();
    console.log('🔑 重设密码结果:', resetResult);

    // 4. 测试admin用户登录
    console.log('\n4️⃣ 测试admin用户登录...');
    const adminLoginResponse = await fetch(`${BASE_URL}/api/auth/signin/credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'admin@example.com', 
        password: 'admin123',
        redirect: false
      })
    });
    
    const adminLoginResult = await adminLoginResponse.text();
    console.log('🔐 Admin登录结果:', adminLoginResult);

    console.log('\n✅ 测试完成！');
    console.log('\n📝 说明：');
    console.log('- 如果admin登录成功，说明认证系统工作正常');
    console.log('- 如果重设密码显示"令牌无效"，说明需要真实令牌');
    console.log('- 要获取真实令牌，请查看Vercel日志');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testMemoryFlow();
