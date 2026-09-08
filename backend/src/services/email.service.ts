/**
 * Email service - sends emails via SMTP using platform settings
 */
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import prisma from '../config/database';

let transporterCache: Transporter | null = null;
let lastConfigHash = '';

async function getTransporter(): Promise<Transporter | null> {
  const settings = await prisma.platformSetting.findMany({
    where: { group: 'email' },
  });
  const config: Record<string, string> = {};
  for (const s of settings) config[s.key] = s.value;

  const host = config.smtp_host?.trim();
  const port = parseInt(config.smtp_port || '587', 10);
  const user = config.smtp_username?.trim();
  const pass = config.smtp_password?.trim();
  const from = config.from_email?.trim();

  if (!host || !user || !pass || !from) {
    return null;
  }

  const hash = `${host}:${port}:${user}:${from}`;
  if (transporterCache && lastConfigHash === hash) {
    return transporterCache;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    transporterCache = transporter;
    lastConfigHash = hash;
    return transporter;
  } catch {
    return null;
  }
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}): Promise<{ sent: boolean; error?: string }> {
  const transporter = await getTransporter();
  if (!transporter) {
    return { sent: false, error: 'Email not configured. Set SMTP in admin settings.' };
  }

  const settings = await prisma.platformSetting.findMany({
    where: { group: 'email' },
  });
  const config: Record<string, string> = {};
  for (const s of settings) config[s.key] = s.value;
  const fromEmail = options.from || config.from_email || 'noreply@platform.com';

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      text: options.text || '',
      html: options.html || options.text || '',
    });
    return { sent: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { sent: false, error: msg };
  }
}

export function clearEmailCache() {
  transporterCache = null;
  lastConfigHash = '';
}
