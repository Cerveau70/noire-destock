import React from 'react';
import { ArrowLeft, MessageCircle, Info, Clock, HelpCircle, FileText, CreditCard, User, Mail, Phone, ShieldAlert, Target, Briefcase, Truck, Package, RotateCcw, BookOpen, Cookie } from 'lucide-react';

interface StaticSection {
  title: string;
  body: string;
}

interface StaticPageProps {
  title: string;
  subtitle?: string;
  sections: StaticSection[];
  onBack?: () => void;
}

const getSectionIcon = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes('service') || t.includes('à propos')) return <Info size={22} className="text-emerald-600 shrink-0" />;
  if (t.includes('canaux') || t.includes('contact') || t.includes('discuter') || t.includes('chat')) return <MessageCircle size={22} className="text-emerald-600 shrink-0" />;
  if (t.includes('horaires')) return <Clock size={22} className="text-emerald-600 shrink-0" />;
  if (t.includes('faq') || t.includes('quoi') || t.includes('commande')) return <HelpCircle size={22} className="text-emerald-600 shrink-0" />;
  if (t.includes('paiement')) return <CreditCard size={22} className="text-emerald-600 shrink-0" />;
  if (t.includes('compte') || t.includes('profil')) return <User size={22} className="text-emerald-600 shrink-0" />;
  if (t.includes('email')) return <Mail size={22} className="text-emerald-600 shrink-0" />;
  if (t.includes('téléphone') || t.includes('telephone')) return <Phone size={22} className="text-emerald-600 shrink-0" />;
  if (t.includes('signal') || t.includes('abus')) return <ShieldAlert size={22} className="text-emerald-600 shrink-0" />;
  if (t.includes('mission') || t.includes('service')) return <Target size={22} className="text-emerald-600 shrink-0" />;
  if (t.includes('pour qui')) return <User size={22} className="text-emerald-600 shrink-0" />;
  if (t.includes('postes') || t.includes('carrières')) return <Briefcase size={22} className="text-emerald-600 shrink-0" />;
  if (t.includes('utilisation') || t.includes('responsabilités')) return <FileText size={22} className="text-emerald-600 shrink-0" />;
  if (t.includes('cookies') || t.includes('données')) return <Cookie size={22} className="text-emerald-600 shrink-0" />;
  if (t.includes('principe') || t.includes('onboarding') || t.includes('vendeur')) return <Briefcase size={22} className="text-emerald-600 shrink-0" />;
  if (t.includes('rôle') || t.includes('centrale')) return <Package size={22} className="text-emerald-600 shrink-0" />;
  if (t.includes('connexion') || t.includes('fonctionnalités')) return <User size={22} className="text-emerald-600 shrink-0" />;
  if (t.includes('suivre') || t.includes('commande')) return <Package size={22} className="text-emerald-600 shrink-0" />;
  if (t.includes('livraison')) return <Truck size={22} className="text-emerald-600 shrink-0" />;
  if (t.includes('retour') || t.includes('remboursement')) return <RotateCcw size={22} className="text-emerald-600 shrink-0" />;
  if (t.includes('conditions') || t.includes('politique')) return <BookOpen size={22} className="text-emerald-600 shrink-0" />;
  return <Info size={22} className="text-emerald-600 shrink-0" />;
};

const StaticPage: React.FC<StaticPageProps> = ({ title, subtitle, sections, onBack }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 md:py-12 space-y-6 md:space-y-8 pb-24 md:pb-12">
      {/* Flèche de retour en haut à gauche */}
      {onBack && (
        <div className="flex items-center gap-2 -ml-1 mb-2">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-gray-100 active:scale-95 transition-transform text-gray-700"
            aria-label="Retour"
          >
            <ArrowLeft size={24} />
          </button>
          <span className="text-sm font-bold text-gray-600">Retour</span>
        </div>
      )}

      <div className="bg-white border border-gray-200 p-6 md:p-8 shadow-sm rounded-xl">
        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-[#0f172a]">{title}</h1>
        {subtitle && <p className="text-gray-500 mt-2 text-sm">{subtitle}</p>}
      </div>
      <div className="space-y-4 md:space-y-6">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-white border border-gray-200 p-5 md:p-6 rounded-xl shadow-sm flex gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-50 shrink-0 h-fit">
              {getSectionIcon(section.title)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-black uppercase text-[#0f172a] mb-2">{section.title}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{section.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaticPage;
