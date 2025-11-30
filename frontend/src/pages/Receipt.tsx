import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, faTicketAlt, faCalendarAlt, faUser, faArrowLeft, faShareAlt
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp, faTwitter, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { selectionAPI, receiptAPI } from '../services/api';
import { formatReceiptId } from '../utils/receiptId';

const Receipt: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selections, setSelections] = useState<any[]>([]);
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      loadReceipt();
    }
  }, [id]);

  const loadReceipt = async () => {
    try {
      console.log('Loading receipt for ID:', id);
      const response = await selectionAPI.getReceipt(id!);
      
      if (Array.isArray(response.data)) {
        setSelections(response.data);
      } else {
        setSelections(response.data.selections || []);
      }

      // Fetch receipt details for status
      const receiptResponse = await receiptAPI.getById(id!);
      console.log('Receipt status from API:', receiptResponse.data.status);
      setReceipt(receiptResponse.data);

    } catch (err) {
      console.error('Error loading receipt:', err);
      setError('Recibo não encontrado');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 5MB');
      return;
    }

    try {
      setUploading(true);
      await receiptAPI.uploadReceipt(id!, file);
      setUploadSuccess(true);
      // Optimistically update status
      setReceipt((prev: any) => ({ ...prev, status: 'receipt_uploaded' }));
      alert('Comprovante enviado com sucesso!');
      await loadReceipt(); // Reload to update status from server
    } catch (err) {
      console.error('Error uploading receipt:', err);
      alert('Erro ao enviar comprovante. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-summer flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-coral border-t-transparent"></div>
          <p className="mt-4 text-warmGray-light">Carregando recibo...</p>
        </div>
      </div>
    );
  }

  if (error || selections.length === 0) {
    return (
      <div className="min-h-screen bg-summer flex items-center justify-center p-4">
        <div className="card-glass text-center max-w-md w-full">
          <h2 className="text-2xl font-display font-bold text-warmGray mb-4">Erro</h2>
          <p className="text-warmGray-light mb-6">{error}</p>
          <button onClick={() => navigate('/')} className="btn btn-primary w-full">
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  const firstSelection = selections[0];
  const raffle = firstSelection.raffleId;
  const user = firstSelection.user;
  // const totalAmount = selections.length; // Assuming 1 ticket = 1 unit of currency, adjust if needed

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getContactIcon = (type: string) => {
    switch (type) {
      case 'whatsapp': return faWhatsapp;
      case 'instagram': return faInstagram;
      case 'x': return faTwitter;
      default: return faUser;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'waiting_payment': return 'Aguardando Pagamento';
      case 'receipt_uploaded': return 'Comprovante Enviado';
      case 'paid': return 'Pago';
      case 'expired': return 'Expirado';
      default: return 'Desconhecido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting_payment': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'receipt_uploaded': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Use shared formatter

  return (
    <div className="min-h-screen bg-summer py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="card-glass animate-fadeIn relative overflow-hidden">
          {/* Decorative top border */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-coral to-pink-500"></div>

          <div className="text-center mb-8 pt-4">
            <FontAwesomeIcon icon={faCheckCircle} className="text-6xl text-teal-light mb-4" />
            <div className="flex justify-center mb-4">
              <span className={`px-4 py-1 rounded-full text-sm font-bold border ${getStatusColor(receipt?.status || 'waiting_payment')}`}>
                {getStatusLabel(receipt?.status || 'waiting_payment')}
              </span>
            </div>
            <h1 className="text-3xl font-display font-bold text-warmGray">
              Reserva Confirmada!
            </h1>
            <p className="text-warmGray-light mt-2">
              Guarde este comprovante
            </p>
          </div>

          {/* Ticket Details */}
          <div className="bg-white/50 rounded-xl p-6 mb-6 border border-white/40">
            <h3 className="text-lg font-bold text-warmGray mb-4 flex items-center">
              <FontAwesomeIcon icon={faTicketAlt} className="mr-2 text-coral" />
              Detalhes da Rifa
            </h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs text-warmGray-light uppercase tracking-wider">Rifa</p>
                <p className="font-semibold text-warmGray">{raffle.title}</p>
              </div>
              
              <div>
                <p className="text-xs text-warmGray-light uppercase tracking-wider">Data da Reserva</p>
                <p className="font-semibold text-warmGray flex items-center">
                  <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-warmGray-light text-xs" />
                  {formatDate(firstSelection.selectedAt)}
                </p>
              </div>

              <div>
                <p className="text-xs text-warmGray-light uppercase tracking-wider mb-1">Números Selecionados ({selections.length})</p>
                <div className="flex flex-wrap gap-2">
                  {selections.map((s: any) => (
                    <span key={s._id} className="bg-coral text-white px-3 py-1 rounded-full font-bold text-sm shadow-sm">
                      {s.number}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="bg-white/50 rounded-xl p-6 mb-8 border border-white/40">
            <h3 className="text-lg font-bold text-warmGray mb-4 flex items-center">
              <FontAwesomeIcon icon={faUser} className="mr-2 text-coral" />
              Seus Dados
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-warmGray-light uppercase tracking-wider">Contato Principal</p>
                <p className="font-semibold text-warmGray flex items-center capitalize">
                  <FontAwesomeIcon icon={getContactIcon(user.preferredContact)} className="mr-2" />
                  {user.preferredContact}
                </p>
              </div>
              
              {user.whatsapp && (
                <div>
                  <p className="text-xs text-warmGray-light uppercase tracking-wider">WhatsApp</p>
                  <p className="font-semibold text-warmGray">{user.whatsapp}</p>
                </div>
              )}
              
              {user.instagramHandle && (
                <div>
                  <p className="text-xs text-warmGray-light uppercase tracking-wider">Instagram</p>
                  <p className="font-semibold text-warmGray">{user.instagramHandle}</p>
                </div>
              )}

              {user.xHandle && (
                <div>
                  <p className="text-xs text-warmGray-light uppercase tracking-wider">X / Twitter</p>
                  <p className="font-semibold text-warmGray">{user.xHandle}</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Link copiado para a área de transferência!');
              }}
              className="btn btn-secondary w-full"
            >
              <FontAwesomeIcon icon={faShareAlt} className="mr-2" />
              Copiar Link do Recibo
            </button>
            
            <button 
              onClick={() => navigate('/')}
              className="btn btn-outline w-full"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              Voltar ao Início
            </button>
          </div>

          {/* PIX Payment Instruction */}
          <div className="bg-white/50 rounded-xl p-6 mb-4 border border-white/40 mt-4">
            <h3 className="text-lg font-bold text-warmGray mb-2">Pagamento via PIX</h3>
            <p className="text-warmGray-light mb-4">
              Para finalizar, envie um PIX no valor de <strong>R$ { (selections.length * (raffle.price || 0)).toFixed(2) }</strong> para a seguinte chave <strong>{raffle.pixKey}</strong> no nome de <strong>{raffle.pixName}</strong>.
            </p>
            <p className="text-sm text-warmGray-light mb-4">O tempo limite para realizar o pagamento é de 30 minutos.</p>
            {raffle.pixQRCode && (
              <div className="text-center">
                <img src={raffle.pixQRCode} alt="PIX QR Code" className="mx-auto h-40 w-auto" />
              </div>
            )}
          </div>

          {/* Upload Receipt Section */}
          <div className="bg-white/50 rounded-xl p-6 mb-4 border border-white/40">
            <h3 className="text-lg font-bold text-warmGray mb-4">Enviar Comprovante</h3>
            
            {uploadSuccess || (receipt && (receipt.status === 'receipt_uploaded' || receipt.status === 'paid')) ? (
              <div className="text-center p-4 bg-green-100 rounded-lg text-green-700">
                <FontAwesomeIcon icon={faCheckCircle} className="text-2xl mb-2" />
                <p className="font-semibold">
                  {receipt?.status === 'paid' ? 'Pagamento Confirmado!' : 'Comprovante Enviado!'}
                </p>
                <p className="text-sm">
                  {receipt?.status === 'paid' 
                    ? 'Seus números estão garantidos.' 
                    : 'Aguarde a confirmação do administrador.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-warmGray-light text-sm">
                  Após realizar o pagamento, envie o comprovante aqui para agilizar a confirmação.
                </p>
                
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="receipt-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="receipt-upload"
                    className={`btn btn-primary w-full cursor-pointer flex items-center justify-center ${uploading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faShareAlt} className="mr-2" />
                        Selecionar Comprovante
                      </>
                    )}
                  </label>
                </div>
                <p className="text-xs text-center text-warmGray-light">
                  Formatos aceitos: Imagem ou PDF (Max 5MB)
                </p>
              </div>
            )}
          </div>

          <div className="text-center mt-6">
            <p className="text-xs text-warmGray-light">
              ID do Recibo: <span className="font-mono select-all">{formatReceiptId(id || '')}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
