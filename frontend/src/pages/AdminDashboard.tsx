import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faPlay, faStop, faTrash, faEye, faBook, faEdit, faTrophy 
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { raffleAPI, receiptAPI } from '../services/api';
import { formatReceiptId } from '../utils/receiptId';

interface RaffleForm {
  title: string;
  description: string;
  endDate: string;
  pages: number;
  price: number;
  expirationHours: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RaffleForm>({
    defaultValues: {
      pages: 1,
      price: 0,
      expirationHours: 24
    }
  });

  const [raffles, setRaffles] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedRaffle, setSelectedRaffle] = useState<any>(null);
  const [receipts, setReceipts] = useState<any[]>([]);
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
    // Cycle through: open -> waiting -> closed -> open
    let newStatus: 'open' | 'waiting' | 'closed';
    if (currentStatus === 'open') {
      newStatus = 'waiting';
    } else if (currentStatus === 'waiting') {
      newStatus = 'closed';
    } else {
      newStatus = 'open';
    }
    
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

  const viewReceipts = async (raffleId: string) => {
    try {
      const response = await receiptAPI.getByRaffle(raffleId);
      setReceipts(response.data);
      setSelectedRaffle(raffles.find(r => r._id === raffleId));
    } catch (err) {
      alert('Erro ao carregar transações');
    }
  };

  const handleStatusChange = async (receiptId: string, newStatus: string) => {
    try {
      await receiptAPI.updateStatus(receiptId, newStatus as any, 'Admin');
      // Reload receipts
      if (selectedRaffle) {
        viewReceipts(selectedRaffle._id);
      }
    } catch (err) {
      alert('Erro ao atualizar status');
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

                <div>
                  <label className="block text-warmGray font-medium mb-2">Horas para Expiração</label>
                  <input
                    type="number"
                    min="1"
                    {...register('expirationHours', { required: 'Campo obrigatório', min: 1, valueAsNumber: true })}
                    className="input"
                    placeholder="24"
                  />
                  {errors.expirationHours && <p className="text-red-500 text-sm mt-1">{errors.expirationHours.message}</p>}
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
                  raffle.status === 'open' 
                    ? 'bg-teal-light text-warmGray' 
                    : raffle.status === 'waiting'
                    ? 'bg-yellow-200 text-warmGray'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {raffle.status === 'open' ? 'Aberta' : raffle.status === 'waiting' ? 'Aguardando Sorteio' : 'Encerrada'}
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
                  className="btn btn-secondary text-sm"
                >
                  <FontAwesomeIcon icon={raffle.status === 'open' ? faStop : raffle.status === 'waiting' ? faTrophy : faPlay} className="mr-2" />
                  {raffle.status === 'open' ? 'Aguardar Sorteio' : raffle.status === 'waiting' ? 'Encerrar' : 'Reabrir'}
                </button>
                <button
                  onClick={() => viewReceipts(raffle._id)}
                  className="btn btn-secondary text-sm"
                >
                  <FontAwesomeIcon icon={faEye} className="mr-2" />
                  Ver Transações
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

        {/* Receipts/Transactions Modal */}
        {receipts.length > 0 && selectedRaffle && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="card-glass max-w-6xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-display font-bold text-warmGray">
                  Transações - {selectedRaffle.title}
                </h2>
                <button
                  onClick={() => {
                    setReceipts([]);
                    setSelectedRaffle(null);
                  }}
                  className="btn btn-outline"
                >
                  Fechar
                </button>
              </div>

              <div className="bg-mint/20 rounded-2xl p-4 mb-6">
                <p className="text-warmGray">
                  <strong>Total de Transações:</strong> {receipts.length}
                </p>
                <p className="text-warmGray">
                  <strong>Arrecadado Total:</strong> R$ {receipts.reduce((sum, r) => sum + (r.totalAmount || 0), 0).toFixed(2)}
                </p>
              </div>

              <div className="space-y-4">
                {receipts.map((receipt: any) => (
                  <div key={receipt._id} className="bg-white rounded-2xl p-4 shadow-soft">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-lg font-bold text-coral">
                          Recibo: {formatReceiptId(receipt.receiptId)}
                        </p>
                        <p className="text-sm text-warmGray-light">
                          {new Date(receipt.createdAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          receipt.status === 'paid' ? 'bg-green-200 text-green-800' :
                          receipt.status === 'waiting_payment' ? 'bg-yellow-200 text-yellow-800' :
                          receipt.status === 'expired' ? 'bg-red-200 text-red-800' :
                          'bg-gray-200 text-gray-800'
                        }`}>
                          {receipt.status === 'paid' ? 'Pago' :
                           receipt.status === 'waiting_payment' ? 'Aguardando Pagamento' :
                           receipt.status === 'expired' ? 'Expirado' :
                           'Criado'}
                        </span>
                        <select
                          value={receipt.status}
                          onChange={(e) => handleStatusChange(receipt.receiptId, e.target.value)}
                          className="input text-sm py-1"
                        >
                          <option value="created">Criado</option>
                          <option value="waiting_payment">Aguardando Pagamento</option>
                          <option value="paid">Pago</option>
                          <option value="expired">Expirado</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-warmGray-light">Números Selecionados</p>
                        <p className="font-semibold text-warmGray">
                          {receipt.numbers.map((n: any) => `${n.number} (P${n.pageNumber})`).join(', ')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-warmGray-light">Valor Total</p>
                        <p className="font-semibold text-warmGray">R$ {receipt.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-sm text-warmGray-light mb-2">Informações do Cliente</p>
                      <div className="grid grid-cols-3 gap-2 text-sm text-warmGray">
                        <p>🐦 X: {receipt.user.xHandle}</p>
                        <p>📷 Instagram: {receipt.user.instagramHandle}</p>
                        <p>📱 WhatsApp: {receipt.user.whatsapp}</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <p className="text-sm text-warmGray-light mb-2">Expira em: {new Date(receipt.expiresAt).toLocaleString('pt-BR')}</p>
                      {receipt.statusHistory && receipt.statusHistory.length > 1 && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-warmGray-light">Histórico de Status</summary>
                          <div className="mt-2 space-y-1">
                            {receipt.statusHistory.map((h: any, i: number) => (
                              <p key={i} className="text-xs text-warmGray">
                                {new Date(h.changedAt).toLocaleString('pt-BR')} - {h.status} 
                                {h.changedBy && ` por ${h.changedBy}`}
                              </p>
                            ))}
                          </div>
                        </details>
                      )}
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
