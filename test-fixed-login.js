// 测试修复后的登录功能
const BASE_URL = 'https://jenrych-eeoyiftje-jianwei-chens-projects.vercel.app';

async function testFixedLogin() {
  console.log('🧪 测试修复后的登录功能...\n');

  try {
    // 1. 测试NextAuth providers
    console.log('1️⃣ 测试NextAuth providers...');
    const providersResponse = await fetch(`${BASE_URL}/api/auth/providers`);
    const providers = await providersResponse.json();
    console.log('✅ Providers:', Object.keys(providers));

    // 2. 获取CSRF token
    console.log('\n2️⃣ 获取CSRF token...');
    const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
    const csrfData = await csrfResponse.json();
    console.log('✅ CSRF Token:', csrfData.csrfToken.substring(0, 20) + '...');

    // 3. 测试admin用户登录
    console.log('\n3️⃣ 测试admin用户登录...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/signin/credentials`, {
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
    console.log('🔐 响应头:', Object.fromEntries(loginResponse.headers.entries()));
    
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
    const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`);
    const sessionResult = await sessionResponse.text();
    console.log('🔐 Session结果:', sessionResult);

    // 6. 测试登录页面
    console.log('\n5️⃣ 测试登录页面...');
    const pageResponse = await fetch(`${BASE_URL}/login`);
    console.log('🔐 登录页面状态:', pageResponse.status);

    console.log('\n✅ 测试完成！');
    console.log('\n📝 分析：');
    console.log('- 如果登录返回JSON而不是HTML，说明修复成功');
    console.log('- 如果有Set-Cookie头，说明认证成功');
    console.log('- 如果session有用户信息，说明登录完全成功');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testFixedLogin();
