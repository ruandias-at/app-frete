const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Registro de usuário
router.post('/register', async (req, res) => {
  try {
    const { nome, email, senha, tipo, placa } = req.body;

    // Validações básicas
    if (!nome || !email || !senha || !tipo) {
      return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos' });
    }

    // Validar placa se for fretista
    if (tipo === 'fretista' && !placa) {
      return res.status(400).json({ message: 'Placa é obrigatória para fretistas' });
    }

    // Verificar se usuário já existe
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    // Criar usuário
    const userId = await User.create({ nome, email, senha, tipo, placa });

    // Gerar token JWT para login automático
    const token = jwt.sign(
      { userId, email, tipo },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ 
      message: 'Usuário criado com sucesso',
      token,
      user: {
        id: userId,
        nome,
        email,
        tipo
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    console.log('Login attempt:', { email, senha: '***' });

    // Buscar usuário
    const user = await User.findByEmail(email);
    console.log('User found:', user ? { id: user.id, email: user.email, tipo: user.tipo } : 'No user found');
    
    if (!user) {
      return res.status(401).json({ message: 'Email ou senha incorretos' });
    }

    // Verificar senha
    console.log('Checking password...');
    const isValidPassword = await User.verifyPassword(senha, user.senha_hash);
    console.log('Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Email ou senha incorretos' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, tipo: user.tipo },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Login successful for user:', user.email);

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo: user.tipo
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;