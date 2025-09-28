import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './navbar.css'; // Importez le fichier CSS
import logo from '../../style/logo.jpg';

const SupplierNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navLinks = [
    { name: 'Dashboard', path: '/supplier-dashboard' },
    { name: 'Gérer Catalogue', path: '/supplier-dashboard/catalogue' },
    { name: 'Commandes Reçues', path: '/supplier/orders' },
    { name: 'Mes Clients', path: '/supplier/client' },
    { name: 'Gestion de profil', path: '/profileSupp' },

  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-header">
          {/* Logo */}
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <img src={logo} className="auth-logo-img" />
            </div>
            <h1 className="auth-logo-text">
              <div>SmartSupply</div>
              <div>Health</div>
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="navbar-nav-desktop">
            <div className="navbar-nav-links">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => navigate(link.path)}
                  className="navbar-nav-link"
                >
                  {link.name}
                </button>
              ))}
            </div>

            <div className="navbar-user-section">
              <div className="navbar-user-info">
                <p className="navbar-user-name">{user?.name}</p>
                <p className="navbar-user-company">{user?.companyName}</p>
              </div>
              <button
                onClick={logout}
                className="navbar-logout-btn"
              >
                Déconnexion
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="navbar-mobile-toggle"
          >
            <svg
              className="navbar-mobile-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isMobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16m-7 6h7'}
              />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="navbar-mobile-menu">
            <div className="navbar-mobile-menu-content">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => {
                    navigate(link.path);
                    setIsMobileMenuOpen(false);
                  }}
                  className="navbar-mobile-link"
                >
                  {link.name}
                </button>
              ))}
              <div className="navbar-mobile-user-info">
                <p className="navbar-user-name">{user?.name}</p>
                <p className="navbar-user-company">{user?.companyName}</p>
              </div>
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="navbar-mobile-logout"
              >
                Déconnexion
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default SupplierNavbar;