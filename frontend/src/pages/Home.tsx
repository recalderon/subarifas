import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faCloud } from '@fortawesome/free-solid-svg-icons';
import RaffleCard from '../components/raffle/RaffleCard';
import { raffleAPI } from '../services/api';

interface Raffle {
  _id: string;
  title: string;
  description: string;
  status: 'open' | 'waiting' | 'closed';
  endDate: string;
  totalNumbers: number;
  price: number;
}

const Home: React.FC = () => {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRaffles();
  }, []);

  const loadRaffles = async () => {
    try {
      const response = await raffleAPI.getAll();
      setRaffles(response.data);
    } catch (err: any) {
      setError('Erro ao carregar rifas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const activeRaffles = raffles.filter(r => r.status === 'open');

  return (
    <div className="min-h-screen bg-summer bg-wave">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="relative">
          {/* Floating decorations */}
          <FontAwesomeIcon 
            icon={faSun} 
            className="absolute top-0 left-10 text-6xl text-peach/30 animate-float" 
            style={{ animationDelay: '0s' }}
          />
          <FontAwesomeIcon 
            icon={faCloud} 
            className="absolute top-10 right-20 text-5xl text-mint/40 animate-float" 
            style={{ animationDelay: '1s' }}
          />

          <h1 className="text-6xl font-display font-bold text-gradient mb-6 animate-fadeIn">
            Bem-vindo ao Subarifas!
          </h1>
          <img 
            src="/subarifa_logo.PNG" 
            alt="Subarifas Logo" 
            className="mx-auto h-48 mb-8 animate-fadeIn" 
          />
          <p className="text-xl text-warmGray max-w-2xl mx-auto mb-12 animate-fadeIn">
            Participe de rifas incríveis e concorra a prêmios maravilhosos!
            Escolha seus números da sorte e boa sorte! ✨
          </p>
        </div>
      </section>

      {/* Raffles Section */}
      <section className="container mx-auto px-4 pb-16">
        <h2 className="text-3xl font-display font-bold text-warmGray text-center mb-12">
          Rifas Ativas
        </h2>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-coral border-t-transparent"></div>
            <p className="mt-4 text-warmGray-light">Carregando rifas...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {!loading && !error && activeRaffles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-warmGray-light text-lg">
              Nenhuma rifa ativa no momento. Volte em breve! 🌺
            </p>
          </div>
        )}

        {!loading && !error && activeRaffles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeRaffles.map((raffle) => (
              <RaffleCard key={raffle._id} raffle={raffle} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
