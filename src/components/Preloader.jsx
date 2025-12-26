import { useEffect, useState } from 'react';
import logo from '../assets/logo.svg';
import './Preloader.css'; // we'll add CSS separately

export default function Preloader({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish(); // notify parent to hide preloader
    }, 2000); // 2 seconds, adjust as needed
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="preloader">
      <img src={logo} alt="CineVault Logo" className="preloader-logo" />
    </div>
  );
}
