import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faPlay, faStop, faTrash, faEye, faTicket, faEdit, faTrophy, faFileCsv
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { raffleAPI, receiptAPI } from '../services/api';
import { formatReceiptId } from '../utils/receiptId';

interface RaffleForm {
  title: string;
  description: string;
  endDate: string;
  totalNumbers: number;
  price: number;

  pixName: string;
  pixKey: string;
  pixQRCode?: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RaffleForm>({
    defaultValues: {
      totalNumbers: 100,
      price: 0,

      pixName: '',
      pixKey: '',
    }
  });
  

  const [pixQRCodeDataUrl, setPixQRCodeDataUrl] = useState<string>('');
  const [editPixQRCodeDataUrl, setEditPixQRCodeDataUrl] = useState<string>('');

  const handleQRCodeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPixQRCodeDataUrl('');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPixQRCodeDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleEditQRCodeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setEditPixQRCodeDataUrl('');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setEditPixQRCodeDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const [raffles, setRaffles] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedRaffle, setSelectedRaffle] = useState<any>(null);
  const [editingRaffle, setEditingRaffle] = useState<any>(null);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [raffleToClose, setRaffleToClose] = useState<any>(null);
  const [selectedWinnerReceipt, setSelectedWinnerReceipt] = useState<string>('');
  const [paidReceipts, setPaidReceipts] = useState<any[]>([]);

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
      // Include QR data URL if present
      const payload: any = { ...data };
      if (pixQRCodeDataUrl) payload.pixQRCode = pixQRCodeDataUrl;
      await raffleAPI.create(payload);
      alert('Rifa criada com sucesso!');
      setShowForm(false);
      reset();
      setPixQRCodeDataUrl('');
      loadRaffles();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao criar rifa');
    }
  };

  // Edit form handling
  const { register: registerEdit, handleSubmit: handleEditSubmitFn, reset: resetEdit, formState: { errors: editErrors } } = useForm<RaffleForm>({
    defaultValues: {
      totalNumbers: 100,
      price: 0,

      pixName: '',
      pixKey: '',
      pixQRCode: '',
    }
  });

  const onEditSubmit = async (data: RaffleForm) => {
    if (!editingRaffle) return;
    try {
      const updates: any = { ...data };
      if (editPixQRCodeDataUrl) updates.pixQRCode = editPixQRCodeDataUrl;
      await raffleAPI.update(editingRaffle._id, updates);
      alert('Rifa atualizada com sucesso!');
      setShowEditForm(false);
      setEditingRaffle(null);
      resetEdit();
      setEditPixQRCodeDataUrl('');
      loadRaffles();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao atualizar rifa');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    // Cycle through: open -> waiting -> closed -> open
    let newStatus: 'open' | 'waiting' | 'closed';
    if (currentStatus === 'open') {
      newStatus = 'waiting';
    } else if (currentStatus === 'waiting') {
      newStatus = 'closed';
      // When closing, need to select winner
      const raffle = raffles.find(r => r._id === id);
      if (raffle) {
        // Load paid receipts for this raffle
        try {
          const response = await receiptAPI.getByRaffle(id);
          const paid = response.data.filter((r: any) => r.status === 'paid');
          if (paid.length === 0) {
            alert('Não há recibos pagos para esta rifa');
            return;
          }
          setPaidReceipts(paid);
          setRaffleToClose(raffle);
          setSelectedWinnerReceipt('');
          setShowWinnerModal(true);
          return;
        } catch (err) {
          alert('Erro ao carregar recibos');
          return;
        }
      }
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

  const confirmCloseRaffle = async () => {
    if (!selectedWinnerReceipt) {
      alert('Selecione um recibo vencedor');
      return;
    }
    
    if (!raffleToClose) return;
    
    try {
      await raffleAPI.updateStatus(raffleToClose._id, 'closed', selectedWinnerReceipt);
      setShowWinnerModal(false);
      setRaffleToClose(null);
      setSelectedWinnerReceipt('');
      setPaidReceipts([]);
      loadRaffles();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao encerrar rifa');
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
      setSearchQuery(''); // Reset search when opening new raffle
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

  const openEditModal = (raffle: any) => {
    setEditingRaffle(raffle);
    // prefill the edit form
    resetEdit({
      title: raffle.title,
      description: raffle.description,
      endDate: raffle.endDate?.slice?.(0, 16) || '',
      totalNumbers: raffle.totalNumbers,
      price: raffle.price,

      pixName: raffle.pixName || '',
      pixKey: raffle.pixKey || '',
      pixQRCode: raffle.pixQRCode || '',
    });
    setEditPixQRCodeDataUrl(raffle.pixQRCode || '');
    setShowEditForm(true);
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

  const handleDownloadCSV = async (raffleId: string, title: string) => {
    try {
      const response = await raffleAPI.downloadCSV(raffleId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title.replace(/\s+/g, '_')}_numeros.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Erro ao baixar CSV');
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
                  <label className="block text-warmGray font-medium mb-2">Números</label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    {...register('totalNumbers', { required: 'Campo obrigatório', min: 100, valueAsNumber: true })}
                    className="input"
                    placeholder="100"
                  />
                  {errors.totalNumbers && <p className="text-red-500 text-sm mt-1">{errors.totalNumbers.message}</p>}
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
                  <label className="block text-warmGray font-medium mb-2">Nome para PIX</label>
                  <input
                    type="text"
                    {...register('pixName', { required: 'Campo obrigatório' })}
                    className="input"
                    placeholder="Nome do recebedor"
                  />
                  {errors.pixName && <p className="text-red-500 text-sm mt-1">{errors.pixName.message}</p>}
                </div>

                <div>
                  <label className="block text-warmGray font-medium mb-2">Chave PIX</label>
                  <input
                    type="text"
                    {...register('pixKey', { required: 'Campo obrigatório' })}
                    className="input"
                    placeholder="chave@pix ou telefone"
                  />
                  {errors.pixKey && <p className="text-red-500 text-sm mt-1">{errors.pixKey.message}</p>}
                </div>

                <div>
                  <label className="block text-warmGray font-medium mb-2">QR Code (opcional)</label>
                  <input type="file" accept="image/*" onChange={handleQRCodeFile} className="input" />
                  {pixQRCodeDataUrl && (
                    <p className="text-sm text-warmGray-light mt-2">Imagem carregada</p>
                  )}
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
                  <FontAwesomeIcon icon={faTicket} className="text-3xl text-coral rotate-45" />
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
                  <span className="font-semibold">Números:</span> {raffle.totalNumbers}
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold">Término:</span> {new Date(raffle.endDate).toLocaleString('pt-BR')}
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
                {raffle.status === 'waiting' && (
                  <button
                    onClick={() => handleDownloadCSV(raffle._id, raffle.title)}
                    className="btn btn-secondary text-sm bg-green-100 hover:bg-green-200 text-green-800"
                  >
                    <FontAwesomeIcon icon={faFileCsv} className="mr-2" />
                    Baixar CSV
                  </button>
                )}
                <button
                  onClick={() => viewReceipts(raffle._id)}
                  className="btn btn-secondary text-sm"
                >
                  <FontAwesomeIcon icon={faEye} className="mr-2" />
                  Ver Transações
                </button>
                <button
                  onClick={() => openEditModal(raffle)}
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

              {/* Search Bar */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Buscar por ID, usuário, número, status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input w-full"
                />
              </div>

              <div className="bg-mint/20 rounded-2xl p-4 mb-6">
                <p className="text-warmGray">
                  <strong>Total de Transações:</strong> {receipts.filter((receipt: any) => {
                    if (!searchQuery) return true;
                    const query = searchQuery.toLowerCase();
                    const receiptId = formatReceiptId(receipt.receiptId).toLowerCase();
                    const xHandle = receipt.user.xHandle?.toLowerCase() || '';
                    const instagram = receipt.user.instagramHandle?.toLowerCase() || '';
                    const whatsapp = receipt.user.whatsapp?.toLowerCase() || '';
                    const numbers = receipt.numbers.map((n: any) => n.number.toString()).join(' ');
                    const status = receipt.status.toLowerCase();
                    
                    return receiptId.includes(query) ||
                           xHandle.includes(query) ||
                           instagram.includes(query) ||
                           whatsapp.includes(query) ||
                           numbers.includes(query) ||
                           status.includes(query);
                  }).length}
                </p>
                <p className="text-warmGray">
                  <strong>Arrecadado Total:</strong> R$ {receipts.filter((receipt: any) => {
                    if (!searchQuery) return true;
                    const query = searchQuery.toLowerCase();
                    const receiptId = formatReceiptId(receipt.receiptId).toLowerCase();
                    const xHandle = receipt.user.xHandle?.toLowerCase() || '';
                    const instagram = receipt.user.instagramHandle?.toLowerCase() || '';
                    const whatsapp = receipt.user.whatsapp?.toLowerCase() || '';
                    const numbers = receipt.numbers.map((n: any) => n.number.toString()).join(' ');
                    const status = receipt.status.toLowerCase();
                    
                    return receiptId.includes(query) ||
                           xHandle.includes(query) ||
                           instagram.includes(query) ||
                           whatsapp.includes(query) ||
                           numbers.includes(query) ||
                           status.includes(query);
                  }).reduce((sum, r) => sum + (r.totalAmount || 0), 0).toFixed(2)}
                </p>
              </div>

              <div className="space-y-4">
                {receipts.filter((receipt: any) => {
                  if (!searchQuery) return true;
                  const query = searchQuery.toLowerCase();
                  const receiptId = formatReceiptId(receipt.receiptId).toLowerCase();
                  const xHandle = receipt.user.xHandle?.toLowerCase() || '';
                  const instagram = receipt.user.instagramHandle?.toLowerCase() || '';
                  const whatsapp = receipt.user.whatsapp?.toLowerCase() || '';
                  const numbers = receipt.numbers.map((n: any) => n.number.toString()).join(' ');
                  const status = receipt.status.toLowerCase();
                  
                  return receiptId.includes(query) ||
                         xHandle.includes(query) ||
                         instagram.includes(query) ||
                         whatsapp.includes(query) ||
                         numbers.includes(query) ||
                         status.includes(query);
                }).map((receipt: any) => (
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
                          receipt.status === 'receipt_uploaded' ? 'bg-blue-200 text-blue-800' :
                          receipt.status === 'expired' ? 'bg-red-200 text-red-800' :
                          'bg-gray-200 text-gray-800'
                        }`}>
                          {receipt.status === 'paid' ? 'Pago' :
                           receipt.status === 'waiting_payment' ? 'Aguardando Pagamento' :
                           receipt.status === 'receipt_uploaded' ? 'Comprovante Enviado' :
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
                          <option value="receipt_uploaded">Comprovante Enviado</option>
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
        {/* Winner Selection Modal */}
        {showWinnerModal && raffleToClose && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="card-glass max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-display font-bold text-warmGray">
                  Selecionar Recibo Vencedor
                </h2>
                <button
                  onClick={() => {
                    setShowWinnerModal(false);
                    setRaffleToClose(null);
                    setSelectedWinnerReceipt('');
                    setPaidReceipts([]);
                  }}
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
              </div>

              <p className="text-warmGray-light mb-4">
                Selecione o recibo vencedor para encerrar a rifa <strong>{raffleToClose.title}</strong>
              </p>

              <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
                {paidReceipts.map((receipt: any) => (
                  <label
                    key={receipt._id}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedWinnerReceipt === receipt._id
                        ? 'border-coral bg-coral/10'
                        : 'border-warmGray-light/20 hover:border-coral/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="winnerReceipt"
                      value={receipt._id}
                      checked={selectedWinnerReceipt === receipt._id}
                      onChange={(e) => setSelectedWinnerReceipt(e.target.value)}
                      className="w-5 h-5 text-coral"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-warmGray mb-2">
                        {formatReceiptId(receipt.receiptId)}
                      </div>
                      <div className="text-sm text-warmGray-light mb-3">
                        {receipt.user?.xHandle && `X: @${receipt.user.xHandle} `}
                        {receipt.user?.instagramHandle && `IG: @${receipt.user.instagramHandle} `}
                        {receipt.user?.whatsapp && `Tel: ${receipt.user.whatsapp}`}
                      </div>
                      <div className="mb-1">
                        <span className="text-xs font-semibold text-warmGray uppercase tracking-wider">Números:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {receipt.numbers?.map((n: any) => (
                          <div
                            key={n.number}
                            className="px-3 py-1 bg-gradient-to-br from-coral to-peach text-white rounded-lg font-bold text-sm shadow-sm"
                          >
                            {n.number}
                          </div>
                        )) || <span className="text-xs text-warmGray-light">N/A</span>}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={confirmCloseRaffle}
                  disabled={!selectedWinnerReceipt}
                  className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FontAwesomeIcon icon={faTrophy} className="mr-2" />
                  Confirmar e Encerrar
                </button>
                <button
                  onClick={() => {
                    setShowWinnerModal(false);
                    setRaffleToClose(null);
                    setSelectedWinnerReceipt('');
                    setPaidReceipts([]);
                  }}
                  className="btn btn-outline flex-1"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Edit Raffle Modal */}
        {showEditForm && editingRaffle && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="card-glass max-w-2xl w-full overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-display font-bold text-warmGray">Editar Rifa</h2>
                <button onClick={() => { setShowEditForm(false); setEditingRaffle(null); resetEdit(); setEditPixQRCodeDataUrl(''); }} className="btn btn-outline">Fechar</button>
              </div>

              <form onSubmit={handleEditSubmitFn(onEditSubmit)} className="space-y-4">
                <div>
                  <label className="block text-warmGray font-medium mb-2">Título</label>
                  <input type="text" {...registerEdit('title', { required: 'Campo obrigatório' })} className="input" defaultValue={editingRaffle.title} />
                  {editErrors.title && <p className="text-red-500 text-sm mt-1">{editErrors.title.message}</p>}
                </div>
                <div>
                  <label className="block text-warmGray font-medium mb-2">Descrição</label>
                  <textarea {...registerEdit('description', { required: 'Campo obrigatório' })} className="input" rows={3} defaultValue={editingRaffle.description}></textarea>
                  {editErrors.description && <p className="text-red-500 text-sm mt-1">{editErrors.description.message}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-warmGray font-medium mb-2">Data/Hora de Término</label>
                    <input type="datetime-local" {...registerEdit('endDate', { required: 'Campo obrigatório' })} className="input" defaultValue={editingRaffle.endDate?.slice?.(0,16) || ''} />
                    {editErrors.endDate && <p className="text-red-500 text-sm mt-1">{editErrors.endDate.message}</p>}
                  </div>
                  <div>
                    <label className="block text-warmGray font-medium mb-2">Números</label>
                    <input type="number" min="100" step="100" {...registerEdit('totalNumbers', { required: 'Campo obrigatório', min: 100, valueAsNumber: true })} className="input" defaultValue={editingRaffle.totalNumbers} />
                    {editErrors.totalNumbers && <p className="text-red-500 text-sm mt-1">{editErrors.totalNumbers.message}</p>}
                  </div>
                  <div>
                    <label className="block text-warmGray font-medium mb-2">Preço por Número (R$)</label>
                    <input type="number" step="0.01" min="0" {...registerEdit('price', { required: 'Campo obrigatório', min: 0, valueAsNumber: true })} className="input" defaultValue={editingRaffle.price} />
                    {editErrors.price && <p className="text-red-500 text-sm mt-1">{editErrors.price.message}</p>}
                  </div>
                  <div>
                    <label className="block text-warmGray font-medium mb-2">Nome para PIX</label>
                    <input type="text" {...registerEdit('pixName', { required: 'Campo obrigatório' })} className="input" defaultValue={editingRaffle.pixName || ''} />
                    {editErrors.pixName && <p className="text-red-500 text-sm mt-1">{editErrors.pixName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-warmGray font-medium mb-2">Chave PIX</label>
                    <input type="text" {...registerEdit('pixKey', { required: 'Campo obrigatório' })} className="input" defaultValue={editingRaffle.pixKey || ''} />
                    {editErrors.pixKey && <p className="text-red-500 text-sm mt-1">{editErrors.pixKey.message}</p>}
                  </div>
                  <div>
                    <label className="block text-warmGray font-medium mb-2">QR Code (opcional)</label>
                    <input type="file" accept="image/*" onChange={handleEditQRCodeFile} className="input" />
                    {editPixQRCodeDataUrl && <p className="text-sm text-warmGray-light mt-2">Imagem carregada</p>}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button type="submit" className="btn btn-primary flex-1">Salvar</button>
                  <button type="button" onClick={() => { setShowEditForm(false); setEditingRaffle(null); resetEdit(); setEditPixQRCodeDataUrl(''); }} className="btn btn-outline flex-1">Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
