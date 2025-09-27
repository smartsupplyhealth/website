import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';
import logo from '../../style/logo.jpg';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: '' 
  });
  const [formErrors, setFormErrors] = useState({});
  const [localError, setLocalError] = useState('');

  const { login, loading, error, clearError } = useAuth();

  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'email':
        if (!value.trim()) return "L'email est requis.";
        if (!/\S+@\S+\.\S+/.test(value)) return 'L\'email doit inclure un "@".';
        break;
      case 'password':
        if (!value.trim()) return 'Le mot de passe est requis.';
        break;
      default:
        break;
    }
    return null;
  }, []);

  const handleChange = (e) => {
    if (error) clearError();
    if (localError) setLocalError('');
    const { name, value } = e.target;
    
    setFormData(prevData => ({ ...prevData, [name]: value }));

    const errorMessage = validateField(name, value);
    setFormErrors(prevErrors => ({
      ...prevErrors,
      [name]: errorMessage
    }));
  };

  const validateAllFields = () => {
    const errors = {};
    const emailError = validateField('email', formData.email);
    if (emailError) errors.email = emailError;

    const passwordError = validateField('password', formData.password);
    if (passwordError) errors.password = passwordError;
    
    if (!formData.role) {
      errors.role = 'Veuillez sélectionner un rôle.';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    const errors = validateAllFields();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return false;
    }

    try {
      const res = await login(formData.email, formData.password, formData.role);
      if (!res?.success) {
        setLocalError(res?.error || 'Email ou mot de passe invalide.');
      }
    } catch (err) {
      setLocalError('Email ou mot de passe invalide.');
      console.error('Login failed:', err);
    }
    return false;
  };

  const handleFormKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-background-shape shape-1"></div>
        <div className="auth-background-shape shape-2"></div>
        <div className="auth-background-shape shape-3"></div>
      </div>
      
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="auth-logo-icon"> 
           <img src={logo}  className="auth-logo-img" />
            </div>
            <h1 className="auth-logo-text">SmartSupply Health</h1>
          </div>
          <h2 className="auth-title">Connexion</h2>
          <p className="auth-subtitle">Accédez à votre espace personnel</p>
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            color: 'white', 
            padding: '8px 16px', 
            borderRadius: '8px', 
            fontSize: '14px', 
            textAlign: 'center', 
            margin: '8px 0',
            fontWeight: '500'
          }}>
            🚀 CI/CD Pipeline Active - Version 1.1.0
          </div>
        </div>
        
        <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="auth-form" noValidate>
          {(error || localError) && (
            <div className="auth-error">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {localError || error}
            </div>
          )}

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
                placeholder="••••••••"
                className={`auth-input ${formErrors.password ? 'is-invalid' : ''}`}
                disabled={loading}
              />
            </div>
            {formErrors.password && <p className="auth-error-text">{formErrors.password}</p>}
          </div>

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
                <span className="auth-radio-text">Fournisseur</span>
              </label>
            </div>
            {formErrors.role && <p className="auth-error-text">{formErrors.role}</p>}
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="auth-button auth-button-primary"
          >
            {loading ? (
              <>
                <div className="auth-spinner"></div>
                Connexion...
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            <Link to="/forgot-password" className="auth-link">
              Mot de passe oublié ?
            </Link>
          </p>
          <p>
            Pas encore de compte ?{' '}
            <Link to="/register" className="auth-link">
              Créez-en un ici
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;