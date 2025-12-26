import { useEffect, useState } from 'react';
import { getFavorites } from '../services/favorites';
import MovieCard from '../components/MovieCard';

export default function Favorites() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    setMovies(getFavorites());
  }, []);

  return (
    <div className="container">
      <h2>❤️ Favorites</h2>

      {movies.length === 0 ? (
        <p>No favorites yet.</p>
      ) : (
        <div className="movie-grid">
          {movies.map(movie => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}
