import React, { useState } from 'react';
import { ShoppingBag, Clock, AlertTriangle, MessageCircle, Star, ChevronDown, ChevronUp, Plus, Heart, ShoppingCart } from 'lucide-react';
import { Product } from '../types';
import ReviewModal from './ReviewModal';
import { createReview } from '../services/backendService';
import { supabase } from '../services/supabaseClient';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (productId: string) => void;
  contactChannel?: 'whatsapp' | 'messages';
  onContactChannelChange?: (channel: 'whatsapp' | 'messages') => void;
  isAuthenticated?: boolean;
  onRequireAuth?: () => void;
  onStartChat?: (sellerId?: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  isFavorite = false,
  onToggleFavorite,
  contactChannel = 'whatsapp',
  onContactChannelChange,
  isAuthenticated,
  onRequireAuth,
  onStartChat
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [ratingStats, setRatingStats] = useState({
    rating: product.rating || 0,
    count: product.reviewCount || product.reviews?.length || 0
  });

  const getStatusBadge = (status: string) => {
    const baseClass = "text-[10px] font-black uppercase px-2 py-1 border flex items-center tracking-wide";
    switch (status) {
      case 'INVENDU':
        return <span className={`bg-blue-50 text-blue-900 border-blue-100 ${baseClass}`}><ShoppingBag size={8} className="mr-1" /> Surplus</span>;
      case 'DATE_COURTE':
        return <span className={`bg-amber-50 text-amber-900 border-amber-100 ${baseClass}`}><Clock size={8} className="mr-1" /> Date Courte</span>;
      case 'ABIME':
        return <span className={`bg-red-50 text-red-900 border-red-100 ${baseClass}`}><AlertTriangle size={8} className="mr-1" /> Abîmé</span>;
      default: return null;
    }
  };

  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  const vendorName = product.supplier || 'Vendeur';
  const whatsappLink = `https://wa.me/22500000000?text=Bonjour, je souhaite négocier pour : ${product.name} (Ref: ${product.id})`;
  const stockRemaining = product.stock ?? 0;
  const stockPercent = Math.min(100, Math.round((stockRemaining / 100) * 100));
  const statusBadge = getStatusBadge(product.status);

  const handleReviewSubmit = async (rating: number, comment: string) => {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return;
    await createReview(product.id, rating, comment, data.user.id, data.user.user_metadata?.full_name);
    setIsReviewOpen(false);
  };

  return (
    <div className="group bg-white rounded-lg border border-gray-100 hover:shadow-md transition-all flex flex-col h-full relative product-card-compact">
      {/* Image carrée 1:1 (style Jumia) */}
      <div className="relative product-card-image-wrap aspect-square w-full bg-gray-50 overflow-hidden">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        {/* Gauche : badge réduction en haut, puis badge statut (DATE COURTE, etc.) juste en dessous */}
        <div className="absolute top-1 left-1 z-10 flex flex-col gap-0.5 items-start">
          <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-sm">-{discount}%</span>
          {statusBadge && <div className="scale-90 origin-top-left">{statusBadge}</div>}
        </div>
        {/* Droite : bouton Cœur, toujours cliquable au-dessus */}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(product.id); }}
            className="absolute top-1 right-1 z-20 bg-white/95 rounded-full p-1.5 shadow-md border border-gray-200/80 hover:bg-white"
            aria-label="Favori"
          >
            <Heart size={14} className={isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400'} />
          </button>
        )}
      </div>

      <div className="p-2 flex-1 flex flex-col min-h-0">
        <h3 className="product-card-title text-[#0f172a] font-semibold text-[13px] leading-tight mb-0.5 line-clamp-2" style={{ lineHeight: 1.3 }}>{product.name}</h3>
        
        <div className="flex items-baseline gap-1 mt-1">
          <span className="product-card-price text-[14px] font-bold text-[#064e3b]">{product.price.toLocaleString('fr-CI')} F</span>
          <span className="text-[10px] text-gray-400 line-through">{product.originalPrice.toLocaleString('fr-CI')} F</span>
        </div>

        {/* Barre de stock (style Jumia - vert écologie) */}
        <div className="my-2">
          <p className="text-[10px] font-bold text-gray-700 mb-1">{stockRemaining} restants</p>
          <div className="h-1.5 rounded-[10px] bg-[#E0E0E0] overflow-hidden">
            <div
              className="h-full rounded-[10px] transition-all duration-300"
              style={{ width: `${stockPercent}%`, backgroundColor: '#2E7D32' }}
            />
          </div>
        </div>

        <button
          onClick={() => onAddToCart(product)}
          className="product-card-add-btn h-8 max-h-8 w-full bg-[#064e3b] text-white font-bold text-[11px] px-2 rounded flex items-center justify-center gap-1 uppercase tracking-wide shrink-0"
          aria-label="Ajouter au panier"
        >
          <ShoppingCart size={12} />
          <span>Ajouter</span>
        </button>

        {/* TOGGLE Détails (compact) */}
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="w-full py-1 mt-1 text-[9px] font-bold text-gray-400 uppercase flex items-center justify-center gap-0.5 border-t border-gray-50"
        >
          {showDetails ? <><ChevronUp size={10}/> Moins</> : <><ChevronDown size={10}/> Détails</>}
        </button>

        {/* SECTION DÉTAILS MASQUÉE */}
        {showDetails && (
          <div className="mt-2 space-y-2 pt-2 border-t border-dashed border-gray-100 animate-in fade-in slide-in-from-top-1">
            <div className="flex justify-between text-[9px] font-bold uppercase text-gray-500">
              <span>Vendeur: <span className="text-[#064e3b]">{vendorName}</span></span>
              <span className={product.status === 'DATE_COURTE' ? 'text-red-500' : ''}>DLUO: {new Date(product.expiryDate).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center gap-1">
              <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} size={8} className={s <= Math.round(ratingStats.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />)}</div>
              <span className="text-[8px] text-gray-400">({ratingStats.count} avis)</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <a href={whatsappLink} target="_blank" className="flex items-center justify-center gap-1 bg-emerald-50 text-[#064e3b] border border-emerald-100 py-1.5 text-[9px] font-bold uppercase">
                <MessageCircle size={10} /> WhatsApp
              </a>
              <button onClick={() => setIsReviewOpen(true)} className="border border-gray-100 text-gray-500 py-1.5 text-[9px] font-bold uppercase">Avis</button>
            </div>
          </div>
        )}
      </div>

      {isReviewOpen && <ReviewModal product={product} onClose={() => setIsReviewOpen(false)} onSubmit={handleReviewSubmit} />}
    </div>
  );
};
export default ProductCard;