import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './MinhasOfertas.css';

const MinhasOfertas = () => {
  const { user } = useAuth();
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Só busca dados se for fretista
    if (user?.tipo === 'fretista') {
      fetchOfertas();
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Verificar se é fretista
  if (user?.tipo !== 'fretista') {
    return (
      <div className="access-denied">
        <h2>Acesso Negado</h2>
        <p>Apenas fretistas podem ver suas ofertas.</p>
      </div>
    );
  }

  const fetchOfertas = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/ofertas/minhas');
      setOfertas(response.data.ofertas);
    } catch (error) {
      setError('Erro ao carregar suas ofertas');
      console.error('Erro ao buscar ofertas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/ofertas/stats/resumo');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  const handleUpdateStatus = async (ofertaId, newStatus) => {
    try {
      await axios.patch(`http://localhost:5000/api/ofertas/${ofertaId}/status`, {
        status: newStatus
      });
      
      // Atualizar a lista
      fetchOfertas();
      fetchStats();
      
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status da oferta');
    }
  };

  const handleDeleteOferta = async (ofertaId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta oferta?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/ofertas/${ofertaId}`);
      
      // Atualizar a lista
      fetchOfertas();
      fetchStats();
      
    } catch (error) {
      console.error('Erro ao excluir oferta:', error);
      alert('Erro ao excluir oferta');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status) => {
    const colors = {
      'aberto': '#28a745',
      'em_andamento': '#ffc107',
      'concluido': '#6c757d'
    };
    return colors[status] || '#6c757d';
  };

  const getStatusText = (status) => {
    const texts = {
      'aberto': 'Aberto',
      'em_andamento': 'Em Andamento',
      'concluido': 'Concluído'
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Carregando suas ofertas...</div>
      </div>
    );
  }

  return (
    <div className="minhas-ofertas">
      <div className="minhas-ofertas-container">
        <div className="header">
          <h2>Minhas Ofertas de Frete</h2>
          <Link to="/criar-oferta" className="btn-primary">
            + Nova Oferta
          </Link>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Estatísticas */}
        {stats && (
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Total</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.abertos}</div>
              <div className="stat-label">Abertas</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.em_andamento}</div>
              <div className="stat-label">Em Andamento</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.concluidos}</div>
              <div className="stat-label">Concluídas</div>
            </div>
          </div>
        )}

        {/* Lista de ofertas */}
        <div className="ofertas-list">
          {ofertas.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>Nenhuma oferta encontrada</h3>
              <p>Você ainda não criou nenhuma oferta de frete.</p>
              <Link to="/criar-oferta" className="btn-primary">
                Criar Primeira Oferta
              </Link>
            </div>
          ) : (
            ofertas.map(oferta => (
              <div key={oferta.id} className="oferta-card">
                <div className="oferta-header">
                  <div className="oferta-route">
                    <span className="origem">{oferta.origem}</span>
                    <span className="arrow">→</span>
                    <span className="destino">{oferta.destino}</span>
                  </div>
                  <div className="oferta-status">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(oferta.status) }}
                    >
                      {getStatusText(oferta.status)}
                    </span>
                  </div>
                </div>

                <div className="oferta-content">
                  <div className="oferta-info">
                    <div className="info-item">
                      <strong>Preço:</strong> {formatCurrency(oferta.preco)}
                    </div>
                    <div className="info-item">
                      <strong>Data:</strong> {formatDate(oferta.data_disponivel)}
                    </div>
                    {oferta.capacidade_peso && (
                      <div className="info-item">
                        <strong>Peso:</strong> {oferta.capacidade_peso} kg
                      </div>
                    )}
                    {oferta.capacidade_volume && (
                      <div className="info-item">
                        <strong>Volume:</strong> {oferta.capacidade_volume} m³
                      </div>
                    )}
                  </div>

                  {oferta.descricao && (
                    <div className="oferta-descricao">
                      <p>{oferta.descricao}</p>
                    </div>
                  )}
                </div>

                <div className="oferta-actions">
                  <div className="status-actions">
                    {oferta.status === 'aberto' && (
                      <button 
                        onClick={() => handleUpdateStatus(oferta.id, 'em_andamento')}
                        className="btn-status em-andamento"
                      >
                        Iniciar
                      </button>
                    )}
                    {oferta.status === 'em_andamento' && (
                      <button 
                        onClick={() => handleUpdateStatus(oferta.id, 'concluido')}
                        className="btn-status concluido"
                      >
                        Finalizar
                      </button>
                    )}
                    {oferta.status === 'concluido' && (
                      <button 
                        onClick={() => handleUpdateStatus(oferta.id, 'aberto')}
                        className="btn-status aberto"
                      >
                        Reabrir
                      </button>
                    )}
                  </div>

                  <div className="crud-actions">
                    <button 
                      className="btn-edit"
                      title="Editar oferta"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDeleteOferta(oferta.id)}
                      className="btn-delete"
                      title="Excluir oferta"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="oferta-meta">
                  <small>Criado em: {formatDate(oferta.criado_em)}</small>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MinhasOfertas;