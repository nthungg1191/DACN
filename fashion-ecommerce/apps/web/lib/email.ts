/**
 * Email service for sending transactional emails
 * Supports multiple providers: Resend, Mailtrap, Gmail (Nodemailer)
 */

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send email using configured provider
 * Priority: GMAIL > MAILTRAP > RESEND > Console log
 */
export async function sendEmail({ to, subject, html, from }: SendEmailOptions): Promise<boolean> {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Priority 1: Gmail SMTP (via Nodemailer - gửi email thật, không cần verify domain)
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return sendViaGmail({ to, subject, html, from });
  }
  
  // Priority 2: Mailtrap (best for localhost testing - không gửi email thật)
  if (process.env.MAILTRAP_API_TOKEN) {
    return sendViaMailtrap({ to, subject, html, from });
  }
  
  // Priority 3: Resend API
  if (process.env.RESEND_API_KEY) {
    return sendViaResend({ to, subject, html, from });
  }
  
  // Fallback: Log to console (for development)
  console.log('📧 Email would be sent (no email provider configured):');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('💡 Tip: Configure GMAIL_USER and GMAIL_APP_PASSWORD to send real emails via Gmail SMTP');
  return true;
}

/**
 * Send email via Mailtrap (best for localhost - no domain verification)
 */
async function sendViaMailtrap({ to, subject, html, from }: SendEmailOptions): Promise<boolean> {
  try {
    const response = await fetch('https://send.api.mailtrap.io/api/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MAILTRAP_API_TOKEN}`,
      },
      body: JSON.stringify({
        from: {
          email: from || process.env.EMAIL_FROM || 'noreply@example.com',
          name: 'Fashion Ecommerce',
        },
        to: [{ email: to }],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Mailtrap error:', error);
      return false;
    }

    console.log('✅ Email sent via Mailtrap to:', to);
    return true;
  } catch (error) {
    console.error('Mailtrap error:', error);
    return false;
  }
}

/**
 * Send email via Gmail SMTP (requires Gmail app password)
 * Gửi email thật đến người dùng - không cần verify domain
 */
async function sendViaGmail({ to, subject, html, from }: SendEmailOptions): Promise<boolean> {
  try {
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.default.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const result = await transporter.sendMail({
      from: `"Fashion Ecommerce" <${from || process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log('✅ Email sent via Gmail to:', to);
    console.log('Message ID:', result.messageId);
    return true;
  } catch (error: any) {
    console.error('❌ Gmail SMTP error:', error.message || error);
    
    // Provide helpful error messages
    if (error.code === 'EAUTH') {
      console.error('💡 Authentication failed. Check your GMAIL_USER and GMAIL_APP_PASSWORD');
      console.error('💡 Make sure you enabled 2-Step Verification and created an App Password');
    } else if (error.code === 'EENVELOPE') {
      console.error('💡 Invalid email address');
    }
    
    return false;
  }
}

/**
 * Send email via Resend API
 */
async function sendViaResend({ to, subject, html, from }: SendEmailOptions): Promise<boolean> {
  try {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: from || process.env.EMAIL_FROM || 'noreply@example.com',
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      
      if (isDevelopment) {
        console.warn('⚠️ Resend email failed (development mode - continuing anyway):');
        console.warn('To:', to);
        console.warn('Error:', error.message || error);
        console.warn('💡 Tip: Resend only allows sending to verified emails in test mode.');
        console.warn('💡 Tip: Use Mailtrap or Gmail for localhost testing');
        return true;
      }
      
      console.error('Resend error:', error);
      return true;
    }

    console.log('✅ Email sent via Resend to:', to);
    return true;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Resend error (development mode - continuing anyway):', error);
      return true;
    }
    console.error('Resend error:', error);
    return true;
  }
}

/**
 * Send registration confirmation email
 */
export async function sendRegistrationEmail(userEmail: string, userName: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chào mừng bạn đến với Fashion Ecommerce</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Chào mừng bạn!</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Xin chào <strong>${userName}</strong>,</p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            Cảm ơn bạn đã đăng ký tài khoản tại Fashion Ecommerce! Chúng tôi rất vui mừng được chào đón bạn.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <p style="margin: 0; font-size: 14px;"><strong>Email đăng ký:</strong> ${userEmail}</p>
            <p style="margin: 10px 0 0 0; font-size: 14px;"><strong>Thời gian đăng ký:</strong> ${new Date().toLocaleString('vi-VN')}</p>
          </div>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            Bây giờ bạn có thể:
          </p>
          
          <ul style="font-size: 16px; margin-bottom: 20px; padding-left: 20px;">
            <li>Mua sắm hàng ngàn sản phẩm thời trang</li>
            <li>Theo dõi đơn hàng của bạn</li>
            <li>Lưu danh sách yêu thích</li>
            <li>Nhận các ưu đãi đặc biệt</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/products" 
               style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Bắt đầu mua sắm
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            Nếu bạn không phải người đăng ký tài khoản này, vui lòng bỏ qua email này.
          </p>
          
          <p style="font-size: 14px; color: #666; margin-top: 10px;">
            Trân trọng,<br>
            <strong>Đội ngũ Fashion Ecommerce</strong>
          </p>
        </div>
      </body>
    </html>
  `;

  return await sendEmail({
    to: userEmail,
    subject: 'Chào mừng bạn đến với Fashion Ecommerce! 🎉',
    html,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  userEmail: string,
  userName: string,
  resetToken: string
): Promise<boolean> {
  const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Đặt lại mật khẩu</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Đặt lại mật khẩu</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Xin chào <strong>${userName}</strong>,</p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấp vào nút bên dưới để đặt lại mật khẩu:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; background: #667eea; color: white; padding: 14px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              Đặt lại mật khẩu
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            Hoặc sao chép và dán link sau vào trình duyệt:
          </p>
          <p style="font-size: 12px; color: #999; word-break: break-all; background: white; padding: 10px; border-radius: 5px; margin: 10px 0;">
            ${resetUrl}
          </p>
          
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 0; font-size: 14px; color: #856404;">
              <strong>⚠️ Lưu ý:</strong> Link này sẽ hết hạn sau <strong>1 giờ</strong>. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
            </p>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            Nếu bạn không yêu cầu đặt lại mật khẩu, bạn có thể yên tâm bỏ qua email này. Mật khẩu của bạn sẽ không thay đổi.
          </p>
          
          <p style="font-size: 14px; color: #666; margin-top: 10px;">
            Trân trọng,<br>
            <strong>Đội ngũ Fashion Ecommerce</strong>
          </p>
        </div>
      </body>
    </html>
  `;

  return await sendEmail({
    to: userEmail,
    subject: 'Đặt lại mật khẩu - Fashion Ecommerce',
    html,
  });
}

