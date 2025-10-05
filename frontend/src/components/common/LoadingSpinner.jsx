import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({
    size = 'medium',
    message = 'Chargement...',
    showMessage = true,
    color = 'primary'
}) => {
    const sizeClasses = {
        small: 'spinner-small',
        medium: 'spinner-medium',
        large: 'spinner-large'
    };

    const colorClasses = {
        primary: 'spinner-primary',
        secondary: 'spinner-secondary',
        success: 'spinner-success',
        warning: 'spinner-warning',
        error: 'spinner-error'
    };

    return (
        <div className="loading-spinner-container">
            <div className={`loading-spinner ${sizeClasses[size]} ${colorClasses[color]}`}>
                <div className="spinner-ring">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
            </div>
            {showMessage && (
                <p className="loading-message">{message}</p>
            )}
        </div>
    );
};

export default LoadingSpinner;




