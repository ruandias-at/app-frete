import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import FiltroOfertas from './FiltroOfertas';
import './TodasOfertas.css';

const TodasOfertas = ({ limit = null, filtros = {} }) => {
  const [ofertas, setOfertas] = useState([]);
  const [ofertasFiltradas, setOfertasFiltradas] = useState([]);
  const [filtrosAtivos, setFiltrosAtivos] = useState(filtros);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const fetchOfertas = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/ofertas');
      const todasOfertas = response.data.ofertas;
      setOfertas(todasOfertas);
      setOfertasFiltradas(limit ? todasOfertas.slice(0, limit) : todasOfertas);
    } catch (error) {
      console.error('Erro ao buscar ofertas:', error);
      setError('Erro ao carregar ofertas');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const aplicarFiltros = useCallback((filtros) => {
    setFiltrosAtivos(filtros);
    
    let resultado = [...ofertas];

    if (filtros.origem) {
      resultado = resultado.filter(oferta => 
        oferta.origem.toLowerCase().includes(filtros.origem.toLowerCase())
      );
    }

    if (filtros.destino) {
      resultado = resultado.filter(oferta => 
        oferta.destino.toLowerCase().includes(filtros.destino.toLowerCase())
      );
    }

    if (filtros.preco_min) {
      resultado = resultado.filter(oferta => 
        parseFloat(oferta.preco) >= parseFloat(filtros.preco_min)
      );
    }

    if (filtros.preco_max) {
      resultado = resultado.filter(oferta => 
        parseFloat(oferta.preco) <= parseFloat(filtros.preco_max)
      );
    }

    setOfertasFiltradas(limit ? resultado.slice(0, limit) : resultado);
  }, [ofertas, limit]);

  const limparFiltros = () => {
    setFiltrosAtivos({});
    setOfertasFiltradas(limit ? ofertas.slice(0, limit) : ofertas);
  };

  useEffect(() => {
    fetchOfertas();
  }, [fetchOfertas]);

  // Aplicar filtros apenas se houver filtros ativos
  useEffect(() => {
    if (ofertas.length > 0 && filtros && Object.keys(filtros).length > 0) {
      aplicarFiltros(filtros);
    }
  }, [ofertas, filtros, aplicarFiltros]);

  if (loading) {
    return (
      <section className="catalogo-section">
        <div className="catalogo-container">
          <h2 className="catalogo-title">Ofertas Disponíveis</h2>
          <div className="loading-catalogo">Carregando ofertas...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="catalogo-section">
        <div className="catalogo-container">
          <h2 className="catalogo-title">Ofertas Disponíveis</h2>
          <div className="error-catalogo">{error}</div>
        </div>
      </section>
    );
  }

  if (ofertas.length === 0) {
    return (
      <section className="catalogo-section">
        <div className="catalogo-container">
          <h2 className="catalogo-title">Ofertas Disponíveis</h2>
          <div className="empty-catalogo">
            <div className="empty-icon">📦</div>
            <p>Nenhuma oferta disponível no momento.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="todas-ofertas-section">

      {/* Filtros */}
      <FiltroOfertas 
        onFilter={aplicarFiltros}
        onClearFilters={limparFiltros}
      />

      {/* Contador */}
      <div className="ofertas-count">
        <p>
          Mostrando {ofertasFiltradas.length} {ofertasFiltradas.length === 1 ? 'oferta' : 'ofertas'} encontrada{ofertasFiltradas.length === 1 ? '' : 's'}
          {Object.keys(filtrosAtivos).length > 0 && 
            ` (${ofertasFiltradas.length} ${ofertasFiltradas.length === 1 ? 'resultado' : 'resultados'})`
          }
        </p>
      </div>

      {/* Grid de Ofertas CORRIGIDO */}
      {ofertasFiltradas.length > 0 ? (
        <div className="catalogo-ofertas-grid">
          {ofertasFiltradas.map((oferta) => (
            <div 
              key={oferta.id} 
              className="oferta-card-catalogo"
              onClick={() => {
                console.log('Clicou na oferta:', oferta.id);
                navigate(`/oferta/${oferta.id}`);
              }}
            >
              <div className="oferta-image-container">
                {oferta.imagem_caminhao ? (
                  <img
                    src={`http://localhost:5000/uploads/ofertas/${oferta.imagem_caminhao}`}
                    alt={`Caminhão - ${oferta.origem} para ${oferta.destino}`}
                    className="oferta-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="oferta-emoji-placeholder"
                  style={{ display: oferta.imagem_caminhao ? 'none' : 'flex' }}
                >
                  <img src="http://localhost:5000/uploads/static/logo-frete.png" alt="Logo AirFrete" />
                </div>
              </div>

              <div className="oferta-card-content">
                <div className="oferta-route-catalogo">
                  <span className="route-origin">{oferta.origem}</span>
                  <span className="route-arrow">→</span>
                  <span className="route-destination">{oferta.destino}</span>
                </div>

                <div className="oferta-info-grid">
                  <div className="info-item-catalogo">
                    <span className="info-label">Preço</span>
                    <span className="info-value price">{formatCurrency(oferta.preco)}</span>
                  </div>
                  <div className="info-item-catalogo">
                    <span className="info-label">Data</span>
                    <span className="info-value">{formatDate(oferta.data_disponivel)}</span>
                  </div>
                </div>

                {(oferta.capacidade_peso || oferta.capacidade_volume) && (
                  <div className="oferta-capacidades">
                    {oferta.capacidade_peso && (
                      <span className="capacidade-tag">
                        ⚖️ {oferta.capacidade_peso}kg
                      </span>
                    )}
                    {oferta.capacidade_volume && (
                      <span className="capacidade-tag">
                        📦 {oferta.capacidade_volume}m³
                      </span>
                    )}
                  </div>
                )}

                <div className="oferta-fretista">
                  <span className="fretista-icon">👤</span>
                  <span className="fretista-nome">{oferta.fretista_nome}</span>
                </div>
              
                <button 
                  className="ver-detalhes-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Clicou no botão:', oferta.id);
                    navigate(`/oferta/${oferta.id}`);
                  }}
                >
                  Ver Detalhes
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="sem-ofertas">
          <div className="sem-ofertas-icon">📭</div>
          <h3>Nenhuma oferta encontrada</h3>
          <p>Tente ajustar os filtros ou verificar novamente mais tarde.</p>
          <button onClick={limparFiltros} className="btn-limpar-busca">
            Limpar Filtros
          </button>
        </div>
      )}
    </div>
  );
}

export default TodasOfertas;