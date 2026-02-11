import React from 'react';
import { Heart } from 'lucide-react';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

interface FavorisProps {
  products: Product[];
  favoriteIds: string[];
  onToggleFavorite: (productId: string) => void;
  onAddToCart: (p: Product) => void;
  contactChannel: 'whatsapp' | 'messages';
  onContactChannelChange: (channel: 'whatsapp' | 'messages') => void;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
  onStartChat: (sellerId?: string) => void;
}

const Favoris: React.FC<FavorisProps> = ({
  products,
  favoriteIds,
  onToggleFavorite,
  onAddToCart,
  contactChannel,
  onContactChannelChange,
  isAuthenticated,
  onRequireAuth,
  onStartChat
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
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 pb-24 md:pb-8">
      <div className="flex justify-between items-end mb-6 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#0f172a] uppercase tracking-tight">Favoris</h1>
          <p className="text-gray-500 mt-1 text-sm">{favorisProducts.length} produit(s) en favori</p>
        </div>
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
                      contactChannel={contactChannel}
                      onContactChannelChange={onContactChannelChange}
                      isAuthenticated={isAuthenticated}
                      onRequireAuth={onRequireAuth}
                      onStartChat={onStartChat}
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
