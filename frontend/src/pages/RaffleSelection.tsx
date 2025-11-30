import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faInstagram, faWhatsapp, faTwitter 
} from '@fortawesome/free-brands-svg-icons';
import { faArrowLeft, faCheck, faBook, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import NumberGrid from '../components/raffle/NumberGrid';
import { raffleAPI, selectionAPI } from '../services/api';

interface UserForm {
  xHandle: string;
  instagramHandle: string;
  whatsapp: string;
  preferredContact: 'x' | 'instagram' | 'whatsapp';
}

const RaffleSelection: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<UserForm>();

  const [raffle, setRaffle] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [availableNumbers, setAvailableNumbers] = useState<number[]>([]);
  const [takenNumbers, setTakenNumbers] = useState<number[]>([]);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadRaffle();
  }, [id]);

  useEffect(() => {
    if (raffle) {
      loadAvailableNumbers();
    }
  }, [currentPage, raffle]);

  // Polling for updates
  useEffect(() => {
    if (!id || !raffle || showSuccess) return; // Stop polling if success screen is shown

    const interval = setInterval(async () => {
      try {
        const response = await raffleAPI.getAvailable(id, currentPage);
        const newTakenNumbers = response.data.takenNumbers;
        
        setTakenNumbers(prev => {
          // Check if any new numbers were taken
          const newlyTaken = newTakenNumbers.filter((n: number) => !prev.includes(n));
          
          if (newlyTaken.length > 0) {
            // Check if any of the newly taken numbers were selected by the current user
            // BUT ignore this check if we are currently submitting (because WE are the ones taking them)
            if (!submitting) {
              setSelectedNumbers(currentSelected => {
                const conflicts = currentSelected.filter(n => newlyTaken.includes(n));
                if (conflicts.length > 0) {
                  alert(`O(s) número(s) ${conflicts.join(', ')} acabou de ser reservado por outra pessoa!`);
                  return currentSelected.filter(n => !newlyTaken.includes(n));
                }
                return currentSelected;
              });
            }
          }
          return newTakenNumbers;
        });
        
        setAvailableNumbers(response.data.availableNumbers);
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [id, currentPage, raffle, submitting, showSuccess]);

  const loadRaffle = async () => {
    try {
      const response = await raffleAPI.getById(id!);
      setRaffle(response.data);
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar rifa');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableNumbers = async () => {
    try {
      const response = await raffleAPI.getAvailable(id!, currentPage);
      setAvailableNumbers(response.data.availableNumbers);
      setTakenNumbers(response.data.takenNumbers);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleNumber = (number: number) => {
    setSelectedNumbers(prev => 
      prev.includes(number)
        ? prev.filter(n => n !== number)
        : [...prev, number]
    );
  };

  const onSubmit = async (data: UserForm) => {
    if (selectedNumbers.length === 0) {
      alert('Selecione pelo menos um número!');
      return;
    }

    setSubmitting(true);

    try {
      // Generate a unique receipt ID for this batch
      const receiptId = crypto.randomUUID();

      // Submit each selected number
      for (const number of selectedNumbers) {
        await selectionAPI.create(id!, {
          receiptId,
          number,
          pageNumber: currentPage,
          user: {
            xHandle: data.xHandle,
            instagramHandle: data.instagramHandle,
            whatsapp: data.whatsapp,
            preferredContact: data.preferredContact,
          },
        });
      }

      setShowSuccess(true);
      setTimeout(() => {
        navigate(`/receipt/${receiptId}`);
      }, 2000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao reservar números');
      loadAvailableNumbers(); // Reload to get updated numbers
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-summer flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-coral border-t-transparent"></div>
          <p className="mt-4 text-warmGray-light">Carregando...</p>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-summer flex items-center justify-center">
        <div className="card-glass max-w-md text-center animate-fadeIn">
          <FontAwesomeIcon icon={faCheck} className="text-6xl text-teal-light mb-4" />
          <h2 className="text-3xl font-display font-bold text-warmGray mb-4">
            Sucesso! 🎉
          </h2>
          <p className="text-warmGray-light mb-2">
            Seus números foram reservados com sucesso!
          </p>
          <p className="text-warmGray font-semibold">
            Números: {selectedNumbers.sort((a, b) => a - b).join(', ')}
          </p>
          <p className="text-sm text-warmGray-light mt-4">
            Redirecionando...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-summer py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="btn btn-outline mb-6"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Voltar
        </button>

        {/* Raffle Info */}
        <div className="card-glass mb-8 text-center">
          <FontAwesomeIcon icon={faBook} className="text-5xl text-coral mb-4" />
          <h1 className="text-3xl font-display font-bold text-warmGray mb-2">
            {raffle?.title}
          </h1>
          <p className="text-warmGray-light">{raffle?.description}</p>
        </div>

        {/* Book Pages Navigation - Removed from here */}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Number Grid */}
          <div className="card-glass lg:col-span-2 h-fit">
            <h3 className="text-xl font-display font-bold text-warmGray mb-4 text-center">
              Selecione seus números (1-100)
            </h3>

            {/* Pagination inside Number Grid */}
            {raffle?.pages > 1 && (
              <div className="flex items-center justify-between mb-6 bg-white/30 p-3 rounded-xl">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn btn-sm btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="mr-2" />
                  Anterior
                </button>

                <div className="text-center">
                  <p className="text-xs text-warmGray-light uppercase tracking-wider">Página</p>
                  <p className="text-xl font-display font-bold text-warmGray">
                    {currentPage} / {raffle?.pages}
                  </p>
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(raffle?.pages || 1, p + 1))}
                  disabled={currentPage === raffle?.pages}
                  className="btn btn-sm btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                  <FontAwesomeIcon icon={faChevronRight} className="ml-2" />
                </button>
              </div>
            )}

            <NumberGrid
              availableNumbers={availableNumbers}
              takenNumbers={takenNumbers}
              selectedNumbers={selectedNumbers}
              onToggleNumber={handleToggleNumber}
              disabled={raffle?.status !== 'active'}
            />
            {selectedNumbers.length > 0 && (
              <div className="mt-4 p-4 bg-coral/10 rounded-2xl">
                <p className="text-center text-warmGray">
                  <strong>{selectedNumbers.length}</strong> número(s) selecionado(s): 
                  <span className="ml-2 font-semibold">
                    {selectedNumbers.sort((a, b) => a - b).join(', ')}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* User Info Form */}
          <div className="lg:col-span-1">
            <form onSubmit={handleSubmit(onSubmit)} className="card-glass sticky top-4">
              <h3 className="text-2xl font-display font-bold text-warmGray mb-6 text-center">
                Suas Informações
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-warmGray font-medium mb-2">
                    <FontAwesomeIcon icon={faTwitter} className="mr-2 text-warmGray-light" />
                    X / Twitter Handle
                  </label>
                  <input
                    type="text"
                    {...register('xHandle', { required: 'Campo obrigatório' })}
                    placeholder="@seu_usuario"
                    className="input"
                  />
                  {errors.xHandle && (
                    <p className="text-red-500 text-sm mt-1">{errors.xHandle.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-warmGray font-medium mb-2">
                    <FontAwesomeIcon icon={faInstagram} className="mr-2 text-warmGray-light" />
                    Instagram Handle
                  </label>
                  <input
                    type="text"
                    {...register('instagramHandle', { required: 'Campo obrigatório' })}
                    placeholder="@seu_usuario"
                    className="input"
                  />
                  {errors.instagramHandle && (
                    <p className="text-red-500 text-sm mt-1">{errors.instagramHandle.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-warmGray font-medium mb-2">
                    <FontAwesomeIcon icon={faWhatsapp} className="mr-2 text-warmGray-light" />
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    {...register('whatsapp', { required: 'Campo obrigatório' })}
                    placeholder="(00) 00000-0000"
                    className="input"
                  />
                  {errors.whatsapp && (
                    <p className="text-red-500 text-sm mt-1">{errors.whatsapp.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-warmGray font-medium mb-2">
                    Preferência de Contato
                  </label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="x"
                        {...register('preferredContact', { required: 'Selecione uma opção' })}
                        className="text-coral focus:ring-coral"
                      />
                      <span className="text-warmGray">X / Twitter</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="instagram"
                        {...register('preferredContact', { required: 'Selecione uma opção' })}
                        className="text-coral focus:ring-coral"
                      />
                      <span className="text-warmGray">Instagram</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="whatsapp"
                        {...register('preferredContact', { required: 'Selecione uma opção' })}
                        className="text-coral focus:ring-coral"
                      />
                      <span className="text-warmGray">WhatsApp</span>
                    </label>
                  </div>
                  {errors.preferredContact && (
                    <p className="text-red-500 text-sm mt-1">{errors.preferredContact.message}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || selectedNumbers.length === 0 || raffle?.status !== 'active'}
                className="btn btn-primary w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Reservando...' : `Reservar ${selectedNumbers.length} Número(s)`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaffleSelection;
