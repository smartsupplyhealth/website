import React from 'react';
import LoadingSpinner from './common/LoadingSpinner';
import { FaTimes, FaExternalLinkAlt, FaEuroSign, FaSearch, FaChartLine } from 'react-icons/fa';

export default function CompetitorModal({ open, onClose, offers, isLoading, error }) {
  console.log('CompetitorModal render - open:', open, 'isLoading:', isLoading, 'offers:', offers);

  if (!open) {
    console.log('CompetitorModal: open is false, not rendering');
    return null;
  }

  console.log('CompetitorModal: Rendering modal');

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '85vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          color: 'white',
          padding: '24px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              📊
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>Analyse Concurrentielle</h2>
              <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: '14px' }}>Comparaison des prix sur le marché</p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: 'white',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '18px'
          }}>
            ×
          </button>
        </div>
        <div style={{
          padding: '32px',
          overflowY: 'auto',
          flex: 1,
          maxHeight: 'calc(85vh - 120px)'
        }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔍</div>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>
                Recherche des concurrents en cours...
              </h3>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '16px' }}>
                Analyse des prix sur le marché
              </p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>
                Erreur d'analyse
              </h3>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '16px' }}>{error}</p>
            </div>
          ) : offers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔍</div>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>
                Aucune offre trouvée
              </h3>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '16px' }}>
                Aucune offre compétitive trouvée pour ce produit.
              </p>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #f3f4f6' }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
                  📊 Résultats de l'analyse
                </h3>
                <span style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {offers.length} offre{offers.length > 1 ? 's' : ''} trouvée{offers.length > 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                {offers.map((offer, index) => (
                  <div key={index} style={{
                    background: '#f8fafc',
                    border: '2px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '20px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                    }}></div>
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#1f2937', lineHeight: 1.4 }}>
                        {offer.title}
                      </h4>
                      <div style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '18px',
                        fontWeight: '700',
                        display: 'inline-block'
                      }}>
                        {offer.price ? `${offer.price} €` : 'Prix non détecté'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <a href={offer.url} target="_blank" rel="noopener noreferrer" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        color: 'white',
                        textDecoration: 'none',
                        padding: '10px 16px',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        🔗 Voir l'offre
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}