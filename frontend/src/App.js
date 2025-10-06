import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
import './App.css';

function App() {
  return (
    <AuthProvider>
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
            <Route path="/catalogo-ofertas" element={<CatalogoOfertas />} />
            
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
            
            {/* Rota 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;