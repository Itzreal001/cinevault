import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { seedMovies, createUser, getUserByUsername } from './db.js';

import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const moviesFile = path.join(__dirname, '..', 'data', 'movies.json');
if (!fs.existsSync(moviesFile)) {
  console.error('No movies.json found to seed.');
  process.exit(1);
}

const raw = fs.readFileSync(moviesFile, 'utf8');
const list = JSON.parse(raw);

await seedMovies(list);
console.log(`Seeded ${list.length} movies.`);

// create a default dev user if not exists
const username = 'dev';
const password = process.env.DEV_USER_PASSWORD || 'password';
const existing = await getUserByUsername(username);
if (!existing) {
  const hash = bcrypt.hashSync(password, 10);
  await createUser(username, hash, 'admin');
  console.log(`Created dev user: ${username} / ${password}`);
} else {
  console.log('Dev user already exists.');
}

console.log('Migration complete.');
