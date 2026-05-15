import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const apiKey = body.apiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key không hợp lệ hoặc không có quyền truy cập.' },
        { status: 401 }
      );
    }

    const res = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData?.error?.message || 'Không tải được danh sách model. Vui lòng kiểm tra API key hoặc kết nối mạng.' },
        { status: res.status }
      );
    }

    const data = await res.json();
    const models = data.data || [];

    // Map models and categorize them
    const categorizedModels = models.map((m: any) => {
      const id = m.id;
      let type = 'Khác';
      let isSuitableForAnalysis = false;

      if (id.includes('embed')) {
        type = 'Embedding';
      } else if (id.includes('audio') || id.includes('tts') || id.includes('whisper')) {
        type = 'Audio';
      } else if (id.includes('dall-e')) {
        type = 'Image';
      } else if (id.includes('gpt-') || id.startsWith('o1') || id.startsWith('o3') || id.startsWith('o4')) {
        type = 'Text / Reasoning';
        isSuitableForAnalysis = true;
        // Don't mark realtime or audio models as suitable text analysis if they explicitly say audio but have gpt prefix, though openai separates them.
        if (id.includes('-audio')) {
          type = 'Audio';
          isSuitableForAnalysis = false;
        }
      }

      // Mark special recommendations later in UI or here
      return {
        id,
        name: id,
        type,
        isSuitableForAnalysis
      };
    });

    // Sort by id
    categorizedModels.sort((a: any, b: any) => a.id.localeCompare(b.id));

    return NextResponse.json({ models: categorizedModels });
  } catch (error) {
    return NextResponse.json(
      { error: 'Không tải được danh sách model. Vui lòng kiểm tra API key hoặc kết nối mạng.' },
      { status: 500 }
    );
  }
}
