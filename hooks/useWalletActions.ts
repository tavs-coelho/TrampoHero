import React from 'react';
import { UserProfile, Transaction } from '../types';

export const useWalletActions = (deps: {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  depositAmount: string;
  setDepositAmount: React.Dispatch<React.SetStateAction<string>>;
  paymentMethod: 'pix' | 'card';
  cardData: { number: string; name: string; expiry: string; cvv: string };
  setCardData: React.Dispatch<React.SetStateAction<{ number: string; name: string; expiry: string; cvv: string }>>;
  setIsProcessingPayment: React.Dispatch<React.SetStateAction<boolean>>;
  setShowPaymentModal: React.Dispatch<React.SetStateAction<boolean>>;
  showToast: (msg: string, type?: 'success'|'error'|'info') => void;
}) => {
  const {
    user, setUser, depositAmount, setDepositAmount,
    paymentMethod, cardData, setCardData,
    setIsProcessingPayment, setShowPaymentModal, showToast
  } = deps;

  const handleWithdraw = () => {
    if (user.wallet.balance <= 0) {
      showToast("Saldo indisponível para saque.", "error");
      return;
    }
    const pixKey = prompt("Digite sua chave PIX (CPF, Celular ou Email):");
    if (!pixKey) return;
    
    // Validate PIX key format (basic validation for Brazilian formats)
    const cpfRegex = /^\d{11}$/; // CPF: exactly 11 digits
    const phoneRegex = /^\+?55\d{10,11}$/; // Brazilian phone: +55 followed by 10-11 digits
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // Standard email format
    
    const isValidPixKey = cpfRegex.test(pixKey.replace(/\D/g, '')) || 
                         phoneRegex.test(pixKey.replace(/\D/g, '')) || 
                         emailRegex.test(pixKey);
    
    if (!isValidPixKey) {
      showToast("Chave PIX inválida. Use CPF (11 dígitos), celular (+55) ou e-mail válido.", "error");
      return;
    }
    
    const amountToWithdraw = user.wallet.balance;
    const fee = user.isPrime ? 0 : 2.50; // Taxa de saque para não-Prime
    
    if (confirm(`Confirmar saque de R$ ${amountToWithdraw.toFixed(2)} para a chave PIX: ${pixKey}?\nTaxa: R$ ${fee.toFixed(2)} ${user.isPrime ? '(Prime: Isento)' : ''}`)) {
        showToast("Processando transferência...", "info");
        setTimeout(() => {
            const newTransaction: Transaction = {
                id: Date.now().toString(),
                type: 'withdrawal',
                amount: -(amountToWithdraw + fee),
                date: new Date().toLocaleDateString('pt-BR'),
                description: `Saque PIX (${pixKey})`,
                fee: fee
            };
            setUser(prev => ({
                ...prev,
                wallet: { ...prev.wallet, balance: 0, transactions: [newTransaction, ...prev.wallet.transactions] }
            }));
            showToast("PIX realizado com sucesso!", "success");
        }, 2000);
    }
  };

  const handleAnticipate = () => {
    // Taxa variável entre 3% e 5% para não-Prime, 0% para Prime
    const randomFee = (Math.random() * (0.05 - 0.03) + 0.03); 
    const feeRate = user.isPrime ? 0 : randomFee;
    
    const scheduled = user.wallet.scheduled;
    if (scheduled <= 0) {
        showToast("Você não possui saldo agendado para antecipar.", "info");
        return;
    }

    const feeAmount = scheduled * feeRate;
    const netAmount = scheduled - feeAmount;
    const feePercentage = (feeRate * 100).toFixed(1);

    if (confirm(`Hero Pay - Antecipação de Recebíveis\n\nDeseja antecipar seus ganhos da próxima semana?\n\nValor Bruto: R$ ${scheduled.toFixed(2)}\nTaxa (${feePercentage}%): -R$ ${feeAmount.toFixed(2)}\n\nValor Líquido a Receber: R$ ${netAmount.toFixed(2)}`)) {
      const newTransaction: Transaction = {
        id: Date.now().toString(), type: 'anticipation', amount: netAmount, date: new Date().toLocaleDateString('pt-BR'),
        description: `Antecipação Hero Pay (${feePercentage}%)`, fee: feeAmount
      };
      setUser(prev => ({ 
        ...prev, 
        wallet: { 
          ...prev.wallet, balance: prev.wallet.balance + netAmount, scheduled: 0, transactions: [newTransaction, ...prev.wallet.transactions]
        } 
      }));
      showToast(`R$ ${netAmount.toFixed(2)} antecipados com sucesso!`, "success");
    }
  };

  const handleOpenAddBalance = () => {
    setDepositAmount('');
    setShowPaymentModal(true);
  };

  const handleProcessPayment = () => {
      const amount = parseFloat(depositAmount);
      if (isNaN(amount) || amount <= 0) {
          showToast("Valor inválido.", "error");
          return;
      }

      if (paymentMethod === 'card') {
         if (cardData.number.length < 13 || !cardData.name || !cardData.cvv) {
             showToast("Dados do cartão incompletos.", "error");
             return;
         }
         
         // Validate CVV (3-4 digits)
         if (cardData.cvv.length < 3 || cardData.cvv.length > 4 || !/^\d+$/.test(cardData.cvv)) {
             showToast("CVV inválido. Use 3 ou 4 dígitos.", "error");
             return;
         }
         
         // Validate expiry date format (MM/YY)
         if (!cardData.expiry || !/^\d{2}\/\d{2}$/.test(cardData.expiry)) {
             showToast("Data de validade inválida. Use MM/AA.", "error");
             return;
         }
         
         // Check if expiry date is in the future
         const [month, year] = cardData.expiry.split('/').map(Number);
         const currentDate = new Date();
         const currentMonth = currentDate.getMonth() + 1;
         
         // Convert 2-digit year to 4-digit (assuming 20xx for years 00-99)
         const fullYear = year < 100 ? 2000 + year : year;
         const currentFullYear = currentDate.getFullYear();
         
         if (fullYear < currentFullYear || (fullYear === currentFullYear && month < currentMonth)) {
             showToast("Cartão vencido. Verifique a data de validade.", "error");
             return;
         }
      }

      setIsProcessingPayment(true);
      
      // Simulação de delay de rede
      setTimeout(() => {
          setIsProcessingPayment(false);
          const newTransaction: Transaction = {
              id: Date.now().toString(),
              type: 'deposit',
              amount: amount,
              date: new Date().toLocaleDateString('pt-BR'),
              description: `Depósito via ${paymentMethod === 'pix' ? 'PIX' : 'Cartão'}`
          };

          setUser(prev => ({
              ...prev,
              wallet: {
                  ...prev.wallet,
                  balance: prev.wallet.balance + amount,
                  transactions: [newTransaction, ...prev.wallet.transactions]
              }
          }));

          setShowPaymentModal(false);
          showToast(`Depósito de R$ ${amount.toFixed(2)} confirmado!`, "success");
          setDepositAmount('');
          setCardData({ number: '', name: '', expiry: '', cvv: '' });
      }, 2000);
  };

  return {
    handleWithdraw,
    handleAnticipate,
    handleOpenAddBalance,
    handleProcessPayment,
  };
};
