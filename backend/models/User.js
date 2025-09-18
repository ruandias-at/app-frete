const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { nome, email, senha, tipo, placa } = userData;
    const senha_hash = await bcrypt.hash(senha, 10);
    
    // Iniciar transação
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Inserir usuário
      const [userResult] = await connection.execute(
        'INSERT INTO usuarios (nome, email, senha_hash, tipo) VALUES (?, ?, ?, ?)',
        [nome, email, senha_hash, tipo]
      );
      
      const userId = userResult.insertId;
      
      // Se for fretista e tiver placa, inserir na tabela fretistas
      if (tipo === 'fretista' && placa) {
        await connection.execute(
          'INSERT INTO fretistas (usuario_id, veiculo) VALUES (?, ?)',
          [userId, placa]
        );
      }
      
      await connection.commit();
      return userId;
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async findByEmail(email) {
    const [rows] = await db.execute(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await db.execute(
      'SELECT id, nome, email, tipo, criado_em FROM usuarios WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updatePassword(email, newPassword) {
    const senha_hash = await bcrypt.hash(newPassword, 10);
    
    const [result] = await db.execute(
      'UPDATE usuarios SET senha_hash = ? WHERE email = ?',
      [senha_hash, email]
    );
    
    return result.affectedRows > 0;
  }
}

module.exports = User;  