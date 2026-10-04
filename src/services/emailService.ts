/**
 * Client-side email service proxy
 * Communicates strictly with server-side endpoints (/api/email/*).
 * NEVER handles or stores raw email passwords or secrets.
 */

export interface EmailStatus {
  configured: boolean;
  host: string;
  port: string;
  secure: boolean;
  user: string | null;
  from: string | null;
}

export const emailService = {
  /**
   * Check if SMTP is configured on the server
   */
  async getStatus(): Promise<EmailStatus> {
    try {
      const res = await fetch('/api/email/status');
      if (!res.ok) throw new Error('Status endpoint unavailable');
      return await res.json();
    } catch {
      return {
        configured: false,
        host: 'smtp.gmail.com',
        port: '587',
        secure: false,
        user: null,
        from: null
      };
    }
  },

  /**
   * Send a test verification email through the server
   */
  async sendTestEmail(to?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to })
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error connecting to email service.' };
    }
  },

  /**
   * Send a document or PDF report through the server
   */
  async sendDocumentEmail(params: {
    to: string;
    subject: string;
    htmlText: string;
    pdfBase64?: string;
    pdfFilename?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error sending document.' };
    }
  }
};
