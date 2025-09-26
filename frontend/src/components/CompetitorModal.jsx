import React from 'react';
import LoadingSpinner from './common/LoadingSpinner';
import '../style/scarping.css';

export default function CompetitorModal({ open, onClose, offers, isLoading, error }) {
  if (!open) return null;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="loader-container">
          <LoadingSpinner size="large" />
          <p>Recherche des concurrents en cours...</p>
        </div>
      );
    }
    if (error) {
      return <p className="error-message">Erreur: {error}</p>;
    }
    if (offers.length === 0) {
      return <p>Aucune offre compétitive trouvée pour ce produit.</p>;
    }
    return offers.map((offer, index) => (
      <div key={index} className="offer-item">
        <p><strong>📌 {offer.title}</strong></p>
        <p>🔗 <a href={offer.url} target="_blank" rel="noopener noreferrer">Voir l'offre</a></p>
        <p>💶 Prix : {offer.price ? `${offer.price} €` : 'Non détecté'}</p>
        <hr />
      </div>
    ));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Analyse Concurrentielle</h2>
        <button onClick={onClose} className="close-button">Fermer</button>
        <div className="modal-body">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}