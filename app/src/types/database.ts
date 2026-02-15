/**
 * 데이터베이스 테이블 타입 정의
 * 모든 화면에서 공통으로 사용하는 타입들
 */

// ==================== 업체 (Store) ====================
export interface Store {
  id: string;
  user_id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  phone: string;
  cover_image_url: string;
  logo_url?: string;
  latitude?: number;
  longitude?: number;
  average_rating: number;
  review_count: number;
  cash_balance: number;
  is_open: boolean;
  is_approved: boolean;
  opening_hours_text?: string;
  pickup_start_time?: string;
  pickup_end_time?: string;
  refund_policy?: string;
  no_show_policy?: string;
  business_number?: string;
  created_at: string;
  updated_at?: string;
}

// 공개용 Store (민감 정보 제외)
export interface PublicStore {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  phone: string;
  cover_image_url: string;
  average_rating: number;
  review_count: number;
  is_open: boolean;
  is_approved: boolean;
  created_at: string;
}

// ==================== 상품 (Product) ====================
export interface Product {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  original_price: number;
  discounted_price: number;
  discount_rate?: number;
  stock_quantity: number;
  image_url?: string;
  is_active: boolean;
  expiry_date?: string;
  manufactured_date?: string;
  send_notification?: boolean;
  category?: string;
  created_at: string;
}

// 과거 상품 (히스토리용)
export interface PastProduct extends Product {
  sold_quantity?: number;
}

// ==================== 소비자 (Consumer) ====================
export interface Consumer {
  id: string;
  user_id: string;
  nickname: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
}

// ==================== 예약 (Reservation) ====================
export interface Reservation {
  id: string;
  reservation_number: string;
  consumer_id: string;
  store_id: string;
  product_id: string;
  quantity: number;
  total_amount: number;
  status: ReservationStatus;
  pickup_time: string;
  picked_up: boolean;
  picked_up_at?: string;
  cancel_reason?: string;
  commission_amount?: number;
  created_at: string;
  updated_at?: string;
}

// 예약 + 조인 데이터
export interface ReservationWithDetails extends Reservation {
  stores?: Pick<Store, 'name' | 'address' | 'phone' | 'refund_policy' | 'no_show_policy'>;
  products?: Pick<Product, 'name' | 'image_url'>;
  consumers?: Pick<Consumer, 'nickname' | 'phone'>;
}

// ==================== 리뷰 (Review) ====================
export interface Review {
  id: string;
  consumer_id: string;
  store_id: string;
  reservation_id?: string;
  rating: number;
  content: string;
  image_urls?: string[];  // 리뷰 사진 URL 배열 (최대 2장)
  reply?: string;
  reply_at?: string;
  is_deleted: boolean;
  created_at: string;
  updated_at?: string;
}

// 리뷰 + 소비자 정보
export interface ReviewWithConsumer extends Review {
  consumers?: Pick<Consumer, 'nickname' | 'avatar_url'>;
}

// ==================== 캐시 거래 (CashTransaction) ====================
export interface CashTransaction {
  id: string;
  store_id: string;
  transaction_type: CashTransactionType;
  amount: number;
  balance_after: number;
  reservation_id?: string;
  description?: string;
  created_at: string;
}

// ==================== 즐겨찾기 (Favorite) ====================
export interface Favorite {
  id: string;
  consumer_id: string;
  store_id: string;
  created_at: string;
}

// ==================== 영업시간 (OperatingHour) ====================
export interface OperatingHour {
  id: string;
  store_id: string;
  day_of_week: number; // 0: 일요일 ~ 6: 토요일
  is_open: boolean;
  open_time?: string;
  close_time?: string;
}

export interface DaySchedule {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

// ==================== Enum 타입 ====================
export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type CashTransactionType =
  | 'charge'
  | 'subscription'
  | 'refund'
  | 'withdrawal';

export type StoreCategory =
  | '전체'
  | '반찬'
  | '제과'
  | '식자재'
  | '밀키트';

// ==================== 배너 (Banner) ====================
export type BannerLinkType = 'detail' | 'external' | 'store';

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url: string;
  link_type: BannerLinkType;
  external_url?: string;
  store_id?: string;
  display_order: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  click_count: number;
  view_count: number;
  created_at: string;
  updated_at?: string;
}
