import React, { useState } from 'react';
import { ShoppingBag, Clock, AlertTriangle, MessageCircle, MapPin, Star, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Product } from '../types';
import ReviewModal from './ReviewModal';
import { createReview } from '../services/backendService';
import { supabase } from '../services/supabaseClient';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  contactChannel?: 'whatsapp' | 'messages';
  onContactChannelChange?: (channel: 'whatsapp' | 'messages') => void;
  isAuthenticated?: boolean;
  onRequireAuth?: () => void;
  onStartChat?: (sellerId?: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
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

  const handleReviewSubmit = async (rating: number, comment: string) => {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return;
    await createReview(product.id, rating, comment, data.user.id, data.user.user_metadata?.full_name);
    setIsReviewOpen(false);
  };

  return (
    <div className="group bg-white rounded-none border border-gray-100 hover:shadow-md transition-all flex flex-col h-full relative">
      {/* Image - Hauteur réduite pour mobile */}
      <div className="relative h-32 md:h-48 bg-gray-50 overflow-hidden">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        <div className="absolute top-1 left-1 scale-90 origin-top-left">{getStatusBadge(product.status)}</div>
        <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black px-2 py-1">-{discount}%</div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
          <div className="flex items-center text-white text-[10px] font-bold"><MapPin size={10} className="mr-1 text-emerald-400" /> {product.location}</div>
        </div>
      </div>

      <div className="p-2 md:p-3 flex-1 flex flex-col">
        <h3 className="text-[#0f172a] font-bold text-xs md:text-sm leading-tight mb-1 line-clamp-2 h-8">{product.name}</h3>
        <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wide mb-1">{vendorName}</p>
        <p className="text-[11px] text-gray-500 line-clamp-2 mb-2">{product.description}</p>
        
        <div className="flex items-baseline gap-1.5 mb-2">
          <span className="text-sm md:text-base font-black text-[#064e3b]">{product.price.toLocaleString('fr-CI')} F</span>
          <span className="text-[11px] text-gray-400 line-through">{product.originalPrice.toLocaleString('fr-CI')} F</span>
        </div>

        {/* BOUTON PRINCIPAL UNIQUE */}
        <button
          onClick={() => onAddToCart(product)}
          className="w-full bg-[#064e3b] text-white font-bold text-[11px] py-2 px-2 flex items-center justify-center uppercase tracking-wider mb-2"
        >
          <Plus size={12} className="mr-2" /> Ajouter
        </button>

        {/* TOGGLE VOIR PLUS */}
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="w-full py-1 text-[9px] font-bold text-gray-400 uppercase flex items-center justify-center gap-1 border-t border-gray-50"
        >
          {showDetails ? <><ChevronUp size={12}/> Moins d'infos</> : <><ChevronDown size={12}/> Détails & Contact</>}
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