import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const apiKey = body.apiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { 
          ok: false, 
          message: 'Chưa có API key để kiểm tra.', 
          errorCode: 'missing_api_key' 
        },
        { status: 400 }
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
        { 
          ok: false, 
          message: 'API key không hợp lệ hoặc đã bị thu hồi.', 
          errorCode: 'invalid_api_key',
          details: errorData?.error?.message || 'Unauthorized'
        },
        { status: res.status }
      );
    }

    const data = await res.json();
    const models = data.data || [];
    const modelCount = models.length;

    if (modelCount === 0) {
      return NextResponse.json({
        ok: false,
        message: 'API key hợp lệ nhưng không lấy được danh sách model.',
        errorCode: 'no_models_found'
      });
    }

    let recommendedModel = 'gpt-4o-mini';
    const hasGpt54Mini = models.some((m: any) => m.id === 'gpt-5.4-mini');
    const hasGpt4oMini = models.some((m: any) => m.id === 'gpt-4o-mini');
    const hasTextModel = models.some((m: any) => m.id.includes('gpt-') || m.id.startsWith('o1') || m.id.startsWith('o3') || m.id.startsWith('o4'));

    if (hasGpt54Mini) {
      recommendedModel = 'gpt-5.4-mini';
    } else if (hasGpt4oMini) {
      recommendedModel = 'gpt-4o-mini';
    } else if (hasTextModel) {
      recommendedModel = models.find((m: any) => m.id.includes('gpt-') || m.id.startsWith('o1') || m.id.startsWith('o3') || m.id.startsWith('o4'))?.id;
    }

    if (!hasTextModel) {
      return NextResponse.json({
        ok: true,
        message: 'API key hợp lệ nhưng chưa có model phù hợp cho phân tích văn bản.',
        modelCount,
        recommendedModel: null
      });
    }

    return NextResponse.json({
      ok: true,
      message: 'Kết nối thành công. Đã tìm thấy ' + modelCount + ' model khả dụng.',
      modelCount,
      recommendedModel
    });

  } catch (error) {
    return NextResponse.json(
      { 
        ok: false, 
        message: 'Không thể kết nối OpenAI. Vui lòng kiểm tra mạng.', 
        errorCode: 'network_error' 
      },
      { status: 500 }
    );
  }
}
