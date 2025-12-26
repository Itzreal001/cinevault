import { useEffect, useState } from 'react';
import MovieCard from '../components/MovieCard';
import SkeletonCard from '../components/SkeletonCard';
import Hero from '../components/Hero';
import PageWrapper from '../components/PageWrapper';

import {
  getPopularMovies,
  searchMovies,
  getGenres,
  getMoviesByGenre
} from '../services/movieAPI';

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [genresMap, setGenresMap] = useState({});
  const [activeGenre, setActiveGenre] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

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
      : getPopularMovies(page);

    fetcher.then(data => {
      if (!Array.isArray(data)) return; // safety check
      if (page === 1) setMovies(data); // first page replaces
      else setMovies(prev => [...prev, ...data]); // append next page
      setHasMore(data.length > 0); // disable load more if no more movies
      setLoading(false);
    });
  }, [query, activeGenre, page]);

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
        <div className="movie-grid">
          {loading && page === 1
            ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
            : movies.slice(page === 1 ? 1 : 0).map(movie => (
                <MovieCard key={movie.id} movie={movie} genresMap={genresMap} />
              ))}
        </div>

        {/* LOAD MORE BUTTON */}
        {hasMore && !loading && (
          <button className="load-more" onClick={() => setPage(prev => prev + 1)}>
            Load More
          </button>
        )}

        {/* LOADING SKELETONS FOR NEXT PAGE */}
        {loading && page > 1 && (
          <div className="movie-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}
      </section>
    </PageWrapper>
  );
}
