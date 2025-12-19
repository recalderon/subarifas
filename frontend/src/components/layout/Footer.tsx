import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white/50 backdrop-blur-sm mt-20 py-8">
      <div className="container mx-auto px-4 text-center">
        <p className="text-warmGray-light flex items-center justify-center gap-2">
          Feito com <FontAwesomeIcon icon={faHeart} className="text-coral" /> para rifas incríveis
        </p>
        <p className="text-sm text-warmGray-light mt-2">
          © 2025 Subarifas - Todos os direitos reservados
        </p>
      </div>
    </footer>
  );
};

export default Footer;
