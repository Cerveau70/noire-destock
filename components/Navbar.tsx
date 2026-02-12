import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Menu, X, User, Search, ChevronDown, LogOut, ShieldCheck, Store, Users, Home, LayoutGrid, Apple, Beer, Coffee, Beef, Briefcase, UserCircle, Power, Heart, HelpCircle } from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  role: UserRole;
  onAccessChange: (role: UserRole) => void;
  cartCount: number;
  toggleCart: () => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  onNavToPage?: (page: string) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  onSearchSubmit: () => void;
  isAuthenticated: boolean;
  onLogout: () => void;
  onNotify: (message: string, type?: 'success' | 'info' | 'error') => void;
  userName?: string | null;
  onAccount: () => void;
  isCartOpen: boolean;
  onMenuOpenChange?: (open: boolean) => void;
  onHome: () => void;
  onQuit?: () => void;
  /** Masquer la navbar inférieure quand l'utilisateur scroll près du footer (partout : Catégories, Panier, Favoris, Compte inclus) */
  hideBottomNavNearFooter?: boolean;
  /** Masquer complètement la navbar inférieure (ex: page produit avec CTA sticky) */
  hideBottomNav?: boolean;
  /** Ouvrir le tiroir Aide (mobile) */
  onOpenHelp?: () => void;
}

const Navbar: React.FC<NavbarProps> = (props) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccessOpen, setIsAccessOpen] = useState(false); 
  const [isMobileSpaceOpen, setIsMobileSpaceOpen] = useState(false);
  const accessRef = useRef<HTMLDivElement>(null);

  // Fermer les menus au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accessRef.current && !accessRef.current.contains(event.target as Node)) {
        setIsAccessOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { setIsMenuOpen(false); }, [props.currentPage]);
  useEffect(() => {
    props.onMenuOpenChange?.(isMenuOpen);
  }, [isMenuOpen, props.onMenuOpenChange]);

  const categories = [
    { id: 'marketplace', label: 'Supermarché', icon: <LayoutGrid size={16}/> },
    { id: 'fruits', label: 'Fruits & Légumes', icon: <Apple size={16}/> },
    { id: 'boissons', label: 'Boissons', icon: <Beer size={16}/> },
    { id: 'epicerie', label: 'Épicerie', icon: <Coffee size={16}/> },
    { id: 'frais', label: 'Produits Frais', icon: <Beef size={16}/> },
  ];

  const getRoleLabel = (r: UserRole) => {
    switch (r) {
      case 'SUPER_ADMIN': return 'Super Admin';
      case 'ADMIN': return 'Admin';
      case 'STORE_ADMIN': return 'Vendeur';
      case 'PARTNER_ADMIN': return "Accès Grossiste";
      default: return 'Client';
    }
  };

  return (
    <nav className="w-full sticky top-0 z-[100] font-sans flex flex-col">
      
      {/* --- 1. HEADER PRINCIPAL : fond vert jusqu'en haut, contenu sous la barre de statut --- */}
      <div 
    className="bg-[#064e3b] text-white shadow-md w-full box-border" 
    style={{ 
      /* On force 45px minimum + la zone de sécurité pour l'API 36 */
      paddingTop: 30, 
      paddingLeft: 16, 
      paddingRight: 16,
      paddingBottom: 12 
    }}
  >
    <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          
          {/* LOGO */}
          <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={props.onHome}>
            <img src="/img/dest.png" alt="Logo" className="w-8 h-8 bg-white rounded-lg p-1 object-contain" />
            <div className="flex flex-col leading-none">
              <span className="font-black text-base tracking-tighter uppercase">Ivoire<span className="font-light">Destock</span></span>
              <span className="text-[7px] tracking-[0.2em] text-emerald-300 uppercase font-bold">Anti-Gaspillage</span>
            </div>
          </div>

          {/* BARRE DE RECHERCHE (DESKTOP) */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="flex w-full rounded-md overflow-hidden bg-white/10 border border-white/20 focus-within:border-emerald-400/50 transition-all">
              <input 
                type="text" 
                placeholder="Rechercher un produit..." 
                className="flex-1 px-4 py-2 bg-transparent text-sm outline-none placeholder-emerald-100/40"
                value={props.searchQuery}
                onChange={(e) => props.setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && props.onSearchSubmit()}
              />
              <button onClick={props.onSearchSubmit} className="bg-white px-5 text-[#064e3b] hover:bg-emerald-50"><Search size={20}/></button>
            </div>
          </div>

          {/* ACTIONS DROITE */}
          <div className="flex items-center gap-3 md:gap-6">
            
            {/* BOUTON ESPACES PRO (Desktop) */}
            <div className="hidden lg:block relative" ref={accessRef}>
              <button 
                onClick={() => setIsAccessOpen(!isAccessOpen)}
                className="flex items-center gap-2 bg-black/20 hover:bg-black/30 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider border border-white/10 transition-all"
              >
                <Briefcase size={16} className="text-emerald-400"/>
                Espaces Pro : {getRoleLabel(props.role)}
                <ChevronDown size={14} className={`transition-transform ${isAccessOpen ? 'rotate-180' : ''}`} />
              </button>

              {isAccessOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white text-slate-800 shadow-2xl border border-slate-100 rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-2 border-b border-slate-50 bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Changer d'interface</div>
                  <button onClick={() => {props.onAccessChange('BUYER'); setIsAccessOpen(false);}} className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold hover:bg-emerald-50 text-slate-700 transition-colors">
                    <Users size={18} className="text-emerald-600"/> Espace Client
                  </button>
                  <button onClick={() => {props.onAccessChange('STORE_ADMIN'); setIsAccessOpen(false);}} className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold hover:bg-emerald-50 text-slate-700 transition-colors">
                    <Store size={18} className="text-emerald-600"/> Devenir Vendeur
                  </button>
                  <button onClick={() => {props.onAccessChange('PARTNER_ADMIN'); setIsAccessOpen(false);}} className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold hover:bg-emerald-50 text-slate-700 transition-colors">
                    <Users size={18} className="text-emerald-600"/> Accès Grossiste
                  </button>
                  <button onClick={() => {props.onAccessChange('SUPER_ADMIN'); setIsAccessOpen(false);}} className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold hover:bg-emerald-50 text-slate-700 transition-colors">
                    <ShieldCheck size={18} className="text-emerald-600"/> Administration
                  </button>
                </div>
              )}
            </div>

            {/* --- ACCOUNT DESKTOP (Connexion -> Connecté) ; panier uniquement en navbar inf --- */}
            <div 
              className="hidden md:flex items-center gap-2 text-sm font-bold border-l border-white/20 pl-6 cursor-pointer hover:text-emerald-300 transition-colors"
              onClick={() => props.isAuthenticated ? props.onAccount() : props.setCurrentPage('login')}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${props.isAuthenticated ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/10 text-white'}`}>
                <User size={18}/>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[10px] text-emerald-300 font-normal uppercase tracking-tighter">
                  {props.isAuthenticated ? 'Mon Espace' : 'Bienvenue'}
                </span>
                <span className="truncate max-w-[100px]">
                  {props.isAuthenticated ? (props.userName ? props.userName.split(' ')[0] : 'Connecté') : 'Connexion'}
                </span>
              </div>
            </div>

            {/* AIDE (Mobile) : ouvre le Help Drawer — à côté du burger */}
            {props.onOpenHelp && (
              <button className="md:hidden p-1.5 text-white hover:text-emerald-200 active:scale-90 transition-transform" onClick={props.onOpenHelp} aria-label="Aide">
                <HelpCircle size={24} />
              </button>
            )}
            {/* BURGER MOBILE */}
            <button className="md:hidden p-1 text-white active:scale-90 transition-transform" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={32} /> : <Menu size={32} />}
            </button>
          </div>
        </div>
      </div>

      {/* --- 2. BARRE CATÉGORIES (Desktop) --- */}
      <div className="hidden md:block bg-[#065f46] text-white py-2 px-4 border-t border-emerald-800/30">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <ul className="flex items-center space-x-8 text-[11px] font-bold uppercase tracking-widest">
            <li className="flex items-center gap-2 cursor-pointer hover:text-emerald-300 border-r border-white/10 pr-6 transition-colors">
              <Menu size={16}/> Catégories
            </li>
            {categories.map(cat => (
              <li 
                key={cat.id} 
                className={`cursor-pointer hover:text-emerald-300 transition-all border-b-2 ${props.currentPage === cat.id ? 'border-emerald-400 text-emerald-300' : 'border-transparent'}`} 
                onClick={() => props.setCurrentPage(cat.id)}
              >
                {cat.label}
              </li>
            ))}
          </ul>
          <div className="text-red-400 font-black text-[11px] uppercase flex items-center gap-1 animate-pulse">
            Promotions 🔥
          </div>
        </div>
      </div>

      {/* --- 3. MENU BURGER MOBILE (Regroupe tout) --- */}
      {isMenuOpen && (
        <div className="fixed inset-x-0 bottom-0 z-[1000] md:hidden flex flex-col animate-in fade-in duration-200 bg-black/20 backdrop-blur-[2px]" style={{ top: 'var(--header-height)' }}>
          <div className="flex-1 overflow-y-auto p-3 pb-24">
            <div className="ml-auto w-full max-w-sm bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col">
            
            {/* Recherche Mobile */}
            <div className="p-3 flex rounded-xl overflow-hidden bg-gray-50/80 focus-within:ring-2 focus-within:ring-emerald-400/30 transition-all">
              <input 
                type="text" placeholder="Rechercher..." 
                className="flex-1 bg-transparent px-3 py-2 text-gray-700 outline-none placeholder-gray-400 text-[10px]" 
                value={props.searchQuery} 
                onChange={(e) => props.setSearchQuery(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && props.onSearchSubmit()}
              />
              <button onClick={() => {props.onSearchSubmit(); setIsMenuOpen(false);}} className="px-3 text-[#064e3b] active:opacity-80"><Search size={18}/></button>
            </div>

            <div className="border-t border-gray-100" />

            {/* ESPACES PRO (Mobile Burger) - listes simples icône à gauche */}
            <div className="px-2 py-2">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider px-2 py-1">Espaces Professionnels</p>
              <button onClick={() => { props.onAccessChange('STORE_ADMIN'); setIsMenuOpen(false); setIsMobileSpaceOpen(false); }} className={`flex items-center gap-3 w-full py-2.5 px-2 rounded-lg text-left transition-colors ${props.role === 'STORE_ADMIN' ? 'bg-emerald-50 text-[#064e3b]' : 'text-gray-700 hover:bg-gray-50'}`}>
                <Store size={18} className="shrink-0 text-[#064e3b]" />
                <span className="text-[11px] font-semibold">Devenir Vendeur</span>
              </button>
              <button onClick={() => { props.onAccessChange('PARTNER_ADMIN'); setIsMenuOpen(false); setIsMobileSpaceOpen(false); }} className={`flex items-center gap-3 w-full py-2.5 px-2 rounded-lg text-left transition-colors ${props.role === 'PARTNER_ADMIN' ? 'bg-emerald-50 text-[#064e3b]' : 'text-gray-700 hover:bg-gray-50'}`}>
                <Users size={18} className="shrink-0 text-[#064e3b]" />
                <span className="text-[11px] font-semibold">Accès Grossiste</span>
              </button>
              <button onClick={() => { props.onAccessChange('SUPER_ADMIN'); setIsMenuOpen(false); setIsMobileSpaceOpen(false); }} className={`flex items-center gap-3 w-full py-2.5 px-2 rounded-lg text-left transition-colors ${props.role === 'SUPER_ADMIN' ? 'bg-emerald-50 text-[#064e3b]' : 'text-gray-700 hover:bg-gray-50'}`}>
                <ShieldCheck size={18} className="shrink-0 text-[#064e3b]" />
                <span className="text-[11px] font-semibold">Support & Gestion</span>
              </button>
            </div>

            <div className="border-t border-gray-100" />

            {/* MON COMPTE */}
            <div className="px-2 py-2">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider px-2 py-1">Mon compte</p>
              <button onClick={() => { props.onAccount(); setIsMenuOpen(false); setIsMobileSpaceOpen(false); }} className="flex items-center gap-3 w-full py-2.5 px-2 rounded-lg text-left text-gray-700 hover:bg-gray-50 transition-colors">
                <UserCircle size={18} className="shrink-0 text-[#064e3b]" />
                <span className="text-[11px] font-semibold">Accéder à mon espace</span>
              </button>
            </div>

            <div className="border-t border-gray-100" />

            {/* PRODUITS */}
            <div className="px-2 py-2">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider px-2 py-1">Produits</p>
              <button onClick={() => { props.setCurrentPage('marketplace'); setIsMenuOpen(false); }} className="flex items-center gap-3 w-full py-2.5 px-2 rounded-lg text-left text-gray-700 hover:bg-gray-50 transition-colors">
                <Search size={18} className="shrink-0 text-[#064e3b]" />
                <span className="text-[11px] font-semibold">Voir tous les produits</span>
              </button>
            </div>

            <div className="border-t border-gray-100" />

            {/* AUTH & LOGOUT (au-dessus de Quitter) */}
            <div className="mt-auto px-2 py-3">
              {props.isAuthenticated ? (
                <div className="space-y-0">
                  <div className="flex items-center gap-3 px-2 py-2 rounded-lg mb-1 bg-gray-50/80">
                    <div className="w-8 h-8 rounded-full bg-[#064e3b] flex items-center justify-center text-white font-bold text-[11px]">
                      {props.userName?.charAt(0) || 'U'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] text-gray-400 font-semibold uppercase">Connecté</span>
                      <span className="text-[11px] font-bold text-gray-800 truncate">{props.userName}</span>
                    </div>
                  </div>
                  <button onClick={props.onLogout} className="flex items-center gap-3 w-full py-2.5 px-2 rounded-lg text-left text-red-600 hover:bg-red-50/80 transition-colors">
                    <LogOut size={18} className="shrink-0" />
                    <span className="text-[11px] font-semibold">Déconnexion</span>
                  </button>
                  <button onClick={() => { props.onHome(); setIsMenuOpen(false); }} className="flex items-center gap-3 w-full py-2.5 px-2 rounded-lg text-left text-gray-700 hover:bg-gray-50 transition-colors">
                    <Home size={18} className="shrink-0 text-gray-500" />
                    <span className="text-[11px] font-semibold">Retour accueil</span>
                  </button>
                </div>
              ) : (
                <button onClick={() => { props.setCurrentPage('login'); setIsMenuOpen(false); }} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#064e3b] text-white font-bold uppercase text-[11px] hover:opacity-95 active:opacity-90 transition-opacity">
                  <User size={18} /> SE CONNECTER
                </button>
              )}
            </div>

            {/* QUITTER tout en bas, petit texte discret */}
            {props.onQuit && (
              <div className="border-t border-gray-100 px-2 py-3 flex justify-center">
                <button
                  onClick={() => { props.onQuit?.(); setIsMenuOpen(false); }}
                  className="flex items-center gap-1.5 text-[10px] text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Power size={12} /> Quitter l'app
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* --- 4. NAVBAR INFÉRIEURE (Mobile) - disparaît près du footer partout, réapparaît en remontant --- */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-[1200] border-t border-gray-200 bg-white/90 backdrop-blur-md mobile-bottom-nav transition-transform duration-300 ease-out ${
          props.hideBottomNav || props.hideBottomNavNearFooter ? 'translate-y-full pointer-events-none' : 'translate-y-0'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)', minHeight: 56, paddingLeft: 16, paddingRight: 16 }}
      >
        <div className="grid grid-cols-5 font-bold uppercase tracking-wide text-[10px] h-14 max-w-[100%]">
          <button
            onClick={() => { (props.onNavToPage || props.setCurrentPage)('home'); props.onHome(); setIsMenuOpen(false); setIsMobileSpaceOpen(false); }}
            className={`flex flex-col items-center justify-center gap-0.5 hover:text-[#064e3b] active:scale-95 transition-transform ${props.currentPage === 'home' ? 'text-[#064e3b]' : 'text-gray-600'}`}
          >
            <Home size={24} />
            <span>Accueil</span>
          </button>
          <button
            onClick={() => { (props.onNavToPage || props.setCurrentPage)('marketplace'); setIsMenuOpen(false); setIsMobileSpaceOpen(false); }}
            className={`py-2.5 flex flex-col items-center gap-0.5 hover:text-[#064e3b] active:scale-95 transition-transform ${props.currentPage === 'marketplace' ? 'text-[#064e3b]' : 'text-gray-600'}`}
          >
            <LayoutGrid size={24} />
            <span>Catégories</span>
          </button>
          <button
            onClick={() => { props.toggleCart(); setIsMenuOpen(false); setIsMobileSpaceOpen(false); }}
            className={`flex flex-col items-center justify-center gap-0.5 hover:text-[#064e3b] relative active:scale-95 transition-transform ${props.isCartOpen ? 'text-[#064e3b]' : 'text-gray-600'}`}
          >
            {props.cartCount > 0 && (
              <span className="absolute top-0 right-1/4 bg-red-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full ring-2 ring-white">
                {props.cartCount}
              </span>
            )}
            <ShoppingCart size={24} />
            <span>Panier</span>
          </button>
          <button
            onClick={() => { (props.onNavToPage || props.setCurrentPage)('favoris'); setIsMenuOpen(false); setIsMobileSpaceOpen(false); }}
            className={`flex flex-col items-center justify-center gap-0.5 hover:text-[#064e3b] active:scale-95 transition-transform ${props.currentPage === 'favoris' ? 'text-[#064e3b]' : 'text-gray-600'}`}
          >
            <Heart size={24} />
            <span>Favoris</span>
          </button>
          <button
            onClick={() => { (props.onNavToPage || props.setCurrentPage)('dashboard'); props.onAccount(); setIsMenuOpen(false); setIsMobileSpaceOpen(false); }}
            className={`flex flex-col items-center justify-center gap-0.5 hover:text-[#064e3b] active:scale-95 transition-transform ${props.currentPage === 'dashboard' ? 'text-[#064e3b]' : 'text-gray-600'}`}
          >
            <UserCircle size={24} />
            <span>Compte</span>
          </button>
        </div>
      </div>

      {/* --- LISTE ESPACES (Mobile) --- */}
      {isMobileSpaceOpen && (
        <div className="md:hidden fixed inset-0 z-[1250] bg-white">
          <div className="p-4 flex items-center justify-between border-b border-gray-100" style={{ paddingTop: 'max(16px, var(--safe-top))' }}>
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-600">Choisir un espace</h3>
            <button onClick={() => setIsMobileSpaceOpen(false)} className="text-gray-400"><X size={20} /></button>
          </div>
          <div className="p-4 space-y-3">
            <button onClick={() => {props.onAccessChange('BUYER'); setIsMobileSpaceOpen(false);}} className="w-full px-4 py-4 text-left text-sm font-bold rounded-xl border border-gray-200 bg-white">Espace Client</button>
            <button onClick={() => {props.onAccessChange('STORE_ADMIN'); setIsMobileSpaceOpen(false);}} className="w-full px-4 py-4 text-left text-sm font-bold rounded-xl border border-gray-200 bg-white">Devenir Vendeur</button>
            <button onClick={() => {props.onAccessChange('PARTNER_ADMIN'); setIsMobileSpaceOpen(false);}} className="w-full px-4 py-4 text-left text-sm font-bold rounded-xl border border-gray-200 bg-white">Accès Grossiste</button>
            <button onClick={() => {props.onAccessChange('SUPER_ADMIN'); setIsMobileSpaceOpen(false);}} className="w-full px-4 py-4 text-left text-sm font-bold rounded-xl border border-gray-200 bg-white">Support & Gestion</button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;