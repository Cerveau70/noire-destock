
import React, { useState, useEffect } from 'react';
import { UserRole, Product, CartItem, UserProfile } from './types';
import { fetchProducts, getUserProfile, createOrdersBySeller, updateWalletBalance, createWalletTransaction } from './services/backendService';
import { initiateWavePayment } from './services/paymentService'; // Import du service de paiement
import { supabase } from './services/supabaseClient';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import StaticPage from './pages/StaticPage';
import SettingsHub from './pages/SettingsHub';
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import Dashboard from './pages/Dashboard';
import AIChat from './components/AIChat';
import AuthScreen from './components/AuthScreen';
import AdminSidebar from './components/AdminSidebar';
import { X, Check, Bell, Wallet, AlertCircle, Smartphone, ArrowLeft, ArrowRight, Plus, Minus } from 'lucide-react';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [cookieChoice, setCookieChoice] = useState<'accepted' | 'refused' | null>(null);
  const [showCookieDetails, setShowCookieDetails] = useState(false);
  const [role, setRole] = useState<UserRole>('BUYER');
  const [currentPage, setCurrentPage] = useState('home');
  const [adminSection, setAdminSection] = useState('dashboard');
  const [buyerSection, setBuyerSection] = useState<'dashboard' | 'messages'>('dashboard');
  const [showAccountPrompt, setShowAccountPrompt] = useState(false);
  const [buyerChatSellerId, setBuyerChatSellerId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Payment States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'SELECT' | 'PHONE_INPUT' | 'PROCESSING' | 'SUCCESS'>('SELECT');
  const [selectedPaymentProvider, setSelectedPaymentProvider] = useState<'WAVE' | 'OM' | 'MTN' | null>(null);
  const [paymentPhone, setPaymentPhone] = useState('');

  // Real Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<any>(null);
  const [contactChannel, setContactChannel] = useState<'whatsapp' | 'messages'>(() => {
    if (typeof window === 'undefined') return 'whatsapp';
    const stored = window.localStorage.getItem('contact_channel');
    return stored === 'messages' ? 'messages' : 'whatsapp';
  });

  // 1. Initialize & Auth Listener
  useEffect(() => {
    // Load Products
    const loadProducts = async () => {
      const dbProducts = await fetchProducts();
      if (dbProducts.length > 0) setProducts(dbProducts);
    };
    loadProducts();

    // Check Active Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchUserData(session.user.id);
    });

    // Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setUserProfile(null);
        setRole('BUYER'); // Reset role on logout
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('cookies_consent');
    if (stored === 'accepted' || stored === 'refused') {
      setCookieChoice(stored);
    }
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (!stored) setShowWelcome(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleCookieChoice = (choice: 'accepted' | 'refused') => {
    setCookieChoice(choice);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('cookies_consent', choice);
    }
    setShowWelcome(false);
    setShowCookieDetails(false);
  };

  const fetchUserData = async (userId: string) => {
    let profile = await getUserProfile(userId);
    if (!profile && session?.user) {
      const fallbackName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Utilisateur';
      const fallbackEmail = session.user.email || '';
      await supabase.from('profiles').insert([{
        id: userId,
        full_name: fallbackName,
        role: 'BUYER',
        email: fallbackEmail,
        phone: '',
        wallet_balance: 0,
        status: 'ACTIVE'
      }]);
      profile = await getUserProfile(userId);
    }
    if (profile) {
      setUserProfile(profile);
      if (profile.role) setRole(profile.role);
      if (profile.phone) setPaymentPhone(profile.phone); // Prefill phone
    }
  };

  // Auth State Helpers
  const isAuthenticated = !!session;
  const effectiveRole: UserRole = userProfile?.role || role;

  const [authTarget, setAuthTarget] = useState<'dashboard' | 'checkout' | null>(null);

  // Notification System
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'info' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Cart Logic
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    showNotification(`${product.name} ajouté au panier`, 'success');
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const incrementCartItem = (id: string) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item));
  };

  const decrementCartItem = (id: string) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckoutClick = () => {
    if (!isAuthenticated) {
      setAuthTarget('checkout');
      setIsCartOpen(false);
    } else {
      setPaymentStep('SELECT');
      setSelectedPaymentProvider(null);
      setShowPaymentModal(true);
      setIsCartOpen(false);
    }
  };

  const handleSearchSubmit = () => {
    setCurrentPage('marketplace');
  };

  const goHome = () => {
    setAuthTarget(null);
    setRole('BUYER');
    setBuyerSection('dashboard');
    setAdminSection('dashboard');
    setCurrentPage('home');
  };

  const handleAccessChange = (nextRole: UserRole) => {
    if (isAuthenticated && userProfile?.role) {
      if (nextRole !== userProfile.role) {
        showNotification("Accès refusé : ce compte n'a pas le rôle demandé.", 'error');
        return;
      }
      setAdminSection('dashboard');
      setBuyerSection('dashboard');
      setCurrentPage('dashboard');
      return;
    }

    setRole(nextRole);
    setAdminSection('dashboard');
    setBuyerSection('dashboard');
    setCurrentPage('dashboard');
  };

  const goToBuyerAccount = () => {
    if (!isAuthenticated) {
      setShowAccountPrompt(true);
      return;
    }
    setRole('BUYER');
    setBuyerSection('dashboard');
    setCurrentPage('dashboard');
  };

  const goToSellerSpace = async () => {
    if (isAuthenticated && userProfile?.role === 'STORE_ADMIN') {
      setRole('STORE_ADMIN');
      setCurrentPage('dashboard');
      return;
    }
    if (isAuthenticated && userProfile?.role && userProfile.role !== 'STORE_ADMIN') {
      await supabase.auth.signOut();
    }
    setRole('STORE_ADMIN');
    setCurrentPage('dashboard');
  };

  const handleLoginSuccess = () => {
    if (authTarget === 'checkout') {
      setAuthTarget(null);
      setPaymentStep('SELECT');
      setShowPaymentModal(true);
      showNotification("Connexion réussie", 'success');
      return;
    }
    if (authTarget === 'buyer-account') {
      setRole('BUYER');
      setBuyerSection('dashboard');
      setCurrentPage('dashboard');
    }
    setAuthTarget(null);
    if (buyerSection === 'messages') {
      setCurrentPage('dashboard');
    }
    showNotification("Connexion réussie", 'success');
  };

  // --- RECHARGE WALLET LOGIC ---
  const handleRecharge = async (amount: number) => {
    if (!userProfile) return;
    try {
      if (!paymentPhone || paymentPhone.length < 8) {
        showNotification("Numéro de téléphone requis pour la recharge.", 'error');
        return;
      }
      const paymentRef = `TOPUP-${userProfile.id}-${Date.now()}`;
      await createWalletTransaction({
        userId: userProfile.id,
        type: 'RECHARGE',
        amount,
        status: 'PENDING',
        paymentRef,
        meta: { paymentRef }
      });
      const result = await initiateWavePayment(amount, paymentPhone, paymentRef);
      if (!result.success) {
        throw new Error(result.message);
      }
      showNotification("Recharge initiée. En attente de confirmation.", 'info');
    } catch (e) {
      console.error(e);
      showNotification("Erreur lors de la recharge", 'error');
    }
  };

  // --- PAYMENT SELECTION ---
  const selectMobileMoney = (provider: 'WAVE' | 'OM' | 'MTN') => {
    setSelectedPaymentProvider(provider);
    setPaymentStep('PHONE_INPUT');
  };

  // --- PROCESS FINAL PAYMENT ---
  const processPayment = async (method: 'WALLET' | 'MOBILE_MONEY') => {
    if (!userProfile) return;
    setPaymentStep('PROCESSING');

    try {
      const orderItemsPayload = cart.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
        sellerId: item.supplierId
      }));

      // --- OPTION 1: WALLET ---
      if (method === 'WALLET') {
        const currentBalance = userProfile.walletBalance || 0;
        if (currentBalance < cartTotal) {
          setPaymentStep('SELECT');
          showNotification("Solde insuffisant. Rechargez votre compte.", 'error');
          return;
        }
        await updateWalletBalance(userProfile.id, -cartTotal);
        setUserProfile(prev => prev ? ({ ...prev, walletBalance: currentBalance - cartTotal }) : null);

        await createWalletTransaction({
          userId: userProfile.id,
          type: 'PURCHASE',
          amount: -cartTotal,
          status: 'COMPLETED',
          meta: { method: 'WALLET' }
        });

        // Create Orders (one per seller) with escrow
        await createOrdersBySeller(userProfile.id, 'WALLET', orderItemsPayload, { status: 'PAID' });
        finishPayment('WALLET');
        return;
      }

      // --- OPTION 2: MOBILE MONEY (WAVE via GeniusPay) ---
      if (method === 'MOBILE_MONEY' && selectedPaymentProvider === 'WAVE') {
        const paymentRef = `PAY-${userProfile.id}-${Date.now()}`;
        await createOrdersBySeller(userProfile.id, 'WAVE', orderItemsPayload, { status: 'PENDING', paymentRef });
        const result = await initiateWavePayment(cartTotal, paymentPhone, paymentRef);
        if (!result.success) {
          throw new Error(result.message);
        }
        showNotification("Paiement initié. En attente de confirmation.", 'info');
        setPaymentStep('SELECT');
        setShowPaymentModal(false);
        setSelectedPaymentProvider(null);
        return;
      } else {
        // OM/MTN: en attente de confirmation webhook
        const paymentRef = `PAY-${userProfile.id}-${Date.now()}`;
        await createOrdersBySeller(userProfile.id, selectedPaymentProvider || 'MOBILE_MONEY', orderItemsPayload, { status: 'PENDING', paymentRef });
        showNotification("Paiement en attente de confirmation.", 'info');
        setPaymentStep('SELECT');
        setShowPaymentModal(false);
        setSelectedPaymentProvider(null);
        return;
      }

    } catch (error: any) {
      console.error("Payment Error", error);
      setPaymentStep('SELECT'); // Retour au début
      showNotification(error.message || "Erreur lors du paiement. Veuillez réessayer.", 'error');
    }
  };

  const finishPayment = (methodStr: string) => {
    setPaymentStep('SUCCESS');
    showNotification(`Commande confirmée via ${methodStr}`, 'success');

    setTimeout(() => {
      setCart([]);
      setPaymentStep('SELECT');
      setShowPaymentModal(false);
      setSelectedPaymentProvider(null);
      if (role === 'BUYER') setCurrentPage('dashboard');
    }, 2500);
  };

  // --- LOGOUT ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setRole('BUYER');
    setBuyerSection('dashboard');
    setBuyerChatSellerId(null);
    setCurrentPage('home');
    showNotification("Déconnexion réussie");
  };

  const updateContactChannel = (channel: 'whatsapp' | 'messages') => {
    setContactChannel(channel);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('contact_channel', channel);
    }
  };

  const requireAuthForMessaging = () => {
    setRole('BUYER');
    setAuthTarget('dashboard');
    setBuyerSection('messages');
    setCurrentPage('dashboard');
    showNotification("Connectez-vous pour écrire au vendeur.", 'info');
  };

  const startBuyerChat = (sellerId?: string) => {
    if (!isAuthenticated) {
      requireAuthForMessaging();
      return;
    }
    setRole('BUYER');
    setBuyerChatSellerId(sellerId || null);
    setBuyerSection('messages');
    setCurrentPage('dashboard');
  };

  // --- RENDERING ---

  // 0. Splash screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-[#064e3b]">
        <div className="text-center px-6 w-full max-w-sm">
          <div className="text-2xl md:text-3xl font-black uppercase tracking-[0.2em] text-[#064e3b]">
            IVOIRE DESTOCK
          </div>
          <p className="mt-3 text-xs font-bold uppercase tracking-widest text-gray-500">
            Déstockage rapide, pro & fiable
          </p>
          <div className="mt-6 h-2 w-full bg-emerald-100 rounded-full overflow-hidden">
            <div className="splash-progress"></div>
          </div>
          <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
            Chargement…
          </div>
        </div>
      </div>
    );
  }

  // 1. Auth Screen Overlay
  if ((currentPage === 'dashboard' && !isAuthenticated) || (authTarget && !isAuthenticated)) {
    return (
      <AuthScreen
        role={role}
        onLogin={handleLoginSuccess}
        onCancel={() => {
          setAuthTarget(null);
          setCurrentPage('home');
        }}
      />
    );
  }

  // 2. Admin Interface
  if (isAuthenticated && effectiveRole !== 'BUYER') {
    return (
      <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
        <AdminSidebar
          role={effectiveRole}
          activeSection={adminSection}
          onNavigate={setAdminSection}
          onLogout={handleLogout}
        />
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <Dashboard
            products={products}
            role={effectiveRole}
            activeTab={adminSection}
            userProfile={userProfile || undefined}
          />
        </div>
      </div>
    );
  }

  // 3. Buyer Interface
  const footerPages: Record<string, { title: string; subtitle?: string; sections: { title: string; body: string }[] }> = {
    'footer-help-chat': {
      title: "Discuter avec nous",
      subtitle: "Assistance rapide et personnalisée.",
      sections: [
        { title: "Canaux", body: "Contactez-nous via chat, email ou téléphone selon votre préférence." },
        { title: "Horaires", body: "Support disponible 7j/7 de 8h à 20h." }
      ]
    },
    'footer-faq': {
      title: "Aide & FAQ",
      subtitle: "Les réponses aux questions fréquentes.",
      sections: [
        { title: "Commandes", body: "Suivi, modification, annulation et historique de commande." },
        { title: "Paiements", body: "Wallet, Mobile Money et sécurité des transactions." }
      ]
    },
    'footer-contact': {
      title: "Contactez-nous",
      subtitle: "Nous sommes à votre écoute.",
      sections: [
        { title: "Email", body: "support@ivoiredestock.com" },
        { title: "Téléphone", body: "+225 07 00 00 00 00" }
      ]
    },
    'footer-report': {
      title: "Signaler un abus",
      subtitle: "Sécurité et conformité.",
      sections: [
        { title: "Signalement", body: "Décrivez l'abus, joignez des preuves et nous traiterons rapidement." }
      ]
    },
    'footer-about': {
      title: "Qui sommes-nous",
      subtitle: "La plateforme anti-gaspillage dédiée aux professionnels.",
      sections: [
        { title: "Mission", body: "Réduire le gaspillage et aider les entreprises à valoriser leurs stocks." }
      ]
    },
    'footer-careers': {
      title: "Carrières",
      subtitle: "Rejoignez l'équipe Ivoire Destock.",
      sections: [
        { title: "Postes", body: "Envoyez votre CV à jobs@ivoiredestock.com." }
      ]
    },
    'footer-terms': {
      title: "Conditions Générales",
      subtitle: "Cadre d'utilisation de la plateforme.",
      sections: [
        { title: "Utilisation", body: "En utilisant la plateforme, vous acceptez les conditions en vigueur." }
      ]
    },
    'footer-cookies': {
      title: "Politique de Cookies",
      subtitle: "Transparence sur les données.",
      sections: [
        { title: "Cookies", body: "Nous utilisons des cookies pour améliorer votre expérience." }
      ]
    },
    'footer-sell': {
      title: "Vendre sur Ivoire Destock",
      subtitle: "Vendez vos invendus rapidement.",
      sections: [
        { title: "Onboarding", body: "Créez un compte vendeur et publiez vos stocks en quelques minutes." }
      ]
    },
    'footer-logistics': {
      title: "Devenir centrale d'achat",
      subtitle: "Accès dédié aux grandes surfaces et centrales.",
      sections: [
        { title: "Onboarding", body: "Contactez partnerships@ivoiredestock.com pour rejoindre le programme centrales d'achat." }
      ]
    },
    'footer-seller-space': {
      title: "Espace vendeur",
      subtitle: "Accès dédié aux vendeurs.",
      sections: [
        { title: "Connexion", body: "Utilisez le menu Espace Hors Client pour accéder à votre tableau de bord vendeur." }
      ]
    },
    'footer-track': {
      title: "Suivre ma commande",
      subtitle: "Suivi en temps réel.",
      sections: [
        { title: "Statut", body: "Suivez vos commandes depuis votre tableau de bord client." }
      ]
    },
    'footer-shipping': {
      title: "Modes de livraison",
      subtitle: "Livraison adaptée à vos besoins.",
      sections: [
        { title: "Options", body: "Livraison standard, express et points relais (selon disponibilité)." }
      ]
    },
    'footer-returns': {
      title: "Retour & Remboursement",
      subtitle: "Politique claire et rapide.",
      sections: [
        { title: "Remboursement", body: "Les remboursements sont traités selon l'état de la commande et la politique en vigueur." }
      ]
    }
  };

  const renderBuyerPage = () => {
    if (footerPages[currentPage]) {
      const page = footerPages[currentPage];
      return <StaticPage title={page.title} subtitle={page.subtitle} sections={page.sections} />;
    }
    switch (currentPage) {
      case 'settings':
        return <SettingsHub onNavigate={setCurrentPage} />;
      case 'home':
        return (
          <Home
            products={products}
            onAddToCart={addToCart}
            onNavigate={setCurrentPage}
            onSellerAccess={goToSellerSpace}
            contactChannel={contactChannel}
            onContactChannelChange={updateContactChannel}
            isAuthenticated={isAuthenticated}
            onRequireAuth={requireAuthForMessaging}
            onStartChat={startBuyerChat}
          />
        );
      case 'marketplace':
        return (
          <Marketplace
            products={products}
            onAddToCart={addToCart}
            searchQuery={searchQuery}
            contactChannel={contactChannel}
            onContactChannelChange={updateContactChannel}
            isAuthenticated={isAuthenticated}
            onRequireAuth={requireAuthForMessaging}
            onStartChat={startBuyerChat}
          />
        );
      case 'dashboard':
        return (
          <Dashboard
            products={products}
            role="BUYER"
            userProfile={userProfile || undefined}
            onRecharge={handleRecharge}
            buyerSection={buyerSection}
            onBuyerSectionChange={setBuyerSection}
            initialChatSellerId={buyerChatSellerId}
          />
        );
      default:
        return (
          <Home
            products={products}
            onAddToCart={addToCart}
            onNavigate={setCurrentPage}
            onSellerAccess={goToSellerSpace}
            contactChannel={contactChannel}
            onContactChannelChange={updateContactChannel}
            isAuthenticated={isAuthenticated}
            onRequireAuth={requireAuthForMessaging}
            onStartChat={startBuyerChat}
          />
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans text-gray-800 bg-gray-50/50 relative">
      {showAccountPrompt && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-black text-[#064e3b] uppercase tracking-tight mb-2">Accès à votre espace client</h3>
            <p className="text-sm text-gray-600 mb-6">
              Vous n'êtes pas connecté. Pour accéder à votre espace client, veuillez vous connecter.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAccountPrompt(false)}
                className="flex-1 py-3 border border-gray-200 text-gray-600 font-bold uppercase text-xs rounded-xl hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setShowAccountPrompt(false);
                  setRole('BUYER');
                  setAuthTarget('buyer-account');
                  setCurrentPage('login');
                }}
                className="flex-1 py-3 bg-[#064e3b] text-white font-bold uppercase text-xs rounded-xl hover:opacity-90"
              >
                Se connecter
              </button>
            </div>
          </div>
        </div>
      )}
      {showWelcome && cookieChoice === null && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-gray-100">
            <h3 className="text-xl font-black text-[#064e3b] uppercase tracking-tight mb-2">Bienvenue</h3>
            <p className="text-sm text-gray-600 mb-6">
              Nous utilisons des cookies pour améliorer votre expérience. Acceptez-vous les cookies ?
            </p>
            <button
              onClick={() => setShowCookieDetails((prev) => !prev)}
              className="text-xs font-bold uppercase tracking-widest text-[#064e3b] mb-4"
            >
              En savoir plus
            </button>
            {showCookieDetails && (
              <div className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-xl p-4 mb-4">
                <p className="font-bold text-[#0f172a] mb-2">Pourquoi ces cookies ?</p>
                <p className="mb-2">Nous utilisons des cookies essentiels pour assurer le bon fonctionnement de l’application (navigation, session, sécurité) et des cookies d’analyse pour améliorer l’expérience.</p>
                <p>Vous pouvez refuser : cela n’empêche pas d’utiliser l’application, mais certaines améliorations d’usage seront limitées.</p>
              </div>
            )}
            <button
              onClick={() => { setShowWelcome(false); setCurrentPage('footer-cookies'); }}
              className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-[#064e3b] mb-4"
            >
              Politique de cookies
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => handleCookieChoice('refused')}
                className="flex-1 py-3 border border-gray-200 text-gray-600 font-bold uppercase text-xs rounded-xl hover:bg-gray-50"
              >
                Refuser
              </button>
              <button
                onClick={() => handleCookieChoice('accepted')}
                className="flex-1 py-3 bg-[#064e3b] text-white font-bold uppercase text-xs rounded-xl hover:opacity-90 cookie-accept-btn"
              >
                Accepter
              </button>
            </div>
          </div>
        </div>
      )}
      <Navbar
        role={effectiveRole}
        onAccessChange={handleAccessChange}
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
        toggleCart={() => setIsCartOpen(true)}
        isCartOpen={isCartOpen}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        onNotify={showNotification}
        userName={userProfile?.name || null}
        onAccount={goToBuyerAccount}
        onHome={goHome}
      />

      <main className="flex-1 pb-20 md:pb-0">
        {renderBuyerPage()}
      </main>

      <Footer onNavigate={setCurrentPage} />

      <AIChat productContext={products} />

      {/* TOAST NOTIFICATION */}
      {notification && (
        <div className="fixed top-24 right-4 z-[100] animate-slide-in-right">
          <div className={`flex items-center gap-3 px-6 py-4 rounded shadow-2xl border-l-4 ${notification.type === 'success' ? 'bg-[#064e3b] text-white border-emerald-400' : notification.type === 'error' ? 'bg-white text-red-600 border-red-500' : 'bg-white text-gray-800 border-blue-500'}`}>
            <div className={`p-1 rounded-full ${notification.type === 'success' ? 'bg-white/20' : 'bg-gray-100'}`}>
              {notification.type === 'success' ? <Check size={16} /> : notification.type === 'error' ? <AlertCircle size={16} className="text-red-500" /> : <Bell size={16} className="text-blue-600" />}
            </div>
            <div>
              <p className="font-bold text-sm">{notification.type === 'success' ? 'Succès' : notification.type === 'error' ? 'Erreur' : 'Information'}</p>
              <p className="text-xs opacity-90">{notification.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Cart Overlay */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="w-screen md:max-w-md bg-white shadow-2xl flex flex-col h-[100dvh] md:h-full animate-slide-in-right">
              <div
                className="px-4 md:px-6 py-4 md:py-6 bg-[#064e3b] text-white flex justify-between items-center shadow-md sticky top-0 z-10"
                style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
              >
                <button onClick={() => setIsCartOpen(false)} className="hover:opacity-75" aria-label="Retour">
                  <ArrowLeft size={22} />
                </button>
                <h2 className="text-lg font-bold tracking-wide uppercase">Votre Panier</h2>
                <button onClick={() => setIsCartOpen(false)} className="hover:opacity-75" aria-label="Fermer">
                  <X />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <p>Votre panier est vide.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between items-start border-b border-gray-100 pb-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-16 h-16 bg-gray-100 overflow-hidden border border-gray-200">
                            <img src={item.image} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-[#0f172a] mb-1">{item.name}</h4>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => decrementCartItem(item.id)}
                                  disabled={item.quantity <= 1}
                                  className="px-2 py-1 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
                                  aria-label="Diminuer la quantité"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="px-2 text-xs font-bold text-gray-700">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => incrementCartItem(item.id)}
                                  className="px-2 py-1 text-gray-500 hover:bg-gray-100"
                                  aria-label="Augmenter la quantité"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                              <p className="text-xs text-gray-500 font-medium">{item.price.toLocaleString()} FCFA</p>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-600 transition-colors">
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 md:p-6 border-t border-gray-100 bg-gray-50">
                <div className="mb-5">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Résumé détaillé</p>
                  <div className="space-y-2 max-h-28 overflow-y-auto pr-2">
                    {cart.map(item => (
                      <div key={`summary-${item.id}`} className="flex justify-between text-xs text-gray-600">
                        <span className="truncate">{item.quantity} x {item.name}</span>
                        <span className="font-bold">{(item.price * item.quantity).toLocaleString()} FCFA</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center mb-6">
                  <span className="font-bold text-gray-700 uppercase text-sm tracking-wide">Total à payer</span>
                  <span className="font-black text-2xl text-[#064e3b]">{cartTotal.toLocaleString()} FCFA</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-2">
                  <button
                    onClick={handleCheckoutClick}
                    disabled={cart.length === 0}
                    className="w-full bg-[#064e3b] text-white py-4 font-bold hover:bg-[#065f46] disabled:opacity-50 transition-colors uppercase tracking-widest text-sm"
                  >
                    Commander
                  </button>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="w-full md:hidden border border-gray-200 text-gray-600 py-3 font-bold uppercase text-xs hover:bg-gray-100 transition-colors"
                  >
                    Continuer vos achats
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-[#0f172a] bg-opacity-80 backdrop-blur-sm"></div>
          <div className="bg-white shadow-2xl w-full h-full md:h-auto md:max-w-sm z-10 p-6 md:p-8 relative md:rounded-lg overflow-y-auto">
            {paymentStep === 'SUCCESS' ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-[#064e3b] mx-auto mb-6 animate-bounce">
                  <Check size={40} />
                </div>
                <h3 className="text-2xl font-black text-[#064e3b] mb-2 uppercase">Paiement Réussi</h3>
                <p className="text-sm text-gray-500">Le commerçant a été notifié.</p>
                <p className="text-xs text-gray-400 mt-2">Un email de confirmation a été envoyé.</p>
              </div>
            ) : paymentStep === 'PROCESSING' ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 border-4 border-[#064e3b] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm font-bold text-gray-600">Traitement avec {selectedPaymentProvider || 'Solde'}...</p>
                <p className="text-xs text-gray-400 mt-2">Veuillez valider sur votre mobile si demandé.</p>
              </div>
            ) : paymentStep === 'PHONE_INPUT' ? (
              /* ÉTAPE 2: SAISIE NUMÉRO POUR MOBILE MONEY */
              <>
                <div className="flex items-center mb-6">
                  <button onClick={() => setPaymentStep('SELECT')} className="mr-4 text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></button>
                  <h3 className="text-xl font-black text-[#0f172a] uppercase">Paiement {selectedPaymentProvider}</h3>
                </div>

                <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-center gap-3">
                  <div className="bg-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
                    {selectedPaymentProvider === 'WAVE' ? 'W' : selectedPaymentProvider === 'OM' ? 'O' : 'M'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-800 uppercase">Montant à payer</p>
                    <p className="text-xl font-black text-[#0f172a]">{cartTotal.toLocaleString()} FCFA</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Numéro de téléphone {selectedPaymentProvider}</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-3.5 text-gray-400" size={18} />
                      <input
                        type="tel"
                        value={paymentPhone}
                        onChange={(e) => setPaymentPhone(e.target.value)}
                        placeholder="Ex: 0707070707"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#064e3b] font-bold text-lg"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Entrez le numéro sans indicatif (+225)</p>
                  </div>

                  <button
                    onClick={() => processPayment('MOBILE_MONEY')}
                    disabled={paymentPhone.length < 10}
                    className="w-full bg-[#064e3b] text-white py-4 font-bold uppercase tracking-wide rounded-lg hover:bg-[#065f46] disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
                  >
                    Payer Maintenant <ArrowRight size={18} />
                  </button>
                </div>
              </>
            ) : (
              /* ÉTAPE 1: SÉLECTION MÉTHODE */
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-[#0f172a] uppercase">Moyen de Paiement</h3>
                  <button onClick={() => setShowPaymentModal(false)}><X size={24} className="text-gray-400" /></button>
                </div>

                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Total à régler</p>
                  <p className="text-3xl font-black text-[#064e3b]">{cartTotal.toLocaleString()} F</p>
                </div>

                <div className="space-y-4 mb-4">
                  {/* Wallet Option */}
                  <button
                    onClick={() => processPayment('WALLET')}
                    disabled={(userProfile?.walletBalance || 0) < cartTotal}
                    className={`w-full flex items-center justify-between p-4 border-2 rounded-lg transition-all group ${(userProfile?.walletBalance || 0) >= cartTotal ? 'border-[#064e3b] bg-emerald-50 hover:bg-emerald-100 cursor-pointer' : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#064e3b] text-white rounded-full"><Wallet size={16} /></div>
                      <div className="text-left">
                        <span className="block font-bold text-[#0f172a] text-sm">Mon Solde</span>
                        <span className="block text-xs text-gray-500">Dispo: {userProfile?.walletBalance?.toLocaleString()} F</span>
                      </div>
                    </div>
                    {(userProfile?.walletBalance || 0) < cartTotal && <span className="text-xs text-red-500 font-bold uppercase">Insuffisant</span>}
                  </button>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase">Ou via Mobile Money</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>

                  {/* External Options */}
                  {/* WAVE */}
              <button 
                onClick={() => selectMobileMoney('WAVE')} 
                className="w-full flex items-center justify-between p-3 border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all rounded shadow-sm hover:shadow-md group"
              >
                <span className="font-bold text-[#0f172a] text-sm">Wave</span>
                <img 
                  src="/img/wave.png" 
                  alt="Wave" 
                  className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" 
                />
              </button>

              {/* ORANGE MONEY */}
              <button 
                onClick={() => selectMobileMoney('OM')} 
                className="w-full flex items-center justify-between p-3 border border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all rounded shadow-sm hover:shadow-md group"
              >
                <span className="font-bold text-[#0f172a] text-sm">Orange Money</span>
                <img 
                  src="/img/om.png" 
                  alt="Orange Money" 
                  className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" 
                />
              </button>

              {/* MTN MOMO */}
              <button 
                onClick={() => selectMobileMoney('MTN')} 
                className="w-full flex items-center justify-between p-3 border border-gray-200 hover:border-yellow-500 hover:bg-yellow-50 transition-all rounded shadow-sm hover:shadow-md group"
              >
                <span className="font-bold text-[#0f172a] text-sm">MTN MoMo</span>
                <img 
                  src="/img/mtn.jpg" 
                  alt="MTN" 
                  className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" 
                />
              </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
