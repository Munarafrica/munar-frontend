// Email Service - sends transactional emails via SMTP (nodemailer)
import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
dotenv.config();

// ─── Configuration ────────────────────────────────────────
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true'; // true for 465
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'Munar';
const FROM_EMAIL = process.env.EMAIL_FROM_ADDRESS || SMTP_USER || 'noreply@munar.app';
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

// ─── Transporter ──────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

// ─── Helpers ──────────────────────────────────────────────
function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function htmlWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6342e9 0%,#8b5cf6 100%);padding:32px 40px;text-align:center;">
      <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0;letter-spacing:-0.5px;">Munar</h1>
    </div>
    <!-- Content -->
    <div style="padding:40px;">
      ${content}
    </div>
    <!-- Footer -->
    <div style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">&copy; ${new Date().getFullYear()} Munar. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Email Templates ──────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string, attachments?: Array<{ filename: string; content: Buffer; cid: string }>): Promise<boolean> {
  // If SMTP is not configured, log to console and return
  if (!SMTP_USER) {
    console.log(`\n📧 [Email Preview] To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   (SMTP not configured — email logged to console)\n`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      ...(attachments && attachments.length > 0 ? { attachments } : {}),
    });
    console.log(`📧 Email sent to ${to}: ${subject}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}:`, err);
    return false;
  }
}

// ─── Public API ───────────────────────────────────────────

/**
 * Send email verification PIN
 */
export async function sendVerificationEmail(email: string, pin: string): Promise<boolean> {
  const html = htmlWrapper(`
    <h2 style="color:#1e293b;font-size:20px;font-weight:700;margin:0 0 8px;">Verify your email</h2>
    <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 24px;">
      Welcome to Munar! Use the PIN below to verify your email address. This PIN expires in <strong>15 minutes</strong>.
    </p>
    <div style="background:#f1f5f9;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
      <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#6342e9;">${pin}</span>
    </div>
    <p style="color:#94a3b8;font-size:13px;margin:0;">
      If you didn't create a Munar account, you can safely ignore this email.
    </p>
  `);

  return sendEmail(email, `${pin} is your Munar verification code`, html);
}

/**
 * Send password reset PIN
 */
export async function sendPasswordResetEmail(email: string, pin: string): Promise<boolean> {
  const html = htmlWrapper(`
    <h2 style="color:#1e293b;font-size:20px;font-weight:700;margin:0 0 8px;">Reset your password</h2>
    <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 24px;">
      We received a request to reset your password. Use the PIN below to proceed. This PIN expires in <strong>15 minutes</strong>.
    </p>
    <div style="background:#f1f5f9;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
      <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#6342e9;">${pin}</span>
    </div>
    <p style="color:#94a3b8;font-size:13px;margin:0;">
      If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
    </p>
  `);

  return sendEmail(email, `${pin} is your Munar password reset code`, html);
}

/**
 * Send password changed confirmation
 */
export async function sendPasswordChangedEmail(email: string): Promise<boolean> {
  const html = htmlWrapper(`
    <h2 style="color:#1e293b;font-size:20px;font-weight:700;margin:0 0 8px;">Password changed</h2>
    <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 24px;">
      Your Munar account password has been successfully changed. If you didn't make this change, please reset your password immediately or contact support.
    </p>
    <a href="${APP_URL}/forgot-password" style="display:inline-block;background:#6342e9;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
      Reset Password
    </a>
  `);

  return sendEmail(email, 'Your Munar password was changed', html);
}

/**
 * Send welcome email after email verification
 */
export async function sendWelcomeEmail(email: string, firstName?: string): Promise<boolean> {
  const name = firstName || 'there';
  const html = htmlWrapper(`
    <h2 style="color:#1e293b;font-size:20px;font-weight:700;margin:0 0 8px;">Welcome to Munar, ${name}! 🎉</h2>
    <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 24px;">
      Your email has been verified and your account is ready. Start creating amazing events today.
    </p>
    <a href="${APP_URL}/events" style="display:inline-block;background:#6342e9;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
      Go to Dashboard
    </a>
  `);

  return sendEmail(email, 'Welcome to Munar!', html);
}

export { generatePin };

// ─── Ticket Confirmation Email ────────────────────────────

interface TicketAttendee {
  name: string;
  email: string;
  ticketName: string;
  qrCode: string; // Data URL
  orderReference: string;
}

interface TicketOrderInfo {
  orderReference: string;
  buyerName: string;
  buyerEmail: string;
  totalAmount: number;
  currency: string;
  items: Array<{ ticketName: string; quantity: number; unitPrice: number }>;
}

interface TicketEventInfo {
  name: string;
  date: string;
  time?: string;
  venueLocation?: string;
}

function formatCurrency(amount: number, currency: string): string {
  if (currency === 'NGN') return `₦${amount.toLocaleString()}`;
  if (currency === 'GHS') return `GH₵${amount.toLocaleString()}`;
  if (currency === 'ZAR') return `R${amount.toLocaleString()}`;
  return `${currency} ${amount.toLocaleString()}`;
}

/**
 * Send ticket purchase confirmation email with QR codes (CID inline attachments)
 */
export async function sendTicketConfirmationEmail(
  order: TicketOrderInfo,
  event: TicketEventInfo,
  attendees: TicketAttendee[],
): Promise<boolean> {
  // Build CID attachments from data-URL QR codes
  const attachments: Array<{ filename: string; content: Buffer; cid: string }> = [];
  attendees.forEach((a, index) => {
    if (a.qrCode && a.qrCode.startsWith('data:')) {
      const base64Data = a.qrCode.split(',')[1];
      if (base64Data) {
        attachments.push({
          filename: `qr-ticket-${index}.png`,
          content: Buffer.from(base64Data, 'base64'),
          cid: `qr-ticket-${index}`,
        });
      }
    }
  });

  const itemsHtml = order.items.map(i =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#334155;font-size:14px;">${i.ticketName}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#334155;font-size:14px;text-align:center;">${i.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#334155;font-size:14px;text-align:right;">${i.unitPrice === 0 ? 'Free' : formatCurrency(i.unitPrice * i.quantity, order.currency)}</td>
    </tr>`
  ).join('');

  const attendeeCardsHtml = attendees.map((a, index) => {
    // Use CID reference if we extracted a valid attachment, otherwise fall back to data URL
    const imgSrc = (a.qrCode && a.qrCode.startsWith('data:') && attachments.find(att => att.cid === `qr-ticket-${index}`))
      ? `cid:qr-ticket-${index}`
      : (a.qrCode || '');
    return `<div style="border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:12px;background:#ffffff;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:top;width:120px;text-align:center;">
          <img src="${imgSrc}" alt="QR Code" width="110" height="110" style="border-radius:8px;" />
        </td>
        <td style="vertical-align:top;padding-left:16px;">
          <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#1e293b;">${a.name}</p>
          <p style="margin:0 0 8px;font-size:13px;color:#64748b;">${a.email}</p>
          <span style="display:inline-block;background:#eef2ff;color:#4338ca;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">${a.ticketName}</span>
        </td>
      </tr></table>
    </div>`;
  }).join('');

  const totalDisplay = order.totalAmount === 0 ? 'Free' : formatCurrency(order.totalAmount, order.currency);

  const html = htmlWrapper(`
    <h2 style="color:#1e293b;font-size:20px;font-weight:700;margin:0 0 4px;">Your Tickets Are Confirmed! 🎉</h2>
    <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 24px;">
      Thank you for your purchase, <strong>${order.buyerName}</strong>. Here are your ticket details for <strong>${event.name}</strong>.
    </p>

    <!-- Event Details -->
    <div style="background:#f8fafc;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#1e293b;">${event.name}</p>
      <p style="margin:0;font-size:13px;color:#64748b;">
        📅 ${event.date}${event.time ? ` at ${event.time}` : ''}${event.venueLocation ? ` · 📍 ${event.venueLocation}` : ''}
      </p>
    </div>

    <!-- Order Summary -->
    <div style="margin-bottom:24px;">
      <p style="font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Order Summary</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;">Ticket</th>
            <th style="padding:8px 12px;text-align:center;font-size:12px;color:#64748b;font-weight:600;">Qty</th>
            <th style="padding:8px 12px;text-align:right;font-size:12px;color:#64748b;font-weight:600;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr style="background:#f8fafc;">
            <td colspan="2" style="padding:10px 12px;font-size:14px;font-weight:700;color:#1e293b;">Total</td>
            <td style="padding:10px 12px;text-align:right;font-size:14px;font-weight:700;color:#1e293b;">${totalDisplay}</td>
          </tr>
        </tfoot>
      </table>
      <p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">Order Ref: <strong>${order.orderReference}</strong></p>
    </div>

    <!-- Attendee Tickets with QR -->
    <div style="margin-bottom:24px;">
      <p style="font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">Your Tickets (${attendees.length})</p>
      ${attendeeCardsHtml}
    </div>

    <p style="color:#94a3b8;font-size:13px;margin:0;text-align:center;">
      Present the QR code at the event entrance for check-in. You can also access your tickets at any time using your order reference.
    </p>
  `);

  return sendEmail(order.buyerEmail, `Your tickets for ${event.name} — ${order.orderReference}`, html, attachments);
}
