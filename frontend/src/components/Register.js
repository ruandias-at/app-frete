import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    tipo: 'cliente',
    placa: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });

    // Limpar o campo placa se mudou para cliente
    if (name === 'tipo' && value === 'cliente') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        placa: ''
      }));
    }
  };

  const validateForm = () => {
    if (formData.senha !== formData.confirmarSenha) {
      setError('As senhas não coincidem');
      return false;
    }
    
    if (formData.senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return false;
    }

    if (formData.tipo === 'fretista' && !formData.placa.trim()) {
      setError('Placa do veículo é obrigatória para fretistas');
      return false;
    }

    if (formData.placa && !/^[A-Z]{3}-?\d{4}$/i.test(formData.placa.replace('-', ''))) {
      setError('Formato de placa inválido. Use o formato ABC-1234 ou ABC1234');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    const result = await register(
      formData.nome,
      formData.email,
      formData.senha,
      formData.tipo,
      formData.placa
    );
    
    if (result.success) {
      setSuccess('Conta criada com sucesso! Redirecionando...');
      setTimeout(() => {
        // Redirecionar baseado no tipo de usuário
        if (formData.tipo === 'fretista') {
          navigate('/dashboard-fretista');
        } else {
          navigate('/dashboard');
        }
      }, 1500);
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Criar Conta</h2>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="nome">Nome Completo:</label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
              placeholder="Digite seu nome completo"
            />
          </div>

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

          <div className="form-group">
            <label>Tipo de Usuário:</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="tipo"
                  value="cliente"
                  checked={formData.tipo === 'cliente'}
                  onChange={handleChange}
                />
                <span className="radio-custom"></span>
                Cliente
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="tipo"
                  value="fretista"
                  checked={formData.tipo === 'fretista'}
                  onChange={handleChange}
                />
                <span className="radio-custom"></span>
                Fretista
              </label>
            </div>
          </div>

          {formData.tipo === 'fretista' && (
            <div className="form-group">
              <label htmlFor="placa">Placa do Veículo:</label>
              <input
                type="text"
                id="placa"
                name="placa"
                value={formData.placa || ''}
                onChange={handleChange}
                required={formData.tipo === 'fretista'}
                placeholder="Ex: ABC-1234"
                maxLength="8"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="senha">Senha:</label>
            <input
              type="password"
              id="senha"
              name="senha"
              value={formData.senha}
              onChange={handleChange}
              required
              placeholder="Digite sua senha (min. 6 caracteres)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmarSenha">Confirmar Senha:</label>
            <input
              type="password"
              id="confirmarSenha"
              name="confirmarSenha"
              value={formData.confirmarSenha}
              onChange={handleChange}
              required
              placeholder="Confirme sua senha"
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <div className="auth-links">
          <p>
            Já tem uma conta? 
            <Link to="/login"> Faça login aqui</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;