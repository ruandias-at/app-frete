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
      const conversasData = response.data.conversas;
      setConversas(conversasData);
      
      // Calcular total de mensagens não lidas
      const totalNaoLidas = conversasData.reduce((total, conversa) => {
        return total + (conversa.mensagens_nao_lidas || 0);
      }, 0);
      
      setMensagensNaoLidas(totalNaoLidas);
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
    }
  }, [user]);



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

      // Atualizar conversas imediatamente para mostrar a última mensagem
      await buscarConversas();
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
    if (socket && conversaAtual) {
      socket.emit('digitando', {
        destinatarioId,
        conversaId: conversaAtual.id,
        remetenteNome: user.nome
      });
    }
  };

  // Notificar que parou de digitar
  const notificarParouDigitar = (destinatarioId) => {
    if (socket && conversaAtual) {
      socket.emit('parou_digitar', { 
        destinatarioId,
        conversaId: conversaAtual.id
      });
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
      
      // Atualizar estado local imediatamente para feedback visual
      setConversas(prevConversas => 
        prevConversas.map(conversa => 
          conversa.id === conversaId 
            ? { ...conversa, mensagens_nao_lidas: 0 }
            : conversa
        )
      );
      
      // Recalcular total de não lidas
      await buscarMensagensNaoLidas();
      
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  }, [buscarMensagensNaoLidas]);

    // Buscar mensagens de uma conversa
  const buscarMensagens = useCallback(async (conversaId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/mensagens/conversa/${conversaId}`);
      setMensagens(response.data.mensagens);
      setConversaAtual(response.data.conversa);
      
      // Marcar mensagens como lidas ao abrir a conversa
      if (conversaId) {
        await marcarComoLida(conversaId);
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    }
  }, [marcarComoLida]);

  // Função para atualizar conversa quando recebe nova mensagem
  const atualizarConversaComNovaMensagem = useCallback((data) => {
    setConversas(prevConversas => {
      const conversaIndex = prevConversas.findIndex(c => c.id === data.conversaId);
      
      if (conversaIndex === -1) {
        // Se é uma nova conversa, buscar todas as conversas
        buscarConversas();
        return prevConversas;
      }
      
      const novasConversas = [...prevConversas];
      const conversaAtualizada = { ...novasConversas[conversaIndex] };
      
      // Atualizar última mensagem e timestamp
      conversaAtualizada.ultima_mensagem = data.mensagem;
      conversaAtualizada.ultima_mensagem_em = data.timestamp || new Date();
      
      // Incrementar mensagens não lidas se não for a conversa atual
      if (!conversaAtual || conversaAtual.id !== data.conversaId) {
        conversaAtualizada.mensagens_nao_lidas = (conversaAtualizada.mensagens_nao_lidas || 0) + 1;
      }
      
      // Mover conversa para o topo
      novasConversas.splice(conversaIndex, 1);
      novasConversas.unshift(conversaAtualizada);
      
      return novasConversas;
    });
    
    // Atualizar contador total de não lidas
    if (!conversaAtual || conversaAtual.id !== data.conversaId) {
      setMensagensNaoLidas(prev => prev + 1);
    }
  }, [conversaAtual, buscarConversas]);

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
        
        // Atualizar lista de conversas com a nova mensagem
        atualizarConversaComNovaMensagem(data);
        
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
          
          // Marcar como lida automaticamente se estiver na conversa
          marcarComoLida(data.conversaId);
        }
      });

      newSocket.on('mensagem_enviada', (data) => {
        console.log('✅ Confirmação de envio:', data);
        
        // Atualizar lista de conversas quando envia mensagem
        atualizarConversaComNovaMensagem(data);
        
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

      newSocket.on('mensagens_lidas', (data) => {
        console.log('👀 Mensagens marcadas como lidas:', data);
        
        // Atualizar estado local quando outras pessoas leem mensagens
        if (data.conversaId) {
          setConversas(prevConversas => 
            prevConversas.map(conversa => 
              conversa.id === data.conversaId 
                ? { ...conversa, mensagens_nao_lidas: 0 }
                : conversa
            )
          );
          
          // Recalcular total
          buscarMensagensNaoLidas();
        }
      });

      newSocket.on('usuario_digitando', (data) => {
        if (conversaAtual && data.conversaId === conversaAtual.id) {
          setUsuarioDigitando(true);
        }
      });

      newSocket.on('usuario_parou_digitar', (data) => {
        if (conversaAtual && data.conversaId === conversaAtual.id) {
          setUsuarioDigitando(false);
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user, conversaAtual, marcarComoLida, socket, buscarMensagensNaoLidas, atualizarConversaComNovaMensagem]);

  // Efeito para marcar mensagens como lidas quando a conversa é aberta
  useEffect(() => {
    if (conversaAtual && conversaAtual.id) {
      // Marcar como lida imediatamente ao abrir a conversa
      marcarComoLida(conversaAtual.id);
    }
  }, [conversaAtual, marcarComoLida]);

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
    setConversaAtual,
    buscarMensagensNaoLidas
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};