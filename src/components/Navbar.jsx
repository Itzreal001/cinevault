import { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.svg'; // use your generated logo here

export default function Navbar() {
  const [open, setOpen] = useState(false);

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
