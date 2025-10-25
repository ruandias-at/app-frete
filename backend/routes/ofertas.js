const express = require('express');
const Oferta = require('../models/Oferta');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Middleware para verificar se é fretista
const checkFretista = (req, res, next) => {
  if (req.user && req.user.tipo !== 'fretista') {
    return res.status(403).json({ message: 'Acesso negado. Apenas fretistas podem criar ofertas.' });
  }
  next();
};

// ✅ VERIFICAÇÃO DOS MIDDLEWARES
console.log('🔍 Debug middlewares:', {
  authenticateToken: typeof authenticateToken,
  checkFretista: typeof checkFretista
});

// ✅ ROTA POST SIMPLIFICADA - SEM UPLOAD
router.post('/', authenticateToken, checkFretista, async (req, res) => {
  try {
    console.log('📨 Recebendo criação de oferta...');
    
    const {
      origem,
      destino,
      descricao,
      preco,
      data_disponivel,
      capacidade_peso,
      capacidade_volume
    } = req.body;

    // Validações básicas
    if (!origem || !destino || !preco || !data_disponivel) {
      return res.status(400).json({ 
        message: 'Origem, destino, preço e data são obrigatórios' 
      });
    }

    // Cria a oferta SEM imagem por enquanto
    const ofertaData = {
      usuario_id: req.user.userId,
      origem: origem.trim(),
      destino: destino.trim(),
      descricao: descricao ? descricao.trim() : '',
      preco: parseFloat(preco),
      data_disponivel,
      capacidade_peso: capacidade_peso ? parseFloat(capacidade_peso) : null,
      capacidade_volume: capacidade_volume ? parseFloat(capacidade_volume) : null,
      imagem_caminhao: null,
      imagem_public_id: null
    };

    const ofertaId = await Oferta.create(ofertaData);

    res.status(201).json({
      message: 'Oferta criada com sucesso (sem imagem)',
      ofertaId
    });

  } catch (error) {
    console.error('Erro ao criar oferta:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ✅ ROTA GET pública (mantida igual)
router.get('/', async (req, res) => {
  try {
    const { origem, destino, preco_max, preco_min } = req.query;
    
    const filters = {};
    if (origem) filters.origem = origem;
    if (destino) filters.destino = destino;
    if (preco_max) filters.preco_max = preco_max;
    if (preco_min) filters.preco_min = preco_min;

    const ofertas = await Oferta.findAll(filters);
    res.json({ ofertas });
  } catch (error) {
    console.error('Erro ao buscar ofertas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ✅ ROTA GET por ID
router.get('/:id', async (req, res) => {
  try {
    const oferta = await Oferta.findById(req.params.id);
    
    if (!oferta) {
      return res.status(404).json({ message: 'Oferta não encontrada' });
    }

    res.json({ oferta });
  } catch (error) {
    console.error('Erro ao buscar oferta:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ✅ ROTA PUT SIMPLIFICADA
router.put('/:id', authenticateToken, checkFretista, async (req, res) => {
  try {
    const {
      origem,
      destino,
      descricao,
      preco,
      data_disponivel,
      capacidade_peso,
      capacidade_volume
    } = req.body;

    if (!origem || !destino || !preco || !data_disponivel) {
      return res.status(400).json({ 
        message: 'Origem, destino, preço e data são obrigatórios' 
      });
    }

    const ofertaData = {
      origem: origem.trim(),
      destino: destino.trim(),
      descricao: descricao ? descricao.trim() : '',
      preco: parseFloat(preco),
      data_disponivel,
      capacidade_peso: capacidade_peso ? parseFloat(capacidade_peso) : null,
      capacidade_volume: capacidade_volume ? parseFloat(capacidade_volume) : null
    };

    const updated = await Oferta.update(req.params.id, ofertaData, req.user.userId);

    if (!updated) {
      return res.status(404).json({ 
        message: 'Oferta não encontrada ou você não tem permissão para editá-la' 
      });
    }

    res.json({ message: 'Oferta atualizada com sucesso' });

  } catch (error) {
    console.error('Erro ao atualizar oferta:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ✅ ROTA DELETE
router.delete('/:id', authenticateToken, checkFretista, async (req, res) => {
  try {
    const deleted = await Oferta.delete(req.params.id, req.user.userId);

    if (!deleted) {
      return res.status(404).json({ 
        message: 'Oferta não encontrada ou você não tem permissão para excluí-la' 
      });
    }

    res.json({ message: 'Oferta excluída com sucesso' });

  } catch (error) {
    console.error('Erro ao excluir oferta:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;