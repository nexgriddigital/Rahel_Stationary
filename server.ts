import express from 'express';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // Helper to create nodemailer transporter using server environment variables
  const getTransporter = () => {
    const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.EMAIL_PORT || '587', 10);
    const secure = process.env.EMAIL_SECURE === 'true' || port === 465;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASSWORD;

    if (!user || !pass) {
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass
      }
    });
  };

  // Status check endpoint (does NOT reveal password or raw secrets)
  app.get('/api/email/status', (req, res) => {
    const isConfigured = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
    const user = process.env.EMAIL_USER;
    const maskedUser = user
      ? user.includes('@')
        ? `${user.slice(0, 3)}***@${user.split('@')[1]}`
        : '***'
      : null;

    res.json({
      configured: isConfigured,
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || '587',
      secure: process.env.EMAIL_SECURE === 'true',
      user: maskedUser,
      from: process.env.EMAIL_FROM || (user ? `Rahel Stationery <${user}>` : null)
    });
  });

  // Verify / Test connection endpoint
  app.post('/api/email/test', async (req, res) => {
    try {
      const transporter = getTransporter();
      if (!transporter) {
        return res.status(400).json({
          success: false,
          error: 'Email credentials are not yet configured. Please set EMAIL_USER and EMAIL_PASSWORD in environment variables.'
        });
      }

      await transporter.verify();

      const to = req.body?.to || process.env.EMAIL_USER;
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || `Rahel Stationery <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Rahel Stationery POS — Email System Test',
        text: 'Hello! Your Google Gmail SMTP email integration for Rahel Stationery POS is active and functioning properly.',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; background: #faf9f6; border-radius: 12px; border: 1px solid #d4af37; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #b38600; margin-top: 0;">Rahel Stationery POS</h2>
            <p style="font-size: 14px; color: #333;"><strong>Google SMTP Integration Verified!</strong></p>
            <p style="font-size: 13px; color: #555; line-height: 1.5;">
              Your Google Gmail SMTP connection has been successfully established and verified. Sales receipts and PDF audit reports can now be dispatched securely from your server.
            </p>
            <div style="margin-top: 16px; padding: 12px; background: #fff; border-radius: 8px; border: 1px solid #eee; font-size: 11px; color: #888;">
              Sender: ${process.env.EMAIL_FROM || process.env.EMAIL_USER}<br>
              Server: ${process.env.EMAIL_HOST || 'smtp.gmail.com'}:${process.env.EMAIL_PORT || '587'}
            </div>
          </div>
        `
      });

      res.json({ success: true, messageId: info.messageId });
    } catch (err: any) {
      console.error('SMTP test error:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to verify SMTP connection.' });
    }
  });

  // Send PDF report or receipt email endpoint
  app.post('/api/email/send', async (req, res) => {
    try {
      const transporter = getTransporter();
      if (!transporter) {
        return res.status(400).json({
          success: false,
          error: 'Email service is not configured. Please set EMAIL_USER and EMAIL_PASSWORD in environment variables.'
        });
      }

      const { to, subject, htmlText, pdfBase64, pdfFilename } = req.body;
      if (!to) {
        return res.status(400).json({ success: false, error: 'Recipient email address (to) is required.' });
      }

      const attachments = [];
      if (pdfBase64 && pdfFilename) {
        const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
        attachments.push({
          filename: pdfFilename,
          content: Buffer.from(base64Data, 'base64'),
          contentType: 'application/pdf'
        });
      }

      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || `Rahel Stationery <${process.env.EMAIL_USER}>`,
        to,
        subject: subject || 'Rahel Stationery POS Document',
        html: htmlText || '<p>Please find attached your document from Rahel Stationery POS.</p>',
        attachments
      });

      res.json({ success: true, messageId: info.messageId });
    } catch (err: any) {
      console.error('Send email error:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to send email.' });
    }
  });

  // In development, hook Vite middleware
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
