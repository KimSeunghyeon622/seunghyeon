/**
 * 장바구니 상태 관리 스토어
 * - 선택한 제품과 수량을 전역으로 관리
 * - 여러 제품을 한번에 예약할 수 있도록 지원
 */
import { create } from 'zustand';

// 장바구니 아이템 타입
export interface CartItem {
  productId: string;
  productName: string;
  imageUrl?: string;
  originalPrice: number;
  discountedPrice: number;
  quantity: number;
  stockQuantity: number;
  storeId: string;
  storeName: string; // 업체 이름 추가
  // 추가 필드 (예약 시 필요)
  [key: string]: any;
}

// 장바구니 상태 타입
interface CartState {
  // 상태
  items: CartItem[];

  // 액션
  addItem: (item: CartItem) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  clearStoreCart: (storeId: string) => void; // 특정 업체의 장바구니만 비우기

  // 계산 함수
  getTotalCount: () => number;
  getTotalAmount: () => number;
  getItemsByStore: (storeId: string) => CartItem[];
  getItem: (productId: string) => CartItem | undefined;
}

// 초기 상태
const initialState = {
  items: [],
};

// 스토어 생성
export const useCartStore = create<CartState>((set, get) => ({
  // 초기 상태
  ...initialState,

  // 장바구니에 아이템 추가
  addItem: (item) => {
    const state = get();
    const existingItem = state.items.find((i) => i.productId === item.productId);

    if (existingItem) {
      // 이미 있는 상품이면 수량 합산 (재고 범위 내)
      const newQuantity = Math.min(
        existingItem.quantity + item.quantity,
        item.stockQuantity
      );
      set({
        items: state.items.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: newQuantity }
            : i
        ),
      });
    } else {
      // 새로운 상품이면 추가
      set({
        items: [...state.items, item],
      });
    }
  },

  // 수량 업데이트
  updateQuantity: (productId, quantity) => {
    if (quantity < 1) {
      // 수량이 0 이하면 아이템 제거
      get().removeItem(productId);
      return;
    }

    const state = get();
    const item = state.items.find((i) => i.productId === productId);
    if (!item) return;

    // 재고 범위 내에서만 수량 변경
    const newQuantity = Math.min(quantity, item.stockQuantity);

    set({
      items: state.items.map((i) =>
        i.productId === productId ? { ...i, quantity: newQuantity } : i
      ),
    });
  },

  // 아이템 제거
  removeItem: (productId) => {
    set({
      items: get().items.filter((i) => i.productId !== productId),
    });
  },

  // 장바구니 비우기
  clearCart: () => {
    set(initialState);
  },

  // 특정 업체의 장바구니만 비우기
  clearStoreCart: (storeId) => {
    set({
      items: get().items.filter((i) => i.storeId !== storeId),
    });
  },

  // 총 아이템 개수
  getTotalCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  // 총 결제 금액
  getTotalAmount: () => {
    return get().items.reduce(
      (sum, item) => sum + item.discountedPrice * item.quantity,
      0
    );
  },

  // 특정 업체의 아이템만 가져오기
  getItemsByStore: (storeId) => {
    return get().items.filter((i) => i.storeId === storeId);
  },

  // 특정 아이템 가져오기
  getItem: (productId) => {
    return get().items.find((i) => i.productId === productId);
  },
}));
