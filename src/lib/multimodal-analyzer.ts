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
    const imageUrl = await this.fileToDataURL(file);
    
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
                url: imageUrl,
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

  // 视频分析 - 提取关键帧进行分析
  private async analyzeVideo(file: File): Promise<AnalysisResult> {
    // 这里需要实现视频关键帧提取
    // 由于浏览器限制，我们使用简化的方法
    const videoUrl = await this.fileToDataURL(file);
    
    // 创建视频元素来获取基本信息
    const video = document.createElement('video');
    video.src = videoUrl;
    
    return new Promise((resolve) => {
      video.onloadedmetadata = async () => {
        const duration = video.duration;
        
        // 提取多个关键帧进行分析
        const keyFrames = await this.extractVideoKeyFrames(video);
        const frameAnalyses = await Promise.all(
          keyFrames.map(frame => this.analyzeImageFrame(frame))
        );
        
        const combinedAnalysis = this.combineVideoAnalyses(frameAnalyses, duration);
        
        resolve({
          type: 'video',
          title: `视频分析 - ${file.name}`,
          summary: combinedAnalysis.summary,
          keyPoints: combinedAnalysis.keyPoints,
          insights: combinedAnalysis.insights,
          metadata: {
            duration,
            size: file.size,
            format: file.type
          },
          visualElements: combinedAnalysis.visualElements,
          timestamp: new Date().toISOString()
        });
      };
    });
  }

  // PDF分析 - 使用文本提取和AI分析
  private async analyzePDF(file: File): Promise<AnalysisResult> {
    const text = await this.extractPDFText(file);
    
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `请分析以下PDF文档内容，提供：1. 文档摘要 2. 主要观点 3. 关键信息 4. 实用建议。请用中文回答，结构清晰。\n\n文档内容：\n${text}`
        }
      ],
      max_tokens: 2000
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
        pages: this.estimatePDFPages(text)
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
  private async fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

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

  private async extractVideoKeyFrames(video: HTMLVideoElement): Promise<string[]> {
    // 简化的关键帧提取 - 实际应用中需要更复杂的算法
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const frames: string[] = [];
    
    const duration = video.duration;
    const frameCount = Math.min(5, Math.floor(duration / 10)); // 每10秒一帧，最多5帧
    
    for (let i = 0; i < frameCount; i++) {
      const time = (duration / frameCount) * i;
      video.currentTime = time;
      
      await new Promise(resolve => {
        video.onseeked = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          frames.push(canvas.toDataURL());
          resolve(void 0);
        };
      });
    }
    
    return frames;
  }

  private async analyzeImageFrame(frameDataUrl: string): Promise<any> {
    // 这里可以调用图片分析API
    // 简化实现
    return {
      summary: '视频帧分析',
      keyPoints: ['关键帧内容'],
      insights: ['视频内容洞察']
    };
  }

  private combineVideoAnalyses(analyses: any[], duration: number): any {
    return {
      summary: `视频总时长 ${Math.round(duration)} 秒，包含多个关键场景`,
      keyPoints: analyses.flatMap(a => a.keyPoints),
      insights: analyses.flatMap(a => a.insights),
      visualElements: {
        objects: analyses.flatMap(a => a.visualElements?.objects || []),
        emotions: analyses.flatMap(a => a.visualElements?.emotions || [])
      }
    };
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
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => resolve(audio.duration);
      audio.src = URL.createObjectURL(file);
    });
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
