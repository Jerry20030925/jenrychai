import { NextRequest, NextResponse } from 'next/server';
import { KnowledgeExtractionResult } from '@/lib/semantic-search';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // 使用puppeteer或cheerio提取网页内容
    const content = await extractWebpageContent(url);
    
    if (!content) {
      return NextResponse.json({ error: 'Failed to extract content' }, { status: 500 });
    }

    return NextResponse.json(content);
  } catch (error) {
    console.error('Content extraction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function extractWebpageContent(url: string): Promise<KnowledgeExtractionResult | null> {
  try {
    // 简单的fetch提取（生产环境建议使用puppeteer）
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JenrychAI/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const html = await response.text();
    
    // 简单的HTML解析（生产环境建议使用cheerio）
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled';
    
    // 提取文本内容（简单实现）
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // 生成摘要
    const summary = textContent.slice(0, 300) + (textContent.length > 300 ? '...' : '');
    
    // 提取关键点（简单实现）
    const sentences = textContent.split(/[。！？.!?]/).filter(s => s.trim().length > 10);
    const keyPoints = sentences.slice(0, 5);

    return {
      title,
      content: textContent,
      summary,
      keyPoints,
      source: url,
      type: 'webpage',
      extractedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Webpage extraction error:', error);
    return null;
  }
}
