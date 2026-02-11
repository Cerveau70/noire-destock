import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import {
  Lock, Mail, User, Phone, ArrowRight, Store, MapPin,
  Loader2, AlertCircle, Fingerprint,
  Camera, X, Building2, ShieldCheck, Clock
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface AuthScreenProps {
  role: UserRole;
  onLogin: () => void;
  onCancel: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ role, onLogin, onCancel }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isAwaitingApproval, setIsAwaitingApproval] = useState(false); // État pour l'écran d'attente

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState(''); 
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState(''); 
  const [location, setLocation] = useState(''); 
  const [cniNumber, setCniNumber] = useState('');

  const [previews, setPreviews] = useState<{ front: string | null, back: string | null }>({ front: null, back: null });

  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isProRole = role === 'STORE_ADMIN' || role === 'PARTNER_ADMIN';

  useEffect(() => {
    if (isSuperAdmin) setIsLogin(true);
  }, [isSuperAdmin]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPreviews(prev => ({ ...prev, [side]: URL.createObjectURL(file) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isLogin) {
        // 1. Tenter la connexion technique
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;

        if (authData.user) {
          // 2. Vérifier le rôle et le statut dans la table 'profiles'
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, status, cni_status, created_at')
            .eq('id', authData.user.id)
            .single();

          if (profileError || !profile) throw new Error("Erreur lors de la récupération de votre profil.");

          // --- RÈGLE 1 : VÉRIFICATION DU RÔLE ---
          // On empêche un client de se connecter comme admin/vendeur et vice-versa
          if (profile.role !== role) {
            await supabase.auth.signOut(); // On le déconnecte immédiatement
            throw new Error(`Ce compte est enregistré en tant que ${profile.role}. Vous ne pouvez pas l'utiliser pour accéder à l'espace ${role}.`);
          }

          // --- RÈGLE 2 : VÉRIFICATION DU STATUT (APPROBATION) ---
          if (isProRole && profile.status === 'PENDING') {
            await supabase.auth.signOut();
            setIsAwaitingApproval(true); // On affiche l'écran d'attente
            setLoading(false);
            return;
          }

          // --- RÈGLE 3 : DÉLAI CNI (1 mois) ---
          if (isProRole && profile.status === 'ACTIVE' && profile.cni_status !== 'VERIFIED') {
            const createdAt = profile.created_at ? new Date(profile.created_at) : null;
            if (createdAt) {
              const now = new Date();
              const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
              if (diffDays >= 30) {
                await supabase.from('profiles').update({ status: 'SUSPENDED' }).eq('id', authData.user.id);
                await supabase.auth.signOut();
                throw new Error("Votre compte est bloqué : CNI non confirmée après 1 mois.");
              }
            }
          }

          if (profile.status === 'BANNED' || profile.status === 'SUSPENDED') {
            await supabase.auth.signOut();
            throw new Error("Votre compte a été suspendu ou banni. Contactez le support.");
          }

          onLogin(); // Tout est OK
        }
      } else {
        // --- INSCRIPTION ---
        const normalizedPhone = phone.replace(/\s+/g, '');
        if (!/^\d{10}$/.test(normalizedPhone)) {
          throw new Error("Le numéro de téléphone doit contenir 10 chiffres.");
        }

        if (cniNumber) {
          const normalizedCni = cniNumber.replace(/\s+/g, '').toUpperCase();
          if (!/^[A-Z0-9]{11}$/.test(normalizedCni)) {
            throw new Error("Le NNI (CNI) doit contenir 11 caractères alphanumériques.");
          }
        }

        if (isProRole && !cniNumber && (!previews.front || !previews.back)) {
          throw new Error("Veuillez fournir un NNI (CNI) ou les photos recto/verso.");
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, role: role } }
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').insert([{
            id: data.user.id,
            full_name: fullName,
            role: role,
            email: email,
            phone: normalizedPhone,
            business_name: isProRole ? businessName : null,
            location: isProRole ? location : null,
            wallet_balance: 0,
            status: isProRole ? 'PENDING' : 'ACTIVE' // Les pros sont en attente par défaut
          }]);

          if (profileError) throw profileError;

          if (isProRole) {
            // Les pros restent en attente : on coupe la session éventuelle
            await supabase.auth.signOut();
            setIsAwaitingApproval(true);
          } else {
            await supabase.auth.signOut();
            setIsLogin(true);
            setSuccessMsg("Compte créé. Connectez-vous pour continuer.");
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur d'authentification");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setErrorMsg("Veuillez saisir votre email.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      setErrorMsg("Erreur lors de la réinitialisation.");
      return;
    }
    setSuccessMsg("Email de réinitialisation envoyé.");
  };

  const handleGoogleAuth = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  // --- ÉCRAN D'ATTENTE DE VALIDATION ---
  if (isAwaitingApproval) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 text-center border border-emerald-100 animate-scale-in">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Clock size={40} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight mb-4">Compte en attente de validation</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            Merci pour votre inscription ! Votre compte <strong>{role === 'STORE_ADMIN' ? 'Vendeur' : "Centrale d'achat"}</strong> doit être vérifié par notre équipe avant de pouvoir accéder à la console.
            Après activation, vous aurez <strong>1 mois</strong> pour confirmer votre CNI.
          </p>
          <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-700 text-xs font-bold mb-8">
            Délai moyen de vérification : 12h à 24h.
          </div>
          <button 
            onClick={() => { setIsAwaitingApproval(false); setIsLogin(true); }}
            className="w-full py-4 bg-[#064e3b] text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-lg hover:opacity-90 transition-all"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      
      {/* Logo Externe */}
      <div className="mb-8 text-center flex flex-col items-center gap-2 cursor-pointer" onClick={onCancel}>
        <img src="/img/dest.png" alt="Logo" className="w-16 h-16 object-contain" />
        <h1 className="text-2xl font-black text-[#064e3b] tracking-tighter uppercase">Ivoire<span className="font-light">Destock</span></h1>
      </div>

      <div className={`bg-white w-full ${(!isLogin && isProRole) ? 'max-w-4xl' : 'max-w-md'} rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 transition-all duration-500`}>
        
        {/* Bannière */}
        <div className={`p-8 text-center ${isSuperAdmin ? 'bg-slate-900' : 'bg-[#064e3b]'} text-white relative`}>
          <button onClick={onCancel} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"><X size={24}/></button>
          
          <div className="flex justify-center mb-4">
             <div className="bg-white p-2 rounded-2xl shadow-xl">
                <img src="/img/dest.png" alt="Logo" className="w-12 h-12 object-contain" />
             </div>
          </div>

          <h2 className="text-xl font-black uppercase tracking-widest leading-none">
            {isLogin ? 'Connexion' : 'Inscription'}
          </h2>
          <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">
            {isSuperAdmin ? 'Administration' : isProRole ? 'Espace D\'authentification' : 'Espace Client'}
          </p>
        </div>

        <div className="p-8">
          <button
            onClick={onCancel}
            className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-[#064e3b] mb-6"
            type="button"
          >
            Retour au menu principal
          </button>
          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-xs font-bold">
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold animate-shake">
              <AlertCircle size={18} /> {errorMsg}
            </div>
          )}

          {!isSuperAdmin && (
            <div className="flex bg-gray-100 p-1 rounded-2xl mb-8">
              <button 
                type="button"
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${isLogin ? 'bg-white text-[#064e3b] shadow-sm' : 'text-gray-400'}`}
                onClick={() => setIsLogin(true)}
              >
                Se Connecter
              </button>
              <button 
                type="button"
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${!isLogin ? 'bg-white text-[#064e3b] shadow-sm' : 'text-gray-400'}`}
                onClick={() => setIsLogin(false)}
              >
                Créer Compte
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isSuperAdmin && role === 'BUYER' && (
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-full py-4 border border-gray-200 bg-white text-gray-700 font-black uppercase text-xs rounded-2xl shadow-sm hover:bg-gray-50"
              >
                Continuer avec Google
              </button>
            )}
            
            <div className={`grid grid-cols-1 ${(!isLogin && isProRole) ? 'md:grid-cols-2 gap-8' : 'gap-4'}`}>
              
              <div className="space-y-4">
                {!isLogin && (
                  <div className="relative">
                    <User className="absolute left-4 top-4 text-gray-400" size={18} />
                    <input 
                      type="text" required placeholder="Nom & Prénom"
                      value={fullName} onChange={e => setFullName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-[#064e3b] rounded-2xl outline-none text-sm font-bold transition-all"
                    />
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-4 top-4 text-gray-400" size={18} />
                  <input 
                    type="email" required placeholder="Adresse Email"
                    value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-[#064e3b] rounded-2xl outline-none text-sm font-bold transition-all"
                  />
                </div>

                {!isLogin && (
                  <div className="relative">
                    <Phone className="absolute left-4 top-4 text-gray-400" size={18} />
                    <input 
                      type="tel" required placeholder="Numéro de téléphone"
                      value={phone} onChange={e => setPhone(e.target.value)}
                      pattern="\d{10}"
                      inputMode="numeric"
                      maxLength={10}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-[#064e3b] rounded-2xl outline-none text-sm font-bold transition-all"
                    />
                  </div>
                )}

                <div className="relative">
                  <Lock className="absolute left-4 top-4 text-gray-400" size={18} />
                  <input 
                    type={showPassword ? 'text' : 'password'} required placeholder="Mot de passe"
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-[#064e3b] rounded-2xl outline-none text-sm font-bold transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-gray-400 hover:text-[#064e3b]"
                  >
                    {showPassword ? 'Masquer' : 'Afficher'}
                  </button>
                </div>
              </div>

              {!isLogin && isProRole && (
                <div className="space-y-4 border-l border-gray-100 md:pl-8">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Structure & CNI</p>
                  
                  <div className="relative">
                    <Store className="absolute left-4 top-4 text-gray-400" size={18} />
                    <input 
                      type="text" required placeholder={role === 'STORE_ADMIN' ? "Nom du Magasin" : "Nom de la Structure"}
                      value={businessName} onChange={e => setBusinessName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-[#064e3b] rounded-2xl outline-none text-sm font-bold transition-all"
                    />
                  </div>

                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 text-gray-400" size={18} />
                    <input 
                      type="text" required placeholder="Commune / Ville"
                      value={location} onChange={e => setLocation(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-[#064e3b] rounded-2xl outline-none text-sm font-bold transition-all"
                    />
                  </div>

                  <div className="pt-2">
                    <p className="text-[10px] font-black text-[#064e3b] uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Fingerprint size={14}/> Pièce d'identité
                    </p>
                    <input 
                      type="text" placeholder="N° de CNI ou Passeport"
                      value={cniNumber} onChange={e => setCniNumber(e.target.value.toUpperCase())}
                      maxLength={11}
                      className="w-full px-4 py-3 bg-emerald-50/30 border border-emerald-100 rounded-xl outline-none text-xs font-bold mb-3"
                    />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 cursor-pointer hover:bg-emerald-50 relative overflow-hidden transition-all">
                        {previews.front ? <img src={previews.front} className="absolute inset-0 w-full h-full object-cover" /> : <Camera size={20} className="text-gray-300"/>}
                        <input type="file" className="hidden" onChange={e => handleFileChange(e, 'front')} />
                      </label>
                      <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 cursor-pointer hover:bg-emerald-50 relative overflow-hidden transition-all">
                        {previews.back ? <img src={previews.back} className="absolute inset-0 w-full h-full object-cover" /> : <Camera size={20} className="text-gray-300"/>}
                        <input type="file" className="hidden" onChange={e => handleFileChange(e, 'back')} />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-5 rounded-[1.5rem] text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 mt-6 ${isSuperAdmin ? 'bg-slate-900' : 'bg-[#064e3b]'} disabled:opacity-50`}
            >
              {loading ? <Loader2 className="animate-spin"/> : (isLogin ? 'Accéder à mon espace' : 'Créer mon compte')}
              {!loading && <ArrowRight size={18}/>}
            </button>

          </form>

          {isLogin && (
            <p className="text-center mt-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Mot de passe oublié ? <button type="button" onClick={handleResetPassword} className="text-[#064e3b] hover:underline">Réinitialiser</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;