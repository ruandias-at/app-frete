  import React, { useState } from 'react';
  import './FiltroOfertas.css';

  const FiltroOfertas = ({ onFilter, onClearFilters }) => {
    const [filtros, setFiltros] = useState({
      origem: '',
      destino: '',
      preco_min: '',
      preco_max: ''
    });

    const [mostrarFiltros, setMostrarFiltros] = useState(false);

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFiltros(prev => ({
        ...prev,
        [name]: value
      }));
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      
      // Criar objeto de filtros apenas com valores preenchidos
      const filtrosAtivos = {};
      
      if (filtros.origem.trim()) {
        filtrosAtivos.origem = filtros.origem.trim();
      }
      if (filtros.destino.trim()) {
        filtrosAtivos.destino = filtros.destino.trim();
      }
      if (filtros.preco_min) {
        filtrosAtivos.preco_min = parseFloat(filtros.preco_min);
      }
      if (filtros.preco_max) {
        filtrosAtivos.preco_max = parseFloat(filtros.preco_max);
      }

      onFilter(filtrosAtivos);
    };

    const handleClear = () => {
      setFiltros({
        origem: '',
        destino: '',
        preco_min: '',
        preco_max: ''
      });
      onClearFilters();
    };

    const temFiltrosAtivos = () => {
      return filtros.origem || filtros.destino || filtros.preco_min || filtros.preco_max;
    };

    return (
      <div className="filtro-ofertas">
        <button 
          className="toggle-filtros-btn"
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
        >
          <span className="filter-icon">🔍</span>
          {mostrarFiltros ? 'Ocultar Filtros' : 'Filtrar Ofertas'}
          {temFiltrosAtivos() && <span className="filtros-ativos-badge">{
            [filtros.origem, filtros.destino, filtros.preco_min, filtros.preco_max].filter(Boolean).length
          }</span>}
        </button>

        {mostrarFiltros && (
          <div className="filtros-container">
            <form onSubmit={handleSubmit} className="filtros-form">
              <div className="filtros-grid">
                {/* Origem */}
                <div className="filtro-group">
                  <label htmlFor="origem">
                    <span className="label-icon">📍</span>
                    Origem
                  </label>
                  <input
                    type="text"
                    id="origem"
                    name="origem"
                    value={filtros.origem}
                    onChange={handleChange}
                    placeholder="Ex: São Paulo, SP"
                    className="filtro-input"
                  />
                </div>

                {/* Destino */}
                <div className="filtro-group">
                  <label htmlFor="destino">
                    <span className="label-icon">🎯</span>
                    Destino
                  </label>
                  <input
                    type="text"
                    id="destino"
                    name="destino"
                    value={filtros.destino}
                    onChange={handleChange}
                    placeholder="Ex: Rio de Janeiro, RJ"
                    className="filtro-input"
                  />
                </div>

                {/* Preço Mínimo */}
                <div className="filtro-group">
                  <label htmlFor="preco_min">
                    <span className="label-icon">💰</span>
                    Preço Mínimo (R$)
                  </label>
                  <input
                    type="number"
                    id="preco_min"
                    name="preco_min"
                    value={filtros.preco_min}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="filtro-input"
                  />
                </div>

                {/* Preço Máximo */}
                <div className="filtro-group">
                  <label htmlFor="preco_max">
                    <span className="label-icon">💵</span>
                    Preço Máximo (R$)
                  </label>
                  <input
                    type="number"
                    id="preco_max"
                    name="preco_max"
                    value={filtros.preco_max}
                    onChange={handleChange}
                    placeholder="999.99"
                    min="0"
                    step="0.01"
                    className="filtro-input"
                  />
                </div>
              </div>

              <div className="filtros-actions">
                <button 
                  type="button" 
                  onClick={handleClear}
                  className="btn-limpar"
                  disabled={!temFiltrosAtivos()}
                >
                  Limpar Filtros
                </button>
                <button 
                  type="submit" 
                  className="btn-aplicar"
                >
                  Aplicar Filtros
                </button>
              </div>
            </form>

            {temFiltrosAtivos() && (
              <div className="filtros-ativos">
                <span className="filtros-ativos-label">Filtros ativos:</span>
                <div className="filtros-tags">
                  {filtros.origem && (
                    <span className="filtro-tag">
                      📍 Origem: {filtros.origem}
                      <button onClick={() => setFiltros({...filtros, origem: ''})}>×</button>
                    </span>
                  )}
                  {filtros.destino && (
                    <span className="filtro-tag">
                      🎯 Destino: {filtros.destino}
                      <button onClick={() => setFiltros({...filtros, destino: ''})}>×</button>
                    </span>
                  )}
                  {filtros.preco_min && (
                    <span className="filtro-tag">
                      💰 Min: R$ {filtros.preco_min}
                      <button onClick={() => setFiltros({...filtros, preco_min: ''})}>×</button>
                    </span>
                  )}
                  {filtros.preco_max && (
                    <span className="filtro-tag">
                      💵 Max: R$ {filtros.preco_max}
                      <button onClick={() => setFiltros({...filtros, preco_max: ''})}>×</button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  export default FiltroOfertas;