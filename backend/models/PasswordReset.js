const db = require('../config/database');

class PasswordReset {
  static generateToken() {
    // Gera um código de 4 dígitos
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  static async createToken(email) {
    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Expira em 15 minutos

    // Primeiro, invalidar todos os tokens anteriores para este email
    await db.execute(
      'UPDATE password_reset_tokens SET used = TRUE WHERE email = ? AND used = FALSE',
      [email]
    );

    // Criar novo token
    const [result] = await db.execute(
      'INSERT INTO password_reset_tokens (email, token, expires_at) VALUES (?, ?, ?)',
      [email, token, expiresAt]
    );

    return {
      id: result.insertId,
      token,
      expiresAt
    };
  }

  static async verifyToken(email, token) {
    const [rows] = await db.execute(`
      SELECT id, expires_at, used 
      FROM password_reset_tokens 
      WHERE email = ? AND token = ? AND used = FALSE
      ORDER BY created_at DESC 
      LIMIT 1
    `, [email, token]);

    if (rows.length === 0) {
      return { valid: false, reason: 'Token inválido ou já utilizado' };
    }

    const tokenData = rows[0];
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);

    if (now > expiresAt) {
      return { valid: false, reason: 'Token expirado' };
    }

    return { valid: true, tokenId: tokenData.id };
  }

  static async markTokenAsUsed(tokenId) {
    await db.execute(
      'UPDATE password_reset_tokens SET used = TRUE WHERE id = ?',
      [tokenId]
    );
  }

  static async cleanupExpiredTokens() {
    // Remove tokens expirados (mais de 1 dia)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    await db.execute(
      'DELETE FROM password_reset_tokens WHERE created_at < ?',
      [oneDayAgo]
    );
  }
}

module.exports = PasswordReset;