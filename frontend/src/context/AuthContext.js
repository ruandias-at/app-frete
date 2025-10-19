import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Configurar axios com o token GLOBALMENTE
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Buscar dados do usuário
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, senha) => {
    try {
      const response = await axios.post('http://localhost:5000/api/users/login', {
        email,
        senha
      });

      const { token, user } = response.data;
      
      console.log('🔑 Token recebido:', token?.substring(0, 20) + '...');
      console.log('👤 User:', user);
      
      // Salvar no localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Configurar axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      console.log('✅ Token configurado no axios');
      
      setUser(user);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao fazer login'
      };
    }
  };

  const register = async (nome, email, senha, tipo, placa = '') => {
    try {
      const userData = { nome, email, senha, tipo };
      
      if (tipo === 'fretista' && placa) {
        userData.placa = placa;
      }

      const response = await axios.post('http://localhost:5000/api/users/register', userData);

      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao criar conta'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};