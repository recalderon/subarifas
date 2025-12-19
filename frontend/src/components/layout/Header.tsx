import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faUser } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';

const Header: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-soft sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <FontAwesomeIcon 
              icon={faBook} 
              className="text-3xl text-coral group-hover:scale-110 transition-transform" 
            />
            <h1 className="text-3xl font-display font-bold text-gradient">
              Subarifas
            </h1>
          </Link>

          <nav className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link to="/admin" className="btn btn-secondary text-sm">
                  <FontAwesomeIcon icon={faUser} className="mr-2" />
                  Dashboard
                </Link>
                <button onClick={logout} className="btn btn-outline text-sm">
                  Sair
                </button>
              </>
            ) : (
              <Link to="/admin/login" className="btn btn-primary text-sm">
                <FontAwesomeIcon icon={faUser} className="mr-2" />
                Admin
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
