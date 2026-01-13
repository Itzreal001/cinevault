import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getSignedUrlPromise } from './signedUrl.js';
import { initDb, getMovieById, getUserByUsername, logDownload, setAllMoviesDownloadable } from './db.js';

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize DB (ensure tables created)
await initDb();

// Simple health check
app.get('/_health', (req, res) => res.json({ status: 'ok' }));

// Auth helpers
function signToken(payload) {
  const secret = process.env.SERVER_JWT_SECRET || 'devsecret';
  return jwt.sign(payload, secret, { expiresIn: '8h' });
}

function verifyToken(token) {
  const secret = process.env.SERVER_JWT_SECRET || 'devsecret';
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    return null;
  }
}

// Simple auth middleware — supports server API key or Bearer token
function authMiddleware(req, res, next) {
  const serverKey = process.env.SERVER_API_KEY;
  const key = req.get('x-api-key') || req.query.api_key;
  if (serverKey && key && key === serverKey) {
    // server-level API key granted
    req.serverApiKey = true;
    return next();
  }

  const auth = req.get('authorization');
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    const payload = verifyToken(token);
    if (!payload) return res.status(401).json({ error: 'Invalid token' });
    req.user = payload; // payload should include id and username
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized' });
}

// Optional auth middleware: does the same detection but allows unauthenticated requests.
// This is used for the download route so we can optionally permit public downloads via env var.
function authOptionalMiddleware(req, res, next) {
  const serverKey = process.env.SERVER_API_KEY;
  const key = req.get('x-api-key') || req.query.api_key;
  if (serverKey && key && key === serverKey) {
    req.serverApiKey = true;
    return next();
  }

  const auth = req.get('authorization');
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  return next();
}

// Rate limiter: per-user when authenticated, otherwise per-IP
const downloadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { error: 'Too many downloads, try again later' },
  keyGenerator: (req) => (req.user ? `user_${req.user.id}` : req.ip),
});

/* ---------------- AUTH ROUTES ---------------- */
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

  const user = await getUserByUsername(username);
  if (!user) return res.status(401).json({ error: 'Invalid username or password' });

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid username or password' });

  const token = signToken({ id: user.id, username: user.username, role: user.role });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

/* ---------------- DOWNLOAD ROUTE ---------------- */
app.get('/api/download/:movieId', authOptionalMiddleware, downloadLimiter, async (req, res) => {
  const { movieId } = req.params;
  console.log(`[download] movieId=${movieId} ip=${req.ip} origin=${req.get('origin') || req.get('referer')}`);

  try {
    const movie = await getMovieById(movieId);
    if (!movie) return res.status(404).json({ error: 'Movie not found' });

    // If not authenticated (no user and no server API key), require ALLOW_PUBLIC_DOWNLOADS to be '1'
    if (!req.user && !req.serverApiKey && process.env.ALLOW_PUBLIC_DOWNLOADS !== '1') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Allow forcing all movies downloadable via env var
    const forceAll = process.env.FORCE_ALL_DOWNLOADS === '1';
    if (!movie.downloadable && !req.serverApiKey && !forceAll) return res.status(403).json({ error: 'Download not allowed for this movie' });

    const s3Key = movie.s3Key;
    // Allow client to override the filename via ?filename=... (use decodeURIComponent)
    const filename = req.query.filename ? decodeURIComponent(req.query.filename) : movie.filename || `${movieId}.mp4`;

    const url = await getSignedUrlPromise(s3Key, {
      Bucket: process.env.S3_BUCKET,
      expiresIn: 60, // seconds
      filename,
      contentDisposition: `attachment; filename="${filename}"`
    });

    // Audit
    try { await logDownload({ userId: req.user?.id ?? null, movieId, ip: req.ip }); } catch (err) { console.warn('Audit failed', err); }

    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate signed url' });
  }
});

// Admin: set all movies downloadable or not (requires server API key or valid auth token)
app.post('/api/admin/movies/downloadable', authMiddleware, async (req, res) => {
  const { downloadable } = req.body;
  if (typeof downloadable !== 'boolean') return res.status(400).json({ error: 'downloadable must be boolean' });

  try {
    const updated = await setAllMoviesDownloadable(downloadable);
    res.json({ success: true, updated });
  } catch (err) {
    console.error('Failed to update movies', err);
    res.status(500).json({ error: 'Failed to update movies' });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server listening on ${port}`));