import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import './UserProfileModal.css';

const UserProfileModal = ({ isOpen, onClose, userType = 'client' }) => {
    const { user } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && user) {
            fetchProfileData();
        }
    }, [isOpen, user]);

    const fetchProfileData = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/auth/me');
            setProfileData(response.data.data.user);
        } catch (err) {
            setError('Erreur lors du chargement du profil');
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const getInitials = (text = "") => {
        const parts = text.trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return "U";
        const first = parts[0]?.[0] || "";
        const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
        return (first + last).toUpperCase();
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Non spécifié';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="user-profile-modal-overlay" onClick={onClose}>
            <div className="user-profile-modal" onClick={(e) => e.stopPropagation()}>
                <div className="user-profile-modal-header">
                    <h2>Détails du Profil</h2>
                    <button className="user-profile-modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="user-profile-modal-content">
                    {loading ? (
                        <div className="user-profile-loading">
                            <div className="spinner"></div>
                            <p>Chargement des détails...</p>
                        </div>
                    ) : error ? (
                        <div className="user-profile-error">
                            <p>{error}</p>
                            <button onClick={fetchProfileData}>Réessayer</button>
                        </div>
                    ) : profileData ? (
                        <div className="user-profile-details">
                            {/* Avatar et nom */}
                            <div className="user-profile-avatar-section">
                                <div className="user-profile-avatar">
                                    {getInitials(profileData.name)}
                                </div>
                                <div className="user-profile-name-section">
                                    <h3>{profileData.name}</h3>
                                    <p className="user-profile-role">
                                        {userType === 'client' ? 'Client' : 'Fournisseur'}
                                    </p>
                                </div>
                            </div>

                            {/* Informations principales */}
                            <div className="user-profile-info-grid">
                                <div className="user-profile-info-item">
                                    <label>Email</label>
                                    <p>{profileData.email}</p>
                                </div>

                                <div className="user-profile-info-item">
                                    <label>Téléphone</label>
                                    <p>{profileData.phone || 'Non spécifié'}</p>
                                </div>

                                {userType === 'client' ? (
                                    <>
                                        <div className="user-profile-info-item">
                                            <label>Nom de la clinique</label>
                                            <p>{profileData.clinicName || 'Non spécifié'}</p>
                                        </div>
                                        <div className="user-profile-info-item">
                                            <label>Type d'établissement</label>
                                            <p>{profileData.clinicType || 'Non spécifié'}</p>
                                        </div>
                                        <div className="user-profile-info-item">
                                            <label>Adresse</label>
                                            <p>{profileData.address || 'Non spécifiée'}</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="user-profile-info-item">
                                            <label>Nom de l'entreprise</label>
                                            <p>{profileData.companyName || 'Non spécifié'}</p>
                                        </div>
                                        <div className="user-profile-info-item">
                                            <label>Type d'entreprise</label>
                                            <p>{profileData.companyType || 'Non spécifié'}</p>
                                        </div>
                                        <div className="user-profile-info-item">
                                            <label>Adresse</label>
                                            <p>{profileData.address || 'Non spécifiée'}</p>
                                        </div>
                                    </>
                                )}

                                <div className="user-profile-info-item">
                                    <label>Membre depuis</label>
                                    <p>{formatDate(profileData.createdAt)}</p>
                                </div>

                                <div className="user-profile-info-item">
                                    <label>Statut</label>
                                    <p className={`user-profile-status ${profileData.isActive ? 'active' : 'inactive'}`}>
                                        {profileData.isActive ? 'Actif' : 'Inactif'}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="user-profile-actions">
                                <button
                                    className="user-profile-edit-btn"
                                    onClick={() => {
                                        onClose();
                                        // Rediriger vers la page de profil pour édition
                                        window.location.href = userType === 'client' ? '/profileClient' : '/profileSupp';
                                    }}
                                >
                                    Modifier le profil
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default UserProfileModal;



