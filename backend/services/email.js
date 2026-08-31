import nodemailer from 'nodemailer';

const IS_RENDER = (process.env.RENDER || '').toLowerCase() === 'true';
const RESEND_API_KEY = (process.env.RESEND_API_KEY || '').trim();
const SMTP_EMAIL = process.env.SMTP_EMAIL || 'gitaneurosynchelpdesk@gmail.com';
const SMTP_APP_PASS = (process.env.SMTP_APP_PASS || 'ujsqjfixahgsvvtl').replace(/ /g, '');

export function generateOTP(length = 6) {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
}

function buildEmailHTML(username, otp) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:500px;padding:24px;background:#F8FAFC;border-radius:12px;border:1px solid #E2E8F0;">
      <h2 style="color:#0F172A;margin-top:0;">Gita-NeuroSync</h2>
      <p style="color:#334155;font-size:15px;">Hello <strong>${username}</strong>,</p>
      <p style="color:#334155;font-size:15px;">Your 6-digit email verification code is:</p>
      <div style="text-align:center;margin:24px 0;">
        <span style="display:inline-block;background:#4C72FF;color:#FFFFFF;font-size:28px;font-weight:800;letter-spacing:8px;padding:12px 28px;border-radius:8px;">${otp}</span>
      </div>
      <p style="color:#64748B;font-size:13px;">This code expires in 10 minutes. If you did not request this, please ignore.</p>
    </div>
  `;
}

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: SMTP_EMAIL,
        pass: SMTP_APP_PASS,
      },
    });
  }
  return transporter;
}

async function sendViaResend(recipientEmail, otp, username) {
  const apiKey = process.env.RESEND_API_KEY || RESEND_API_KEY;
  if (!apiKey) {
    console.log('[EMAIL] RESEND_API_KEY not configured.');
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'Gita-NeuroSync <onboarding@resend.dev>',
        to: [recipientEmail],
        subject: 'Gita-NeuroSync - Email Verification Code',
        html: buildEmailHTML(username, otp),
      }),
    });
    if (res.ok) {
      console.log(`[EMAIL] OTP sent to ${recipientEmail} via Resend`);
      return true;
    }
  } catch (e) {
    console.log(`[EMAIL] Resend error: ${e.message}`);
  }
  return false;
}

async function sendViaSMTP(recipientEmail, otp, username) {
  try {
    const t = getTransporter();
    await t.sendMail({
      from: `Gita-NeuroSync <${SMTP_EMAIL}>`,
      to: recipientEmail,
      subject: 'Gita-NeuroSync - Email Verification Code',
      text: `Hello ${username},\n\nYour verification code is: ${otp}\n\nExpires in 10 minutes.`,
      html: buildEmailHTML(username, otp),
    });
    console.log(`[EMAIL] OTP sent to ${recipientEmail} via Gmail SMTP`);
    return true;
  } catch (e) {
    console.log(`[EMAIL] SMTP error: ${e.message}`);
    return false;
  }
}

export async function sendOTPEmail(recipientEmail, otp, username) {
  if (IS_RENDER || RESEND_API_KEY) {
    return sendViaResend(recipientEmail, otp, username);
  }
  return sendViaSMTP(recipientEmail, otp, username);
}

export function sendOTPEmailAsync(recipientEmail, otp, username) {
  sendOTPEmail(recipientEmail, otp, username).catch(() => {});
}
