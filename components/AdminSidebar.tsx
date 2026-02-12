import React, { useState } from 'react';
import { UserRole } from '../types';
import { 
  LayoutDashboard, PackagePlus, Users, Settings, LogOut, Ticket, 
  ShoppingBag, History, MessageSquareText, Wallet, Truck, Menu, X 
} from 'lucide-react';

interface AdminSidebarProps {
  role: UserRole;
  onLogout: () => void;
  activeSection: string;
  onNavigate: (section: string) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ role, onLogout, activeSection, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false); // État pour ouvrir/fermer sur mobile

  const getRoleLabel = () => {
    switch (role) {
      case 'STORE_ADMIN': return "Vendeur";
      case 'PARTNER_ADMIN': return "Accès Grossiste";
      case 'SUPER_ADMIN': return "Super Admin";
      case 'ADMIN': return "Admin (lecture seule)";
      default: return "";
    }
  };

  const getBrandLabel = () => {
    switch (role) {
      case 'STORE_ADMIN': return { main: 'IVOIRE', sub: 'VENDEUR' };
      case 'PARTNER_ADMIN': return { main: 'IVOIRE', sub: "CENTRALE" };
      case 'SUPER_ADMIN':
      case 'ADMIN':
      default: return { main: 'IVOIRE', sub: 'ADMIN' };
    }
  };

  const getNavItems = () => {
    switch (role) {
      case 'STORE_ADMIN':
        return [
          { icon: LayoutDashboard, label: 'Tableau de Bord', id: 'dashboard' },
          { icon: PackagePlus, label: 'Catalogue & Publication', id: 'products' },
          { icon: ShoppingBag, label: 'Réception Commandes', id: 'orders' },
          { icon: History, label: 'Historique Ventes', id: 'history' },
          { icon: MessageSquareText, label: 'Messages B2B', id: 'messages' },
          { icon: Truck, label: 'Suivi Livraisons', id: 'deliveries' },
          { icon: Settings, label: 'Paramètres', id: 'settings' },
          { icon: LogOut, label: 'Retour accueil', id: 'return-home' },
        ];
      case 'PARTNER_ADMIN':
        return [
          { icon: LayoutDashboard, label: 'Tableau de Bord', id: 'dashboard' },
          { icon: PackagePlus, label: "Catalogue Accès Grossiste", id: 'products' },
          { icon: Truck, label: 'Livraisons', id: 'logistics' },
          { icon: Ticket, label: 'Support', id: 'tickets' },
          { icon: Settings, label: 'Paramètres', id: 'settings' },
          { icon: LogOut, label: 'Retour accueil', id: 'return-home' },
        ];
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return [
          { icon: LayoutDashboard, label: 'Vue d\'ensemble', id: 'dashboard' },
          { icon: Users, label: 'Utilisateurs', id: 'users' },
          { icon: Users, label: 'Créer Admin', id: 'admin-create' },
          { icon: ShoppingBag, label: 'Tous Produits', id: 'products' },
          { icon: Ticket, label: 'Tickets Globaux', id: 'tickets' },
          { icon: Wallet, label: 'Payouts', id: 'payouts' },
          { icon: PackagePlus, label: 'Stock Vendeurs', id: 'vendor-stock' },
          { icon: Wallet, label: 'Bénéfices Vendeurs', id: 'vendor-benefits' },
          { icon: ShoppingBag, label: 'Produits Vendeurs', id: 'vendor-products' },
          { icon: History, label: 'Audit Logs', id: 'audit' },
          { icon: Settings, label: 'Config Globale', id: 'settings' },
          { icon: LogOut, label: 'Retour accueil', id: 'return-home' },
        ];
      default: return [];
    }
  };

  const navItems = getNavItems();

  const handleNavigation = (id: string) => {
    if (id === 'return-home') {
      onLogout();
      setIsOpen(false);
      return;
    }
    onNavigate(id);
    setIsOpen(false); // Ferme le menu automatiquement sur mobile après un clic
  };

  return (
    <>
      {/* 1. BOUTON BURGER — espaceur en haut puis bouton (padding-top bien au-dessus du burger) */}
      <div className="lg:hidden fixed z-[70] left-4 flex flex-col">
        <div style={{ height: 'var(--safe-top)', minHeight: 'var(--safe-top)' }} aria-hidden />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center bg-[#0f172a] text-white rounded-md border border-gray-700 active:scale-95 transition-all shrink-0"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
          aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* 2. OVERLAY / BACKDROP — plein écran, clic pour fermer */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[998] bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-hidden
        />
      )}

      {/* 3. SIDEBAR — mobile: 100dvh, flex, zone liens scrollable, safe area logo + bas */}
      <aside
        className={`
        fixed left-0 z-[999] lg:sticky lg:top-0 lg:h-screen sidebar-safe-area-mobile
        w-64 md:w-72 max-w-[85vw] bg-[#0f172a] flex flex-col h-full overflow-hidden
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        {/* En-tête : logo + safe area (pas sous la batterie) */}
        <div
          className="shrink-0 border-b border-gray-800"
          style={{ paddingTop: 'var(--safe-top)' }}
        >
          <div className="p-4 lg:p-8 pb-6 flex items-center gap-4">
            <img src="/img/dest.png" alt="Logo" className="w-10 h-10 object-contain bg-white rounded-xl p-1.5 shadow-lg" />
            <div>
              <h1 className="font-black text-xl leading-none tracking-tighter italic text-white">
                {getBrandLabel().main}<span className="font-light text-emerald-400">{getBrandLabel().sub}</span>
              </h1>
              <span className="text-[10px] text-white uppercase font-black tracking-[0.2em]">{getRoleLabel()}</span>
            </div>
          </div>
        </div>

        {/* Zone de navigation (liens) — flex-1 overflow-y-auto = c’est elle qui scrolle */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar sidebar-nav-scroll">
          <nav className="p-5 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`
                  w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all text-left group
                  ${activeSection === item.id 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                    : 'hover:bg-white/5 text-gray-400 hover:text-white'
                  }
                `}
              >
                <item.icon size={22} className={`${activeSection === item.id ? 'text-white' : 'text-gray-500 group-hover:text-emerald-400'}`} />
                <span className="text-sm font-bold tracking-wide">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Zone basse : Profil + Déconnexion (mt-auto = reste en bas, pb pour safe area) */}
        <div className="mt-auto pt-4 pb-8 border-t border-gray-800 bg-[#020617] shrink-0 sidebar-footer-padding px-6">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-sm font-black shadow-lg ring-2 ring-emerald-900/50">
              {getRoleLabel().charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black truncate uppercase tracking-tighter text-[#fff]">{getRoleLabel()}</p>
              <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1.5 uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></span> 
                Connecté
              </p>
            </div>
          </div>
          
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-3 bg-red-500/10 text-red-400 border border-red-500/20 py-4 rounded-2xl hover:bg-red-500 hover:text-white transition-all text-[11px] font-black uppercase tracking-widest active:scale-95"
          >
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;