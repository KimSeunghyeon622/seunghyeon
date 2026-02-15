/**
 * 선택 항목 상태 관리 스토어
 * - 선택된 업체, 상품, 예약 등을 전역으로 관리
 */
import { create } from 'zustand';

// 상품 타입 (간단한 정의)
interface Product {
  id: string;
  name: string;
  original_price: number;
  discounted_price: number;
  stock_quantity: number;
  store_id: string;
  [key: string]: any; // 추가 필드 허용
}

// 예약 타입 (간단한 정의)
interface Reservation {
  id: string;
  reservation_number: string;
  status: string;
  total_amount: number;
  pickup_time: string;
  store_id: string;
  product_id: string;
  [key: string]: any; // 추가 필드 허용
}

// 리뷰 작성 후 돌아갈 화면 타입
type ReviewReturnScreen = 'myreservations' | 'purchasehistory' | null;

// 상태 타입 정의
interface SelectionState {
  // 상태
  selectedStoreId: string;
  selectedProduct: Product | null;
  selectedReservation: Reservation | null;
  reviewReturnScreen: ReviewReturnScreen; // 리뷰 작성 후 돌아갈 화면

  // 액션
  selectStore: (storeId: string) => void;
  selectProduct: (product: Product | null) => void;
  selectReservation: (reservation: Reservation | null) => void;
  setReviewReturnScreen: (screen: ReviewReturnScreen) => void;

  // 편의 액션
  clearStore: () => void;
  clearProduct: () => void;
  clearReservation: () => void;
  clearReviewReturnScreen: () => void;
  clearAll: () => void;
}

// 초기 상태
const initialState = {
  selectedStoreId: '',
  selectedProduct: null,
  selectedReservation: null,
  reviewReturnScreen: null as ReviewReturnScreen,
};

// 스토어 생성
export const useSelectionStore = create<SelectionState>((set) => ({
  // 초기 상태
  ...initialState,

  // 선택 액션
  selectStore: (storeId) => set({ selectedStoreId: storeId }),
  selectProduct: (product) => set({ selectedProduct: product }),
  selectReservation: (reservation) => set({ selectedReservation: reservation }),
  setReviewReturnScreen: (screen) => set({ reviewReturnScreen: screen }),

  // 초기화 액션
  clearStore: () => set({ selectedStoreId: '' }),
  clearProduct: () => set({ selectedProduct: null }),
  clearReservation: () => set({ selectedReservation: null }),
  clearReviewReturnScreen: () => set({ reviewReturnScreen: null }),
  clearAll: () => set(initialState),
}));
