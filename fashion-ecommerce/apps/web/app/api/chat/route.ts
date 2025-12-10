import { NextRequest, NextResponse } from 'next/server';
import { buildRAGContext, formatRAGContextForPrompt } from '@/lib/rag/context';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const GEMINI_API_VERSION = process.env.GEMINI_API_VERSION || 'v1beta';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent`;

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Missing GEMINI_API_KEY' },
        { status: 500 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const userMessage = body?.message;

    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'message is required' },
        { status: 400 },
      );
    }

    // Build RAG context từ products, categories và policies
    const ragContext = await buildRAGContext();
    const ragContextText = formatRAGContextForPrompt(ragContext);

    // Lấy base URL từ request headers
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    // System prompt với RAG context
    const systemPrompt = `Bạn là trợ lý tư vấn sản phẩm cho website thời trang. Nhiệm vụ của bạn là:

1. CHỈ tư vấn sản phẩm có trong danh sách dưới đây
2. KHÔNG được bịa đặt hoặc đề xuất sản phẩm không tồn tại
3. Trả lời câu hỏi về chính sách dựa trên thông tin được cung cấp
4. Trả lời câu hỏi về quyền hạn và chức năng của người dùng trong hệ thống
5. Nếu khách hỏi về sản phẩm không có, hãy gợi ý sản phẩm tương tự trong danh sách
6. Luôn kiểm tra tình trạng còn hàng trước khi tư vấn
7. Giá cả có thể thay đổi, khuyến khích khách kiểm tra trên website
8. Khi tư vấn sản phẩm, LUÔN cung cấp link đầy đủ theo format: ${baseUrl}/products/{id} (sử dụng ID từ thông tin sản phẩm, không phải slug)
9. Format link sản phẩm: [Tên sản phẩm](${baseUrl}/products/{id})
10. Khi trả lời về quyền hạn, hãy cung cấp link đến các trang liên quan nếu có (ví dụ: /profile, /orders, /cart, /wishlist)

${ragContextText}

Hãy trả lời một cách thân thiện, chuyên nghiệp và hữu ích. Khi đề xuất sản phẩm, luôn kèm theo link để khách hàng có thể xem chi tiết. Khi trả lời về quyền hạn, hãy giải thích rõ ràng và hướng dẫn cách sử dụng.`;

    const messages = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: userMessage,
      },
    ];

    // Format prompt cho Gemini (concatenate system + user messages)
    const geminiPrompt = messages.map((m) => `${m.role}: ${m.content}`).join('\n\n');

    const geminiResp = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: geminiPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 512,
        },
      }),
    });

    if (!geminiResp.ok) {
      const errText = await geminiResp.text();
      console.error('[Chat API] Gemini error:', geminiResp.status, errText);
      return NextResponse.json(
        {
          success: false,
          error: 'AI service error',
          detail: errText,
          provider: 'gemini',
        },
        { status: geminiResp.status === 429 ? 429 : 500 },
      );
    }

    const geminiData = await geminiResp.json();
    const geminiAnswer =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Xin lỗi, tôi chưa có thông tin phù hợp.';

    return NextResponse.json({
      success: true,
      answer: geminiAnswer,
      model: GEMINI_MODEL,
      provider: 'gemini',
    });
  } catch (error) {
    console.error('[Chat API] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}

