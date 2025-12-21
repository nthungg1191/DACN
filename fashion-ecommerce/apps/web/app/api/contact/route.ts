import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEmail } from '@/lib/email';

const contactSchema = z.object({
  name: z.string().min(1, 'Họ và tên là bắt buộc'),
  email: z.string().email('Email không hợp lệ'),
  phone: z
    .string()
    .min(8, 'Số điện thoại không hợp lệ')
    .max(20, 'Số điện thoại không hợp lệ'),
  subject: z.string().min(1, 'Chủ đề là bắt buộc'),
  message: z.string().min(1, 'Tin nhắn là bắt buộc').max(5000, 'Tin nhắn quá dài'),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const data = contactSchema.parse(json);

    const adminEmail =
      process.env.CONTACT_EMAIL ||
      process.env.SUPPORT_EMAIL ||
      process.env.GMAIL_USER ||
      process.env.EMAIL_FROM ||
      'admin@example.com';

    const subjectMap: Record<string, string> = {
      general: 'Câu hỏi chung',
      order: 'Câu hỏi về đơn hàng',
      product: 'Câu hỏi về sản phẩm',
      return: 'Đổi trả hàng',
      payment: 'Thanh toán',
      technical: 'Hỗ trợ kỹ thuật',
      feedback: 'Phản hồi & Góp ý',
      other: 'Khác',
    };

    const subjectLabel = subjectMap[data.subject] || 'Khác';

    const html = `
      <h2>Liên hệ mới từ khách hàng</h2>
      <p><strong>Họ và tên:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Số điện thoại:</strong> ${data.phone}</p>
      <p><strong>Chủ đề:</strong> ${subjectLabel} (${data.subject})</p>
      <p><strong>Tin nhắn:</strong></p>
      <p>${data.message.replace(/\n/g, '<br/>')}</p>
      <hr/>
      <p>Email này được gửi từ form Liên hệ trên website Fashion Ecommerce.</p>
    `;

    const ok = await sendEmail({
      to: adminEmail,
      subject: `[Liên hệ] ${subjectLabel} - ${data.name}`,
      html,
    });

    if (!ok) {
      return NextResponse.json(
        { success: false, error: 'Không thể gửi email. Vui lòng thử lại sau.' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Tin nhắn của bạn đã được gửi thành công.',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dữ liệu không hợp lệ',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    console.error('Contact form error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Đã xảy ra lỗi khi gửi tin nhắn. Vui lòng thử lại sau.',
      },
      { status: 500 },
    );
  }
}


