const express = require('express');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./routes/users');
const passwordResetRoutes = require('./routes/passwordReset');
const ofertasRoutes = require('./routes/ofertas');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;


// Middlewares
app.use(cors());
app.use(express.json());

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

// Rota básica
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from backend with MySQL!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});