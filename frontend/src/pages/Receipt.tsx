import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, faTicketAlt, faCalendarAlt, faUser, faShareAlt
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
      timeZone: 'America/Sao_Paulo',
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
    <div className="min-h-screen bg-summer py-8 px-4 flex items-center justify-center">
      <div className="max-w-5xl w-full mx-auto">
        {/* Raffle Ticket Design - Horizontal Layout */}
        <div className="relative animate-fadeIn drop-shadow-2xl">
          
          <div className="flex flex-col md:flex-row bg-white rounded-xl overflow-hidden min-h-[500px]">
            
            {/* Left Stub */}
            <div className="w-full md:w-1/3 bg-[#FFF0F5] p-8 flex flex-col relative border-r-2 border-dashed border-gray-300">
              {/* Decorative semi-circles for perforation effect */}
              <div className="absolute -right-3 top-0 w-6 h-6 bg-summer rounded-full"></div>
              <div className="absolute -right-3 bottom-0 w-6 h-6 bg-summer rounded-full"></div>
              
              {/* Title */}
              <div className="mb-8">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">RIFA</h2>
                <p className="text-xl font-bold text-gray-800 leading-tight">{raffle.title}</p>
              </div>

              {/* Numbers */}
              <div className="mb-8">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">NÚMEROS ({selections.length})</p>
                <div className="flex flex-wrap gap-2">
                  {selections.map((s: any) => (
                    <span key={s._id} className="bg-[#FF8FAB] text-white w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm shadow-sm">
                      {s.number}
                    </span>
                  ))}
                </div>
              </div>

              {/* User Data */}
              <div className="flex-1">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                  <FontAwesomeIcon icon={faUser} className="mr-2 text-[#FF8FAB]" />
                  SEUS DADOS
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">CONTATO PRINCIPAL</p>
                    <p className="text-sm font-bold text-gray-700 flex items-center capitalize">
                      <FontAwesomeIcon icon={getContactIcon(user.preferredContact)} className="mr-2 text-gray-400" />
                      {user.preferredContact}
                    </p>
                  </div>
                  
                  {user.whatsapp && (
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">WHATSAPP</p>
                      <p className="text-sm font-bold text-gray-700">{user.whatsapp}</p>
                    </div>
                  )}
                  
                  {user.instagramHandle && (
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">INSTAGRAM</p>
                      <p className="text-sm font-bold text-gray-700">{user.instagramHandle}</p>
                    </div>
                  )}

                  {user.xHandle && (
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">X / TWITTER</p>
                      <p className="text-sm font-bold text-gray-700">{user.xHandle}</p>
                    </div>
                  )}

                  <div className="pt-2 mt-2">
                    <p className="text-xs text-gray-500 flex items-center font-medium">
                      <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 opacity-50" />
                      {formatDate(firstSelection.selectedAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Icon */}
              <div className="mt-6 flex justify-center opacity-10">
                <FontAwesomeIcon icon={faTicketAlt} className="text-5xl text-[#FF8FAB]" />
              </div>
            </div>

            {/* Right Main Body */}
            <div className="w-full md:w-2/3 p-8 bg-white flex flex-col relative">
              {/* Header */}
              <div className="flex justify-between items-start mb-8">
                <h1 className="text-2xl font-bold text-gray-700 tracking-tight">Detalhes da Reserva</h1>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">ID DO RECIBO DA RESERVA</p>
                  <p className="text-sm font-bold text-[#FF8FAB] font-mono tracking-widest">{formatReceiptId(id!)}</p>
                </div>
              </div>

              {/* PIX Payment */}
              <div className="bg-[#F0FFF4] rounded-lg p-6 mb-8 border border-green-100">
                <div className="flex items-center mb-4">
                  <span className="text-green-600 font-bold text-xs uppercase tracking-wider flex items-center">
                    <span className="mr-2 text-lg">💳</span> PAGAMENTO VIA PIX
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
                  <div className="text-4xl font-bold text-[#FF8FAB]">
                    R$ {(selections.length * (raffle.price || 0)).toFixed(2)}
                  </div>
                  <div className="text-right text-sm text-gray-600 space-y-1">
                    <p>Chave: <span className="font-bold text-gray-800">{raffle.pixKey}</span></p>
                    <p>Nome: <span className="font-bold text-gray-800">{raffle.pixName}</span></p>
                  </div>
                </div>
              </div>

              {/* Upload Section */}
              <div className="mb-8">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                  <span className="mr-2 text-gray-400">📎</span> ENVIAR COMPROVANTE
                </h3>
                
                {uploadSuccess ? (
                  <div className="text-center p-6 bg-green-50 rounded-lg text-green-700 border border-green-100">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-3xl mb-2" />
                    <p className="font-bold">Comprovante enviado com sucesso!</p>
                    <p className="text-sm opacity-80">Sua participação será confirmada em breve.</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-gray-400 mb-4">
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
                      className={`w-full bg-[#FF8FAB] hover:bg-[#FF7AA0] text-white font-bold py-3 px-4 rounded-lg cursor-pointer flex items-center justify-center transition-colors shadow-sm ${uploading ? 'opacity-70 cursor-not-allowed' : ''}`}
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
                    <p className="text-[10px] text-center text-gray-400 mt-2">
                      Imagem ou PDF (Max 5MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Warning */}
              <div className="mt-auto text-center">
                <p className="text-xs font-bold text-gray-800 uppercase tracking-wide leading-relaxed">
                  NÚMEROS RESERVADOS POR 10 MINUTOS.<br/>
                  APÓS ISSO SERÃO DISPONIBILIZADOS PARA SELEÇÃO NOVAMENTE
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
