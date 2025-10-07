import { NextRequest, NextResponse } from 'next/server';
import { multimodalAnalyzer, MultimodalInput } from '@/lib/multimodal-analyzer';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const url = formData.get('url') as string;
    const text = formData.get('text') as string;
    const type = formData.get('type') as string;

    if (!type) {
      return NextResponse.json({ error: 'Type is required' }, { status: 400 });
    }

    let input: MultimodalInput;

    switch (type) {
      case 'image':
      case 'video':
      case 'pdf':
      case 'audio':
        if (!file) {
          return NextResponse.json({ error: 'File is required for this type' }, { status: 400 });
        }
        input = { file, type: type as any };
        break;
      case 'webpage':
        if (!url) {
          return NextResponse.json({ error: 'URL is required for webpage analysis' }, { status: 400 });
        }
        input = { url, type: 'webpage' };
        break;
      case 'text':
        if (!text) {
          return NextResponse.json({ error: 'Text is required for text analysis' }, { status: 400 });
        }
        input = { text, type: 'text' };
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const result = await multimodalAnalyzer.analyze(input);
    
    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Multimodal analysis error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed' 
      }, 
      { status: 500 }
    );
  }
}
