// 测试OpenAI图片分析功能
const BASE_URL = 'https://jenrych-4sgu2h583-jianwei-chens-projects.vercel.app';

async function testOpenAIImage() {
  console.log('🧪 测试OpenAI图片分析功能...\n');

  try {
    // 创建一个简单的测试图片（SVG格式）
    const testImage = 'data:image/svg+xml;base64,' + Buffer.from(`
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="lightblue"/>
        <circle cx="100" cy="100" r="50" fill="red"/>
        <text x="100" y="110" font-family="Arial" font-size="16" fill="white" text-anchor="middle">Hello World</text>
        <rect x="50" y="150" width="100" height="20" fill="green"/>
        <text x="100" y="165" font-family="Arial" font-size="12" fill="white" text-anchor="middle">Test Image</text>
      </svg>
    `).toString('base64');

    console.log('1️⃣ 测试图片分析功能...');
    const imageResponse = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: '请详细分析这张图片，描述其中的内容、颜色、形状和文字。' }
        ],
        attachments: {
          images: [testImage]
        },
        stream: false
      })
    });
    
    console.log('🖼️ 图片分析状态:', imageResponse.status);
    const imageResult = await imageResponse.json();
    console.log('🖼️ 图片分析结果:');
    console.log(imageResult.reply?.content || '没有收到回复');

    // 测试多张图片
    console.log('\n2️⃣ 测试多张图片分析...');
    const testImage2 = 'data:image/svg+xml;base64,' + Buffer.from(`
      <svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
        <rect width="150" height="150" fill="yellow"/>
        <polygon points="75,25 125,75 75,125 25,75" fill="purple"/>
        <text x="75" y="80" font-family="Arial" font-size="14" fill="white" text-anchor="middle">Star</text>
      </svg>
    `).toString('base64');

    const multiImageResponse = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: '请分析这两张图片，比较它们的差异。' }
        ],
        attachments: {
          images: [testImage, testImage2]
        },
        stream: false
      })
    });
    
    console.log('🖼️ 多图片分析状态:', multiImageResponse.status);
    const multiImageResult = await multiImageResponse.json();
    console.log('🖼️ 多图片分析结果:');
    console.log(multiImageResult.reply?.content || '没有收到回复');

    console.log('\n✅ 测试完成！');
    console.log('\n📝 说明：');
    console.log('- 如果图片分析返回详细描述，说明OpenAI API配置成功');
    console.log('- 如果仍然显示"图片分析服务暂时不可用"，请检查Vercel环境变量配置');
    console.log('- 需要在Vercel控制台中添加OPENAI_API_KEY环境变量');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testOpenAIImage();
