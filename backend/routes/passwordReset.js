const express = require('express');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const emailService = require('../services/emailService');
const router = express.Router();

// Solicitar recuperação de senha
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email é obrigatório' });
    }

    // Verificar se o usuário existe
    const user = await User.findByEmail(email);
    if (!user) {
      // Por segurança, não revelar se o email existe ou não
      return res.json({ 
        message: 'Se o email estiver cadastrado, você receberá as instruções para recuperação de senha.' 
      });
    }

    // Gerar token
    const tokenData = await PasswordReset.createToken(email);
    
    // Enviar email
    const emailSent = await emailService.sendPasswordResetEmail(
      email, 
      tokenData.token, 
      user.nome
    );

    if (!emailSent) {
      return res.status(500).json({ 
        message: 'Erro ao enviar email. Tente novamente mais tarde.' 
      });
    }

    res.json({ 
      message: 'Se o email estiver cadastrado, você receberá as instruções para recuperação de senha.'
      //,
      // Em desenvolvimento, você pode retornar o token para testes
      //...(process.env.NODE_ENV === 'development' && { token: tokenData.token })
    });

  } catch (error) {
    console.error('Erro ao solicitar recuperação:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Verificar token
router.post('/verify-token', async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({ message: 'Email e token são obrigatórios' });
    }

    const verification = await PasswordReset.verifyToken(email, token);

    if (!verification.valid) {
      return res.status(400).json({ message: verification.reason });
    }

    res.json({ message: 'Token válido', valid: true });

  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Redefinir senha
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({ 
        message: 'Email, token e nova senha são obrigatórios' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'A nova senha deve ter pelo menos 6 caracteres' 
      });
    }

    // Verificar token
    const verification = await PasswordReset.verifyToken(email, token);

    if (!verification.valid) {
      return res.status(400).json({ message: verification.reason });
    }

    // Atualizar senha
    const passwordUpdated = await User.updatePassword(email, newPassword);

    if (!passwordUpdated) {
      return res.status(500).json({ 
        message: 'Erro ao atualizar senha. Tente novamente.' 
      });
    }

    // Marcar token como usado
    await PasswordReset.markTokenAsUsed(verification.tokenId);

    res.json({ message: 'Senha redefinida com sucesso!' });

  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;