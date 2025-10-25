const express = require('express');
const cors = require('cors');
// const path = require('path');  // Removido, pois não é usado
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
require('./config/cloudinary');
const userRoutes = require('./routes/users');
const passwordResetRoutes = require('./routes/passwordReset');
const ofertasRoutes = require('./routes/ofertas');
const mensagensRoutes = require('./routes/mensagens');
const db = require('./config/database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'https://frontend-production-e5e3.up.railway.app/',  // Ou "*" para desenvolvimento
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: 'https://frontend-production-e5e3.up.railway.app/',  // Alinhado com Socket.IO
  credentials: true
}));
app.use(express.json());

// Rota de  Teste simples
app.get("/", (req, res) => {
  res.send("API Frete está online!");
});


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
const usuariosOnline = new Map();

io.on('connection', (socket) => {
  console.log('🟢 Novo usuário conectado:', socket.id);

  socket.on('usuario_conectado', (userId) => {
    usuariosOnline.set(userId.toString(), socket.id);  // Padronizado como string
    console.log(`👤 Usuário ${userId} online`);
    io.emit('usuarios_online', Array.from(usuariosOnline.keys()));
  });

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
    
    const destinatarioSocketId = usuariosOnline.get(destinatarioId.toString());  // Padronizado
    if (destinatarioSocketId) {
      console.log('📤 Enviando para destinatário:', destinatarioId);
      io.to(destinatarioSocketId).emit('nova_mensagem', mensagemData);
    } else {
      console.log('⚠️ Destinatário offline:', destinatarioId);
    }
    
    socket.emit('mensagem_confirmada', { status: 'enviada', timestamp: new Date() });
  });

  // ... (restante dos eventos permanece igual, mas aplique toString() se necessário)

  socket.on('disconnect', () => {
    console.log('🔴 Usuário desconectado:', socket.id);
    for (const [userId, socketId] of usuariosOnline.entries()) {
      if (socketId === socket.id) {
        usuariosOnline.delete(userId);
        console.log(`👤 Usuário ${userId} offline`);
        break;
      }
    }
    io.emit('usuarios_online', Array.from(usuariosOnline.keys()));
  });
});

// Correção: Usar server.listen
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});