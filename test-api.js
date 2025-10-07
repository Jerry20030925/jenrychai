// 测试 DeepSeek API 是否正常工作
const testAPI = async () => {
  try {
    console.log('🧪 测试 DeepSeek API...');
    
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-fe6b55b3677d493cbeac4c8fec658b5e'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello!' }
        ],
        stream: false
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API 调用失败:', response.status, errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ API 调用成功:', data);
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
};

testAPI();
