/**
 * Email service for TrampoHero.
 *
 * Uses nodemailer with SMTP configuration from env.
 * When EMAIL_ENABLED=false (default in development), emails are logged to
 * console instead of being sent, so the system works without SMTP setup.
 */

import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  if (env.EMAIL_ENABLED && env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    _transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  } else {
    // Ethereal / console fallback for development
    _transporter = {
      sendMail: async (opts) => {
        console.log('[emailService] Email not configured – logging instead:');
        console.log(`  To: ${opts.to}`);
        console.log(`  Subject: ${opts.subject}`);
        if (opts.text) console.log(`  Body: ${opts.text}`);
        return { messageId: 'dev-noop' };
      },
    };
  }

  return _transporter;
}

/**
 * Send an email verification link to a newly registered user.
 * @param {string} to - Recipient email address
 * @param {string} token - Raw verification token
 */
export async function sendVerificationEmail(to, token) {
  const url = `${env.FRONTEND_URL}/verify-email?token=${token}`;
  await getTransporter().sendMail({
    from: env.EMAIL_FROM,
    to,
    subject: 'TrampoHero – Verifique seu e-mail',
    text: `Olá!\n\nClique no link abaixo para verificar seu e-mail:\n\n${url}\n\nEste link expira em 24 horas.\n\nSe você não criou uma conta, ignore este e-mail.`,
    html: `<p>Olá!</p><p>Clique no link abaixo para verificar seu e-mail:</p><p><a href="${url}">${url}</a></p><p>Este link expira em <strong>24 horas</strong>.</p><p>Se você não criou uma conta, ignore este e-mail.</p>`,
  });
}

/**
 * Send a password-reset link.
 * @param {string} to - Recipient email address
 * @param {string} token - Raw reset token
 */
export async function sendPasswordResetEmail(to, token) {
  const url = `${env.FRONTEND_URL}/reset-password?token=${token}`;
  await getTransporter().sendMail({
    from: env.EMAIL_FROM,
    to,
    subject: 'TrampoHero – Redefinição de senha',
    text: `Olá!\n\nRecebemos uma solicitação de redefinição de senha para sua conta.\n\nClique no link abaixo (válido por 1 hora):\n\n${url}\n\nSe você não solicitou isso, ignore este e-mail.`,
    html: `<p>Olá!</p><p>Recebemos uma solicitação de redefinição de senha para sua conta.</p><p><a href="${url}">Redefinir senha</a> (válido por <strong>1 hora</strong>)</p><p>Se você não solicitou isso, ignore este e-mail.</p>`,
  });
}
