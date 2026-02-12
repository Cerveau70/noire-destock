import React from 'react';
import { Heart, ArrowLeft } from 'lucide-react';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

interface FavorisProps {
  products: Product[];
  favoriteIds: string[];
  onToggleFavorite: (productId: string) => void;
  onAddToCart: (p: Product) => void;
  onOpenProduct?: (productId: string) => void;
  contactChannel: 'whatsapp' | 'messages';
  onContactChannelChange: (channel: 'whatsapp' | 'messages') => void;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
  onStartChat: (sellerId?: string) => void;
  onBack?: () => void;
}

const Favoris: React.FC<FavorisProps> = ({
  products,
  favoriteIds,
  onToggleFavorite,
  onAddToCart,
  onOpenProduct,
  contactChannel,
  onContactChannelChange,
  isAuthenticated,
  onRequireAuth,
  onStartChat,
  onBack
}) => {
  const favorisProducts = products.filter(p => favoriteIds.includes(p.id));
  const byCategory = React.useMemo(() => {
    const map = new Map<string, Product[]>();
    favorisProducts.forEach((p) => {
      const cat = p.category || 'Autres';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    });
    return Array.from(map.entries());
  }, [favorisProducts]);

  return (
    <div className="max-w-7xl mx-auto w-full py-6 md:py-8 pb-24 md:pb-8 min-w-0 box-border">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#0f172a] uppercase tracking-tight">Favoris</h1>
          <p className="text-gray-500 mt-1 text-sm">{favorisProducts.length} produit(s) en favori</p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="shrink-0 p-2 rounded-lg border border-gray-200 bg-white text-[#064e3b] hover:bg-emerald-50 active:scale-95 transition-all"
            aria-label="Retour"
          >
            <ArrowLeft size={24} />
          </button>
        )}
      </div>

      {favorisProducts.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-100 shadow-sm flex flex-col items-center">
          <div className="p-4 bg-gray-50 rounded-full text-gray-300 mb-4"><Heart size={48} /></div>
          <h3 className="text-lg font-bold text-[#0f172a] mb-2">Aucun favori</h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">Ajoutez des produits en favori depuis le catalogue pour les retrouver ici.</p>
        </div>
      ) : (
        <div className="space-y-6 md:space-y-8">
          {byCategory.map(([category, list]) => (
            <div key={category}>
              <h3 className="mobile-h2 text-[14px] md:text-lg font-semibold text-[#0f172a] uppercase tracking-wide mb-2">{category}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {list.map((product) => (
                  <div key={product.id} className="min-w-0">
                    <ProductCard
                      product={product}
                      onAddToCart={onAddToCart}
                      isFavorite={favoriteIds.includes(product.id)}
                      onToggleFavorite={onToggleFavorite}
                      onProductClick={onOpenProduct}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favoris;
