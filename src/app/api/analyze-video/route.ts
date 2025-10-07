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

    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'File must be a video file' }, { status: 400 });
    }

    // 由于浏览器限制，我们提供基础的视频信息分析
    // 实际应用中需要服务器端视频处理
    const videoUrl = await fileToDataURL(file);
    
    return NextResponse.json({
      success: true,
      result: {
        type: 'video',
        title: `视频分析 - ${file.name}`,
        summary: `视频文件 ${file.name}，大小 ${(file.size / 1024 / 1024).toFixed(2)}MB，格式 ${file.type}`,
        keyPoints: [
          '视频文件已上传',
          '需要服务器端处理进行深度分析',
          '建议使用专门的视频分析工具'
        ],
        insights: [
          '视频分析需要提取关键帧',
          '可以结合音频转录进行分析',
          '建议使用专业的视频AI工具'
        ],
        metadata: {
          size: file.size,
          format: file.type,
          duration: 0, // 需要客户端计算
          resolution: '未知'
        },
        recommendations: [
          '使用FFmpeg提取关键帧',
          '结合Whisper进行音频转录',
          '使用OpenAI Vision分析关键帧'
        ],
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Video analysis error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Video analysis failed' 
      }, 
      { status: 500 }
    );
  }
}

async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
