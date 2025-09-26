import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';
import logo from '../../style/logo.jpg';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'client',
    clinicName: '',
    clinicType: '',
    address: '',
    companyName: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const { register, loading, error, clearError } = useAuth();

  const validateField = useCallback((name, value, currentData) => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Le nom complet est requis.';
        if (value.trim().length < 4) return 'Le nom complet doit contenir au moins 4 caractères.';
        if (!/^[a-zA-Z\s]+$/.test(value)) return 'Le nom complet ne doit contenir que des lettres.';
        break;
      case 'email':
        if (!value.trim()) return "L'email est requis.";
        if (!/\S+@\S+\.\S+/.test(value)) return 'forme de emeil invalide (email@exemple.test)';
        break;
      case 'phone':
        if (!value.trim()) return 'Le téléphone est requis.';
        if (!/^\d{8}$/.test(value)) return 'Le téléphone doit contenir exactement 8 chiffres.';
        break;
      case 'password':
        if (!value.trim()) return 'Le mot de passe est requis.';
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(value)) return 'Au moins 6 caractères, une majuscule, une minuscule et un chiffre.';
        break;
      case 'clinicName':
        if (currentData.role === 'client' && !value.trim()) return 'Le nom de la clinique est requis.';
        if (currentData.role === 'client' && value.trim().length < 4) return 'Le nom de la clinique doit contenir au moins 4 caractères.';
        if (currentData.role === 'client' && value.trim() && !/^[a-zA-Z\s]+$/.test(value)) return 'Le nom de la clinique ne doit contenir que des lettres et des espaces.';
        break;
      case 'address':
        if (currentData.role === 'client' && !value.trim()) return "L'adresse est requise.";
        if (currentData.role === 'client' && value.trim().length < 10) return "L'adresse doit contenir au moins 10 caractères.";
        break;
      case 'clinicType':
        if (currentData.role === 'client' && !value.trim()) return 'Le type de clinique est requis.';
        break;
      case 'companyName':
        if (currentData.role === 'supplier' && !value.trim()) return "Le nom de l'entreprise est requis.";
        if (currentData.role === 'supplier' && value.trim() && !/^[a-zA-Z\s]+$/.test(value)) return "Le nom de l'entreprise ne doit contenir que des lettres et des espaces.";
        break;
      default:
        break;
    }
    return null;
  }, []);

  const handleChange = (e) => {
    if (error) clearError();
    const { name, value } = e.target;
    
    setFormData(prevData => {
      const updatedData = { ...prevData, [name]: value };
      const errorMessage = validateField(name, value, updatedData);
      setFormErrors(prevErrors => ({
        ...prevErrors,
        [name]: errorMessage
      }));
      return updatedData;
    });
  };

  const validateAllFields = () => {
    const errors = {};
    for (const key in formData) {
      const errorMessage = validateField(key, formData[key], formData);
      if (errorMessage) {
        errors[key] = errorMessage;
      }
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateAllFields();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (!formData.role) {
      return;
    }

    const result = await register(formData);
    if (result.success) {
      // La redirection vers /login est gérée automatiquement dans AuthContext
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-background-shape shape-1"></div>
        <div className="auth-background-shape shape-2"></div>
        <div className="auth-background-shape shape-3"></div>
      </div>
      
      <div className="auth-card auth-card-large">
        <div className="auth-header">
          <div className="auth-logo">
                      <div className="auth-logo-icon"> 
                     <img src={logo}  className="auth-logo-img" />
                      </div>
                      <h1 className="auth-logo-text">SmartSupply Health</h1>
                    </div>
          <h2 className="auth-title">Inscription</h2>
          <p className="auth-subtitle">Créez votre compte professionnel</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {error && (
            <div className="auth-error">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <div className="auth-form-group">
            <label className="auth-label">Vous êtes :</label>
            <div className="auth-radio-group">
              <label className="auth-radio-label">
                <input
                  type="radio"
                  name="role"
                  value="client"
                  checked={formData.role === 'client'}
                  onChange={handleChange}
                  disabled={loading}
                  className="auth-radio"
                />
                <span className="auth-radio-custom"></span>
                <span className="auth-radio-text">Client</span>
              </label>
            </div>
          </div>


          
          <div className="auth-form-group">
            <label className="auth-label"></label>
            <div className="auth-radio-group">
              <label className="auth-radio-label">
                <input
                  type="radio"
                  name="role"
                  value="supplier"
                  checked={formData.role === 'supplier'}
                  onChange={handleChange}
                  disabled={loading}
                  className="auth-radio"
                />
                <span className="auth-radio-custom"></span>
                <span className="auth-radio-text">Supplier</span>
              </label>
            </div>
          </div>

          <div className="auth-form-row">
            <div className="auth-form-group">
              <label className="auth-label">Nom complet</label>
              <div className="auth-input-wrapper">
                <svg className="auth-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Nom complet"
                  className={`auth-input ${formErrors.name ? 'is-invalid' : ''}`}
                  disabled={loading}
                />
              </div>
              {formErrors.name && <p className="auth-error-text">{formErrors.name}</p>}
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Téléphone</label>
              <div className="auth-input-wrapper">
                <svg className="auth-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="Numéro de téléphone"
                  className={`auth-input ${formErrors.phone ? 'is-invalid' : ''}`}
                  disabled={loading}
                />
              </div>
              {formErrors.phone && <p className="auth-error-text">{formErrors.phone}</p>}
            </div>
          </div>

          <div className="auth-form-row">
            <div className="auth-form-group">
              <label className="auth-label">Email</label>
              <div className="auth-input-wrapper">
                <svg className="auth-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="votre@email.com"
                  className={`auth-input ${formErrors.email ? 'is-invalid' : ''}`}
                  disabled={loading}
                />
              </div>
              {formErrors.email && <p className="auth-error-text">{formErrors.email}</p>}
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Mot de passe</label>
              <div className="auth-input-wrapper">
                <svg className="auth-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Mot de passe"
                  className={`auth-input ${formErrors.password ? 'is-invalid' : ''}`}
                  disabled={loading}
                />
              </div>
              <p className="auth-input-condition">Au moins 6 caractères, une majuscule, une minuscule et un chiffre.</p>
              {formErrors.password && <p className="auth-error-text">{formErrors.password}</p>}
            </div>
          </div>

          {formData.role === 'client' && (
            <>
              <div className="auth-form-row">
                <div className="auth-form-group">
                  <label className="auth-label">Nom du projet</label>
                  <div className="auth-input-wrapper">
                    <svg className="auth-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <input
                      type="text"
                      name="clinicName"
                      value={formData.clinicName}
                      onChange={handleChange}
                      required
                      placeholder="Nom de votre clinique"
                      className={`auth-input ${formErrors.clinicName ? 'is-invalid' : ''}`}
                      disabled={loading}
                    />
                  </div>
                  {formErrors.clinicName && <p className="auth-error-text">{formErrors.clinicName}</p>}
                </div>

                <div className="auth-form-group">
                  <label className="auth-label">Type de projet</label>
                  <div className="auth-input-wrapper">
                    <svg className="auth-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <select
                      name="clinicType"
                      value={formData.clinicType}
                      onChange={handleChange}
                      required
                      className={`auth-input auth-select ${formErrors.clinicType ? 'is-invalid' : ''}`}
                      disabled={loading}
                    >
                      <option value="">Choisir le type</option>
                      <option value="clinic">Clinique</option>
                      <option value="laboratory">Laboratoire</option>
                      <option value="medical_office">Cabinet Médical</option>
                    </select>
                  </div>
                   {formErrors.clinicType && <p className="auth-error-text">{formErrors.clinicType}</p>}
                </div>
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Adresse</label>
                <div className="auth-input-wrapper">
                  <svg className="auth-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    placeholder="Adresse complète"
                    className={`auth-input ${formErrors.address ? 'is-invalid' : ''}`}
                    disabled={loading}
                  />
                </div>
                {formErrors.address && <p className="auth-error-text">{formErrors.address}</p>}
              </div>
            </>
          )}

          {formData.role === 'supplier' && (
            <div className="auth-form-group">
              <label className="auth-label">Nom de l'entreprise</label>
              <div className="auth-input-wrapper">
                <svg className="auth-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  placeholder="Nom de votre entreprise"
                  className={`auth-input ${formErrors.companyName ? 'is-invalid' : ''}`}
                  disabled={loading}
                />
              </div>
              {formErrors.companyName && <p className="auth-error-text">{formErrors.companyName}</p>}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="auth-button auth-button-primary"
          >
            {loading ? (
              <>
                <div className="auth-spinner"></div>
                Inscription...
              </>
            ) : (
              'Créer mon compte'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Vous avez déjà un compte ?{' '}
            <Link to="/login" className="auth-link">
              Connectez-vous ici
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;