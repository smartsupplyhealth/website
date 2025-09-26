import React from 'react';
import LoadingSpinner from './common/LoadingSpinner';
import '../style/scarping.css';

export default function PriceSimulationModal({ open, onClose, data, isLoading, error }) {
    if (!open) return null;

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="loader-container">
                    <LoadingSpinner size="large" />
                    <p>Simulation du prix en cours...</p>
                </div>
            );
        }
        if (error) {
            return <p className="error-message">Erreur: {error}</p>;
        }
        if (!data) {
            return <p>Aucune donnée de simulation disponible.</p>;
        }
        return (
            <>
                <p>💡 Prix recommandé : <strong>{data.recommendedPrice} €</strong></p>
                <p>📊 Médiane concurrents : {data.median} €</p>
                <p>💸 Prix minimum : {data.min} €</p>
            </>
        );
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Simulation de Prix</h2>
                <button onClick={onClose} className="close-button">Fermer</button>
                <div className="modal-body">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}