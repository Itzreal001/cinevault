import fs from 'fs';
import path from 'path';

const file = path.resolve(new URL('.', import.meta.url).pathname, '../data/movies.json');
let cache = null;

function load() {
  if (cache) return cache;
  const raw = fs.readFileSync(file, 'utf-8');
  cache = JSON.parse(raw);
  return cache;
}

export function getMovieById(id) {
  const list = load();
  return list.find(m => String(m.movieId) === String(id));
}

export function refreshMovies() {
  cache = null;
  return load();
}