// StockAdjustModal.js
import React, { useState } from 'react';
import axios from 'axios';
import '../style/StockAdjustModal.css';

export default function StockAdjustModal({ product, onClose, onStockUpdated }) {
  const [setValue, setSetValue] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!product) return null;

  const submit = async () => {
    try {
      if (setValue === null || setValue === '') {
        setError('Veuillez entrer une valeur');
        return;
      }

      setIsLoading(true);
      setError('');

      const payload = { set: Number(setValue) };
      await axios.patch(`http://localhost:5000/api/products/${product._id}/stock`, payload);

      setSuccess(true);

      // Attendre un peu pour montrer le succès, puis fermer
      setTimeout(() => {
        if (onStockUpdated) {
          onStockUpdated();
        }
        onClose();
      }, 1500);

    } catch (err) {
      console.error(err);
      setError('Erreur lors de la mise à jour du stock');
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Ajuster stock</h3>
          <button onClick={onClose} className="modal-close" disabled={isLoading}>×</button>
        </div>

        <div className="current-stock">
          <p className="current-stock-label">Produit</p>
          <p className="current-stock-product">{product.name}</p>
          <p className="current-stock-value">
            Stock actuel : <span className="current-stock-number">{product.stock}</span>
          </p>
        </div>

        {success ? (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <p>Stock mis à jour avec succès !</p>
          </div>
        ) : (
          <>
            <div className="form-group">
              <label className="form-label">Définir une valeur absolue</label>
              <input
                type="number"
                placeholder="ex: 200"
                value={setValue ?? ''}
                onChange={e => setSetValue(e.target.value)}
                className="form-input"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="error-message">
                <div className="error-icon">⚠</div>
                <p>{error}</p>
              </div>
            )}

            <div className="modal-actions">
              <button
                onClick={submit}
                className="modal-button primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Mise à jour...
                  </>
                ) : (
                  'Valider'
                )}
              </button>
              <button
                onClick={onClose}
                className="modal-button secondary"
                disabled={isLoading}
              >
                Annuler
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}