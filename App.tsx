
import React, { useState, useEffect } from 'react';
import { UserRole, Product, CartItem, UserProfile } from './types';
import { fetchProducts, getUserProfile, createOrdersBySeller, updateWalletBalance, createWalletTransaction } from './services/backendService';
import { initiateWavePayment } from './services/paymentService'; // Import du service de paiement
import { supabase } from './services/supabaseClient';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HelpDrawer from './components/HelpDrawer';
import StaticPage from './pages/StaticPage';
import SettingsHub from './pages/SettingsHub';
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import Favoris from './pages/Favoris';
import ProductDetailPage from './pages/ProductDetailPage';
import Dashboard from './pages/Dashboard';
import AIChat from './components/AIChat';
import AuthScreen from './components/AuthScreen';
import AdminSidebar from './components/AdminSidebar';
import { X, Check, Bell, Wallet, AlertCircle, Smartphone, ArrowLeft, ArrowRight, Plus, Minus, Frown, Star } from 'lucide-react';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [cookieChoice, setCookieChoice] = useState<'accepted' | 'refused' | null>(null);
  const [showCookieDetails, setShowCookieDetails] = useState(false);
  const [role, setRole] = useState<UserRole>('BUYER');
  const [currentPage, setCurrentPage] = useState('home');
  const [pageRefreshKey, setPageRefreshKey] = useState(0);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [adminSection, setAdminSection] = useState('dashboard');
  const [buyerSection, setBuyerSection] = useState<'dashboard' | 'messages'>('dashboard');
  const [showAccountPrompt, setShowAccountPrompt] = useState(false);
  const [buyerChatSellerId, setBuyerChatSellerId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isBurgerMenuOpen, setIsBurgerMenuOpen] = useState(false);
  const [helpDrawerOpen, setHelpDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hideBottomNavNearFooter, setHideBottomNavNearFooter] = useState(false);
  const footerRef = React.useRef<HTMLDivElement>(null);
  const [footerMounted, setFooterMounted] = useState(false);
  const setFooterRef = React.useCallback((el: HTMLDivElement | null) => {
    (footerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    setFooterMounted(!!el);
  }, []);

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
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const s = window.localStorage.getItem('ivoiredestock_favoris');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });

  // Quit flow: confirm → optional rate → exit
  const [quitModalStep, setQuitModalStep] = useState<'confirm' | 'rate' | null>(null);
  const [quitRating, setQuitRating] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem('ivoiredestock_favoris', JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  const toggleFavorite = (productId: string) => {
    setFavoriteIds(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
  };

  // 1. Initialize & Auth Listener — préchargement pendant le splash, puis signal au preloader
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('cookies_consent') : null;
    if (stored === 'accepted' || stored === 'refused') setCookieChoice(stored);

    const loadProducts = async () => {
      const dbProducts = await fetchProducts();
      if (dbProducts.length > 0) setProducts(dbProducts);
    };

    const init = async () => {
      const [_, { data: { session } }] = await Promise.all([
        loadProducts(),
        supabase.auth.getSession(),
      ]);
      setSession(session);
      if (session?.user) fetchUserData(session.user.id);
      setIsLoading(false);
      if (!stored) setShowWelcome(true);
      if (typeof window !== 'undefined' && (window as unknown as { finishLoading?: () => void }).finishLoading) {
        (window as unknown as { finishLoading: () => void }).finishLoading();
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setUserProfile(null);
        setRole('BUYER');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Navbar inférieure : disparaît près du footer sur Home, Panier, Catégories, Favoris, Compte ; réapparaît en remontant
  useEffect(() => {
    if (!footerMounted) return;
    const el = footerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setHideBottomNavNearFooter(entry.isIntersecting);
      },
      { root: null, rootMargin: '0px', threshold: [0, 0.05, 0.1] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [footerMounted]);

  const handleCookieChoice = (choice: 'accepted' | 'refused') => {
    setCookieChoice(choice);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('cookies_consent', choice);
    }
    setShowWelcome(false);
    setShowCookieDetails(false);
  };

  const fetchUserData = async (userId: string) => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    const sessionUser = currentSession?.user;

    let profile = await getUserProfile(userId);
    if (!profile && sessionUser) {
      const fallbackName = sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || 'Utilisateur';
      const fallbackEmail = sessionUser.email || '';
      const fallbackRole = (sessionUser.user_metadata?.role as UserRole) || 'BUYER';
      await supabase.from('profiles').insert([{
        id: userId,
        full_name: fallbackName,
        role: fallbackRole,
        email: fallbackEmail,
        phone: '',
        wallet_balance: 0,
        status: 'ACTIVE'
      }]);
      profile = await getUserProfile(userId);
    }
    if (profile) {
      const enriched = {
        ...profile,
        email: profile.email || sessionUser?.email || '',
        name: profile.name || sessionUser?.user_metadata?.full_name || sessionUser?.user_metadata?.name || profile.name || 'Utilisateur',
      };
      setUserProfile(enriched);
      if (profile.role) setRole(profile.role);
      if (enriched.phone) setPaymentPhone(enriched.phone);
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
    setIsCartOpen(false);
    setCurrentPage('home');
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  };

  const handleNavToPage = (page: string) => {
    if (page === currentPage) setPageRefreshKey((k) => k + 1);
    setCurrentPage(page);
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  };

  const handleQuit = () => {
    try {
      const cap = (window as any).Capacitor;
      if (cap?.Plugins?.App?.exitApp) cap.Plugins.App.exitApp();
    } catch (_) {}
  };

  const openQuitModal = () => setQuitModalStep('confirm');
  const closeQuitModal = () => {
    setQuitModalStep(null);
    setQuitRating(0);
  };

  const handleQuitConfirmNo = () => closeQuitModal();
  const handleQuitConfirmYes = () => setQuitModalStep('rate');

  const PLAY_STORE_ID = 'com.cervo.app';
  const handleQuitIgnore = () => {
    closeQuitModal();
    handleQuit();
  };
  const handleQuitRate = () => {
    try {
      const url = `https://play.google.com/store/apps/details?id=${PLAY_STORE_ID}&hl=fr`;
      if (typeof window !== 'undefined') window.open(url, '_blank');
    } catch (_) {}
    closeQuitModal();
    handleQuit();
  };

  const handleAccessChange = (nextRole: UserRole) => {
    if (isAuthenticated && userProfile?.role) {
      const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
      const ok = nextRole === userProfile.role || (nextRole === 'SUPER_ADMIN' && adminRoles.includes(userProfile.role));
      if (!ok) {
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
      setRole('BUYER');
      setAuthTarget('buyer-account');
      setBuyerSection('dashboard');
      setCurrentPage('dashboard');
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
    setShowAccountPrompt(false);
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

  // 1. Auth Screen Overlay — Si l'utilisateur a choisi l'espace admin (Support & Gestion), role est déjà SUPER_ADMIN : SUPER_ADMIN et ADMIN peuvent se connecter (même formulaire, ADMIN en lecture seule).
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
      <div className="flex h-screen bg-gray-50 overflow-hidden font-sans max-w-[100vw]">
        {/* Safe guard : bande fixe en haut (s'adapte à la safe-area) */}
        <div className="fixed top-0 left-0 w-full bg-gray-50 z-50 pointer-events-none" style={{ height: 'var(--safe-top)' }} aria-hidden />
        <AdminSidebar
          role={effectiveRole}
          activeSection={adminSection}
          onNavigate={setAdminSection}
          onLogout={handleLogout}
        />
        <div className="admin-dash-content flex-1 overflow-y-auto overflow-x-hidden relative py-4 px-4 md:px-6 lg:pl-8 lg:pr-8 space-y-4 min-w-0 w-full" style={{ paddingTop: 'calc(var(--safe-top) + 56px)' }}>
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
      subtitle: "Assistance rapide pour comprendre et utiliser Ivoire Destock.",
      sections: [
        { title: "À propos du service", body: "Ivoire Destock est l’application qui met en relation acheteurs et vendeurs pour des produits en déstockage (invendus, dates courtes, emballages abîmés). Vous pouvez discuter avec nous pour toute question sur le fonctionnement de l’app, vos commandes ou votre compte." },
        { title: "Canaux", body: "Contactez-nous via le chat in-app, par email ou par téléphone selon votre préférence. Notre équipe vous aide à passer commande, suivre une livraison ou comprendre les modes de paiement (Wallet, Wave, Orange Money, MTN MoMo)." },
        { title: "Horaires", body: "Support disponible 7j/7 de 8h à 20h (heure d’Abidjan)." }
      ]
    },
    'footer-faq': {
      title: "Aide & FAQ",
      subtitle: "Tout pour bien utiliser Ivoire Destock.",
      sections: [
        { title: "Qu’est-ce qu’Ivoire Destock ?", body: "C’est une plateforme anti-gaspillage qui permet d’acheter des produits en déstockage à prix réduits (grandes marques, invendus, DLC courtes, etc.) et aux professionnels de vendre leurs surplus. Vous achetez en B2B ou pour votre commerce, et vous payez par Wallet ou Mobile Money." },
        { title: "Commandes", body: "Vous pouvez suivre, modifier (avant validation) ou annuler une commande depuis votre espace client. L’historique de vos commandes et le statut (en attente, payée, livrée) sont visibles dans l’onglet Compte." },
        { title: "Paiements", body: "Paiement sécurisé par Solde (Wallet) Ivoire Destock ou Mobile Money (Wave, Orange Money, MTN MoMo). Rechargez votre wallet depuis l’espace client pour payer en un clic. Les remboursements sont crédités selon la politique en vigueur." },
        { title: "Compte et profil", body: "Depuis l’espace client vous gérez vos coordonnées, votre solde et votre photo de profil. Vous pouvez aussi accéder aux Devenir Vendeur ou Accès Grossiste si vous avez ouvert un compte pro." }
      ]
    },
    'footer-contact': {
      title: "Contactez-nous",
      subtitle: "Une question sur le service ? On vous répond.",
      sections: [
        { title: "Email", body: "support@ivoiredestock.com — Pour toute demande sur l’app, vos commandes ou un problème technique." },
        { title: "Téléphone", body: "+225 07 00 00 00 00 — Pour un échange rapide ou une aide à la première utilisation." },
        { title: "Utilisation du service", body: "Nous vous aidons à comprendre comment commander, payer, suivre une livraison, vendre sur la plateforme ou devenir partenaire Accès Grossiste." }
      ]
    },
    'footer-report': {
      title: "Signaler un abus",
      subtitle: "Sécurité et conformité sur Ivoire Destock.",
      sections: [
        { title: "Pourquoi signaler", body: "Pour garder la plateforme fiable : contenu trompeur, non-conformité des produits ou comportement abusif. Votre signalement est traité de façon confidentielle." },
        { title: "Comment signaler", body: "Décrivez précisément l’abus (commande, vendeur, annonce…) et joignez des preuves (captures, références) si possible. Nous traiterons votre demande dans les meilleurs délais." }
      ]
    },
    'footer-about': {
      title: "À propos de nous",
      subtitle: "Ivoire Destock : la plateforme anti-gaspillage qui aide à comprendre et à utiliser le déstockage.",
      sections: [
        { title: "Notre mission", body: "Réduire le gaspillage alimentaire et non alimentaire en connectant vendeurs (grandes surfaces, industriels, détaillants) et acheteurs. Nous permettons de valoriser les invendus, dates courtes et emballages abîmés à prix cassés, tout en offrant un service clair et sécurisé." },
        { title: "Le service", body: "Sur l’app vous pouvez : parcourir le catalogue par catégorie, filtrer par prix et localisation, payer par Wallet ou Mobile Money, suivre vos commandes et gérer votre espace client. Les vendeurs et centrales d’achat disposent d’un tableau de bord dédié (catalogue, commandes, livraisons, paramètres)." },
        { title: "Pour qui", body: "Acheteurs (commerces, revendeurs, particuliers), vendeurs (déstockage de surplus) et centrales d’achat (gros volumes). Tout est pensé pour que vous compreniez facilement le service et que vos opérations (achats, ventes, CRUD produits, suivi) fonctionnent correctement." }
      ]
    },
    'footer-careers': {
      title: "Carrières",
      subtitle: "Rejoignez l’équipe Ivoire Destock.",
      sections: [
        { title: "Postes", body: "Envoyez votre CV à jobs@ivoiredestock.com en précisant le poste visé. Nous recrutons des profils techniques, commerciaux et support pour faire grandir la plateforme et aider les utilisateurs à tirer le meilleur parti du service." }
      ]
    },
    'footer-terms': {
      title: "Conditions Générales",
      subtitle: "Cadre d’utilisation de la plateforme Ivoire Destock.",
      sections: [
        { title: "Utilisation", body: "En utilisant Ivoire Destock, vous acceptez les conditions en vigueur : utilisation loyale du service, exactitude des informations (compte, commandes, annonces), respect des règles de vente et d’achat. Les comptes vendeur et centrale d’achat sont soumis à validation." },
        { title: "Responsabilités", body: "La plateforme met en relation acheteurs et vendeurs ; elle s’efforce d’assurer la fiabilité des paiements et du suivi des commandes. Les litiges sont traités selon notre politique de retour et remboursement." }
      ]
    },
    'footer-cookies': {
      title: "Politique de Cookies",
      subtitle: "Transparence sur les données et le bon fonctionnement de l’app.",
      sections: [
        { title: "Cookies", body: "Nous utilisons des cookies essentiels pour le fonctionnement de l’application (connexion, panier, préférences) et des cookies d’analyse pour améliorer le service. Vous pouvez refuser les cookies non essentiels ; l’app reste utilisable." },
        { title: "Données", body: "Vos données (profil, commandes, coordonnées) sont utilisées pour fournir le service, traiter les paiements et vous aider à comprendre et utiliser Ivoire Destock. Nous ne vendons pas vos données à des tiers." }
      ]
    },
    'footer-sell': {
      title: "Vendre sur Ivoire Destock",
      subtitle: "Comprendre comment vendre vos invendus sur la plateforme.",
      sections: [
        { title: "Principe", body: "En tant que vendeur vous publiez vos produits en déstockage (invendus, DLC courtes, emballages abîmés). Les acheteurs parcourent le catalogue, ajoutent au panier et paient par Wallet ou Mobile Money. Vous recevez les commandes et gérez les livraisons depuis votre tableau de bord." },
        { title: "Onboarding", body: "Créez un compte vendeur via le menu (Devenir Vendeur), complétez votre profil et votre CNI si demandé. Ensuite vous pouvez ajouter des produits (nom, catégorie, prix, stock, photo), gérer le catalogue (CRUD), voir les commandes et les retraits (Wave, Orange Money, MTN)." }
      ]
    },
    'footer-logistics': {
      title: "Accès Grossiste",
      subtitle: "Accès dédié aux grandes surfaces et centrales.",
      sections: [
        { title: "Rôle", body: "Les centrales d’achat achètent en gros auprès des vendeurs et peuvent importer des catalogues (Excel). Elles ont un tableau de bord dédié : catalogue, livraisons, paramètres, commission." },
        { title: "Onboarding", body: "Contactez partnerships@ivoiredestock.com pour rejoindre le programme. Après validation vous accédez à l’espace Centrale d’achat depuis le menu et pouvez gérer vos produits et commandes comme un vendeur avancé." }
      ]
    },
    'footer-seller-space': {
      title: "Devenir Vendeur",
      subtitle: "Accéder à votre tableau de bord vendeur.",
      sections: [
        { title: "Connexion", body: "Utilisez le menu (burger ou « Devenir Vendeur ») pour vous connecter avec un compte vendeur. Vous accédez au tableau de bord : chiffre d’affaires, ventes, produits actifs, solde, retraits, catalogue (CRUD produits), commandes, livraisons, messages, paramètres et avatar." },
        { title: "Fonctionnalités", body: "Gérez votre catalogue (création, modification, suppression de produits), consultez les commandes, suivez les livraisons, répondez aux messages B2B et modifiez votre profil (nom, téléphone, photo, localisation)." }
      ]
    },
    'footer-track': {
      title: "Suivre ma commande",
      subtitle: "Comprendre le suivi de vos commandes sur Ivoire Destock.",
      sections: [
        { title: "Où suivre", body: "Dans l’espace client (onglet Compte), consultez la liste de vos commandes avec le statut : en attente, payée, en préparation, livrée. Cliquez sur une commande pour voir le détail et le montant payé." },
        { title: "Statut", body: "Chaque commande affiche un numéro, la date, le mode de paiement (Wallet, Wave, etc.) et l’état. En cas de retard ou de problème, contactez le support ou le vendeur via les canaux indiqués." }
      ]
    },
    'footer-shipping': {
      title: "Modes de livraison",
      subtitle: "Comment sont livrées vos commandes Ivoire Destock.",
      sections: [
        { title: "Options", body: "Livraison standard, express et points relais selon disponibilité et zone (Côte d’Ivoire en priorité). Les délais et coûts sont indiqués au moment de la commande ou par le vendeur." },
        { title: "Suivi", body: "Une fois la commande expédiée, vous pouvez suivre le statut dans votre espace client. Les vendeurs et centrales gèrent les livraisons depuis leur tableau de bord." }
      ]
    },
    'footer-returns': {
      title: "Retour & Remboursement",
      subtitle: "Politique claire pour comprendre vos droits.",
      sections: [
        { title: "Remboursement", body: "Les remboursements sont traités selon l’état de la commande (non livrée, produit non conforme, etc.) et la politique en vigueur. Le montant peut être recrédité sur votre Wallet ou selon le mode de paiement initial." },
        { title: "Retours", body: "En cas de litige (produit abîmé, erreur), contactez le support ou le vendeur. Nous vous aidons à comprendre les étapes et les délais de traitement." }
      ]
    }
  };

  const renderBuyerPage = () => {
    if (footerPages[currentPage]) {
      const page = footerPages[currentPage];
      return <StaticPage title={page.title} subtitle={page.subtitle} sections={page.sections} onBack={() => setCurrentPage('home')} />;
    }
    switch (currentPage) {
      case 'settings':
        return <SettingsHub onNavigate={setCurrentPage} />;
      case 'home':
        return (
          <Home
            products={products}
            onAddToCart={addToCart}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onNavigate={setCurrentPage}
            onOpenProduct={(id) => { setSelectedProductId(id); setCurrentPage('product'); }}
            onSellerAccess={goToSellerSpace}
            contactChannel={contactChannel}
            onContactChannelChange={updateContactChannel}
            isAuthenticated={isAuthenticated}
            onRequireAuth={requireAuthForMessaging}
            onStartChat={startBuyerChat}
          />
        );
      case 'product': {
        const product = products.find((p) => p.id === selectedProductId);
        if (!product) return <Home products={products} onAddToCart={addToCart} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} onNavigate={setCurrentPage} onOpenProduct={(id) => { setSelectedProductId(id); setCurrentPage('product'); }} onSellerAccess={goToSellerSpace} contactChannel={contactChannel} onContactChannelChange={updateContactChannel} isAuthenticated={isAuthenticated} onRequireAuth={requireAuthForMessaging} onStartChat={startBuyerChat} />;
        return (
          <ProductDetailPage
            product={product}
            onBack={() => { setSelectedProductId(null); setCurrentPage('marketplace'); }}
            onAddToCart={addToCart}
            isAuthenticated={isAuthenticated}
            onRequireAuth={requireAuthForMessaging}
          />
        );
      }
      case 'marketplace':
        return (
          <Marketplace
            products={products}
            onAddToCart={addToCart}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onOpenProduct={(id) => { setSelectedProductId(id); setCurrentPage('product'); }}
            searchQuery={searchQuery}
            contactChannel={contactChannel}
            onContactChannelChange={updateContactChannel}
            isAuthenticated={isAuthenticated}
            onRequireAuth={requireAuthForMessaging}
            onStartChat={startBuyerChat}
            onFiltersOpenChange={setFiltersOpen}
          />
        );
      case 'favoris':
        return (
          <Favoris
            products={products}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onAddToCart={addToCart}
            onOpenProduct={(id) => { setSelectedProductId(id); setCurrentPage('product'); }}
            contactChannel={contactChannel}
            onContactChannelChange={updateContactChannel}
            isAuthenticated={isAuthenticated}
            onRequireAuth={requireAuthForMessaging}
            onStartChat={startBuyerChat}
            onBack={() => setCurrentPage('home')}
          />
        );
      case 'dashboard':
        return (
          <Dashboard
            products={products}
            role="BUYER"
            userProfile={userProfile || undefined}
            onRecharge={handleRecharge}
            onRefreshProfile={session?.user ? () => fetchUserData(session.user.id) : undefined}
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
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onNavigate={setCurrentPage}
            onOpenProduct={(id) => { setSelectedProductId(id); setCurrentPage('product'); }}
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
    <div className="flex flex-col min-h-screen font-sans text-gray-800 bg-gray-50/50 relative max-w-[100vw] overflow-x-hidden">
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

      {/* Modale "Voulez-vous vraiment quitter ?" (étape 1) */}
      {quitModalStep === 'confirm' && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-gray-100 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
                <Frown className="w-10 h-10 text-amber-600" strokeWidth={1.5} />
              </div>
            </div>
            <h3 className="text-lg font-black text-[#064e3b] uppercase tracking-tight mb-2">Voulez-vous vraiment quitter ?</h3>
            <p className="text-sm text-gray-600 mb-6">On serait tristes de vous voir partir…</p>
            <div className="flex gap-3">
              <button
                onClick={handleQuitConfirmNo}
                className="flex-1 py-3 bg-[#064e3b] text-white font-bold uppercase text-xs rounded-xl hover:opacity-90"
              >
                Non, rester
              </button>
              <button
                onClick={handleQuitConfirmYes}
                className="flex-1 py-3 border border-gray-200 text-gray-600 font-bold uppercase text-xs rounded-xl hover:bg-gray-50"
              >
                Oui, quitter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale "Noter l'app" (étape 2) */}
      {quitModalStep === 'rate' && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-gray-100 text-center">
            <h3 className="text-lg font-black text-[#064e3b] uppercase tracking-tight mb-2">Donnez une note à l'application</h3>
            <p className="text-sm text-gray-600 mb-4">Votre avis nous aide à nous améliorer.</p>
            <div className="flex justify-center gap-1 mb-6">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQuitRating(n)}
                  className="p-1 rounded focus:outline-none focus:ring-2 focus:ring-[#064e3b]/30"
                >
                  <Star
                    className={`w-8 h-8 ${quitRating >= n ? 'fill-amber-400 text-amber-500' : 'text-gray-300'}`}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleQuitIgnore}
                className="flex-1 py-3 border border-gray-200 text-gray-600 font-bold uppercase text-xs rounded-xl hover:bg-gray-50"
              >
                Ignorer et quitter
              </button>
              <button
                onClick={handleQuitRate}
                className="flex-1 py-3 bg-[#064e3b] text-white font-bold uppercase text-xs rounded-xl hover:opacity-90"
              >
                Noter et quitter
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
        onMenuOpenChange={setIsBurgerMenuOpen}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onNavToPage={handleNavToPage}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        onNotify={showNotification}
        userName={userProfile?.name || null}
        onAccount={goToBuyerAccount}
        onHome={goHome}
        onQuit={openQuitModal}
        hideBottomNavNearFooter={hideBottomNavNearFooter}
        hideBottomNav={currentPage === 'product'}
        onOpenHelp={() => setHelpDrawerOpen(true)}
      />

      <main className="flex-1 pb-20 md:pb-0 px-4 md:px-6 w-full max-w-[100vw] box-border" style={{ paddingBottom: 'max(80px, calc(80px + env(safe-area-inset-bottom)))' }} key={`${currentPage}-${pageRefreshKey}`}>
        {renderBuyerPage()}
      </main>

      {currentPage !== 'favoris' && currentPage !== 'product' && (
        <div ref={setFooterRef}>
      <Footer onNavigate={setCurrentPage} />
        </div>
      )}

      <HelpDrawer open={helpDrawerOpen} onClose={() => setHelpDrawerOpen(false)} onNavigate={(page) => { setCurrentPage(page); setHelpDrawerOpen(false); }} />

      <AIChat productContext={products} hideFAB={filtersOpen || isCartOpen || isBurgerMenuOpen} />

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

      {/* Cart Overlay — header comme le reste de l'app (padding-top + barre verte) + bouton retour dans la page */}
      {isCartOpen && (
        <div className="fixed z-[150] w-full h-full max-w-[100vw] overflow-hidden left-0 right-0 bottom-0 cart-overlay-wrapper">
          <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="absolute inset-0 flex items-start justify-center md:justify-end md:items-stretch">
            <div className="w-full h-full max-w-[100vw] md:max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right rounded-none cart-panel-mobile-max-h">
              {/* Padding-top safe area + header (même style que Navbar) */}
              <div className="shrink-0" style={{ paddingTop: 'var(--safe-top)' }}>
                <div className="bg-[#064e3b] text-white px-4 py-2 shadow-md w-full box-border" style={{ paddingLeft: 16, paddingRight: 16 }}>
                  <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={goHome}>
                      <img src="/img/dest.png" alt="Logo" className="w-8 h-8 bg-white rounded-lg p-1 object-contain" />
                      <div className="flex flex-col leading-none">
                        <span className="font-black text-base tracking-tighter uppercase">Ivoire<span className="font-light">Destock</span></span>
                        <span className="text-[7px] tracking-[0.2em] text-emerald-300 uppercase font-bold">Anti-Gaspillage</span>
                      </div>
                    </div>
                    <button onClick={() => setIsCartOpen(false)} className="p-2 hover:opacity-80 rounded-lg" aria-label="Fermer le panier">
                      <X size={22} />
                    </button>
                  </div>
                </div>
              </div>
              {/* Bouton retour dans la page panier */}
              <div className="shrink-0 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <button onClick={() => setIsCartOpen(false)} className="flex items-center gap-2 text-[#064e3b] font-bold text-sm hover:opacity-90" aria-label="Retour">
                  <ArrowLeft size={20} />
                  <span>Retour</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4 md:px-6 md:py-6">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <p>Votre panier est vide.</p>
                  </div>
                ) : (
                  <div className="space-y-6 w-full max-w-[100vw]">
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

              <div className="px-5 py-4 md:px-6 md:py-6 border-t border-gray-100 bg-gray-50" style={{ paddingBottom: 'max(24px, calc(16px + env(safe-area-inset-bottom)))' }}>
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
                <button
                  onClick={handleCheckoutClick}
                  disabled={cart.length === 0}
                  className="w-full bg-[#064e3b] text-white py-4 font-bold hover:bg-[#065f46] disabled:opacity-50 transition-colors uppercase tracking-widest text-sm"
                >
                  Commander
                </button>
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
                  <img
                    src={selectedPaymentProvider === 'WAVE' ? '/img/wave.png' : selectedPaymentProvider === 'OM' ? '/img/om.png' : '/img/mtn.jpg'}
                    alt={selectedPaymentProvider || ''}
                    className="w-10 h-10 rounded-full object-contain bg-white p-1 shadow-sm"
                  />
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
                <div className="flex items-center gap-3">
                  <img src="/img/wave.png" alt="" className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" />
                <span className="font-bold text-[#0f172a] text-sm">Wave</span>
                </div>
              </button>

              {/* ORANGE MONEY */}
              <button 
                onClick={() => selectMobileMoney('OM')} 
                className="w-full flex items-center justify-between p-3 border border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all rounded shadow-sm hover:shadow-md group"
              >
                <div className="flex items-center gap-3">
                  <img src="/img/om.png" alt="" className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" />
                <span className="font-bold text-[#0f172a] text-sm">Orange Money</span>
                </div>
              </button>

              {/* MTN MOMO */}
              <button 
                onClick={() => selectMobileMoney('MTN')} 
                className="w-full flex items-center justify-between p-3 border border-gray-200 hover:border-yellow-500 hover:bg-yellow-50 transition-all rounded shadow-sm hover:shadow-md group"
              >
                <div className="flex items-center gap-3">
                  <img src="/img/mtn.jpg" alt="" className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" />
                <span className="font-bold text-[#0f172a] text-sm">MTN MoMo</span>
                </div>
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
