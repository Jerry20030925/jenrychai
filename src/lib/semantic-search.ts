// 语义搜索功能
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: 'tavily' | 'google' | 'bing';
  publishedDate?: string;
  author?: string;
}

export interface KnowledgeExtractionResult {
  title: string;
  content: string;
  summary: string;
  keyPoints: string[];
  source: string;
  type: 'webpage' | 'pdf' | 'image';
  extractedAt: string;
}

// Tavily搜索
export async function searchWithTavily(query: string, maxResults: number = 5): Promise<SearchResult[]> {
  try {
    // 检查API密钥
    if (!process.env.TAVILY_API_KEY) {
      console.log('Tavily API key not configured, skipping search');
      return [];
    }

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        search_depth: 'basic',
        include_answer: false,
        include_images: false,
        include_raw_content: false,
        max_results: maxResults,
        include_domains: [],
        exclude_domains: [],
      }),
    });

    if (!response.ok) {
      console.log(`Tavily API error: ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    return data.results?.map((result: any) => ({
      title: result.title,
      url: result.url,
      snippet: result.content,
      source: 'tavily' as const,
      publishedDate: result.published_date,
    })) || [];
  } catch (error) {
    console.log('Tavily search error:', error);
    return [];
  }
}

// Google Custom Search
export async function searchWithGoogle(query: string, maxResults: number = 5): Promise<SearchResult[]> {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
    
    if (!apiKey || !searchEngineId) {
      console.log('Google API credentials not configured, skipping search');
      return [];
    }

    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=${maxResults}`
    );

    if (!response.ok) {
      console.log(`Google API error: ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    return data.items?.map((item: any) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      source: 'google' as const,
      publishedDate: item.pagemap?.metatags?.[0]?.['article:published_time'],
    })) || [];
  } catch (error) {
    console.log('Google search error:', error);
    return [];
  }
}

// 综合搜索（优先使用Tavily，失败时使用Google）
export async function performSemanticSearch(query: string, maxResults: number = 5): Promise<SearchResult[]> {
  // 先尝试Tavily
  let results = await searchWithTavily(query, maxResults);
  
  // 如果Tavily没有结果，尝试Google
  if (results.length === 0) {
    results = await searchWithGoogle(query, maxResults);
  }
  
  return results;
}

// 网页内容提取
export async function extractWebpageContent(url: string): Promise<KnowledgeExtractionResult | null> {
  try {
    const response = await fetch('/api/extract-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`Content extraction failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Webpage extraction error:', error);
    return null;
  }
}

// PDF内容提取
export async function extractPDFContent(file: File): Promise<KnowledgeExtractionResult | null> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/extract-pdf', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`PDF extraction failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('PDF extraction error:', error);
    return null;
  }
}

// 图片内容分析
export async function analyzeImageContent(imageUrl: string): Promise<KnowledgeExtractionResult | null> {
  try {
    const response = await fetch('/api/analyze-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl }),
    });

    if (!response.ok) {
      throw new Error(`Image analysis failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      title: '图片分析结果',
      content: data.analysis?.description || '无法分析图片内容',
      summary: data.analysis?.description || '图片分析失败',
      keyPoints: data.analysis?.tags || [],
      source: imageUrl,
      type: 'image' as const,
      extractedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Image analysis error:', error);
    return null;
  }
}

// 智能知识提取（根据输入类型自动选择方法）
export async function extractKnowledge(input: string | File): Promise<KnowledgeExtractionResult | null> {
  if (typeof input === 'string') {
    // 检查是否是URL
    try {
      new URL(input);
      return await extractWebpageContent(input);
    } catch {
      // 不是URL，可能是文本内容
      return {
        title: '文本内容',
        content: input,
        summary: input.slice(0, 200) + (input.length > 200 ? '...' : ''),
        keyPoints: input.split(/[。！？.!?]/).filter(s => s.trim().length > 0),
        source: 'user_input',
        type: 'webpage' as const,
        extractedAt: new Date().toISOString(),
      };
    }
  } else {
    // 文件上传
    if (input.type === 'application/pdf') {
      return await extractPDFContent(input);
    } else if (input.type.startsWith('image/')) {
      const imageUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(input);
      });
      return await analyzeImageContent(imageUrl);
    }
  }
  
  return null;
}
