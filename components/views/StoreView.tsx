import React from 'react';
import { StoreProduct } from '../../types';

interface StoreViewProps {
  storeProducts: StoreProduct[];
  cart: { productId: string; quantity: number }[];
  setCart: React.Dispatch<React.SetStateAction<{ productId: string; quantity: number }[]>>;
  handleStoreCheckout: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  setView: (v: 'browse') => void;
}

export const StoreView: React.FC<StoreViewProps> = ({ storeProducts, cart, setCart, handleStoreCheckout, showToast, setView }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <header className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-black text-slate-900">🛒 TrampoStore</h2>
        <p className="text-slate-500 text-sm">Uniformes, EPIs e ferramentas</p>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={handleStoreCheckout}
          className="w-10 h-10 bg-indigo-100 rounded-xl text-indigo-600 hover:bg-indigo-200 relative"
        >
          <i className="fas fa-shopping-cart"></i>
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
              {cart.length}
            </span>
          )}
        </button>
        <button onClick={() => setView('browse')} className="w-10 h-10 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900">
          <i className="fas fa-times"></i>
        </button>
      </div>
    </header>

    {/* Categories */}
    <div className="flex gap-2 overflow-x-auto pb-2">
      <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold whitespace-nowrap">Todos</button>
      <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold whitespace-nowrap">Uniformes</button>
      <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold whitespace-nowrap">EPIs</button>
      <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold whitespace-nowrap">Ferramentas</button>
      <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold whitespace-nowrap">Acessórios</button>
    </div>

    {/* Products Grid */}
    <div className="grid grid-cols-2 gap-4">
      {storeProducts.map(product => (
        <div key={product.id} className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden hover:shadow-lg transition-all">
          {/* Product Image */}
          <div className="aspect-square bg-slate-100 flex items-center justify-center relative">
            <i className="fas fa-box text-4xl text-slate-300"></i>
            {product.originalPrice && (
              <span className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white rounded-lg text-xs font-bold">
                -{Math.round((1 - product.price / product.originalPrice) * 100)}%
              </span>
            )}
            {!product.inStock && (
              <span className="absolute inset-0 bg-slate-900/70 flex items-center justify-center text-white font-bold text-xs">
                Esgotado
              </span>
            )}
          </div>

          {/* Product Info */}
          <div className="p-4">
            <h3 className="font-bold text-sm text-slate-900 mb-1 line-clamp-2">{product.name}</h3>
            
            {/* Rating */}
            <div className="flex items-center gap-1 mb-2">
              <span className="text-amber-500 text-xs">⭐</span>
              <span className="text-xs font-bold text-slate-600">{product.rating}</span>
              <span className="text-xs text-slate-400">({product.reviewCount})</span>
            </div>

            {/* Price */}
            <div className="mb-3">
              {product.originalPrice && (
                <p className="text-xs text-slate-400 line-through">R$ {product.originalPrice.toFixed(2)}</p>
              )}
              <p className="text-lg font-black text-indigo-600">R$ {product.price.toFixed(2)}</p>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={() => {
                if (product.inStock) {
                  setCart(prev => {
                    const existingItem = prev.find(item => item.productId === product.id);
                    if (existingItem) {
                      return prev.map(item => 
                        item.productId === product.id 
                          ? { ...item, quantity: item.quantity + 1 }
                          : item
                      );
                    }
                    return [...prev, { productId: product.id, quantity: 1 }];
                  });
                  showToast('Adicionado ao carrinho!', 'success');
                }
              }}
              disabled={!product.inStock}
              className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                product.inStock 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {product.inStock ? 'Adicionar' : 'Indisponível'}
            </button>
          </div>
        </div>
      ))}
    </div>

    {/* Free Shipping Banner */}
    <div className="bg-emerald-50 p-4 rounded-2xl border-2 border-emerald-200 text-center">
      <p className="font-bold text-emerald-700">
        <i className="fas fa-truck mr-2"></i>
        Frete GRÁTIS acima de R$ 150
      </p>
    </div>
  </div>
);
