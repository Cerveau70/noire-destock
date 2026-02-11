import React, { useState, useEffect } from 'react';
import { UserRole, Product, UserProfile, Order, ProductStatus, B2BThread, B2BMessage, Delivery, FeedbackTicket, PlatformStats, OrderItem, OrderItemStatus, DeliveryEvent } from '../types';
import * as XLSX from 'xlsx';
import {
  fetchMyOrders, fetchVendorProducts, createProduct,
  updateProduct, deleteProduct, uploadProductImage,
  createReview,
  fetchDeliveries, fetchTickets, updateTicketStatus, fetchPlatformStats,
  fetchAllOrders, fetchOrdersBySeller, fetchOrderItemsByOrder, fetchOrderItemStatusHistory, fetchDeliveryEvents,
  createDeliveryEvent, createOrderItemStatus, fetchUsers, updateUserProfile, deleteUserAdmin, reactivateUserAdmin, fetchAuditLogs, createAuditLog,
  fetchVendorAggregates, fetchProductsByVendor, revokeAccessAdmin, resetUserPasswordAdmin, getUserProfile, createAdminUser,
  fetchB2BThreads, fetchB2BMessages, sendB2BMessage, fetchBuyerProfiles, fetchVendorProfiles, uploadCniImage, requestCniOcr,
  updateOrderStatusAndPayout, createPayoutRequest, fetchPayoutRequests, createWalletTransaction,
  fetchAllPayoutRequests, updatePayoutRequestStatus, fetchSellerEscrowTotal, updateSellerCommissionRate
} from '../services/backendService';
import {
  PlusCircle, ShoppingBag, X, User, Phone, Mail, Wallet, Edit, Trash2, Image as ImageIcon, Loader2,
  MapPin, Calendar, CheckCircle, History, ExternalLink, ShieldCheck, LogOut, ChevronRight, Store, AlertTriangle,
  MoreHorizontal, Truck, Ban, Package, Check, Key
} from 'lucide-react';
import ReviewModal from '../components/ReviewModal';
import { supabase } from '../services/supabaseClient';

/* --- SHARED COMPONENTS --- */

const SimpleBarChart = ({ data, color = "#10b981" }: { data: number[], color?: string }) => {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-2 h-32 w-full pt-4">
      {data.map((value, i) => (
        <div key={i} className="flex-1 flex flex-col justify-end group relative">
          <div
            className="w-full rounded-t-sm transition-all duration-500 hover:opacity-80"
            style={{ height: `${(value / max) * 100}%`, backgroundColor: color }}
          ></div>
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            {value.toLocaleString()} F
          </div>
        </div>
      ))}
    </div>
  );
};

/* --- BUYER (CLIENT) DASHBOARD --- */

interface BuyerDashboardProps {
  products: Product[];
  userProfile?: UserProfile;
  onRecharge?: (amount: number) => void;
  onLogout?: () => void;
}

const BuyerDashboard: React.FC<BuyerDashboardProps> = ({ products, userProfile, onRecharge, onLogout }) => {
  const [selectedProductForReview, setSelectedProductForReview] = useState<Product | null>(null);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); // État confirmation
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false); // État succès déconnexion
  const [rechargeAmount, setRechargeAmount] = useState(5000);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (userProfile?.id) {
      fetchMyOrders(userProfile.id).then(setOrders);
    }
  }, [userProfile]);

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!selectedProductForReview || !userProfile) return;
    await createReview(selectedProductForReview.id, rating, comment, userProfile.id, userProfile.name);
    setSelectedProductForReview(null);
  };

  const executeRecharge = () => {
    if (onRecharge) {
      onRecharge(rechargeAmount);
      setShowRechargeModal(false);
    }
  };

  // 1. Demande de confirmation
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  // 2. Action de déconnexion réelle
  const confirmLogoutAction = async () => {
    await supabase.auth.signOut();
    setShowLogoutConfirm(false);
    setShowLogoutSuccess(true);

    // On attend un peu pour montrer le message avant de quitter
    setTimeout(() => {
      if (onLogout) onLogout();
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in relative">

      {/* NOUVEL EN-TÊTE AVEC ICONE ET DÉCONNEXION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4  p-6 rounded-2xl ">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-[#064e3b] rounded-full flex items-center justify-center text-white shadow-lg border-4 border-emerald-50">
            {userProfile?.avatar ? (
              <img src={userProfile.avatar} className="w-full h-full rounded-full object-cover" />
            ) : (
              <User size={32} />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight">Mon Espace Client</h1>
            <p className="text-gray-500 font-medium">Bienvenue, <span className="text-[#064e3b] font-bold">{userProfile?.name}</span></p>
          </div>
        </div>

        <button
          onClick={handleLogoutClick}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold uppercase text-xs hover:bg-red-100 transition-colors border border-red-100"
        >
          <LogOut size={16} /> Déconnexion
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLONNE DE GAUCHE : CARTES D'INFOS */}
        <div className="space-y-6">

          {/* CARTE : INFORMATIONS PERSONNELLES */}
          <div className=" border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Coordonnées</h3>
              <span className="bg-emerald-100 text-[#064e3b] text-xs font-bold px-2 py-1 rounded-full uppercase">Actif</span>
            </div>

            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-50 rounded-xl text-[#064e3b] border border-gray-100"><Mail size={18} /></div>
                <div className="overflow-hidden">
                  <p className="text-xs text-gray-400 font-bold uppercase">Email</p>
                  <p className="text-sm font-bold text-[#0f172a] truncate">{userProfile?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-50 rounded-xl text-[#064e3b] border border-gray-100"><Phone size={18} /></div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase">Téléphone</p>
                  <p className="text-sm font-bold text-[#0f172a]">{userProfile?.phone || "Non renseigné"}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-50 rounded-xl text-[#064e3b] border border-gray-100"><MapPin size={18} /></div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase">Localisation</p>
                  <p className="text-sm font-bold text-[#0f172a]">{userProfile?.location || "Abidjan, Côte d'Ivoire"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* CARTE : SOLDE (WALLETS) */}
          <div className="bg-[#0f172a] text-white p-6 shadow-xl relative overflow-hidden rounded-2xl border-b-4 border-emerald-500">
            <div className="absolute right-0 top-0 h-full w-2/3 bg-gradient-to-l from-[#064e3b]/40 to-transparent pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-emerald-500/20 rounded-full"><Wallet className="text-emerald-400" size={20} /></div>
                <span className="text-emerald-200 font-bold uppercase text-xs tracking-widest">Mon Solde Ivoire Destock</span>
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black tracking-tight">{userProfile?.walletBalance?.toLocaleString() || 0}</span>
                <span className="text-lg font-medium text-emerald-400">FCFA</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRechargeModal(true)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-4 font-bold uppercase text-xs flex items-center justify-center gap-2 transition-all rounded-lg shadow-lg active:scale-95"
                >
                  <PlusCircle size={16} /> Recharger
                </button>
                <button className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 font-bold uppercase text-xs flex items-center justify-center gap-2 transition-colors rounded-lg backdrop-blur-sm">
                  <History size={16} /> Historique
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* COLONNE DE DROITE : COMMANDES */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <h3 className="font-bold text-[#0f172a] uppercase text-lg flex items-center gap-2">
              <ShoppingBag size={20} className="text-[#064e3b]" /> Mes Commandes ({orders.length})
            </h3>
          </div>

          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl py-20 flex flex-col items-center justify-center text-center px-6">
                <div className="p-4 bg-gray-50 rounded-full text-gray-300 mb-4"><ShoppingBag size={48} /></div>
                <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Vous n'avez pas encore passé de commande.</p>
                <p className="text-gray-400 text-sm mt-2">Commencez vos achats pour débloquer des points de fidélité !</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all group overflow-hidden">
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                      <span className="font-mono font-black text-xs text-[#0f172a] bg-white border px-2 py-1 rounded">#{order.id.slice(0, 8).toUpperCase()}</span>
                      <span className="text-xs text-gray-500 font-bold uppercase">{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${order.status === 'PAID' || order.status === 'DELIVERED' ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                      <span className={`text-xs font-black uppercase ${order.status === 'PAID' || order.status === 'DELIVERED' ? 'text-green-600' : 'text-orange-600'}`}>
                        {order.status === 'PAID' ? 'Paiement Validé' : order.status === 'DELIVERED' ? 'Colis Livré' : 'En Attente'}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-xs font-black text-[#064e3b] bg-emerald-50 px-3 py-1 rounded-full w-fit uppercase border border-emerald-100">
                          <CheckCircle size={14} /> Payé via {order.payment_method === 'WALLET' ? 'Solde Ivoire Destock' : order.payment_method}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 font-black uppercase mb-1">Total Payé</p>
                        <p className="text-2xl font-black text-[#0f172a]">{order.total_amount.toLocaleString()} <span className="text-sm font-medium">FCFA</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODALS DÉCONNEXION */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0f172a] bg-opacity-80 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)}></div>
          <div className="bg-white w-full max-w-sm relative shadow-2xl rounded-2xl p-8 animate-scale-in text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-xl font-black text-[#0f172a] uppercase mb-2">Déconnexion</h2>
            <p className="text-gray-500 text-sm mb-8">Voulez-vous vraiment vous déconnecter de votre compte ?</p>
            <div className="flex gap-4">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 px-4 font-bold uppercase text-xs text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Non, rester</button>
              <button onClick={confirmLogoutAction} className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-xs rounded-xl shadow-lg transition-all active:scale-95">Oui, quitter</button>
            </div>
          </div>
        </div>
      )}

      {showLogoutSuccess && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#064e3b] bg-opacity-95 backdrop-blur-md"></div>
          <div className="relative text-center animate-fade-in">
            <div className="w-20 h-20 bg-white text-[#064e3b] rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-widest">Vous êtes déconnecté</h2>
            <p className="text-emerald-100 mt-2 font-medium">Redirection en cours...</p>
          </div>
        </div>
      )}

      {/* AUTRES MODALS */}
      {selectedProductForReview && (
        <ReviewModal
          product={selectedProductForReview}
          onClose={() => setSelectedProductForReview(null)}
          onSubmit={handleReviewSubmit}
        />
      )}

      {showRechargeModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0f172a] bg-opacity-80 backdrop-blur-sm" onClick={() => setShowRechargeModal(false)}></div>
          <div className="bg-white w-full max-w-sm relative shadow-2xl rounded-2xl p-6 animate-scale-in">
            <button onClick={() => setShowRechargeModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"><X size={20} /></button>
            <h2 className="text-xl font-black text-[#0f172a] uppercase mb-6 flex items-center gap-2 border-b border-gray-50 pb-3">
              <Wallet className="text-[#064e3b]" /> Recharger Solde
            </h2>
            <div className="mb-6">
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">Montant à recharger (FCFA)</label>
              <div className="relative">
                <input
                  type="number"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(Number(e.target.value))}
                  className="w-full border-2 border-[#064e3b]/20 focus:border-[#064e3b] p-3 text-2xl font-black text-[#0f172a] focus:outline-none rounded-xl bg-gray-50 transition-all"
                />
                <span className="absolute right-4 top-4 text-xs font-bold text-gray-400">FCFA</span>
              </div>
              <div className="flex gap-2 mt-3">
                {[1000, 5000, 10000].map(amt => (
                  <button key={amt} onClick={() => setRechargeAmount(amt)} className="text-xs font-black border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-[#064e3b] hover:text-white transition-all">+{amt.toLocaleString()}</button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Opérateurs locaux</p>
                
                {/* WAVE */}
                <button onClick={executeRecharge} className="w-full flex items-center justify-between p-4 border border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all rounded-xl group shadow-sm">
                  <div className="flex items-center gap-3">
                    <img 
                      src="/img/wave.png" 
                      alt="Wave" 
                      className="w-10 h-10 rounded-full object-contain shadow-md bg-white p-1 group-hover:scale-110 transition-transform" 
                    />
                    <span className="font-black text-[#0f172a] text-sm group-hover:text-blue-600 uppercase">Wave Money</span>
                  </div>
                  <ExternalLink size={14} className="text-gray-300" />
                </button>

                {/* ORANGE MONEY */}
                <button onClick={executeRecharge} className="w-full flex items-center justify-between p-4 border border-gray-100 hover:border-orange-500 hover:bg-orange-50 transition-all rounded-xl group shadow-sm">
                  <div className="flex items-center gap-3">
                    <img 
                      src="/img/om.png" 
                      alt="Orange Money" 
                      className="w-10 h-10 rounded-full object-contain shadow-md bg-white p-1 group-hover:scale-110 transition-transform" 
                    />
                    <span className="font-black text-[#0f172a] text-sm group-hover:text-orange-600 uppercase">Orange Money</span>
                  </div>
                  <ExternalLink size={14} className="text-gray-300" />
                </button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* --- PRODUCTS MANAGER (CRUD) --- */

const ProductsManagerView = ({ userProfile }: { userProfile: UserProfile }) => {
  const [vendorProducts, setVendorProducts] = useState<Product[]>([]);
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const categories = [
    'Alimentaire', 'Boissons', 'Laiterie', 'Conserves', 'Hygiène', 'Épicerie', 'Surgelés',
    'Fruits & Légumes', 'Boulangerie', 'Viandes & Poissons', 'Boissons & Jus', 'Produits Bébé',
    'Cosmétiques', 'Entretien', 'Snack', 'Autre (écrire)'
  ];
  const [formData, setFormData] = useState({
    name: '', category: 'Alimentaire', price: 0, originalPrice: 0, stock: 0,
    status: 'INVENDU' as ProductStatus, expiryDate: '', description: '', image: '', location: userProfile.location || 'Abidjan'
  });
  const [categoryValue, setCategoryValue] = useState('Alimentaire');
  const [customCategory, setCustomCategory] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [ruleKeyword, setRuleKeyword] = useState('');
  const [ruleDays, setRuleDays] = useState(5);
  const [ruleDiscount, setRuleDiscount] = useState(20);
  const [ruleActive, setRuleActive] = useState(true);

  useEffect(() => { loadProducts(); }, [userProfile.id]);

  const loadProducts = async () => {
    setIsLoading(true);
    const data = await fetchVendorProducts(userProfile.id);
    setVendorProducts(data);
    setIsLoading(false);
  };

  const showNotif = (msg: string, type: 'success' | 'error') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const normalizeHeader = (value: string) =>
    value.toLowerCase().trim().replace(/[\s_-]+/g, '');

  const toIsoDate = (value: any) => {
    if (!value) return '';
    if (value instanceof Date && !isNaN(value.getTime())) {
      return value.toISOString().slice(0, 10);
    }
    if (typeof value === 'number') {
      const date = new Date(Date.UTC(1899, 11, 30) + value * 86400000);
      return date.toISOString().slice(0, 10);
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      const tryDate = new Date(trimmed);
      if (!isNaN(tryDate.getTime())) return tryDate.toISOString().slice(0, 10);
      const fr = trimmed.split('/');
      if (fr.length === 3) {
        const [dd, mm, yyyy] = fr;
        const parsed = new Date(`${yyyy}-${mm}-${dd}`);
        if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
      }
    }
    return '';
  };

  const handleBulkImport = async () => {
    if (!bulkFile) {
      showNotif("Sélectionnez un fichier Excel.", 'error');
      return;
    }
    setBulkLoading(true);
    try {
      const arrayBuffer = await bulkFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
      if (!rows.length) {
        showNotif("Fichier vide ou non lisible.", 'error');
        setBulkLoading(false);
        return;
      }
      const headerMap: Record<string, keyof Product | 'originalPrice' | 'expiryDate' | 'description' | 'image' | 'location' | 'status'> = {
        nom: 'name',
        name: 'name',
        produit: 'name',
        categorie: 'category',
        category: 'category',
        prix: 'price',
        price: 'price',
        prixorigine: 'originalPrice',
        prixoriginal: 'originalPrice',
        originalprice: 'originalPrice',
        stock: 'stock',
        statut: 'status',
        status: 'status',
        dateperemption: 'expiryDate',
        dateexpiration: 'expiryDate',
        expiration: 'expiryDate',
        expirydate: 'expiryDate',
        description: 'description',
        image: 'image',
        imageurl: 'image',
        location: 'location',
        localisation: 'location',
        ville: 'location'
      };

      let created = 0;
      let skipped = 0;

      for (const row of rows) {
        const parsed: any = {
          name: '',
          category: 'Alimentaire',
          price: 0,
          originalPrice: 0,
          stock: 0,
          status: 'INVENDU' as ProductStatus,
          expiryDate: '',
          description: '',
          image: '',
          location: userProfile.location || 'Abidjan'
        };
        Object.entries(row).forEach(([key, value]) => {
          const mapped = headerMap[normalizeHeader(key)];
          if (!mapped) return;
          if (mapped === 'expiryDate') {
            parsed.expiryDate = toIsoDate(value);
            return;
          }
          if (mapped === 'status') {
            const v = String(value || '').toUpperCase().replace(/\s+/g, '_');
            if (v === 'INVENDU' || v === 'DATE_COURTE' || v === 'ABIME') {
              parsed.status = v as ProductStatus;
            }
            return;
          }
          parsed[mapped] = value;
        });

        parsed.price = Number(parsed.price) || 0;
        parsed.originalPrice = Number(parsed.originalPrice) || 0;
        parsed.stock = Number(parsed.stock) || 0;
        parsed.category = parsed.category || 'Alimentaire';
        parsed.description = parsed.description || '';
        parsed.image = parsed.image || '';
        parsed.location = parsed.location || (userProfile.location || 'Abidjan');
        parsed.expiryDate = parsed.expiryDate || '';

        if (!parsed.name || parsed.price <= 0 || parsed.originalPrice <= 0 || parsed.stock < 0 || !parsed.expiryDate) {
          skipped += 1;
          continue;
        }

        const { error } = await createProduct(parsed, userProfile.id);
        if (!error) created += 1;
      }

      showNotif(`Import terminé: ${created} créés, ${skipped} ignorés.`, 'success');
      setBulkFile(null);
      loadProducts();
    } catch (err) {
      showNotif("Erreur lors de l'import Excel.", 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  const executeRule = async () => {
    if (!ruleActive) {
      showNotif("Activez la règle avant d'exécuter.", 'error');
      return;
    }
    if (!ruleKeyword.trim()) {
      showNotif("Mot-clé requis.", 'error');
      return;
    }
    const items = await fetchVendorProducts(userProfile.id);
    const now = new Date();
    const keyword = ruleKeyword.trim().toLowerCase();
    let updated = 0;
    for (const p of items) {
      const expiry = new Date(p.expiryDate);
      if (isNaN(expiry.getTime())) continue;
      const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / 86400000);
      if (diffDays < 0 || diffDays > ruleDays) continue;
      if (!p.name.toLowerCase().includes(keyword)) continue;
      const baseOriginal = p.originalPrice > 0 ? p.originalPrice : p.price;
      const newPrice = Math.max(0, Math.round(baseOriginal * (1 - ruleDiscount / 100)));
      const { error } = await updateProduct(p.id, {
        price: newPrice,
        originalPrice: baseOriginal,
        status: 'DATE_COURTE'
      }, userProfile.id);
      if (!error) updated += 1;
    }
    showNotif(`Règle appliquée sur ${updated} produit(s).`, 'success');
    loadProducts();
  };

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setFormData({
      name: p.name, category: p.category, price: p.price, originalPrice: p.originalPrice,
      stock: p.stock, status: p.status, expiryDate: p.expiryDate, description: p.description,
      image: p.image, location: p.location
    });
    if (categories.includes(p.category)) {
      setCategoryValue(p.category);
      setCustomCategory('');
    } else {
      setCategoryValue('Autre (écrire)');
      setCustomCategory(p.category);
    }
    setImagePreview(p.image);
    setViewMode('FORM');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr ?")) return;
    setIsLoading(true);
    const { error } = await deleteProduct(id, userProfile.id);
    if (error) showNotif("Erreur", 'error'); else { showNotif("Supprimé", 'success'); loadProducts(); }
    setIsLoading(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let imageUrl = formData.image;
      if (imageFile) {
        const uploadedUrl = await uploadProductImage(imageFile);
        if (uploadedUrl) imageUrl = uploadedUrl; else throw new Error("Erreur upload");
      }
      if (editingId) {
        const { error } = await updateProduct(editingId, { ...formData, image: imageUrl }, userProfile.id);
        if (error) throw error;
        showNotif("Mis à jour", 'success');
      } else {
        const { error } = await createProduct({ ...formData, image: imageUrl }, userProfile.id);
        if (error) throw error;
        showNotif("Créé", 'success');
      }
      setViewMode('LIST'); setEditingId(null); setImageFile(null); setImagePreview(null);
      setFormData({ name: '', category: 'Alimentaire', price: 0, originalPrice: 0, stock: 0, status: 'INVENDU', expiryDate: '', description: '', image: '', location: userProfile.location || 'Abidjan' });
      setCategoryValue('Alimentaire');
      setCustomCategory('');
      loadProducts();
    } catch (err) { showNotif("Erreur", 'error'); } finally { setIsLoading(false); }
  };

  if (viewMode === 'FORM') {
    return (
      <div className="bg-white p-8 rounded-none shadow-xl max-w-4xl mx-auto border border-gray-100 mt-6">
        <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-black uppercase text-[#0f172a] tracking-tight">{editingId ? 'Modifier le Produit' : 'Publier Nouveau Produit'}</h2><button onClick={() => setViewMode('LIST')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X /></button></div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-none p-6 flex flex-col items-center justify-center bg-gray-50 relative h-72 hover:border-[#00A859]/50 transition-all">
                {imagePreview ? <img src={imagePreview} className="w-full h-full object-contain absolute inset-0 rounded-none p-2" /> : <div className="text-center text-gray-400"><ImageIcon size={48} className="mx-auto mb-2 opacity-50" /><p className="text-xs font-bold uppercase">Ajouter photo produit</p></div>}
                <input type="file" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
              </div>
              <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border-2 border-gray-100 p-3 rounded-none font-bold text-[#0f172a] focus:border-[#00A859] focus:outline-none" placeholder="Nom du produit" />
              <select
                value={categoryValue}
                onChange={(e) => {
                  const value = e.target.value;
                  setCategoryValue(value);
                  if (value === 'Autre (écrire)') {
                    setFormData({ ...formData, category: customCategory || '' });
                  } else {
                    setCustomCategory('');
                    setFormData({ ...formData, category: value });
                  }
                }}
                className="w-full border-2 border-gray-100 p-3 rounded-none focus:border-[#00A859] focus:outline-none font-bold text-sm"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {categoryValue === 'Autre (écrire)' && (
                <input
                  value={customCategory}
                  onChange={(e) => {
                    setCustomCategory(e.target.value);
                    setFormData({ ...formData, category: e.target.value });
                  }}
                  className="w-full border-2 border-gray-100 p-3 rounded-none font-bold text-[#0f172a] focus:border-[#00A859] focus:outline-none"
                  placeholder="Écrire la catégorie"
                  required
                />
              )}
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-gray-400">Prix Destock (FCFA)</label>
                  <input type="number" min={0} required value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} className="w-full border-2 border-gray-100 p-3 rounded-none font-bold text-[#00A859] text-lg focus:border-[#00A859] focus:outline-none" placeholder="Ex: 12000" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-gray-400">Prix d'origine (FCFA)</label>
                  <input type="number" min={0} required value={formData.originalPrice} onChange={e => setFormData({ ...formData, originalPrice: Number(e.target.value) })} className="w-full border-2 border-gray-100 p-3 rounded-none text-gray-400 line-through focus:outline-none" placeholder="Ex: 18000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-gray-400">Quantité en stock</label>
                  <input type="number" min={0} required value={formData.stock} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} className="w-full border-2 border-gray-100 p-3 rounded-none focus:border-[#00A859] focus:outline-none font-bold" placeholder="Ex: 50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-gray-400">Date de péremption</label>
                  <input type="date" required value={formData.expiryDate} onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} className="w-full border-2 border-gray-100 p-3 rounded-none focus:border-[#00A859] focus:outline-none text-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-gray-400">Type de déstockage</label>
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as ProductStatus })} className="w-full border-2 border-gray-100 p-3 rounded-none focus:border-[#00A859] focus:outline-none font-bold text-sm"><option value="INVENDU">Surplus / Invendu</option><option value="DATE_COURTE">Date Courte</option><option value="ABIME">Emballage Abîmé</option></select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-gray-400">Description</label>
                <textarea rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full border-2 border-gray-100 p-3 rounded-none resize-none focus:border-[#00A859] focus:outline-none text-sm" placeholder="Qualité, raison du déstockage, conditions..." />
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-gray-100 flex justify-end gap-4">
            <button type="button" onClick={() => setViewMode('LIST')} className="px-6 py-3 font-bold uppercase text-xs text-gray-400 hover:text-gray-600 rounded-none">Annuler</button>
            <button type="submit" disabled={isLoading} className="bg-[#00A859] text-white px-8 py-3 font-bold uppercase rounded-none hover:bg-[#008F4A] shadow-lg disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95 text-xs">{isLoading && <Loader2 className="animate-spin" size={16} />} {editingId ? 'Mettre à jour' : 'Publier le Produit'}</button>
          </div>
        </form>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-none shadow-sm border border-gray-200">
        <div><h1 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight">Catalogue Produits</h1><p className="text-gray-500 text-sm">Gérez votre stock d'invendus et de surplus.</p></div>
        <button onClick={() => { setEditingId(null); setFormData({ name: '', category: 'Alimentaire', price: 0, originalPrice: 0, stock: 0, status: 'INVENDU', expiryDate: '', description: '', image: '', location: userProfile.location || 'Abidjan' }); setCategoryValue('Alimentaire'); setCustomCategory(''); setImageFile(null); setImagePreview(null); setViewMode('FORM'); }} className="bg-[#00A859] text-white px-6 py-3 rounded-none font-bold uppercase text-xs flex items-center gap-2 hover:bg-[#008F4A] shadow-lg transition-all active:scale-95"><PlusCircle size={16} /> Ajouter un Produit</button>
      </div>
      {notification && <div className={`p-4 rounded-none border-l-4 shadow-sm ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-red-50 border-red-500 text-red-800'}`}><span className="font-bold text-sm">{notification.msg}</span></div>}
      {userProfile.role === 'PARTNER_ADMIN' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-none shadow-sm border border-gray-200">
            <h3 className="text-sm font-black uppercase text-[#0f172a] mb-4">Import massif (Excel)</h3>
            <div className="space-y-3">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                className="w-full border border-gray-200 p-3 rounded-none text-xs font-bold"
              />
              <button
                onClick={handleBulkImport}
                disabled={!bulkFile || bulkLoading}
                className="w-full bg-[#00A859] text-white py-3 font-bold uppercase text-xs rounded-none hover:bg-[#008F4A] disabled:opacity-50"
              >
                {bulkLoading ? 'Import en cours…' : 'Importer les produits'}
              </button>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                Colonnes supportées: nom, categorie, prix, prix_origine, stock, statut, date_peremption, description, image_url, localisation
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-none shadow-sm border border-gray-200">
            <h3 className="text-sm font-black uppercase text-[#0f172a] mb-4">Règle de déstockage</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-gray-400">Mot-clé</label>
                <input
                  value={ruleKeyword}
                  onChange={(e) => setRuleKeyword(e.target.value)}
                  placeholder="Ex: yaourt"
                  className="w-full border-2 border-gray-100 p-3 rounded-none text-xs font-bold focus:border-[#00A859] focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-gray-400">Jours avant expiration</label>
                <input
                  type="number"
                  min={0}
                  value={ruleDays}
                  onChange={(e) => setRuleDays(Number(e.target.value))}
                  className="w-full border-2 border-gray-100 p-3 rounded-none text-xs font-bold focus:border-[#00A859] focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-gray-400">Remise (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={ruleDiscount}
                  onChange={(e) => setRuleDiscount(Number(e.target.value))}
                  className="w-full border-2 border-gray-100 p-3 rounded-none text-xs font-bold focus:border-[#00A859] focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-gray-400">Statut</label>
                <select
                  value={ruleActive ? 'ACTIVE' : 'INACTIVE'}
                  onChange={(e) => setRuleActive(e.target.value === 'ACTIVE')}
                  className="w-full border-2 border-gray-100 p-3 rounded-none text-xs font-bold focus:border-[#00A859] focus:outline-none"
                >
                  <option value="ACTIVE">Actif</option>
                  <option value="INACTIVE">Inactif</option>
                </select>
              </div>
            </div>
            <button
              onClick={executeRule}
              className="mt-4 w-full border border-gray-200 bg-white text-[#0f172a] py-3 font-black uppercase text-xs rounded-none hover:bg-gray-50"
            >
              Exécuter la règle
            </button>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-3">
              Déversement automatique: à programmer plus tard.
            </p>
          </div>
        </div>
      )}
      <div className="bg-white rounded-none shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? <div className="p-16 text-center text-gray-400"><Loader2 className="animate-spin mx-auto mb-2" /> Chargement...</div> : vendorProducts.length === 0 ? <div className="p-16 text-center text-gray-400"><Package size={48} className="mx-auto mb-4 opacity-50" /><p className="font-bold uppercase text-xs tracking-widest">Aucun produit en ligne</p></div> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left border-collapse text-xs md:text-sm">
              <thead className="bg-gray-50 text-xs font-black uppercase text-gray-400 border-b"><tr><th className="p-6">Produit</th><th className="p-6">Prix</th><th className="p-6">Stock</th><th className="p-6">État</th><th className="p-6 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-gray-50">{vendorProducts.map(p => (<tr key={p.id} className="hover:bg-gray-50/50 transition-colors"><td className="p-6"><div className="flex items-center gap-4"><div className="w-14 h-14 bg-gray-100 rounded-none border border-gray-100 overflow-hidden shadow-sm flex-shrink-0">{p.image && <img src={p.image} className="w-full h-full object-cover" />}</div><div><p className="font-black text-[#0f172a] text-sm uppercase">{p.name}</p><p className="text-xs font-bold text-gray-500 uppercase tracking-tighter">{p.category}</p></div></div></td><td className="p-6"><p className="font-black text-[#00A859] text-lg">{p.price.toLocaleString()} F</p><p className="text-xs text-gray-400 line-through">{p.originalPrice.toLocaleString()} F</p></td><td className="p-6"><span className={`text-xs font-black px-3 py-1.5 rounded-none uppercase border ${p.stock < 10 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-[#00A859] border-emerald-100'}`}>{p.stock} unités</span></td><td className="p-6"><span className="text-xs font-black uppercase border border-gray-200 px-2 py-1 rounded-none bg-white text-gray-500">{p.status.replace('_', ' ')}</span></td><td className="p-6 text-right space-x-2"><button onClick={() => handleEdit(p)} className="text-blue-600 hover:bg-blue-50 p-2.5 rounded-none transition-colors shadow-sm bg-white border border-gray-100"><Edit size={16} /></button><button onClick={() => handleDelete(p.id)} className="text-red-600 hover:bg-red-50 p-2.5 rounded-none transition-colors shadow-sm bg-white border border-gray-100"><Trash2 size={16} /></button></td></tr>))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const AllProductsView = ({ products }: { products: Product[] }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-none shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight">Tous les Produits</h1>
          <p className="text-gray-500 text-sm">Catalogue global des vendeurs.</p>
        </div>
      </div>
      <div className="bg-white rounded-none shadow-sm border border-gray-200 overflow-hidden">
        {products.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <Package size={48} className="mx-auto mb-4 opacity-50" />
            <p className="font-bold uppercase text-xs tracking-widest">Aucun produit disponible</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left border-collapse text-xs md:text-sm">
              <thead className="bg-gray-50 text-xs font-black uppercase text-gray-400 border-b">
                <tr>
                  <th className="p-6">Produit</th>
                  <th className="p-6">Prix</th>
                  <th className="p-6">Stock</th>
                  <th className="p-6">État</th>
                  <th className="p-6">Vendeur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gray-100 rounded-none border border-gray-100 overflow-hidden shadow-sm flex-shrink-0">
                          {p.image && <img src={p.image} className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <p className="font-black text-[#0f172a] text-sm uppercase">{p.name}</p>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-tighter">{p.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <p className="font-black text-[#00A859] text-lg">{p.price.toLocaleString()} F</p>
                      <p className="text-xs text-gray-400 line-through">{p.originalPrice.toLocaleString()} F</p>
                    </td>
                    <td className="p-6">
                      <span className={`text-xs font-black px-3 py-1.5 rounded-none uppercase border ${p.stock < 10 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-[#00A859] border-emerald-100'}`}>{p.stock} unités</span>
                    </td>
                    <td className="p-6">
                      <span className="text-xs font-black uppercase border border-gray-200 px-2 py-1 rounded-none bg-white text-gray-500">{p.status.replace('_', ' ')}</span>
                    </td>
                    <td className="p-6 text-xs font-bold text-gray-500 uppercase">{p.supplier || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};


/* --- NEW ADMIN VIEWS --- */

// 1. MESSAGES (B2B)
const B2BMessagesView = ({
  currentUserId,
  currentUserName,
  currentUserRole,
  initialContactId
}: {
  currentUserId?: string;
  currentUserName?: string;
  currentUserRole?: UserRole;
  initialContactId?: string | null;
}) => {
  const [threads, setThreads] = useState<B2BThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<B2BThread | null>(null);
  const [messages, setMessages] = useState<B2BMessage[]>([]);
  const [input, setInput] = useState('');
  const [contacts, setContacts] = useState<UserProfile[]>([]);
  const [selectedContact, setSelectedContact] = useState<UserProfile | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  useEffect(() => {
    fetchB2BThreads(currentUserId).then((data) => {
      setThreads(data);
      if (data.length > 0) setSelectedThread(data[0]);
    });
  }, [currentUserId]);

  useEffect(() => {
    const loadContacts = async () => {
      if (currentUserRole === 'STORE_ADMIN' || currentUserRole === 'PARTNER_ADMIN') {
        const buyers = await fetchBuyerProfiles();
        setContacts(buyers);
        if (!selectedContact && buyers.length > 0) setSelectedContact(buyers[0]);
      } else if (currentUserRole === 'BUYER') {
        const vendors = await fetchVendorProfiles();
        setContacts(vendors);
        if (!selectedContact && vendors.length > 0) setSelectedContact(vendors[0]);
      }
    };
    loadContacts();
  }, [currentUserRole, selectedContact]);

  useEffect(() => {
    if (selectedThread) {
      fetchB2BMessages(selectedThread.id).then(setMessages);
    }
  }, [selectedThread]);

  useEffect(() => {
    if (!currentUserId) return;
    const channel = supabase.channel('presence:b2b', {
      config: { presence: { key: currentUserId } }
    });
    const syncOnline = () => {
      const state = channel.presenceState();
      const ids = new Set<string>();
      Object.values(state).forEach((entries: any) => {
        (entries || []).forEach((e: any) => {
          if (e?.user_id) ids.add(e.user_id);
        });
      });
      setOnlineUserIds(Array.from(ids));
    };
    channel.on('presence', { event: 'sync' }, syncOnline);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.track({
          user_id: currentUserId,
          role: currentUserRole,
          name: currentUserName || 'Utilisateur',
          last_seen: new Date().toISOString()
        });
      }
    });
    const heartbeat = setInterval(() => {
      channel.track({
        user_id: currentUserId,
        role: currentUserRole,
        name: currentUserName || 'Utilisateur',
        last_seen: new Date().toISOString()
      });
    }, 25000);
    return () => {
      clearInterval(heartbeat);
      supabase.removeChannel(channel);
    };
  }, [currentUserId, currentUserRole, currentUserName]);

  useEffect(() => {
    if (!selectedThread?.id) return;
    const channel = supabase.channel(`messages:${selectedThread.id}`);
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${selectedThread.id}` },
      (payload: any) => {
        const row = payload.new;
        if (!row) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === row.id)) return prev;
          return [
            ...prev,
            {
              id: row.id,
              threadId: row.thread_id,
              fromName: row.from_name || 'Client',
              body: row.body || '',
              createdAt: new Date(row.created_at).toLocaleString()
            }
          ];
        });
        setThreads((prev) =>
          prev.map((t) =>
            t.id === selectedThread.id
              ? {
                ...t,
                preview: row.body || t.preview,
                date: new Date(row.created_at).toLocaleDateString(),
                status: row.from_id === currentUserId ? 'READ' : 'UNREAD'
              }
              : t
          )
        );
      }
    );
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedThread?.id, currentUserId]);

  const parseSubject = (subject?: string) => {
    const seller = subject?.match(/SELLER:([^|]+)/)?.[1];
    const buyer = subject?.match(/BUYER:([^|]+)/)?.[1];
    return { seller, buyer };
  };

  useEffect(() => {
    if (!selectedThread || !currentUserId) return;
    const { seller, buyer } = parseSubject(selectedThread.subject);
    const contactId = currentUserRole === 'BUYER' ? seller : buyer;
    if (contactId && (!selectedContact || selectedContact.id !== contactId)) {
      const found = contacts.find((c) => c.id === contactId);
      if (found) setSelectedContact(found);
    }
  }, [selectedThread, currentUserRole, currentUserId, contacts, selectedContact]);

  const buildSubject = (contact: UserProfile) => {
    if (!currentUserId) return 'Discussion';
    if (currentUserRole === 'BUYER') {
      return `SELLER:${contact.id}|BUYER:${currentUserId}`;
    }
    return `SELLER:${currentUserId}|BUYER:${contact.id}`;
  };

  const formatContactId = (contact: UserProfile) => {
    if (!contact.id) return '-';
    const shortId = contact.id.slice(0, 8).toUpperCase();
    if (contact.role === 'STORE_ADMIN') return `VDR-${shortId}`;
    if (contact.role === 'PARTNER_ADMIN') return `PRT-${shortId}`;
    return `USR-${shortId}`;
  };

  const handleSelectContact = (contact: UserProfile) => {
    setSelectedContact(contact);
    const subject = buildSubject(contact);
    const existing = threads.find((t) => t.subject === subject);
    if (existing) {
      setSelectedThread(existing);
      return;
    }
    const newThreadId = (crypto as any)?.randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random()}`;
    setSelectedThread({
      id: newThreadId,
      subject,
      fromName: contact.name || 'Client',
      preview: '',
      date: new Date().toLocaleDateString(),
      status: 'READ'
    });
    setMessages([]);
  };

  useEffect(() => {
    if (!initialContactId || contacts.length === 0) return;
    const found = contacts.find((c) => c.id === initialContactId);
    if (found) {
      handleSelectContact(found);
    }
  }, [initialContactId, contacts]);

  const handleSend = async () => {
    if (!selectedThread || !input.trim()) return;
    const sellerId = currentUserRole === 'BUYER' ? selectedContact?.id : currentUserId;
    const buyerId = currentUserRole === 'BUYER' ? currentUserId : selectedContact?.id;
    await sendB2BMessage(selectedThread.id, input.trim(), currentUserId, currentUserName || 'Admin', selectedThread.subject, sellerId, buyerId);
    setInput('');
    const refreshedThreads = await fetchB2BThreads(currentUserId);
    setThreads(refreshedThreads);
    const refreshed = await fetchB2BMessages(selectedThread.id);
    setMessages(refreshed);
  };

  const contactsLabel = currentUserRole === 'BUYER' ? 'Vendeurs en ligne' : 'Clients en ligne';

  return (
    <div className="space-y-6 animate-fade-in p-4 md:p-4 md:p-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-none shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight">Messagerie B2B</h1>
          <p className="text-gray-500 text-sm">Discussions avec les acheteurs professionnels et grossistes.</p>
        </div>
        <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-none text-xs font-black uppercase">
          {threads.filter(m => m.status === 'UNREAD').length} nouveaux messages
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
        <div className="bg-white border border-gray-200 rounded-none overflow-hidden flex flex-col shadow-sm">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <input type="text" placeholder="Rechercher une conversation..." className="w-full border border-gray-200 rounded-none px-4 py-2 text-sm focus:outline-none focus:border-[#00A859] bg-white shadow-inner" />
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {threads.map(m => (
              <div key={m.id} onClick={() => setSelectedThread(m)} className={`p-5 hover:bg-emerald-50/20 cursor-pointer transition-all ${m.status === 'UNREAD' ? 'bg-blue-50/40 border-l-4 border-blue-500' : ''}`}>
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`text-sm ${m.status === 'UNREAD' ? 'font-black text-[#0f172a]' : 'font-bold text-gray-700'} uppercase tracking-tighter`}>{m.fromName}</h4>
                  <span className="text-xs font-bold text-gray-400 uppercase">{m.date}</span>
                </div>
                <p className="text-xs text-[#00A859] font-black truncate mb-1">{m.subject}</p>
                <p className="text-xs text-gray-400 truncate tracking-tight">{m.preview}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-none overflow-hidden flex flex-col shadow-sm">
          <div className="p-4 border-b border-gray-100 bg-gray-50 text-xs font-black uppercase text-gray-400">{contactsLabel}</div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {contacts.map((c) => {
              const isOnline = onlineUserIds.includes(c.id);
              return (
                <button key={c.id} onClick={() => handleSelectContact(c)} className={`w-full text-left p-4 hover:bg-emerald-50/30 ${selectedContact?.id === c.id ? 'bg-emerald-50/50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-100 rounded-none flex items-center justify-center text-emerald-700 font-black">
                      {c.name?.slice(0, 2).toUpperCase() || 'CL'}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-black uppercase text-[#0f172a]">{c.name || 'Client'}</div>
                      <div className={`text-xs font-black flex items-center gap-1 uppercase ${isOnline ? 'text-emerald-600' : 'text-gray-400'}`}>
                        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></span> {isOnline ? 'En ligne' : 'Hors ligne'}
                      </div>
                      <div className="text-xs text-gray-400 font-bold uppercase">ID: {formatContactId(c)}</div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-none flex flex-col shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-emerald-100 rounded-none flex items-center justify-center text-emerald-700 font-black shadow-lg">
                {selectedThread?.fromName?.slice(0, 2).toUpperCase() || 'CL'}
              </div>
              <div>
                <h3 className="font-black text-[#0f172a] text-sm uppercase tracking-tight">{selectedThread?.fromName || 'Client'}</h3>
                <p className={`text-xs font-black flex items-center gap-1 uppercase ${selectedContact && onlineUserIds.includes(selectedContact.id) ? 'text-emerald-600' : 'text-gray-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${selectedContact && onlineUserIds.includes(selectedContact.id) ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></span>
                  {selectedContact && onlineUserIds.includes(selectedContact.id) ? 'En ligne' : 'Hors ligne'}
                </p>
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal /></button>
          </div>
          <div className="flex-1 p-8 overflow-y-auto bg-slate-50/30 space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.fromName === (currentUserName || 'Admin') ? 'justify-end' : 'justify-start'}`}>
                <div className={`${msg.fromName === (currentUserName || 'Admin') ? 'bg-[#00A859] text-white rounded-none' : 'bg-white border border-gray-100 text-[#0f172a] rounded-none'} p-4 max-w-sm text-xs font-medium shadow-sm leading-relaxed`}>
                  {msg.body}
                  <div className="text-xs opacity-70 mt-2">{msg.createdAt}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-5 border-t border-gray-100 bg-white">
            <div className="flex gap-3">
              <input value={input} onChange={(e) => setInput(e.target.value)} type="text" placeholder="Écrivez votre réponse..." className="flex-1 border-2 border-gray-50 bg-gray-50 rounded-none px-5 py-3 text-sm focus:outline-none focus:border-[#00A859] focus:bg-white transition-all" />
              <button onClick={handleSend} className="bg-[#00A859] text-white px-8 py-3 rounded-none font-black text-xs uppercase hover:bg-[#008F4A] shadow-lg transition-all active:scale-95">Envoyer</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. DELIVERIES (Livraisons)
const DeliveryTrackingView = ({ sellerId, actorId }: { sellerId?: string; actorId?: string }) => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [expandedDeliveryId, setExpandedDeliveryId] = useState<string | null>(null);
  const [deliveryEvents, setDeliveryEvents] = useState<Record<string, DeliveryEvent[]>>({});
  const [statusFilter, setStatusFilter] = useState<'ALL' | Delivery['status']>('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [newEventStatus, setNewEventStatus] = useState<Record<string, string>>({});
  const [newEventNote, setNewEventNote] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchDeliveries(sellerId).then(setDeliveries);
  }, [sellerId]);

  const toggleDeliveryDetails = async (deliveryId: string) => {
    if (expandedDeliveryId === deliveryId) {
      setExpandedDeliveryId(null);
      return;
    }
    setExpandedDeliveryId(deliveryId);
    if (!deliveryEvents[deliveryId]) {
      const events = await fetchDeliveryEvents(deliveryId);
      setDeliveryEvents(prev => ({ ...prev, [deliveryId]: events }));
    }
  };

  const addDeliveryEvent = async (deliveryId: string) => {
    const status = newEventStatus[deliveryId]?.trim();
    if (!status) return;
    await createDeliveryEvent(deliveryId, status, newEventNote[deliveryId], actorId);
    const refreshed = await fetchDeliveryEvents(deliveryId);
    setDeliveryEvents(prev => ({ ...prev, [deliveryId]: refreshed }));
    setNewEventStatus(prev => ({ ...prev, [deliveryId]: '' }));
    setNewEventNote(prev => ({ ...prev, [deliveryId]: '' }));
  };

  const filteredDeliveries = deliveries.filter((d) => {
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    const created = d.created_at ? new Date(d.created_at).getTime() : 0;
    const fromOk = !fromDate || created >= new Date(fromDate).getTime();
    const toOk = !toDate || created <= new Date(toDate).getTime() + 24 * 60 * 60 * 1000;
    return matchesStatus && fromOk && toOk;
  });

  return (
    <div className="space-y-6 animate-fade-in p-4 md:p-4 md:p-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight">Suivi Logistique</h1>
          <p className="text-gray-500 text-sm">Contrôle de la flotte et des expéditions en temps réel.</p>
        </div>
        <button className="bg-[#00A859] text-white px-6 py-3 rounded-none font-black uppercase text-xs flex items-center gap-2 hover:bg-[#008F4A] shadow-lg transition-all">
          <MapPin size={16} /> Vue Carte Temps Réel
        </button>
      </div>

      <div className="bg-white p-4 rounded-none border border-gray-200 shadow-sm flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-black uppercase text-gray-400 mb-1">Statut</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="border border-gray-200 px-3 py-2 rounded-none text-xs font-bold uppercase">
            <option value="ALL">Tous</option>
            <option value="PENDING">Préparation</option>
            <option value="EN_ROUTE">En route</option>
            <option value="DELIVERED">Livré</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-gray-400 mb-1">Du</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border border-gray-200 px-3 py-2 rounded-none text-xs font-bold" />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-gray-400 mb-1">Au</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border border-gray-200 px-3 py-2 rounded-none text-xs font-bold" />
        </div>
      </div>

      <div className="bg-white rounded-none border border-gray-200 overflow-x-auto shadow-sm">
        <table className="w-full min-w-[720px] text-left text-xs md:text-sm">
          <thead className="bg-gray-50 text-xs font-black uppercase text-gray-400 border-b">
            <tr><th className="p-6">ID Expédition</th><th className="p-6">Destination</th><th className="p-6">État</th><th className="p-6">Livreur Affecté</th><th className="p-6 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredDeliveries.map(d => (
              <React.Fragment key={d.id}>
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-6 font-mono font-black text-[#064e3b] text-sm uppercase tracking-tighter">{d.id}</td>
                  <td className="p-6"><div className="font-black text-sm uppercase text-[#0f172a]">{d.customer}</div><div className="text-xs text-gray-400 font-bold flex items-center gap-1 mt-1 uppercase"><MapPin size={10} /> {d.address}</div></td>
                  <td className="p-6">
                    {d.status === 'EN_ROUTE' && <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-xs font-black uppercase flex items-center gap-1.5 w-fit border border-blue-100"><Truck size={12} /> En Route ({d.time})</span>}
                    {d.status === 'PENDING' && <span className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full text-xs font-black uppercase flex items-center gap-1.5 w-fit border border-orange-100"><Calendar size={12} /> Préparation</span>}
                    {d.status === 'DELIVERED' && <span className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-xs font-black uppercase flex items-center gap-1.5 w-fit border border-emerald-100"><CheckCircle size={12} /> Livré</span>}
                  </td>
                  <td className="p-6 text-xs font-bold text-gray-500 uppercase">{d.driver}</td>
                  <td className="p-6 text-right">
                    <button onClick={() => toggleDeliveryDetails(d.id)} className="text-[#00A859] hover:bg-emerald-50 px-4 py-2 rounded-none font-black text-xs uppercase border border-emerald-100 transition-all">
                      {expandedDeliveryId === d.id ? 'Masquer' : 'Détails'}
                    </button>
                  </td>
                </tr>
                {expandedDeliveryId === d.id && (
                  <tr className="bg-gray-50/50">
                    <td colSpan={5} className="p-6">
                      <p className="text-xs font-black uppercase text-gray-400 mb-3">Historique livraison</p>
                      <div className="space-y-2">
                        {(deliveryEvents[d.id] || []).length === 0 ? (
                          <p className="text-xs text-gray-400">Aucun événement enregistré.</p>
                        ) : (
                          deliveryEvents[d.id].map(e => (
                            <div key={e.id} className="flex justify-between text-xs text-gray-600">
                              <span className="font-bold uppercase">{e.status}{e.note ? ` — ${e.note}` : ''}</span>
                              <span>{new Date(e.created_at).toLocaleString()}</span>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="mt-4 flex flex-col md:flex-row gap-3">
                        <input
                          value={newEventStatus[d.id] || ''}
                          onChange={(e) => setNewEventStatus(prev => ({ ...prev, [d.id]: e.target.value }))}
                          placeholder="Nouveau statut (ex: EN_ROUTE)"
                          className="flex-1 border border-gray-200 px-3 py-2 rounded-none text-xs font-bold uppercase"
                        />
                        <input
                          value={newEventNote[d.id] || ''}
                          onChange={(e) => setNewEventNote(prev => ({ ...prev, [d.id]: e.target.value }))}
                          placeholder="Note (optionnel)"
                          className="flex-1 border border-gray-200 px-3 py-2 rounded-none text-xs"
                        />
                        <button onClick={() => addDeliveryEvent(d.id)} className="bg-[#00A859] text-white px-4 py-2 rounded-none text-xs font-black uppercase">
                          Ajouter
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 3. CREATE ADMINS (Super Admin)
const AdminCreateView = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('STORE_ADMIN');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentAdminId(data.user?.id || null));
  }, []);

  const handleCreate = async () => {
    if (!email || !password) {
      setStatusMsg("Email et mot de passe obligatoires.");
      return;
    }
    setLoading(true);
    setStatusMsg(null);
    try {
      await createAdminUser({
        email,
        password,
        role,
        full_name: fullName || 'Admin'
      });
      if (currentAdminId) {
        await createAuditLog({
          actor_id: currentAdminId,
          action: 'ADMIN_CREATE',
          entity: 'profiles',
          details: { email, role }
        });
      }
      setStatusMsg("Admin créé avec succès.");
      setEmail('');
      setPassword('');
      setFullName('');
      setRole('STORE_ADMIN');
    } catch (err: any) {
      setStatusMsg(err.message || "Erreur lors de la création.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-4 md:p-4 md:p-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-none shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight">Créer un Admin</h1>
          <p className="text-gray-500 text-sm">Ajoutez un admin et limitez ses onglets selon son rôle.</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-none border border-gray-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black uppercase text-gray-400 mb-1">Nom complet</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border border-gray-200 px-3 py-2 rounded-none text-sm" placeholder="Ex: Admin Magasin" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-gray-400 mb-1">Rôle</label>
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="w-full border border-gray-200 px-3 py-2 rounded-none text-xs font-bold uppercase">
              <option value="STORE_ADMIN">STORE_ADMIN</option>
              <option value="PARTNER_ADMIN">PARTNER_ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-gray-400 mb-1">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-200 px-3 py-2 rounded-none text-sm" placeholder="admin@ivoiredestock.com" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-gray-400 mb-1">Mot de passe</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-gray-200 px-3 py-2 rounded-none text-sm" placeholder="Mot de passe temporaire" />
          </div>
        </div>
        {statusMsg && <div className="text-xs font-bold text-gray-500">{statusMsg}</div>}
        <button
          onClick={handleCreate}
          disabled={loading}
          className="bg-[#00A859] text-white px-6 py-3 rounded-none font-black uppercase text-xs shadow-md disabled:opacity-50"
        >
          {loading ? 'Création...' : 'Créer Admin'}
        </button>
      </div>
    </div>
  );
};

// 4. USERS (Super Admin)
const UsersManagerView = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string | 'ALL'>('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('BUYER');
  const [editBusiness, setEditBusiness] = useState('');
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentAdminId(data.user?.id || null);
      const result = await fetchUsers({ query, role: roleFilter, status: statusFilter, fromDate, toDate, page, pageSize });
      setUsers(result.data);
      setTotalCount(result.count);
    };
    load();
  }, [query, roleFilter, statusFilter, fromDate, toDate, page, pageSize]);

  const startEdit = (u: any) => {
    setEditingId(u.id);
    setEditRole(u.role || 'BUYER');
    setEditBusiness(u.business_name || '');
    setEditStatus(u.status || 'ACTIVE');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    await updateUserProfile(id, {
      role: editRole,
      business_name: editBusiness || null,
      status: editStatus
    });
    if (currentAdminId) await createAuditLog({
      actor_id: currentAdminId,
      action: 'USER_UPDATE',
      entity: 'profiles',
      entity_id: id,
      details: { role: editRole, status: editStatus }
    });
    const refreshed = await fetchUsers({ query, role: roleFilter, status: statusFilter, fromDate, toDate, page, pageSize });
    setUsers(refreshed.data);
    setTotalCount(refreshed.count);
    setEditingId(null);
  };

  const banUser = async (id: string) => {
    await updateUserProfile(id, { status: 'BANNED' });
    if (currentAdminId) await createAuditLog({
      actor_id: currentAdminId,
      action: 'USER_BAN',
      entity: 'profiles',
      entity_id: id
    });
    const refreshed = await fetchUsers({ query, role: roleFilter, status: statusFilter, fromDate, toDate, page, pageSize });
    setUsers(refreshed.data);
    setTotalCount(refreshed.count);
  };

  const reactivateUser = async (id: string) => {
    await reactivateUserAdmin(id);
    if (currentAdminId) await createAuditLog({
      actor_id: currentAdminId,
      action: 'USER_REACTIVATE',
      entity: 'profiles',
      entity_id: id
    });
    const refreshed = await fetchUsers({ query, role: roleFilter, status: statusFilter, fromDate, toDate, page, pageSize });
    setUsers(refreshed.data);
    setTotalCount(refreshed.count);
  };

  const revokeAccess = async (id: string) => {
    await revokeAccessAdmin(id);
    if (currentAdminId) await createAuditLog({
      actor_id: currentAdminId,
      action: 'USER_REVOKE_ACCESS',
      entity: 'profiles',
      entity_id: id
    });
    const refreshed = await fetchUsers({ query, role: roleFilter, status: statusFilter, fromDate, toDate, page, pageSize });
    setUsers(refreshed.data);
    setTotalCount(refreshed.count);
  };

  const resetPassword = async (id: string, email: string) => {
    const result = await resetUserPasswordAdmin(id, email);
    if (result?.action_link) {
      alert(`Lien de réinitialisation: ${result.action_link}`);
    } else {
      alert("Lien de réinitialisation indisponible.");
    }
    if (currentAdminId) await createAuditLog({
      actor_id: currentAdminId,
      action: 'USER_RESET_PASSWORD',
      entity: 'profiles',
      entity_id: id
    });
  };

  const deleteUser = async (id: string) => {
    if (!window.confirm("Supprimer définitivement cet utilisateur ?")) return;
    await deleteUserAdmin(id);
    if (currentAdminId) await createAuditLog({
      actor_id: currentAdminId,
      action: 'USER_SOFT_DELETE',
      entity: 'profiles',
      entity_id: id
    });
    const refreshed = await fetchUsers({ query, role: roleFilter, status: statusFilter, page, pageSize });
    setUsers(refreshed.data);
    setTotalCount(refreshed.count);
  };

  const exportCsv = () => {
    const header = ['full_name', 'email', 'role', 'business_name', 'status'];
    const rows = users.map(u => [u.full_name || '', u.email || '', u.role || '', u.business_name || '', u.status || '']);
    const csv = [header, ...rows].map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in p-4 md:p-4 md:p-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-none shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight">Gestion Utilisateurs</h1>
          <p className="text-gray-500 text-sm">Contrôle des comptes et des permissions de la plateforme.</p>
        </div>
        <div className="flex gap-3">
          <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} type="text" placeholder="Nom, email..." className="border-2 border-gray-50 bg-gray-50 rounded-none px-4 py-2 text-sm focus:outline-none focus:border-[#00A859] focus:bg-white" />
          <button onClick={exportCsv} className="bg-[#00A859] text-white px-5 py-2 rounded-none font-black uppercase text-xs shadow-md">Exporter CSV</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-none border border-gray-200 shadow-sm flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-black uppercase text-gray-400 mb-1">Rôle</label>
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value as UserRole | 'ALL'); setPage(1); }} className="border border-gray-200 px-3 py-2 rounded-none text-xs font-bold uppercase">
            <option value="ALL">Tous</option>
            <option value="BUYER">BUYER</option>
            <option value="STORE_ADMIN">STORE_ADMIN</option>
            <option value="PARTNER_ADMIN">PARTNER_ADMIN</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-gray-400 mb-1">Statut</label>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="border border-gray-200 px-3 py-2 rounded-none text-xs font-bold uppercase">
            <option value="ALL">Tous</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PENDING">PENDING</option>
            <option value="BANNED">BANNED</option>
            <option value="DELETED">DELETED</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-gray-400 mb-1">Page size</label>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="border border-gray-200 px-3 py-2 rounded-none text-xs font-bold uppercase">
            {[5, 10, 20, 50].map(size => <option key={size} value={size}>{size}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-none border border-gray-200 overflow-x-auto shadow-sm">
        <table className="w-full min-w-[720px] text-left text-xs md:text-sm">
          <thead className="bg-gray-50 text-xs font-black uppercase text-gray-400 border-b">
            <tr><th className="p-6">Utilisateur</th><th className="p-6">Rôle</th><th className="p-6">Business</th><th className="p-6">Statut</th><th className="p-6 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-6">
                  <div className="font-black text-[#0f172a] text-sm uppercase tracking-tight">{u.full_name || '—'}</div>
                  <div className="text-xs text-gray-500 font-bold">{u.email || ''}</div>
                </td>
                <td className="p-6">
                  {editingId === u.id ? (
                    <select value={editRole} onChange={(e) => setEditRole(e.target.value as UserRole)} className="border border-gray-200 text-xs font-bold uppercase px-2 py-1 rounded-none">
                      <option value="BUYER">BUYER</option>
                      <option value="STORE_ADMIN">STORE_ADMIN</option>
                      <option value="PARTNER_ADMIN">PARTNER_ADMIN</option>
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-black px-2 py-1 rounded-none uppercase border ${u.role === 'STORE_ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-100' : u.role === 'PARTNER_ADMIN' ? 'bg-blue-50 text-blue-700 border-blue-100' : u.role === 'SUPER_ADMIN' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>{u.role || 'BUYER'}</span>
                      {u.cni_status === 'VERIFIED' && (
                        <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-full">
                          CNI validée
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td className="p-6 text-xs font-bold text-gray-500 uppercase">
                  {editingId === u.id ? (
                    <input value={editBusiness} onChange={(e) => setEditBusiness(e.target.value)} className="border border-gray-200 px-2 py-1 rounded-none text-xs" />
                  ) : (
                    u.business_name || '-'
                  )}
                </td>
                <td className="p-6">
                  {editingId === u.id ? (
                    <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="border border-gray-200 text-xs font-bold uppercase px-2 py-1 rounded-none">
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="PENDING">PENDING</option>
                      <option value="BANNED">BANNED</option>
                      <option value="DELETED">DELETED</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                    </select>
                  ) : (
                    u.status === 'ACTIVE' && <span className="text-green-600 font-black text-xs flex items-center gap-1 uppercase"><Check size={12} /> Actif</span> ||
                    u.status === 'PENDING' && <span className="text-orange-500 font-black text-xs flex items-center gap-1 uppercase"><Calendar size={12} /> En attente</span> ||
                    u.status === 'SUSPENDED' && <span className="text-yellow-600 font-black text-xs flex items-center gap-1 uppercase"><ShieldCheck size={12} /> Suspendu</span> ||
                    u.status === 'DELETED' && <span className="text-gray-500 font-black text-xs flex items-center gap-1 uppercase"><Ban size={12} /> Supprimé</span> ||
                    <span className="text-red-600 font-black text-xs flex items-center gap-1 uppercase"><Ban size={12} /> Banni</span>
                  )}
                </td>
                <td className="p-6 text-right space-x-2">
                  {editingId === u.id ? (
                    <>
                      <button onClick={() => saveEdit(u.id)} className="p-2 hover:bg-emerald-50 rounded-none text-emerald-600"><Check size={16} /></button>
                      <button onClick={cancelEdit} className="p-2 hover:bg-gray-100 rounded-none text-gray-500"><X size={16} /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(u)} className="p-2 hover:bg-gray-100 rounded-none text-gray-400"><Edit size={16} /></button>
                      <button onClick={() => banUser(u.id)} className="p-2 hover:bg-red-50 rounded-none text-red-500"><Ban size={16} /></button>
                      <button onClick={() => reactivateUser(u.id)} className="p-2 hover:bg-emerald-50 rounded-none text-emerald-600"><Check size={16} /></button>
                      <button onClick={() => revokeAccess(u.id)} className="p-2 hover:bg-yellow-50 rounded-none text-yellow-600"><ShieldCheck size={16} /></button>
                      <button onClick={() => resetPassword(u.id, u.email)} className="p-2 hover:bg-blue-50 rounded-none text-blue-600"><Key size={16} /></button>
                      <button onClick={() => deleteUser(u.id)} className="p-2 hover:bg-red-50 rounded-none text-red-600"><X size={16} /></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>{totalCount} utilisateurs</span>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 border border-gray-200 rounded-none disabled:opacity-50">Précédent</button>
          <span>Page {page}</span>
          <button disabled={page * pageSize >= totalCount} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border border-gray-200 rounded-none disabled:opacity-50">Suivant</button>
        </div>
      </div>
    </div>
  );
};

// 4. TICKETS / SUPPORT
const TicketsManagerView = () => {
  const [tickets, setTickets] = useState<FeedbackTicket[]>([]);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentAdminId(data.user?.id || null);
      const refreshed = await fetchTickets();
      setTickets(refreshed);
    };
    load();
  }, []);

  const handleStatusChange = async (ticketId: string, status: FeedbackTicket['status']) => {
    await updateTicketStatus(ticketId, status, currentAdminId || undefined);
    const refreshed = await fetchTickets();
    setTickets(refreshed);
  };

  return (
    <div className="space-y-6 animate-fade-in p-4 md:p-4 md:p-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-none shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight">Tickets & Support</h1>
          <p className="text-gray-500 text-sm">Suivi des demandes, bugs et besoins clients.</p>
        </div>
      </div>
      <div className="bg-white rounded-none border border-gray-200 overflow-x-auto shadow-sm">
        <table className="w-full min-w-[720px] text-left text-xs md:text-sm">
          <thead className="bg-gray-50 text-xs font-black uppercase text-gray-400 border-b">
            <tr><th className="p-6">Sujet</th><th className="p-6">Type</th><th className="p-6">Statut</th><th className="p-6">Date</th><th className="p-6 text-right">Action</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {tickets.map(t => (
              <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-6">
                  <div className="font-black text-[#0f172a] text-sm uppercase tracking-tight">{t.subject}</div>
                  <div className="text-xs text-gray-500 font-bold">{t.description}</div>
                </td>
                <td className="p-6 text-xs font-black uppercase">{t.type}</td>
                <td className="p-6 text-xs font-black uppercase">{t.status}</td>
                <td className="p-6 text-xs font-bold text-gray-400">{t.date}</td>
                <td className="p-6 text-right">
                  <select value={t.status} onChange={(e) => handleStatusChange(t.id, e.target.value as FeedbackTicket['status'])} className="border border-gray-200 text-xs font-bold uppercase px-2 py-1 rounded-none">
                    <option value="PENDING">PENDING</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AuditLogsView = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [actionFilter, setActionFilter] = useState<string | 'ALL'>('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const result = await fetchAuditLogs({ query, actorRole: roleFilter, action: actionFilter, fromDate, toDate, page, pageSize });
      setLogs(result.data);
      setTotalCount(result.count);
    };
    load();
  }, [query, roleFilter, actionFilter, fromDate, toDate, page, pageSize]);

  return (
    <div className="space-y-6 animate-fade-in p-4 md:p-4 md:p-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-none shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight">Audit Logs</h1>
          <p className="text-gray-500 text-sm">Historique des actions utilisateurs.</p>
        </div>
        <div className="flex gap-3">
          <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} type="text" placeholder="Action, entité..." className="border-2 border-gray-50 bg-gray-50 rounded-none px-4 py-2 text-sm focus:outline-none focus:border-[#00A859] focus:bg-white" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-none border border-gray-200 shadow-sm flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-black uppercase text-gray-400 mb-1">Rôle</label>
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value as UserRole | 'ALL'); setPage(1); }} className="border border-gray-200 px-3 py-2 rounded-none text-xs font-bold uppercase">
            <option value="ALL">Tous</option>
            <option value="BUYER">BUYER</option>
            <option value="STORE_ADMIN">STORE_ADMIN</option>
            <option value="PARTNER_ADMIN">PARTNER_ADMIN</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-gray-400 mb-1">Action</label>
          <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} className="border border-gray-200 px-3 py-2 rounded-none text-xs font-bold uppercase">
            <option value="ALL">Toutes</option>
            <option value="PRODUCT_CREATE">PRODUCT_CREATE</option>
            <option value="PRODUCT_UPDATE">PRODUCT_UPDATE</option>
            <option value="PRODUCT_DELETE">PRODUCT_DELETE</option>
            <option value="ORDER_CREATE">ORDER_CREATE</option>
            <option value="USER_UPDATE">USER_UPDATE</option>
            <option value="USER_BAN">USER_BAN</option>
            <option value="USER_REACTIVATE">USER_REACTIVATE</option>
            <option value="USER_REVOKE_ACCESS">USER_REVOKE_ACCESS</option>
            <option value="USER_RESET_PASSWORD">USER_RESET_PASSWORD</option>
            <option value="USER_SOFT_DELETE">USER_SOFT_DELETE</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-gray-400 mb-1">Du</label>
          <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} className="border border-gray-200 px-3 py-2 rounded-none text-xs font-bold" />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-gray-400 mb-1">Au</label>
          <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} className="border border-gray-200 px-3 py-2 rounded-none text-xs font-bold" />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-gray-400 mb-1">Du</label>
          <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} className="border border-gray-200 px-3 py-2 rounded-none text-xs font-bold" />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-gray-400 mb-1">Au</label>
          <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} className="border border-gray-200 px-3 py-2 rounded-none text-xs font-bold" />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-gray-400 mb-1">Page size</label>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="border border-gray-200 px-3 py-2 rounded-none text-xs font-bold uppercase">
            {[5, 10, 20, 50].map(size => <option key={size} value={size}>{size}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-none border border-gray-200 overflow-x-auto shadow-sm">
        <table className="w-full min-w-[720px] text-left text-xs md:text-sm">
          <thead className="bg-gray-50 text-xs font-black uppercase text-gray-400 border-b">
            <tr>
              <th className="p-6">Acteur</th>
              <th className="p-6">Rôle</th>
              <th className="p-6">Action</th>
              <th className="p-6">Entité</th>
              <th className="p-6">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {logs.map(l => (
              <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-6 text-xs font-bold text-gray-700">{l.profiles?.full_name || l.actor_id}</td>
                <td className="p-6 text-xs font-black uppercase">{l.profiles?.role || '—'}</td>
                <td className="p-6 text-xs font-black uppercase text-[#00A859]">{l.action}</td>
                <td className="p-6 text-xs font-bold text-gray-500 uppercase">{l.entity}</td>
                <td className="p-6 text-xs font-bold text-gray-400">{new Date(l.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>{totalCount} logs</span>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 border border-gray-200 rounded-none disabled:opacity-50">Précédent</button>
          <span>Page {page}</span>
          <button disabled={page * pageSize >= totalCount} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border border-gray-200 rounded-none disabled:opacity-50">Suivant</button>
        </div>
      </div>
    </div>
  );
};

// 5. PARAMETRES / CONFIG
const SettingsView = ({ userProfile }: { userProfile?: UserProfile }) => {
  const [fullName, setFullName] = useState(userProfile?.name || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [location, setLocation] = useState(userProfile?.location || '');
  const [businessName, setBusinessName] = useState(userProfile?.businessName || '');
  const [avatar, setAvatar] = useState(userProfile?.avatar || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(userProfile?.avatar || null);
  const [password, setPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [avatarEnabled, setAvatarEnabled] = useState(false);
  const [lookupId, setLookupId] = useState('');
  const [lookupProfile, setLookupProfile] = useState<UserProfile | null>(null);
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [cniRectoFile, setCniRectoFile] = useState<File | null>(null);
  const [cniVersoFile, setCniVersoFile] = useState<File | null>(null);
  const [cniRectoPreview, setCniRectoPreview] = useState<string | null>(null);
  const [cniVersoPreview, setCniVersoPreview] = useState<string | null>(null);
  const [cniStatus, setCniStatus] = useState<'PENDING' | 'VERIFIED' | 'FAILED'>('PENDING');
  const [cniFields, setCniFields] = useState<{ fullName?: string; cniNumber?: string; birthDate?: string } | null>(null);

  useEffect(() => {
    setFullName(userProfile?.name || '');
    setPhone(userProfile?.phone || '');
    setLocation(userProfile?.location || '');
    setBusinessName(userProfile?.businessName || '');
    setAvatar(userProfile?.avatar || '');
    setAvatarPreview(userProfile?.avatar || null);
    if (userProfile?.cniStatus) setCniStatus(userProfile.cniStatus as any);
  }, [userProfile]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
  }, []);

  const getIdentifier = (profile?: UserProfile | null) => {
    if (!profile?.id) return '-';
    const shortId = profile.id.slice(0, 8).toUpperCase();
    switch (profile.role) {
      case 'STORE_ADMIN':
        return `VDR-${shortId}`;
      case 'PARTNER_ADMIN':
        return `PRT-${shortId}`;
      case 'SUPER_ADMIN':
        return `ADM-${shortId}`;
      default:
        return `USR-${shortId}`;
    }
  };

  const handleSaveProfile = async () => {
    if (!userProfile?.id) return;
    if (currentUserId && currentUserId !== userProfile.id && userProfile.role !== 'SUPER_ADMIN') {
      setStatusMsg("Accès non autorisé.");
      return;
    }
    setStatusMsg(null);
    let avatarUrl = avatar || null;
    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${userProfile.id}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, { upsert: true });
      if (uploadError) {
        setStatusMsg("Erreur upload avatar. Vérifiez le bucket avatars.");
        return;
      }
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      avatarUrl = data.publicUrl;
      setAvatarPreview(avatarUrl);
    }
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone,
        location,
        business_name: businessName || null,
        avatar: avatarUrl
      })
      .eq('id', userProfile.id);
    if (error) {
      setStatusMsg("Erreur lors de la mise à jour du profil.");
      return;
    }
    setStatusMsg("Profil mis à jour avec succès.");
    if (currentUserId) {
      await createAuditLog({
        actor_id: currentUserId,
        action: 'SETTINGS_UPDATE',
        entity: 'profiles',
        entity_id: userProfile.id
      });
    }
  };

  const handleChangePassword = async () => {
    if (!password.trim()) return;
    setStatusMsg(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatusMsg("Erreur lors du changement de mot de passe.");
      return;
    }
    setPassword('');
    setStatusMsg("Mot de passe mis à jour.");
    if (currentUserId) {
      await createAuditLog({
        actor_id: currentUserId,
        action: 'SETTINGS_PASSWORD_UPDATE',
        entity: 'profiles',
        entity_id: userProfile?.id
      });
    }
  };

  const handlePrintCard = () => {
    const content = `
      <html>
        <head><title>Fiche Identité</title></head>
        <body style="font-family: Arial, sans-serif; padding: 24px; background:#f8fafc;">
          <div style="max-width:720px;margin:0 auto;background:#43a047;padding:16px;color:#0f172a;">
            <div style="font-size:10px;color:#eaffea;text-transform:uppercase;font-weight:700;margin-bottom:8px;">Carte d'identité</div>
            <div style="display:flex;gap:16px;">
              <div style="width:110px;height:130px;background:#fff;border:1px solid #d1fae5;"></div>
              <div style="flex:1;display:flex;flex-direction:column;gap:6px;">
                <div style="background:#fff;padding:8px;font-size:12px;font-weight:700;">ID: ${getIdentifier(userProfile)}</div>
                <div style="background:#fff;padding:8px;font-size:12px;font-weight:700;">Nom: ${userProfile?.name || '-'}</div>
                <div style="display:flex;gap:8px;">
                  <div style="flex:1;background:#fff;padding:8px;font-size:10px;font-weight:700;">Rôle: ${userProfile?.role || '-'}</div>
                  <div style="flex:1;background:#fff;padding:8px;font-size:10px;font-weight:700;">Tél: ${userProfile?.phone || '-'}</div>
                </div>
                <div style="background:#fff;padding:8px;font-size:10px;font-weight:700;">Business: ${userProfile?.businessName || '-'}</div>
                <div style="background:#fff;padding:8px;font-size:10px;font-weight:700;">Localisation: ${userProfile?.location || '-'}</div>
              </div>
            </div>
            <div style="margin-top:10px;background:#fff;padding:8px;font-size:10px;font-weight:700;">Email: ${userProfile?.email || '-'}</div>
            <div style="margin-top:8px;font-size:10px;color:#eaffea;text-transform:uppercase;font-weight:700;">Document: IVOIREDESTOCK - Profil utilisateur</div>
          </div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleLookupProfile = async () => {
    if (!lookupId.trim()) return;
    setIsLookupLoading(true);
    const profile = await getUserProfile(lookupId.trim());
    setLookupProfile(profile);
    setIsLookupLoading(false);
  };

  const handleCniSubmit = async () => {
    if (!userProfile?.id || !cniRectoFile || !cniVersoFile) return;
    try {
      setCniStatus('PENDING');
      const rectoUrl = await uploadCniImage(userProfile.id, 'recto', cniRectoFile);
      const versoUrl = await uploadCniImage(userProfile.id, 'verso', cniVersoFile);
      await supabase
        .from('profiles')
        .update({
          cni_recto_url: rectoUrl,
          cni_verso_url: versoUrl,
          cni_status: 'PENDING'
        })
        .eq('id', userProfile.id);
      setCniStatus('PENDING');
      setStatusMsg("CNI envoyée. En attente de validation.");
    } catch (e) {
      setCniStatus('FAILED');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-4 md:p-4 md:p-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-none shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight">Paramètres & Configuration</h1>
          <p className="text-gray-500 text-sm">Gérez vos informations personnelles et la sécurité du compte.</p>
        </div>
      </div>

      {statusMsg && (
        <div className="bg-white border border-gray-200 text-[#00A859] text-sm font-bold p-4 rounded-none">
          {statusMsg}
        </div>
      )}

      <div className="bg-white rounded-none border border-gray-200 p-6 shadow-sm space-y-6">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Profil</h3>
        <div className="bg-[#43a047] p-5 rounded-none shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
          <p className="text-xs font-black uppercase text-white/80 mb-2">Carte d'identité</p>
          <div className="flex gap-4">
            <div className="w-28 h-32 bg-white/90 border border-white/60">
              {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" /> : null}
            </div>
            <div className="flex-1 space-y-2">
              <div className="bg-white/90 px-3 py-2 text-xs font-bold text-[#0f172a]">ID: {getIdentifier(userProfile)}</div>
              <div className="bg-white/90 px-3 py-2 text-xs font-bold text-[#0f172a]">Nom: {userProfile?.name || '—'}</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/90 px-3 py-2 text-xs font-bold text-[#0f172a]">Rôle: {userProfile?.role || '—'}</div>
                <div className="bg-white/90 px-3 py-2 text-xs font-bold text-[#0f172a]">Tél: {userProfile?.phone || '—'}</div>
              </div>
              <div className="bg-white/90 px-3 py-2 text-xs font-bold text-[#0f172a]">Business: {userProfile?.businessName || '—'}</div>
              <div className="bg-white/90 px-3 py-2 text-xs font-bold text-[#0f172a]">Localisation: {userProfile?.location || '—'}</div>
            </div>
          </div>
          <div className="mt-3 bg-white/90 px-3 py-2 text-xs font-bold text-[#0f172a]">Email: {userProfile?.email || '—'}</div>
          <div className="mt-2 text-xs text-white/90 uppercase font-bold">Document: IVOIREDESTOCK - Profil utilisateur</div>
          <div className="mt-3">
            <button onClick={handlePrintCard} className="bg-white text-[#0f172a] px-4 py-2 rounded-none text-xs font-black uppercase">
              Export PDF
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nom complet" className="border border-gray-200 p-3 rounded-none text-sm font-bold" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Téléphone" className="border border-gray-200 p-3 rounded-none text-sm font-bold" />
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Localisation" className="border border-gray-200 p-3 rounded-none text-sm font-bold" />
          <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Nom du business (optionnel)" className="border border-gray-200 p-3 rounded-none text-sm font-bold" />
          <div className="col-span-1 md:col-span-2 flex items-center gap-4">
            <div className="w-14 h-14 rounded-none bg-gray-100 border border-gray-200 overflow-hidden">
              {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" /> : null}
            </div>
            <label className={`text-xs font-bold uppercase text-gray-500`}>
              Choisir un avatar
              <input disabled={!avatarEnabled} type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} className="hidden" />
            </label>
            <button
              type="button"
              onClick={() => setAvatarEnabled((v) => !v)}
              className="ml-auto px-3 py-2 text-xs font-black uppercase border border-gray-200 rounded-none"
            >
              {avatarEnabled ? 'Désactiver avatar' : 'Activer avatar'}
            </button>
          </div>
          <input disabled={!avatarEnabled} value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="URL avatar (optionnel)" className="border border-gray-200 p-3 rounded-none text-sm font-bold col-span-1 md:col-span-2 disabled:opacity-50" />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={handlePrintCard} className="border border-gray-200 text-gray-700 px-6 py-3 rounded-none text-xs font-black uppercase">
            Imprimer la fiche
          </button>
          <button onClick={handleSaveProfile} className="bg-[#00A859] text-white px-6 py-3 rounded-none text-xs font-black uppercase">
            Sauvegarder
          </button>
        </div>
      </div>

      {(userProfile?.role === 'STORE_ADMIN' || userProfile?.role === 'PARTNER_ADMIN') && userProfile?.cniStatus !== 'VERIFIED' && (
        <div className="bg-white rounded-none border border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Pièce d'identité (CNI)</h3>
          <p className="text-xs text-gray-500">Recto/verso requis pour vérification.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="border-2 border-dashed border-gray-200 rounded-none p-4 text-xs font-bold text-gray-500 cursor-pointer hover:border-[#00A859]/60">
              Recto CNI
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setCniRectoFile(file);
                  setCniRectoPreview(URL.createObjectURL(file));
                }
              }} />
              {cniRectoPreview && <img src={cniRectoPreview} className="mt-3 w-full h-40 object-contain border border-gray-200" />}
            </label>
            <label className="border-2 border-dashed border-gray-200 rounded-none p-4 text-xs font-bold text-gray-500 cursor-pointer hover:border-[#00A859]/60">
              Verso CNI
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setCniVersoFile(file);
                  setCniVersoPreview(URL.createObjectURL(file));
                }
              }} />
              {cniVersoPreview && <img src={cniVersoPreview} className="mt-3 w-full h-40 object-contain border border-gray-200" />}
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-black uppercase text-gray-400">Vérification</span>
            <span className={`text-xs font-black uppercase ${cniStatus === 'FAILED' ? 'text-red-600' : 'text-orange-600'}`}>
              {userProfile?.cniStatus === 'PENDING' ? 'En attente' : 'À soumettre'}
            </span>
            <button onClick={handleCniSubmit} className="ml-auto bg-[#00A859] text-white px-4 py-2 rounded-none text-xs font-black uppercase disabled:opacity-50" disabled={!cniRectoFile || !cniVersoFile}>
              Soumettre
            </button>
          </div>
        </div>
      )}
      {(userProfile?.role === 'STORE_ADMIN' || userProfile?.role === 'PARTNER_ADMIN') && userProfile?.cniStatus === 'VERIFIED' && (
        <div className="bg-emerald-50 border border-emerald-100 p-4 text-emerald-700 text-xs font-bold rounded-none">
          Votre CNI a été vérifiée.
        </div>
      )}

      {userProfile?.role === 'SUPER_ADMIN' && (
        <div className="bg-white rounded-none border border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Recherche utilisateur par ID</h3>
          <div className="flex flex-col md:flex-row gap-3">
            <input value={lookupId} onChange={(e) => setLookupId(e.target.value)} placeholder="UUID utilisateur ou ID profil" className="flex-1 border border-gray-200 p-3 rounded-none text-sm font-bold" />
            <button onClick={handleLookupProfile} className="bg-[#00A859] text-white px-6 py-3 rounded-none text-xs font-black uppercase">
              {isLookupLoading ? 'Recherche...' : 'Rechercher'}
            </button>
          </div>
          {lookupProfile && (
            <div className="border border-emerald-100 p-5 bg-gradient-to-br from-white via-white to-emerald-50 rounded-none shadow-[0_12px_30px_rgba(16,185,129,0.12)]">
              <p className="text-xs font-black uppercase text-gray-400 mb-2">Carte d'identité</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-400 font-bold uppercase text-xs">ID:</span> {getIdentifier(lookupProfile)}</div>
                <div><span className="text-gray-400 font-bold uppercase text-xs">Nom:</span> {lookupProfile.name || '—'}</div>
                <div><span className="text-gray-400 font-bold uppercase text-xs">Rôle:</span> {lookupProfile.role || '—'}</div>
                <div><span className="text-gray-400 font-bold uppercase text-xs">Email:</span> {lookupProfile.email || '—'}</div>
                <div><span className="text-gray-400 font-bold uppercase text-xs">Téléphone:</span> {lookupProfile.phone || '—'}</div>
                <div><span className="text-gray-400 font-bold uppercase text-xs">Business:</span> {lookupProfile.businessName || '—'}</div>
                <div><span className="text-gray-400 font-bold uppercase text-xs">Localisation:</span> {lookupProfile.location || '—'}</div>
              </div>
              {(lookupProfile.cniRectoUrl || lookupProfile.cniVersoUrl) && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lookupProfile.cniRectoUrl && <img src={lookupProfile.cniRectoUrl} className="w-full h-40 object-contain border border-gray-200" />}
                  {lookupProfile.cniVersoUrl && <img src={lookupProfile.cniVersoUrl} className="w-full h-40 object-contain border border-gray-200" />}
                </div>
              )}
              {lookupProfile.role !== 'BUYER' && (
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-xs font-black uppercase text-gray-400">CNI</span>
                  <span className="text-xs font-black uppercase">{lookupProfile.cniStatus || 'PENDING'}</span>
                  <button
                    onClick={async () => {
                      if (!lookupProfile?.id || !currentUserId) return;
                      await supabase.from('profiles').update({
                        cni_status: 'VERIFIED',
                        cni_verified_at: new Date().toISOString(),
                        cni_verified_by: currentUserId
                      }).eq('id', lookupProfile.id);
                      setStatusMsg("CNI vérifiée. L'utilisateur est informé.");
                      const refreshed = await getUserProfile(lookupProfile.id);
                      setLookupProfile(refreshed);
                    }}
                    className="ml-auto bg-[#00A859] text-white px-4 py-2 rounded-none text-xs font-black uppercase"
                  >
                    Valider CNI
                  </button>
                </div>
              )}
              <div className="mt-3 text-xs text-gray-500 uppercase font-bold">Document: IVOIREDESTOCK - Profil utilisateur</div>
              <div className="mt-3">
                <button onClick={handlePrintCard} className="border border-gray-200 text-gray-700 px-4 py-2 rounded-none text-xs font-black uppercase">
                  Imprimer la fiche
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-none border border-gray-200 p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Sécurité</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nouveau mot de passe" className="border border-gray-200 p-3 rounded-none text-sm font-bold" />
        </div>
        <div className="flex justify-end">
          <button onClick={handleChangePassword} className="bg-[#00A859] text-white px-6 py-3 rounded-none text-xs font-black uppercase">
            Changer le mot de passe
          </button>
        </div>
      </div>
    </div>
  );
};

const VendorStockView = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [vendorProducts, setVendorProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchVendorAggregates().then(setVendors);
  }, []);

  useEffect(() => {
    if (selectedVendorId) {
      fetchProductsByVendor(selectedVendorId).then(setVendorProducts);
    }
  }, [selectedVendorId]);

  const totalStock = vendors.reduce((sum, v) => sum + (v.stockTotal || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in p-4 md:p-4 md:p-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-none shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight">Stock par Vendeur</h1>
          <p className="text-gray-500 text-sm">Total stock et nombre de produits par vendeur.</p>
        </div>
        <div className="text-xs font-black text-gray-400 uppercase">Total stock: {totalStock}</div>
      </div>

      <div className="bg-white rounded-none border border-gray-200 overflow-x-auto shadow-sm">
        <table className="w-full min-w-[720px] text-left text-xs md:text-sm">
          <thead className="bg-gray-50 text-xs font-black uppercase text-gray-400 border-b">
            <tr><th className="p-6">Vendeur</th><th className="p-6">Rôle</th><th className="p-6">Produits</th><th className="p-6">Stock Total</th><th className="p-6 text-right">Action</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {vendors.map(v => (
              <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-6 text-sm font-bold">{v.name}</td>
                <td className="p-6 text-xs font-black uppercase">{v.role}</td>
                <td className="p-6 text-xs font-black uppercase">{v.productCount}</td>
                <td className="p-6 text-xs font-black uppercase text-[#00A859]">{v.stockTotal}</td>
                <td className="p-6 text-right">
                  <button onClick={() => setSelectedVendorId(v.id)} className="text-[#00A859] hover:bg-emerald-50 px-3 py-1.5 rounded-none text-xs font-black uppercase border border-emerald-100">
                    Voir produits
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedVendorId && (
        <div className="bg-white rounded-none border border-gray-200 overflow-x-auto shadow-sm">
          <div className="p-4 border-b border-gray-200 text-xs font-black uppercase text-gray-400">Produits du vendeur</div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left border-collapse text-xs md:text-sm">
              <thead className="bg-gray-50 text-xs font-black uppercase text-gray-400 border-b">
                <tr><th className="p-6">Produit</th><th className="p-6">Stock</th><th className="p-6">Prix</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {vendorProducts.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-6 text-sm font-bold">{p.name}</td>
                    <td className="p-6 text-xs font-black uppercase">{p.stock}</td>
                    <td className="p-6 text-xs font-black uppercase text-[#00A859]">{Number(p.price || 0).toLocaleString()} FCFA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const VendorBenefitsView = () => {
  const [vendors, setVendors] = useState<any[]>([]);

  useEffect(() => {
    fetchVendorAggregates().then(setVendors);
  }, []);

  const totalPaid = vendors.reduce((sum, v) => sum + (v.revenuePaid || 0), 0);
  const totalPending = vendors.reduce((sum, v) => sum + (v.revenuePending || 0), 0);
  const totalAll = vendors.reduce((sum, v) => sum + (v.revenueTotal || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in p-4 md:p-4 md:p-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-none shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight">Bénéfices par Vendeur</h1>
          <p className="text-gray-500 text-sm">Entrées, en attente et total cumulé.</p>
        </div>
        <div className="text-xs font-black text-gray-400 uppercase">Total cumulé: {totalAll.toLocaleString()} FCFA</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 border border-gray-200 rounded-none">
          <p className="text-xs font-black uppercase text-gray-400">Entrées (Payé)</p>
          <p className="text-2xl font-black text-[#00A859]">{totalPaid.toLocaleString()} FCFA</p>
        </div>
        <div className="bg-white p-4 border border-gray-200 rounded-none">
          <p className="text-xs font-black uppercase text-gray-400">En attente</p>
          <p className="text-2xl font-black text-[#00A859]">{totalPending.toLocaleString()} FCFA</p>
        </div>
        <div className="bg-white p-4 border border-gray-200 rounded-none">
          <p className="text-xs font-black uppercase text-gray-400">Cumulé</p>
          <p className="text-2xl font-black text-[#00A859]">{totalAll.toLocaleString()} FCFA</p>
        </div>
      </div>

      <div className="bg-white rounded-none border border-gray-200 overflow-x-auto shadow-sm">
        <table className="w-full min-w-[720px] text-left text-xs md:text-sm">
          <thead className="bg-gray-50 text-xs font-black uppercase text-gray-400 border-b">
            <tr><th className="p-6">Vendeur</th><th className="p-6">Rôle</th><th className="p-6">Entrées</th><th className="p-6">En attente</th><th className="p-6">Total</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {vendors.map(v => (
              <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-6 text-sm font-bold">{v.name}</td>
                <td className="p-6 text-xs font-black uppercase">{v.role}</td>
                <td className="p-6 text-xs font-black uppercase text-[#00A859]">{(v.revenuePaid || 0).toLocaleString()} FCFA</td>
                <td className="p-6 text-xs font-black uppercase text-[#00A859]">{(v.revenuePending || 0).toLocaleString()} FCFA</td>
                <td className="p-6 text-xs font-black uppercase text-[#00A859]">{(v.revenueTotal || 0).toLocaleString()} FCFA</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const VendorProductsView = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchVendorAggregates().then((data) => {
      setVendors(data);
      if (data.length > 0) setSelectedVendorId(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedVendorId) {
      fetchProductsByVendor(selectedVendorId).then(setProducts);
    }
  }, [selectedVendorId]);

  return (
    <div className="space-y-6 animate-fade-in p-4 md:p-4 md:p-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-none shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight">Produits par Vendeur</h1>
          <p className="text-gray-500 text-sm">Liste des produits publiés par chaque vendeur.</p>
        </div>
        <select value={selectedVendorId} onChange={(e) => setSelectedVendorId(e.target.value)} className="border border-gray-200 px-3 py-2 rounded-none text-xs font-bold uppercase">
          {vendors.map(v => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </div>
      <div className="bg-white rounded-none border border-gray-200 overflow-x-auto shadow-sm">
        <table className="w-full min-w-[720px] text-left text-xs md:text-sm">
          <thead className="bg-gray-50 text-xs font-black uppercase text-gray-400 border-b">
            <tr><th className="p-6">Produit</th><th className="p-6">Prix</th><th className="p-6">Stock</th><th className="p-6">Statut</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-6 text-sm font-bold">{p.name}</td>
                <td className="p-6 text-xs font-black uppercase text-[#00A859]">{Number(p.price).toLocaleString()} FCFA</td>
                <td className="p-6 text-xs font-black uppercase">{p.stock}</td>
                <td className="p-6 text-xs font-black uppercase">{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


/* --- MAIN DASHBOARD WRAPPER --- */

const StoreStatsDashboard = ({ products, userProfile }: { products: Product[], userProfile?: UserProfile }) => {
  const [stats, setStats] = useState<PlatformStats>({ revenue: 0, totalOrders: 0, activeProducts: 0, totalUsers: 0, totalTickets: 0, totalDeliveries: 0 });
  const [escrowTotal, setEscrowTotal] = useState(0);
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [payoutMethod, setPayoutMethod] = useState<'WAVE' | 'OM' | 'MTN'>('WAVE');
  const [payoutPhone, setPayoutPhone] = useState('');
  const [payoutRequests, setPayoutRequests] = useState<any[]>([]);
  const [payoutMsg, setPayoutMsg] = useState<string | null>(null);
  const [refreshingEscrow, setRefreshingEscrow] = useState(false);

  useEffect(() => {
    fetchPlatformStats().then(setStats);
  }, []);

  useEffect(() => {
    if (userProfile?.id) {
      fetchPayoutRequests(userProfile.id).then(setPayoutRequests);
      fetchSellerEscrowTotal(userProfile.id).then(setEscrowTotal);
      setPayoutPhone(userProfile.phone || '');
    }
  }, [userProfile?.id]);

  const refreshEscrow = async () => {
    if (!userProfile?.id) return;
    setRefreshingEscrow(true);
    const total = await fetchSellerEscrowTotal(userProfile.id);
    setEscrowTotal(total);
    setRefreshingEscrow(false);
  };

  const handlePayoutRequest = async () => {
    if (!userProfile?.id) return;
    if (payoutAmount <= 0) {
      setPayoutMsg("Montant invalide.");
      return;
    }
    const balance = Number(userProfile.walletBalance || 0);
    if (payoutAmount > balance) {
      setPayoutMsg("Solde insuffisant.");
      return;
    }
    try {
      await updateWalletBalance(userProfile.id, -payoutAmount);
      await createWalletTransaction({
        userId: userProfile.id,
        type: 'PAYOUT_REQUEST',
        amount: -payoutAmount,
        status: 'PENDING',
        meta: { method: payoutMethod }
      });
      await createPayoutRequest({ sellerId: userProfile.id, amount: payoutAmount, method: payoutMethod, phone: payoutPhone });
      setPayoutMsg("Demande envoyée.");
      const refreshed = await fetchPayoutRequests(userProfile.id);
      setPayoutRequests(refreshed);
    } catch (e) {
      setPayoutMsg("Erreur lors de la demande.");
    }
  };

  return (
    <div className="p-4 md:p-4 md:p-8 animate-fade-in">
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <h2 className="text-3xl font-black text-[#0f172a] uppercase tracking-tight">Tableau de bord : {userProfile?.businessName}</h2>
        {userProfile?.cniStatus === 'VERIFIED' && (
          <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-full">
            CNI validée
          </span>
        )}
        {userProfile?.role !== 'BUYER' && userProfile?.cniStatus !== 'VERIFIED' && userProfile?.createdAt && (
          <span className="text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded-full">
            {Math.max(0, 30 - Math.floor((Date.now() - new Date(userProfile.createdAt).getTime()) / 86400000))} jours restants CNI
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 md:grid-cols-3 gap-4 md:gap-6 mb-10">
        <div className="bg-white p-4 md:p-8 rounded-none shadow-sm border border-gray-100 border-b-4 border-[#00A859]">
          <h3 className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Chiffre d'Affaires</h3>
          <p className="text-3xl font-black text-[#00A859]">{stats.revenue.toLocaleString()} <span className="text-sm font-medium">FCFA</span></p>
        </div>
        <div className="bg-white p-4 md:p-8 rounded-none shadow-sm border border-gray-100 border-b-4 border-[#00A859]">
          <h3 className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Ventes Totales</h3>
          <p className="text-3xl font-black text-[#0f172a]">{stats.totalOrders}</p>
        </div>
        <div className="bg-white p-4 md:p-8 rounded-none shadow-sm border border-gray-100 border-b-4 border-[#00A859]">
          <h3 className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Produits Actifs</h3>
          <p className="text-3xl font-black text-[#00A859]">{products.filter(p => p.supplier === 'Moi').length}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-none shadow-sm border border-gray-100">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Mon Solde Vendeur</h3>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-black text-[#00A859]">{Number(userProfile?.walletBalance || 0).toLocaleString()}</span>
            <span className="text-sm font-bold text-gray-400">FCFA</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-gray-400">En escrow: {escrowTotal.toLocaleString()} FCFA</p>
            <button
              onClick={refreshEscrow}
              className="text-[10px] font-black uppercase tracking-widest text-[#00A859] hover:opacity-80"
            >
              {refreshingEscrow ? 'Actualisation…' : 'Actualiser'}
            </button>
          </div>
          {userProfile?.role === 'PARTNER_ADMIN' && (
            <p className="text-xs text-gray-500 mb-4">Commission centrale: {(Number(userProfile?.commissionRate || 0.08) * 100).toFixed(0)}%</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="number"
              min={0}
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(Number(e.target.value))}
              placeholder="Montant"
              className="border border-gray-200 px-3 py-2 rounded-none text-xs font-bold"
            />
            <select
              value={payoutMethod}
              onChange={(e) => setPayoutMethod(e.target.value as any)}
              className="border border-gray-200 px-3 py-2 rounded-none text-xs font-bold"
            >
              <option value="WAVE">Wave</option>
              <option value="OM">Orange Money</option>
              <option value="MTN">MTN MoMo</option>
            </select>
            <input
              value={payoutPhone}
              onChange={(e) => setPayoutPhone(e.target.value)}
              placeholder="Téléphone"
              className="border border-gray-200 px-3 py-2 rounded-none text-xs font-bold"
            />
          </div>
          {payoutMsg && <p className="text-xs text-gray-500 mt-3">{payoutMsg}</p>}
          <button
            onClick={handlePayoutRequest}
            className="mt-4 w-full bg-[#00A859] text-white py-3 font-black uppercase text-xs rounded-none hover:bg-[#008F4A]"
          >
            Demander un retrait
          </button>
        </div>
        <div className="bg-white p-6 rounded-none shadow-sm border border-gray-100">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Historique retraits</h3>
          {payoutRequests.length === 0 ? (
            <p className="text-xs text-gray-400">Aucune demande.</p>
          ) : (
            <div className="space-y-2">
              {payoutRequests.slice(0, 5).map((r: any) => (
                <div key={r.id} className="flex justify-between text-xs font-bold border-b border-gray-100 pb-2">
                  <span>{Number(r.amount).toLocaleString()} FCFA • {r.method}</span>
                  <span className="text-gray-400">{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const GlobalStatsDashboard = () => {
  const [stats, setStats] = useState<PlatformStats>({ revenue: 0, totalOrders: 0, activeProducts: 0, totalUsers: 0, totalTickets: 0, totalDeliveries: 0 });

  useEffect(() => {
    fetchPlatformStats().then(setStats);
  }, []);

  return (
    <div className="p-4 md:p-4 md:p-8 animate-fade-in">
      <h1 className="text-3xl font-black uppercase tracking-tight mb-8">Statistiques Globales Ivoire Destock</h1>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-6">
        <div className="bg-white p-4 md:p-8 rounded-none shadow-sm border border-gray-100 border-b-4 border-[#00A859]">
          <h3 className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Chiffre d'Affaires</h3>
          <p className="text-3xl font-black text-[#00A859]">{stats.revenue.toLocaleString()} <span className="text-sm font-medium">FCFA</span></p>
        </div>
        <div className="bg-white p-4 md:p-8 rounded-none shadow-sm border border-gray-100 border-b-4 border-[#00A859]">
          <h3 className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Ventes Totales</h3>
          <p className="text-3xl font-black text-[#0f172a]">{stats.totalOrders}</p>
        </div>
        <div className="bg-white p-4 md:p-8 rounded-none shadow-sm border border-gray-100 border-b-4 border-[#00A859]">
          <h3 className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Produits Actifs</h3>
          <p className="text-3xl font-black text-[#00A859]">{stats.activeProducts}</p>
        </div>
        <div className="bg-white p-4 md:p-8 rounded-none shadow-sm border border-gray-100 border-b-4 border-[#00A859]">
          <h3 className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Utilisateurs</h3>
          <p className="text-3xl font-black text-[#00A859]">{stats.totalUsers}</p>
        </div>
        <div className="bg-white p-4 md:p-8 rounded-none shadow-sm border border-gray-100 border-b-4 border-[#00A859]">
          <h3 className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Tickets</h3>
          <p className="text-3xl font-black text-[#00A859]">{stats.totalTickets}</p>
        </div>
        <div className="bg-white p-4 md:p-8 rounded-none shadow-sm border border-gray-100 border-b-4 border-[#00A859]">
          <h3 className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Livraisons</h3>
          <p className="text-3xl font-black text-[#00A859]">{stats.totalDeliveries}</p>
        </div>
      </div>
    </div>
  );
};

const PayoutsAdminView = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [commissionRate, setCommissionRate] = useState(0.12);
  const [sellerId, setSellerId] = useState('');
  const [revenueSeries, setRevenueSeries] = useState<number[]>([]);
  const [payoutSeries, setPayoutSeries] = useState<number[]>([]);
  const [seriesLabels, setSeriesLabels] = useState<string[]>([]);

  useEffect(() => {
    fetchAllPayoutRequests().then(setRequests);
  }, []);

  useEffect(() => {
    const buildSeries = async () => {
      const orders = await supabase
        .from('orders')
        .select('created_at,total_amount,status')
        .gte('created_at', new Date(Date.now() - 6 * 86400000).toISOString());
      const payouts = await supabase
        .from('payout_requests')
        .select('created_at,amount,status')
        .gte('created_at', new Date(Date.now() - 6 * 86400000).toISOString());

      const days: string[] = [];
      const revenueMap: Record<string, number> = {};
      const payoutMap: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const key = d.toISOString().slice(0, 10);
        days.push(key.slice(5));
        revenueMap[key] = 0;
        payoutMap[key] = 0;
      }

      (orders.data || []).forEach((o: any) => {
        if (!['PAID', 'DELIVERED'].includes(o.status)) return;
        const key = String(o.created_at).slice(0, 10);
        if (revenueMap[key] !== undefined) revenueMap[key] += Number(o.total_amount || 0);
      });
      (payouts.data || []).forEach((p: any) => {
        if (p.status !== 'COMPLETED') return;
        const key = String(p.created_at).slice(0, 10);
        if (payoutMap[key] !== undefined) payoutMap[key] += Number(p.amount || 0);
      });

      setSeriesLabels(days);
      setRevenueSeries(Object.keys(revenueMap).sort().map(k => revenueMap[k]));
      setPayoutSeries(Object.keys(payoutMap).sort().map(k => payoutMap[k]));
    };
    buildSeries();
  }, []);

  const refresh = async () => {
    const data = await fetchAllPayoutRequests();
    setRequests(data);
  };

  const approve = async (r: any) => {
    await updatePayoutRequestStatus(r.id, 'COMPLETED');
    setMsg('Retrait validé (traitement manuel externe requis).');
    refresh();
  };

  const reject = async (r: any) => {
    await updatePayoutRequestStatus(r.id, 'REJECTED');
    if (r.seller_id && r.amount) {
      await updateWalletBalance(r.seller_id, Number(r.amount));
      await createWalletTransaction({
        userId: r.seller_id,
        type: 'PAYOUT_REFUND',
        amount: Number(r.amount),
        status: 'COMPLETED',
        meta: { payoutId: r.id }
      });
    }
    setMsg('Retrait rejeté et solde rétabli.');
    refresh();
  };

  const updateCommission = async () => {
    if (!sellerId || commissionRate < 0 || commissionRate > 1) {
      setMsg('Commission invalide.');
      return;
    }
    await updateSellerCommissionRate(sellerId, commissionRate);
    setMsg('Commission mise à jour.');
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <h1 className="text-2xl font-black uppercase tracking-tight">Validation des retraits</h1>
      {msg && <div className="text-xs text-gray-500">{msg}</div>}
      <div className="bg-white p-6 border border-gray-200 rounded-none">
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Commission centrale</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={sellerId}
            onChange={(e) => setSellerId(e.target.value)}
            placeholder="Seller ID"
            className="border border-gray-200 px-3 py-2 rounded-none text-xs font-bold"
          />
          <input
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={commissionRate}
            onChange={(e) => setCommissionRate(Number(e.target.value))}
            className="border border-gray-200 px-3 py-2 rounded-none text-xs font-bold"
          />
          <button onClick={updateCommission} className="bg-[#00A859] text-white px-4 py-2 rounded-none text-xs font-black uppercase">
            Mettre à jour
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-2">Ex: 0.08 = 8% (centrale), 0.12 = 12% (vendeur)</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 border border-gray-200 rounded-none">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Entrées (7 jours)</h3>
          <SimpleBarChart data={revenueSeries.length ? revenueSeries : [0]} />
          <div className="flex justify-between text-[10px] text-gray-400 mt-2">
            {seriesLabels.map((d) => <span key={d}>{d}</span>)}
          </div>
        </div>
        <div className="bg-white p-6 border border-gray-200 rounded-none">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Retraits (7 jours)</h3>
          <SimpleBarChart data={payoutSeries.length ? payoutSeries : [0]} color="#ef4444" />
          <div className="flex justify-between text-[10px] text-gray-400 mt-2">
            {seriesLabels.map((d) => <span key={d}>{d}</span>)}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-none border border-gray-200 overflow-x-auto shadow-sm">
        <table className="w-full min-w-[720px] text-left text-xs md:text-sm">
          <thead className="bg-gray-50 text-xs font-black uppercase text-gray-400 border-b">
            <tr>
              <th className="p-6">ID</th>
              <th className="p-6">Vendeur</th>
              <th className="p-6">Montant</th>
              <th className="p-6">Méthode</th>
              <th className="p-6">Statut</th>
              <th className="p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {requests.map((r) => (
              <tr key={r.id}>
                <td className="p-6 font-mono text-xs">{r.id.slice(0, 8).toUpperCase()}</td>
                <td className="p-6 text-xs font-bold">{r.seller_id?.slice(0, 8).toUpperCase()}</td>
                <td className="p-6 font-black">{Number(r.amount).toLocaleString()} FCFA</td>
                <td className="p-6 text-xs font-bold uppercase">{r.method}</td>
                <td className="p-6 text-xs font-bold uppercase">{r.status}</td>
                <td className="p-6 text-right space-x-2">
                  {r.status === 'PENDING' && (
                    <>
                      <button onClick={() => approve(r)} className="text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-none text-xs font-black uppercase border border-emerald-100">Valider</button>
                      <button onClick={() => reject(r)} className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-none text-xs font-black uppercase border border-red-100">Rejeter</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-xs text-gray-400">Aucune demande.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const OrdersManagerView = ({ sellerId, actorId }: { sellerId?: string; actorId?: string }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [itemStatuses, setItemStatuses] = useState<Record<string, OrderItemStatus[]>>({});
  const [statusFilter, setStatusFilter] = useState<'ALL' | Order['status']>('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [newItemStatus, setNewItemStatus] = useState<Record<string, string>>({});
  const [newItemNote, setNewItemNote] = useState<Record<string, string>>({});

  useEffect(() => {
    if (sellerId) {
      fetchOrdersBySeller(sellerId).then(setOrders);
    } else {
      fetchAllOrders().then(setOrders);
    }
  }, [sellerId]);

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const created = new Date(o.created_at).getTime();
    const fromOk = !fromDate || created >= new Date(fromDate).getTime();
    const toOk = !toDate || created <= new Date(toDate).getTime() + 24 * 60 * 60 * 1000;
    return matchesStatus && fromOk && toOk;
  });

  const toggleOrderDetails = async (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    if (!orderItems[orderId]) {
      const items = await fetchOrderItemsByOrder(orderId);
      setOrderItems(prev => ({ ...prev, [orderId]: items }));
      const statuses = await Promise.all(items.map(i => fetchOrderItemStatusHistory(i.id)));
      const statusMap: Record<string, OrderItemStatus[]> = {};
      items.forEach((i, idx) => { statusMap[i.id] = statuses[idx] || []; });
      setItemStatuses(prev => ({ ...prev, ...statusMap }));
    }
  };

  const addOrderItemStatus = async (orderItemId: string) => {
    const status = newItemStatus[orderItemId]?.trim();
    if (!status) return;
    await createOrderItemStatus(orderItemId, status, newItemNote[orderItemId], actorId);
    const refreshed = await fetchOrderItemStatusHistory(orderItemId);
    setItemStatuses(prev => ({ ...prev, [orderItemId]: refreshed }));
    setNewItemStatus(prev => ({ ...prev, [orderItemId]: '' }));
    setNewItemNote(prev => ({ ...prev, [orderItemId]: '' }));
  };

  const markDelivered = async (orderId: string) => {
    await updateOrderStatusAndPayout(orderId, 'DELIVERED', actorId);
    if (sellerId) {
      fetchOrdersBySeller(sellerId).then(setOrders);
    } else {
      fetchAllOrders().then(setOrders);
    }
  };

  return (
    <div className="p-4 md:p-4 md:p-8 animate-fade-in space-y-6">
      <h1 className="text-2xl font-black uppercase tracking-tight">Gestion des Commandes Entrantes</h1>
      <div className="bg-white p-4 rounded-none border border-gray-200 shadow-sm flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-black uppercase text-gray-400 mb-1">Statut</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="border border-gray-200 px-3 py-2 rounded-none text-xs font-bold uppercase">
            <option value="ALL">Tous</option>
            <option value="PENDING">En attente</option>
            <option value="PAID">Payé</option>
            <option value="DELIVERED">Livré</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-gray-400 mb-1">Du</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border border-gray-200 px-3 py-2 rounded-none text-xs font-bold" />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-gray-400 mb-1">Au</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border border-gray-200 px-3 py-2 rounded-none text-xs font-bold" />
        </div>
      </div>
      <div className="bg-white rounded-none border border-gray-200 overflow-x-auto shadow-sm">
        <table className="w-full min-w-[720px] text-left text-xs md:text-sm">
          <thead className="bg-gray-50 text-xs font-black uppercase text-gray-400 border-b">
            <tr><th className="p-6">ID</th><th className="p-6">Montant</th><th className="p-6">Statut</th><th className="p-6">Paiement</th><th className="p-6">Date</th><th className="p-6 text-right">Détails</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredOrders.map(o => (
              <React.Fragment key={o.id}>
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-6 font-mono text-xs text-[#064e3b]">{o.id.slice(0, 8).toUpperCase()}</td>
                  <td className="p-6 font-black">{o.total_amount.toLocaleString()} FCFA</td>
                  <td className="p-6 text-xs font-black uppercase">{o.status}</td>
                  <td className="p-6 text-xs font-black uppercase">{o.payment_method}</td>
                  <td className="p-6 text-xs font-bold text-gray-400">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="p-6 text-right space-x-2">
                    {o.status === 'PAID' && (
                      <button
                        onClick={() => markDelivered(o.id)}
                        className="text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-none text-xs font-black uppercase border border-emerald-100"
                      >
                        Livré
                      </button>
                    )}
                    <button onClick={() => toggleOrderDetails(o.id)} className="text-[#00A859] hover:bg-emerald-50 px-3 py-1.5 rounded-none text-xs font-black uppercase border border-emerald-100">
                      {expandedOrderId === o.id ? 'Masquer' : 'Voir'}
                    </button>
                  </td>
                </tr>
                {expandedOrderId === o.id && (
                  <tr className="bg-gray-50/50">
                    <td colSpan={6} className="p-6">
                      <div className="space-y-4">
                        <p className="text-xs font-black uppercase text-gray-400">Articles de la commande</p>
                        <div className="space-y-3">
                          {(orderItems[o.id] || []).map(item => (
                            <div key={item.id} className="bg-white border border-gray-200 rounded-none p-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-sm font-black text-[#0f172a] uppercase">{item.product_name || item.product_id}</p>
                                  <p className="text-xs text-gray-500 font-bold uppercase">Qté: {item.quantity} • Prix: {item.price.toLocaleString()} FCFA</p>
                                </div>
                                <span className="text-xs font-black uppercase text-gray-400">ID: {item.id.slice(0, 8).toUpperCase()}</span>
                              </div>
                              <div className="mt-3">
                                <p className="text-xs font-black uppercase text-gray-400 mb-2">Historique statut</p>
                                <div className="space-y-1">
                                  {(itemStatuses[item.id] || []).length === 0 ? (
                                    <p className="text-xs text-gray-400">Aucun statut enregistré.</p>
                                  ) : (
                                    itemStatuses[item.id].map(s => (
                                      <div key={s.id} className="flex justify-between text-xs text-gray-600">
                                        <span className="font-bold uppercase">{s.status}{s.note ? ` — ${s.note}` : ''}</span>
                                        <span>{new Date(s.created_at).toLocaleString()}</span>
                                      </div>
                                    ))
                                  )}
                                </div>
                                <div className="mt-3 flex flex-col md:flex-row gap-3">
                                  <input
                                    value={newItemStatus[item.id] || ''}
                                    onChange={(e) => setNewItemStatus(prev => ({ ...prev, [item.id]: e.target.value }))}
                                    placeholder="Nouveau statut (ex: DELIVERED)"
                                    className="flex-1 border border-gray-200 px-3 py-2 rounded-none text-xs font-bold uppercase"
                                  />
                                  <input
                                    value={newItemNote[item.id] || ''}
                                    onChange={(e) => setNewItemNote(prev => ({ ...prev, [item.id]: e.target.value }))}
                                    placeholder="Note (optionnel)"
                                    className="flex-1 border border-gray-200 px-3 py-2 rounded-none text-xs"
                                  />
                                  <button onClick={() => addOrderItemStatus(item.id)} className="bg-[#00A859] text-white px-4 py-2 rounded-none text-xs font-black uppercase">
                                    Ajouter
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                          {(orderItems[o.id] || []).length === 0 && (
                            <p className="text-xs text-gray-400">Aucun article trouvé pour cette commande.</p>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface DashboardProps {
  products: Product[];
  role: UserRole;
  userProfile?: UserProfile;
  activeTab?: string;
  onRecharge?: (amount: number) => void;
  onLogout?: () => void;
  buyerSection?: 'dashboard' | 'messages';
  onBuyerSectionChange?: (section: 'dashboard' | 'messages') => void;
  initialChatSellerId?: string | null;
}

const Dashboard: React.FC<DashboardProps> = ({
  products,
  role,
  userProfile,
  activeTab,
  onRecharge,
  onLogout,
  buyerSection = 'dashboard',
  onBuyerSectionChange,
  initialChatSellerId
}) => {
  if (role === 'BUYER') {
    if (buyerSection === 'messages') {
      return (
        <div className="max-w-7xl mx-auto min-h-screen pb-12 px-4 md:px-0">
          <div className="p-4 md:p-8">
            <button
              onClick={() => onBuyerSectionChange?.('dashboard')}
              className="text-[#00A859] hover:bg-emerald-50 px-4 py-2 rounded-none font-black text-xs uppercase border border-emerald-100"
            >
              Retour à mon espace
            </button>
          </div>
          <B2BMessagesView
            currentUserId={userProfile?.id}
            currentUserName={userProfile?.name}
            currentUserRole="BUYER"
            initialContactId={initialChatSellerId}
          />
        </div>
      );
    }
    return <BuyerDashboard products={products} userProfile={userProfile} onRecharge={onRecharge} onLogout={onLogout} />;
  }

  const renderAdminContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return role === 'SUPER_ADMIN' ? <GlobalStatsDashboard /> : <StoreStatsDashboard products={products} userProfile={userProfile} />;
      case 'products':
        if (role === 'SUPER_ADMIN') {
          return <AllProductsView products={products} />;
        }
        if (userProfile && (role === 'STORE_ADMIN' || role === 'PARTNER_ADMIN')) {
          return <ProductsManagerView userProfile={userProfile} />;
        }
        return (
          <div className="p-8 text-gray-500">
            Aucun profil vendeur configuré. Veuillez compléter vos paramètres.
          </div>
        );

      case 'orders': return <OrdersManagerView sellerId={role === 'SUPER_ADMIN' ? undefined : userProfile?.id} actorId={userProfile?.id} />;
      case 'messages': return <B2BMessagesView currentUserId={userProfile?.id} currentUserName={userProfile?.name} currentUserRole={role} />;
      case 'deliveries': return <DeliveryTrackingView sellerId={role === 'SUPER_ADMIN' ? undefined : userProfile?.id} actorId={userProfile?.id} />;
      case 'logistics': return <DeliveryTrackingView sellerId={role === 'SUPER_ADMIN' ? undefined : userProfile?.id} actorId={userProfile?.id} />;
      case 'history': return <OrdersManagerView sellerId={role === 'SUPER_ADMIN' ? undefined : userProfile?.id} actorId={userProfile?.id} />;
      case 'tickets': return <TicketsManagerView />;
      case 'payouts': return role === 'SUPER_ADMIN' ? <PayoutsAdminView /> : <div className="p-8 text-red-500">Accès Refusé.</div>;
      case 'admin-create': return role === 'SUPER_ADMIN' ? <AdminCreateView /> : <div className="p-8 text-red-500">Accès Refusé.</div>;
      case 'users': return role === 'SUPER_ADMIN' ? <UsersManagerView /> : <div className="p-8 text-red-500">Accès Refusé.</div>;
      case 'audit': return role === 'SUPER_ADMIN' ? <AuditLogsView /> : <div className="p-8 text-red-500">Accès Refusé.</div>;
      case 'vendor-stock': return role === 'SUPER_ADMIN' ? <VendorStockView /> : <div className="p-8 text-red-500">Accès Refusé.</div>;
      case 'vendor-benefits': return role === 'SUPER_ADMIN' ? <VendorBenefitsView /> : <div className="p-8 text-red-500">Accès Refusé.</div>;
      case 'vendor-products': return role === 'SUPER_ADMIN' ? <VendorProductsView /> : <div className="p-8 text-red-500">Accès Refusé.</div>;
      case 'settings': return <SettingsView userProfile={userProfile} />;

      default: return <StoreStatsDashboard products={products} userProfile={userProfile} />;
    }
  };

  return <div className="max-w-7xl mx-auto min-h-screen pb-12 px-4 md:px-0">{renderAdminContent()}</div>;
};

export default Dashboard;