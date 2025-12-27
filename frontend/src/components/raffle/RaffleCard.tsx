import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faClock, faTimesCircle, faTrophy, faTicketAlt } from '@fortawesome/free-solid-svg-icons';
import { raffleAPI } from '../../services/api';
import { formatReceiptId } from '../../utils/receiptId';

interface RaffleCardProps {
  raffle: {
    _id: string;
    title: string;
    description: string;
    status: 'open' | 'waiting' | 'closed';
    endDate: string;
    totalNumbers: number;
    price: number;
    winnerNumber?: number;
    stats?: {
      total: number;
      available: number;
      taken: number;
    };
  };
}

interface WinnerInfo {
  receiptId: string;
  numbers: number[];
  user: {
    xHandle?: string;
    instagramHandle?: string;
    whatsapp?: string;
  };
  totalAmount: number;
  paidAt?: string;
}

const RaffleCard: React.FC<RaffleCardProps> = ({ raffle }) => {
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [winnerInfo, setWinnerInfo] = useState<WinnerInfo | null>(null);
  const [loadingWinner, setLoadingWinner] = useState(false);
  
  const endDate = new Date(raffle.endDate);
  const isExpired = new Date() > endDate;
  const isActive = raffle.status === 'open' && !isExpired;
  const isClosed = raffle.status === 'closed';
  
  // Use stats if available, otherwise fallback to totalNumbers
  const totalNumbers = raffle.stats?.total || raffle.totalNumbers;
  const availableNumbers = raffle.stats?.available ?? totalNumbers;

  const handleWinnerClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowWinnerModal(true);
    
    if (!winnerInfo && isClosed) {
      setLoadingWinner(true);
      try {
        const response = await raffleAPI.getWinner(raffle._id);
        setWinnerInfo(response.data);
      } catch (err) {
        console.error('Error loading winner:', err);
      } finally {
        setLoadingWinner(false);
      }
    }
  };

  const CardContent = () => (
    <div className="card-glass hover:scale-105 transition-transform duration-300 animate-fadeIn h-full flex flex-col">
      <div className="flex flex-col items-center text-center space-y-4 flex-grow">
        {/* Book Icon */}
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center relative ${
          isActive ? 'bg-gradient-to-br from-coral to-peach' : 'bg-gray-300'
        }`}>
          <FontAwesomeIcon icon={faBook} className="text-4xl text-white" />
          {!isActive && (
            <div className="absolute -top-2 -right-2 bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap">
              {raffle.status === 'closed' ? 'Encerrada' : 
               raffle.status === 'waiting' ? 'Aguardando' : 
               'Expirada'}
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

        {/* Price */}
        <div className="flex items-center gap-2 text-lg font-bold text-coral bg-white/40 px-4 py-2 rounded-full">
          <span>R$ {raffle.price?.toFixed(2)}</span>
          <span className="text-xs text-warmGray-light font-normal">por número</span>
        </div>

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

      {/* Winner Button (if closed) */}
      {isClosed && (
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
  );

  return (
    <>
      {isActive ? (
        <Link to={`/raffle/${raffle._id}`} className="block h-full">
          <CardContent />
        </Link>
      ) : (
        <div className="block h-full cursor-default">
          <CardContent />
        </div>
      )}

      {/* Winner Modal */}
      {showWinnerModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="card-glass max-w-md w-full text-center relative">
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

            {loadingWinner ? (
              <div className="py-8">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-coral border-t-transparent"></div>
                <p className="mt-4 text-warmGray-light">Carregando...</p>
              </div>
            ) : winnerInfo ? (
              <>
                <div className="bg-white/50 rounded-2xl p-6 mb-6 space-y-4">
                  <div>
                    <p className="text-sm text-warmGray-light uppercase tracking-wider mb-1">Recibo Vencedor</p>
                    <div className="text-2xl font-bold text-coral font-display">
                      {formatReceiptId(winnerInfo.receiptId)}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-warmGray-light uppercase tracking-wider mb-2">Números Sorteados</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {winnerInfo.numbers.map((num) => (
                        <div
                          key={num}
                          className="w-10 h-10 bg-gradient-to-br from-coral to-peach text-white rounded-lg flex items-center justify-center font-bold text-sm"
                        >
                          {num}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-warmGray-light/20">
                    <p className="text-sm text-warmGray-light mb-1">Valor Total</p>
                    <p className="text-xl font-bold text-warmGray">
                      R$ {winnerInfo.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-warmGray-light italic mb-4">
                  * Por segurança, as informações de contato do ganhador foram ocultadas
                </p>
              </>
            ) : (
              <div className="py-8">
                <p className="text-warmGray-light">Nenhum ganhador selecionado ainda</p>
              </div>
            )}

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
