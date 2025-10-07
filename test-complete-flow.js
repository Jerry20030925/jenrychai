// 测试完整的注册->重设密码->登录流程
const BASE_URL = 'https://jenrych-nwx8x2knt-jianwei-chens-projects.vercel.app';

async function testCompleteFlow() {
  console.log('🧪 开始测试完整的用户流程...\n');

  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'testpassword123';
  const newPassword = 'newpassword456';

  try {
    // 1. 注册新用户
    console.log('1️⃣ 注册新用户...');
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: testEmail, 
        password: testPassword,
        name: 'Test User',
        language: 'zh'
      })
    });
    
    const registerResult = await registerResponse.text();
    console.log('✅ 注册结果:', registerResult);
    
    if (!registerResponse.ok) {
      throw new Error(`注册失败: ${registerResponse.status}`);
    }

    // 2. 尝试用原密码登录
    console.log('\n2️⃣ 尝试用原密码登录...');
    const loginResponse1 = await fetch(`${BASE_URL}/api/auth/signin/credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: testEmail, 
        password: testPassword,
        redirect: false
      })
    });
    
    const loginResult1 = await loginResponse1.text();
    console.log('🔐 原密码登录结果:', loginResult1);

    // 3. 请求重设密码
    console.log('\n3️⃣ 请求重设密码...');
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

    // 4. 模拟重设密码（这里需要从日志获取真实token）
    console.log('\n4️⃣ 注意：请从Vercel日志中获取真实的重置令牌');
    console.log('   访问: https://vercel.com/jianwei-chens-projects/jenrych-ai');
    console.log('   在 Functions 标签页查看日志，找到类似这样的行：');
    console.log('   💾 Token stored: abc123def456...');
    
    // 使用一个测试令牌（实际应该从日志获取）
    const testToken = 'test-token-for-demo';
    console.log(`\n5️⃣ 使用测试令牌重设密码: ${testToken}`);
    
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

    // 6. 尝试用新密码登录
    console.log('\n6️⃣ 尝试用新密码登录...');
    const loginResponse2 = await fetch(`${BASE_URL}/api/auth/signin/credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: testEmail, 
        password: newPassword,
        redirect: false
      })
    });
    
    const loginResult2 = await loginResponse2.text();
    console.log('🔐 新密码登录结果:', loginResult2);

    console.log('\n✅ 测试完成！');
    console.log('\n📝 说明：');
    console.log('- 如果看到"重置令牌无效或已过期"，说明需要从Vercel日志获取真实令牌');
    console.log('- 如果登录仍然失败，可能是认证系统与重设密码系统不同步');
    console.log('- 检查Vercel日志中的调试信息来诊断问题');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testCompleteFlow();
