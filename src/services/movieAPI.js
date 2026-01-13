const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export async function getPopularMovies() {
  const res = await fetch(
    `${BASE_URL}/movie/popular?api_key=${API_KEY}`
  );
  const data = await res.json();
  return data.results;
}

export async function searchMovies(query) {
  const res = await fetch(
    `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}`
  );
  const data = await res.json();
  return data.results;
}

export function getPoster(path) {
  return path
    ? `https://image.tmdb.org/t/p/w500${path}`
    : 'https://via.placeholder.com/300x450?text=No+Image';
}

export async function getMovieTrailer(movieId) {
  const res = await fetch(
    `${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}`
  );
  const data = await res.json();

  // Find YouTube trailer
  return data.results.find(
    vid => vid.type === 'Trailer' && vid.site === 'YouTube'
  );
}


export async function getGenres() {
  const res = await fetch(
    `${BASE_URL}/genre/movie/list?api_key=${API_KEY}`
  );
  const data = await res.json();
  return data.genres;
}

export async function getMoviesByGenre(genreId) {
  const res = await fetch(
    `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}`
  );
  const data = await res.json();
  return data.results;
}

/**
 * Returns a deterministic "daily" movie list that changes every day.
 * We rotate between several TMDB endpoints (trending, top rated, upcoming, now playing, popular)
 * and also vary the page to get fresh results each day.
 */
export async function getDailyMovies(daySeed = Math.floor(Date.now() / 86400000), page = 1) {
  const endpoints = [
    'trending/movie/day',
    'movie/top_rated',
    'movie/upcoming',
    'movie/now_playing',
    'movie/popular'
  ];
  const idx = daySeed % endpoints.length;
  const endpoint = endpoints[idx];
  const pageParam = `&page=${page || ((daySeed % 10) + 1)}`; // use provided page or derive from seed
  const url = endpoint.includes('?')
    ? `${BASE_URL}/${endpoint}&api_key=${API_KEY}${pageParam}`
    : `${BASE_URL}/${endpoint}?api_key=${API_KEY}${pageParam}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

/**
 * Get trending/popular movies for a specific year.
 * Uses the discover endpoint with primary_release_year and sorts by popularity.
 */
export async function getTrendingByYear(year = 2025, page = 1) {
  const url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&primary_release_year=${year}&sort_by=popularity.desc&page=${page}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

