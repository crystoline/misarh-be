// ==========================================
// MISARH Shared TypeScript Types
// ==========================================

// ==========================================
// Enums and Constants
// ==========================================

export enum ScentFamily {
  FRESH = 'Fresh',
  FLORAL = 'Floral',
  WOODY = 'Woody',
  ORIENTAL = 'Oriental',
  SPICY = 'Spicy',
}

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESSFUL = 'successful',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum ConsultationStatus {
  BOOKED = 'booked',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
}

export enum SubscriptionTier {
  DISCOVERY = 'Discovery',
  PREMIUM = 'Premium',
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

// ==========================================
// Database Models
// ==========================================

export interface Customer {
  id: string;
  email: string;
  password_hash: string;
  name?: string;
  phone?: string;
  is_admin: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  emotion_story?: string;
  base_price: number;
  scent_notes: ScentNotes;
  family: ScentFamily;
  images: string[];
  stock_level: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ScentNotes {
  top: string[];
  heart: string[];
  base: string[];
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  subtotal: number;
  discount: number;
  total: number;
  status: OrderStatus;
  payment_method?: string;
  payment_status: PaymentStatus;
  shipping_address?: ShippingAddress;
  tracking_number?: string;
  notes?: string;
  assigned_to?: string; // ID of admin/staff
  priority?: 'normal' | 'high' | 'urgent';
  created_at: Date;
  updated_at: Date;
}

export interface ShippingAddress {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code?: string;
  country: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  size?: string;
  unit_price: number;
  total_price: number;
  created_at: Date;
}

export interface Consultation {
  id: string;
  consultation_number: string;
  customer_id: string;
  date: Date;
  time_slot: string;
  questionnaire_data: QuestionnaireData;
  ai_profile: ScentProfile;
  status: ConsultationStatus;
  booking_fee: number;
  booking_fee_paid: boolean;
  payment_reference?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface QuestionnaireData {
  loves_scents: string;
  avoids_scents: string;
  desired_emotions: string;
  favorite_memory?: string;
  lifestyle: string[];
}

export interface ScentProfile {
  dominant_family: ScentFamily;
  intensity: 'Light' | 'Medium' | 'Strong';
  recommended_base: string[];
  recommended_heart: string[];
  recommended_top: string[];
  personality: string;
  mixing_notes: string;
}

export interface CustomFormula {
  id: string;
  consultation_id: string;
  customer_id: string;
  fragrance_name?: string;
  bottle_number?: string;
  ingredients: Ingredient[];
  mixing_notes?: string;
  images: string[];
  created_at: Date;
  updated_at: Date;
}

export interface Ingredient {
  name: string;
  percentage: number;
  notes?: string;
}

export interface Subscription {
  id: string;
  customer_id: string;
  tier: SubscriptionTier;
  price: number;
  status: SubscriptionStatus;
  next_delivery_date?: Date;
  frequency: 'monthly' | 'quarterly';
  created_at: Date;
  updated_at: Date;
  cancelled_at?: Date;
}

export interface AvailabilitySlot {
  id: string;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  time_slot: string;
  is_available: boolean;
  created_at: Date;
}

export interface BookedSlot {
  id: string;
  consultation_id: string;
  date: Date;
  time_slot: string;
  created_at: Date;
}

export interface ScentPreferenceProfile {
  id: string;
  customer_id: string;
  preferences_vector: PreferencesVector;
  updated_at: Date;
}

export interface PreferencesVector {
  floral: number;
  woody: number;
  fresh: number;
  oriental: number;
  spicy: number;
}

export interface Wishlist {
  id: string;
  customer_id: string;
  product_id: string;
  created_at: Date;
}

export interface Cart {
  id: string;
  customer_id: string;
  product_id: string;
  quantity: number;
  size?: string;
  created_at: Date;
  updated_at: Date;
}

export interface PromoCode {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_value?: number;
  max_uses?: number;
  used_count: number;
  expires_at?: Date;
  is_active: boolean;
  created_at: Date;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  is_active: boolean;
  subscribed_at: Date;
  unsubscribed_at?: Date;
}

// ==========================================
// API Request/Response Types
// ==========================================

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface AuthResponse {
  token: string;
  customer: Omit<Customer, 'password_hash'>;
}

// Products
export interface ProductListQuery {
  family?: ScentFamily;
  min_price?: number;
  max_price?: number;
  search?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
  page?: number;
  limit?: number;
}

export interface ProductResponse {
  product: Product;
  related_products?: Product[];
}

// Cart
export interface AddToCartRequest {
  product_id: string;
  quantity: number;
  size?: string;
}

export interface UpdateCartRequest {
  quantity: number;
}

export interface CartResponse {
  items: CartItemWithProduct[];
  subtotal: number;
  total_items: number;
}

export interface CartItemWithProduct extends Cart {
  product: Product;
}

// Orders
export interface CreateOrderRequest {
  items: Array<{
    product_id: string;
    quantity: number;
    size?: string;
  }>;
  shipping_address: ShippingAddress;
  payment_method: string;
  promo_code?: string;
}

export interface OrderResponse {
  order: Order;
  items: OrderItem[];
  payment_url?: string;
  payment_reference?: string;
}

// Consultations
export interface BookConsultationRequest {
  questionnaire_data: QuestionnaireData;
  date: string;
  time_slot: string;
}

export interface ConsultationResponse {
  consultation: Consultation;
  ai_profile: ScentProfile;
  payment_url?: string;
  payment_reference?: string;
}

// Payments
export interface InitiatePaymentRequest {
  amount: number;
  email: string;
  reference: string;
  callback_url: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaymentWebhook {
  event: string;
  data: {
    reference: string;
    status: string;
    amount: number;
    customer: {
      email: string;
    };
    metadata?: Record<string, any>;
  };
}

// Subscriptions
export interface CreateSubscriptionRequest {
  tier: SubscriptionTier;
  frequency: 'monthly' | 'quarterly';
}

export interface UpdateSubscriptionRequest {
  status?: SubscriptionStatus;
  next_delivery_date?: string;
}

// Admin
export interface AdminAnalytics {
  total_revenue: number;
  total_orders: number;
  total_consultations: number;
  total_customers: number;
  revenue_by_month: Array<{ month: string; revenue: number }>;
  top_products: Array<{ product: Product; sales_count: number }>;
  consultation_trends: Array<{ date: string; count: number }>;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  tracking_number?: string;
  notes?: string;
}

export interface BulkUpdateStatusRequest {
  order_ids: string[];
  status: OrderStatus;
}

export interface AssignOrderRequest {
  staff_id: string;
}

export interface UpdateOrderPriorityRequest {
  priority: 'normal' | 'high' | 'urgent';
}

export interface RecordFormulaRequest {
  consultation_id: string;
  fragrance_name: string;
  bottle_number?: string;
  ingredients: Ingredient[];
  mixing_notes?: string;
}

// Newsletter
export interface SubscribeNewsletterRequest {
  email: string;
}

// Recommendations
export interface ProductRecommendation {
  product: Product;
  score: number;
  reason: string;
}

// ==========================================
// Utility Types
// ==========================================

export type Paginated<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
};

export type ApiError = {
  message: string;
  code?: string;
  status?: number;
};
