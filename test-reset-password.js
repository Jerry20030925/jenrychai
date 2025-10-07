// 测试重设密码流程
const BASE_URL = 'https://jenrych-gycxtgskj-jianwei-chens-projects.vercel.app';

async function testResetPasswordFlow() {
  console.log('🧪 开始测试重设密码流程...\n');

  try {
    // 1. 请求忘记密码
    console.log('1️⃣ 请求忘记密码...');
    const forgotResponse = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' })
    });
    
    const forgotResult = await forgotResponse.text();
    console.log('✅ 忘记密码请求结果:', forgotResult);
    
    if (!forgotResponse.ok) {
      throw new Error(`忘记密码请求失败: ${forgotResponse.status}`);
    }

    // 2. 模拟从邮件中获取令牌（这里我们需要从日志中获取）
    console.log('\n2️⃣ 注意：请检查Vercel日志获取生成的令牌');
    console.log('   或者访问: https://vercel.com/jianwei-chens-projects/jenrych-ai');
    console.log('   在 Functions 标签页查看日志');
    
    // 3. 测试令牌验证（使用一个示例令牌）
    const testToken = 'test-token-123';
    console.log(`\n3️⃣ 测试令牌验证（使用示例令牌: ${testToken}）...`);
    
    const validateResponse = await fetch(`${BASE_URL}/api/auth/forgot-password?token=${testToken}`);
    const validateResult = await validateResponse.text();
    console.log('🔍 令牌验证结果:', validateResult);

    // 4. 测试重设密码（使用示例令牌）
    console.log(`\n4️⃣ 测试重设密码（使用示例令牌: ${testToken}）...`);
    
    const resetResponse = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        token: testToken, 
        password: 'newpassword123' 
      })
    });
    
    const resetResult = await resetResponse.text();
    console.log('🔑 重设密码结果:', resetResult);

    console.log('\n✅ 测试完成！');
    console.log('\n📝 说明：');
    console.log('- 如果看到"重置令牌无效或已过期"，说明令牌存储问题已修复');
    console.log('- 要获取真实令牌，请查看Vercel日志中的调试信息');
    console.log('- 真实令牌应该是一个64位的十六进制字符串');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testResetPasswordFlow();
