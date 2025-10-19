const express = require('express');
const Mensagem = require('../models/Mensagem');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

// LOG PARA DEBUG
console.log('✅ Rotas de mensagens carregadas');

router.get('/test', (req, res) => {
  res.json({ message: 'Rota de mensagens funcionando!' });
});

// Todas as rotas precisam de autenticação
router.use(authenticateToken);

// Iniciar ou buscar conversa
router.post('/conversa', async (req, res) => {
  console.log('📨 POST /conversa recebido');
  console.log('Body:', req.body);
  console.log('User:', req.user);
  
  try {
    const { destinatarioId, ofertaId } = req.body;
    const remetenteId = req.user.userId;

    if (!destinatarioId) {
      return res.status(400).json({ message: 'ID do destinatário é obrigatório' });
    }

    if (parseInt(destinatarioId) === parseInt(remetenteId)) {
      return res.status(400).json({ message: 'Não é possível iniciar conversa consigo mesmo' });
    }

    const conversaId = await Mensagem.criarOuBuscarConversa(
      remetenteId,
      destinatarioId,
      ofertaId || null
    );

    console.log('✅ Conversa criada/encontrada:', conversaId);
    res.json({ conversaId });
  } catch (error) {
    console.error('❌ Erro ao criar/buscar conversa:', error);
    res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
  }
});


// Enviar mensagem
router.post('/enviar', async (req, res) => {
  try {
    const { conversaId, destinatarioId, conteudo } = req.body;
    const remetenteId = req.user.userId;

    if (!conversaId || !destinatarioId || !conteudo) {
      return res.status(400).json({ 
        message: 'Conversa, destinatário e conteúdo são obrigatórios' 
      });
    }

    if (!conteudo.trim()) {
      return res.status(400).json({ message: 'Mensagem não pode estar vazia' });
    }

    const mensagemId = await Mensagem.enviar(
      conversaId,
      remetenteId,
      destinatarioId,
      conteudo.trim()
    );

    res.status(201).json({ 
      message: 'Mensagem enviada com sucesso',
      mensagemId 
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar mensagens de uma conversa
router.get('/conversa/:conversaId', async (req, res) => {
  try {
    const { conversaId } = req.params;
    const usuarioId = req.user.userId;
    const { limit = 50, offset = 0 } = req.query;

    // Verificar se usuário faz parte da conversa
    const conversa = await Mensagem.buscarConversa(conversaId, usuarioId);
    
    if (!conversa) {
      return res.status(403).json({ 
        message: 'Você não tem acesso a esta conversa' 
      });
    }

    const mensagens = await Mensagem.buscarPorConversa(
      conversaId,
      parseInt(limit),
      parseInt(offset)
    );

    // Marcar mensagens como lidas
    await Mensagem.marcarComoLida(conversaId, usuarioId);

    res.json({ 
      mensagens,
      conversa 
    });
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar todas as conversas do usuário
router.get('/conversas', async (req, res) => {
  try {
    const usuarioId = req.user.userId;
    const conversas = await Mensagem.buscarConversasUsuario(usuarioId);

    res.json({ conversas });
  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Marcar mensagens como lidas
router.patch('/conversa/:conversaId/marcar-lida', async (req, res) => {
  try {
    const { conversaId } = req.params;
    const usuarioId = req.user.userId;

    await Mensagem.marcarComoLida(conversaId, usuarioId);

    res.json({ message: 'Mensagens marcadas como lidas' });
  } catch (error) {
    console.error('Erro ao marcar mensagens:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Contar mensagens não lidas
router.get('/nao-lidas', async (req, res) => {
  try {
    const usuarioId = req.user.userId;
    const total = await Mensagem.contarNaoLidas(usuarioId);

    res.json({ total });
  } catch (error) {
    console.error('Erro ao contar mensagens:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;