/**
 * 네비게이션 상태 관리 스토어
 * - 현재 화면 상태, 모드 전환 등을 전역으로 관리
 */
import { create } from 'zustand';

// 화면 타입 정의
export type AuthScreen = 'login' | 'signupType' | 'consumerSignup' | 'storeSignup';
export type SocialSignupScreen = 'socialSignupType' | 'socialConsumerSignup' | 'socialStoreSignup';
export type ConsumerScreen = 'storelist' | 'detail' | 'reserve' | 'cart' | 'myreservations' | 'review' | 'mypage' | 'favorites' | 'myreviews' | 'notifications' | 'faq' | 'customerservice' | 'purchasehistory' | 'allreviews' | 'notices' | 'noticeDetail';
export type StoreScreen = 'dashboard' | 'products' | 'cash' | 'cashHistory' | 'reservations' | 'info' | 'reviews' | 'regulars' | 'salesStatistics' | 'ownerNotifications';

// 상태 타입 정의
interface NavigationState {
  // 상태
  authScreen: AuthScreen;
  socialSignupScreen: SocialSignupScreen;
  consumerScreen: ConsumerScreen;
  storeScreen: StoreScreen;
  showStoreMode: boolean;

  // 액션
  setAuthScreen: (screen: AuthScreen) => void;
  setSocialSignupScreen: (screen: SocialSignupScreen) => void;
  setConsumerScreen: (screen: ConsumerScreen) => void;
  setStoreScreen: (screen: StoreScreen) => void;
  setShowStoreMode: (show: boolean) => void;

  // 편의 액션
  goToLogin: () => void;
  goToStoreList: () => void;
  goToDashboard: () => void;
  enterStoreMode: () => void;
  exitStoreMode: () => void;
  reset: () => void;
}

// 초기 상태
const initialState = {
  authScreen: 'login' as AuthScreen,
  socialSignupScreen: 'socialSignupType' as SocialSignupScreen,
  consumerScreen: 'storelist' as ConsumerScreen,
  storeScreen: 'dashboard' as StoreScreen,
  showStoreMode: false,
};

// 스토어 생성
export const useNavigationStore = create<NavigationState>((set) => ({
  // 초기 상태
  ...initialState,

  // 단순 액션
  setAuthScreen: (screen) => set({ authScreen: screen }),
  setSocialSignupScreen: (screen) => set({ socialSignupScreen: screen }),
  setConsumerScreen: (screen) => set({ consumerScreen: screen }),
  setStoreScreen: (screen) => set({ storeScreen: screen }),
  setShowStoreMode: (show) => set({ showStoreMode: show }),

  // 편의 액션
  goToLogin: () => set({ authScreen: 'login' }),
  goToStoreList: () => set({ consumerScreen: 'storelist', showStoreMode: false }),
  goToDashboard: () => set({ storeScreen: 'dashboard' }),

  enterStoreMode: () => set({
    showStoreMode: true,
    storeScreen: 'dashboard'
  }),

  exitStoreMode: () => set({
    showStoreMode: false,
    consumerScreen: 'mypage'
  }),

  // 상태 초기화
  reset: () => set(initialState),
}));
