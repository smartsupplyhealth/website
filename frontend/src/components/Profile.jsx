import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ClientNavbar from './dashboard/ClientNavbar';
import Notification from './common/Notification';
import NotificationButton from './NotificationButton';
import NotificationPanel from './NotificationPanel';
import '../style/Profile.css';

const Profile = () => {
  const { user, setUser } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    clinicName: '',
    clinicType: 'clinic',
    currentPassword: '',     // 👈 nouveau
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [notification, setNotification] = useState({ message: '', type: '' });

  /* Auto clear success toast */
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  /* Hydrate with user */
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        clinicName: user.clinicName || '',
        clinicType: user.clinicType || 'clinic',
        currentPassword: '',
        password: '',
        confirmPassword: '',
      });
      setLoading(false);
    }
  }, [user]);

  /* ---- Validation ---- */
  const validateField = (name, value, data) => {
    let e = '';
    switch (name) {
      case 'name':
        // Name field is now disabled, no validation needed
        break;
      case 'phone':
        if (!/^\d{8}$/.test(value)) e = 'Le numéro de téléphone doit contenir exactement 8 chiffres.';
        break;
      case 'address':
        if (value.trim().length < 10) e = "L'adresse doit contenir au moins 10 caractères.";
        break;
      case 'clinicName':
        if (value.trim().length < 4) e = 'Le nom du projet doit contenir au moins 4 caractères.';
        else if (!/^[a-zA-Z\s]+$/.test(value)) e = 'Le nom du projet ne doit contenir que des lettres et des espaces.';
        break;
      case 'password':
        if (value && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(value)) {
          e = 'Au moins 6 caractères, une majuscule, une minuscule et un chiffre.';
        }
        // si on tape un nouveau mot de passe, l’ancien devient requis
        if (value && !data.currentPassword) {
          e = e || 'Veuillez saisir votre ancien mot de passe.';
        }
        break;
      case 'currentPassword':
        // ancien obligatoire seulement si on change le mot de passe
        if (data.password && (!value || value.length < 6)) {
          e = "L'ancien mot de passe est requis (≥ 6 caractères).";
        }
        break;
      case 'confirmPassword':
        if (data.password && value !== data.password) e = 'Les mots de passe ne correspondent pas.';
        break;
      default:
        break;
    }
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const next = { ...formData, [name]: value };
    setFormData(next);

    const nextErrors = { ...errors };
    nextErrors[name] = validateField(name, value, next);

    // dépendances croisées
    if (name === 'password') {
      nextErrors.currentPassword = validateField('currentPassword', next.currentPassword, next);
      nextErrors.confirmPassword = validateField('confirmPassword', next.confirmPassword, next);
    }
    if (name === 'currentPassword') {
      nextErrors.password = validateField('password', next.password, next);
    }
    if (name === 'confirmPassword') {
      nextErrors.confirmPassword = validateField('confirmPassword', value, next);
    }

    setErrors(nextErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation finale
    const validationErrors = {};
    let invalid = false;

    // champs à valider à coup sûr (name is now disabled)
    ['phone', 'address', 'clinicName'].forEach((key) => {
      const e = validateField(key, formData[key], formData);
      if (e) { validationErrors[key] = e; invalid = true; }
    });

    // bloc mot de passe (requis si on veut changer)
    if (formData.password || formData.confirmPassword || formData.currentPassword) {
      // Si on veut changer le mot de passe, l'ancien mot de passe est requis
      if (!formData.currentPassword) {
        validationErrors.currentPassword = 'L\'ancien mot de passe est requis pour changer le mot de passe.';
        invalid = true;
      }

      const list = ['currentPassword', 'password', 'confirmPassword'];
      list.forEach((key) => {
        const e = validateField(key, formData[key], formData);
        if (e) { validationErrors[key] = e; invalid = true; }
      });
      if (formData.password && formData.password !== formData.confirmPassword) {
        validationErrors.confirmPassword = 'Les mots de passe ne correspondent pas.';
        invalid = true;
      }
    }

    setErrors(validationErrors);
    if (invalid) {
      setError('Veuillez corriger les erreurs avant de soumettre.');
      return;
    }

    try {
      // on n'envoie email, name ni confirmPassword; on n'envoie currentPassword/password que si on change le mdp
      const {
        email,
        name,
        confirmPassword,
        currentPassword,
        password,
        ...updateData
      } = formData;

      const payload = { ...updateData };
      if (password) {
        payload.currentPassword = currentPassword;
        payload.password = password;
      }

      const res = await api.put('/auth/profile', payload);
      setUser(res.data?.data?.user);
      setNotification({ message: 'Profil mis à jour avec succès ! ✅', type: 'success' });
      setErrors({});
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        password: '',
        confirmPassword: '',
      }));
    } catch (err) {
      console.error('Profile update error:', err);
      setNotification({ message: err.response?.data?.message || 'La mise à jour du profil a échoué. ❌', type: 'error' });
    }
  };

  if (loading) return <><ClientNavbar /><NotificationButton /><NotificationPanel /><div className="profile-container">Chargement…</div></>;

  return (
    <>
      <ClientNavbar />
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
          <p>Mettez à jour vos informations personnelles et celles de votre projet.</p>
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
                  <label>Adresse</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                  />
                  <div className="error-text">{errors.address}</div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nom du projet</label>
                  <input
                    type="text"
                    name="clinicName"
                    value={formData.clinicName}
                    onChange={handleChange}
                    className={`form-control ${errors.clinicName ? 'is-invalid' : ''}`}
                  />
                  <div className="error-text">{errors.clinicName}</div>
                </div>
                <div className="form-group">
                  <label>Type du projet</label>
                  <select
                    name="clinicType"
                    value={formData.clinicType}
                    onChange={handleChange}
                    className="form-control"
                  >
                    <option value="clinic">Clinique</option>
                    <option value="laboratory">Laboratoire</option>
                    <option value="medical_office">Cabinet Médical</option>
                  </select>
                </div>
              </div>

              <hr className="profile-divider" />

              <div>
                <h3 className="password-section-title">Changer le mot de passe</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label>Ancien mot de passe</label> {/* 👈 nouveau champ */}
                    <input
                      type="password"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      className={`form-control ${errors.currentPassword ? 'is-invalid' : ''}`}
                      placeholder="Ancien mot de passe"
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

export default Profile;
