import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: email, 2: token, 3: nova senha
  const [formData, setFormData] = useState({
    email: '',
    token: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Passo 1: Solicitar código
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/forgot-password', {
        email: formData.email
      });

      setMessage(response.data.message);
      setStep(2);

      // Em desenvolvimento, mostrar o token
      if (response.data.token) {
        setMessage(`${response.data.message}\n\n[DESENVOLVIMENTO] Token: ${response.data.token}`);
      }

    } catch (error) {
      setError(error.response?.data?.message || 'Erro ao solicitar recuperação');
    }

    setLoading(false);
  };

  // Passo 2: Verificar token
  const handleVerifyToken = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await axios.post('http://localhost:5000/api/auth/verify-token', {
        email: formData.email,
        token: formData.token
      });

      setMessage('Código verificado com sucesso!');
      setStep(3);

    } catch (error) {
      setError(error.response?.data?.message || 'Código inválido ou expirado');
    }

    setLoading(false);
  };

  // Passo 3: Redefinir senha
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/auth/reset-password', {
        email: formData.email,
        token: formData.token,
        newPassword: formData.newPassword
      });

      setMessage(response.data.message);
      
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);

    } catch (error) {
      setError(error.response?.data?.message || 'Erro ao redefinir senha');
    }

    setLoading(false);
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
      <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
      <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
      <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
      <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
    </div>
  );

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Recuperar Senha</h2>
        
        {renderStepIndicator()}

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message" style={{ whiteSpace: 'pre-line' }}>{message}</div>}

        {step === 1 && (
          <>
            <p className="step-description">
              Digite seu email para receber o código de recuperação
            </p>
            <form onSubmit={handleRequestCode} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Digite seu email"
                />
              </div>

              <button 
                type="submit" 
                className="auth-button"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar Código'}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <p className="step-description">
              Digite o código de 4 dígitos enviado para seu email
            </p>
            <form onSubmit={handleVerifyToken} className="auth-form">
              <div className="form-group">
                <label htmlFor="token">Código de Verificação:</label>
                <input
                  type="text"
                  id="token"
                  name="token"
                  value={formData.token}
                  onChange={handleChange}
                  required
                  placeholder="0000"
                  maxLength="4"
                  pattern="[0-9]{4}"
                  className="token-input"
                />
              </div>

              <div className="form-buttons">
                <button 
                  type="button" 
                  onClick={() => setStep(1)}
                  className="auth-button secondary"
                >
                  Voltar
                </button>
                <button 
                  type="submit" 
                  className="auth-button"
                  disabled={loading}
                >
                  {loading ? 'Verificando...' : 'Verificar Código'}
                </button>
              </div>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <p className="step-description">
              Digite sua nova senha
            </p>
            <form onSubmit={handleResetPassword} className="auth-form">
              <div className="form-group">
                <label htmlFor="newPassword">Nova Senha:</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  placeholder="Digite sua nova senha"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmar Nova Senha:</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Confirme sua nova senha"
                />
              </div>

              <div className="form-buttons">
                <button 
                  type="button" 
                  onClick={() => setStep(2)}
                  className="auth-button secondary"
                >
                  Voltar
                </button>
                <button 
                  type="submit" 
                  className="auth-button"
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'Redefinir Senha'}
                </button>
              </div>
            </form>
          </>
        )}

        <div className="auth-links">
          <p>
            Lembrou da senha? 
            <Link to="/login"> Voltar ao login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;