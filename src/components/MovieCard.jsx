import { Link } from 'react-router-dom';
import { getPoster } from '../services/movieAPI';
import { isFavorite, toggleFavorite } from '../services/favorites';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function MovieCard({ movie, genresMap = {} }) {
  const [fav, setFav] = useState(isFavorite(movie.id));

  function handleFav(e) {
    e.preventDefault();
    toggleFavorite(movie);
    setFav(!fav);
  }

  return (
    <motion.div
      className="movie-card-wrapper"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.25 }}
    >
      <Link to={`/movie/${movie.id}`} className="movie-card">
        <img
          src={getPoster(movie.poster_path)}
          alt={movie.title}
          loading="lazy"
        />

        <h3>{movie.title}</h3>

        {/* SAFE GENRES */}
        <div className="genre-badges">
          {Array.isArray(movie.genre_ids) &&
            movie.genre_ids
              .slice(0, 3)
              .map((id) =>
                genresMap[id] ? (
                  <span key={id} className="genre-badge">
                    {genresMap[id]}
                  </span>
                ) : null
              )}
        </div>
      </Link>

      {/* Favorite button with pop animation */}
      <button className="fav-btn" onClick={handleFav}>
        <motion.span
          className="material-icons"
          animate={fav ? { scale: [1, 1.5, 1] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {fav ? "favorite" : "favorite_border"}
        </motion.span>
      </button>
    </motion.div>
  );
}
