const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔐 Auth Header:', authHeader);
  console.log('🔑 Token extraído:', token?.substring(0, 20) + '...');

  if (!token) {
    console.log('❌ Token não fornecido');
    return res.status(401).json({ message: 'Token de acesso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ Token inválido:', err.message);
      return res.status(403).json({ message: 'Token inválido' });
    }
    
    console.log('✅ Token válido pra usuário:', user.userId);
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;