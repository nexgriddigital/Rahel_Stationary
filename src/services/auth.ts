/**
 * Server-Enforced Authentication & Session Service
 * 
 * Strict session management rules:
 * 1. Every new device, browser, shared link, and incognito tab must authenticate.
 * 2. 60-minute server-enforced inactivity timeout.
 * 3. Sessions are managed via secure HttpOnly cookies + optional authorization tokens.
 * 4. Active user interactions (clicks, keypresses, scrolls) refresh the inactivity window.
 * 5. Direct links never grant access without server authentication.
 */

export interface ServerUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'admin' | 'cashier' | 'manager';
}

export interface ServerSession {
  id: string;
  user: ServerUser;
  createdAt: number;
  lastActivityAt: number;
  expiresAt: number;
}

export interface SessionStatusResponse {
  authenticated: boolean;
  user?: ServerUser;
  session?: ServerSession;
  expiresAt?: number;
  remainingSeconds?: number;
  error?: string;
  message?: string;
}

const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes
const ACTIVITY_PING_THROTTLE_MS = 30 * 1000; // Throttle activity ping to at most once per 30s of active user events

class AuthService {
  private currentSession: ServerSession | null = null;
  private lastActivityPing = 0;
  private tokenFallback: string | null = null;
  private sessionListeners: Set<(session: ServerSession | null) => void> = new Set();
  private expirationListeners: Set<(reason: string) => void> = new Set();

  constructor() {
    // Invalidate any legacy browser storage tokens so all devices start clean
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('rahel_pos_session_v1');
        sessionStorage.removeItem('rahel_pos_session_v1');
        const savedToken = sessionStorage.getItem('rahel_auth_token_fallback');
        if (savedToken) {
          this.tokenFallback = savedToken;
        }
      } catch {}
    }
  }

  public subscribe(cb: (session: ServerSession | null) => void): () => void {
    this.sessionListeners.add(cb);
    return () => this.sessionListeners.delete(cb);
  }

  public onExpiration(cb: (reason: string) => void): () => void {
    this.expirationListeners.add(cb);
    return () => this.expirationListeners.delete(cb);
  }

  private notify(session: ServerSession | null) {
    this.currentSession = session;
    this.sessionListeners.forEach(cb => {
      try {
        cb(session);
      } catch (e) {
        console.error('Session listener error:', e);
      }
    });
  }

  private notifyExpired(reason: string) {
    this.currentSession = null;
    this.tokenFallback = null;
    try {
      sessionStorage.removeItem('rahel_auth_token_fallback');
    } catch {}
    this.expirationListeners.forEach(cb => {
      try {
        cb(reason);
      } catch (e) {
        console.error('Expiration listener error:', e);
      }
    });
    this.notify(null);
  }

  private getAuthHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.tokenFallback) {
      headers['Authorization'] = `Bearer ${this.tokenFallback}`;
    }
    return headers;
  }

  /**
   * Check current session with the server.
   * If cookie/token is missing, invalid, or expired after 60 min inactivity, returns authenticated: false.
   */
  public async checkSession(): Promise<SessionStatusResponse> {
    try {
      const res = await fetch('/api/auth/session', {
        method: 'GET',
        headers: this.getAuthHeaders(),
        credentials: 'include' // include HttpOnly cookies
      });

      if (res.status === 401) {
        const data = await res.json().catch(() => ({}));
        if (data.error === 'SESSION_EXPIRED') {
          this.notifyExpired(data.message || 'Your session expired due to inactivity. Please log in again.');
          return {
            authenticated: false,
            error: 'SESSION_EXPIRED',
            message: data.message || 'Your session expired due to inactivity. Please log in again.'
          };
        }
        this.notify(null);
        return {
          authenticated: false,
          error: 'UNAUTHENTICATED',
          message: 'Please log in to continue.'
        };
      }

      if (!res.ok) {
        this.notify(null);
        return { authenticated: false };
      }

      const data: SessionStatusResponse = await res.json();
      if (data.authenticated && data.user) {
        const fullSession: ServerSession = {
          id: data.session?.id || 'active',
          user: data.user,
          createdAt: data.session?.createdAt || Date.now(),
          lastActivityAt: data.session?.lastActivityAt || Date.now(),
          expiresAt: data.expiresAt || Date.now() + INACTIVITY_TIMEOUT_MS
        };
        this.currentSession = fullSession;
        this.notify(fullSession);
        return {
          ...data,
          session: fullSession
        };
      } else {
        this.notify(null);
        return { authenticated: false };
      }
    } catch (err) {
      console.warn('Network error checking server session:', err);
      return { authenticated: false, error: 'NETWORK_ERROR' };
    }
  }

  /**
   * Login with identifier and password.
   */
  public async login(
    identifier: string,
    passwordAttempt: string
  ): Promise<{ success: boolean; error?: string; session?: ServerSession }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          identifier: identifier.trim(),
          password: passwordAttempt
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Invalid username/email or password.'
        };
      }

      if (data.token) {
        this.tokenFallback = data.token;
        try {
          sessionStorage.setItem('rahel_auth_token_fallback', data.token);
        } catch {}
      }

      const session: ServerSession = data.session;
      this.currentSession = session;
      this.lastActivityPing = Date.now();
      this.notify(session);

      return { success: true, session };
    } catch (err) {
      console.error('Login request failed:', err);
      return {
        success: false,
        error: 'Unable to reach authentication server. Please check your network connection.'
      };
    }
  }

  /**
   * Record user interaction and reset the 60-minute inactivity timer on the server.
   * Throttled to prevent flooding.
   */
  public async recordActivity(force = false): Promise<void> {
    if (!this.currentSession) return;
    const now = Date.now();
    if (!force && now - this.lastActivityPing < ACTIVITY_PING_THROTTLE_MS) {
      return;
    }
    this.lastActivityPing = now;

    try {
      const res = await fetch('/api/auth/activity', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        credentials: 'include'
      });

      if (res.status === 401) {
        const data = await res.json().catch(() => ({}));
        if (data.error === 'SESSION_EXPIRED') {
          this.notifyExpired('Your session expired due to inactivity. Please log in again.');
        }
      } else if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.expiresAt && this.currentSession) {
          this.currentSession.expiresAt = data.expiresAt;
          this.currentSession.lastActivityAt = now;
        }
      }
    } catch {}
  }

  /**
   * Explicit user logout. Destroys session on the server and clears cookies.
   */
  public async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        credentials: 'include'
      });
    } catch {}

    this.currentSession = null;
    this.tokenFallback = null;
    try {
      sessionStorage.removeItem('rahel_auth_token_fallback');
      localStorage.removeItem('rahel_pos_session_v1');
      sessionStorage.removeItem('rahel_pos_session_v1');
    } catch {}
    this.notify(null);
  }

  /**
   * Reset administrator password with verified PIN.
   */
  public async resetPasswordWithVerification(
    identifier: string,
    pin: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, pin, newPassword })
      });
      const data = await res.json().catch(() => ({}));
      return data;
    } catch {
      return { success: false, error: 'Network error resetting password.' };
    }
  }

  public getSession(): ServerSession | null {
    return this.currentSession;
  }
}

export const authService = new AuthService();
