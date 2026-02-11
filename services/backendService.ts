import { supabase } from './supabaseClient';
import { Product, FeedbackTicket, UserRole, UserProfile, Order, Review, B2BThread, B2BMessage, Delivery, PlatformStats, OrderItem, OrderItemStatus, DeliveryEvent, WalletTransaction, PayoutRequest } from '../types';

/**
 * SERVICE BACKEND CENTRALISÉ (PRODUCTION)
 * Gère les interactions avec la base de données Supabase
 */

// --- AVIS PRODUITS ---

const fetchReviewStats = async (productIds: string[]): Promise<Record<string, { rating: number; reviewCount: number }>> => {
  if (productIds.length === 0) return {};
  const { data, error } = await supabase
    .from('reviews')
    .select('product_id, rating')
    .in('product_id', productIds);

  if (error || !data) {
    console.error('Error fetching review stats:', error);
    return {};
  }

  const stats: Record<string, { rating: number; reviewCount: number; total: number }> = {};
  data.forEach((r: any) => {
    if (!stats[r.product_id]) {
      stats[r.product_id] = { rating: 0, reviewCount: 0, total: 0 };
    }
    stats[r.product_id].total += Number(r.rating);
    stats[r.product_id].reviewCount += 1;
  });

  Object.keys(stats).forEach((id) => {
    stats[id].rating = stats[id].total / stats[id].reviewCount;
  });

  const result: Record<string, { rating: number; reviewCount: number }> = {};
  Object.keys(stats).forEach((id) => {
    result[id] = { rating: stats[id].rating, reviewCount: stats[id].reviewCount };
  });
  return result;
};

// --- IMAGES (STORAGE) ---

export const uploadProductImage = async (file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage.from('products').getPublicUrl(filePath);
    return data.publicUrl;

  } catch (error) {
    console.error('Upload failed:', error);
    return null;
  }
};

// --- PRODUITS (CRUD) ---

export const fetchProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      profiles:supplier_id (
        full_name
      )
    `); 
    // Correction : Suppression du filtre is_deleted qui n'existe pas dans votre DB

  if (error) {
    if (error.code === 'PGRST200') {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('products')
        .select('*');
      if (fallbackError || !fallbackData) {
        console.error('Error fetching products:', fallbackError);
        return [];
      }
      const reviewStats = await fetchReviewStats(fallbackData.map((item: any) => item.id));
      return fallbackData.map((item: any) => ({
        id: item.id,
        supplierId: item.supplier_id,
        name: item.name,
        category: item.category,
        price: Number(item.price),
        originalPrice: Number(item.original_price),
        stock: Number(item.stock),
        status: item.status,
        expiryDate: item.expiry_date,
        location: item.location || 'Abidjan',
        image: item.image_url,
        description: item.description,
        supplier: 'Vendeur Certifié',
        reviews: [],
        rating: reviewStats[item.id]?.rating || 0,
        reviewCount: reviewStats[item.id]?.reviewCount || 0
      }));
    }
    console.error('Error fetching products:', error);
    return [];
  }

  const reviewStats = await fetchReviewStats(data.map((item: any) => item.id));

  return data.map((item: any) => ({
    id: item.id,
    supplierId: item.supplier_id,
    name: item.name,
    category: item.category,
    price: Number(item.price),
    originalPrice: Number(item.original_price),
    stock: Number(item.stock),
    status: item.status,
    expiryDate: item.expiry_date,
    location: item.location || 'Abidjan',
    image: item.image_url, // Correction : image_url correspond à votre capture d'écran
    description: item.description,
    supplier: item.profiles?.full_name || 'Vendeur Certifié',
    reviews: [],
    rating: reviewStats[item.id]?.rating || 0,
    reviewCount: reviewStats[item.id]?.reviewCount || 0
  }));
};

export const fetchVendorProducts = async (userId: string): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('supplier_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching vendor products:', error);
    return [];
  }

  const reviewStats = await fetchReviewStats(data.map((item: any) => item.id));

  return data.map((item: any) => ({
    id: item.id,
    supplierId: item.supplier_id,
    name: item.name,
    category: item.category,
    price: Number(item.price),
    originalPrice: Number(item.original_price),
    stock: Number(item.stock),
    status: item.status,
    expiryDate: item.expiry_date,
    location: item.location || 'Abidjan',
    image: item.image_url, // Correction : image_url
    description: item.description,
    supplier: 'Moi',
    reviews: [],
    rating: reviewStats[item.id]?.rating || 0,
    reviewCount: reviewStats[item.id]?.reviewCount || 0
  }));
};

export const createProduct = async (product: Omit<Product, 'id' | 'supplier' | 'reviews'>, userId: string) => {
  const dbProduct = {
    name: product.name,
    category: product.category,
    price: product.price,
    original_price: product.originalPrice,
    stock: product.stock,
    status: product.status,
    expiry_date: product.expiryDate,
    location: product.location,
    image_url: product.image, // Correction : nom de colonne DB image_url
    description: product.description,
    supplier_id: userId,
  };

  const { data, error } = await supabase
    .from('products')
    .insert([dbProduct])
    .select()
    .single();

  if (!error && data) {
    await createAuditLog({
      actor_id: userId,
      action: 'PRODUCT_CREATE',
      entity: 'products',
      entity_id: data.id,
      details: { name: product.name }
    });
  }

  return { data, error };
};

export const updateProduct = async (id: string, product: Partial<Product>, actorId?: string) => {
  const dbUpdates: any = {};
  if (product.name) dbUpdates.name = product.name;
  if (product.category) dbUpdates.category = product.category;
  if (product.price) dbUpdates.price = product.price;
  if (product.originalPrice) dbUpdates.original_price = product.originalPrice;
  if (product.stock) dbUpdates.stock = product.stock;
  if (product.status) dbUpdates.status = product.status;
  if (product.expiryDate) dbUpdates.expiry_date = product.expiryDate;
  if (product.location) dbUpdates.location = product.location;
  if (product.image) dbUpdates.image_url = product.image; // Correction : image_url
  if (product.description) dbUpdates.description = product.description;

  const { data, error } = await supabase
    .from('products')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (!error && data && actorId) {
    await createAuditLog({
      actor_id: actorId,
      action: 'PRODUCT_UPDATE',
      entity: 'products',
      entity_id: id,
      details: { updates: dbUpdates }
    });
  }

  return { data, error };
};

export const deleteProduct = async (id: string, actorId?: string) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (!error && actorId) {
    await createAuditLog({
      actor_id: actorId,
      action: 'PRODUCT_DELETE',
      entity: 'products',
      entity_id: id
    });
  }

  return { error };
};

export const fetchProductReviews = async (productId: string): Promise<Review[]> => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Error fetching reviews:', error);
    return [];
  }

  return data.map((r: any) => ({
    id: r.id,
    userName: r.user_name || 'Client',
    rating: Number(r.rating),
    comment: r.comment || '',
    date: new Date(r.created_at).toLocaleDateString()
  }));
};

export const createReview = async (productId: string, rating: number, comment: string, userId?: string, userName?: string) => {
  const { data, error } = await supabase
    .from('reviews')
    .insert([{
      product_id: productId,
      user_id: userId || null,
      user_name: userName || null,
      rating,
      comment
    }])
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST205') return null;
    throw error;
  }
  return data;
};

// --- COMMANDES (ORDERS) ---

const COMMISSION_RATE_DEFAULT = 0.12;
const COMMISSION_RATE_PARTNER_DEFAULT = 0.08;

export const createOrder = async (
  userId: string,
  totalAmount: number,
  paymentMethod: string,
  sellerId?: string,
  meta?: {
    status?: Order['status'];
    payoutStatus?: 'PENDING' | 'ESCROW' | 'PAID';
    escrowAmount?: number;
    sellerAmount?: number;
    commissionAmount?: number;
    paymentRef?: string;
  }
) => {
  const { data, error } = await supabase
    .from('orders')
    .insert([
      {
        buyer_id: userId,
        total_amount: totalAmount,
        status: meta?.status || (paymentMethod === 'WALLET' ? 'PAID' : 'PENDING'),
        payment_method: paymentMethod,
        seller_id: sellerId || null,
        payout_status: meta?.payoutStatus || 'PENDING',
        escrow_amount: meta?.escrowAmount || 0,
        seller_amount: meta?.sellerAmount || 0,
        commission_amount: meta?.commissionAmount || 0,
        payment_ref: meta?.paymentRef || null
      }
    ])
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST205') return null;
    throw error;
  }
  return data;
};

export const createOrderWithItems = async (
  userId: string,
  totalAmount: number,
  paymentMethod: string,
  items: Array<{ productId: string; quantity: number; price: number; sellerId?: string }>,
  paymentRef?: string
) => {
  const order = await createOrder(userId, totalAmount, paymentMethod, items[0]?.sellerId, { paymentRef });

  if (items.length > 0) {
    const orderItems = items.map((i) => ({
      order_id: order.id,
      product_id: i.productId,
      quantity: i.quantity,
      price: i.price,
      seller_id: i.sellerId || null
    }));
    const { error } = await supabase.from('order_items').insert(orderItems);
    if (error && error.code !== 'PGRST205') throw error;
  }

  await createAuditLog({
    actor_id: userId,
    action: 'ORDER_CREATE',
    entity: 'orders',
    entity_id: order.id,
    details: { totalAmount, paymentMethod, items: items.length }
  });

  return order;
};

export const createOrdersBySeller = async (
  userId: string,
  paymentMethod: string,
  items: Array<{ productId: string; quantity: number; price: number; sellerId?: string }>,
  options?: { status?: Order['status']; paymentRef?: string; commissionRate?: number }
) => {
  const status = options?.status || (paymentMethod === 'WALLET' ? 'PAID' : 'PENDING');
  const commissionRate = options?.commissionRate ?? COMMISSION_RATE_DEFAULT;
  const paymentRef = options?.paymentRef || null;

  const groups: Record<string, Array<{ productId: string; quantity: number; price: number; sellerId?: string }>> = {};
  items.forEach((i) => {
    const sellerKey = i.sellerId || 'UNKNOWN';
    if (!groups[sellerKey]) groups[sellerKey] = [];
    groups[sellerKey].push(i);
  });

  const createdOrders: Order[] = [];
  for (const [sellerKey, sellerItems] of Object.entries(groups)) {
    const sellerRate = sellerKey === 'UNKNOWN' ? commissionRate : await fetchSellerCommissionRate(sellerKey);
    const totalAmount = sellerItems.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0);
    const commissionAmount = Math.round(totalAmount * sellerRate);
    const sellerAmount = Math.max(0, totalAmount - commissionAmount);
    const payoutStatus = status === 'PAID' ? 'ESCROW' : 'PENDING';
    const escrowAmount = status === 'PAID' ? sellerAmount : 0;

    const order = await createOrder(userId, totalAmount, paymentMethod, sellerKey === 'UNKNOWN' ? undefined : sellerKey, {
      status,
      payoutStatus,
      escrowAmount,
      sellerAmount,
      commissionAmount,
      paymentRef: paymentRef || undefined
    });

    if (sellerItems.length > 0) {
      const orderItems = sellerItems.map((i) => ({
        order_id: order.id,
        product_id: i.productId,
        quantity: i.quantity,
        price: i.price,
        seller_id: i.sellerId || null
      }));
      const { error } = await supabase.from('order_items').insert(orderItems);
      if (error && error.code !== 'PGRST205') throw error;
    }

    await createAuditLog({
      actor_id: userId,
      action: 'ORDER_CREATE',
      entity: 'orders',
      entity_id: order.id,
      details: { totalAmount, paymentMethod, items: sellerItems.length, paymentRef: paymentRef || null }
    });

    createdOrders.push(order);
  }
  return createdOrders;
};

export const fetchMyOrders = async (userId: string): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('buyer_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
  return data as Order[];
};

export const fetchAllOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }

  return data as Order[];
};

export const fetchOrdersBySeller = async (sellerId: string): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('order_items')
    .select('order_id, orders:order_id(*)')
    .eq('seller_id', sellerId);

  if (error) {
    if (error.code === 'PGRST205') return [];
    console.error('Error fetching seller orders:', error);
    return [];
  }
  if (!data) return [];

  const unique: Record<string, Order> = {};
  data.forEach((row: any) => {
    if (row.orders && !unique[row.orders.id]) {
      unique[row.orders.id] = row.orders as Order;
    }
  });

  return Object.values(unique);
};

export const fetchOrderItemsByOrder = async (orderId: string): Promise<OrderItem[]> => {
  const { data, error } = await supabase
    .from('order_items')
    .select('*, products:product_id(name)')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (error) {
    if (error.code === 'PGRST205') return [];
    console.error('Error fetching order items:', error);
    return [];
  }
  if (!data) return [];

  return data.map((item: any) => ({
    id: item.id,
    order_id: item.order_id,
    product_id: item.product_id,
    seller_id: item.seller_id,
    quantity: Number(item.quantity),
    price: Number(item.price),
    created_at: item.created_at,
    product_name: item.products?.name
  })) as OrderItem[];
};

export const fetchOrderItemStatusHistory = async (orderItemId: string): Promise<OrderItemStatus[]> => {
  const { data, error } = await supabase
    .from('order_item_status')
    .select('*')
    .eq('order_item_id', orderItemId)
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === 'PGRST205') return [];
    console.error('Error fetching order item status:', error);
    return [];
  }
  if (!data) return [];

  return data.map((s: any) => ({
    id: s.id,
    order_item_id: s.order_item_id,
    status: s.status,
    note: s.note || undefined,
    created_at: s.created_at
  })) as OrderItemStatus[];
};

export const updateOrderStatus = async (orderId: string, status: Order['status']) => {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  if (error) throw error;
};

export const updateOrderStatusAndPayout = async (orderId: string, status: Order['status'], actorId?: string) => {
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, status, seller_id, payout_status, seller_amount')
    .eq('id', orderId)
    .single();
  if (fetchError) throw fetchError;

  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);
  if (error) throw error;

  if (status === 'DELIVERED' && order?.seller_id && order?.payout_status !== 'PAID') {
    const amount = Number(order.seller_amount || 0);
    if (amount > 0) {
      await updateWalletBalance(order.seller_id, amount);
      await createWalletTransaction({
        userId: order.seller_id,
        type: 'PAYOUT',
        amount,
        status: 'COMPLETED',
        referenceId: orderId,
        meta: { reason: 'ORDER_DELIVERED' }
      });
    }
    await supabase.from('orders').update({ payout_status: 'PAID' }).eq('id', orderId);
  }

  if (actorId) {
    await createAuditLog({
      actor_id: actorId,
      action: 'ORDER_STATUS_UPDATE',
      entity: 'orders',
      entity_id: orderId,
      details: { status }
    });
  }
};

// --- WALLET / PROFIL ---

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) return null;

  return {
    id: data.id,
    name: data.full_name, // Correction : Utilise full_name de votre DB
    email: data.email,
    phone: data.phone,
    role: data.role as UserRole,
    walletBalance: Number(data.wallet_balance),
    commissionRate: data.commission_rate,
    cniStatus: data.cni_status || null,
    cniRectoUrl: data.cni_recto_url || null,
    cniVersoUrl: data.cni_verso_url || null,
    createdAt: data.created_at,
    businessName: data.business_name,
    location: data.location,
    avatar: data.avatar
  };
};

export const fetchSellerCommissionRate = async (sellerId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('commission_rate, role')
    .eq('id', sellerId)
    .single();
  if (error) return COMMISSION_RATE_DEFAULT;
  const rate = Number(data.commission_rate);
  const fallback = data.role === 'PARTNER_ADMIN' ? COMMISSION_RATE_PARTNER_DEFAULT : COMMISSION_RATE_DEFAULT;
  if (Number.isNaN(rate) || rate < 0 || rate > 1) return fallback;
  return rate;
};

export const updateSellerCommissionRate = async (sellerId: string, rate: number) => {
  const { error } = await supabase
    .from('profiles')
    .update({ commission_rate: rate })
    .eq('id', sellerId);
  if (error) throw error;
};

export const updateWalletBalance = async (userId: string, amountToAdd: number) => {
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('wallet_balance')
    .eq('id', userId)
    .single();

  if (fetchError) throw fetchError;

  const newBalance = Number(profile.wallet_balance) + amountToAdd;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ wallet_balance: newBalance })
    .eq('id', userId);

  if (updateError) throw updateError;
  return newBalance;
};

export const createWalletTransaction = async (payload: {
  userId: string;
  type: string;
  amount: number;
  status?: string;
  referenceId?: string;
  paymentRef?: string;
  meta?: any;
}) => {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .insert([{
      user_id: payload.userId,
      type: payload.type,
      amount: payload.amount,
      status: payload.status || 'PENDING',
      reference_id: payload.referenceId || null,
      payment_ref: payload.paymentRef || null,
      meta: payload.meta || null
    }])
    .select()
    .single();
  if (error) throw error;
  return data as WalletTransaction;
};

export const fetchWalletTransactions = async (userId: string): Promise<WalletTransaction[]> => {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []) as WalletTransaction[];
};

export const createPayoutRequest = async (payload: { sellerId: string; amount: number; method: string; phone?: string }) => {
  const { data, error } = await supabase
    .from('payout_requests')
    .insert([{
      seller_id: payload.sellerId,
      amount: payload.amount,
      method: payload.method,
      phone: payload.phone || null,
      status: 'PENDING'
    }])
    .select()
    .single();
  if (error) throw error;
  return data as PayoutRequest;
};

export const fetchPayoutRequests = async (sellerId: string): Promise<PayoutRequest[]> => {
  const { data, error } = await supabase
    .from('payout_requests')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []) as PayoutRequest[];
};

export const fetchAllPayoutRequests = async (): Promise<PayoutRequest[]> => {
  const { data, error } = await supabase
    .from('payout_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []) as PayoutRequest[];
};

export const updatePayoutRequestStatus = async (id: string, status: string) => {
  const { error } = await supabase
    .from('payout_requests')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
};

export const fetchSellerEscrowTotal = async (sellerId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('orders')
    .select('escrow_amount, payout_status')
    .eq('seller_id', sellerId)
    .eq('payout_status', 'ESCROW');
  if (error || !data) return 0;
  return data.reduce((sum: number, o: any) => sum + Number(o.escrow_amount || 0), 0);
};

// --- TICKETS ---

export const createTicket = async (ticket: Omit<FeedbackTicket, 'id' | 'date'>) => {
  const { data, error } = await supabase
    .from('tickets')
    .insert([{
      user_id: ticket.userId,
      user_role: ticket.userRole,
      type: ticket.type,
      subject: ticket.subject,
      description: ticket.description,
      status: 'PENDING'
    }]);
  
  return { data, error };
};

export const fetchTickets = async () => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) return [];
  
  return data.map((t: any) => ({
    id: t.id,
    userId: t.user_id,
    userRole: t.user_role,
    type: t.type,
    subject: t.subject,
    description: t.description,
    status: t.status,
    date: new Date(t.created_at).toLocaleDateString()
  })) as FeedbackTicket[];
};

export const updateTicketStatus = async (ticketId: string, status: FeedbackTicket['status'], actorId?: string) => {
  const { error } = await supabase
    .from('tickets')
    .update({ status })
    .eq('id', ticketId);

  if (error) throw error;

  if (actorId) {
    await createAuditLog({
      actor_id: actorId,
      action: 'TICKET_STATUS_UPDATE',
      entity: 'tickets',
      entity_id: ticketId,
      details: { status }
    });
  }
};

// --- MESSAGERIE B2B ---

export const fetchB2BThreads = async (userId?: string): Promise<B2BThread[]> => {
  let query = supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.or(`seller_id.eq.${userId},buyer_id.eq.${userId}`);
  }

  const { data, error } = await query;

  if (error) {
    if (error.code === '42703') {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (fallbackError || !fallbackData) {
        console.error('Error fetching messages:', fallbackError);
        return [];
      }
      return buildThreadsFromMessages(fallbackData);
    }
    console.error('Error fetching messages:', error);
    return [];
  }
  if (!data) return [];

  return buildThreadsFromMessages(data);
};

const buildThreadsFromMessages = (data: any[]): B2BThread[] => {
  const threadsMap: Record<string, B2BThread> = {};
  data.forEach((m: any) => {
    const threadId = m.thread_id || m.id;
    if (!threadsMap[threadId]) {
      threadsMap[threadId] = {
        id: threadId,
        subject: m.subject || 'Discussion',
        fromName: m.from_name || 'Client',
        preview: m.body || '',
        date: new Date(m.created_at).toLocaleDateString(),
        status: m.status || 'READ'
      };
    }
  });
  return Object.values(threadsMap);
};

export const fetchB2BMessages = async (threadId: string): Promise<B2BMessage[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  if (error || !data) {
    console.error('Error fetching thread messages:', error);
    return [];
  }

  return data.map((m: any) => ({
    id: m.id,
    threadId: m.thread_id,
    fromName: m.from_name || 'Client',
    body: m.body || '',
    createdAt: new Date(m.created_at).toLocaleString()
  })) as B2BMessage[];
};

export const sendB2BMessage = async (threadId: string, body: string, fromId?: string, fromName?: string, subject?: string, sellerId?: string, buyerId?: string) => {
  const payload: any = {
    thread_id: threadId,
    from_id: fromId || null,
    from_name: fromName || 'Admin',
    subject: subject || 'Discussion',
    body,
    status: 'UNREAD',
    seller_id: sellerId || null,
    buyer_id: buyerId || null
  };
  const { data, error } = await supabase
    .from('messages')
    .insert([payload])
    .select()
    .single();

  if (error && error.code === '42703') {
    const { data: fallback, error: fallbackError } = await supabase
      .from('messages')
      .insert([{
        thread_id: threadId,
        from_id: fromId || null,
        from_name: fromName || 'Admin',
        subject: subject || 'Discussion',
        body,
        status: 'UNREAD'
      }])
      .select()
      .single();
    if (fallbackError) throw fallbackError;
    return fallback;
  }
  if (error) throw error;

  if (fromId) {
    await createAuditLog({
      actor_id: fromId,
      action: 'MESSAGE_SEND',
      entity: 'messages',
      entity_id: data?.id,
      details: { threadId, subject: payload.subject }
    });
  }
  return data;
};

export const fetchBuyerProfiles = async (): Promise<UserProfile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, role, business_name, location, avatar')
    .eq('role', 'BUYER')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Error fetching buyers:', error);
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    name: row.full_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    businessName: row.business_name,
    location: row.location,
    avatar: row.avatar
  })) as UserProfile[];
};

export const fetchVendorProfiles = async (): Promise<UserProfile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, role, business_name, location, avatar')
    .in('role', ['STORE_ADMIN', 'PARTNER_ADMIN'])
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Error fetching vendors:', error);
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    name: row.full_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    businessName: row.business_name,
    location: row.location,
    avatar: row.avatar
  })) as UserProfile[];
};

export const uploadCniImage = async (userId: string, side: 'recto' | 'verso', file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${side}_${Date.now()}.${fileExt}`;
  const { error: uploadError } = await supabase.storage.from('cni').upload(fileName, file, { upsert: true });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from('cni').getPublicUrl(fileName);
  return data.publicUrl;
};

export const requestCniOcr = async (imageUrl: string) => {
  const { data, error } = await supabase.functions.invoke('cni-ocr', {
    body: { imageUrl }
  });
  if (error) throw error;
  return data;
};

// --- LIVRAISONS ---

export const fetchDeliveries = async (sellerId?: string): Promise<Delivery[]> => {
  const query = supabase
    .from('deliveries')
    .select('*')
    .order('created_at', { ascending: false });

  const { data, error } = sellerId ? await query.eq('seller_id', sellerId) : await query;

  if (error) {
    if (error.code === 'PGRST205') return [];
    console.error('Error fetching deliveries:', error);
    return [];
  }
  if (!data) return [];

  return data.map((d: any) => ({
    id: d.id,
    customer: d.customer_name || 'Client',
    address: d.address || '',
    amount: Number(d.amount) || 0,
    status: d.status,
    driver: d.driver_name || 'En attente',
    time: d.eta || '--',
    created_at: d.created_at
  })) as Delivery[];
};

export const fetchDeliveryEvents = async (deliveryId: string): Promise<DeliveryEvent[]> => {
  const { data, error } = await supabase
    .from('delivery_events')
    .select('*')
    .eq('delivery_id', deliveryId)
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === 'PGRST205') return [];
    console.error('Error fetching delivery events:', error);
    return [];
  }
  if (!data) return [];

  return data.map((e: any) => ({
    id: e.id,
    delivery_id: e.delivery_id,
    status: e.status,
    note: e.note || undefined,
    created_at: e.created_at
  })) as DeliveryEvent[];
};

export const createDeliveryEvent = async (deliveryId: string, status: string, note?: string, actorId?: string) => {
  const { data, error } = await supabase
    .from('delivery_events')
    .insert([{ delivery_id: deliveryId, status, note: note || null }])
    .select()
    .single();

  if (error) throw error;
  if (actorId) {
    await createAuditLog({
      actor_id: actorId,
      action: 'DELIVERY_EVENT_CREATE',
      entity: 'delivery_events',
      entity_id: data?.id,
      details: { deliveryId, status, note: note || null }
    });
  }
  return data;
};

export const createOrderItemStatus = async (orderItemId: string, status: string, note?: string, actorId?: string) => {
  const { data, error } = await supabase
    .from('order_item_status')
    .insert([{ order_item_id: orderItemId, status, note: note || null }])
    .select()
    .single();

  if (error) throw error;
  if (actorId) {
    await createAuditLog({
      actor_id: actorId,
      action: 'ORDER_ITEM_STATUS_CREATE',
      entity: 'order_item_status',
      entity_id: data?.id,
      details: { orderItemId, status, note: note || null }
    });
  }
  return data;
};

// --- STATISTIQUES ---

export const fetchPlatformStats = async (): Promise<PlatformStats> => {
  const [
    { data: orders, error: ordersError },
    { data: products, error: productsError },
    { count: usersCount, error: usersError },
    { count: ticketsCount, error: ticketsError },
    { count: deliveriesCount, error: deliveriesError }
  ] = await Promise.all([
    supabase.from('orders').select('total_amount'),
    supabase.from('products').select('id'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('tickets').select('id', { count: 'exact', head: true }),
    supabase.from('deliveries').select('id', { count: 'exact', head: true })
  ]);

  if (ordersError || productsError || usersError || ticketsError || deliveriesError) {
    console.error('Error fetching stats:', ordersError || productsError || usersError || ticketsError || deliveriesError);
    return { revenue: 0, totalOrders: 0, activeProducts: 0, totalUsers: 0, totalTickets: 0, totalDeliveries: 0 };
  }

  const revenue = (orders || []).reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0);
  const totalOrders = (orders || []).length;
  const activeProducts = (products || []).length;
  const totalUsers = usersCount || 0;

  return { revenue, totalOrders, activeProducts, totalUsers, totalTickets: ticketsCount || 0, totalDeliveries: deliveriesCount || 0 };
};

export const fetchVendorAggregates = async () => {
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('role', ['STORE_ADMIN', 'PARTNER_ADMIN']);

  if (profilesError || !profiles) {
    console.error('Error fetching vendors:', profilesError);
    return [];
  }

  const vendorIds = profiles.map(p => p.id);
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, supplier_id, stock, price')
    .in('supplier_id', vendorIds);

  const { data: orderItems, error: orderItemsError } = await supabase
    .from('order_items')
    .select('seller_id, quantity, price, orders:order_id(status)');

  if (productsError) {
    console.error('Error fetching vendor aggregates:', productsError);
    return [];
  }
  if (orderItemsError && orderItemsError.code !== 'PGRST205') {
    console.error('Error fetching vendor aggregates:', orderItemsError);
    return [];
  }

  const productMap: Record<string, { stock: number; count: number }> = {};
  (products || []).forEach((p: any) => {
    if (!productMap[p.supplier_id]) productMap[p.supplier_id] = { stock: 0, count: 0 };
    productMap[p.supplier_id].stock += Number(p.stock || 0);
    productMap[p.supplier_id].count += 1;
  });

  const revenueMap: Record<string, { paid: number; pending: number }> = {};
  (orderItems || []).forEach((i: any) => {
    if (!revenueMap[i.seller_id]) revenueMap[i.seller_id] = { paid: 0, pending: 0 };
    const amount = Number(i.price || 0) * Number(i.quantity || 0);
    if (i.orders?.status === 'PAID') revenueMap[i.seller_id].paid += amount;
    else revenueMap[i.seller_id].pending += amount;
  });

  return profiles.map(p => ({
    id: p.id,
    name: p.full_name || 'Vendeur',
    role: p.role,
    productCount: productMap[p.id]?.count || 0,
    stockTotal: productMap[p.id]?.stock || 0,
    revenuePaid: revenueMap[p.id]?.paid || 0,
    revenuePending: revenueMap[p.id]?.pending || 0,
    revenueTotal: (revenueMap[p.id]?.paid || 0) + (revenueMap[p.id]?.pending || 0)
  }));
};

export const fetchProductsByVendor = async (vendorId: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('supplier_id', vendorId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Error fetching vendor products:', error);
    return [];
  }
  return data;
};

// --- USERS (Admin) ---

export const fetchUsers = async (params?: { query?: string; role?: UserRole | 'ALL'; status?: string | 'ALL'; page?: number; pageSize?: number; fromDate?: string; toDate?: string }) => {
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('profiles')
    .select('id, full_name, email, role, business_name, status, cni_status', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (params?.query) {
    const q = params.query.replace(/%/g, '\\%');
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
  }
  if (params?.role && params.role !== 'ALL') {
    query = query.eq('role', params.role);
  }
  if (params?.status && params.status !== 'ALL') {
    query = query.eq('status', params.status);
  }
  if (params?.fromDate) {
    query = query.gte('created_at', params.fromDate);
  }
  if (params?.toDate) {
    const end = new Date(params.toDate);
    end.setDate(end.getDate() + 1);
    query = query.lte('created_at', end.toISOString());
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    if (error.code === '42703') {
      let fallbackQuery = supabase
        .from('profiles')
        .select('id, full_name, email, role, business_name, cni_status', { count: 'exact' })
        .order('created_at', { ascending: false });
      if (params?.query) {
        const q = params.query.replace(/%/g, '\\%');
        fallbackQuery = fallbackQuery.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
      }
      if (params?.role && params.role !== 'ALL') {
        fallbackQuery = fallbackQuery.eq('role', params.role);
      }
      if (params?.fromDate) {
        fallbackQuery = fallbackQuery.gte('created_at', params.fromDate);
      }
      if (params?.toDate) {
        const end = new Date(params.toDate);
        end.setDate(end.getDate() + 1);
        fallbackQuery = fallbackQuery.lte('created_at', end.toISOString());
      }
      const { data: fallbackData, count: fallbackCount } = await fallbackQuery.range(from, to);
      const normalized = (fallbackData || []).map((row: any) => ({ ...row, status: 'ACTIVE' }));
      return { data: normalized, count: fallbackCount || 0 };
    }
    console.error('Error fetching users:', error);
    return { data: [], count: 0 };
  }
  return { data: data || [], count: count || 0 };
};

export const updateUserProfile = async (id: string, updates: { role?: UserRole; business_name?: string | null; status?: string }) => {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
};

export const deleteUserAdmin = async (userId: string) => {
  const { data, error } = await supabase.functions.invoke('admin-users', {
    body: { action: 'soft_delete', userId }
  });
  if (error) throw error;
  return data;
};

export const reactivateUserAdmin = async (userId: string) => {
  const { data, error } = await supabase.functions.invoke('admin-users', {
    body: { action: 'reactivate', userId }
  });
  if (error) throw error;
  return data;
};

// --- AUDIT LOGS ---

export const createAuditLog = async (payload: { actor_id: string; action: string; entity: string; entity_id?: string; details?: any }) => {
  const { error } = await supabase
    .from('audit_logs')
    .insert([{ ...payload }]);
  if (error) {
    if (error.code === 'PGRST205') {
      return;
    }
    console.error('Error creating audit log:', error);
  }
};

export const fetchAuditLogs = async (params?: { query?: string; actorRole?: UserRole | 'ALL'; action?: string | 'ALL'; page?: number; pageSize?: number; fromDate?: string; toDate?: string }) => {
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('audit_logs')
    .select('id, actor_id, action, entity, entity_id, details, created_at, profiles:actor_id(full_name, role)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (params?.query) {
    const q = params.query.replace(/%/g, '\\%');
    query = query.or(`action.ilike.%${q}%,entity.ilike.%${q}%`);
  }
  if (params?.action && params.action !== 'ALL') {
    query = query.eq('action', params.action);
  }
  if (params?.fromDate) {
    query = query.gte('created_at', params.fromDate);
  }
  if (params?.toDate) {
    const end = new Date(params.toDate);
    end.setDate(end.getDate() + 1);
    query = query.lte('created_at', end.toISOString());
  }

  const { data, error, count } = await query.range(from, to);
  if (error) {
    if (error.code === 'PGRST205') {
      return { data: [], count: 0 };
    }
    console.error('Error fetching audit logs:', error);
    return { data: [], count: 0 };
  }
  const filtered = params?.actorRole && params.actorRole !== 'ALL'
    ? data.filter((row: any) => row.profiles?.role === params.actorRole)
    : data;
  return { data: filtered, count: count || 0 };
};

export const resetUserPasswordAdmin = async (userId: string, email: string) => {
  const { data, error } = await supabase.functions.invoke('admin-users', {
    body: { action: 'reset_password', userId, email }
  });
  if (error) throw error;
  return data;
};

export const revokeAccessAdmin = async (userId: string) => {
  const { data, error } = await supabase.functions.invoke('admin-users', {
    body: { action: 'revoke_access', userId }
  });
  if (error) throw error;
  return data;
};

export const createAdminUser = async (payload: { email: string; password: string; role: UserRole; full_name?: string; phone?: string; business_name?: string; location?: string }) => {
  const { data, error } = await supabase.functions.invoke('admin-users', {
    body: { action: 'create_admin', ...payload }
  });
  if (error) throw error;
  return data;
};