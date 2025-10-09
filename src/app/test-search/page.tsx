'use client';

import { useState } from 'react';

export default function TestSearchPage() {
  const [query, setQuery] = useState('今天悉尼天气');
  const [testType, setTestType] = useState('all');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch(`/api/test-search?query=${encodeURIComponent(query)}&type=${testType}`);
      
      if (!response.ok) {
        throw new Error(`测试失败: ${response.status}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🔍 联网搜索功能测试</h1>
        
        {/* 测试控制面板 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">测试配置</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                搜索查询
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入搜索查询..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                测试类型
              </label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部测试</option>
                <option value="tavily">仅Tavily</option>
                <option value="google">仅Google</option>
                <option value="semantic">仅综合搜索</option>
              </select>
            </div>
            
            <button
              onClick={runTest}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '测试中...' : '开始测试'}
            </button>
          </div>
        </div>

        {/* 错误显示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">❌</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">测试失败</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* 结果显示 */}
        {results && (
          <div className="space-y-6">
            {/* 环境配置 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">🔧 环境配置</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 rounded-md">
                  <div className="text-sm font-medium text-gray-700">Tavily API</div>
                  <div className={`text-sm ${results.environment.TAVILY_API_KEY.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                    {results.environment.TAVILY_API_KEY}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-md">
                  <div className="text-sm font-medium text-gray-700">Google API</div>
                  <div className={`text-sm ${results.environment.GOOGLE_API_KEY.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                    {results.environment.GOOGLE_API_KEY}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-md">
                  <div className="text-sm font-medium text-gray-700">Google 搜索引擎ID</div>
                  <div className={`text-sm ${results.environment.GOOGLE_SEARCH_ENGINE_ID.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                    {results.environment.GOOGLE_SEARCH_ENGINE_ID}
                  </div>
                </div>
              </div>
            </div>

            {/* 测试报告 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">📊 测试报告</h2>
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-md overflow-x-auto">
                {results.report}
              </pre>
            </div>

            {/* Tavily结果 */}
            {results.tavily && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">
                  🌐 Tavily搜索结果
                  <span className={`ml-2 text-sm font-normal ${results.tavily.success ? 'text-green-600' : 'text-red-600'}`}>
                    {results.tavily.success ? '✅ 成功' : '❌ 失败'}
                  </span>
                </h2>
                <div className="text-sm text-gray-600 mb-4">
                  结果数: {results.tavily.count || 0} | 响应时间: {results.tavily.responseTime}ms
                </div>
                {results.tavily.error && (
                  <div className="text-red-600 text-sm mb-4">错误: {results.tavily.error}</div>
                )}
                {results.tavily.results?.map((result: any, index: number) => (
                  <div key={index} className="border-b border-gray-200 py-3 last:border-b-0">
                    <div className="font-medium text-blue-600 hover:text-blue-800">
                      <a href={result.url} target="_blank" rel="noopener noreferrer">
                        {result.title}
                      </a>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{result.snippet}</div>
                    <div className="text-xs text-gray-500 mt-1">{result.url}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Google结果 */}
            {results.google && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">
                  🔍 Google搜索结果
                  <span className={`ml-2 text-sm font-normal ${results.google.success ? 'text-green-600' : 'text-red-600'}`}>
                    {results.google.success ? '✅ 成功' : '❌ 失败'}
                  </span>
                </h2>
                <div className="text-sm text-gray-600 mb-4">
                  结果数: {results.google.count || 0} | 响应时间: {results.google.responseTime}ms
                </div>
                {results.google.error && (
                  <div className="text-red-600 text-sm mb-4">错误: {results.google.error}</div>
                )}
                {results.google.results?.map((result: any, index: number) => (
                  <div key={index} className="border-b border-gray-200 py-3 last:border-b-0">
                    <div className="font-medium text-blue-600 hover:text-blue-800">
                      <a href={result.url} target="_blank" rel="noopener noreferrer">
                        {result.title}
                      </a>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{result.snippet}</div>
                    <div className="text-xs text-gray-500 mt-1">{result.url}</div>
                  </div>
                ))}
              </div>
            )}

            {/* 综合搜索结果 */}
            {results.semantic && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">
                  🔄 综合搜索结果
                  <span className={`ml-2 text-sm font-normal ${results.semantic.success ? 'text-green-600' : 'text-red-600'}`}>
                    {results.semantic.success ? '✅ 成功' : '❌ 失败'}
                  </span>
                </h2>
                <div className="text-sm text-gray-600 mb-4">
                  结果数: {results.semantic.count || 0} | 响应时间: {results.semantic.responseTime}ms
                </div>
                {results.semantic.error && (
                  <div className="text-red-600 text-sm mb-4">错误: {results.semantic.error}</div>
                )}
                {results.semantic.results?.map((result: any, index: number) => (
                  <div key={index} className="border-b border-gray-200 py-3 last:border-b-0">
                    <div className="font-medium text-blue-600 hover:text-blue-800">
                      <a href={result.url} target="_blank" rel="noopener noreferrer">
                        {result.title}
                      </a>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{result.snippet}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {result.url} | 来源: {result.source}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
