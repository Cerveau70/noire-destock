import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Menu, X, User, Search, ChevronDown, LogOut, ShieldCheck, Store, Users, Home, LayoutGrid, Apple, Beer, Coffee, Beef, Briefcase, UserCircle } from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  role: UserRole;
  onAccessChange: (role: UserRole) => void;
  cartCount: number;
  toggleCart: () => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  onSearchSubmit: () => void;
  isAuthenticated: boolean;
  onLogout: () => void;
  onNotify: (message: string, type?: 'success' | 'info' | 'error') => void;
  userName?: string | null;
  onAccount: () => void;
  isCartOpen: boolean;
  onHome: () => void;
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

  const categories = [
    { id: 'marketplace', label: 'Supermarché', icon: <LayoutGrid size={16}/> },
    { id: 'fruits', label: 'Fruits & Légumes', icon: <Apple size={16}/> },
    { id: 'boissons', label: 'Boissons', icon: <Beer size={16}/> },
    { id: 'epicerie', label: 'Épicerie', icon: <Coffee size={16}/> },
    { id: 'frais', label: 'Produits Frais', icon: <Beef size={16}/> },
  ];

  const getRoleLabel = (r: UserRole) => {
    switch (r) {
      case 'SUPER_ADMIN': return 'Admin';
      case 'STORE_ADMIN': return 'Vendeur';
      case 'PARTNER_ADMIN': return "Centrale d'achat";
      default: return 'Client';
    }
  };

  return (
    <nav className="w-full sticky top-0 z-[100] font-sans flex flex-col">
      
      {/* --- 1. HEADER PRINCIPAL --- */}
      <div className="bg-[#064e3b] text-white px-3 py-2 shadow-md">
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
                    <Store size={18} className="text-emerald-600"/> Espace Vendeur
                  </button>
                  <button onClick={() => {props.onAccessChange('PARTNER_ADMIN'); setIsAccessOpen(false);}} className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold hover:bg-emerald-50 text-slate-700 transition-colors">
                    <Users size={18} className="text-emerald-600"/> Centrale d'achat
                  </button>
                  <button onClick={() => {props.onAccessChange('SUPER_ADMIN'); setIsAccessOpen(false);}} className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold hover:bg-emerald-50 text-slate-700 transition-colors">
                    <ShieldCheck size={18} className="text-emerald-600"/> Administration
                  </button>
                </div>
              )}
            </div>

            {/* Panier */}
            <div className="relative cursor-pointer p-1 group" onClick={props.toggleCart}>
              <ShoppingCart size={26} className="transition-transform group-hover:scale-110" />
              {props.cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full ring-2 ring-[#064e3b]">
                  {props.cartCount}
                </span>
              )}
            </div>

            {/* --- MODIFICATION ICI : ACCOUNT DESKTOP (Connexion -> Connecté) --- */}
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
        <div className="fixed inset-0 top-[60px] bg-black/20 backdrop-blur-[2px] z-[1000] md:hidden flex flex-col animate-in fade-in duration-200">
          <div className="flex-1 overflow-y-auto p-3 pb-24">
            <div className="ml-auto w-full max-w-sm bg-white border border-gray-200 shadow-2xl rounded-2xl p-3 flex flex-col gap-4">
            
            {/* Recherche Mobile */}
            <div className="flex rounded-xl overflow-hidden border border-gray-200 shadow-inner bg-white focus-within:border-emerald-400 transition-all">
              <input 
                type="text" placeholder="Rechercher..." 
                className="flex-1 bg-transparent px-3 py-2 text-gray-700 outline-none placeholder-gray-400 text-[10px]" 
                value={props.searchQuery} 
                onChange={(e) => props.setSearchQuery(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && props.onSearchSubmit()}
              />
              <button onClick={() => {props.onSearchSubmit(); setIsMenuOpen(false);}} className="bg-white px-3 text-[#064e3b] active:bg-emerald-50"><Search size={16}/></button>
            </div>

            {/* ESPACES PRO (Mobile Burger) */}
            <div className="space-y-2">
              <p className="text-[8px] font-black text-emerald-400/50 uppercase tracking-[0.12em] ml-1">Espaces Professionnels</p>
              <div className="grid grid-cols-1 gap-1">
                <button onClick={() => { props.onAccessChange('STORE_ADMIN'); setIsMenuOpen(false); setIsMobileSpaceOpen(false); }} className={`flex items-center gap-2.5 w-full p-2 rounded-lg border transition-all hover:border-emerald-300 hover:text-[#064e3b] ${props.role === 'STORE_ADMIN' ? 'bg-emerald-50 border-emerald-300 text-[#064e3b]' : 'bg-white border-gray-200 text-gray-600'}`}>
                   <Store size={16}/> <span className="text-[10px] font-bold">Espace Vendeur</span>
                </button>
                <button onClick={() => { props.onAccessChange('PARTNER_ADMIN'); setIsMenuOpen(false); setIsMobileSpaceOpen(false); }} className={`flex items-center gap-2.5 w-full p-2 rounded-lg border transition-all hover:border-emerald-300 hover:text-[#064e3b] ${props.role === 'PARTNER_ADMIN' ? 'bg-emerald-50 border-emerald-300 text-[#064e3b]' : 'bg-white border-gray-200 text-gray-600'}`}>
                   <Users size={16}/> <span className="text-[10px] font-bold">Centrale d'achat</span>
                </button>
                <button onClick={() => { props.onAccessChange('SUPER_ADMIN'); setIsMenuOpen(false); setIsMobileSpaceOpen(false); }} className={`flex items-center gap-2.5 w-full p-2 rounded-lg border transition-all hover:border-emerald-300 hover:text-[#064e3b] ${props.role === 'SUPER_ADMIN' ? 'bg-emerald-50 border-emerald-300 text-[#064e3b]' : 'bg-white border-gray-200 text-gray-600'}`}>
                   <ShieldCheck size={16}/> <span className="text-[10px] font-bold">Espace Administrateur</span>
                </button>
              </div>
            </div>

            {/* MON COMPTE (Mobile Burger) */}
            <div className="space-y-2">
              <p className="text-[8px] font-black text-emerald-400/50 uppercase tracking-[0.12em] ml-1">Mon compte</p>
              <button
                onClick={() => { props.onAccount(); setIsMenuOpen(false); setIsMobileSpaceOpen(false); }}
                className="w-full flex items-center justify-between bg-white border border-gray-200 p-2 rounded-lg text-[9px] font-bold uppercase text-gray-600 hover:border-emerald-300 hover:text-[#064e3b]"
              >
                <span>Accéder à mon espace</span>
                <UserCircle size={14} className="text-[#064e3b]" />
              </button>
            </div>

            {/* PRODUITS (Mobile Burger) */}
            <div className="space-y-2">
              <p className="text-[8px] font-black text-emerald-400/50 uppercase tracking-[0.12em] ml-1">Produits</p>
              <button
                onClick={() => { props.setCurrentPage('marketplace'); setIsMenuOpen(false); }}
                className="w-full flex items-center justify-between bg-white border border-gray-200 p-2 rounded-lg text-[9px] font-bold uppercase text-gray-600 hover:border-emerald-300 hover:text-[#064e3b]"
              >
                <span>Voir tous les produits</span>
                <Search size={14} className="text-[#064e3b]" />
              </button>
            </div>

            {/* AUTH & LOGOUT (Mobile Burger) */}
            <div className="mt-auto pt-3 border-t border-gray-100">
              {props.isAuthenticated ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-3 py-2 bg-emerald-50 rounded-lg mb-2 border border-emerald-100">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-[10px]">
                      {props.userName?.charAt(0) || 'U'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-emerald-300 font-bold uppercase">Connecté en tant que</span>
                      <span className="text-[10px] font-black">{props.userName}</span>
                    </div>
                  </div>
                  <button onClick={props.onLogout} className="flex items-center justify-center gap-2 text-red-500 font-bold uppercase text-[9px] p-2 bg-red-50 rounded-lg w-full border border-red-100 active:bg-red-100 transition-all hover:bg-red-100">
                    <LogOut size={14}/> Déconnexion
                  </button>
                <button
                  onClick={() => { props.onHome(); setIsMenuOpen(false); }}
                    className="flex items-center justify-center gap-2 text-gray-600 font-bold uppercase text-[9px] p-2 bg-gray-50 rounded-lg w-full border border-gray-200 active:bg-gray-100 transition-all"
                >
                    Retour accueil
                </button>
                </div>
              ) : (
                <button onClick={() => { props.setCurrentPage('login'); setIsMenuOpen(false); }} className="flex items-center gap-3 text-emerald-600 font-bold uppercase text-[9px] p-2 bg-emerald-50 rounded-lg w-full border border-emerald-100 active:bg-emerald-100 transition-all hover:bg-emerald-100">
                  <User size={14}/> Se connecter / S'inscrire
                </button>
              )}
            </div>
            </div>
          </div>
        </div>
      )}

      {/* --- 4. NAVBAR INFÉRIEURE (Mobile) --- */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-[1200] border-t border-gray-200 bg-white/90 backdrop-blur-md"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid grid-cols-4 font-black uppercase tracking-wide mobile-bottom-nav">
          <button
            onClick={() => { props.onHome(); setIsMenuOpen(false); setIsMobileSpaceOpen(false); }}
            className={`py-3 flex flex-col items-center gap-1 hover:text-[#064e3b] active:scale-95 transition-transform ${props.currentPage === 'home' ? 'text-[#064e3b]' : 'text-gray-600'}`}
          >
            <Home size={20} />
            <span>Accueil</span>
          </button>
          <button
            onClick={() => { props.toggleCart(); setIsMenuOpen(false); setIsMobileSpaceOpen(false); }}
            className={`py-3 flex flex-col items-center gap-1 hover:text-[#064e3b] relative active:scale-95 transition-transform ${props.isCartOpen ? 'text-[#064e3b]' : 'text-gray-600'}`}
          >
            {props.cartCount > 0 && (
              <span className="absolute -top-1 right-4 bg-red-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full ring-2 ring-white">
                {props.cartCount}
              </span>
            )}
            <ShoppingCart size={20} />
            <span>Achat</span>
          </button>
          <button
            onClick={() => { props.onAccount(); setIsMenuOpen(false); setIsMobileSpaceOpen(false); }}
            className={`py-3 flex flex-col items-center gap-1 hover:text-[#064e3b] active:scale-95 transition-transform ${props.currentPage === 'dashboard' ? 'text-[#064e3b]' : 'text-gray-600'}`}
          >
            <UserCircle size={20} />
            <span>Mon compte</span>
          </button>
          <button
            onClick={() => { setIsMobileSpaceOpen(true); setIsMenuOpen(false); }}
            className={`py-3 flex flex-col items-center gap-1 hover:text-[#064e3b] active:scale-95 transition-transform ${isMobileSpaceOpen ? 'text-[#064e3b]' : 'text-gray-600'}`}
          >
            <LayoutGrid size={20} />
            <span>Espace</span>
          </button>
        </div>
      </div>

      {/* --- LISTE ESPACES (Mobile) --- */}
      {isMobileSpaceOpen && (
        <div className="md:hidden fixed inset-0 z-[1250] bg-white">
          <div className="p-4 flex items-center justify-between border-b border-gray-100">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-600">Choisir un espace</h3>
            <button onClick={() => setIsMobileSpaceOpen(false)} className="text-gray-400"><X size={20} /></button>
          </div>
          <div className="p-4 space-y-3">
            <button onClick={() => {props.onAccessChange('BUYER'); setIsMobileSpaceOpen(false);}} className="w-full px-4 py-4 text-left text-sm font-bold rounded-xl border border-gray-200 bg-white">Espace Client</button>
            <button onClick={() => {props.onAccessChange('STORE_ADMIN'); setIsMobileSpaceOpen(false);}} className="w-full px-4 py-4 text-left text-sm font-bold rounded-xl border border-gray-200 bg-white">Espace Vendeur</button>
            <button onClick={() => {props.onAccessChange('PARTNER_ADMIN'); setIsMobileSpaceOpen(false);}} className="w-full px-4 py-4 text-left text-sm font-bold rounded-xl border border-gray-200 bg-white">Centrale d'achat</button>
            <button onClick={() => {props.onAccessChange('SUPER_ADMIN'); setIsMobileSpaceOpen(false);}} className="w-full px-4 py-4 text-left text-sm font-bold rounded-xl border border-gray-200 bg-white">Espace Administrateur</button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;