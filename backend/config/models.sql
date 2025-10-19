-- Criar o banco de dados
CREATE DATABASE IF NOT EXISTS frete_db;
USE frete_db;

-- ========================================
-- TABELA DE USUÁRIOS
-- ========================================
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  tipo ENUM('cliente','fretista') NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Índices para performance
  INDEX idx_email (email),
  INDEX idx_tipo (tipo),
  INDEX idx_criado_em (criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- TABELA DE FRETISTAS (dados adicionais)
-- ========================================
CREATE TABLE fretistas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  veiculo VARCHAR(100),
  placa VARCHAR(10),
  area_atuacao VARCHAR(255),
  preco_medio DECIMAL(10,2),
  telefone VARCHAR(20),
  documento_veiculo VARCHAR(100), -- RENAVAM, etc
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Chave estrangeira
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  
  -- Índices
  INDEX idx_usuario_id (usuario_id),
  INDEX idx_area_atuacao (area_atuacao),
  INDEX idx_placa (placa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- TABELA DE OFERTAS DE FRETE
-- ========================================
CREATE TABLE ofertas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  origem VARCHAR(255) NOT NULL,
  destino VARCHAR(255) NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2) NOT NULL,
  data_disponivel DATE NOT NULL,
  capacidade_peso DECIMAL(8,2), -- em kg
  capacidade_volume DECIMAL(8,2), -- em m³
  status ENUM('aberto','em_andamento','concluido','cancelado') DEFAULT 'aberto',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Chave estrangeira
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  
  -- Índices para buscas
  INDEX idx_usuario_id (usuario_id),
  INDEX idx_origem (origem),
  INDEX idx_destino (destino),
  INDEX idx_status (status),
  INDEX idx_data_disponivel (data_disponivel),
  INDEX idx_preco (preco),
  INDEX idx_criado_em (criado_em),
  
  -- Índice composto para filtros comuns
  INDEX idx_status_data (status, data_disponivel),
  INDEX idx_origem_destino (origem(50), destino(50))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- TABELA DE TOKENS DE RECUPERAÇÃO DE SENHA
-- ========================================
CREATE TABLE password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  token VARCHAR(4) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Índices
  INDEX idx_email_token (email, token),
  INDEX idx_expires (expires_at),
  INDEX idx_used (used),
  
  -- Limpeza automática de tokens antigos
  INDEX idx_cleanup (created_at, used)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Atualização para imagem do caminhão
ALTER TABLE ofertas 
ADD COLUMN imagem_caminhao VARCHAR(255) AFTER capacidade_volume;

-- Tabela de conversas
CREATE TABLE IF NOT EXISTS conversas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario1_id INT NOT NULL,
  usuario2_id INT NOT NULL,
  oferta_id INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario1_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario2_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (oferta_id) REFERENCES ofertas(id) ON DELETE SET NULL,
  UNIQUE KEY uk_conversa (usuario1_id, usuario2_id, oferta_id),
  INDEX idx_usuario1 (usuario1_id),
  INDEX idx_usuario2 (usuario2_id),
  INDEX idx_atualizado (atualizado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS mensagens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversa_id INT NOT NULL,
  remetente_id INT NOT NULL,
  destinatario_id INT NOT NULL,
  conteudo TEXT NOT NULL,
  lida BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversa_id) REFERENCES conversas(id) ON DELETE CASCADE,
  FOREIGN KEY (remetente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (destinatario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_conversa (conversa_id),
  INDEX idx_remetente (remetente_id),
  INDEX idx_destinatario (destinatario_id),
  INDEX idx_lida (lida),
  INDEX idx_criado (criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;