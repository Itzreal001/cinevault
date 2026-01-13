import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import fallbackLogo from '../assets/logo.svg'; // fallback if no variants found

// Load any assets matching logo-*.svg placed in /src/assets (Vite supports import.meta.glob with eager:true)
// Use a safe approach in case import.meta.globEager isn't available in the runtime
const _logoModules = (typeof import.meta.glob === 'function')
  ? import.meta.glob('../assets/logo-*.svg', { eager: true })
  : {};
const logos = Object.values(_logoModules).map(m => m.default).filter(Boolean);

if (!logos.length) {
  // dev-time warning — helpful if someone runs the app in an environment that doesn't support glob imports
  // eslint-disable-next-line no-console
  console.warn('No logo variants found via import.meta.glob; using fallback logo.');
}

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const getDaySeed = () => Math.floor(Date.now() / 86400000); // number of days since epoch
  const [daySeed, setDaySeed] = useState(getDaySeed());

  // Refresh logo at midnight so the change is visible without reload
  useEffect(() => {
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
    const t = setTimeout(() => setDaySeed(getDaySeed()), msUntilMidnight);
    return () => clearTimeout(t);
  }, []);

  const logo = logos.length ? logos[daySeed % logos.length] : fallbackLogo;

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/">
        <img src={logo} alt="CineVault Logo" className="logo" />
      </Link>

      {/* Hamburger menu for mobile */}
      <button className="menu-btn" onClick={() => setOpen(!open)}>
        <span className="material-icons">menu</span>
      </button>

      {/* Nav links */}
      <div className={`nav-links ${open ? 'open' : ''}`}>
        <Link to="/">Home</Link>
        <Link to="/favorites">Favorites</Link>
      </div>
    </nav>
  );
}
