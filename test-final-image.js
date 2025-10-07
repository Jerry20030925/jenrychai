// 测试最终版本的图片分析功能
const BASE_URL = 'https://jenrych-piuxg3kys-jianwei-chens-projects.vercel.app';

async function testFinalImage() {
  console.log('🧪 测试最终版本的图片分析功能...\n');

  try {
    // 创建一个更复杂的测试图片
    const testImage = 'data:image/svg+xml;base64,' + Buffer.from(`
      <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="200" fill="linear-gradient(45deg, #ff6b6b, #4ecdc4)"/>
        <circle cx="80" cy="60" r="30" fill="yellow" stroke="orange" stroke-width="3"/>
        <rect x="150" y="30" width="80" height="60" fill="purple" rx="10"/>
        <text x="150" y="100" font-family="Arial" font-size="18" fill="white" text-anchor="middle">AI Analysis</text>
        <polygon points="50,150 100,120 150,150 100,180" fill="green"/>
        <text x="100" y="200" font-family="Arial" font-size="12" fill="white" text-anchor="middle">Test Image</text>
      </svg>
    `).toString('base64');

    console.log('1️⃣ 测试图片分析功能...');
    const imageResponse = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: '请详细分析这张图片，描述其中的所有元素、颜色、形状和文字内容。' }
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
    console.log('='.repeat(50));
    console.log(imageResult.reply?.content || '没有收到回复');
    console.log('='.repeat(50));

    // 测试图片+文本组合
    console.log('\n2️⃣ 测试图片+文本组合...');
    const comboResponse = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: '这张图片看起来像什么？请分析它的设计风格和可能的用途。' }
        ],
        attachments: {
          images: [testImage]
        },
        stream: false
      })
    });
    
    console.log('🖼️ 组合分析状态:', comboResponse.status);
    const comboResult = await comboResponse.json();
    console.log('🖼️ 组合分析结果:');
    console.log('='.repeat(50));
    console.log(comboResult.reply?.content || '没有收到回复');
    console.log('='.repeat(50));

    console.log('\n✅ 测试完成！');
    console.log('\n📝 说明：');
    console.log('- 如果图片分析返回详细描述，说明OpenAI API配置成功');
    console.log('- 如果仍然显示"图片分析服务暂时不可用"，说明环境变量可能还没有生效');
    console.log('- 可能需要等待几分钟让Vercel重新部署');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testFinalImage();
