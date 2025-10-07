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

    // 使用OpenAI的Vision API来分析PDF
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "请分析这个PDF文件的内容，提取主要信息和关键点。如果无法读取，请说明原因并提供建议。"
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
      max_tokens: 2000
    });

    const analysis = response.choices[0]?.message?.content || '无法分析PDF内容';

    return NextResponse.json({
      success: true,
      result: {
        type: 'pdf',
        title: `PDF分析 - ${file.name}`,
        content: analysis,
        metadata: {
          size: file.size,
          format: file.type,
          filename: file.name
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('PDF analysis failed:', error);
    return NextResponse.json({ 
      success: false,
      error: 'PDF分析失败，请尝试将PDF内容复制粘贴到聊天框中',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
