// 多模态AI分析器 - 支持图片、视频、PDF、语音、网站链接等
import OpenAI from 'openai';

export interface AnalysisResult {
  type: 'image' | 'video' | 'pdf' | 'audio' | 'webpage' | 'text';
  title: string;
  summary: string;
  keyPoints: string[];
  insights: string[];
  metadata: {
    duration?: number; // 视频/音频时长
    pages?: number; // PDF页数
    size?: number; // 文件大小
    format?: string; // 文件格式
    url?: string; // 网页链接
  };
  visualElements?: {
    colors?: string[];
    objects?: string[];
    text?: string[];
    emotions?: string[];
  };
  timestamp: string;
}

export interface MultimodalInput {
  file?: File;
  url?: string;
  text?: string;
  type: 'image' | 'video' | 'pdf' | 'audio' | 'webpage' | 'text';
}

class MultimodalAnalyzer {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
    });
  }

  // 主分析方法 - 根据输入类型自动选择分析策略
  async analyze(input: MultimodalInput): Promise<AnalysisResult> {
    try {
      switch (input.type) {
        case 'image':
          return await this.analyzeImage(input.file!);
        case 'video':
          return await this.analyzeVideo(input.file!);
        case 'pdf':
          return await this.analyzePDF(input.file!);
        case 'audio':
          return await this.analyzeAudio(input.file!);
        case 'webpage':
          return await this.analyzeWebpage(input.url!);
        case 'text':
          return await this.analyzeText(input.text!);
        default:
          throw new Error(`Unsupported input type: ${input.type}`);
      }
    } catch (error) {
      console.error('Multimodal analysis error:', error);
      throw error;
    }
  }

  // 图片分析 - 使用OpenAI Vision
  private async analyzeImage(file: File): Promise<AnalysisResult> {
    // 将文件转换为base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type;
    
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "请详细分析这张图片，包括：1. 主要内容描述 2. 关键元素识别 3. 颜色和构图分析 4. 情感和氛围 5. 实用建议。请用中文回答，结构清晰。"
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 2000
    });

    const content = response.choices[0]?.message?.content || '';
    
    return {
      type: 'image',
      title: `图片分析 - ${file.name}`,
      summary: this.extractSummary(content),
      keyPoints: this.extractKeyPoints(content),
      insights: this.extractInsights(content),
      metadata: {
        size: file.size,
        format: file.type
      },
      visualElements: {
        colors: this.extractColors(content),
        objects: this.extractObjects(content),
        text: this.extractTextFromImage(content),
        emotions: this.extractEmotions(content)
      },
      timestamp: new Date().toISOString()
    };
  }

  // 视频分析 - 简化实现
  private async analyzeVideo(file: File): Promise<AnalysisResult> {
    // 简化实现：返回基本信息
    return {
      type: 'video',
      title: `视频分析 - ${file.name}`,
      summary: '视频文件已上传，但由于技术限制，暂不支持视频内容分析。',
      keyPoints: ['视频文件已接收', '暂不支持内容分析'],
      insights: ['建议使用图片或PDF文件进行分析'],
      metadata: {
        size: file.size,
        format: file.type
      },
      timestamp: new Date().toISOString()
    };
  }

  // PDF分析 - 使用OpenAI Vision API
  private async analyzePDF(file: File): Promise<AnalysisResult> {
    // 将PDF转换为base64用于Vision API分析
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    const response = await this.openai.chat.completions.create({
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

    const content = response.choices[0]?.message?.content || '';
    
    return {
      type: 'pdf',
      title: `PDF分析 - ${file.name}`,
      summary: this.extractSummary(content),
      keyPoints: this.extractKeyPoints(content),
      insights: this.extractInsights(content),
      metadata: {
        size: file.size,
        format: file.type,
        pages: 1 // Vision API无法直接获取页数
      },
      timestamp: new Date().toISOString()
    };
  }

  // 音频分析 - 使用Whisper转文字后分析
  private async analyzeAudio(file: File): Promise<AnalysisResult> {
    // 使用Whisper进行语音转文字
    const transcription = await this.transcribeAudio(file);
    
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `请分析以下语音转文字内容，提供：1. 内容摘要 2. 主要话题 3. 情感分析 4. 关键信息提取。请用中文回答，结构清晰。\n\n语音内容：\n${transcription}`
        }
      ],
      max_tokens: 2000
    });

    const content = response.choices[0]?.message?.content || '';
    
    return {
      type: 'audio',
      title: `语音分析 - ${file.name}`,
      summary: this.extractSummary(content),
      keyPoints: this.extractKeyPoints(content),
      insights: this.extractInsights(content),
      metadata: {
        size: file.size,
        format: file.type,
        duration: await this.getAudioDuration(file)
      },
      timestamp: new Date().toISOString()
    };
  }

  // 网页分析 - 提取内容后分析
  private async analyzeWebpage(url: string): Promise<AnalysisResult> {
    const webpageContent = await this.extractWebpageContent(url);
    
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `请分析以下网页内容，提供：1. 页面摘要 2. 主要信息 3. 关键观点 4. 实用价值。请用中文回答，结构清晰。\n\n网页内容：\n${webpageContent}`
        }
      ],
      max_tokens: 2000
    });

    const content = response.choices[0]?.message?.content || '';
    
    return {
      type: 'webpage',
      title: `网页分析 - ${url}`,
      summary: this.extractSummary(content),
      keyPoints: this.extractKeyPoints(content),
      insights: this.extractInsights(content),
      metadata: {
        url,
        size: webpageContent.length
      },
      timestamp: new Date().toISOString()
    };
  }

  // 文本分析
  private async analyzeText(text: string): Promise<AnalysisResult> {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `请分析以下文本内容，提供：1. 内容摘要 2. 主要观点 3. 关键信息 4. 实用建议。请用中文回答，结构清晰。\n\n文本内容：\n${text}`
        }
      ],
      max_tokens: 2000
    });

    const content = response.choices[0]?.message?.content || '';
    
    return {
      type: 'text',
      title: '文本分析',
      summary: this.extractSummary(content),
      keyPoints: this.extractKeyPoints(content),
      insights: this.extractInsights(content),
      metadata: {
        size: text.length
      },
      timestamp: new Date().toISOString()
    };
  }

  // 辅助方法

  private extractSummary(content: string): string {
    const lines = content.split('\n');
    const summaryLine = lines.find(line => 
      line.includes('摘要') || line.includes('总结') || line.includes('概述')
    );
    return summaryLine ? summaryLine.replace(/^[^\u4e00-\u9fa5]*/, '') : lines[0] || '';
  }

  private extractKeyPoints(content: string): string[] {
    const lines = content.split('\n');
    return lines
      .filter(line => line.match(/^\d+\.|^[•·▪▫]/) || line.includes('关键') || line.includes('要点'))
      .map(line => line.replace(/^\d+\.\s*|^[•·▪▫]\s*/, '').trim())
      .filter(line => line.length > 0);
  }

  private extractInsights(content: string): string[] {
    const lines = content.split('\n');
    return lines
      .filter(line => line.includes('建议') || line.includes('洞察') || line.includes('发现'))
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  private extractColors(content: string): string[] {
    const colorMatches = content.match(/[红橙黄绿青蓝紫黑白灰][色]?/g) || [];
    return [...new Set(colorMatches)];
  }

  private extractObjects(content: string): string[] {
    const objectMatches = content.match(/[人物|建筑|车辆|动物|植物|物品][^，。！？]*/g) || [];
    return objectMatches.map(obj => obj.trim()).filter(obj => obj.length > 0);
  }

  private extractTextFromImage(content: string): string[] {
    const textMatches = content.match(/[""''][^""'']*[""'']/g) || [];
    return textMatches.map(text => text.replace(/[""''']/g, '').trim());
  }

  private extractEmotions(content: string): string[] {
    const emotionMatches = content.match(/[开心|快乐|悲伤|愤怒|惊讶|恐惧|厌恶|平静][^，。！？]*/g) || [];
    return emotionMatches.map(emotion => emotion.trim()).filter(emotion => emotion.length > 0);
  }


  private async extractPDFText(file: File): Promise<string> {
    // 简化的PDF文本提取
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
    
    // 提取可读文本
    return text
      .replace(/[^\x20-\x7E\u4e00-\u9fff]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private estimatePDFPages(text: string): number {
    // 简单估算PDF页数
    return Math.max(1, Math.ceil(text.length / 2000));
  }

  private async transcribeAudio(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/transcribe-audio', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    return data.success ? data.text : '';
  }

  private async getAudioDuration(file: File): Promise<number> {
    // 简化实现：返回0
    return 0;
  }

  private async extractWebpageContent(url: string): Promise<string> {
    const response = await fetch('/api/extract-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    
    const data = await response.json();
    return data.content || '';
  }
}

export const multimodalAnalyzer = new MultimodalAnalyzer();
