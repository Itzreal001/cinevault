import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MovieCard from '../components/MovieCard';
import SkeletonCard from '../components/SkeletonCard';
import Hero from '../components/Hero';
import PageWrapper from '../components/PageWrapper';

import {
  getPopularMovies,
  getDailyMovies,
  getTrendingByYear,
  searchMovies,
  getGenres,
  getMoviesByGenre
} from '../services/movieAPI';

const DEFAULT_TREND_YEAR = 2025; // default year shown
const CURRENT_YEAR = new Date().getFullYear();

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [genresMap, setGenresMap] = useState({});
  const [activeGenre, setActiveGenre] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [trendYear, setTrendYear] = useState(DEFAULT_TREND_YEAR);
  const [notice, setNotice] = useState('');
  const [showNotice, setShowNotice] = useState(false);

  // Reset to first page and show a small transient toast when trend year changes
  useEffect(() => {
    setPage(1);
    setNotice(`Showing trending movies for ${trendYear}`);
    setShowNotice(true);
    const t = setTimeout(() => setShowNotice(false), 3000);
    return () => clearTimeout(t);
  }, [trendYear]);

  const getDaySeed = () => Math.floor(Date.now() / 86400000);
  const [daySeed, setDaySeed] = useState(getDaySeed());

  // Refresh movie list at midnight (so the site shows the next day's list without reload)
  useEffect(() => {
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
    const t = setTimeout(() => setDaySeed(getDaySeed()), msUntilMidnight);
    return () => clearTimeout(t);
  }, []);

  // When the day changes, reset to first page to fetch new day's movies
  useEffect(() => {
    setPage(1);
  }, [daySeed]);

  /* -------------------- GENRES -------------------- */
  useEffect(() => {
    getGenres().then(list => {
      setGenres(list);
      const map = {};
      list.forEach(g => (map[g.id] = g.name));
      setGenresMap(map);
    });
  }, []);

  /* -------------------- FETCH MOVIES -------------------- */
  useEffect(() => {
    setLoading(true);

    const fetcher = query.trim()
      ? searchMovies(query, page)
      : activeGenre
      ? getMoviesByGenre(activeGenre, page)
      : getTrendingByYear(trendYear, page);

    fetcher.then(data => {
      if (!Array.isArray(data)) return; // safety check
      if (page === 1) setMovies(data); // first page replaces
      else setMovies(prev => [...prev, ...data]); // append next page
      setHasMore(data.length > 0); // disable load more if no more movies
      setLoading(false);
    });
  }, [query, activeGenre, page, daySeed, trendYear]);

  /* -------------------- RESET PAGE ON FILTER/SEARCH -------------------- */
  useEffect(() => {
    setPage(1);
  }, [query, activeGenre]);

  /* -------------------- TOP MOVIES FOR HERO -------------------- */
  const featuredMovies = !query && !activeGenre ? movies.slice(0, 5) : [];

  return (
    <PageWrapper>
      {/* HERO BANNER */}
      {featuredMovies.length > 0 && <Hero movies={featuredMovies} />}

      <section className="container">
        <h2 className="section-title">Movies</h2>

        <AnimatePresence>
          {showNotice && (
            <motion.div
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.28 }}
              className="year-toast"
            >
              <span className="year-toast-message">{notice}</span>
              <button
                className="year-toast-close"
                aria-label="Dismiss notification"
                onClick={() => setShowNotice(false)}
              >
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SEARCH */}
        <div className="search-box">
          <input
            type="text"
            placeholder="Search movies..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setActiveGenre(null);
            }}
          />
        </div>

        {/* YEAR PICKER */}
        <div className="trend-year-picker" style={{display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px'}}>
          <label htmlFor="trend-year" style={{fontSize: '0.9rem'}}>Year:</label>
          <select
            id="trend-year"
            value={trendYear}
            onChange={e => {
              const val = Number(e.target.value) || DEFAULT_TREND_YEAR;
              setTrendYear(Math.min(Math.max(val, 1900), CURRENT_YEAR));
              setQuery('');
              setActiveGenre(null);
            }}
            style={{width: '120px', padding: '6px', borderRadius: '6px', border: '1px solid #ddd'}}
          >
            {Array.from({ length: Math.min(11, CURRENT_YEAR - 1900 + 1) }).map((_, i) => {
              const y = CURRENT_YEAR - i;
              return (
                <option key={y} value={y}>{y}</option>
              );
            })}
          </select>

          <span style={{marginLeft: '8px', color: '#666', fontSize: '0.85rem'}}>
            Showing trending for <strong>{trendYear}</strong>
          </span>
        </div>

        {/* GENRES */}
        <div className="genre-bar">
          {genres.map(genre => (
            <button
              key={genre.id}
              className={`genre-btn ${activeGenre === genre.id ? 'active' : ''}`}
              onClick={() => {
                setActiveGenre(genre.id);
                setQuery('');
              }}
            >
              {genre.name}
            </button>
          ))}
        </div>

        {/* MOVIES GRID */}
        <motion.div
          key={`grid-${trendYear}-${query}-${activeGenre}-${page}`}
          className="movie-grid"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {loading && page === 1
            ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
            : movies.slice(page === 1 ? 1 : 0).map(movie => (
                <MovieCard key={movie.id} movie={movie} genresMap={genresMap} />
              ))}
        </motion.div>

        {/* LOAD MORE BUTTON */}
        {hasMore && !loading && (
          <button className="load-more" onClick={() => setPage(prev => prev + 1)}>
            Load More
          </button>
        )}

        {/* LOADING SKELETONS FOR NEXT PAGE */}
        {loading && page > 1 && (
          <motion.div className="movie-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </motion.div>
        )}
      </section>
    </PageWrapper>
  );
}
