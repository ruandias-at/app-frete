const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const userRoutes = require('./routes/users');
const passwordResetRoutes = require('./routes/passwordReset');
const ofertasRoutes = require('./routes/ofertas');
const mensagensRoutes = require('./routes/mensagens');
const db = require('./config/database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000', // Frontend URL
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;


// Middlewares
app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.json());


// Exemplo de rota simples
app.get("/", (req, res) => {
  res.send("API Frete está online!");
});

// Servir arquivos estáticos (imagens)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Testar conexão com banco
app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT 1 as test');
    res.json({ message: 'Conexão com banco funcionando!', data: rows });
  } catch (error) {
    res.status(500).json({ message: 'Erro na conexão com banco', error: error.message });
  }
});

// Rotas
app.use('/api/users', userRoutes);
app.use('/api/auth', passwordResetRoutes);
app.use('/api/ofertas', ofertasRoutes);
app.use('/api/mensagens', mensagensRoutes);

// Rota básica
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from backend with MySQL!' });
});

// ===== SOCKET.IO - CHAT EM TEMPO REAL =====

// Armazenar usuários online
const usuariosOnline = new Map();

io.on('connection', (socket) => {
  console.log('🟢 Novo usuário conectado:', socket.id);

  // Usuário se conecta ao chat
  socket.on('usuario_conectado', (userId) => {
    usuariosOnline.set(userId, socket.id);
    console.log(`👤 Usuário ${userId} online`);
    
    // Notificar todos sobre usuários online
    io.emit('usuarios_online', Array.from(usuariosOnline.keys()));
  });

  // Enviar mensagem
  socket.on('enviar_mensagem', async (data) => {
    console.log('📨 Mensagem recebida:', data);
    
    const { remetenteId, destinatarioId, mensagem, conversaId, remetenteNome } = data;
    
    const mensagemData = {
      conversaId,
      remetenteId,
      destinatarioId,
      mensagem,
      remetenteNome,
      timestamp: new Date()
    };
    
    // Emitir para o destinatário
    const destinatarioSocketId = usuariosOnline.get(parseInt(destinatarioId));
    if (destinatarioSocketId) {
      console.log('📤 Enviando para destinatário:', destinatarioId);
      io.to(destinatarioSocketId).emit('nova_mensagem', mensagemData);
    } else {
      console.log('⚠️ Destinatário offline:', destinatarioId);
    }
    
    // Confirmar envio para o remetente (mas não adicionar à lista dele)
    socket.emit('mensagem_confirmada', {
      status: 'enviada',
      timestamp: new Date()
    });
  });

  // Usuário está digitando
  socket.on('digitando', (data) => {
    const { destinatarioId, remetenteNome } = data;
    const destinatarioSocketId = usuariosOnline.get(destinatarioId);
    
    if (destinatarioSocketId) {
      io.to(destinatarioSocketId).emit('usuario_digitando', {
        remetenteNome
      });
    }
  });

  // Parar de digitar
  socket.on('parou_digitar', (data) => {
    const { destinatarioId } = data;
    const destinatarioSocketId = usuariosOnline.get(destinatarioId);
    
    if (destinatarioSocketId) {
      io.to(destinatarioSocketId).emit('usuario_parou_digitar');
    }
  });

  // Desconexão
  socket.on('disconnect', () => {
    console.log('🔴 Usuário desconectado:', socket.id);
    
    // Remover usuário da lista de online
    for (const [userId, socketId] of usuariosOnline.entries()) {
      if (socketId === socket.id) {
        usuariosOnline.delete(userId);
        console.log(`👤 Usuário ${userId} offline`);
        break;
      }
    }
    
    // Notificar todos sobre usuários online
    io.emit('usuarios_online', Array.from(usuariosOnline.keys()));
  });
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});