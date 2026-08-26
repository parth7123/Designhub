import nodemailer from 'nodemailer';
import { db } from '../db';

function getEmailTransporter() {
  const host = process.env.EMAIL_SERVER_HOST;
  const port = Number(process.env.EMAIL_SERVER_PORT || 587);
  const user = process.env.EMAIL_SERVER_USER;
  const pass = process.env.EMAIL_SERVER_PASSWORD;

  if (!host || host.includes('example.com')) {
    return null; // Fallback: log transactional emails cleanly to console in dev mode
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendEmailNotification({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const transporter = getEmailTransporter();
  const from = process.env.EMAIL_FROM || 'DesignHub Marketplace <no-reply@designhub.store>';

  if (transporter) {
    try {
      await transporter.sendMail({ from, to, subject, html });
      console.log(`Email sent successfully to ${to}: ${subject}`);
    } catch (err) {
      console.error(`Failed to send email to ${to}:`, err);
    }
  } else {
    console.log(`[Dev Mode - Simulated Email to ${to}] Subject: ${subject}`);
  }
}

/**
 * Creates both in-app notification record and sends email alert
 */
export async function createAndSendNotification({
  userId,
  userEmail,
  title,
  message,
  type,
  link,
}: {
  userId: string;
  userEmail: string;
  title: string;
  message: string;
  type: 'ORDER' | 'PAYOUT' | 'APPROVAL' | 'DISPUTE' | 'MESSAGE' | 'WARNING' | 'PENALTY' | 'ACCOUNT';
  link?: string;
}) {
  // 1. Create In-App Notification
  await db.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      link,
    },
  });

  // 2. Format HTML Email Template
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; padding: 24px; border-radius: 8px; border: 1px solid #334155;">
        <h2 style="color: #6366f1; margin-top: 0;">${title}</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1;">${message}</p>
        ${
          link
            ? `<div style="margin-top: 24px;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${link}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View in DesignHub</a>
              </div>`
            : ''
        }
        <hr style="border: 0; border-top: 1px solid #334155; margin: 24px 0;" />
        <p style="font-size: 12px; color: #64748b;">DesignHub Multi-Vendor Marketplace — Secure Digital Design Asset Ecosystem.</p>
      </div>
    </div>
  `;

  // 3. Dispatch Email
  await sendEmailNotification({
    to: userEmail,
    subject: title,
    html: emailHtml,
  });
}
