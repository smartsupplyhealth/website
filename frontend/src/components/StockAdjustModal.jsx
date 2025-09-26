// StockAdjustModal.js
import React, { useState } from 'react';
import axios from 'axios';
import '../style/StockAdjustModal.css';

export default function StockAdjustModal({ product, onClose }) {
  const [delta, setDelta] = useState(0);
  const [setValue, setSetValue] = useState(null);
  
  if (!product) return null;

  const submit = async () => {
    try {
      const payload = (setValue !== null && setValue !== '') ? { set: Number(setValue) } : { delta: Number(delta) };
      await axios.patch(`http://localhost:5000/api/products/${product._id}/stock`, payload);
      alert('Stock mis à jour');
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erreur mise à jour stock');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Ajuster stock</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div className="current-stock">
          <p className="current-stock-label">Produit</p>
          <p className="current-stock-product">{product.name}</p>
          <p className="current-stock-value">
            Stock actuel : <span className="current-stock-number">{product.stock}</span>
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Ajouter / Retirer (ex: +10 / -5)</label>
          <input 
            type="number" 
            value={delta} 
            onChange={e=>setDelta(e.target.value)} 
            className="form-input"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Ou définir une valeur absolue</label>
          <input 
            type="number" 
            placeholder="ex: 200" 
            value={setValue ?? ''} 
            onChange={e=>setSetValue(e.target.value)} 
            className="form-input"
          />
        </div>
        
        <div className="modal-actions">
          <button onClick={submit} className="modal-button primary">
            Valider
          </button>
          <button onClick={onClose} className="modal-button secondary">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}