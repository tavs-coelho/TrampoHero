import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { apiService } from '../../services/apiService';

export interface PaymentModalProps {
  depositAmount: string;
  setDepositAmount: (value: string) => void;
  paymentMethod: 'pix' | 'card';
  setPaymentMethod: (method: 'pix' | 'card') => void;
  isProcessingPayment: boolean;
  setIsProcessingPayment: (value: boolean) => void;
  /** Called for PIX payments (non-Stripe flow). */
  handleProcessPayment: () => void;
  /** Called after a Stripe card payment succeeds, with the deposited BRL amount. */
  onPaymentSuccess: (amount: number) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onClose: () => void;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1e293b',
      fontFamily: 'inherit',
      '::placeholder': { color: '#94a3b8' },
    },
    invalid: { color: '#ef4444' },
  },
};

const PaymentModal: React.FC<PaymentModalProps> = ({
  depositAmount,
  setDepositAmount,
  paymentMethod,
  setPaymentMethod,
  isProcessingPayment,
  setIsProcessingPayment,
  handleProcessPayment,
  onPaymentSuccess,
  showToast,
  onClose,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (paymentMethod === 'pix') {
      handleProcessPayment();
      return;
    }

    // Card flow via Stripe Elements
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Valor inválido.', 'error');
      return;
    }

    if (!stripe || !elements) {
      showToast('Stripe não carregado. Tente novamente.', 'error');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      showToast('Dados do cartão inválidos.', 'error');
      return;
    }

    setIsProcessingPayment(true);
    setCardError(null);

    try {
      // 1. Ask the backend to create a PaymentIntent
      const intentResult = await apiService.createPaymentIntent(amount);
      if (!intentResult.success || !intentResult.data) {
        showToast(intentResult.error || 'Erro ao criar pagamento.', 'error');
        setIsProcessingPayment(false);
        return;
      }

      const { clientSecret } = intentResult.data as { clientSecret: string };

      // 2. Confirm the card payment using Stripe.js
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (error) {
        setCardError(error.message ?? 'Erro no pagamento.');
        showToast(error.message ?? 'Erro no pagamento.', 'error');
        setIsProcessingPayment(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        onPaymentSuccess(amount);
        showToast(`Depósito de R$ ${amount.toFixed(2)} confirmado!`, 'success');
        onClose();
      }
    } catch (err) {
      showToast('Erro inesperado. Tente novamente.', 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

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
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <CardElement options={CARD_ELEMENT_OPTIONS} />
                        </div>
                        {cardError && (
                            <p className="text-xs text-red-500 font-medium">{cardError}</p>
                        )}
                        <p className="text-[10px] text-slate-400 text-center">
                            <i className="fas fa-lock mr-1"></i> Pagamento seguro via Stripe
                        </p>
                    </div>
                )}

                <button 
                    onClick={handleConfirm}
                    disabled={isProcessingPayment || !depositAmount || (paymentMethod === 'card' && !stripe)}
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
