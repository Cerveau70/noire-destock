import React from 'react';
import { Mail, Settings, HelpCircle, Info } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {

  const APP_STORE_LINK = "https://apps.apple.com/app/ivoire-destock";
  const PLAY_STORE_LINK = "https://play.google.com/store/apps/details?id=com.ivoiredestock.app";

  return (
    <footer className="w-full">
      {/* Newsletter Section - compacte (style Jumia/Amazon) */}
      <div className="bg-[#388E3C] py-5 md:py-8 px-4 md:px-8 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4 md:gap-6">
          <div className="flex items-start gap-3 lg:w-1/3">
            <div className="p-2 bg-white/20 rounded-lg shrink-0">
              <Mail className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-white font-bold text-[14px] md:text-lg uppercase leading-tight">Nouveau sur Ivoire Destock ?</h3>
              <p className="text-emerald-50 text-[11px] md:text-xs opacity-90 leading-snug mt-0.5">Recevez en priorité les arrivages et les ventes flash !</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-1 w-full lg:max-w-md gap-2 sm:gap-0 shadow-xl rounded-lg overflow-hidden">
            <input type="email" placeholder="Votre adresse email..." className="w-full h-[40px] px-4 bg-white focus:outline-none text-[13px] rounded-lg sm:rounded-none sm:rounded-l-lg" />
            <button className="bg-[#FDD835] text-emerald-900 font-bold h-[40px] px-4 uppercase text-[12px] rounded-lg sm:rounded-none sm:rounded-r-lg shrink-0">S'abonner</button>
          </div>

          {/* App Store / Play Store côte à côte (sans QR sur mobile) */}
          <div className="w-full lg:w-1/3 flex flex-col items-center lg:items-end">
            <p className="text-white text-[10px] font-black mb-2 uppercase tracking-widest">L'App dans votre poche</p>
            <div className="flex items-center justify-center gap-3">
              <a href={APP_STORE_LINK} target="_blank" rel="noopener noreferrer" className="h-10 md:h-11 block shrink-0 hover:opacity-90 transition-opacity">
                <img src="/img/app.jpg" alt="Télécharger sur l'App Store" className="h-full w-auto object-contain" />
              </a>
              <a href={PLAY_STORE_LINK} target="_blank" rel="noopener noreferrer" className="h-10 md:h-11 block shrink-0 hover:opacity-90 transition-opacity">
                <img src="/img/play.png" alt="Disponible sur Google Play" className="h-full w-auto object-contain" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Links Section */}
      <div className="bg-[#0f172a] text-white pt-16 pb-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 mb-16">
          <div className="space-y-6 lg:col-span-2">
            <h4 className="font-black text-sm uppercase text-emerald-400 tracking-widest">PARAMÈTRES & AIDE</h4>
            {/* Mobile : 3 lignes icône + label (Paramètre, Besoin d'aide, À propos de nous) */}
            <div className="md:hidden space-y-2">
              <button
                onClick={() => onNavigate('settings')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#0b1220] border border-emerald-900/40 rounded-xl hover:bg-emerald-900/30 transition-colors text-left"
              >
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Settings size={20} />
                </div>
                <span className="font-bold text-sm text-white uppercase tracking-wide">Paramètre</span>
              </button>
              <button
                onClick={() => onNavigate('settings')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#0b1220] border border-emerald-900/40 rounded-xl hover:bg-emerald-900/30 transition-colors text-left"
              >
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <HelpCircle size={20} />
                </div>
                <span className="font-bold text-sm text-white uppercase tracking-wide">Besoin d'aide</span>
              </button>
              <button
                onClick={() => onNavigate('settings')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#0b1220] border border-emerald-900/40 rounded-xl hover:bg-emerald-900/30 transition-colors text-left"
              >
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Info size={20} />
                </div>
                <span className="font-bold text-sm text-white uppercase tracking-wide">À propos de nous</span>
              </button>
            </div>
            {/* Desktop : carte + bouton */}
            <div className="hidden md:block bg-[#0b1220] border border-emerald-900/40 rounded-2xl p-5">
              <p className="text-sm text-emerald-100 mb-4">
                Toutes les pages d'aide, infos et conditions sont regroupées ici.
              </p>
              <button
                onClick={() => onNavigate('settings')}
                className="w-full bg-emerald-500 text-white font-black uppercase text-xs tracking-widest py-3 rounded-xl hover:bg-emerald-400 transition-colors"
              >
                Ouvrir les paramètres
              </button>
            </div>
          </div>

          <div className="space-y-6 hidden md:block">
            <h4 className="font-black text-sm uppercase text-emerald-400 tracking-widest">NOS PAYS</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li className="flex items-center gap-3"><span>🇨🇮</span> Côte d'Ivoire</li>
              <li className="flex items-center gap-3 opacity-30"><span>🇸🇳</span> Sénégal</li>
              <li className="flex items-center gap-3 opacity-30"><span>🇨🇲</span> Cameroun</li>
            </ul>
          </div>

          {/* PARTENAIRES - ÉPURÉ (masqué sur mobile) */}
          <div className="space-y-6 hidden md:block">
          <h4 className="font-black text-sm uppercase text-emerald-400 tracking-widest">CENTRALES D'ACHAT</h4>
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center p-3 shadow-xl group hover:scale-105 transition-transform">
              <img src="/img/carr.png" alt="Carrefour" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 mb-10"></div>

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-8 mb-6">
          {/* SOCIALS */}
          <div className="flex flex-col gap-3 items-center lg:items-start">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">RETROUVEZ-NOUS SUR</span>
            <div className="flex gap-3">
              <a href="#" className="hover:-translate-y-1 transition-transform"><img src="/img/fb.png" className="w-8 h-8 md:w-10 md:h-10 object-contain" alt="FB" /></a>
              <a href="#" className="hover:-translate-y-1 transition-transform"><img src="/img/inst.jpg" className="w-8 h-8 md:w-10 md:h-10 object-contain" alt="IG" /></a>
              <a href="#" className="hover:-translate-y-1 transition-transform"><img src="/img/x.png" className="w-8 h-8 md:w-10 md:h-10 object-contain" alt="X" /></a>
              <a href="#" className="hover:-translate-y-1 transition-transform"><img src="/img/link.png" className="w-8 h-8 md:w-10 md:h-10 object-contain" alt="IN" /></a>
            </div>
          </div>

          {/* PAYMENTS - marge basse pour ne pas tomber dans la barre de nav */}
          <div className="flex flex-col gap-3 items-center lg:items-end">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">PAIEMENT SÉCURISÉ</span>
            <div className="flex gap-2">
              <img src="/img/paypal.png" className="h-8 md:h-10 bg-white rounded-xl p-2 shadow-lg" alt="Paypal" />
              <img src="/img/visa.png" className="h-8 md:h-10 bg-white rounded-xl p-2 shadow-lg" alt="Visa" />
              <img src="/img/master.jpg" className="h-8 md:h-10 bg-white rounded-xl p-2 shadow-lg" alt="Master" />
              <img src="/img/om.png" className="h-8 md:h-10 bg-white rounded-xl p-2 shadow-lg" alt="Orange" />
            </div>
          </div>
        </div>

        {/* <div className="text-center mt-16 pt-8 border-t border-white/5">
          <p className="text-[9px] text-gray-600 font-black tracking-widest uppercase">
            © 2026 IVOIRE DESTOCK. LA PLATEFORME N°1 DE LIQUIDATION EN CÔTE D'IVOIRE.
          </p>
        </div> */}
      </div>
    </footer>
  );
};

export default Footer;