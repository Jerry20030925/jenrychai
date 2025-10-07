// 测试简化版本的认证
const BASE_URL = 'https://jenrych-b19rjqyg8-jianwei-chens-projects.vercel.app';

async function testSimpleAuth() {
  console.log('🧪 测试简化版本的认证...\n');

  try {
    // 1. 测试简化认证的providers
    console.log('1️⃣ 测试简化认证的providers...');
    const providersResponse = await fetch(`${BASE_URL}/api/test-auth/providers`);
    const providers = await providersResponse.json();
    console.log('✅ 简化认证Providers:', providers);

    // 2. 获取CSRF token
    console.log('\n2️⃣ 获取CSRF token...');
    const csrfResponse = await fetch(`${BASE_URL}/api/test-auth/csrf`);
    const csrfData = await csrfResponse.json();
    console.log('✅ CSRF Token:', csrfData.csrfToken.substring(0, 20) + '...');

    // 3. 测试admin用户登录
    console.log('\n3️⃣ 测试admin用户登录...');
    const loginResponse = await fetch(`${BASE_URL}/api/test-auth/signin/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        email: 'admin@example.com',
        password: 'admin123',
        csrfToken: csrfData.csrfToken,
        callbackUrl: '/',
        redirect: 'false'
      })
    });
    
    console.log('🔐 登录状态:', loginResponse.status);
    console.log('🔐 Content-Type:', loginResponse.headers.get('content-type'));
    
    const loginResult = await loginResponse.text();
    console.log('🔐 登录结果:', loginResult.substring(0, 200) + '...');

    // 4. 检查是否有Set-Cookie头
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    if (setCookieHeader) {
      console.log('✅ 设置了Cookie:', setCookieHeader.substring(0, 100) + '...');
    } else {
      console.log('❌ 没有设置Cookie');
    }

    // 5. 测试session
    console.log('\n4️⃣ 测试session...');
    const sessionResponse = await fetch(`${BASE_URL}/api/test-auth/session`);
    const sessionResult = await sessionResponse.text();
    console.log('🔐 Session结果:', sessionResult);

    console.log('\n✅ 测试完成！');
    console.log('\n📝 分析：');
    console.log('- 如果简化版本工作正常，说明问题在原始配置中');
    console.log('- 如果简化版本也有问题，说明是NextAuth本身的问题');
    console.log('- 需要检查Vercel日志中的详细错误信息');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testSimpleAuth();
