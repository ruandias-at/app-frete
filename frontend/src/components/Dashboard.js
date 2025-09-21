import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Sistema de Frete</h1>
        <div className="user-info">
          <span>Bem-vindo, {user.nome}!</span>
          <span className="user-type">({user.tipo})</span>
          <button onClick={handleLogout} className="logout-btn">
            Sair
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="welcome-card">
          <h2>Dashboard</h2>
          <p>Você está logado como: <strong>{user.tipo}</strong></p>
          <p>Email: <strong>{user.email}</strong></p>
          
          <div className="quick-actions">
            <h3>Ações Rápidas:</h3>
            {user.tipo === 'cliente' ? (
              <div className="action-buttons">
                <button className="action-btn">Solicitar Frete</button>
                <button className="action-btn">Minhas Solicitações</button>
                <button className="action-btn">Histórico</button>
              </div>
            ) : (
              <div className="action-buttons">
                <Link to="/criar-oferta" className="action-btn">Nova Oferta</Link>
                <Link to="/minhas-ofertas" className="action-btn">Minhas Ofertas</Link>
                <button className="action-btn">Histórico</button>
              </div>
            )}
          </div>
        </div>

        <div className="stats-card">
          <h3>Estatísticas</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">0</div>
              <div className="stat-label">
                {user.tipo === 'cliente' ? 'Fretes Solicitados' : 'Fretes Realizados'}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-number">0</div>
              <div className="stat-label">Em Andamento</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">0</div>
              <div className="stat-label">Concluídos</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;