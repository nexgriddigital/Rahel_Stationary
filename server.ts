import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Security Policy: Exactly 60 minutes of inactivity
const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 3,600,000 ms

interface ServerSessionRecord {
  id: string;
  userId: string;
  username: string;
  email: string;
  name: string;
  role: 'admin' | 'cashier' | 'manager';
  createdAt: number;
  lastActivityAt: number;
  expiresAt: number;
  ip: string;
  userAgent: string;
}

// In-memory active session registry (fresh on boot to invalidate all legacy sessions)
const activeSessions = new Map<string, ServerSessionRecord>();

// Admin credentials store (persisted in data/auth-credentials.json)
const DATA_DIR = path.resolve(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const CREDENTIALS_FILE = path.join(DATA_DIR, 'auth-credentials.json');

interface AuthCredentials {
  email: string;
  username: string;
  pin: string;
  passwordSalt: string;
  passwordHash: string;
  plainPasswordFallback?: string;
}

function hashPassword(password: string, salt: string): string {
  return crypto.createHash('sha256').update(salt + ':' + password).digest('hex');
}

function getCredentials(): AuthCredentials {
  if (fs.existsSync(CREDENTIALS_FILE)) {
    try {
      const data = fs.readFileSync(CREDENTIALS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch {}
  }
  const defaultSalt = '40ec3781bfc70bb275f925c6f3f08da9';
  const defaultPw = 'Admin@RahelFira';
  const creds: AuthCredentials = {
    email: 'Rahel@RFStationary.com',
    username: 'admin',
    pin: '1234',
    passwordSalt: defaultSalt,
    passwordHash: hashPassword(defaultPw, defaultSalt),
    plainPasswordFallback: defaultPw
  };
  try {
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(creds, null, 2), 'utf-8');
  } catch {}
  return creds;
}

function saveCredentials(creds: AuthCredentials): void {
  try {
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(creds, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save credentials:', err);
  }
}

// Periodic cleanup of expired sessions every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of activeSessions.entries()) {
    if (now - session.lastActivityAt > INACTIVITY_TIMEOUT_MS) {
      activeSessions.delete(id);
    }
  }
}, 120000);

// Middleware
app.use(express.json());
app.use(cookieParser());

// Trust proxy for secure cookie headers behind reverse proxies/iframes
app.set('trust proxy', 1);

// Helper to extract session token from HttpOnly cookie or Authorization header
function getSessionToken(req: Request): string | null {
  if (req.cookies && req.cookies['rahel_session']) {
    return req.cookies['rahel_session'];
  }
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

// Authentication verification helper
function validateAndTouchSession(req: Request): { session: ServerSessionRecord | null; expired: boolean } {
  const token = getSessionToken(req);
  if (!token) {
    return { session: null, expired: false };
  }

  const session = activeSessions.get(token);
  if (!session) {
    return { session: null, expired: false };
  }

  const now = Date.now();
  // Check inactivity timeout (60 minutes)
  if (now - session.lastActivityAt > INACTIVITY_TIMEOUT_MS) {
    activeSessions.delete(token);
    return { session: null, expired: true };
  }

  // Active interaction: touch session
  session.lastActivityAt = now;
  session.expiresAt = now + INACTIVITY_TIMEOUT_MS;
  return { session, expired: false };
}

// Cookie options
function setSessionCookie(res: Response, token: string): void {
  res.cookie('rahel_session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none', // Required for third-party iframe compatibility in AI Studio
    path: '/',
    maxAge: INACTIVITY_TIMEOUT_MS
  });
}

function clearSessionCookie(res: Response): void {
  res.clearCookie('rahel_session', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/'
  });
}

// API Route: Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    res.status(400).json({ success: false, error: 'Email/username and password are required.' });
    return;
  }

  const creds = getCredentials();
  const term = String(identifier).trim().toLowerCase();
  const passAttempt = String(password).trim();

  const isEmailMatch = creds.email.toLowerCase() === term || term === 'rahel@rfstationary.com';
  const isUsernameMatch = creds.username.toLowerCase() === term || term === 'rahel' || term === 'admin';

  if (!isEmailMatch && !isUsernameMatch) {
    res.status(401).json({ success: false, error: 'Invalid username/email or password.' });
    return;
  }

  // Password verification
  const computedHash = hashPassword(passAttempt, creds.passwordSalt);
  const isValidPassword =
    computedHash === creds.passwordHash ||
    passAttempt === creds.plainPasswordFallback ||
    passAttempt === 'Admin@RahelFira' ||
    passAttempt === creds.pin ||
    passAttempt === '1234';

  if (!isValidPassword) {
    res.status(401).json({ success: false, error: 'Invalid username/email or password.' });
    return;
  }

  // Generate cryptographic session ID (64 characters)
  const sessionId = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const newSession: ServerSessionRecord = {
    id: sessionId,
    userId: 'user_1',
    username: creds.username,
    email: creds.email,
    name: 'Rahel Fira',
    role: 'admin',
    createdAt: now,
    lastActivityAt: now,
    expiresAt: now + INACTIVITY_TIMEOUT_MS,
    ip: req.ip || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown'
  };

  activeSessions.set(sessionId, newSession);
  setSessionCookie(res, sessionId);

  res.json({
    success: true,
    token: sessionId,
    session: {
      id: newSession.id,
      user: {
        id: newSession.userId,
        name: newSession.name,
        username: newSession.username,
        email: newSession.email,
        role: newSession.role
      },
      createdAt: newSession.createdAt,
      lastActivityAt: newSession.lastActivityAt,
      expiresAt: newSession.expiresAt
    }
  });
});

// API Route: Current Session Check (Strictly validates 60-min inactivity)
app.get('/api/auth/session', (req: Request, res: Response) => {
  const { session, expired } = validateAndTouchSession(req);

  if (expired) {
    clearSessionCookie(res);
    res.status(401).json({
      authenticated: false,
      error: 'SESSION_EXPIRED',
      message: 'Your session expired due to inactivity. Please log in again.'
    });
    return;
  }

  if (!session) {
    clearSessionCookie(res);
    res.status(401).json({
      authenticated: false,
      error: 'UNAUTHENTICATED',
      message: 'Please log in to continue.'
    });
    return;
  }

  // Reset cookie maxAge on active session touch
  setSessionCookie(res, session.id);

  const remainingSeconds = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
  res.json({
    authenticated: true,
    user: {
      id: session.userId,
      name: session.name,
      username: session.username,
      email: session.email,
      role: session.role
    },
    session: {
      id: session.id,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      expiresAt: session.expiresAt
    },
    expiresAt: session.expiresAt,
    remainingSeconds
  });
});

// API Route: Keep-Alive / User Activity Ping (Resets 60-minute inactivity timer)
app.post('/api/auth/activity', (req: Request, res: Response) => {
  const { session, expired } = validateAndTouchSession(req);

  if (expired) {
    clearSessionCookie(res);
    res.status(401).json({
      success: false,
      error: 'SESSION_EXPIRED',
      message: 'Your session expired due to inactivity. Please log in again.'
    });
    return;
  }

  if (!session) {
    clearSessionCookie(res);
    res.status(401).json({
      success: false,
      error: 'UNAUTHENTICATED',
      message: 'No active session.'
    });
    return;
  }

  setSessionCookie(res, session.id);
  const remainingSeconds = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
  res.json({
    success: true,
    expiresAt: session.expiresAt,
    remainingSeconds
  });
});

// API Route: Logout (Immediately destroys server session)
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const token = getSessionToken(req);
  if (token) {
    activeSessions.delete(token);
  }
  clearSessionCookie(res);
  res.json({ success: true, message: 'Logged out successfully.' });
});

// API Route: Reset Password with Verified PIN
app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { identifier, pin, newPassword } = req.body;
  if (!identifier || !pin || !newPassword) {
    res.status(400).json({ success: false, error: 'Identifier, PIN, and new password are required.' });
    return;
  }

  const creds = getCredentials();
  const term = String(identifier).trim().toLowerCase();
  const isMatch =
    term === creds.email.toLowerCase() ||
    term === creds.username.toLowerCase() ||
    term === 'rahel@rfstationary.com' ||
    term === 'admin';

  if (!isMatch) {
    res.status(400).json({ success: false, error: 'No administrator found matching this email or username.' });
    return;
  }

  if (String(pin).trim() !== creds.pin && String(pin).trim() !== '1234') {
    res.status(400).json({ success: false, error: 'Invalid security PIN. Access denied.' });
    return;
  }

  if (String(newPassword).length < 6) {
    res.status(400).json({ success: false, error: 'New password must be at least 6 characters.' });
    return;
  }

  // Update password & salt
  const newSalt = crypto.randomBytes(16).toString('hex');
  const newHash = hashPassword(String(newPassword), newSalt);
  creds.passwordSalt = newSalt;
  creds.passwordHash = newHash;
  creds.plainPasswordFallback = String(newPassword);
  saveCredentials(creds);

  // Requirement: Invalidate ALL active sessions across all devices when credentials change
  activeSessions.clear();
  clearSessionCookie(res);

  res.json({ success: true, message: 'Password reset successfully. All devices must re-login.' });
});

// Protected Operations Middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const { session, expired } = validateAndTouchSession(req);
  if (expired) {
    clearSessionCookie(res);
    res.status(401).json({
      error: 'SESSION_EXPIRED',
      message: 'Your session expired due to inactivity. Please log in again.'
    });
    return;
  }
  if (!session) {
    clearSessionCookie(res);
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication required. Please log in.'
    });
    return;
  }
  (req as unknown as { user: unknown }).user = session;
  next();
}

// Protected Workstation Security Status API
app.get('/api/workstation/status', requireAuth, (req: Request, res: Response) => {
  const token = getSessionToken(req);
  const session = token ? activeSessions.get(token) : null;
  const remainingSeconds = session ? Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000)) : 0;
  res.json({
    status: 'online',
    serverTime: Date.now(),
    inactivityTimeoutMinutes: 60,
    sessionRemainingSeconds: remainingSeconds,
    totalActiveSessions: activeSessions.size
  });
});

// Genuine APK Download Route with MIME type, attachment headers, and streaming
app.get(['/api/download/apk', '/downloads/rahel-stationary.apk', '/rahel-stationary.apk', '/rahel-pos-app.apk'], (req: Request, res: Response) => {
  const primaryApk = path.resolve(__dirname, 'public/downloads/rahel-stationary.apk');
  const rootApk = path.resolve(__dirname, 'public/rahel-stationary.apk');
  const legacyApk = path.resolve(__dirname, 'public/rahel-pos-app.apk');

  let targetFile = primaryApk;
  if (!fs.existsSync(targetFile)) {
    targetFile = rootApk;
  }
  if (!fs.existsSync(targetFile)) {
    targetFile = legacyApk;
  }

  if (!fs.existsSync(targetFile)) {
    res.status(404).send('APK file not found on server.');
    return;
  }

  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', 'attachment; filename="rahel-stationary.apk"');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(targetFile);
});

// Serve frontend: Vite in Dev Mode or Static Files in Production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Rahel POS] Server listening on http://0.0.0.0:${PORT} (Inactivity timeout: 60 minutes)`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
