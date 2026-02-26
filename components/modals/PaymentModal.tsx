import React from 'react';

export interface PaymentModalProps {
  depositAmount: string;
  setDepositAmount: (value: string) => void;
  paymentMethod: 'pix' | 'card';
  setPaymentMethod: (method: 'pix' | 'card') => void;
  cardData: { number: string; name: string; expiry: string; cvv: string };
  setCardData: React.Dispatch<React.SetStateAction<{ number: string; name: string; expiry: string; cvv: string }>>;
  isProcessingPayment: boolean;
  handleProcessPayment: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  depositAmount,
  setDepositAmount,
  paymentMethod,
  setPaymentMethod,
  cardData,
  setCardData,
  isProcessingPayment,
  handleProcessPayment,
  showToast,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-6 animate-in fade-in duration-300">
        <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl relative">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-black text-slate-900 text-lg">Adicionar Saldo</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            
            <div className="p-6 space-y-6">
                <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Valor do Depósito (R$)</label>
                    <input 
                        type="number" 
                        value={depositAmount} 
                        onChange={(e) => setDepositAmount(e.target.value)} 
                        className="w-full p-4 bg-slate-50 rounded-2xl font-black text-2xl text-slate-900 focus:outline-indigo-500 border border-transparent focus:border-indigo-200 transition-all text-center" 
                        placeholder="0,00" 
                    />
                </div>

                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                    <button onClick={() => setPaymentMethod('pix')} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase transition-all ${paymentMethod === 'pix' ? 'bg-white shadow-md text-emerald-600' : 'text-slate-400'}`}>
                        <i className="fas fa-qrcode mr-1"></i> PIX
                    </button>
                    <button onClick={() => setPaymentMethod('card')} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase transition-all ${paymentMethod === 'card' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}>
                        <i className="fas fa-credit-card mr-1"></i> Cartão
                    </button>
                </div>

                {paymentMethod === 'pix' ? (
                    <div className="text-center py-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="w-40 h-40 bg-white border-2 border-dashed border-emerald-300 rounded-2xl mx-auto flex items-center justify-center mb-4">
                            <i className="fas fa-qrcode text-6xl text-emerald-200"></i>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mb-4">Escaneie o QR Code ou use o Copia e Cola.</p>
                        <button onClick={() => showToast("Código PIX copiado!", "success")} className="text-emerald-600 text-xs font-black uppercase bg-emerald-50 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors">
                            <i className="fas fa-copy mr-1"></i> Copiar Código
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="relative">
                            <i className="fas fa-credit-card absolute left-4 top-4 text-slate-300"></i>
                            <input placeholder="Número do Cartão" value={cardData.number} onChange={(e) => setCardData({...cardData, number: e.target.value})} className="w-full pl-10 p-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 focus:outline-indigo-500" />
                        </div>
                        <div className="flex gap-3">
                            <input placeholder="Validade (MM/AA)" value={cardData.expiry} onChange={(e) => setCardData({...cardData, expiry: e.target.value})} className="flex-1 p-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 focus:outline-indigo-500" />
                            <input placeholder="CVV" value={cardData.cvv} onChange={(e) => setCardData({...cardData, cvv: e.target.value})} className="w-20 p-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 focus:outline-indigo-500" />
                        </div>
                        <input placeholder="Nome no Cartão" value={cardData.name} onChange={(e) => setCardData({...cardData, name: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 focus:outline-indigo-500" />
                    </div>
                )}

                <button 
                    onClick={handleProcessPayment} 
                    disabled={isProcessingPayment || !depositAmount}
                    className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-xl transition-all ${isProcessingPayment ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 active:scale-95'}`}
                >
                    {isProcessingPayment ? (
                        <span className="flex items-center justify-center gap-2"><i className="fas fa-spinner fa-spin"></i> Processando...</span>
                    ) : (
                        `Confirmar ${paymentMethod === 'pix' ? 'Pagamento' : 'Depósito'}`
                    )}
                </button>
            </div>
        </div>
    </div>
  );
};

export default PaymentModal;
