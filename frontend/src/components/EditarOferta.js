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
    capacidade_volume: '',
    imagem_caminhao: ''
  });
  
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [removerImagem, setRemoverImagem] = useState(false); // Novo estado para controlar remoção de imagem

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
        capacidade_volume: oferta.capacidade_volume || '',
        imagem_caminhao: '' // Manter vazio para nova imagem
      });

      // Resetar estado de remoção de imagem
      setRemoverImagem(false);

      // Se houver imagem existente, carregar preview
      if (oferta.imagem_caminhao) {
        setImagePreview(`http://localhost:5000/uploads/ofertas/${oferta.imagem_caminhao}`);
      }

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Validar tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Tipo de arquivo não permitido. Use apenas JPEG, PNG ou WebP.');
        return;
      }

      // Validar tamanho (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Arquivo muito grande. Tamanho máximo: 5MB');
        return;
      }

      setFormData(prev => ({
        ...prev,
        imagem_caminhao: file
      }));

      // Resetar remoção de imagem se o usuário selecionar uma nova
      setRemoverImagem(false);

      // Criar preview da imagem com tamanho limitado
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Definir tamanho máximo para a prévia
          const maxWidth = 400;
          const maxHeight = 300;
          
          let { width, height } = img;
          
          // Redimensionar mantendo a proporção
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
          
          // Criar canvas para redimensionar a imagem
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          setImagePreview(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
      
      setError(''); // Limpar erro se arquivo é válido
    } else {
      setFormData(prev => ({
        ...prev,
        imagem_caminhao: null
      }));
      setImagePreview(null);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      imagem_caminhao: null
    }));
    setImagePreview(null);
    setRemoverImagem(true); // Marcar que a imagem existente deve ser removida
    
    // Limpar o input file
    const fileInput = document.getElementById('imagem_caminhao');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Criar FormData para envio de arquivo (se houver nova imagem)
      const submitData = new FormData();
      
      // Adicionar campos de texto
      submitData.append('origem', formData.origem);
      submitData.append('destino', formData.destino);
      submitData.append('descricao', formData.descricao);
      submitData.append('preco', formData.preco);
      submitData.append('data_disponivel', formData.data_disponivel);
      
      if (formData.capacidade_peso) {
        submitData.append('capacidade_peso', formData.capacidade_peso);
      }
      if (formData.capacidade_volume) {
        submitData.append('capacidade_volume', formData.capacidade_volume);
      }
      
      // Adicionar imagem se selecionada (verificar se é um arquivo)
      if (formData.imagem_caminhao) {
        submitData.append('imagem_caminhao', formData.imagem_caminhao);
      } 
      
      // Adicionar informação sobre remoção de imagem
      if (removerImagem) {
        submitData.append('remover_imagem', 'true');
      }

      // Enviar com FormData
      await axios.put(`http://localhost:5000/api/ofertas/${id}`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setSuccess('Oferta atualizada com sucesso!');
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate('/minhas-ofertas');
      }, 2000);

    } catch (error) {
      console.error('Erro detalhado:', error);
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
            <label htmlFor="descricao">Descrição (opcional)</label>
            <textarea
              id="descricao"
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              rows="4"
              placeholder="Descreva detalhes sobre o frete, tipo de carga aceita, condições especiais, etc."
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="imagem_caminhao">Trocar Foto do Caminhão (opcional)</label>
            <div className="image-upload-container">
              {!imagePreview ? (
                <div className="image-upload-area">
                  <input
                    type="file"
                    id="imagem_caminhao"
                    name="imagem_caminhao"
                    onChange={handleImageChange}
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="image-input"
                  />
                  <label htmlFor="imagem_caminhao" className="image-upload-label">
                    <div className="upload-icon">📷</div>
                    <div className="upload-text">
                      <strong>Clique para selecionar uma foto</strong>
                      <span> ou arraste e solte aqui</span>
                    </div>
                    <div className="upload-info">
                      Formatos aceitos: JPEG, PNG, WebP (máx. 5MB)
                    </div>
                  </label>
                </div>
              ) : (
                <div className="image-preview-container">
                  <img src={imagePreview} alt="Preview do caminhão" className="image-preview" />
                  <div className="image-actions">
                    <button type="button" onClick={removeImage} className="remove-image-btn">
                      ❌ Remover imagem
                    </button>
                    <input
                      type="file"
                      id="imagem_caminhao"
                      name="imagem_caminhao"
                      onChange={handleImageChange}
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="image-input"
                    />
                  </div>
                </div>
              )}
            </div>
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