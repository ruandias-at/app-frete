import express from 'express';
import cors from 'cors';
import path from 'path';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
dotenv.config();

import './config/cloudinary.js';
import userRoutes from './routes/users.js';
import passwordResetRoutes from './routes/passwordReset.js';
import ofertasRoutes from './routes/ofertas.js';
import mensagensRoutes from './routes/mensagens.js';
import db from './config/database.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'https://frontend-production-e5e3.up.railway.app',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;

// ===== Middlewares =====
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// ===== Rotas API =====
app.use('/api/users', userRoutes);
app.use('/api/auth', passwordResetRoutes);
app.use('/api/ofertas', ofertasRoutes);
app.use('/api/mensagens', mensagensRoutes);

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from backend with MySQL!' });
});

app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT 1 as test');
    res.json({ message: 'Conexão com banco funcionando!', data: rows });
  } catch (error) {
    res.status(500).json({ message: 'Erro na conexão com banco', error: error.message });
  }
});

// ===== Socket.io =====
const usuariosOnline = new Map();

io.on('connection', (socket) => {
  console.log('🟢 Novo usuário conectado:', socket.id);

  socket.on('usuario_conectado', (userId) => {
    usuariosOnline.set(userId, socket.id);
    io.emit('usuarios_online', Array.from(usuariosOnline.keys()));
  });

  socket.on('enviar_mensagem', async (data) => {
    const { remetenteId, destinatarioId, mensagem, conversaId, remetenteNome } = data;
    const mensagemData = { conversaId, remetenteId, destinatarioId, mensagem, remetenteNome, timestamp: new Date() };
    
    const destinatarioSocketId = usuariosOnline.get(parseInt(destinatarioId));
    if (destinatarioSocketId) {
      io.to(destinatarioSocketId).emit('nova_mensagem', mensagemData);
    }
    socket.emit('mensagem_confirmada', { status: 'enviada', timestamp: new Date() });
  });

  socket.on('digitando', ({ destinatarioId, remetenteNome }) => {
    const destinatarioSocketId = usuariosOnline.get(destinatarioId);
    if (destinatarioSocketId) io.to(destinatarioSocketId).emit('usuario_digitando', { remetenteNome });
  });

  socket.on('parou_digitar', ({ destinatarioId }) => {
    const destinatarioSocketId = usuariosOnline.get(destinatarioId);
    if (destinatarioSocketId) io.to(destinatarioSocketId).emit('usuario_parou_digitar');
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of usuariosOnline.entries()) {
      if (socketId === socket.id) {
        usuariosOnline.delete(userId);
        break;
      }
    }
    io.emit('usuarios_online', Array.from(usuariosOnline.keys()));
  });
});

// ===== Servir React build =====
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'client/build')));

// Catch-all para rotas do React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// ===== Iniciar servidor =====
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
