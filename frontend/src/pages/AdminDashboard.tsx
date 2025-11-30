import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faPlay, faStop, faTrash, faEye, faBook, faEdit, faTrophy 
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { raffleAPI, adminAPI } from '../services/api';

interface RaffleForm {
  title: string;
  description: string;
  endDate: string;
  pages: number;
  price: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RaffleForm>({
    defaultValues: {
      pages: 1,
      price: 0
    }
  });

  const [raffles, setRaffles] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedRaffle, setSelectedRaffle] = useState<any>(null);
  const [selections, setSelections] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    loadRaffles();
  }, [isAuthenticated]);

  const loadRaffles = async () => {
    try {
      const response = await raffleAPI.getAll();
      setRaffles(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: RaffleForm) => {
    try {
      await raffleAPI.create(data);
      alert('Rifa criada com sucesso!');
      setShowForm(false);
      reset();
      loadRaffles();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao criar rifa');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'ended' : 'active';
    try {
      await raffleAPI.updateStatus(id, newStatus);
      loadRaffles();
    } catch (err) {
      alert('Erro ao atualizar status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta rifa?')) return;
    
    try {
      await raffleAPI.delete(id);
      loadRaffles();
    } catch (err) {
      alert('Erro ao excluir rifa');
    }
  };

  const viewSelections = async (raffleId: string) => {
    try {
      const response = await adminAPI.getSelections(raffleId);
      setSelections(response.data);
      setSelectedRaffle(raffles.find(r => r._id === raffleId));
    } catch (err) {
      alert('Erro ao carregar seleções');
    }
  };

  const handleEditRaffle = async (raffle: any) => {
    const newEndDate = prompt('Nova data de término (YYYY-MM-DDTHH:mm):', raffle.endDate.slice(0, 16));
    const newPrice = prompt('Novo preço:', raffle.price);
    
    const updates: any = {};
    
    if (newEndDate && newEndDate !== raffle.endDate.slice(0, 16)) {
      updates.endDate = newEndDate;
    }
    
    if (newPrice && !isNaN(Number(newPrice))) {
      updates.price = Number(newPrice);
    }

    if (Object.keys(updates).length > 0) {
      try {
        await raffleAPI.update(raffle._id, updates);
        loadRaffles();
      } catch (err) {
        alert('Erro ao atualizar rifa');
      }
    }
  };

  const handleUpdatePages = async (raffle: any) => {
    const newPages = prompt('Novo número de páginas:', raffle.pages);
    if (newPages && !isNaN(Number(newPages)) && Number(newPages) > 0) {
      try {
        await raffleAPI.update(raffle._id, { pages: Number(newPages) });
        loadRaffles();
      } catch (err) {
        alert('Erro ao atualizar páginas');
      }
    }
  };

  const handleSetWinner = async (raffle: any) => {
    const winner = prompt('Número do ganhador:', raffle.winnerNumber || '');
    if (winner !== null) {
      const num = winner === '' ? undefined : Number(winner);
      if (num !== undefined && isNaN(num)) {
        alert('Número inválido');
        return;
      }
      
      try {
        if (num !== undefined) {
           await raffleAPI.update(raffle._id, { winnerNumber: num });
           loadRaffles();
        }
      } catch (err) {
        alert('Erro ao definir ganhador');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-summer flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-coral border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-summer py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-display font-bold text-gradient">
            Painel Administrativo
          </h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Nova Rifa
          </button>
        </div>

        {/* Create Raffle Form */}
        {showForm && (
          <div className="card-glass mb-8 animate-fadeIn">
            <h2 className="text-2xl font-display font-bold text-warmGray mb-6">
              Criar Nova Rifa
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-warmGray font-medium mb-2">Título</label>
                <input
                  type="text"
                  {...register('title', { required: 'Campo obrigatório' })}
                  className="input"
                  placeholder="Nome da rifa"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-warmGray font-medium mb-2">Descrição</label>
                <textarea
                  {...register('description', { required: 'Campo obrigatório' })}
                  className="input"
                  rows={3}
                  placeholder="Descrição da rifa"
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-warmGray font-medium mb-2">
                    Data/Hora de Término
                  </label>
                  <input
                    type="datetime-local"
                    {...register('endDate', { required: 'Campo obrigatório' })}
                    className="input"
                  />
                  {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate.message}</p>}
                </div>

                <div>
                  <label className="block text-warmGray font-medium mb-2">Número de Páginas</label>
                  <input
                    type="number"
                    min="1"
                    {...register('pages', { required: 'Campo obrigatório', min: 1, valueAsNumber: true })}
                    className="input"
                    placeholder="1"
                  />
                  {errors.pages && <p className="text-red-500 text-sm mt-1">{errors.pages.message}</p>}
                </div>

                <div>
                  <label className="block text-warmGray font-medium mb-2">Preço por Número (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('price', { required: 'Campo obrigatório', min: 0, valueAsNumber: true })}
                    className="input"
                    placeholder="0.00"
                  />
                  {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>}
                </div>
              </div>

              <div className="flex gap-4">
                <button type="submit" className="btn btn-primary flex-1">
                  Criar Rifa
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    reset();
                  }}
                  className="btn btn-outline flex-1"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Raffles List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {raffles.map((raffle) => (
            <div key={raffle._id} className="card-glass">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faBook} className="text-3xl text-coral" />
                  <div>
                    <h3 className="text-xl font-display font-bold text-warmGray">
                      {raffle.title}
                    </h3>
                    <p className="text-sm text-warmGray-light">{raffle.description}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  raffle.status === 'active' 
                    ? 'bg-teal-light text-warmGray' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {raffle.status === 'active' ? 'Ativa' : 'Encerrada'}
                </span>
              </div>

              <div className="text-sm text-warmGray-light mb-4 space-y-1">
                <p className="flex items-center gap-2">
                  <span className="font-semibold">Preço:</span> R$ {raffle.price?.toFixed(2)}
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold">Páginas:</span> {raffle.pages}
                  <button 
                    onClick={() => handleUpdatePages(raffle)}
                    className="text-coral hover:text-coral-dark text-xs"
                    title="Editar páginas"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold">Término:</span> {new Date(raffle.endDate).toLocaleString('pt-BR')}
                  <button 
                    onClick={() => handleEditRaffle(raffle)}
                    className="text-coral hover:text-coral-dark text-xs"
                    title="Editar data e preço"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold">Ganhador:</span> {raffle.winnerNumber || '-'}
                  <button 
                    onClick={() => handleSetWinner(raffle)}
                    className="text-coral hover:text-coral-dark text-xs"
                    title="Definir ganhador"
                  >
                    <FontAwesomeIcon icon={faTrophy} />
                  </button>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleToggleStatus(raffle._id, raffle.status)}
                  className={`btn ${raffle.status === 'active' ? 'btn-outline' : 'btn-secondary'} text-sm`}
                >
                  <FontAwesomeIcon icon={raffle.status === 'active' ? faStop : faPlay} className="mr-2" />
                  {raffle.status === 'active' ? 'Encerrar' : 'Ativar'}
                </button>
                <button
                  onClick={() => viewSelections(raffle._id)}
                  className="btn btn-secondary text-sm"
                >
                  <FontAwesomeIcon icon={faEye} className="mr-2" />
                  Ver Números
                </button>
                <button
                  onClick={() => handleEditRaffle(raffle)}
                  className="btn btn-secondary text-sm"
                >
                  <FontAwesomeIcon icon={faEdit} className="mr-2" />
                  Editar Info
                </button>
                <button
                  onClick={() => handleDelete(raffle._id)}
                  className="btn btn-outline text-sm"
                >
                  <FontAwesomeIcon icon={faTrash} className="mr-2" />
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Selections Modal */}
        {selections && selectedRaffle && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="card-glass max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-display font-bold text-warmGray">
                  Números Selecionados - {selectedRaffle.title}
                </h2>
                <button
                  onClick={() => {
                    setSelections(null);
                    setSelectedRaffle(null);
                  }}
                  className="btn btn-outline"
                >
                  Fechar
                </button>
              </div>

              <div className="bg-mint/20 rounded-2xl p-4 mb-6">
                <p className="text-warmGray">
                  <strong>Total:</strong> {selections.stats.total} números selecionados
                </p>
                <p className="text-warmGray">
                  <strong>Arrecadado (Est.):</strong> R$ {(selections.stats.total * (selectedRaffle.price || 0)).toFixed(2)}
                </p>
                <p className="text-warmGray">
                  <strong>Menor:</strong> {selections.stats.min || 'N/A'} | 
                  <strong className="ml-2">Maior:</strong> {selections.stats.max || 'N/A'}
                </p>
              </div>

              <div className="space-y-4">
                {selections.selections.map((sel: any) => (
                  <div key={sel._id} className="bg-white rounded-2xl p-4 shadow-soft">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-2xl font-bold text-coral">
                          Número {sel.number} (Página {sel.pageNumber})
                        </p>
                        <div className="mt-2 text-sm text-warmGray space-y-1">
                          <p>🐦 X: {sel.user.xHandle}</p>
                          <p>📷 Instagram: {sel.user.instagramHandle}</p>
                          <p>📱 WhatsApp: {sel.user.whatsapp}</p>
                        </div>
                      </div>
                      <p className="text-xs text-warmGray-light">
                        {new Date(sel.selectedAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
