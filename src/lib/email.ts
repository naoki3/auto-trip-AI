import { Resend } from 'resend';

let _resend: Resend | undefined;

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error('RESEND_API_KEY is not set');
    _resend = new Resend(key);
  }
  return _resend;
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;
  const fromAddress = process.env.EMAIL_FROM ?? 'Auto Trip AI <noreply@resend.dev>';

  await getResend().emails.send({
    from: fromAddress,
    to: email,
    subject: '【Auto Trip AI】メールアドレスの確認',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h1 style="font-size: 20px; color: #1d4ed8;">✈️ Auto Trip AI</h1>
        <p style="color: #374151;">ご登録ありがとうございます。</p>
        <p style="color: #374151;">以下のボタンをクリックしてメールアドレスを認証してください。</p>
        <a href="${verifyUrl}"
           style="display: inline-block; margin: 24px 0; padding: 12px 24px; background: #2563eb; color: #fff; border-radius: 8px; text-decoration: none; font-weight: bold;">
          メールアドレスを認証する
        </a>
        <p style="color: #6b7280; font-size: 12px;">このリンクは24時間有効です。</p>
        <p style="color: #6b7280; font-size: 12px;">心当たりがない場合は無視してください。</p>
      </div>
    `,
  });
}
