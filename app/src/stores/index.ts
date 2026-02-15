/**
 * 스토어 통합 export
 * - 모든 Zustand 스토어를 한 곳에서 export
 */

// 인증 스토어
export { useAuthStore } from './authStore';

// 네비게이션 스토어
export {
  useNavigationStore,
  type AuthScreen,
  type ConsumerScreen,
  type StoreScreen,
} from './navigationStore';

// 선택 스토어
export { useSelectionStore } from './selectionStore';

// 장바구니 스토어
export { useCartStore, type CartItem } from './cartStore';
