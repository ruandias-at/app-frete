import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import './Chat.css';

const Chat = () => {

  const { conversaId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    conversas,
    conversaAtual,
    mensagens,
    mensagensNaoLidas,
    usuariosOnline,
    usuarioDigitando,
    buscarConversas,
    buscarMensagens,
    enviarMensagem,
    notificarDigitando,
    notificarParouDigitar,
    setConversaAtual
  } = useChat();

  const [mensagemTexto, setMensagemTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const mensagensEndRef = useRef(null);
  const digitandoTimeoutRef = useRef(null);
  const intervaloRef = useRef(null); // Ref para o intervalo

  useEffect(() => {
      // Adiciona classe ao body quando o componente monta
      document.body.classList.add('no-scroll');
      
      // Remove a classe quando o componente desmonta
      return () => {
        document.body.classList.remove('no-scroll');
      };
    }, []);

  // Carregar conversa ao montar ou quando conversaId muda
  useEffect(() => {
    if (conversaId) {
      buscarMensagens(parseInt(conversaId));
    } else {
      setConversaAtual(null);
    }
  }, [conversaId, buscarMensagens, setConversaAtual]);

  // ATUALIZAÇÃO: Polling para atualizar mensagens a cada 1 segundo
  useEffect(() => {
    const atualizarMensagensPeriodicamente = () => {
      if (conversaAtual && conversaAtual.id) {
        buscarMensagens(conversaAtual.id);
      }
    };

    // Iniciar o polling
    if (conversaAtual) {
      intervaloRef.current = setInterval(atualizarMensagensPeriodicamente, 1000);
    }

    // Limpar intervalo quando o componente desmontar ou conversa mudar
    return () => {
      if (intervaloRef.current) {
        clearInterval(intervaloRef.current);
      }
    };
  }, [conversaAtual, buscarMensagens]);


  // Scroll automático para última mensagem
  useEffect(() => {
    mensagensEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  // Buscar conversas ao montar
  useEffect(() => {
    buscarConversas();
  }, [buscarConversas]);

  const handleEnviarMensagem = async (e) => {
    e.preventDefault();
    
    if (!mensagemTexto.trim() || !conversaAtual) return;

    setEnviando(true);
    
    try {
      await enviarMensagem(
        conversaAtual.id,
        conversaAtual.outro_usuario_id,
        mensagemTexto
      );
      
      setMensagemTexto('');
      notificarParouDigitar(conversaAtual.outro_usuario_id);
      
      // Recarregar mensagens após enviar
      setTimeout(() => {
        buscarMensagens(conversaAtual.id);
      }, 500);
      
    } catch (error) {
      console.error('Erro ao enviar:', error);
      alert('Erro ao enviar mensagem');
    } finally {
      setEnviando(false);
    }
  };

  const handleDigitando = (e) => {
    setMensagemTexto(e.target.value);

    if (conversaAtual) {
      notificarDigitando(conversaAtual.outro_usuario_id);

      // Limpar timeout anterior
      if (digitandoTimeoutRef.current) {
        clearTimeout(digitandoTimeoutRef.current);
      }

      // Notificar que parou de digitar após 2 segundos
      digitandoTimeoutRef.current = setTimeout(() => {
        notificarParouDigitar(conversaAtual.outro_usuario_id);
      }, 2000);
    }
  };

  const formatarHora = (timestamp) => {
    const data = new Date(timestamp);
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatarDataCompleta = (timestamp) => {
    const data = new Date(timestamp);
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);

    if (data.toDateString() === hoje.toDateString()) {
      return 'Hoje';
    } else if (data.toDateString() === ontem.toDateString()) {
      return 'Ontem';
    } else {
      return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  };

  const usuarioEstaOnline = (userId) => {
    return usuariosOnline.includes(userId);
  };

  return (
    <div className="chat-container">
      {/* Sidebar com lista de conversas */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h2>Mensagens</h2>
          {mensagensNaoLidas > 0 && (
            <span className="badge-nao-lidas">{mensagensNaoLidas}</span>
          )}
        </div>

        <div className="conversas-lista">
          {conversas.length === 0 ? (
            <div className="sem-conversas">
              <p>Nenhuma conversa ainda</p>
              <small>Inicie uma conversa entrando em contato com um fretista</small>
            </div>
          ) : (
            conversas.map((conversa) => (
              <div
                key={conversa.id}
                className={`conversa-item ${conversaAtual?.id === conversa.id ? 'ativa' : ''}`}
                onClick={() => navigate(`/chat/${conversa.id}`)}
              >
                <div className="conversa-avatar">
                  {conversa.outro_usuario_nome.charAt(0).toUpperCase()}
                  {usuarioEstaOnline(conversa.outro_usuario_id) && (
                    <span className="status-online"></span>
                  )}
                </div>
                <div className="conversa-info">
                  <div className="conversa-header-item">
                    <h4>{conversa.outro_usuario_nome}</h4>
                    {conversa.ultima_mensagem_em && (
                      <span className="conversa-hora">
                        {formatarHora(conversa.ultima_mensagem_em)}
                      </span>
                    )}
                  </div>
                  <div className="conversa-preview">
                    {conversa.origem && conversa.destino && (
                      <span className="conversa-oferta">
                        📍 {conversa.origem} → {conversa.destino}
                      </span>
                    )}
                    {conversa.ultima_mensagem && (
                      <p className="ultima-mensagem">
                        {conversa.ultima_mensagem.substring(0, 40)}
                        {conversa.ultima_mensagem.length > 40 ? '...' : ''}
                      </p>
                    )}
                  </div>
                </div>
                {conversa.mensagens_nao_lidas > 0 && (
                  <span className="badge-conversa">{conversa.mensagens_nao_lidas}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Área de mensagens */}
      <div className="chat-main">
        {conversaAtual ? (
          <>
            {/* Header do chat */}
            <div className="chat-header">
              <div className="chat-usuario-info">
                <div className="chat-avatar">
                  {conversaAtual.outro_usuario_nome.charAt(0).toUpperCase()}
                  {usuarioEstaOnline(conversaAtual.outro_usuario_id) && (
                    <span className="status-online"></span>
                  )}
                </div>
                <div>
                  <h3>{conversaAtual.outro_usuario_nome}</h3>
                  {conversaAtual.origem && conversaAtual.destino && (
                    <p className="chat-oferta-info">
                      {conversaAtual.origem} → {conversaAtual.destino}
                    </p>
                  )}
                  {usuarioEstaOnline(conversaAtual.outro_usuario_id) && (
                    <span className="status-text">Online</span>
                  )}
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <div className="chat-mensagens">
              {mensagens.length === 0 ? (
                <div className="chat-vazio">
                  <p>Nenhuma mensagem ainda</p>
                  <small>Envie a primeira mensagem para iniciar a conversa</small>
                </div>
              ) : (
                mensagens.map((msg, index) => {
                  const msgData = new Date(msg.criado_em);
                  const msgAnterior = index > 0 ? mensagens[index - 1] : null;
                  const dataAnterior = msgAnterior ? new Date(msgAnterior.criado_em) : null;
                  
                  const mostrarData = !dataAnterior || 
                    msgData.toDateString() !== dataAnterior.toDateString();

                  // CORREÇÃO: Comparar o ID do remetente com o ID do usuário logado
                  const ehMinha = parseInt(msg.remetente_id) === parseInt(user.userId || user.id);
                  
                  console.log('Mensagem:', {
                    conteudo: msg.conteudo,
                    remetente_id: msg.remetente_id,
                    user_id: user.userId || user.id,
                    ehMinha: ehMinha
                  });

                  return (
                    <div key={msg.id || index}>
                      {mostrarData && (
                        <div className="mensagem-data-divisor">
                          {formatarDataCompleta(msg.criado_em)}
                        </div>
                      )}
                      <div className={`mensagem ${ehMinha ? 'minha' : 'outra'}`}>
                        <div className="mensagem-conteudo">
                          <p>{msg.conteudo}</p>
                          <span className="mensagem-hora">
                            {formatarHora(msg.criado_em)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {usuarioDigitando && (
                <div className="digitando-indicador">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
              <div ref={mensagensEndRef} />
            </div>

            {/* Input de mensagem */}
            <form onSubmit={handleEnviarMensagem} className="chat-input-area">
              <input
                type="text"
                value={mensagemTexto}
                onChange={handleDigitando}
                placeholder="Digite sua mensagem..."
                disabled={enviando}
                className="chat-input"
              />
              <button 
                type="submit" 
                disabled={!mensagemTexto.trim() || enviando}
                className="chat-send-btn"
              >
                {enviando ? '⏳' : '📤'}
              </button>
            </form>
          </>
        ) : (
          <div className="chat-placeholder">
            <div className="placeholder-content">
              <div className="placeholder-icon">💬</div>
              <h3>Selecione uma conversa</h3>
              <p>Escolha uma conversa da lista para começar a enviar mensagens</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;