import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import axios from 'axios';
import './DetalhesOferta.css';

const DetalhesOferta = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { iniciarConversa } = useChat();
  const navigate = useNavigate();
  const [oferta, setOferta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOferta = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/ofertas/${id}`);
      setOferta(response.data.oferta);
      setError('');
    } catch (error) {
      console.error('Erro ao buscar oferta:', error);
      if (error.response?.status === 404) {
        setError('Oferta não encontrada.');
      } else {
        setError('Erro ao carregar detalhes da oferta. Tente novamente mais tarde.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOferta();
  }, [id, fetchOferta]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleMensagem = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (isPropriaOferta) {
      alert('Você não pode enviar mensagem para sua própria oferta.');
      return;
    }

    try {
      console.log('Iniciando conversa com:', {
        destinatarioId: oferta.usuario_id,
        ofertaId: oferta.id,
        usuarioAtual: user.userId
      });

      // Iniciar conversa com o fretista (dono da oferta)
      const conversaId = await iniciarConversa(oferta.usuario_id, oferta.id);
      
      console.log('Conversa criada com ID:', conversaId);
      
      // Navegar para o chat com a conversa iniciada
      navigate(`/chat/${conversaId}`);
    } catch (error) {
      console.error('Erro detalhado ao iniciar conversa:', error);
      console.error('Response:', error.response);
      alert(`Erro ao iniciar conversa: ${error.response?.data?.message || error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="detalhes-loading">
        <div className="loading-spinner"></div>
        <p>Carregando detalhes da oferta...</p>
      </div>
    );
  }

  if (error || !oferta) {
    return (
      <div className="detalhes-error">
        <div className="error-icon">⚠️</div>
        <h2>{error || 'Oferta não encontrada'}</h2>
        <button onClick={() => navigate('/')} className="btn-voltar">
          Voltar para Home
        </button>
      </div>
    );
  }

  const isPropriaOferta = user && user.userId === oferta.usuario_id;

  return (
    <div className="detalhes-oferta">
      <div className="detalhes-container">
        {/* Header com botão voltar */}
        <div className="detalhes-header">
          <button onClick={() => navigate(-1)} className="btn-voltar-header">
            ← Voltar
          </button>
          <div className="status-badge-detalhes">
            {oferta.status === 'aberto' && '🟢 Disponível'}
            {oferta.status === 'em_andamento' && '🟡 Em Andamento'}
            {oferta.status === 'concluido' && '⚫ Concluído'}
          </div>
        </div>

        <div className="detalhes-content">
          {/* Coluna Esquerda - Imagem e Info Básica */}
          <div className="detalhes-left">
            {/* Imagem */}
            <div className="oferta-image-detalhes">
              {oferta.imagem_caminhao ? (
                <img
                  src={`http://localhost:5000/uploads/ofertas/${oferta.imagem_caminhao}`}
                  alt="Foto do caminhão"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="oferta-emoji-detalhes"
                style={{ display: oferta.imagem_caminhao ? 'none' : 'flex' }}
              >
                🚛
              </div>
            </div>

            {/* Card de Fretista */}
            <div className="fretista-card">
              <h3>Sobre o Fretista</h3>
              <div className="fretista-info">
                <div className="fretista-avatar">
                  {oferta.fretista_nome.charAt(0).toUpperCase()}
                </div>
                <div className="fretista-dados">
                  <h4>{oferta.fretista_nome}</h4>
                  <p>{oferta.fretista_email}</p>
                  {oferta.veiculo && (
                    <p className="veiculo-info">🚚 {oferta.veiculo}</p>
                  )}
                  {oferta.area_atuacao && (
                    <p className="area-info">📍 {oferta.area_atuacao}</p>
                  )}
                </div>
              </div>

              {!isPropriaOferta && user && (
                <button 
                  onClick={handleMensagem}
                  className="btn-mensagem"
                >
                  💬 Mandar Mensagem
                </button>
              )}

              {!user && (
                <button 
                  onClick={() => navigate('/login')}
                  className="btn-mensagem"
                >
                  Faça login para contatar
                </button>
              )}

              {isPropriaOferta && (
                <div className="propria-oferta-info">
                  ℹ️ Esta é sua oferta
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita - Detalhes */}
          <div className="detalhes-right">
            {/* Rota */}
            <div className="oferta-route-detalhes">
              <h1>
                <span className="origem-detalhes">{oferta.origem}</span>
                <span className="arrow-detalhes">→</span>
                <span className="destino-detalhes">{oferta.destino}</span>
              </h1>
            </div>

            {/* Preço Destaque */}
            <div className="preco-destaque">
              <span className="preco-label">Valor do Frete</span>
              <span className="preco-valor">{formatCurrency(oferta.preco)}</span>
            </div>

            {/* Informações Principais */}
            <div className="info-grid-detalhes">
              <div className="info-box">
                <div className="info-icon">📅</div>
                <div className="info-content">
                  <span className="info-title">Data Disponível</span>
                  <span className="info-text">{formatDate(oferta.data_disponivel)}</span>
                </div>
              </div>

              {oferta.capacidade_peso && (
                <div className="info-box">
                  <div className="info-icon">⚖️</div>
                  <div className="info-content">
                    <span className="info-title">Capacidade de Peso</span>
                    <span className="info-text">{oferta.capacidade_peso} kg</span>
                  </div>
                </div>
              )}

              {oferta.capacidade_volume && (
                <div className="info-box">
                  <div className="info-icon">📦</div>
                  <div className="info-content">
                    <span className="info-title">Capacidade de Volume</span>
                    <span className="info-text">{oferta.capacidade_volume} m³</span>
                  </div>
                </div>
              )}

              <div className="info-box">
                <div className="info-icon">🕒</div>
                <div className="info-content">
                  <span className="info-title">Publicado em</span>
                  <span className="info-text">{formatDate(oferta.criado_em)}</span>
                </div>
              </div>
            </div>

            {/* Descrição */}
            {oferta.descricao && (
              <div className="descricao-detalhes">
                <h3>Descrição da Oferta</h3>
                <p>{oferta.descricao}</p>
              </div>
            )}

            {/* Informações Adicionais */}
            <div className="info-adicional">
              <h3>Informações Importantes</h3>
              <ul>
                <li>✓ Todos os preços são negociáveis</li>
                <li>✓ Entre em contato para mais detalhes</li>
                <li>✓ Confirme disponibilidade antes de fechar</li>
                <li>✓ Documente todos os acordos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalhesOferta;