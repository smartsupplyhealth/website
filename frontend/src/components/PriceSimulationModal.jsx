import React from 'react';
import LoadingSpinner from './common/LoadingSpinner';
import { FaTimes, FaLightbulb, FaChartBar, FaDollarSign, FaCalculator } from 'react-icons/fa';

export default function PriceSimulationModal({ open, onClose, data, isLoading, error }) {
    console.log('PriceSimulationModal render - open:', open, 'isLoading:', isLoading, 'data:', data);

    if (!open) {
        console.log('PriceSimulationModal: open is false, not rendering');
        return null;
    }

    console.log('PriceSimulationModal: Rendering modal');

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
                maxWidth: '900px',
                width: '100%',
                maxHeight: '85vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }} onClick={(e) => e.stopPropagation()}>
                <div style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
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
                            💰
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>Simulation de Prix</h2>
                            <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: '14px' }}>Analyse intelligente du marché</p>
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
                            <div style={{ fontSize: '48px', marginBottom: '20px' }}>💰</div>
                            <h3 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>
                                Simulation en cours...
                            </h3>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '16px' }}>
                                Calcul du prix optimal basé sur l'analyse concurrentielle
                            </p>
                        </div>
                    ) : error ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
                            <h3 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>
                                Erreur de simulation
                            </h3>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '16px' }}>{error}</p>
                        </div>
                    ) : !data ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
                            <h3 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>
                                Aucune donnée disponible
                            </h3>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '16px' }}>
                                Aucune donnée de simulation disponible pour ce produit.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                <h3 style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: '0 0 8px 0' }}>
                                    💰 Recommandations de prix
                                </h3>
                                <p style={{ color: '#6b7280', fontSize: '16px', margin: 0 }}>
                                    Basées sur l'analyse du marché concurrentiel
                                </p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                                <div style={{
                                    background: 'white',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '20px',
                                    padding: '24px',
                                    textAlign: 'center',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: '6px',
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                    }}></div>
                                    <div style={{
                                        width: '64px',
                                        height: '64px',
                                        margin: '0 auto 16px',
                                        borderRadius: '16px',
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '28px',
                                        color: 'white'
                                    }}>
                                        💡
                                    </div>
                                    <h4 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600', color: '#374151' }}>
                                        Prix Recommandé
                                    </h4>
                                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937', margin: '0 0 8px 0' }}>
                                        {data.recommendedPrice} €
                                    </div>
                                    <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                                        Basé sur l'analyse de {data.offersCount} offres
                                    </p>
                                </div>

                                <div style={{
                                    background: 'white',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '20px',
                                    padding: '24px',
                                    textAlign: 'center',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: '6px',
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                                    }}></div>
                                    <div style={{
                                        width: '64px',
                                        height: '64px',
                                        margin: '0 auto 16px',
                                        borderRadius: '16px',
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '28px',
                                        color: 'white'
                                    }}>
                                        📊
                                    </div>
                                    <h4 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600', color: '#374151' }}>
                                        Prix Moyen
                                    </h4>
                                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937', margin: '0 0 8px 0' }}>
                                        {data.average ? data.average.toFixed(2) : data.median} €
                                    </div>
                                    <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                                        Moyenne du marché
                                    </p>
                                </div>

                                <div style={{
                                    background: 'white',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '20px',
                                    padding: '24px',
                                    textAlign: 'center',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: '6px',
                                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                    }}></div>
                                    <div style={{
                                        width: '64px',
                                        height: '64px',
                                        margin: '0 auto 16px',
                                        borderRadius: '16px',
                                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '28px',
                                        color: 'white'
                                    }}>
                                        💸
                                    </div>
                                    <h4 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600', color: '#374151' }}>
                                        Fourchette de Prix
                                    </h4>
                                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', margin: '0 0 8px 0' }}>
                                        {data.min}€ - {data.max}€
                                    </div>
                                    <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                                        Écart: {data.priceRange}€
                                    </p>
                                </div>
                            </div>

                            {/* Market Analysis */}
                            <div style={{
                                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                borderRadius: '16px',
                                padding: '24px',
                                border: '2px solid #0ea5e9',
                                marginBottom: '24px'
                            }}>
                                <h4 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600', color: '#0c4a6e' }}>
                                    📈 Analyse du Marché
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                    <div>
                                        <strong style={{ color: '#0c4a6e' }}>Position Concurrentielle:</strong>
                                        <p style={{ margin: '4px 0 0 0', color: '#0369a1' }}>
                                            {data.insights?.marketPosition || 'Analyse en cours...'}
                                        </p>
                                    </div>
                                    <div>
                                        <strong style={{ color: '#0c4a6e' }}>Stabilité des Prix:</strong>
                                        <p style={{ margin: '4px 0 0 0', color: '#0369a1' }}>
                                            {data.insights?.priceStability || 'Analyse en cours...'}
                                        </p>
                                    </div>
                                    <div>
                                        <strong style={{ color: '#0c4a6e' }}>Écart-Type:</strong>
                                        <p style={{ margin: '4px 0 0 0', color: '#0369a1' }}>
                                            {data.standardDeviation ? `${data.standardDeviation.toFixed(2)}€` : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                borderRadius: '16px',
                                padding: '24px',
                                border: '2px solid #e2e8f0'
                            }}>
                                <h4 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
                                    💡 Insights
                                </h4>
                                <ul style={{ margin: 0, paddingLeft: '20px', color: '#4b5563', lineHeight: 1.6 }}>
                                    <li style={{ marginBottom: '8px' }}>
                                        Le prix recommandé est basé sur l'analyse de {data.offersCount || 'plusieurs'} offres concurrentes
                                    </li>
                                    <li style={{ marginBottom: '8px' }}>
                                        Votre positionnement par rapport au marché est optimal
                                    </li>
                                    <li style={{ marginBottom: '8px' }}>
                                        Considérez les coûts de production et la marge bénéficiaire
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}