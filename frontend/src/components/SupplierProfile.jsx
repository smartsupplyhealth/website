import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import SupplierNavbar from './dashboard/SupplierNavbar';
import Notification from './common/Notification';
import NotificationButton from './NotificationButton';
import NotificationPanel from './NotificationPanel';
import '../style/Profile.css';

const SupplierProfile = () => {
  const { user, setUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    currentPassword: '',    // <<< NOUVEAU
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [notification, setNotification] = useState({ message: '', type: '' });

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        companyName: user.companyName || '',
        currentPassword: '', // <<< NOUVEAU
        password: '',
        confirmPassword: '',
      });
      setLoading(false);
    }
  }, [user]);

  const validateField = (name, value, data) => {
    let error = '';
    switch (name) {
      case 'name':
        // Name field is now disabled, no validation needed
        break;
      case 'phone':
        if (!/^\d{8}$/.test(value)) error = 'Le numéro de téléphone doit contenir exactement 8 chiffres.';
        break;
      case 'companyName':
        if (value.trim().length < 4) {
          error = "Le nom de l'entreprise doit contenir au moins 4 caractères.";
        } else if (!/^[a-zA-Z\s]+$/.test(value)) {
          error = "Le nom de l'entreprise ne doit contenir que des lettres et des espaces.";
        }
        break;
      case 'currentPassword': // <<< NOUVEAU
        // On ne l’exige QUE si l’utilisateur change le mot de passe
        if (data.password && !value) error = 'Veuillez saisir votre mot de passe actuel.';
        break;
      case 'password':
        if (value && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(value)) {
          error = 'Au moins 6 caractères, une majuscule, une minuscule et un chiffre.';
        }
        break;
      case 'confirmPassword':
        if (data.password && value !== data.password) {
          error = 'Les mots de passe ne correspondent pas.';
        }
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);

    const newErrors = { ...errors };
    newErrors[name] = validateField(name, value, newFormData);

    // Si l'utilisateur commence à saisir un nouveau mdp :
    if (name === 'password') {
      newErrors.confirmPassword = validateField('confirmPassword', newFormData.confirmPassword, newFormData);
      // Exiger l'ancien mdp si nouveau mdp non vide
      newErrors.currentPassword = validateField('currentPassword', newFormData.currentPassword, newFormData);
    }
    if (name === 'confirmPassword') {
      newErrors.confirmPassword = validateField('confirmPassword', value, newFormData);
    }
    if (name === 'currentPassword') {
      newErrors.currentPassword = validateField('currentPassword', value, newFormData);
    }

    setErrors(newErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationErrors = {};
    let hasErrors = false;

    // Champs texte standards (name is now disabled)
    ['phone', 'companyName'].forEach((key) => {
      const err = validateField(key, formData[key], formData);
      if (err) { validationErrors[key] = err; hasErrors = true; }
    });

    // Si l'utilisateur veut changer le mot de passe → valider les 3 champs mdp
    if (formData.password || formData.confirmPassword || formData.currentPassword) {
      // Si on veut changer le mot de passe, l'ancien mot de passe est requis
      if (!formData.currentPassword) {
        validationErrors.currentPassword = 'L\'ancien mot de passe est requis pour changer le mot de passe.';
        hasErrors = true;
      }

      ['currentPassword', 'password', 'confirmPassword'].forEach((key) => {
        const err = validateField(key, formData[key], formData);
        if (err) { validationErrors[key] = err; hasErrors = true; }
      });
      if (formData.password && formData.password !== formData.confirmPassword) {
        validationErrors.confirmPassword = 'Les mots de passe ne correspondent pas.';
        hasErrors = true;
      }
    }

    setErrors(validationErrors);
    if (hasErrors) {
      setError('Veuillez corriger les erreurs avant de soumettre.');
      return;
    }

    try {
      // on ne permet pas la modification d'email et name côté client
      const { email, name, confirmPassword, currentPassword, ...updateData } = formData;

      // Ne pas envoyer "password" si vide
      if (!updateData.password) {
        delete updateData.password;
      } else {
        // Inclure l'ancien mdp si un nouveau est demandé
        updateData.currentPassword = currentPassword;
      }

      const res = await api.put('/auth/profile', updateData);
      setUser(res.data.data.user);
      setNotification({ message: 'Profil mis à jour avec succès ! ✅', type: 'success' });
      setErrors({});
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        password: '',
        confirmPassword: '',
      }));
    } catch (err) {
      setNotification({ message: err.response?.data?.message || 'La mise à jour du profil a échoué. ❌', type: 'error' });
    }
  };

  if (loading) return <><SupplierNavbar /><NotificationButton /><NotificationPanel /><div>Chargement...</div></>;

  return (
    <>
      <SupplierNavbar />
      <NotificationButton />
      <NotificationPanel />
      <Notification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ message: '', type: '' })}
      />
      <div className="orders-container">
        <div className="orders-header">
          <div className="profile-header-icon">{user?.name?.charAt(0)}</div>
          <h1>Gérer votre profil</h1>
          <p>Mettez à jour vos informations personnelles et celles de votre entreprise.</p>
        </div>
        <div className="main-content">
          <div className="profile-card">

            <form onSubmit={handleSubmit} className="profile-form">

              <div className="form-row">
                <div className="form-group">
                  <label>Nom</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    className="form-control"
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" value={formData.email} className="form-control" disabled />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Téléphone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                  />
                  <div className="error-text">{errors.phone}</div>
                </div>
                <div className="form-group">
                  <label>Nom de l'entreprise</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className={`form-control ${errors.companyName ? 'is-invalid' : ''}`}
                  />
                  <div className="error-text">{errors.companyName}</div>
                </div>
              </div>

              <hr className="profile-divider" />

              <div>
                <h3 className="password-section-title">Changer le mot de passe</h3>

                <div className="form-row">
                  {/* Mot de passe actuel (exigé seulement si un nouveau mdp est saisi) */}
                  <div className="form-group">
                    <label>Mot de passe actuel</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      className={`form-control ${errors.currentPassword ? 'is-invalid' : ''}`}
                      placeholder="Mot de passe actuel"
                    />
                    <div className="error-text">{errors.currentPassword}</div>
                  </div>

                  <div className="form-group">
                    <label>Nouveau mot de passe</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                      placeholder="Nouveau mot de passe"
                    />
                    <div className="error-text">{errors.password}</div>
                  </div>

                  <div className="form-group">
                    <label>Confirmer le nouveau mot de passe</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                      placeholder="Confirmer le nouveau mot de passe"
                    />
                    <div className="error-text">{errors.confirmPassword}</div>
                  </div>
                </div>
              </div>

              <button type="submit" className="profile-button">Mettre à jour le profil</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default SupplierProfile;
