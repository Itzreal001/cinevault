import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import TrailerModal from '../components/TrailerModal';
import PageWrapper from '../components/PageWrapper';
import useSEO from '../hooks/useSEO';

import { getMovieTrailer } from '../services/movieAPI';
import { isFavorite, toggleFavorite } from '../services/favorites';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const IMG = 'https://image.tmdb.org/t/p';

export default function MovieDetails() {
  const { id } = useParams();

  const [movie, setMovie] = useState(null);
  const [trailer, setTrailer] = useState(null);
  const [open, setOpen] = useState(false);
  const [fav, setFav] = useState(false);

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`)
      .then(res => res.json())
      .then(data => {
        setMovie(data);
        setFav(isFavorite(data.id));
      });

    getMovieTrailer(id).then(setTrailer);
  }, [id]);

  /* ---------------- SEO ---------------- */
  useSEO({
    title: movie ? `${movie.title} | CineVault` : 'Loading | CineVault',
    description: movie?.overview
  });

  if (!movie) {
    return <p className="container">Loading...</p>;
  }

  const backdropUrl = movie.backdrop_path
    ? `${IMG}/original${movie.backdrop_path}`
    : '';

  const posterUrl = movie.poster_path
    ? `${IMG}/w500${movie.poster_path}`
    : '';

  /* ---------------- UI ---------------- */
  return (
    <PageWrapper>
      <section className="movie-details">
        {/* BACKDROP */}
        <div
          className="movie-backdrop"
          style={{ backgroundImage: `url(${backdropUrl})` }}
        />

        {/* CONTENT */}
        <div className="movie-details-content">
          <div className="movie-info-card">
            <img
              className="movie-poster"
              src={posterUrl}
              alt={movie.title}
            />

            <div className="movie-meta">
              <h1>{movie.title}</h1>

              {movie.tagline && (
                <p className="tagline">{movie.tagline}</p>
              )}

              <div className="movie-stats">
                <span className="movie-stat">
                  <span className="material-icons">star</span>
                  {movie.vote_average}
                </span>

                <span className="movie-stat">
                  <span className="material-icons">schedule</span>
                  {movie.runtime} mins
                </span>

                <span className="movie-stat">
                  <span className="material-icons">event</span>
                  {movie.release_date}
                </span>
              </div>

              <p className="overview">{movie.overview}</p>

              <div className="movie-actions">
                {trailer && (
                  <button onClick={() => setOpen(true)}>
                    <span className="material-icons">play_arrow</span>
                    Watch Trailer
                  </button>
                )}

                <button
                  className={`fav-action ${fav ? 'active' : ''}`}
                  onClick={() => {
                    toggleFavorite(movie);
                    setFav(!fav);
                  }}
                >
                  <span className="material-icons">
                    {fav ? 'favorite' : 'favorite_border'}
                  </span>
                  {fav ? 'Added to Favorites' : 'Add to Favorites'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {open && (
          <TrailerModal
            trailerKey={trailer.key}
            onClose={() => setOpen(false)}
          />
        )}
      </section>
    </PageWrapper>
  );
}
