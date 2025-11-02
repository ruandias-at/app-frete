import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import io from 'socket.io-client';
import axios from 'axios';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat deve ser usado dentro de ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [conversas, setConversas] = useState([]);
  const [conversaAtual, setConversaAtual] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState(0);
  const [usuariosOnline, setUsuariosOnline] = useState([]);
  const [usuarioDigitando, setUsuarioDigitando] = useState(false);

  
// Buscar conversas do usuário
  const buscarConversas = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await axios.get('http://localhost:5000/api/mensagens/conversas');
      setConversas(response.data.conversas);
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
    }
  }, [user]);

  // Buscar mensagens de uma conversa
  const buscarMensagens = useCallback(async (conversaId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/mensagens/conversa/${conversaId}`);
      setMensagens(response.data.mensagens);
      setConversaAtual(response.data.conversa);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    }
  }, []);



  // Enviar mensagem
  const enviarMensagem = async (conversaId, destinatarioId, conteudo) => {
    try {
      // Enviar via HTTP primeiro
      await axios.post('http://localhost:5000/api/mensagens/enviar', {
        conversaId,
        destinatarioId,
        conteudo
      });

      // Enviar via Socket.IO para tempo real
      if (socket) {
        socket.emit('enviar_mensagem', {
          conversaId,
          remetenteId: user.userId || user.id,
          destinatarioId,
          mensagem: conteudo,
          remetenteNome: user.nome
        });
      }

      // Atualizar conversas
      buscarConversas();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  };

    // Iniciar nova conversa
  const iniciarConversa = async (destinatarioId, ofertaId = null) => {
    try {
      const response = await axios.post('http://localhost:5000/api/mensagens/conversa', {
        destinatarioId,
        ofertaId
      });
      
      const conversaId = response.data.conversaId;
      await buscarMensagens(conversaId);
      await buscarConversas();
      
      return conversaId;
    } catch (error) {
      console.error('Erro ao iniciar conversa:', error);
      throw error;
    }
  };

  // Notificar que está digitando
  const notificarDigitando = (destinatarioId) => {
    if (socket) {
      socket.emit('digitando', {
        destinatarioId,
        remetenteNome: user.nome
      });
    }
  };

  // Notificar que parou de digitar
  const notificarParouDigitar = (destinatarioId) => {
    if (socket) {
      socket.emit('parou_digitar', { destinatarioId });
    }
  };

  // Buscar total de mensagens não lidas
  const buscarMensagensNaoLidas = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await axios.get('http://localhost:5000/api/mensagens/nao-lidas');
      setMensagensNaoLidas(response.data.total);
    } catch (error) {
      console.error('Erro ao buscar não lidas:', error);
    }
  }, [user]);

  // Marcar mensagens como lidas
  const marcarComoLida = useCallback(async (conversaId) => {
    try {
      await axios.patch(`http://localhost:5000/api/mensagens/conversa/${conversaId}/marcar-lida`);
      await buscarMensagensNaoLidas();
      await buscarConversas();
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  }, [buscarConversas, buscarMensagensNaoLidas]);

  // Buscar conversas e não lidas quando usuário loga
  useEffect(() => {
    if (user) {
      buscarConversas();
      buscarMensagensNaoLidas();
    }
  }, [user, buscarConversas, buscarMensagensNaoLidas]);

  // Conectar ao Socket.IO quando usuário está logado
  useEffect(() => {
    if (user && !socket) {
      const newSocket = io('http://localhost:5000', {
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('🟢 Conectado ao chat');
        newSocket.emit('usuario_conectado', user.userId);
      });

      newSocket.on('usuarios_online', (usuarios) => {
        setUsuariosOnline(usuarios);
      });

      newSocket.on('nova_mensagem', (data) => {
        console.log('📨 Nova mensagem recebida:', data);
        
        // Adicionar mensagem se estiver na conversa atual
        if (conversaAtual && data.conversaId === conversaAtual.id) {
          const novaMensagem = {
            id: Date.now(), // ID temporário
            conversa_id: data.conversaId,
            remetente_id: data.remetenteId,
            destinatario_id: data.destinatarioId,
            conteudo: data.mensagem,
            criado_em: data.timestamp || new Date(),
            remetente_nome: data.remetenteNome || 'Usuário',
            destinatario_nome: data.destinatarioNome || 'Você'
          };
          
          setMensagens(prev => [...prev, novaMensagem]);
          
          // Marcar como lida
          marcarComoLida(data.conversaId);
        } else {
          // Atualizar contador de não lidas
          buscarMensagensNaoLidas();
        }
        
        // Atualizar lista de conversas
        buscarConversas();
      });

      newSocket.on('mensagem_enviada', (data) => {
        console.log('✅ Confirmação de envio:', data);
        
        // Adicionar mensagem enviada à lista se estiver na conversa
        if (conversaAtual && data.conversaId === conversaAtual.id) {
          const novaMensagem = {
            id: Date.now(), // ID temporário
            conversa_id: data.conversaId,
            remetente_id: data.remetenteId,
            destinatario_id: data.destinatarioId,
            conteudo: data.mensagem,
            criado_em: data.timestamp || new Date(),
            remetente_nome: user.nome,
            destinatario_nome: 'Destinatário'
          };
          
          setMensagens(prev => {
            // Verificar se mensagem já não foi adicionada
            const jaExiste = prev.some(m => 
              m.conteudo === novaMensagem.conteudo && 
              m.remetente_id === novaMensagem.remetente_id &&
              Math.abs(new Date(m.criado_em) - new Date(novaMensagem.criado_em)) < 1000
            );
            
            if (jaExiste) {
              return prev;
            }
            
            return [...prev, novaMensagem];
          });
        }
      });

      newSocket.on('usuario_digitando', () => {
        setUsuarioDigitando(true);
      });

      newSocket.on('usuario_parou_digitar', () => {
        setUsuarioDigitando(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user, buscarConversas, conversaAtual, marcarComoLida, socket, buscarMensagensNaoLidas]);

  
  const value = {
    conversas,
    conversaAtual,
    mensagens,
    mensagensNaoLidas,
    usuariosOnline,
    usuarioDigitando,
    buscarConversas,
    buscarMensagens,
    iniciarConversa,
    enviarMensagem,
    notificarDigitando,
    notificarParouDigitar,
    marcarComoLida,
    setConversaAtual
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};