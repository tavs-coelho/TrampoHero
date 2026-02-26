import React from 'react';
import { UserProfile, Job, Transaction, Invoice, Referral, StoreProduct, StoreOrder } from '../types';
import { REFERRAL_BONUS_FREELANCER, REFERRAL_BONUS_EMPLOYER, DELIVERY_DAYS_MS } from '../data/constants';
import { ViewType } from '../contexts/AppContext';

export const useStoreActions = (deps: {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  jobs: Job[];
  cart: { productId: string; quantity: number }[];
  setCart: React.Dispatch<React.SetStateAction<{ productId: string; quantity: number }[]>>;
  storeProducts: StoreProduct[];
  setView: React.Dispatch<React.SetStateAction<ViewType>>;
  showToast: (msg: string, type?: 'success'|'error'|'info') => void;
}) => {
  const { user, setUser, jobs, cart, setCart, storeProducts, setView, showToast } = deps;

  const handleStoreCheckout = () => {
    if (cart.length === 0) {
      showToast("Carrinho vazio. Adicione produtos primeiro.", "error");
      return;
    }
    
    // Calculate total
    let total = 0;
    const orderItems = cart.map(item => {
      const product = storeProducts.find(p => p.id === item.productId);
      if (product) {
        total += product.price * item.quantity;
        return {
          productId: item.productId,
          name: product.name,
          quantity: item.quantity,
          price: product.price
        };
      }
      return null;
    }).filter(Boolean);
    
    // Check if user has enough balance
    if (user.wallet.balance < total) {
      showToast(`Saldo insuficiente. Você precisa de R$ ${(total - user.wallet.balance).toFixed(2)} a mais.`, "error");
      return;
    }
    
    if (confirm(`Confirmar compra de ${cart.length} itens?\nTotal: R$ ${total.toFixed(2)}`)) {
      // Create order and transaction
      const newOrder: StoreOrder = {
        id: `order-${Date.now()}`,
        userId: user.id,
        items: orderItems as any[],
        total: total,
        status: 'confirmed',
        orderDate: new Date().toISOString(),
        // DELIVERY_DAYS represents calendar days (not business days)
        deliveryDate: new Date(Date.now() + DELIVERY_DAYS_MS).toISOString().split('T')[0],
        trackingCode: `TH${Date.now().toString().slice(-8)}`
      } as any;
      
      const newTransaction: Transaction = {
        id: `store-${Date.now()}`,
        type: 'withdrawal',
        amount: -total,
        date: new Date().toLocaleDateString('pt-BR'),
        description: `Compra TrampoStore - ${cart.length} itens`
      };
      
      setUser(prev => ({
        ...prev,
        wallet: {
          ...prev.wallet,
          balance: prev.wallet.balance - total,
          transactions: [newTransaction, ...prev.wallet.transactions]
        }
      }));
      
      setCart([]);
      showToast(`Pedido confirmado! Rastreio: ${newOrder.trackingCode}`, "success");
    }
  };

  const handleApplyReferralCode = (referralCode: string) => {
    // Simulate checking referral code
    if (!referralCode || referralCode.length < 5) {
      showToast("Código de indicação inválido.", "error");
      return;
    }
    
    // In a real implementation, this would check against database
    // For now, we'll accept any code that's not the user's own
    if (referralCode === user.referralCode) {
      showToast("Você não pode usar seu próprio código de indicação.", "error");
      return;
    }
    
    // Create a referral record
    // Note: In production, the referrerId should be looked up from the database
    // using the referral code. Using a placeholder here for demo purposes.
    const newReferral: Referral = {
      id: `ref-${Date.now()}`,
      referrerId: `PENDING_LOOKUP_${referralCode}`, // TODO: Lookup actual user ID in production
      referredId: user.id,
      referredRole: user.role,
      status: 'pending',
      reward: user.role === 'freelancer' ? REFERRAL_BONUS_FREELANCER : REFERRAL_BONUS_EMPLOYER,
      createdDate: new Date().toISOString()
    };
    
    // Update user with referral info
    setUser(prev => ({
      ...prev,
      referrals: [...(prev.referrals || []), newReferral]
    }));
    
    showToast(`Código aplicado! Ganhe R$ ${newReferral.reward} no seu primeiro trabalho!`, "success");
  };
  
  const handleCompleteReferral = (referralId: string) => {
    // Called when user completes their first job
    setUser(prev => {
      const referral = prev.referrals?.find(r => r.id === referralId);
      if (!referral || referral.status !== 'pending') return prev;
      
      const updatedReferrals = (prev.referrals || []).map(r =>
        r.id === referralId ? { ...r, status: 'completed' as const, completedDate: new Date().toISOString() } : r
      );
      
      // Add bonus to wallet
      const newTransaction: Transaction = {
        id: `ref-bonus-${Date.now()}`,
        type: 'referral_bonus',
        amount: referral.reward,
        date: new Date().toLocaleDateString('pt-BR'),
        description: `Bônus de Indicação`
      };
      
      return {
        ...prev,
        referrals: updatedReferrals,
        wallet: {
          ...prev.wallet,
          balance: prev.wallet.balance + referral.reward,
          transactions: [newTransaction, ...prev.wallet.transactions]
        }
      };
    });
    
    showToast("Bônus de indicação creditado! 🎉", "success");
  };

  const handleShowInvoices = () => {
    // Gera notas fiscais para jobs completados se ainda não existirem
    const completedJobs = jobs.filter(j => j.status === 'completed' && j.employerId === user.id);
    const existingInvoiceJobIds = (user.invoices || []).map(inv => inv.jobId);
    
    // Gera invoices para jobs que ainda não tem
    const newInvoices: Invoice[] = completedJobs
      .filter(job => !existingInvoiceJobIds.includes(job.id))
      .map(job => ({
        id: `inv-${job.id}`,
        jobId: job.id,
        jobTitle: job.title,
        amount: job.payment,
        date: new Date().toLocaleDateString('pt-BR')
        // downloadUrl removido - será implementado com geração real de PDF
      }));
    
    if (newInvoices.length > 0) {
      setUser(prev => ({
        ...prev,
        invoices: [...(prev.invoices || []), ...newInvoices]
      }));
      showToast(`${newInvoices.length} nota(s) fiscal(is) gerada(s) com sucesso!`, "success");
    } else if ((user.invoices || []).length > 0) {
      showToast(`Você tem ${user.invoices.length} nota(s) fiscal(is) disponível(is).`, "info");
    } else {
      showToast("Nenhum trabalho concluído para gerar notas fiscais.", "info");
    }
    
    // Mostra painel de invoices
    setView('profile');
  };

  return {
    handleStoreCheckout,
    handleApplyReferralCode,
    handleCompleteReferral,
    handleShowInvoices,
  };
};
