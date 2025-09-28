import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './CriarOferta.css';

const EditarOferta = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [formData, setFormData] = useState({
    origem: '',
    destino: '',
    descricao: '',
    preco: '',
    data_disponivel: '',
    capacidade_peso: '',
    capacidade_volume: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Só busca dados se for fretista
    if (user?.tipo === 'fretista') {
      fetchOferta();
    } else {
      setLoading(false);
    }
  }, [id, user]);

  // Verificar se é fretista (após hooks)
  if (user?.tipo !== 'fretista') {
    return (
      <div className="access-denied">
        <h2>Acesso Negado</h2>
        <p>Apenas fretistas podem editar ofertas de frete.</p>
      </div>
    );
  }

  const fetchOferta = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/ofertas/${id}`);
      const oferta = response.data.oferta;



      // Formatar data para input date
      const dataFormatada = new Date(oferta.data_disponivel).toISOString().split('T')[0];

      setFormData({
        origem: oferta.origem || '',
        destino: oferta.destino || '',
        descricao: oferta.descricao || '',
        preco: oferta.preco || '',
        data_disponivel: dataFormatada,
        capacidade_peso: oferta.capacidade_peso || '',
        capacidade_volume: oferta.capacidade_volume || ''
      });

    } catch (error) {
      if (error.response?.status === 404) {
        setError('Oferta não encontrada.');
      } else {
        setError('Erro ao carregar dados da oferta.');
      }
      console.error('Erro ao buscar oferta:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await axios.put(`http://localhost:5000/api/ofertas/${id}`, formData);
      
      setSuccess('Oferta atualizada com sucesso!');
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate('/minhas-ofertas');
      }, 2000);

    } catch (error) {
      setError(error.response?.data?.message || 'Erro ao atualizar oferta');
    }

    setSaving(false);
  };

  // Data mínima (hoje)
  const hoje = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Carregando dados da oferta...</div>
      </div>
    );
  }

  if (error && !formData.origem) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/minhas-ofertas')} className="btn-secondary">
          Voltar para Minhas Ofertas
        </button>
      </div>
    );
  }

  return (
    <div className="criar-oferta">
      <div className="criar-oferta-container">
        <h2>Editar Oferta de Frete</h2>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="oferta-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="origem">Origem *</label>
              <input
                type="text"
                id="origem"
                name="origem"
                value={formData.origem}
                onChange={handleChange}
                required
                placeholder="Ex: São Paulo, SP"
              />
            </div>

            <div className="form-group">
              <label htmlFor="destino">Destino *</label>
              <input
                type="text"
                id="destino"
                name="destino"
                value={formData.destino}
                onChange={handleChange}
                required
                placeholder="Ex: Rio de Janeiro, RJ"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="preco">Preço (R$) *</label>
              <input
                type="number"
                id="preco"
                name="preco"
                value={formData.preco}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label htmlFor="data_disponivel">Data Disponível *</label>
              <input
                type="date"
                id="data_disponivel"
                name="data_disponivel"
                value={formData.data_disponivel}
                onChange={handleChange}
                required
                min={hoje}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="capacidade_peso">Capacidade de Peso (kg)</label>
              <input
                type="number"
                id="capacidade_peso"
                name="capacidade_peso"
                value={formData.capacidade_peso}
                onChange={handleChange}
                min="0"
                step="0.1"
                placeholder="Ex: 1000"
              />
            </div>

            <div className="form-group">
              <label htmlFor="capacidade_volume">Capacidade de Volume (m³)</label>
              <input
                type="number"
                id="capacidade_volume"
                name="capacidade_volume"
                value={formData.capacidade_volume}
                onChange={handleChange}
                min="0"
                step="0.1"
                placeholder="Ex: 50"
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label htmlFor="descricao">Descrição</label>
            <textarea
              id="descricao"
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              rows="4"
              placeholder="Descreva detalhes sobre o frete, tipo de carga aceita, condições especiais, etc."
            />
          </div>

          

          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => navigate('/minhas-ofertas')}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>

        <div className="form-info">
          <h4>📋 Dicas para editar sua oferta:</h4>
          <ul>
            <li>Mantenha as informações sempre atualizadas</li>
            <li>Ajuste o preço conforme a demanda</li>
            <li>Atualize a data disponível se necessário</li>
            <li>Seja claro nas descrições para evitar mal-entendidos</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EditarOferta;