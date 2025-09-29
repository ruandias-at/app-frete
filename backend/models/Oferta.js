const db = require('../config/database');
const fs = require('fs');
const path = require('path');

class Oferta {
  static async create(ofertaData) {
    const { 
      usuario_id, 
      origem, 
      destino, 
      descricao, 
      preco, 
      data_disponivel, 
      capacidade_peso, 
      capacidade_volume,
      imagem_caminhao
    } = ofertaData;

    const [result] = await db.execute(`
      INSERT INTO ofertas (
        usuario_id, origem, destino, descricao, preco, 
        data_disponivel, capacidade_peso, capacidade_volume, imagem_caminhao, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'aberto')
    `, [
      usuario_id, origem, destino, descricao, preco,
      data_disponivel, capacidade_peso, capacidade_volume, imagem_caminhao
    ]);

    return result.insertId;
  }

  static async findByUserId(userId) {
    const [rows] = await db.execute(`
      SELECT o.*, u.nome as fretista_nome
      FROM ofertas o
      JOIN usuarios u ON o.usuario_id = u.id
      WHERE o.usuario_id = ?
      ORDER BY o.criado_em DESC
    `, [userId]);

    return rows;
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT o.*, u.nome as fretista_nome, u.email as fretista_email,
             f.veiculo, f.area_atuacao
      FROM ofertas o
      JOIN usuarios u ON o.usuario_id = u.id
      LEFT JOIN fretistas f ON u.id = f.usuario_id
      WHERE o.status = 'aberto'
    `;

    const params = [];

    // Filtros opcionais
    if (filters.origem) {
      query += ` AND o.origem LIKE ?`;
      params.push(`%${filters.origem}%`);
    }

    if (filters.destino) {
      query += ` AND o.destino LIKE ?`;
      params.push(`%${filters.destino}%`);
    }

    if (filters.preco_max) {
      query += ` AND o.preco <= ?`;
      params.push(filters.preco_max);
    }

    query += ` ORDER BY o.criado_em DESC`;

    const [rows] = await db.execute(query, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.execute(`
      SELECT o.*, u.nome as fretista_nome, u.email as fretista_email,
             f.veiculo, f.area_atuacao
      FROM ofertas o
      JOIN usuarios u ON o.usuario_id = u.id
      LEFT JOIN fretistas f ON u.id = f.usuario_id
      WHERE o.id = ?
    `, [id]);

    return rows[0];
  }

  static async updateStatus(id, status, userId) {
    const [result] = await db.execute(
      'UPDATE ofertas SET status = ? WHERE id = ? AND usuario_id = ?',
      [status, id, userId]
    );

    return result.affectedRows > 0;
  }

  static async update(id, ofertaData, userId) {
    const { 
      origem, 
      destino, 
      descricao, 
      preco, 
      data_disponivel, 
      capacidade_peso, 
      capacidade_volume ,
      imagem_caminhao
    } = ofertaData;

    const [result] = await db.execute(`
      UPDATE ofertas 
      SET origem = ?, destino = ?, descricao = ?, preco = ?,
          data_disponivel = ?, capacidade_peso = ?, capacidade_volume = ?, imagem_caminhao = ?
      WHERE id = ? AND usuario_id = ?
    `, [
      origem, destino, descricao, preco,
      data_disponivel, capacidade_peso, capacidade_volume,
      imagem_caminhao, id, userId
    ]);

    return result.affectedRows > 0;
  }


    static async delete(id, userId) {
      // Primeiro buscar a oferta para pegar o nome da imagem
      const [oferta] = await db.execute(
        'SELECT imagem_caminhao FROM ofertas WHERE id = ? AND usuario_id = ?',
        [id, userId]
      );

      const [result] = await db.execute(
        'DELETE FROM ofertas WHERE id = ? AND usuario_id = ?',
        [id, userId]
      );

      const imagemCaminhao = oferta[0]?.imagem_caminhao || null;

      // Se a imagem existir, deletar o arquivo do sistema de arquivos
      if (imagemCaminhao) {
        const imagePath = path.join(__dirname, '..', '..', 'uploads', imagemCaminhao);
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error(`Erro ao deletar a imagem: ${imagePath}`, err);
          }
        });
      }

  // Retornar o status da exclusão
  return {
    deleted: result.affectedRows > 0,
    imagem: imagemCaminhao
  };
}

  static async getStats(userId) {
    const [rows] = await db.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'aberto' THEN 1 END) as abertos,
        COUNT(CASE WHEN status = 'em_andamento' THEN 1 END) as em_andamento,
        COUNT(CASE WHEN status = 'concluido' THEN 1 END) as concluidos
      FROM ofertas 
      WHERE usuario_id = ?
    `, [userId]);

    return rows[0];
  }
}

module.exports = Oferta;