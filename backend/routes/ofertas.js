const express = require('express');
const Oferta = require('../models/Oferta');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Middleware para verificar se é fretista
const checkFretista = (req, res, next) => {
  if (req.user.tipo !== 'fretista') {
    return res.status(403).json({ message: 'Acesso negado. Apenas fretistas podem criar ofertas.' });
  }
  next();
};

// ✅ MIDDLEWARE DE UPLOAD DIRETO NO ARQUIVO (solução rápida)
const uploadWithErrorHandling = (req, res, next) => {
  // Se não há arquivo, apenas continua
  if (!req.files || !req.files.imagem_caminhao) {
    return next();
  }

  const file = req.files.imagem_caminhao;
  
  // Verificações básicas
  if (!file.mimetype.startsWith('image/')) {
    return res.status(400).json({ error: 'Apenas imagens são permitidas' });
  }

  if (file.size > 5 * 1024 * 1024) {
    return res.status(400).json({ error: 'Arquivo muito grande. Máximo 5MB.' });
  }

  // Simula upload bem-sucedido (você pode adicionar Cloudinary depois)
  req.file = {
    path: `/uploads/temp-${Date.now()}-${file.name}`,
    filename: `temp-${Date.now()}-${file.name}`
  };
  
  next();
};

// Criar nova oferta (apenas fretistas)
router.post('/', authenticateToken, checkFretista, uploadWithErrorHandling, async (req, res) => {
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

    // 🔸 Validações básicas
    if (!origem || !destino || !preco || !data_disponivel) {
      return res.status(400).json({ 
        message: 'Origem, destino, preço e data são obrigatórios' 
      });
    }

    // 🔸 Validar preço
    if (isNaN(preco) || preco <= 0) {
      return res.status(400).json({ 
        message: 'Preço deve ser um número válido maior que zero' 
      });
    }

    // 🔸 Validar data (não pode ser no passado)
    const dataDisponivel = new Date(data_disponivel);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (dataDisponivel < hoje) {
      return res.status(400).json({ 
        message: 'Data disponível não pode ser no passado' 
      });
    }

    // Cria a oferta
    const ofertaData = {
      usuario_id: req.user.userId,
      origem: origem.trim(),
      destino: destino.trim(),
      descricao: descricao ? descricao.trim() : '',
      preco: parseFloat(preco),
      data_disponivel,
      capacidade_peso: capacidade_peso ? parseFloat(capacidade_peso) : null,
      capacidade_volume: capacidade_volume ? parseFloat(capacidade_volume) : null,
      imagem_caminhao: req.file ? req.file.path : null,
      imagem_public_id: req.file ? req.file.filename : null
    };

    // 🔸 Inserir no banco
    const ofertaId = await Oferta.create(ofertaData);

    res.status(201).json({
      message: 'Oferta criada com sucesso',
      ofertaId,
      imagem_url: req.file ? req.file.path : null,
    });

  } catch (error) {
    console.error('Erro ao criar oferta:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Listar ofertas do fretista logado
router.get('/minhas', authenticateToken, checkFretista, async (req, res) => {
  try {
    const ofertas = await Oferta.findByUserId(req.user.userId);
    res.json({ ofertas });
  } catch (error) {
    console.error('Erro ao buscar ofertas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Listar todas as ofertas públicas (ROTA PÚBLICA - SEM AUTENTICAÇÃO)
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

// Buscar oferta específica (ROTA PÚBLICA)
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

// Atualizar oferta (apenas o próprio fretista) - SEM UPLOAD POR ENQUANTO
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

    // Validações básicas
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

    res.json({ 
      message: 'Oferta atualizada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar oferta:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar status da oferta
router.patch('/:id/status', authenticateToken, checkFretista, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['aberto', 'em_andamento', 'concluido'].includes(status)) {
      return res.status(400).json({ 
        message: 'Status inválido. Use: aberto, em_andamento ou concluido' 
      });
    }

    const updated = await Oferta.updateStatus(req.params.id, status, req.user.userId);

    if (!updated) {
      return res.status(404).json({ 
        message: 'Oferta não encontrada ou você não tem permissão para editá-la' 
      });
    }

    res.json({ message: 'Status atualizado com sucesso' });

  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Excluir oferta
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

// Estatísticas das ofertas do fretista
router.get('/stats/resumo', authenticateToken, checkFretista, async (req, res) => {
  try {
    const stats = await Oferta.getStats(req.user.userId);
    res.json({ stats });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;