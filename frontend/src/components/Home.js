import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home">
      <main className="home-content">
        <div className="hero-section">
          <div className="hero-text">
            <h1>AirFrete</h1>
            <p className="hero-subtitle">
              Conectamos clientes e fretistas de forma rápida e segura!
            </p>
            <p className="hero-description">
              {user 
                ? `Bem-vindo de volta, ${user.nome}! Gerencie seus fretes de forma eficiente.`
                : 'Encontre o fretista ideal para suas necessidades ou ofereça seus serviços de transporte.'
              }
            </p>
            
            <div className="hero-actions">
              {user ? (
                <>
                  <Link to="/dashboard" className="cta-button primary">
                    Ir para Dashboard
                  </Link>
                  {user.tipo === 'cliente' ? (
                    <button className="cta-button secondary">
                      Solicitar Frete
                    </button>
                  ) : (
                    <button className="cta-button secondary">
                      Ver Ofertas
                    </button>
                  )}
                </>
              ) : (
                <>
                  <Link to="/register" className="cta-button primary">
                    Começar Agora
                  </Link>
                  <Link to="/login" className="cta-button secondary">
                    Já tenho conta
                  </Link>
                </>
              )}
            </div>
          </div>
          
          <div className="hero-image">
            <div className="truck-icon">
              🚛
            </div>
          </div>
        </div>

        <div className="features-section">
          <h2>Como Funciona</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Cadastre-se</h3>
              <p>Crie sua conta como cliente ou fretista em poucos minutos</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Encontre</h3>
              <p>Clientes encontram fretistas disponíveis na sua região</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🤝</div>
              <h3>Negocie</h3>
              <p>Acordem preços e condições diretamente na plataforma</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">✅</div>
              <h3>Finalize</h3>
              <p>Acompanhe o transporte e finalize o serviço com segurança</p>
            </div>
          </div>
        </div>

        <div className="stats-section">
          <h2>Números da Plataforma</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">1,250+</div>
              <div className="stat-label">Fretes Realizados</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">350+</div>
              <div className="stat-label">Fretistas Cadastrados</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">98%</div>
              <div className="stat-label">Satisfação</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">24h</div>
              <div className="stat-label">Suporte</div>
            </div>
          </div>
        </div>

        {!user && (
          <div className="cta-section">
            <h2>Pronto para começar?</h2>
            <p>Junte-se a milhares de usuários que já confiam na nossa plataforma</p>
            <div className="cta-buttons">
              <Link to="/register" className="cta-button primary large">
                Criar Conta Gratuita
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;