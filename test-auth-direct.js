// 直接测试认证逻辑
const BASE_URL = 'https://jenrych-eeoyiftje-jianwei-chens-projects.vercel.app';

async function testAuthDirect() {
  console.log('🧪 直接测试认证逻辑...\n');

  try {
    // 1. 测试一个简单的API端点
    console.log('1️⃣ 测试简单API端点...');
    const testResponse = await fetch(`${BASE_URL}/api/test-db`);
    console.log('✅ 测试API状态:', testResponse.status);

    // 2. 测试NextAuth配置
    console.log('\n2️⃣ 测试NextAuth配置...');
    const configResponse = await fetch(`${BASE_URL}/api/auth/providers`);
    const config = await configResponse.json();
    console.log('✅ NextAuth配置:', config);

    // 3. 测试CSRF
    console.log('\n3️⃣ 测试CSRF...');
    const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
    const csrf = await csrfResponse.json();
    console.log('✅ CSRF Token:', csrf.csrfToken.substring(0, 20) + '...');

    // 4. 尝试不同的登录方式
    console.log('\n4️⃣ 尝试不同的登录方式...');
    
    // 方式1: 使用JSON格式
    const jsonLoginResponse = await fetch(`${BASE_URL}/api/auth/signin/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123',
        csrfToken: csrf.csrfToken,
        callbackUrl: '/',
        redirect: false
      })
    });
    
    console.log('🔐 JSON登录状态:', jsonLoginResponse.status);
    console.log('🔐 JSON登录Content-Type:', jsonLoginResponse.headers.get('content-type'));
    
    const jsonResult = await jsonLoginResponse.text();
    console.log('🔐 JSON登录结果:', jsonResult.substring(0, 100) + '...');

    // 方式2: 使用表单格式
    const formLoginResponse = await fetch(`${BASE_URL}/api/auth/signin/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        email: 'admin@example.com',
        password: 'admin123',
        csrfToken: csrf.csrfToken,
        callbackUrl: '/',
        redirect: 'false'
      })
    });
    
    console.log('🔐 表单登录状态:', formLoginResponse.status);
    console.log('🔐 表单登录Content-Type:', formLoginResponse.headers.get('content-type'));
    
    const formResult = await formLoginResponse.text();
    console.log('🔐 表单登录结果:', formResult.substring(0, 100) + '...');

    console.log('\n✅ 测试完成！');
    console.log('\n📝 分析：');
    console.log('- 如果两种方式都返回HTML，说明NextAuth配置有问题');
    console.log('- 如果Content-Type是text/html，说明被重定向到登录页面');
    console.log('- 需要检查Vercel日志中的错误信息');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testAuthDirect();
