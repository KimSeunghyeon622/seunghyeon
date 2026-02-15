/**
 * Navigation Store 테스트
 * - 화면 전환 로직 검증
 * - 모드 전환 (소비자/업주) 검증
 */
import { useNavigationStore } from '../../stores/navigationStore';

describe('NavigationStore', () => {
  // 각 테스트 전 스토어 초기화
  beforeEach(() => {
    useNavigationStore.getState().reset();
  });

  describe('초기 상태', () => {
    it('초기 authScreen은 login이어야 한다', () => {
      const { authScreen } = useNavigationStore.getState();
      expect(authScreen).toBe('login');
    });

    it('초기 consumerScreen은 storelist이어야 한다', () => {
      const { consumerScreen } = useNavigationStore.getState();
      expect(consumerScreen).toBe('storelist');
    });

    it('초기 storeScreen은 dashboard이어야 한다', () => {
      const { storeScreen } = useNavigationStore.getState();
      expect(storeScreen).toBe('dashboard');
    });

    it('초기 showStoreMode는 false이어야 한다', () => {
      const { showStoreMode } = useNavigationStore.getState();
      expect(showStoreMode).toBe(false);
    });
  });

  describe('인증 화면 전환', () => {
    it('setAuthScreen으로 회원가입 유형 선택 화면으로 이동할 수 있다', () => {
      useNavigationStore.getState().setAuthScreen('signupType');
      expect(useNavigationStore.getState().authScreen).toBe('signupType');
    });

    it('setAuthScreen으로 소비자 회원가입 화면으로 이동할 수 있다', () => {
      useNavigationStore.getState().setAuthScreen('consumerSignup');
      expect(useNavigationStore.getState().authScreen).toBe('consumerSignup');
    });

    it('setAuthScreen으로 업주 회원가입 화면으로 이동할 수 있다', () => {
      useNavigationStore.getState().setAuthScreen('storeSignup');
      expect(useNavigationStore.getState().authScreen).toBe('storeSignup');
    });

    it('goToLogin으로 로그인 화면으로 돌아갈 수 있다', () => {
      useNavigationStore.getState().setAuthScreen('consumerSignup');
      useNavigationStore.getState().goToLogin();
      expect(useNavigationStore.getState().authScreen).toBe('login');
    });
  });

  describe('소비자 화면 전환', () => {
    it('업체 상세 화면으로 이동할 수 있다', () => {
      useNavigationStore.getState().setConsumerScreen('detail');
      expect(useNavigationStore.getState().consumerScreen).toBe('detail');
    });

    it('예약 화면으로 이동할 수 있다', () => {
      useNavigationStore.getState().setConsumerScreen('reserve');
      expect(useNavigationStore.getState().consumerScreen).toBe('reserve');
    });

    it('내 예약 화면으로 이동할 수 있다', () => {
      useNavigationStore.getState().setConsumerScreen('myreservations');
      expect(useNavigationStore.getState().consumerScreen).toBe('myreservations');
    });

    it('마이페이지로 이동할 수 있다', () => {
      useNavigationStore.getState().setConsumerScreen('mypage');
      expect(useNavigationStore.getState().consumerScreen).toBe('mypage');
    });

    it('goToStoreList로 업체 목록으로 돌아갈 수 있다', () => {
      useNavigationStore.getState().setConsumerScreen('detail');
      useNavigationStore.getState().goToStoreList();
      expect(useNavigationStore.getState().consumerScreen).toBe('storelist');
    });

    it('goToStoreList 호출 시 showStoreMode가 false로 설정된다', () => {
      useNavigationStore.getState().setShowStoreMode(true);
      useNavigationStore.getState().goToStoreList();
      expect(useNavigationStore.getState().showStoreMode).toBe(false);
    });
  });

  describe('업주 화면 전환', () => {
    it('상품 관리 화면으로 이동할 수 있다', () => {
      useNavigationStore.getState().setStoreScreen('products');
      expect(useNavigationStore.getState().storeScreen).toBe('products');
    });

    it('캐시 관리 화면으로 이동할 수 있다', () => {
      useNavigationStore.getState().setStoreScreen('cash');
      expect(useNavigationStore.getState().storeScreen).toBe('cash');
    });

    it('예약 관리 화면으로 이동할 수 있다', () => {
      useNavigationStore.getState().setStoreScreen('reservations');
      expect(useNavigationStore.getState().storeScreen).toBe('reservations');
    });

    it('goToDashboard로 대시보드로 돌아갈 수 있다', () => {
      useNavigationStore.getState().setStoreScreen('products');
      useNavigationStore.getState().goToDashboard();
      expect(useNavigationStore.getState().storeScreen).toBe('dashboard');
    });
  });

  describe('모드 전환', () => {
    it('enterStoreMode로 업주 모드로 전환할 수 있다', () => {
      useNavigationStore.getState().enterStoreMode();
      const state = useNavigationStore.getState();

      expect(state.showStoreMode).toBe(true);
      expect(state.storeScreen).toBe('dashboard');
    });

    it('exitStoreMode로 소비자 모드로 전환할 수 있다', () => {
      useNavigationStore.getState().enterStoreMode();
      useNavigationStore.getState().exitStoreMode();
      const state = useNavigationStore.getState();

      expect(state.showStoreMode).toBe(false);
      expect(state.consumerScreen).toBe('mypage');
    });
  });

  describe('상태 초기화', () => {
    it('reset으로 모든 상태를 초기화할 수 있다', () => {
      // 상태 변경
      useNavigationStore.getState().setAuthScreen('storeSignup');
      useNavigationStore.getState().setConsumerScreen('detail');
      useNavigationStore.getState().setStoreScreen('products');
      useNavigationStore.getState().setShowStoreMode(true);

      // 초기화
      useNavigationStore.getState().reset();
      const state = useNavigationStore.getState();

      expect(state.authScreen).toBe('login');
      expect(state.consumerScreen).toBe('storelist');
      expect(state.storeScreen).toBe('dashboard');
      expect(state.showStoreMode).toBe(false);
    });
  });
});
