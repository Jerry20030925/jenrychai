// 测试图片分析功能
const fs = require('fs');
const path = require('path');

async function testImageAnalysis() {
  try {
    console.log('🧪 开始测试图片分析功能...');
    
    // 创建一个简单的测试图片（1x1像素的PNG）
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    // 创建FormData
    const formData = new FormData();
    const blob = new Blob([Buffer.from(testImageBase64, 'base64')], { type: 'image/png' });
    formData.append('file', blob, 'test.png');
    formData.append('prompt', '请分析这张图片的内容');
    
    const response = await fetch('https://jenrych-ai-jianwei-chens-projects.vercel.app/api/analyze-image', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ 错误响应:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ 图片分析结果:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testImageAnalysis();
