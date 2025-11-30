import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faClock, faTimesCircle, faTrophy, faTicketAlt } from '@fortawesome/free-solid-svg-icons';

interface RaffleCardProps {
  raffle: {
    _id: string;
    title: string;
    description: string;
    status: 'active' | 'ended';
    endDate: string;
    pages: number;
    winnerNumber?: number;
    stats?: {
      total: number;
      available: number;
      taken: number;
    };
  };
}

const RaffleCard: React.FC<RaffleCardProps> = ({ raffle }) => {
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  
  const endDate = new Date(raffle.endDate);
  const isExpired = new Date() > endDate;
  const isActive = raffle.status === 'active' && !isExpired;
  
  // Use stats if available, otherwise fallback to calculation
  const totalNumbers = raffle.stats?.total || raffle.pages * 100;
  const availableNumbers = raffle.stats?.available ?? totalNumbers;

  const handleWinnerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowWinnerModal(true);
  };

  return (
    <>
      <Link to={`/raffle/${raffle._id}`} className="block h-full">
        <div className="card-glass hover:scale-105 transition-transform duration-300 animate-fadeIn h-full flex flex-col">
          <div className="flex flex-col items-center text-center space-y-4 flex-grow">
            {/* Book Icon */}
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center relative ${
              isActive ? 'bg-gradient-to-br from-coral to-peach' : 'bg-gray-300'
            }`}>
              <FontAwesomeIcon icon={faBook} className="text-4xl text-white" />
              {!isActive && (
                <div className="absolute -top-2 -right-2 bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  Encerrada
                </div>
              )}
            </div>

            {/* Title */}
            <h3 className="text-xl font-display font-bold text-warmGray">
              {raffle.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-warmGray-light line-clamp-2">
              {raffle.description}
            </p>

            {/* Stats: Available / Total */}
            <div className="flex items-center gap-2 text-sm text-warmGray bg-white/40 px-3 py-1 rounded-full">
              <FontAwesomeIcon icon={faTicketAlt} className="text-mint" />
              <span>
                <span className="font-bold">{availableNumbers}</span> disponíveis / {totalNumbers}
              </span>
            </div>

            {/* End Date */}
            <div className="flex items-center gap-2 text-sm text-warmGray-light">
              <FontAwesomeIcon icon={faClock} className="text-peach" />
              <span>
                {isActive ? 'Sorteio em: ' : 'Sorteio: '}
                {endDate.toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>

          {/* Winner Button (if ended and winner exists) */}
          {!isActive && raffle.winnerNumber && (
            <div className="mt-4 pt-4 border-t border-white/20 w-full">
              <button
                onClick={handleWinnerClick}
                className="btn btn-secondary w-full text-sm py-2"
              >
                <FontAwesomeIcon icon={faTrophy} className="mr-2 text-yellow-500" />
                Ver Ganhador
              </button>
            </div>
          )}
        </div>
      </Link>

      {/* Winner Modal */}
      {showWinnerModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="card-glass max-w-sm w-full text-center relative">
            <button 
              onClick={() => setShowWinnerModal(false)}
              className="absolute top-4 right-4 text-warmGray-light hover:text-warmGray"
            >
              <FontAwesomeIcon icon={faTimesCircle} className="text-xl" />
            </button>

            <div className="mb-6">
              <FontAwesomeIcon icon={faTrophy} className="text-6xl text-yellow-400 drop-shadow-lg mb-4" />
              <h2 className="text-2xl font-display font-bold text-warmGray">
                Ganhador do Sorteio!
              </h2>
              <p className="text-warmGray-light">{raffle.title}</p>
            </div>

            <div className="bg-white/50 rounded-2xl p-8 mb-6">
              <p className="text-sm text-warmGray-light uppercase tracking-wider mb-2">Número Sorteado</p>
              <div className="text-6xl font-bold text-coral font-display">
                {raffle.winnerNumber}
              </div>
            </div>

            <button 
              onClick={() => setShowWinnerModal(false)}
              className="btn btn-primary w-full"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default RaffleCard;
