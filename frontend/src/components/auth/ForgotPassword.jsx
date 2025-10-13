import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './Auth.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('client');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/auth/forgot-password', { email, role });
      setSuccess('Un code de vérification a été envoyé à votre email.');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Échec de l\'envoi du code de vérification.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/auth/reset-password', { email, role, token, password });
      setSuccess('Le mot de passe a été réinitialisé avec succès. Redirection vers la connexion...');
      setTimeout(() => {
        navigate('/login');
      }, 2000); // Redirect after 2 seconds
    } catch (err) {
      setError(err.response?.data?.message || 'Échec de la réinitialisation du mot de passe.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Changer mot de passe</h2>
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        {step === 1 ? (
          <form onSubmit={handleRequestCode}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="form-control" />
            </div>
            <div className="form-group">
              <label>Rôle</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="form-control">
                <option value="client">Client</option>
                <option value="supplier">Fournisseur</option>
              </select>
            </div>
            <button type="submit" className="auth-button">Envoyer code de vérification</button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label>Code de vérification</label>
              <input type="text" value={token} onChange={(e) => setToken(e.target.value)} required className="form-control" />
            </div>
            <div className="form-group">
              <label>Nouveau mot de passe</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="form-control" />
            </div>
            <button type="submit" className="auth-button">Changer mot de passe</button>
          </form>
        )}
        <div className="auth-footer">
          <Link to="/login">Retour à la connexion</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
