'use client';

import { useState } from 'react';
import ReferenceSources from '../components/ReferenceSources';
import FaviconIcon from '../components/FaviconIcon';

export default function TestReferencesPage() {
  const [testMessage, setTestMessage] = useState(`根据最新信息，今天(10月9日)悉尼的天气情况如下：

**天气状况**: 多云
**气温**: 12°C ~ 28°C  
**风力**: 东北风2级

白天天气以多云为主，气温回升，但早晚温差较大，请注意适时增减衣物。

参考来源：[1][2][3]

<ref-data>{"type":"references","data":[{"url":"https://www.weather.com.cn/weather/601020101.shtml","title":"【悉尼天气】悉尼天气预报,天气预报一周,天气预报15天查询"},{"url":"https://www.accuweather.com/zh/au/sydney/22889/weather-forecast/22889","title":"悉尼, 新南威爾士,澳大利亞三日天氣預報 - AccuWeather"},{"url":"https://www.accuweather.com/zh/au/sydney/22889/hourly-weather-forecast/22889","title":"悉尼, 新南威爾士,澳大利亞每小時天氣 - AccuWeather"}]}</ref-data>`);

  const [references, setReferences] = useState([
    {
      url: "https://www.weather.com.cn/weather/601020101.shtml",
      title: "【悉尼天气】悉尼天气预报,天气预报一周,天气预报15天查询"
    },
    {
      url: "https://www.accuweather.com/zh/au/sydney/22889/weather-forecast/22889", 
      title: "悉尼, 新南威爾士,澳大利亞三日天氣預報 - AccuWeather"
    },
    {
      url: "https://www.accuweather.com/zh/au/sydney/22889/hourly-weather-forecast/22889",
      title: "悉尼, 新南威爾士,澳大利亞每小時天氣 - AccuWeather"
    }
  ]);

  // 解析消息内容中的参考来源
  const parseReferences = (content: string): { cleanContent: string; references: Array<{ url: string; title: string }> } => {
    const refDataMatch = content.match(/<ref-data>([\s\S]*?)<\/ref-data>/);
    if (!refDataMatch) {
      return { cleanContent: content, references: [] };
    }

    try {
      const refData = JSON.parse(refDataMatch[1]);
      if (refData.type === 'references' && Array.isArray(refData.data)) {
        const references = refData.data.map((item: any) => ({
          url: item.url || '',
          title: item.title || ''
        })).filter((ref: any) => ref.url && ref.title);
        
        const cleanContent = content.replace(/<ref-data>[\s\S]*?<\/ref-data>/, '').trim();
        return { cleanContent, references };
      }
    } catch (error) {
      console.error('解析参考来源失败:', error);
    }

    return { cleanContent: content, references: [] };
  };

  const { cleanContent, references: parsedReferences } = parseReferences(testMessage);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🔗 参考来源图标测试</h1>
        
        {/* 测试消息显示 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">测试消息</h2>
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap">{cleanContent}</div>
          </div>
          
          {/* 参考来源图标 */}
          {parsedReferences.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <ReferenceSources 
                sources={parsedReferences}
                className="justify-start"
              />
            </div>
          )}
        </div>

        {/* 单独测试FaviconIcon组件 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">FaviconIcon 组件测试</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">不同尺寸</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">小:</span>
                  <FaviconIcon url="https://www.weather.com.cn" title="中国天气网" size="sm" />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">中:</span>
                  <FaviconIcon url="https://www.accuweather.com" title="AccuWeather" size="md" />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">大:</span>
                  <FaviconIcon url="https://www.google.com" title="Google" size="lg" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">测试网站</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {references.map((ref, index) => (
                  <div key={index} className="flex flex-col items-center space-y-2 p-3 border border-gray-200 rounded-lg">
                    <FaviconIcon 
                      url={ref.url} 
                      title={ref.title} 
                      size="md"
                      onClick={() => window.open(ref.url, '_blank')}
                    />
                    <span className="text-xs text-center text-gray-600 truncate w-full">
                      {ref.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 参考来源组件测试 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">ReferenceSources 组件测试</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">默认样式</h3>
              <ReferenceSources sources={references} />
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">左对齐</h3>
              <ReferenceSources sources={references} className="justify-start" />
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">右对齐</h3>
              <ReferenceSources sources={references} className="justify-end" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
