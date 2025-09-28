import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      if (user.tipo === 'fretista') {
        // Buscar estatísticas de ofertas para fretistas
        const response = await axios.get('http://localhost:5000/api/ofertas/stats/resumo');
        setStats(response.data.stats);
      } else {
        // Para clientes, você pode implementar estatísticas de solicitações no futuro
        // Por enquanto, usar dados vazios
        setStats({
          total: 0,
          abertos: 0,
          em_andamento: 0,
          concluidos: 0
        });
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      setError('Erro ao carregar estatísticas');
      // Usar dados padrão em caso de erro
      setStats({
        total: 0,
        abertos: 0,
        em_andamento: 0,
        concluidos: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="dashboard">
      <main className="dashboard-content">
        <div className="welcome-card">
          <h2>Dashboard</h2>
          <p>Bem-vindo, <strong>{user.nome}</strong>!</p>
          <p>Você está logado como: <strong>{user.tipo}</strong></p>
          <p>Email: <strong>{user.email}</strong></p>
          
          <div className="quick-actions">
            <h3>Ações Rápidas:</h3>
            {user.tipo === 'cliente' ? (
              <div className="action-buttons">
                <button className="action-btn">Buscar Fretes</button>
                <button className="action-btn">Minhas Solicitações</button>
              </div>
            ) : (
              <div className="action-buttons">
                <Link to="/criar-oferta" className="action-btn">Nova Oferta</Link>
                <Link to="/minhas-ofertas" className="action-btn">Minhas Ofertas</Link>
              </div>
            )}
            
           {/* Seção de atividades recentes (opcional) */}
            {user.tipo === 'fretista' && stats?.total > 0 && (
              <div className="recent-activity-card">
                <h3>Resumo Rápido</h3>
                <div className="activity-summary">
                  {stats.abertos > 0 && (
                    <div className="activity-item">
                      <span className="activity-icon">🟢</span>
                      <span>Você tem {stats.abertos} oferta{stats.abertos > 1 ? 's' : ''} ativa{stats.abertos > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {stats.em_andamento > 0 && (
                    <div className="activity-item">
                      <span className="activity-icon">🟡</span>
                      <span>{stats.em_andamento} frete{stats.em_andamento > 1 ? 's' : ''} em andamento</span>
                    </div>
                  )}
                  {stats.abertos === 0 && stats.em_andamento === 0 && (
                    <div className="activity-item">
                      <span className="activity-icon">💡</span>
                      <span>
                        <Link to="/criar-oferta" style={{ color: '#667eea', textDecoration: 'none' }}>
                          Crie sua primeira oferta
                        </Link> para começar a receber solicitações!
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="stats-card">
          <h3>Estatísticas</h3>
          {error && <div className="error-message">{error}</div>}
          
          {loading ? (
            <div className="loading-stats">
              <div className="loading-text">Carregando estatísticas...</div>
            </div>
          ) : (
            <div className="stats-grid">
              {user.tipo === 'fretista' ? (
                <>
                  <div className="stat-item">
                    <div className="stat-number">{stats?.total || 0}</div>
                    <div className="stat-label">Total de Ofertas</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{stats?.abertos || 0}</div>
                    <div className="stat-label">Ofertas Abertas</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{stats?.em_andamento || 0}</div>
                    <div className="stat-label">Em Andamento</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{stats?.concluidos || 0}</div>
                    <div className="stat-label">Concluídos</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="stat-item">
                    <div className="stat-number">{stats?.total || 0}</div>
                    <div className="stat-label">Fretes Solicitados</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{stats?.em_andamento || 0}</div>
                    <div className="stat-label">Em Andamento</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{stats?.concluidos || 0}</div>
                    <div className="stat-label">Concluídos</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">-</div>
                    <div className="stat-label">Avaliações</div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

       
      </main>
    </div>
  );
};

export default Dashboard;