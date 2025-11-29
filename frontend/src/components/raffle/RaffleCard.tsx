import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faClock, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';

interface RaffleCardProps {
  raffle: {
    _id: string;
    title: string;
    description: string;
    status: 'active' | 'ended';
    endDate: string;
    pages: number;
  };
}

const RaffleCard: React.FC<RaffleCardProps> = ({ raffle }) => {
  const isActive = raffle.status === 'active';
  const endDate = new Date(raffle.endDate);

  return (
    <Link to={`/raffle/${raffle._id}`}>
      <div className="card-glass hover:scale-105 transition-transform duration-300 animate-fadeIn">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Book Icon */}
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
            isActive ? 'bg-gradient-to-br from-coral to-peach' : 'bg-gray-300'
          }`}>
            <FontAwesomeIcon icon={faBook} className="text-4xl text-white" />
          </div>

          {/* Title */}
          <h3 className="text-xl font-display font-bold text-warmGray">
            {raffle.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-warmGray-light line-clamp-2">
            {raffle.description}
          </p>

          {/* Pages */}
          <div className="flex items-center gap-2 text-sm text-warmGray">
            <FontAwesomeIcon icon={faBook} className="text-mint" />
            <span>{raffle.pages} página{raffle.pages > 1 ? 's' : ''}</span>
          </div>

          {/* End Date */}
          <div className="flex items-center gap-2 text-sm text-warmGray-light">
            <FontAwesomeIcon icon={faClock} className="text-peach" />
            <span>
              {endDate.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* Status Badge */}
          <div className={`px-4 py-2 rounded-full text-sm font-medium ${
            isActive 
              ? 'bg-teal-light text-warmGray' 
              : 'bg-gray-200 text-gray-500'
          }`}>
            <FontAwesomeIcon 
              icon={isActive ? faCheckCircle : faTimesCircle} 
              className="mr-2" 
            />
            {isActive ? 'Ativa' : 'Encerrada'}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RaffleCard;
