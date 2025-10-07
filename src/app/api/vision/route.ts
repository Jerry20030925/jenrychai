import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, prompt } = await request.json();
    
    if (!imageUrl) {
      return NextResponse.json({ error: "缺少图片URL" }, { status: 400 });
    }

    const googleApiKey = process.env.GOOGLE_API_KEY || "AIzaSyCKzN3-PQ37JSh9Q7FqAbmUarciZ0WfstU";
    
    // 使用Google Vision API分析图片
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${googleApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                source: {
                  imageUri: imageUrl
                }
              },
              features: [
                {
                  type: "LABEL_DETECTION",
                  maxResults: 10
                },
                {
                  type: "TEXT_DETECTION",
                  maxResults: 10
                },
                {
                  type: "OBJECT_LOCALIZATION",
                  maxResults: 10
                },
                {
                  type: "FACE_DETECTION",
                  maxResults: 10
                }
              ]
            }
          ]
        })
      }
    );

    if (!visionResponse.ok) {
      throw new Error(`Google Vision API error: ${visionResponse.status}`);
    }

    const visionData = await visionResponse.json();
    
    // 处理分析结果
    const analysis = processVisionResults(visionData, prompt);
    
    return NextResponse.json({
      success: true,
      analysis,
      rawData: visionData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("图片分析失败:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "图片分析失败",
        fallback: "图片分析服务暂时不可用，请稍后再试。"
      }, 
      { status: 500 }
    );
  }
}

function processVisionResults(data: any, prompt?: string) {
  const responses = data.responses?.[0];
  if (!responses) {
    return {
      description: "无法分析此图片",
      tags: [],
      confidence: 0,
      message: "图片分析失败，请检查图片格式或稍后重试。"
    };
  }

  const labels = responses.labelAnnotations || [];
  const texts = responses.textAnnotations || [];
  const objects = responses.localizedObjectAnnotations || [];
  const faces = responses.faceAnnotations || [];

  // 构建描述
  let description = "";
  
  if (labels.length > 0) {
    description += `图片包含：${labels.map((l: any) => l.description).join(", ")}。`;
  }
  
  if (texts.length > 0) {
    const textContent = texts.map((t: any) => t.description).join(" ");
    description += ` 文字内容：${textContent}。`;
  }
  
  if (objects.length > 0) {
    description += ` 检测到的物体：${objects.map((o: any) => o.name).join(", ")}。`;
  }
  
  if (faces.length > 0) {
    description += ` 检测到 ${faces.length} 张人脸。`;
  }

  // 如果有自定义提示，结合分析结果
  if (prompt) {
    description += `\n\n根据您的问题"${prompt}"，基于图片分析：`;
    // 这里可以添加更智能的回答逻辑
  }

  return {
    description: description || "图片分析完成，但未检测到明显特征。",
    tags: labels.map((l: any) => l.description),
    confidence: labels.length > 0 ? labels[0].score : 0,
    textContent: texts.map((t: any) => t.description).join(" "),
    objects: objects.map((o: any) => o.name),
    faceCount: faces.length,
    message: "图片分析完成！"
  };
}
