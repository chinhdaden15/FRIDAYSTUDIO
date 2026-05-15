import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tailData, sixDigitData, days, apiKey, model } = body;

    const usedModel = model || 'gpt-4o-mini';

    if (
      usedModel.includes('embed') || 
      usedModel.includes('audio') || 
      usedModel.includes('tts') || 
      usedModel.includes('whisper') || 
      usedModel.includes('dall-e')
    ) {
      return NextResponse.json(
        { error: 'Model đã chọn không phù hợp để phân tích dữ liệu văn bản.' },
        { status: 400 }
      );
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simple mock AI response
    // If we had a real apiKey, we would call OpenAI API here.
    // Ensure we follow the rules: no random numbers, only explain.
    //
    // PROMPT BẮT BUỘC:
    // "Không tạo thêm số mới. Không thay đổi 5 dãy số. Không cam kết trúng thưởng. Chỉ giải thích dựa trên thống kê đã cung cấp."
    // AI chỉ nhận: dữ liệu thống kê đã tính, top đuôi 2 số, top đầu 2 số, top bộ 3 cuối, 
    // điểm vị trí 1-6, 5 dãy đã được thuật toán tạo, các lý do đã tính.

    const summary = `Dựa trên dữ liệu ${days} ngày gần nhất, hệ thống đã phân tích các nhóm số có tần suất xuất hiện cao và ổn định.`;
    const tailAnalysis = `Nhóm đuôi 2 số có các điểm nhấn nổi bật, đặc biệt là các số có tần suất tốt và độ trễ thấp, cho thấy xu hướng xuất hiện nhịp nhàng.`;
    const sixDigitAnalysis = `Các dãy 6 số tham khảo được tổng hợp từ những vị trí có điểm số cao nhất trong lịch sử, kết hợp với các cặp vị trí liền kề có liên kết tốt, tạo ra các tổ hợp có cơ sở dữ liệu vững chắc.`;
    const riskNote = `Kết quả chỉ mang tính phân tích tham khảo từ dữ liệu quá khứ. Tuyệt đối không đảm bảo trúng thưởng.`;

    return NextResponse.json({
      summary,
      tailAnalysis,
      sixDigitAnalysis,
      riskNote
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Lỗi phân tích AI' },
      { status: 500 }
    );
  }
}
