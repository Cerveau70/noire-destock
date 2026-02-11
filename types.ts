
export type UserRole = 'BUYER' | 'STORE_ADMIN' | 'PARTNER_ADMIN' | 'ADMIN' | 'SUPER_ADMIN';

export type ProductStatus = 'INVENDU' | 'DATE_COURTE' | 'ABIME';

export interface UserProfile {
  id: string; // Added ID linking to Auth
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  walletBalance?: number;
  role?: UserRole;
  commissionRate?: number;
  cniStatus?: 'PENDING' | 'VERIFIED' | 'FAILED' | null;
  cniRectoUrl?: string | null;
  cniVersoUrl?: string | null;
  createdAt?: string;
  // Champs spécifiques Admin/Business
  businessName?: string;
  rccm?: string;
  cniNumber?: string;
  location?: string;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Product {
  id: string;
  supplierId?: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  stock: number;
  status: ProductStatus;
  expiryDate: string;
  location: string;
  image: string;
  description: string;
  supplier: string;
  reviews?: Review[];
  rating?: number;
  reviewCount?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  buyer_id: string;
  total_amount: number;
  status: 'PENDING' | 'PAID' | 'DELIVERED';
  payment_method: string;
  created_at: string;
  seller_id?: string;
  payout_status?: 'PENDING' | 'ESCROW' | 'PAID';
  escrow_amount?: number;
  seller_amount?: number;
  commission_amount?: number;
  payment_ref?: string;
  // Pour l'affichage frontend si on joint les produits (optionnel dans cette version simple)
  items?: any[]; 
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  seller_id?: string;
  quantity: number;
  price: number;
  created_at: string;
  product_name?: string;
}

export interface OrderItemStatus {
  id: string;
  order_item_id: string;
  status: string;
  note?: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export type TicketType = 'BUG' | 'FEATURE' | 'NEED';
export type TicketStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';

export interface FeedbackTicket {
  id: string;
  userId: string;
  userRole: UserRole;
  type: TicketType;
  subject: string;
  description: string;
  status: TicketStatus;
  date: string;
}

export interface B2BThread {
  id: string;
  subject: string;
  fromName: string;
  preview: string;
  date: string;
  status: 'UNREAD' | 'READ';
}

export interface B2BMessage {
  id: string;
  threadId: string;
  fromName: string;
  body: string;
  createdAt: string;
}

export interface Delivery {
  id: string;
  customer: string;
  address: string;
  amount: number;
  status: 'EN_ROUTE' | 'PENDING' | 'DELIVERED';
  driver: string;
  time: string;
  created_at?: string;
}

export interface DeliveryEvent {
  id: string;
  delivery_id: string;
  status: string;
  note?: string;
  created_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string;
  reference_id?: string;
  payment_ref?: string;
  meta?: any;
  created_at: string;
}

export interface PayoutRequest {
  id: string;
  seller_id: string;
  amount: number;
  method: string;
  phone?: string;
  status: string;
  created_at: string;
}

export interface PlatformStats {
  revenue: number;
  totalOrders: number;
  activeProducts: number;
  totalUsers?: number;
  totalTickets?: number;
  totalDeliveries?: number;
}
