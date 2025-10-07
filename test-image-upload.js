// 测试图片上传和功能按钮
const BASE_URL = 'https://jenrych-ac229rrsr-jianwei-chens-projects.vercel.app';

async function testImageUpload() {
  console.log('🧪 测试图片上传和功能按钮...\n');

  try {
    // 1. 测试聊天API是否正常工作
    console.log('1️⃣ 测试聊天API...');
    const chatResponse = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: '你好，请介绍一下你自己' }
        ],
        stream: false
      })
    });
    
    console.log('🔐 聊天API状态:', chatResponse.status);
    const chatResult = await chatResponse.text();
    console.log('🔐 聊天API结果:', chatResult.substring(0, 200) + '...');

    // 2. 测试图片上传功能
    console.log('\n2️⃣ 测试图片上传功能...');
    const imageTestResponse = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: '请分析这张图片' }
        ],
        attachments: {
          images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iYmx1ZSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkhlbGxvPC90ZXh0Pjwvc3ZnPg==']
        },
        stream: false
      })
    });
    
    console.log('🖼️ 图片测试状态:', imageTestResponse.status);
    const imageTestResult = await imageTestResponse.text();
    console.log('🖼️ 图片测试结果:', imageTestResult.substring(0, 300) + '...');

    console.log('\n✅ 测试完成！');
    console.log('\n📝 说明：');
    console.log('- 如果聊天API正常工作，说明基础功能正常');
    console.log('- 如果图片测试返回分析结果，说明图片分析功能正常');
    console.log('- 如果图片测试返回"图片分析服务暂时不可用"，说明需要配置OpenAI API密钥');
    console.log('- 功能按钮的动画效果需要在浏览器中测试');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testImageUpload();
