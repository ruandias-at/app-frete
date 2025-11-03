import React from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import Dashboard from './components/Dashboard';
import CriarOferta from './components/CriarOferta';
import EditarOferta from './components/EditarOferta';
import CatalogoOfertas from './components/CatalogoOfertas';
import MinhasOfertas from './components/MinhasOfertas';
import DetalhesOferta from './components/DetalhesOferta';
import TodasOfertas from './components/TodasOfertas';
import Chat from './components/Chat';
import './App.css';

// Interceptor para adicionar token automaticamente
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('📤 Request:', config.method.toUpperCase(), config.url);
    console.log('Headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para debug de respostas
axios.interceptors.response.use(
  (response) => {
    console.log('📥 Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', error.response?.status, error.response?.data);
    
    // Se for 401 (não autorizado), redirecionar para login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);
function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Router>
          <div className="App">
            <Navbar />
            <Routes>
              {/* Rota inicial */}
              <Route path="/" element={<Home />} />
              
              {/* Rotas públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/oferta/:id" element={<DetalhesOferta />} />
              <Route path="/catalogo-ofertas" element={<CatalogoOfertas />} />
              <Route path="/todas-ofertas" element={<TodasOfertas />} />
              
              {/* Rotas protegidas */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/criar-oferta" 
                element={
                  <ProtectedRoute>
                    <CriarOferta />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/editar-oferta/:id" 
                element={
                  <ProtectedRoute>
                    <EditarOferta />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/minhas-ofertas" 
                element={
                  <ProtectedRoute>
                    <MinhasOfertas />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/chat" 
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/chat/:conversaId" 
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                } 
              />
              
              {/* Rota 404 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </ChatProvider> 
    </AuthProvider>
  );
}

export default App;