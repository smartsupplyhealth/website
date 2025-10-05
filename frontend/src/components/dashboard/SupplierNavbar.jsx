import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import UserProfileModal from '../UserProfileModal';
import './navbar.css';
import logo from '../../style/logo.jpg';

function getInitials(text = "") {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (first + last).toUpperCase();
}

const SupplierNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const navLinks = [
    { name: 'Dashboard', path: '/supplier-dashboard' },
    { name: 'Gérer Catalogue', path: '/supplier-dashboard/catalogue' },
    { name: 'Commandes Reçues', path: '/supplier/orders' },
    { name: 'Mes Clients', path: '/supplier/client' },
    { name: 'Gestion de profil', path: '/profileSupp' },
  ];

  const userName = user?.name || "Utilisateur";
  const company = user?.companyName || "Société";
  const initials = getInitials(userName);

  return (
    <nav className="navbar" role="navigation" aria-label="Navigation principale">
      <div className="navbar-container">
        <div className="navbar-header">
          {/* Logo */}
          <button
            className="navbar-logo"
            onClick={() => navigate("/supplier-dashboard")}
            aria-label="Aller au tableau de bord"
          >
            <span className="navbar-logo-icon">
              <img
                src={logo}
                alt="SmartSupply Health"
                style={{ width: "100%", height: "100%", borderRadius: "0.75rem", objectFit: "cover" }}
              />
            </span>
            <h1 className="navbar-logo-text">
              <div>SmartSupply</div>
              <div>Health</div>
            </h1>
          </button>

          {/* Desktop */}
          <div className="navbar-nav-desktop">
            <div className="navbar-nav-links">
              {navLinks.map((link) => {
                const active = pathname === link.path;
                return (
                  <button
                    key={link.name}
                    onClick={() => navigate(link.path)}
                    className={`navbar-nav-link ${active ? "is-active" : ""}`}
                    aria-current={active ? "page" : undefined}
                    aria-label={link.name}
                  >
                    <span className="navbar-link-text">{link.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Zone utilisateur */}
            <div className="navbar-user-section">
              <button
                className="navbar-user-avatar navbar-user-avatar-clickable"
                title={`Voir le profil de ${userName}`}
                onClick={() => setIsProfileModalOpen(true)}
                aria-label={`Voir le profil de ${userName}`}
              >
                {initials}
              </button>
              <div className="navbar-user-info">
                <p className="navbar-user-name">{userName}</p>
                <p className="navbar-user-company" title={company}>{company}</p>
              </div>
              <button onClick={logout} className="navbar-logout-btn" aria-label="Se déconnecter">
                Déconnexion
              </button>
            </div>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            className="navbar-mobile-toggle"
            aria-label="Ouvrir/fermer le menu"
            aria-expanded={isMobileMenuOpen}
          >
            <svg className="navbar-mobile-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}
              />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="navbar-mobile-menu">
            <div className="navbar-mobile-menu-content">
              {navLinks.map((link) => {
                const active = pathname === link.path;
                return (
                  <button
                    key={link.name}
                    onClick={() => {
                      navigate(link.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`navbar-mobile-link ${active ? "is-active" : ""}`}
                    aria-label={link.name}
                  >
                    <span className="navbar-link-text">{link.name}</span>
                  </button>
                );
              })}

              {/* Bloc utilisateur (mobile) */}
              <div className="navbar-mobile-user">
                <button
                  className="navbar-user-avatar navbar-user-avatar-clickable"
                  title={`Voir le profil de ${userName}`}
                  onClick={() => {
                    setIsProfileModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  aria-label={`Voir le profil de ${userName}`}
                >
                  {initials}
                </button>
                <div className="navbar-mobile-user-info">
                  <p className="navbar-user-name">{userName}</p>
                  <p className="navbar-user-company" title={company}>{company}</p>
                </div>
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

      {/* Modal de profil utilisateur */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userType="supplier"
      />
    </nav>
  );
};

export default SupplierNavbar;