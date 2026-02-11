import React from 'react';
import { ChevronRight, HelpCircle, Info, Wallet, Link as LinkIcon } from 'lucide-react';

interface SettingsItem {
  label: string;
  page: string;
}

interface SettingsSection {
  title: string;
  icon: React.ReactNode;
  items: SettingsItem[];
}

interface SettingsHubProps {
  onNavigate: (page: string) => void;
}

const SettingsHub: React.FC<SettingsHubProps> = ({ onNavigate }) => {
  const sections: SettingsSection[] = [
    {
      title: "Besoin d'aide",
      icon: <HelpCircle size={18} />,
      items: [
        { label: 'Discuter avec nous', page: 'footer-help-chat' },
        { label: 'Aide & FAQ', page: 'footer-faq' },
        { label: 'Contactez-nous', page: 'footer-contact' },
        { label: 'Signaler un abus', page: 'footer-report' }
      ]
    },
    {
      title: 'À propos',
      icon: <Info size={18} />,
      items: [
        { label: 'Qui sommes-nous', page: 'footer-about' },
        { label: 'Carrières', page: 'footer-careers' },
        { label: 'Conditions Générales', page: 'footer-terms' },
        { label: 'Politique de Cookies', page: 'footer-cookies' }
      ]
    },
    {
      title: "Gagnez de l'argent",
      icon: <Wallet size={18} />,
      items: [
        { label: 'Vendre sur Ivoire Destock', page: 'footer-sell' },
        { label: "Devenir centrale d'achat", page: 'footer-logistics' },
        { label: 'Espace vendeur', page: 'footer-seller-space' }
      ]
    },
    {
      title: 'Liens utiles',
      icon: <LinkIcon size={18} />,
      items: [
        { label: 'Suivre ma commande', page: 'footer-track' },
        { label: 'Modes de livraison', page: 'footer-shipping' },
        { label: 'Retour & Remboursement', page: 'footer-returns' }
      ]
    }
  ];

  return (
    <div className="min-h-[80vh] bg-[#064e3b]">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 pb-24 md:pb-12">
        <div className="text-white mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Paramètres</h1>
          <p className="text-emerald-100 text-sm mt-2">Aide, informations et liens utiles.</p>
        </div>

        <div className="grid gap-4">
          {sections.map((section) => (
            <div key={section.title} className="bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 text-[#064e3b] font-bold uppercase text-xs tracking-widest">
                {section.icon}
                {section.title}
              </div>
              <div className="divide-y divide-gray-100">
                {section.items.map((item) => (
                  <button
                    key={item.page}
                    onClick={() => onNavigate(item.page)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-emerald-50 hover:text-[#064e3b] transition-colors"
                  >
                    <span>{item.label}</span>
                    <ChevronRight size={16} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsHub;
