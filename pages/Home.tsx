import React from 'react';
import { ArrowRight, CheckCircle, Leaf, TrendingDown } from 'lucide-react';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

interface HomeProps {
  products: Product[];
  onAddToCart: (p: Product) => void;
  onNavigate: (page: string) => void;
  onSellerAccess: () => void;
  contactChannel: 'whatsapp' | 'messages';
  onContactChannelChange: (channel: 'whatsapp' | 'messages') => void;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
  onStartChat: (sellerId?: string) => void;
}

const Home: React.FC<HomeProps> = ({
  products,
  onAddToCart,
  onNavigate,
  onSellerAccess,
  contactChannel,
  onContactChannelChange,
  isAuthenticated,
  onRequireAuth,
  onStartChat
}) => {
  const featuredProducts = products.slice(0, 3);

  return (
    <div className="space-y-10 md:space-y-16 pb-20 md:pb-20">
      {/* Hero Section - Matching Header Dark Green */}
      <section className="relative bg-[#064e3b] text-white overflow-hidden mx-0 md:mx-4 mt-0 md:mt-6 md:rounded-xl shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80')] bg-cover bg-center"></div>
        {/* Reduced opacity for the green overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#064e3b]/60 via-[#064e3b]/30 to-transparent"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-32 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 space-y-6 md:space-y-8">
            <span className="inline-block py-1.5 px-4 bg-black/30 border border-white/20 text-emerald-200 text-xs font-bold uppercase tracking-widest backdrop-blur-sm shadow-sm">
              Plateforme B2B & B2C N°1 en RCI
            </span>
            <h1 className="text-3xl md:text-6xl font-black leading-tight tracking-tight drop-shadow-lg">
              Moins de Gaspillage, <br/>
              <span className="text-emerald-300">Plus d'Économies.</span>
            </h1>
            <p className="text-base md:text-lg text-white font-medium max-w-md leading-relaxed drop-shadow-md">
              Accédez à des stocks alimentaires invendus, à date courte ou abîmés à des prix défiant toute concurrence.
            </p>
            <div className="flex flex-wrap gap-3 pt-2 md:pt-4">
              <button 
                onClick={() => onNavigate('marketplace')}
                className="bg-white text-[#064e3b] px-6 py-3 md:px-8 md:py-4 font-bold hover:bg-emerald-50 transition-colors flex items-center shadow-lg uppercase tracking-wide text-sm"
              >
                Voir les Offres <ArrowRight size={18} className="ml-2" />
              </button>
              <button
                onClick={onSellerAccess}
                className="bg-black/30 backdrop-blur-md border border-white/30 text-white px-6 py-3 md:px-8 md:py-4 font-bold hover:bg-white/10 transition-colors uppercase tracking-wide text-sm"
              >
                Vendre du Stock
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-3 md:grid-cols-3 gap-3 md:gap-8">
          <div className="bg-white p-3 md:p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="w-10 h-10 md:w-14 md:h-14 bg-emerald-50 flex items-center justify-center text-[#064e3b] mb-3 md:mb-6 group-hover:bg-[#064e3b] group-hover:text-white transition-colors duration-300 rounded-lg">
                <TrendingDown size={22} />
              </div>
              <h3 className="text-[11px] md:text-xl font-bold text-[#0f172a] mb-2 uppercase tracking-tight">Prix Cassés</h3>
              <p className="text-[10px] md:text-sm text-gray-500 leading-snug md:leading-relaxed line-clamp-3">Jusqu'à -70% sur des produits de grandes marques.</p>
            </div>
          </div>
          <div className="bg-white p-3 md:p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="w-10 h-10 md:w-14 md:h-14 bg-emerald-50 flex items-center justify-center text-[#064e3b] mb-3 md:mb-6 group-hover:bg-[#064e3b] group-hover:text-white transition-colors duration-300 rounded-lg">
                <Leaf size={22} />
              </div>
              <h3 className="text-[11px] md:text-xl font-bold text-[#0f172a] mb-2 uppercase tracking-tight">Éco-responsable</h3>
              <p className="text-[10px] md:text-sm text-gray-500 leading-snug md:leading-relaxed line-clamp-3">Participez à la lutte contre le gaspillage alimentaire.</p>
            </div>
          </div>
          <div className="bg-white p-3 md:p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="w-10 h-10 md:w-14 md:h-14 bg-emerald-50 flex items-center justify-center text-[#064e3b] mb-3 md:mb-6 group-hover:bg-[#064e3b] group-hover:text-white transition-colors duration-300 rounded-lg">
                <CheckCircle size={22} />
              </div>
              <h3 className="text-[11px] md:text-xl font-bold text-[#0f172a] mb-2 uppercase tracking-tight">Qualité Vérifiée</h3>
              <p className="text-[10px] md:text-sm text-gray-500 leading-snug md:leading-relaxed line-clamp-3">Transparence totale sur l'état pour votre sécurité.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-end mb-6 md:mb-10 pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-3xl font-black text-[#0f172a] tracking-tight uppercase">Arrivages Récents</h2>
            <p className="text-gray-500 mt-2 text-sm">Dépêchez-vous, les stocks sont limités.</p>
          </div>
          <button 
            onClick={() => onNavigate('marketplace')}
            className="text-[#064e3b] font-bold hover:text-[#065f46] flex items-center uppercase text-sm tracking-wide"
          >
            Tout voir <ArrowRight size={16} className="ml-1" />
          </button>
        </div>
        
        <div className="horizontal-scroll -mx-4 px-4">
          {featuredProducts.map((product) => (
            <div key={product.id} className="scroll-card">
              <ProductCard
                product={product}
                onAddToCart={onAddToCart}
                contactChannel={contactChannel}
                onContactChannelChange={onContactChannelChange}
                isAuthenticated={isAuthenticated}
                onRequireAuth={onRequireAuth}
                onStartChat={onStartChat}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;