import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import axios from 'axios';
import FiltroOfertas from './FiltroOfertas';
import './CatalogoOfertas.css';

const CatalogoOfertas = ({ limit = null, filtros = {} }) => {
  const [ofertas, setOfertas] = useState([]);
  const [ofertasFiltradas, setOfertasFiltradas] = useState([]);
  const [filtrosAtivos, setFiltrosAtivos] = useState(filtros);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();


  const fetchOfertas = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/ofertas`);
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


  useEffect(() => {
    fetchOfertas();
  }, [fetchOfertas]);


  // Aplicar filtros iniciais após carregar as ofertas
  useEffect(() => {
    if (ofertas.length > 0) {
      aplicarFiltros(filtros);
    }
  }, [ofertas, aplicarFiltros, filtros]); // Remove 'filtros' das dependências

  

  const aplicarFiltros = (filtros) => {
    setFiltrosAtivos(filtros);
    
    let resultado = [...ofertas];

    // Filtrar por origem
    if (filtros.origem) {
      resultado = resultado.filter(oferta => 
        oferta.origem.toLowerCase().includes(filtros.origem.toLowerCase())
      );
    }

    // Filtrar por destino
    if (filtros.destino) {
      resultado = resultado.filter(oferta => 
        oferta.destino.toLowerCase().includes(filtros.destino.toLowerCase())
      );
    }

    // Filtrar por preço mínimo
    if (filtros.preco_min) {
      resultado = resultado.filter(oferta => 
        parseFloat(oferta.preco) >= parseFloat(filtros.preco_min)
      );
    }

    // Filtrar por preço máximo
    if (filtros.preco_max) {
      resultado = resultado.filter(oferta => 
        parseFloat(oferta.preco) <= parseFloat(filtros.preco_max)
      );
    }

    setOfertasFiltradas(limit ? resultado.slice(0, limit) : resultado);
  };

  const limparFiltros = () => {
    setFiltrosAtivos({});
    setOfertasFiltradas(limit ? ofertas.slice(0, limit) : ofertas);
  };

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

  const handleOfertaClick = (ofertaId) => {
    navigate(`/oferta/${ofertaId}`);
  };

  const settings = {
    dots: true,
    infinite: ofertasFiltradas.length > 3,
    speed: 500,
    slidesToShow: Math.min(3, ofertasFiltradas.length),
    slidesToScroll: 1,
    autoplay: ofertasFiltradas.length > 3,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        }
      }
    ]
  };

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
            <p className="empty-subtitle">Em breve teremos novas ofertas de frete!</p>
          </div>
        </div>
      </section>
    );
  }


  return (
    <section className="catalogo-section">
      <div className="catalogo-container">
        <div className="catalogo-header">
          <h2 className="catalogo-title">Ofertas Disponíveis</h2>
          <p className="catalogo-subtitle">
            Confira as melhores ofertas de frete disponíveis agora
            {Object.keys(filtrosAtivos).length > 0 && 
              ` (${ofertasFiltradas.length} ${ofertasFiltradas.length === 1 ? 'resultado' : 'resultados'})`
            }
          </p>
        </div>

        {/* Filtros */}
        <FiltroOfertas 
          onFilter={aplicarFiltros}
          onClearFilters={limparFiltros}
        />

        {/* Mensagem quando não há resultados nos filtros */}
        {ofertasFiltradas.length === 0 && Object.keys(filtrosAtivos).length > 0 && (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h3>Nenhuma oferta encontrada</h3>
            <p>Tente ajustar os filtros para ver mais resultados</p>
            <button onClick={limparFiltros} className="btn-limpar-filtros">
              Limpar Filtros
            </button>
          </div>
        )}

        {/* Carrossel */}
        {ofertasFiltradas.length > 0 && (
          <Slider {...settings} className="ofertas-carousel">
            {ofertasFiltradas.map((oferta) => (
            <div key={oferta.id} className="carousel-item">
              <div 
                className="oferta-card-catalogo"
                onClick={() => handleOfertaClick(oferta.id)}
              >
                {/* Imagem ou Emoji */}
                <div className="oferta-image-container">
                  {oferta.imagem_caminhao ? (
                    <img
                      src={`${process.env.REACT_APP_API_URL}/uploads/ofertas/${oferta.imagem_caminhao}`}
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
                    🚛
                  </div>
                </div>

                {/* Conteúdo do Card */}
                <div className="oferta-card-content">
                  {/* Rota */}
                  <div className="oferta-route-catalogo">
                    <span className="route-origin">{oferta.origem}</span>
                    <span className="route-arrow">→</span>
                    <span className="route-destination">{oferta.destino}</span>
                  </div>

                  {/* Informações principais */}
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

                  {/* Capacidades */}
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

                  {/* Fretista */}
                  <div className="oferta-fretista">
                    <span className="fretista-icon">👤</span>
                    <span className="fretista-nome">{oferta.fretista_nome}</span>
                  </div>

                  {/* Botão de ação */}
                  <button className="ver-detalhes-btn">
                    Ver Detalhes
                  </button>
                </div>
              </div>
            </div>
          ))}
        </Slider>
        )}
      </div>
    </section>
  );
};

export default CatalogoOfertas;