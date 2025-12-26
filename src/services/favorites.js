import PageWrapper from '../components/PageWrapper';
const KEY = 'cinevault_favorites';

export function getFavorites() {
  return JSON.parse(localStorage.getItem(KEY)) || [];
}

export function isFavorite(id) {
  return getFavorites().some(movie => movie.id === id);
}

export function toggleFavorite(movie) {
  const favorites = getFavorites();
  const exists = favorites.find(m => m.id === movie.id);

  const updated = exists
    ? favorites.filter(m => m.id !== movie.id)
    : [...favorites, movie];

  localStorage.setItem(KEY, JSON.stringify(updated));
  return updated;
}
