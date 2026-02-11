import React, { useState } from 'react';
import { Mail, MessageCircle } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [openSection, setOpenSection] = useState<string | null>('help');

  const toggleSection = (key: string) => {
    setOpenSection((prev) => (prev === key ? null : key));
  };

  const APP_STORE_LINK = "https://apps.apple.com/app/ivoire-destock";
  const PLAY_STORE_LINK = "https://play.google.com/store/apps/details?id=com.ivoiredestock.app";

  return (
    <footer className="w-full">
      {/* Newsletter Section */}
      <div className="bg-[#388E3C] py-6 md:py-12 px-4 md:px-8 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="flex items-start gap-5 lg:w-1/3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Mail className="text-white" size={32} />
            </div>
            <div>
              <h3 className="text-white font-black text-xl uppercase leading-tight">NOUVEAU SUR IVOIRE DESTOCK ?</h3>
              <p className="text-emerald-50 text-sm opacity-90">Recevez en priorité les arrivages et les ventes flash !</p>
            </div>
          </div>

          <div className="flex flex-1 w-full lg:max-w-md shadow-2xl rounded-xl overflow-hidden">
            <input type="email" placeholder="Votre adresse email..." className="w-full px-4 md:px-6 py-3 md:py-4 bg-white focus:outline-none" />
            <button className="bg-[#FDD835] text-emerald-900 font-black px-5 md:px-8 py-3 md:py-4 uppercase text-xs md:text-sm">S'abonner</button>
          </div>

          <div className="w-full lg:w-1/3 flex flex-col items-center lg:items-end">
            <p className="text-white text-[10px] font-black mb-4 uppercase tracking-widest">L'App dans votre poche</p>
            <div className="flex items-center gap-4">
              <a href={PLAY_STORE_LINK} target="_blank" rel="noopener noreferrer" className="bg-white p-2 rounded-xl shadow-xl border-2 border-emerald-400 shrink-0">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(PLAY_STORE_LINK)}`} alt="QR Code Play Store" className="w-14 h-14 md:w-16 md:h-16 block" />
              </a>
              <div className="flex flex-col gap-2">
                <a href={APP_STORE_LINK} target="_blank"><img src="/img/app.jpg" alt="App Store" className="h-8 md:h-9" /></a>
                <a href={PLAY_STORE_LINK} target="_blank"><img src="/img/play.png" alt="Play Store" className="h-8 md:h-9" /></a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Links Section */}
      <div className="bg-[#0f172a] text-white pt-16 pb-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 mb-16">
          <div className="space-y-6 lg:col-span-2">
            <h4 className="font-black text-sm uppercase text-emerald-400 tracking-widest">PARAMÈTRES & AIDE</h4>
            <div className="bg-[#0b1220] border border-emerald-900/40 rounded-2xl p-5">
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

          <div className="space-y-6">
            <h4 className="font-black text-sm uppercase text-emerald-400 tracking-widest">NOS PAYS</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li className="flex items-center gap-3"><span>🇨🇮</span> Côte d'Ivoire</li>
              <li className="flex items-center gap-3 opacity-30"><span>🇸🇳</span> Sénégal</li>
              <li className="flex items-center gap-3 opacity-30"><span>🇨🇲</span> Cameroun</li>
            </ul>
          </div>

          {/* PARTENAIRES - ÉPURÉ */}
          <div className="space-y-6">
          <h4 className="font-black text-sm uppercase text-emerald-400 tracking-widest">CENTRALES D'ACHAT</h4>
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center p-3 shadow-xl group hover:scale-105 transition-transform">
              <img src="/img/carr.png" alt="Carrefour" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 mb-10"></div>

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-12">
          {/* SOCIALS - AVEC IMAGES LOCALES */}
          <div className="flex flex-col gap-5 items-center lg:items-start">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">RETROUVEZ-NOUS SUR</span>
            <div className="flex gap-3">
              <a href="#" className="hover:-translate-y-1 transition-transform"><img src="/img/fb.png" className="w-8 h-8 md:w-10 md:h-10 object-contain" alt="FB" /></a>
              <a href="#" className="hover:-translate-y-1 transition-transform"><img src="/img/inst.jpg" className="w-8 h-8 md:w-10 md:h-10 object-contain" alt="IG" /></a>
              <a href="#" className="hover:-translate-y-1 transition-transform"><img src="/img/x.png" className="w-8 h-8 md:w-10 md:h-10 object-contain" alt="X" /></a>
              <a href="#" className="hover:-translate-y-1 transition-transform"><img src="/img/link.png" className="w-8 h-8 md:w-10 md:h-10 object-contain" alt="IN" /></a>
            </div>
          </div>

          {/* PAYMENTS - AVEC IMAGES LOCALES */}
          <div className="flex flex-col gap-5 items-center lg:items-end">
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