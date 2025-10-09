import { NextRequest, NextResponse } from 'next/server';
import { performSemanticSearch, searchWithTavily, searchWithGoogle } from '@/lib/semantic-search';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '今天悉尼天气';
    const testType = searchParams.get('type') || 'all';

    console.log(`🧪 测试搜索功能 - 查询: "${query}", 类型: ${testType}`);

    const results: any = {
      query,
      timestamp: new Date().toISOString(),
      environment: {
        TAVILY_API_KEY: process.env.TAVILY_API_KEY ? '✅ 已配置' : '❌ 未配置',
        GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? '✅ 已配置' : '❌ 未配置',
        GOOGLE_SEARCH_ENGINE_ID: process.env.GOOGLE_SEARCH_ENGINE_ID ? '✅ 已配置' : '❌ 未配置',
      }
    };

    // 测试Tavily搜索
    if (testType === 'all' || testType === 'tavily') {
      console.log('🌐 测试Tavily搜索...');
      const startTime = Date.now();
      try {
        const tavilyResults = await searchWithTavily(query, 3);
        results.tavily = {
          success: true,
          count: tavilyResults.length,
          results: tavilyResults,
          responseTime: Date.now() - startTime
        };
      } catch (error) {
        results.tavily = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          responseTime: Date.now() - startTime
        };
      }
    }

    // 测试Google搜索
    if (testType === 'all' || testType === 'google') {
      console.log('🔍 测试Google搜索...');
      const startTime = Date.now();
      try {
        const googleResults = await searchWithGoogle(query, 3);
        results.google = {
          success: true,
          count: googleResults.length,
          results: googleResults,
          responseTime: Date.now() - startTime
        };
      } catch (error) {
        results.google = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          responseTime: Date.now() - startTime
        };
      }
    }

    // 测试综合搜索
    if (testType === 'all' || testType === 'semantic') {
      console.log('🔄 测试综合搜索...');
      const startTime = Date.now();
      try {
        const semanticResults = await performSemanticSearch(query, 5);
        results.semantic = {
          success: true,
          count: semanticResults.length,
          results: semanticResults,
          responseTime: Date.now() - startTime
        };
      } catch (error) {
        results.semantic = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          responseTime: Date.now() - startTime
        };
      }
    }

    // 生成测试报告
    const report = generateTestReport(results);
    results.report = report;

    return NextResponse.json(results, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('搜索测试失败:', error);
    return NextResponse.json({ 
      error: '搜索测试失败', 
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

function generateTestReport(results: any): string {
  const { tavily, google, semantic, environment } = results;
  
  let report = `📊 搜索功能测试报告\n`;
  report += `查询: "${results.query}"\n`;
  report += `时间: ${results.timestamp}\n\n`;
  
  report += `🔧 环境配置:\n`;
  report += `- Tavily API: ${environment.TAVILY_API_KEY}\n`;
  report += `- Google API: ${environment.GOOGLE_API_KEY}\n`;
  report += `- Google 搜索引擎ID: ${environment.GOOGLE_SEARCH_ENGINE_ID}\n\n`;
  
  if (tavily) {
    report += `🌐 Tavily搜索:\n`;
    report += `- 状态: ${tavily.success ? '✅ 成功' : '❌ 失败'}\n`;
    report += `- 结果数: ${tavily.count || 0}\n`;
    report += `- 响应时间: ${tavily.responseTime}ms\n`;
    if (tavily.error) report += `- 错误: ${tavily.error}\n`;
    report += `\n`;
  }
  
  if (google) {
    report += `🔍 Google搜索:\n`;
    report += `- 状态: ${google.success ? '✅ 成功' : '❌ 失败'}\n`;
    report += `- 结果数: ${google.count || 0}\n`;
    report += `- 响应时间: ${google.responseTime}ms\n`;
    if (google.error) report += `- 错误: ${google.error}\n`;
    report += `\n`;
  }
  
  if (semantic) {
    report += `🔄 综合搜索:\n`;
    report += `- 状态: ${semantic.success ? '✅ 成功' : '❌ 失败'}\n`;
    report += `- 结果数: ${semantic.count || 0}\n`;
    report += `- 响应时间: ${semantic.responseTime}ms\n`;
    if (semantic.error) report += `- 错误: ${semantic.error}\n`;
    report += `\n`;
  }
  
  // 总体评估
  const hasWorkingSearch = (tavily?.success && tavily.count > 0) || 
                          (google?.success && google.count > 0) || 
                          (semantic?.success && semantic.count > 0);
  
  report += `📈 总体评估:\n`;
  report += `- 搜索功能: ${hasWorkingSearch ? '✅ 正常' : '❌ 异常'}\n`;
  report += `- 建议: ${hasWorkingSearch ? '搜索功能运行正常' : '请检查API配置和环境变量'}\n`;
  
  return report;
}
