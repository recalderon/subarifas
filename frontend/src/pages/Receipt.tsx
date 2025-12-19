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
      console.log('Receipt response:', response);
      console.log('Receipt data:', response.data);
      
      if (Array.isArray(response.data)) {
        setSelections(response.data);
      } else {
        console.error('Data is not an array:', response.data);
        // Handle case where data might be wrapped
        setSelections(response.data.selections || []);
      }
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
      alert('Comprovante enviado com sucesso!');
      loadReceipt(); // Reload to update status if needed
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

  // Use shared formatter

  return (
    <div className="min-h-screen bg-summer py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Raffle Ticket Design - Horizontal Layout */}
        <div className="relative animate-fadeIn">
          {/* Ticket Container with perforated edge effect */}
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden relative" style={{
            background: 'linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)'
          }}>
            
            {/* Decorative perforated line in the middle */}
            <div className="absolute left-1/3 top-0 bottom-0 w-0 border-l-2 border-dashed border-gray-300 z-10"></div>
            
            {/* Circular cutouts for tear effect */}
            <div className="absolute left-1/3 top-0 w-6 h-6 bg-summer rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute left-1/3 top-1/4 w-6 h-6 bg-summer rounded-full -translate-x-1/2"></div>
            <div className="absolute left-1/3 top-1/2 w-6 h-6 bg-summer rounded-full -translate-x-1/2"></div>
            <div className="absolute left-1/3 top-3/4 w-6 h-6 bg-summer rounded-full -translate-x-1/2"></div>
            <div className="absolute left-1/3 bottom-0 w-6 h-6 bg-summer rounded-full -translate-x-1/2 translate-y-1/2"></div>

            {/* Top decorative border */}
            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-coral via-pink-500 to-peach"></div>

            <div className="flex flex-col md:flex-row min-h-[500px]">
              {/* Left Stub - Receipt ID and Basic Info */}
              <div className="w-full md:w-1/3 p-8 flex flex-col justify-between bg-gradient-to-br from-coral/5 to-peach/10 relative">
                <div>
                  <div className="text-center mb-6">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-5xl text-teal-light mb-3" />
                    <h2 className="text-xl font-display font-bold text-warmGray mb-1">
                      Confirmado!
                    </h2>
                    <p className="text-xs text-warmGray-light uppercase tracking-wider">Recibo</p>
                  </div>

                  <div className="bg-white/70 rounded-lg p-4 mb-4 shadow-sm">
                    <p className="text-xs text-warmGray-light uppercase tracking-wider mb-2 text-center">ID do Recibo</p>
                    <p className="font-mono text-sm font-bold text-coral text-center break-all">
                      {formatReceiptId(id || '')}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-white/70 rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-warmGray-light uppercase tracking-wider">Rifa</p>
                      <p className="font-semibold text-warmGray text-sm">{raffle.title}</p>
                    </div>

                    <div className="bg-white/70 rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-warmGray-light uppercase tracking-wider mb-2">Números ({selections.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selections.map((s: any) => (
                          <span key={s._id} className="bg-coral text-white px-2 py-0.5 rounded-full font-bold text-xs shadow-sm">
                            {s.number}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-4">
                  <FontAwesomeIcon icon={faTicketAlt} className="text-4xl text-coral/20" />
                </div>
              </div>

              {/* Right Main Body - Details and Actions */}
              <div className="w-full md:w-2/3 p-8 flex flex-col">
                <div className="flex-1">
                  <h1 className="text-2xl font-display font-bold text-warmGray mb-6">
                    Detalhes da Reserva
                  </h1>

                  {/* User Info */}
                  <div className="bg-white/70 rounded-lg p-5 mb-5 shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-warmGray mb-3 flex items-center uppercase tracking-wider">
                      <FontAwesomeIcon icon={faUser} className="mr-2 text-coral" />
                      Seus Dados
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-warmGray-light uppercase tracking-wider mb-1">Contato Principal</p>
                        <p className="font-semibold text-warmGray flex items-center capitalize">
                          <FontAwesomeIcon icon={getContactIcon(user.preferredContact)} className="mr-2 text-sm" />
                          {user.preferredContact}
                        </p>
                      </div>
                      
                      {user.whatsapp && (
                        <div>
                          <p className="text-xs text-warmGray-light uppercase tracking-wider mb-1">WhatsApp</p>
                          <p className="font-semibold text-warmGray">{user.whatsapp}</p>
                        </div>
                      )}
                      
                      {user.instagramHandle && (
                        <div>
                          <p className="text-xs text-warmGray-light uppercase tracking-wider mb-1">Instagram</p>
                          <p className="font-semibold text-warmGray">{user.instagramHandle}</p>
                        </div>
                      )}

                      {user.xHandle && (
                        <div>
                          <p className="text-xs text-warmGray-light uppercase tracking-wider mb-1">X / Twitter</p>
                          <p className="font-semibold text-warmGray">{user.xHandle}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-warmGray-light flex items-center">
                        <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                        Reservado em: {formatDate(firstSelection.selectedAt)}
                      </p>
                    </div>
                  </div>

                  {/* PIX Payment */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-5 mb-5 shadow-sm border border-green-100">
                    <h3 className="text-sm font-bold text-warmGray mb-3 uppercase tracking-wider">💳 Pagamento via PIX</h3>
                    <div className="text-sm space-y-2">
                      <p className="text-warmGray">
                        <strong className="text-2xl text-coral font-display">R$ {(selections.length * (raffle.price || 0)).toFixed(2)}</strong>
                      </p>
                      <p className="text-warmGray-light">
                        Chave: <strong className="text-warmGray">{raffle.pixKey}</strong>
                      </p>
                      <p className="text-warmGray-light">
                        Nome: <strong className="text-warmGray">{raffle.pixName}</strong>
                      </p>
                      <p className="text-xs text-orange-600 font-semibold mt-2">
                        ⏰ Prazo: 30 minutos
                      </p>
                    </div>
                    {raffle.pixQRCode && (
                      <div className="mt-4 text-center bg-white rounded p-3">
                        <img src={raffle.pixQRCode} alt="PIX QR Code" className="mx-auto h-32 w-auto" />
                      </div>
                    )}
                  </div>

                  {/* Upload Receipt */}
                  <div className="bg-white/70 rounded-lg p-5 mb-5 shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-warmGray mb-3 uppercase tracking-wider">📎 Enviar Comprovante</h3>
                    
                    {uploadSuccess ? (
                      <div className="text-center p-4 bg-green-100 rounded-lg text-green-700">
                        <FontAwesomeIcon icon={faCheckCircle} className="text-2xl mb-2" />
                        <p className="font-semibold">Comprovante enviado!</p>
                        <p className="text-sm">Aguarde a confirmação.</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-warmGray-light text-xs mb-3">
                          Envie o comprovante de pagamento para confirmar sua participação.
                        </p>
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
                          className={`btn btn-primary w-full cursor-pointer flex items-center justify-center text-sm ${uploading ? 'opacity-70 cursor-not-allowed' : ''}`}
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
                        <p className="text-xs text-center text-warmGray-light mt-2">
                          Imagem ou PDF (Max 5MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Link copiado!');
                    }}
                    className="btn btn-secondary text-sm"
                  >
                    <FontAwesomeIcon icon={faShareAlt} className="mr-2" />
                    Copiar Link
                  </button>
                  
                  <button 
                    onClick={() => navigate('/')}
                    className="btn btn-outline text-sm"
                  >
                    <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                    Início
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative ticket corner tears */}
          <div className="absolute -top-2 -left-2 w-8 h-8 bg-coral/10 rounded-full"></div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-peach/10 rounded-full"></div>
          <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-mint/10 rounded-full"></div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-pink-300/10 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
