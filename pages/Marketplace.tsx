import React, { useState } from 'react';
import { Filter, Search, MapPin, Tag, Calendar, SlidersHorizontal, X } from 'lucide-react';
import { Product, ProductStatus } from '../types';
import ProductCard from '../components/ProductCard';

interface MarketplaceProps {
  products: Product[];
  onAddToCart: (p: Product) => void;
  favoriteIds?: string[];
  onToggleFavorite?: (productId: string) => void;
  searchQuery?: string;
  contactChannel: 'whatsapp' | 'messages';
  onContactChannelChange: (channel: 'whatsapp' | 'messages') => void;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
  onStartChat: (sellerId?: string) => void;
  onFiltersOpenChange?: (open: boolean) => void;
}

const Marketplace: React.FC<MarketplaceProps> = ({
  products,
  onAddToCart,
  favoriteIds = [],
  onToggleFavorite,
  searchQuery = '',
  contactChannel,
  onContactChannelChange,
  isAuthenticated,
  onRequireAuth,
  onStartChat,
  onFiltersOpenChange
}) => {
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<ProductStatus | 'ALL'>('ALL');
  const [priceRange, setPriceRange] = useState<number>(0);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Deriving unique values for filters
  const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category)))];
  const locations = ['ALL', ...Array.from(new Set(products.map(p => p.location.split(' - ')[0])))]; // Simplify location to city
  const maxPrice = React.useMemo(() => {
    const values = products
      .map(p => Number(p.price || 0))
      .filter(v => Number.isFinite(v) && v > 0);
    const computed = values.length ? Math.max(...values) : 100000;
    return Math.max(computed, 100000);
  }, [products]);

  React.useEffect(() => {
    setSearchTerm(searchQuery);
  }, [searchQuery]);

  React.useEffect(() => {
    if (priceRange === 0) {
      setPriceRange(maxPrice);
    }
  }, [maxPrice, priceRange]);

  React.useEffect(() => {
    onFiltersOpenChange?.(isMobileFiltersOpen);
    return () => onFiltersOpenChange?.(false);
  }, [isMobileFiltersOpen, onFiltersOpenChange]);

  const filteredProducts = products.filter(product => {
    const name = (product.name || '').toLowerCase();
    const desc = (product.description || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    const matchesSearch = name.includes(query) || desc.includes(query);
    const matchesCategory = selectedCategory === 'ALL' || product.category === selectedCategory;
    const location = product.location || '';
    const matchesLocation = selectedLocation === 'ALL' || location.includes(selectedLocation);
    const matchesStatus = selectedStatus === 'ALL' || product.status === selectedStatus;
    const matchesPrice = priceRange <= 0 ? true : Number(product.price || 0) <= priceRange;

    return matchesSearch && matchesCategory && matchesLocation && matchesStatus && matchesPrice;
  });

  const byCategory = React.useMemo(() => {
    const map = new Map<string, Product[]>();
    filteredProducts.forEach((p) => {
      const cat = p.category || 'Autres';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    });
    return Array.from(map.entries());
  }, [filteredProducts]);

  const FilterSidebar = ({ showResetButton = true }: { showResetButton?: boolean }) => (
    <div className="space-y-6">
      {/* Price Filter */}
      <div className="pt-1">
        <h4 className="font-bold text-[#0f172a] text-[12px] uppercase tracking-wide mb-3 flex items-center">
          <SlidersHorizontal size={14} className="mr-2 text-[#064e3b]" /> Prix Max: {(priceRange || maxPrice).toLocaleString()} F
        </h4>
        <input
          type="range"
          min="1000"
          max={maxPrice}
          step="1000"
          value={priceRange || maxPrice}
          onChange={(e) => setPriceRange(Number(e.target.value))}
          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#064e3b]"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium">
          <span>1 000 F</span>
          <span>{maxPrice.toLocaleString()} F+</span>
        </div>
      </div>

      {/* Categories */}
      <div>
        <h4 className="font-bold text-[#0f172a] text-[12px] uppercase tracking-wide mb-3 flex items-center">
          <Tag size={14} className="mr-2 text-[#064e3b]" /> Catégories
        </h4>
        <div className="space-y-2">
          {categories.map(cat => (
            <label key={cat} className="flex items-center space-x-2 cursor-pointer group">
              <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${selectedCategory === cat ? 'bg-[#064e3b] border-[#064e3b]' : 'border-gray-300 bg-white'}`}>
                {selectedCategory === cat && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>
              <input
                type="radio"
                name="category"
                className="hidden"
                checked={selectedCategory === cat}
                onChange={() => setSelectedCategory(cat)}
              />
              <span className={`text-sm ${selectedCategory === cat ? 'text-[#064e3b] font-bold' : 'text-gray-600 group-hover:text-[#064e3b]'}`}>
                {cat === 'ALL' ? 'Toutes les catégories' : cat}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Locations */}
      <div>
        <h4 className="font-bold text-[#0f172a] text-[12px] uppercase tracking-wide mb-3 flex items-center">
          <MapPin size={14} className="mr-2 text-[#064e3b]" /> Localisation
        </h4>
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="w-full p-2 border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#064e3b]"
        >
          <option value="ALL">Toute la Côte d'Ivoire</option>
          {locations.filter(l => l !== 'ALL').map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div>
        <h4 className="font-bold text-[#0f172a] text-[12px] uppercase tracking-wide mb-3 flex items-center">
          <Calendar size={14} className="mr-2 text-[#064e3b]" /> État / Date
        </h4>
        <div className="space-y-2">
          {[
            { val: 'ALL', label: 'Tout voir' },
            { val: 'INVENDU', label: 'Surplus (Invendus)' },
            { val: 'DATE_COURTE', label: 'Date Courte (Promo)' },
            { val: 'ABIME', label: 'Emballage Abîmé' },
          ].map((opt) => (
            <label key={opt.val} className="flex items-center space-x-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedStatus === opt.val || (selectedStatus === 'ALL' && opt.val === 'ALL')}
                onChange={() => setSelectedStatus(opt.val as ProductStatus | 'ALL')}
                className="accent-[#064e3b]"
              />
              <span className={`text-sm ${selectedStatus === opt.val ? 'text-[#064e3b] font-bold' : 'text-gray-600'}`}>
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {showResetButton && (
        <button
          onClick={() => {
            setSelectedCategory('ALL');
            setSelectedLocation('ALL');
            setSelectedStatus('ALL');
            setPriceRange(maxPrice);
            setSearchTerm('');
          }}
          className="w-full py-3 border border-gray-200 text-gray-500 font-bold text-xs uppercase hover:bg-gray-50 hover:text-[#064e3b] transition-colors"
        >
          Réinitialiser
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto page-padding py-4 md:py-8 pb-24 md:pb-8 space-y-4">
      {/* 1. Barre de recherche */}
      <div>
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-[44px] pl-10 pr-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#064e3b] focus:border-transparent outline-none text-[14px] bg-[#F1F1F1]"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        </div>
      </div>

      {/* 2. Ligne Catalogue + Filtres */}
      <div className="flex justify-between items-center">
        <h1 className="mobile-h1 text-[18px] md:text-xl font-bold text-[#0f172a] uppercase">Catalogue</h1>
        <button
          onClick={() => setIsMobileFiltersOpen(true)}
          className="md:hidden flex items-center gap-2 bg-[#064e3b] text-white px-4 py-2.5 text-xs font-bold uppercase rounded-lg"
        >
          <Filter size={14} /> Filtres
        </button>
      </div>

      {/* 3. Pills : scroll horizontal sur mobile (no-wrap) */}
      <div className="filter-bar-scroll mb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`filter-btn shrink-0 px-4 py-2 rounded-lg text-[12px] font-bold uppercase transition-colors
              ${selectedCategory === cat
                ? 'bg-[#0f172a] text-white border border-[#0f172a]'
                : 'bg-white text-[#0f172a] border border-gray-200 hover:border-[#064e3b] hover:text-[#064e3b]'
              }
            `}
          >
            {cat === 'ALL' ? 'Toutes' : cat}
          </button>
        ))}
      </div>

      {/* Tiroir latéral Filtres (Side Drawer) — 85% largeur, sticky footer */}
      {isMobileFiltersOpen && (
        <>
          <div
            className="fixed inset-0 z-[59] bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileFiltersOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 w-[85%] max-w-md z-[60] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header — Safe Area + fermeture */}
            <div className="flex-shrink-0 pt-[max(16px,env(safe-area-inset-top))] pb-4 px-4 flex justify-between items-center border-b border-gray-100">
              <h2 className="text-lg font-black text-[#0f172a] uppercase tracking-tight">Filtres</h2>
              <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600" aria-label="Fermer">
                <X size={24} />
              </button>
            </div>
            {/* Contenu scrollable — padding 16px */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <FilterSidebar showResetButton={false} />
            </div>
            {/* Sticky Footer — Réinitialiser + Voir les résultats */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white pb-[max(16px,env(safe-area-inset-bottom))]">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('ALL');
                    setSelectedLocation('ALL');
                    setSelectedStatus('ALL');
                    setPriceRange(maxPrice);
                    setSearchTerm('');
                  }}
                  className="py-3 px-4 border border-gray-300 text-gray-600 font-bold text-xs uppercase rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Réinitialiser
                </button>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="flex-1 py-3 bg-[#064e3b] text-white font-bold text-xs uppercase rounded-xl hover:bg-[#065f46] transition-colors"
                >
                  Voir les résultats
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Desktop */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <div className="sticky top-24">
            <div className="mb-6 pb-4 border-b border-gray-100">
              <h1 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight">Catalogue</h1>
              <p className="text-gray-500 text-xs font-bold mt-1">{filteredProducts.length} produits trouvés</p>
            </div>
            <FilterSidebar />
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white border border-gray-100 shadow-sm flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-[#0f172a] mb-2">Aucun résultat</h3>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">Essayez de modifier vos filtres ou votre recherche.</p>
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
      </div>
    </div>
  );
};

export default Marketplace;