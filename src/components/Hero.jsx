import { useEffect, useState } from 'react';

export default function Hero({ movies }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % movies.length);
    }, 5000); // change movie every 5 seconds

    return () => clearInterval(interval);
  }, [movies]);

  const movie = movies[index];

  return (
    <div
      className="hero"
      style={{
        backgroundImage: `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`,
      }}
    >
      <div className="hero-content">
        <h1>{movie.title}</h1>
        {movie.overview && <p>{movie.overview}</p>}
      </div>
    </div>
  );
}
