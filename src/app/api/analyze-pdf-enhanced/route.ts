import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
});

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    // 将PDF转换为base64用于Vision API分析
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    // 使用OpenAI Vision API分析PDF
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `请详细分析这个PDF文件的内容。请提供：
1. 文档摘要（2-3句话）
2. 主要章节和结构
3. 关键信息和数据
4. 重要观点和结论
5. 实用建议和行动项
6. 文档类型和用途

请用中文回答，结构清晰，重点突出。如果PDF内容无法清晰读取，请说明原因并提供建议。`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:application/pdf;base64,${base64}`
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.3
    });

    const analysis = visionResponse.choices[0]?.message?.content || '无法分析PDF内容';

    // 解析分析结果
    const summary = extractSection(analysis, '摘要|总结|概述');
    const keyPoints = extractList(analysis, '关键|要点|重点');
    const insights = extractList(analysis, '建议|洞察|发现|结论');
    const structure = extractSection(analysis, '结构|章节|组织');

    return NextResponse.json({
      success: true,
      result: {
        type: 'pdf',
        title: `PDF分析 - ${file.name}`,
        summary: summary || 'PDF文档分析完成',
        keyPoints: keyPoints.length > 0 ? keyPoints : ['文档内容已分析'],
        insights: insights.length > 0 ? insights : ['请查看完整分析结果'],
        metadata: {
          size: file.size,
          format: file.type,
          pages: 1,
          structure: structure
        },
        fullAnalysis: analysis,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('PDF analysis error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'PDF analysis failed' 
      }, 
      { status: 500 }
    );
  }
}

function extractSection(text: string, pattern: string): string {
  const regex = new RegExp(`(${pattern})[：:]([^\\n]+)`, 'i');
  const match = text.match(regex);
  return match ? match[2].trim() : '';
}

function extractList(text: string, pattern: string): string[] {
  const lines = text.split('\n');
  const listItems: string[] = [];
  
  let inList = false;
  for (const line of lines) {
    if (line.match(new RegExp(`(${pattern})`, 'i'))) {
      inList = true;
      continue;
    }
    
    if (inList) {
      if (line.match(/^\d+\.|^[•·▪▫-]/)) {
        listItems.push(line.replace(/^\d+\.\s*|^[•·▪▫-]\s*/, '').trim());
      } else if (line.trim() === '') {
        break;
      }
    }
  }
  
  return listItems.filter(item => item.length > 0);
}
