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
import Chat from './components/Chat';
import './App.css';

// Axios interceptors
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
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
          <Navbar />
          <Routes>
            {/* Rotas públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/oferta/:id" element={<DetalhesOferta />} />
            <Route path="/catalogo-ofertas" element={<CatalogoOfertas />} />

            {/* Rotas protegidas */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/criar-oferta" element={<ProtectedRoute><CriarOferta /></ProtectedRoute>} />
            <Route path="/editar-oferta/:id" element={<ProtectedRoute><EditarOferta /></ProtectedRoute>} />
            <Route path="/minhas-ofertas" element={<ProtectedRoute><MinhasOfertas /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/chat/:conversaId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
