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
  onStartChat
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

  const FilterSidebar = () => (
    <div className="space-y-8">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Rechercher produit..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:ring-2 focus:ring-[#064e3b] focus:border-transparent outline-none text-sm bg-white"
        />
        <Search className="absolute left-3 top-3.5 text-gray-400" size={16} />
      </div>

      {/* Price Filter */}
      <div>
        <h4 className="font-black text-[#0f172a] text-xs uppercase tracking-wide mb-4 flex items-center">
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
        <h4 className="font-black text-[#0f172a] text-xs uppercase tracking-wide mb-3 flex items-center">
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
        <h4 className="font-black text-[#0f172a] text-xs uppercase tracking-wide mb-3 flex items-center">
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
        <h4 className="font-black text-[#0f172a] text-xs uppercase tracking-wide mb-3 flex items-center">
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

      {/* Reset */}
      <button
        onClick={() => {
          setSelectedCategory('ALL');
          setSelectedLocation('ALL');
          setSelectedStatus('ALL');
          setSearchTerm('');
          setPriceRange(maxPrice);
        }}
        className="w-full py-3 border border-gray-200 text-gray-500 font-bold text-xs uppercase hover:bg-gray-50 hover:text-[#064e3b] transition-colors"
      >
        Réinitialiser
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 pb-24 md:pb-8">
      {/* Mobile Filter Toggle */}
      <div className="md:hidden mb-6 flex justify-between items-center">
        <h1 className="text-xl font-black text-[#0f172a] uppercase">Catalogue</h1>
        <button
          onClick={() => setIsMobileFiltersOpen(true)}
          className="flex items-center gap-2 bg-[#064e3b] text-white px-4 py-2 text-xs font-bold uppercase"
        >
          <Filter size={14} /> Filtres
        </button>
      </div>

      {/* Mobile Filters Drawer */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-[60] bg-white p-6 overflow-y-auto pb-24">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-[#0f172a] uppercase">Filtres</h2>
            <button onClick={() => setIsMobileFiltersOpen(false)}><X size={24} /></button>
          </div>
          <FilterSidebar />
          <button
            onClick={() => setIsMobileFiltersOpen(false)}
            className="w-full bg-[#064e3b] text-white py-4 mt-8 font-bold uppercase"
          >
            Voir les résultats
          </button>
        </div>
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
            <div className="space-y-8">
              {byCategory.map(([category, list]) => (
                <div key={category}>
                  <h3 className="text-lg font-black text-[#0f172a] uppercase tracking-wide mb-3">{category}</h3>
                  <div className="horizontal-scroll -mx-4 px-4 md:mx-0 md:px-0">
                    {list.map((product) => (
                      <div key={product.id} className="scroll-card">
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