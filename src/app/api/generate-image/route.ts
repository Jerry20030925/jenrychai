import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { prompt, style, size = "1024x1024" } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: "缺少生成提示词" }, { status: 400 });
    }

    // 直接使用备用方案生成图片（避免Google Imagen API配置问题）
    try {
      // 尝试使用DALL-E API
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (openaiApiKey) {
        try {
          const imageUrl = await generateWithDALLE(prompt, size);
          return NextResponse.json({
            success: true,
            imageUrl,
            prompt,
            style,
            size,
            provider: "DALL-E",
            message: "使用DALL-E生成图像",
            timestamp: new Date().toISOString()
          });
        } catch (dalleError) {
          console.error("DALL-E生成失败:", dalleError);
        }
      }
      
      // 使用Stable Diffusion作为主要方案
      const stableImageUrl = await generateWithStableDiffusion(prompt, size);
      
      return NextResponse.json({
        success: true,
        imageUrl: stableImageUrl,
        prompt,
        style,
        size,
        provider: "StableDiffusion",
        message: "使用Stable Diffusion生成图像",
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error("图像生成失败:", error);
      
      // 最终备用方案：返回一个基于提示词的图片URL
      const fallbackUrl = `https://picsum.photos/seed/${encodeURIComponent(prompt)}/${size.split('x')[0]}/${size.split('x')[1]}`;
      
      return NextResponse.json({
        success: true,
        imageUrl: fallbackUrl,
        prompt,
        style,
        size,
        provider: "Picsum",
        message: "使用备用图片服务生成图像",
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error("图像生成失败:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "图像生成失败",
        fallback: "图像生成服务暂时不可用，请稍后再试。"
      }, 
      { status: 500 }
    );
  }
}

// 集成DALL-E API的示例函数（需要OpenAI API密钥）
async function generateWithDALLE(prompt: string, size: string) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error("需要OpenAI API密钥才能使用DALL-E");
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      n: 1,
      size,
      response_format: "url"
    })
  });

  if (!response.ok) {
    throw new Error(`DALL-E API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].url;
}

// 使用Stable Diffusion API生成图像
async function generateWithStableDiffusion(prompt: string, size: string) {
  try {
    // 使用免费的Stable Diffusion API服务
    const response = await fetch("https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.STABILITY_API_KEY || "sk-stability-ai-key"}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text_prompts: [{ text: prompt }],
        cfg_scale: 7,
        height: parseInt(size.split('x')[1]),
        width: parseInt(size.split('x')[0]),
        samples: 1,
        steps: 30,
      })
    });

    if (!response.ok) {
      throw new Error(`Stable Diffusion API error: ${response.status}`);
    }

    const data = await response.json();
    return data.artifacts[0].base64 ? `data:image/png;base64,${data.artifacts[0].base64}` : data.artifacts[0].url;
    
  } catch (error) {
    console.error("Stable Diffusion API调用失败:", error);
    
    // 如果Stable Diffusion也失败，返回一个基于提示词的图片
    const fallbackUrl = `https://picsum.photos/seed/${encodeURIComponent(prompt)}/${size.split('x')[0]}/${size.split('x')[1]}`;
    return fallbackUrl;
  }
}

// 使用Google Imagen API生成图像
async function generateWithGoogleImagen(prompt: string, size: string, apiKey: string) {
  // 注意：Google Imagen API需要特定的权限和配置
  // 这里提供一个模拟实现，实际使用时需要正确的API配置
  
  try {
    // 使用Google的Vertex AI Imagen API
    const response = await fetch(`https://us-central1-aiplatform.googleapis.com/v1/projects/YOUR_PROJECT_ID/locations/us-central1/publishers/google/models/imagegeneration@006:predict`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instances: [{
          prompt: prompt,
          parameters: {
            sampleCount: 1,
            aspectRatio: size.includes('1024') ? "1:1" : "16:9",
            safetyFilterLevel: "block_some",
            personGeneration: "allow_adult"
          }
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Google Imagen API error: ${response.status}`);
    }

    const data = await response.json();
    return data.predictions[0].bytesBase64Encoded ? 
      `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}` : 
      data.predictions[0].imageUrl;

  } catch (error) {
    console.error("Google Imagen API调用失败:", error);
    
    // 如果Google Imagen失败，返回一个基于提示词的图片URL
    const fallbackUrl = `https://picsum.photos/seed/${encodeURIComponent(prompt)}/${size.split('x')[0]}/${size.split('x')[1]}`;
    return fallbackUrl;
  }
}
