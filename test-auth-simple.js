// 简化的认证测试
const BASE_URL = 'https://jenrych-nyw5de9v9-jianwei-chens-projects.vercel.app';

async function testAuthSimple() {
  console.log('🧪 开始简化认证测试...\n');

  try {
    // 1. 测试直接调用认证API
    console.log('1️⃣ 测试直接调用认证API...');
    
    // 首先获取CSRF token
    const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
    const csrfData = await csrfResponse.json();
    console.log('🔐 CSRF Token:', csrfData.csrfToken);

    // 使用正确的格式调用signin
    const signinResponse = await fetch(`${BASE_URL}/api/auth/signin/credentials`, {
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
    
    console.log('🔐 Signin状态:', signinResponse.status);
    console.log('🔐 Signin headers:', Object.fromEntries(signinResponse.headers.entries()));
    
    const signinResult = await signinResponse.text();
    console.log('🔐 Signin结果:', signinResult.substring(0, 500) + '...');

    // 2. 检查是否有Set-Cookie头
    const setCookieHeader = signinResponse.headers.get('set-cookie');
    if (setCookieHeader) {
      console.log('🍪 Set-Cookie:', setCookieHeader);
    } else {
      console.log('❌ 没有设置Cookie，登录可能失败');
    }

    // 3. 测试session
    console.log('\n2️⃣ 测试session...');
    const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`);
    const sessionResult = await sessionResponse.text();
    console.log('🔐 Session结果:', sessionResult);

    console.log('\n✅ 测试完成！');
    console.log('\n📝 分析：');
    console.log('- 如果signin返回HTML而不是JSON，说明NextAuth配置有问题');
    console.log('- 如果没有Set-Cookie头，说明认证失败');
    console.log('- 如果session为空，说明登录没有成功');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testAuthSimple();
