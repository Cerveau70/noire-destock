import React from 'react';
import { X, HelpCircle, Info, DollarSign, Link2, ChevronRight, MessageCircle, FileQuestion, Building2, Briefcase, Package, Truck, RotateCcw } from 'lucide-react';

interface HelpDrawerProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

const HelpDrawer: React.FC<HelpDrawerProps> = ({ open, onClose, onNavigate }) => {
  if (!open) return null;

  const handleNav = (page: string) => {
    onNavigate(page);
    onClose();
  };

  const cardClass = "w-full flex items-center gap-3 px-4 py-3 bg-white border border-emerald-200 rounded-xl hover:bg-emerald-50/50 transition-colors text-left";
  const iconWrap = "p-2 rounded-lg bg-emerald-500/20 text-emerald-600 shrink-0";

  return (
    <>
      <div className="fixed inset-0 z-[1300] bg-black/40 md:hidden" onClick={onClose} aria-hidden />
      <div
        className="fixed left-0 right-0 bottom-0 z-[1310] md:hidden bg-white rounded-t-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300"
        style={{
          height: '90%',
          maxHeight: '90vh',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Header avec bouton X */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 shrink-0" style={{ paddingTop: 'var(--safe-top)' }}>
          <h2 className="text-base font-black uppercase tracking-tight text-gray-900">Aide & Infos</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label="Fermer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* 1. Besoin d'aide */}
          <section>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-emerald-600 mb-3">Besoin d'aide</h3>
            <div className="space-y-2">
              <button onClick={() => handleNav('footer-help-chat')} className={cardClass}>
                <div className={iconWrap}><MessageCircle size={20} /></div>
                <span className="font-bold text-sm text-gray-900 flex-1">Discuter avec nous</span>
                <ChevronRight size={18} className="text-emerald-600 shrink-0" />
              </button>
              <button onClick={() => handleNav('footer-faq')} className={cardClass}>
                <div className={iconWrap}><FileQuestion size={20} /></div>
                <span className="font-bold text-sm text-gray-900 flex-1">FAQ & Aide</span>
                <ChevronRight size={18} className="text-emerald-600 shrink-0" />
              </button>
              <button onClick={() => handleNav('footer-contact')} className={cardClass}>
                <div className={iconWrap}><HelpCircle size={20} /></div>
                <span className="font-bold text-sm text-gray-900 flex-1">Contact</span>
                <ChevronRight size={18} className="text-emerald-600 shrink-0" />
              </button>
            </div>
          </section>

          <div className="border-t border-gray-100" />

          {/* 2. À propos */}
          <section>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-emerald-600 mb-3">À propos</h3>
            <div className="space-y-2">
              <button onClick={() => handleNav('footer-about')} className={cardClass}>
                <div className={iconWrap}><Info size={20} /></div>
                <span className="font-bold text-sm text-gray-900 flex-1">Qui sommes-nous</span>
                <ChevronRight size={18} className="text-emerald-600 shrink-0" />
              </button>
              <button onClick={() => handleNav('footer-careers')} className={cardClass}>
                <div className={iconWrap}><Building2 size={20} /></div>
                <span className="font-bold text-sm text-gray-900 flex-1">Carrières</span>
                <ChevronRight size={18} className="text-emerald-600 shrink-0" />
              </button>
            </div>
          </section>

          <div className="border-t border-gray-100" />

          {/* 3. Gagnez de l'argent */}
          <section>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-emerald-600 mb-3">Gagnez de l'argent</h3>
            <div className="space-y-2">
              <button onClick={() => handleNav('footer-sell')} className={cardClass}>
                <div className={iconWrap}><DollarSign size={20} /></div>
                <span className="font-bold text-sm text-gray-900 flex-1">Vendre sur Ivoire Destock</span>
                <ChevronRight size={18} className="text-emerald-600 shrink-0" />
              </button>
              <button onClick={() => handleNav('footer-seller-space')} className={cardClass}>
                <div className={iconWrap}><Briefcase size={20} /></div>
                <span className="font-bold text-sm text-gray-900 flex-1">Espace vendeur</span>
                <ChevronRight size={18} className="text-emerald-600 shrink-0" />
              </button>
            </div>
          </section>

          <div className="border-t border-gray-100" />

          {/* 4. Liens utiles */}
          <section>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-emerald-600 mb-3">Liens utiles</h3>
            <div className="space-y-2">
              <button onClick={() => handleNav('footer-track')} className={cardClass}>
                <div className={iconWrap}><Package size={20} /></div>
                <span className="font-bold text-sm text-gray-900 flex-1">Suivre une commande</span>
                <ChevronRight size={18} className="text-emerald-600 shrink-0" />
              </button>
              <button onClick={() => handleNav('footer-shipping')} className={cardClass}>
                <div className={iconWrap}><Truck size={20} /></div>
                <span className="font-bold text-sm text-gray-900 flex-1">Livraison</span>
                <ChevronRight size={18} className="text-emerald-600 shrink-0" />
              </button>
              <button onClick={() => handleNav('footer-returns')} className={cardClass}>
                <div className={iconWrap}><RotateCcw size={20} /></div>
                <span className="font-bold text-sm text-gray-900 flex-1">Retours & Remboursements</span>
                <ChevronRight size={18} className="text-emerald-600 shrink-0" />
              </button>
              <button onClick={() => handleNav('settings')} className={cardClass}>
                <div className={iconWrap}><Link2 size={20} /></div>
                <span className="font-bold text-sm text-gray-900 flex-1">Paramètres & conditions</span>
                <ChevronRight size={18} className="text-emerald-600 shrink-0" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default HelpDrawer;
