import { NextRequest, NextResponse } from "next/server";
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
    const prompt = formData.get('prompt') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // 将图片转换为base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type;
    
    // 使用OpenAI Vision API分析图片
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt || "请详细分析这张图片，包括：1. 图片内容描述 2. 主要物体和特征 3. 文字内容（如果有）4. 颜色和构图 5. 可能的用途或场景。请用中文回答。"
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64}`
              }
            }
          ]
        }
      ],
      max_tokens: 2000
    });

    const analysis = response.choices[0]?.message?.content || '无法分析图片内容';
    
    return NextResponse.json({
      success: true,
      result: {
        type: 'image',
        title: `图片分析 - ${file.name}`,
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
    console.error('图片分析失败:', error);
    return NextResponse.json({ 
      success: false,
      error: '图片分析失败，请检查图片格式或稍后重试',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

