import { NextRequest, NextResponse } from 'next/server';
import { KnowledgeExtractionResult } from '@/lib/semantic-search';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    // 简单的PDF文本提取（生产环境建议使用pdf-parse）
    const content = await extractPDFContent(file);
    
    if (!content) {
      return NextResponse.json({ error: 'Failed to extract PDF content' }, { status: 500 });
    }

    return NextResponse.json(content);
  } catch (error) {
    console.error('PDF extraction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function extractPDFContent(file: File): Promise<KnowledgeExtractionResult | null> {
  try {
    // 这里使用简单的文本提取，生产环境建议使用pdf-parse库
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // 简单的PDF文本提取（仅用于演示）
    // 生产环境应该使用专门的PDF解析库
    const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
    
    // 提取可读文本（简单实现）
    const readableText = text
      .replace(/[^\x20-\x7E\u4e00-\u9fff]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (readableText.length < 50) {
      return {
        title: file.name,
        content: 'PDF文件内容无法直接提取，请将PDF内容复制粘贴到聊天框中。',
        summary: 'PDF文件需要手动处理',
        keyPoints: ['PDF文件', '需要手动提取内容'],
        source: file.name,
        type: 'pdf',
        extractedAt: new Date().toISOString(),
      };
    }

    const summary = readableText.slice(0, 300) + (readableText.length > 300 ? '...' : '');
    const sentences = readableText.split(/[。！？.!?]/).filter(s => s.trim().length > 10);
    const keyPoints = sentences.slice(0, 5);

    return {
      title: file.name,
      content: readableText,
      summary,
      keyPoints,
      source: file.name,
      type: 'pdf',
      extractedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    return null;
  }
}
