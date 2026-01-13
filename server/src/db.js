import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'db.sqlite');

// Ensure data dir exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

let db;

export async function initDb() {
  if (db) return db;
  db = await open({ filename: DB_PATH, driver: sqlite3.Database });
  // Enable foreign keys
  await db.exec('PRAGMA foreign_keys = ON;');

  await db.exec(`
    CREATE TABLE IF NOT EXISTS movies (
      movieId TEXT PRIMARY KEY,
      s3Key TEXT NOT NULL,
      filename TEXT,
      downloadable INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user'
    );

    CREATE TABLE IF NOT EXISTS downloads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      movie_id TEXT,
      ip TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  return db;
}

export async function getMovieById(id) {
  const d = await initDb();
  const row = await d.get('SELECT * FROM movies WHERE movieId = ?', String(id));
  return row || null;
}

export async function seedMovies(list) {
  const d = await initDb();
  const insert = await d.prepare('INSERT OR REPLACE INTO movies (movieId, s3Key, filename, downloadable) VALUES (?, ?, ?, ?)');
  try {
    await d.exec('BEGIN');
    for (const it of list) {
      await insert.run(String(it.movieId), it.s3Key, it.filename || null, it.downloadable ? 1 : 0);
    }
    await d.exec('COMMIT');
  } catch (err) {
    await d.exec('ROLLBACK');
    throw err;
  } finally {
    await insert.finalize();
  }
}

export async function createUser(username, passwordHash, role = 'user') {
  const d = await initDb();
  const res = await d.run('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', username, passwordHash, role);
  return { id: res.lastID, username, role };
}

export async function getUserByUsername(username) {
  const d = await initDb();
  return await d.get('SELECT * FROM users WHERE username = ?', username) || null;
}

export async function logDownload({ userId = null, movieId, ip = null }) {
  const d = await initDb();
  await d.run('INSERT INTO downloads (user_id, movie_id, ip) VALUES (?, ?, ?)', userId, movieId, ip);
}

export async function allDownloadsForUser(userId) {
  const d = await initDb();
  return await d.all('SELECT * FROM downloads WHERE user_id = ? ORDER BY created_at DESC', userId);
}

// Update the `downloadable` flag for all movies (returns number of rows changed)
export async function setAllMoviesDownloadable(val) {
  const d = await initDb();
  const res = await d.run('UPDATE movies SET downloadable = ?', val ? 1 : 0);
  return res.changes ?? 0;
}

export default { initDb };

