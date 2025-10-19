const db = require('../config/database');

class Mensagem {
  // Criar ou buscar conversa entre dois usuários
  static async criarOuBuscarConversa(usuario1Id, usuario2Id, ofertaId = null) {
    // Garantir ordem consistente dos IDs
    const [menorId, maiorId] = [usuario1Id, usuario2Id].sort((a, b) => a - b);

    // Verificar se conversa já existe
    const [conversas] = await db.execute(
      `SELECT id FROM conversas 
       WHERE usuario1_id = ? AND usuario2_id = ? 
       AND (oferta_id = ? OR (oferta_id IS NULL AND ? IS NULL))`,
      [menorId, maiorId, ofertaId, ofertaId]
    );

    if (conversas.length > 0) {
      return conversas[0].id;
    }

    // Criar nova conversa
    const [result] = await db.execute(
      'INSERT INTO conversas (usuario1_id, usuario2_id, oferta_id) VALUES (?, ?, ?)',
      [menorId, maiorId, ofertaId]
    );

    return result.insertId;
  }

  // Enviar mensagem
  static async enviar(conversaId, remetenteId, destinatarioId, conteudo) {
    const [result] = await db.execute(
      'INSERT INTO mensagens (conversa_id, remetente_id, destinatario_id, conteudo) VALUES (?, ?, ?, ?)',
      [conversaId, remetenteId, destinatarioId, conteudo]
    );

    // Atualizar timestamp da conversa
    await db.execute(
      'UPDATE conversas SET atualizado_em = CURRENT_TIMESTAMP WHERE id = ?',
      [conversaId]
    );

    return result.insertId;
  }

  // Buscar mensagens de uma conversa
  static async buscarPorConversa(conversaId, limit = 50, offset = 0) {
    const [mensagens] = await db.execute(
      `SELECT m.*, 
              r.nome as remetente_nome, 
              d.nome as destinatario_nome
       FROM mensagens m
       JOIN usuarios r ON m.remetente_id = r.id
       JOIN usuarios d ON m.destinatario_id = d.id
       WHERE m.conversa_id = ?
       ORDER BY m.criado_em DESC
       LIMIT ? OFFSET ?`,
      [conversaId, limit, offset]
    );

    return mensagens.reverse(); // Inverter para mostrar mais antigas primeiro
  }

  // Buscar todas as conversas de um usuário
  static async buscarConversasUsuario(usuarioId) {
    const [conversas] = await db.execute(
      `SELECT c.*,
              CASE 
                WHEN c.usuario1_id = ? THEN u2.id
                ELSE u1.id
              END as outro_usuario_id,
              CASE 
                WHEN c.usuario1_id = ? THEN u2.nome
                ELSE u1.nome
              END as outro_usuario_nome,
              CASE 
                WHEN c.usuario1_id = ? THEN u2.email
                ELSE u1.email
              END as outro_usuario_email,
              CASE 
                WHEN c.usuario1_id = ? THEN u2.tipo
                ELSE u1.tipo
              END as outro_usuario_tipo,
              o.origem,
              o.destino,
              o.preco,
              (SELECT COUNT(*) FROM mensagens 
               WHERE conversa_id = c.id 
               AND destinatario_id = ? 
               AND lida = FALSE) as mensagens_nao_lidas,
              (SELECT conteudo FROM mensagens 
               WHERE conversa_id = c.id 
               ORDER BY criado_em DESC LIMIT 1) as ultima_mensagem,
              (SELECT criado_em FROM mensagens 
               WHERE conversa_id = c.id 
               ORDER BY criado_em DESC LIMIT 1) as ultima_mensagem_em
       FROM conversas c
       JOIN usuarios u1 ON c.usuario1_id = u1.id
       JOIN usuarios u2 ON c.usuario2_id = u2.id
       LEFT JOIN ofertas o ON c.oferta_id = o.id
       WHERE c.usuario1_id = ? OR c.usuario2_id = ?
       ORDER BY c.atualizado_em DESC`,
      [usuarioId, usuarioId, usuarioId, usuarioId, usuarioId, usuarioId, usuarioId]
    );

    return conversas;
  }

  // Marcar mensagens como lidas
  static async marcarComoLida(conversaId, usuarioId) {
    await db.execute(
      'UPDATE mensagens SET lida = TRUE WHERE conversa_id = ? AND destinatario_id = ? AND lida = FALSE',
      [conversaId, usuarioId]
    );
  }

  // Contar mensagens não lidas
  static async contarNaoLidas(usuarioId) {
    const [result] = await db.execute(
      'SELECT COUNT(*) as total FROM mensagens WHERE destinatario_id = ? AND lida = FALSE',
      [usuarioId]
    );

    return result[0].total;
  }

  // Buscar conversa específica
  static async buscarConversa(conversaId, usuarioId) {
    const [conversas] = await db.execute(
      `SELECT c.*,
              CASE 
                WHEN c.usuario1_id = ? THEN u2.id
                ELSE u1.id
              END as outro_usuario_id,
              CASE 
                WHEN c.usuario1_id = ? THEN u2.nome
                ELSE u1.nome
              END as outro_usuario_nome,
              o.origem,
              o.destino,
              o.preco
       FROM conversas c
       JOIN usuarios u1 ON c.usuario1_id = u1.id
       JOIN usuarios u2 ON c.usuario2_id = u2.id
       LEFT JOIN ofertas o ON c.oferta_id = o.id
       WHERE c.id = ? AND (c.usuario1_id = ? OR c.usuario2_id = ?)`,
      [usuarioId, usuarioId, conversaId, usuarioId, usuarioId]
    );

    return conversas[0];
  }
}

module.exports = Mensagem;