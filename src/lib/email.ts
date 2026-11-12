import nodemailer from "nodemailer";

export interface SendPasswordResetEmailParams {
  to: string;
  recipientName: string;
  resetUrl: string;
}

export interface SendReminderNotificationEmailParams {
  to: string;
  recipientName: string;
  title: string;
  message: string;
  link?: string;
  badgeLabel?: string;
}

export interface SendEmailResult {
  delivered: boolean;
  skippedReason?: string;
}

function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.EMAIL_SERVER_HOST &&
      process.env.EMAIL_SERVER_USER &&
      process.env.EMAIL_SERVER_PASSWORD
  );
}

function createSmtpTransporter() {
  const port = Number(process.env.EMAIL_SERVER_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendPasswordResetEmail({
  to,
  recipientName,
  resetUrl,
}: SendPasswordResetEmailParams): Promise<SendEmailResult> {
  const fromAddress =
    process.env.EMAIL_FROM || "UNERA <no-reply@unera.edu.vn>";

  if (!isSmtpConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `\n[EMAIL DEV FALLBACK] Khôi phục mật khẩu cho ${to}\nLink: ${resetUrl}\n(Hết hạn sau 15 phút)\n`
      );
    } else {
      console.warn(
        "[EMAIL WARNING] SMTP chưa được cấu hình (EMAIL_SERVER_HOST/USER/PASSWORD). Không thể gửi email khôi phục mật khẩu."
      );
    }
    return { delivered: false, skippedReason: "SMTP_NOT_CONFIGURED" };
  }

  const transporter = createSmtpTransporter();
  const safeName = escapeHtml(recipientName || "bạn");
  const safeUrl = escapeHtml(resetUrl);

  await transporter.sendMail({
    from: fromAddress,
    to,
    subject: "[UNERA] Yêu cầu đặt lại mật khẩu tài khoản",
    text: `Xin chào ${recipientName || "bạn"},\n\nChúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản UNERA của bạn.\nVui lòng truy cập đường dẫn sau (có hiệu lực trong 15 phút):\n${resetUrl}\n\nNếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.\n\nTrân trọng,\nĐội ngũ UNERA`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background-color: #f6f8fb; color: #0f172a;">
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px;">
          <div style="margin-bottom: 20px;">
            <span style="display: inline-block; font-size: 20px; font-weight: 800; color: #2563eb; letter-spacing: -0.02em;">UNERA</span>
          </div>
          <h1 style="font-size: 20px; font-weight: 700; margin: 0 0 12px; color: #0f172a;">Đặt lại mật khẩu tài khoản</h1>
          <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px;">
            Xin chào <strong>${safeName}</strong>, chúng tôi vừa nhận được yêu cầu khôi phục mật khẩu cho tài khoản UNERA liên kết với email này.
          </p>
          <div style="margin: 24px 0;">
            <a href="${safeUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 10px;">
              Đặt lại mật khẩu mới
            </a>
          </div>
          <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 0 0 12px;">
            Đường dẫn trên chỉ sử dụng được một lần và sẽ hết hạn sau <strong>15 phút</strong>. Nếu nút bấm không hoạt động, bạn có thể sao chép liên kết bên dưới vào trình duyệt:
          </p>
          <p style="font-size: 12px; word-break: break-all; color: #2563eb; background: #eff6ff; padding: 10px 12px; border-radius: 8px; margin: 0 0 16px;">
            ${safeUrl}
          </p>
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">
            Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này. Tài khoản của bạn vẫn an toàn.
          </p>
        </div>
      </div>
    `,
  });

  return { delivered: true };
}

export async function sendReminderNotificationEmail({
  to,
  recipientName,
  title,
  message,
  link,
  badgeLabel = "Nhắc nhở UNERA",
}: SendReminderNotificationEmailParams): Promise<SendEmailResult> {
  if (!isSmtpConfigured()) {
    return { delivered: false, skippedReason: "SMTP_NOT_CONFIGURED" };
  }

  const fromAddress =
    process.env.EMAIL_FROM || "UNERA <no-reply@unera.edu.vn>";
  const appBase = (
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ).replace(/\/$/, "");
  const fullLink = link
    ? link.startsWith("http")
      ? link
      : `${appBase}${link.startsWith("/") ? link : `/${link}`}`
    : `${appBase}/notifications`;

  const transporter = createSmtpTransporter();
  const safeName = escapeHtml(recipientName || "bạn");
  const safeBadge = escapeHtml(badgeLabel);
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const safeUrl = escapeHtml(fullLink);

  await transporter.sendMail({
    from: fromAddress,
    to,
    subject: `[UNERA] ${title}`,
    text: `Xin chào ${recipientName || "bạn"},\n\n${title}\n${message}\n\nXem chi tiết tại: ${fullLink}\n\nTrân trọng,\nĐội ngũ UNERA`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background-color: #f6f8fb; color: #0f172a;">
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px;">
          <div style="margin-bottom: 16px;">
            <span style="display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; background: #eff6ff; color: #2563eb; padding: 4px 10px; border-radius: 999px;">
              ${safeBadge}
            </span>
          </div>
          <h1 style="font-size: 18px; font-weight: 700; margin: 0 0 10px; color: #0f172a;">${safeTitle}</h1>
          <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 18px;">
            Xin chào <strong>${safeName}</strong>,<br/>
            ${safeMessage}
          </p>
          <a href="${safeUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 13px; padding: 10px 20px; border-radius: 10px;">
            Xem chi tiết hoạt động
          </a>
        </div>
      </div>
    `,
  });

  return { delivered: true };
}
