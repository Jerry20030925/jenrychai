// 详细的登录调试测试
const BASE_URL = 'https://jenrych-nyw5de9v9-jianwei-chens-projects.vercel.app';

async function testLoginDebug() {
  console.log('🔍 开始详细登录调试...\n');

  try {
    // 1. 测试NextAuth API端点
    console.log('1️⃣ 测试NextAuth API端点...');
    const authResponse = await fetch(`${BASE_URL}/api/auth/providers`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    console.log('🔐 Auth providers状态:', authResponse.status);
    const authResult = await authResponse.text();
    console.log('🔐 Auth providers结果:', authResult.substring(0, 200) + '...');

    // 2. 测试credentials登录API
    console.log('\n2️⃣ 测试credentials登录API...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        email: 'admin@example.com',
        password: 'admin123',
        redirect: 'false',
        callbackUrl: '/'
      })
    });
    
    console.log('🔐 Credentials登录状态:', loginResponse.status);
    const loginResult = await loginResponse.text();
    console.log('🔐 Credentials登录结果:', loginResult.substring(0, 300) + '...');

    // 3. 测试signin API
    console.log('\n3️⃣ 测试signin API...');
    const signinResponse = await fetch(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123',
        redirect: false,
        callbackUrl: '/'
      })
    });
    
    console.log('🔐 Signin API状态:', signinResponse.status);
    const signinResult = await signinResponse.text();
    console.log('🔐 Signin API结果:', signinResult.substring(0, 300) + '...');

    // 4. 测试session状态
    console.log('\n4️⃣ 测试session状态...');
    const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    console.log('🔐 Session状态:', sessionResponse.status);
    const sessionResult = await sessionResponse.text();
    console.log('🔐 Session结果:', sessionResult);

    // 5. 测试CSRF token
    console.log('\n5️⃣ 测试CSRF token...');
    const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    console.log('🔐 CSRF状态:', csrfResponse.status);
    const csrfResult = await csrfResponse.text();
    console.log('🔐 CSRF结果:', csrfResult);

    console.log('\n✅ 调试测试完成！');
    console.log('\n📝 分析：');
    console.log('- 如果所有API都返回200，说明NextAuth配置正确');
    console.log('- 如果credentials登录失败，可能是认证逻辑有问题');
    console.log('- 如果session为空，说明登录没有成功');

  } catch (error) {
    console.error('❌ 调试测试失败:', error.message);
  }
}

// 运行测试
testLoginDebug();
