import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = () => {
    return (
        <div className="loading-screen">
            <div className="loading-container">
                {/* Logo Section */}
                <div className="logo-section">
                    <div className="logo-container">
                        <div className="logo-icon">
                            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="30" cy="30" r="28" fill="url(#gradient1)" stroke="url(#gradient2)" strokeWidth="4" />
                                <path d="M20 25h20v2H20v-2zm0 6h20v2H20v-2zm0 6h15v2H20v-2z" fill="white" />
                                <circle cx="45" cy="15" r="3" fill="#10b981" />
                                <circle cx="15" cy="45" r="2" fill="#3b82f6" />
                            </svg>
                            <defs>
                                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#667eea" />
                                    <stop offset="100%" stopColor="#764ba2" />
                                </linearGradient>
                                <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#10b981" />
                                    <stop offset="100%" stopColor="#3b82f6" />
                                </linearGradient>
                            </defs>
                        </div>
                        <h1 className="logo-text">SmartSupply Health</h1>
                        <p className="logo-subtitle">Plateforme de gestion médicale intelligente</p>
                    </div>
                </div>

                {/* Loading Animation */}
                <div className="loading-animation">
                    <div className="loading-dots">
                        <div className="dot dot-1"></div>
                        <div className="dot dot-2"></div>
                        <div className="dot dot-3"></div>
                    </div>
                    <div className="loading-text">
                        <span className="loading-message">Chargement en cours</span>
                        <div className="loading-progress">
                            <div className="progress-bar"></div>
                        </div>
                    </div>
                </div>

                {/* Features Preview */}
                <div className="features-preview">
                    <div className="feature-item">
                        <div className="feature-icon">🏥</div>
                        <span>Gestion des stocks</span>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon">📊</div>
                        <span>Analytics avancés</span>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon">🔒</div>
                        <span>Sécurité maximale</span>
                    </div>
                </div>

                {/* Background Elements */}
                <div className="background-elements">
                    <div className="floating-shape shape-1"></div>
                    <div className="floating-shape shape-2"></div>
                    <div className="floating-shape shape-3"></div>
                    <div className="floating-shape shape-4"></div>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;


























