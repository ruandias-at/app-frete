import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { mensagensNaoLidas } = useChat();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          AirFrete
        </Link>

        <button 
          className={`navbar-toggle ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          <div className="navbar-nav">
            {user ? (
              <>
                <Link 
                  to="/chat"
                  className="nav-link"
                  onClick={closeMenu}
                >
                  Chat
                  {mensagensNaoLidas > 0 && (
                    <span className="chat-badge">
                      {mensagensNaoLidas > 99 ? '99+' : mensagensNaoLidas}
                    </span>
                  )}
                </Link>
                
                  <Link 
                    to="/dashboard" 
                    className="nav-link"
                    onClick={closeMenu}
                  >
                    Dashboard
                  </Link>
                
                
                
                <p>
                  <span className='username-role'>{user.nome} ({user.tipo})</span>
                  <button 
                    onClick={handleLogout} 
                    className="nav-button logout"
                  >
                    Sair
                  </button>
                </p>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="nav-link"
                  onClick={closeMenu}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="nav-button primary"
                  onClick={closeMenu}
                >
                  Cadastro
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;