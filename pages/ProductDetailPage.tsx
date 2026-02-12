import React, { useState } from 'react';
import { ArrowLeft, MessageCircle, Star, ShoppingCart } from 'lucide-react';
import { Product } from '../types';
import ReviewModal from '../components/ReviewModal';
import { createReview } from '../services/backendService';
import { supabase } from '../services/supabaseClient';

interface ProductDetailPageProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product) => void;
  isAuthenticated?: boolean;
  onRequireAuth?: () => void;
}

const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  onBack,
  onAddToCart,
  isAuthenticated,
  onRequireAuth
}) => {
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const ratingStats = {
    rating: product.rating || 0,
    count: product.reviewCount || product.reviews?.length || 0
  };

  const vendorName = product.supplier || 'Vendeur';
  const whatsappLink = `https://wa.me/22500000000?text=Bonjour, je souhaite négocier pour : ${product.name} (Ref: ${product.id})`;
  const stockRemaining = product.stock ?? 0;
  const stockPercent = Math.min(100, Math.round((stockRemaining / 100) * 100));
  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  const handleReviewSubmit = async (rating: number, comment: string) => {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return;
    await createReview(product.id, rating, comment, data.user.id, data.user.user_metadata?.full_name);
    setIsReviewOpen(false);
  };

  const handleAvisClick = () => {
    if (!isAuthenticated && onRequireAuth) {
      onRequireAuth();
      return;
    }
    setIsReviewOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white pb-[calc(54px+env(safe-area-inset-bottom))]">
      {/* Zone Image + Bouton Retour */}
      <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        <span className="absolute top-2 left-2 z-10 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-sm">-{discount}%</span>
        <button
          type="button"
          onClick={onBack}
          className="absolute top-[max(16px,env(safe-area-inset-top))] right-4 z-20 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-[#064e3b] hover:bg-gray-50 active:scale-95 transition-transform"
          aria-label="Retour"
        >
          <ArrowLeft size={22} />
        </button>
      </div>

      {/* Zone Informations (scrollable) */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
        <h1 className="text-[20px] font-bold text-[#0f172a] leading-tight mb-2">{product.name}</h1>

        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-[18px] font-bold text-[#064e3b]">{product.price.toLocaleString('fr-CI')} F</span>
          <span className="text-[13px] text-gray-400 line-through">{product.originalPrice.toLocaleString('fr-CI')} F</span>
        </div>

        <div className="mb-4">
          <p className="text-[12px] font-bold text-gray-700 mb-1">{stockRemaining} restants</p>
          <div className="h-2 rounded-[10px] bg-[#E0E0E0] overflow-hidden">
            <div
              className="h-full rounded-[10px] transition-all duration-300"
              style={{ width: `${stockPercent}%`, backgroundColor: '#2E7D32' }}
            />
          </div>
        </div>

        {/* Bloc Détails */}
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <div className="flex justify-between text-[12px] font-semibold text-gray-600">
            <span>Vendeur: <span className="text-[#064e3b]">{vendorName}</span></span>
            <span className={product.status === 'DATE_COURTE' ? 'text-red-500' : ''}>
              DLUO: {new Date(product.expiryDate).toLocaleDateString('fr-FR')}
            </span>
          </div>

          {product.description && (
            <div className="mt-4 pt-4 border-t border-gray-100 mb-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Description du produit
              </p>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={16}
                  className={s <= Math.round(ratingStats.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}
                />
              ))}
            </div>
            <span className="text-[12px] text-gray-500">({ratingStats.count} avis)</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-emerald-50 text-[#064e3b] border border-emerald-200 py-3 text-[13px] font-bold uppercase rounded-lg"
            >
              <MessageCircle size={18} /> Contacter WhatsApp
            </a>
            <button
              type="button"
              onClick={handleAvisClick}
              className="flex items-center justify-center gap-2 border border-gray-200 text-gray-700 py-3 text-[13px] font-bold uppercase rounded-lg hover:bg-gray-50"
            >
              <Star size={18} /> Voir / Laisser un avis
            </button>
          </div>
        </div>
      </div>

      {/* Sticky CTA - Ajouter au panier */}
      <div
        className="fixed left-0 right-0 bottom-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <button
          type="button"
          onClick={() => onAddToCart(product)}
          className="w-full h-[54px] bg-[#064e3b] text-white text-[16px] font-bold uppercase tracking-wide hover:bg-[#065f46] active:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <ShoppingCart size={20} />
          Ajouter au panier
        </button>
      </div>

      {isReviewOpen && (
        <ReviewModal
          product={product}
          onClose={() => setIsReviewOpen(false)}
          onSubmit={handleReviewSubmit}
        />
      )}
    </div>
  );
};

export default ProductDetailPage;
