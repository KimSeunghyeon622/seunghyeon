/**
 * Auth Store 테스트
 * - 인증 상태 관리 검증
 * - 세션 관리 검증
 */
import { useAuthStore } from '../../stores/authStore';

// Supabase Mock
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}));

// Mock Session 타입
interface MockSession {
  user: {
    id: string;
    email: string;
  };
  access_token: string;
  refresh_token: string;
}

const mockSession: MockSession = {
  user: {
    id: 'user-001',
    email: 'test@example.com',
  },
  access_token: 'mock-token',
  refresh_token: 'mock-refresh-token',
};

describe('AuthStore', () => {
  // 각 테스트 전 스토어 초기화
  beforeEach(() => {
    useAuthStore.getState().reset();
  });

  describe('초기 상태', () => {
    it('초기 session은 null이어야 한다', () => {
      const { session } = useAuthStore.getState();
      expect(session).toBeNull();
    });

    it('초기 isStoreOwner는 false이어야 한다', () => {
      const { isStoreOwner } = useAuthStore.getState();
      expect(isStoreOwner).toBe(false);
    });

    it('초기 loading은 false이어야 한다 (reset 후)', () => {
      const { loading } = useAuthStore.getState();
      expect(loading).toBe(false);
    });
  });

  describe('세션 관리', () => {
    it('setSession으로 세션을 설정할 수 있다', () => {
      // @ts-ignore - Mock session for testing
      useAuthStore.getState().setSession(mockSession);
      expect(useAuthStore.getState().session).toEqual(mockSession);
    });

    it('setSession(null)로 세션을 제거할 수 있다', () => {
      // @ts-ignore - Mock session for testing
      useAuthStore.getState().setSession(mockSession);
      useAuthStore.getState().setSession(null);
      expect(useAuthStore.getState().session).toBeNull();
    });
  });

  describe('업주 상태 관리', () => {
    it('setIsStoreOwner(true)로 업주 상태를 설정할 수 있다', () => {
      useAuthStore.getState().setIsStoreOwner(true);
      expect(useAuthStore.getState().isStoreOwner).toBe(true);
    });

    it('setIsStoreOwner(false)로 업주 상태를 해제할 수 있다', () => {
      useAuthStore.getState().setIsStoreOwner(true);
      useAuthStore.getState().setIsStoreOwner(false);
      expect(useAuthStore.getState().isStoreOwner).toBe(false);
    });
  });

  describe('로딩 상태 관리', () => {
    it('setLoading(true)로 로딩 상태를 설정할 수 있다', () => {
      useAuthStore.getState().setLoading(true);
      expect(useAuthStore.getState().loading).toBe(true);
    });

    it('setLoading(false)로 로딩 상태를 해제할 수 있다', () => {
      useAuthStore.getState().setLoading(true);
      useAuthStore.getState().setLoading(false);
      expect(useAuthStore.getState().loading).toBe(false);
    });
  });

  describe('상태 초기화', () => {
    it('reset으로 모든 상태를 초기화할 수 있다', () => {
      // 상태 변경
      // @ts-ignore - Mock session for testing
      useAuthStore.getState().setSession(mockSession);
      useAuthStore.getState().setIsStoreOwner(true);
      useAuthStore.getState().setLoading(true);

      // 초기화
      useAuthStore.getState().reset();
      const state = useAuthStore.getState();

      expect(state.session).toBeNull();
      expect(state.isStoreOwner).toBe(false);
      expect(state.loading).toBe(false);
    });
  });

  describe('사용자 타입 시나리오', () => {
    it('소비자 로그인 시 isStoreOwner는 false', () => {
      // @ts-ignore - Mock session for testing
      useAuthStore.getState().setSession(mockSession);
      useAuthStore.getState().setIsStoreOwner(false);

      expect(useAuthStore.getState().session).not.toBeNull();
      expect(useAuthStore.getState().isStoreOwner).toBe(false);
    });

    it('업주 로그인 시 isStoreOwner는 true', () => {
      // @ts-ignore - Mock session for testing
      useAuthStore.getState().setSession(mockSession);
      useAuthStore.getState().setIsStoreOwner(true);

      expect(useAuthStore.getState().session).not.toBeNull();
      expect(useAuthStore.getState().isStoreOwner).toBe(true);
    });

    it('로그아웃 시 모든 상태가 초기화된다', () => {
      // 로그인 상태 설정
      // @ts-ignore - Mock session for testing
      useAuthStore.getState().setSession(mockSession);
      useAuthStore.getState().setIsStoreOwner(true);

      // 로그아웃 (reset 호출)
      useAuthStore.getState().reset();

      expect(useAuthStore.getState().session).toBeNull();
      expect(useAuthStore.getState().isStoreOwner).toBe(false);
    });
  });

  describe('인증 플로우 시나리오', () => {
    it('앱 시작 → 세션 확인 → 로그인 화면 (세션 없음)', () => {
      // 앱 시작 시 loading 상태
      useAuthStore.getState().setLoading(true);
      expect(useAuthStore.getState().loading).toBe(true);

      // 세션 확인 완료 (세션 없음)
      useAuthStore.getState().setSession(null);
      useAuthStore.getState().setLoading(false);

      expect(useAuthStore.getState().session).toBeNull();
      expect(useAuthStore.getState().loading).toBe(false);
    });

    it('앱 시작 → 세션 확인 → 자동 로그인 (세션 있음)', () => {
      // 앱 시작 시 loading 상태
      useAuthStore.getState().setLoading(true);

      // 세션 확인 완료 (세션 있음)
      // @ts-ignore - Mock session for testing
      useAuthStore.getState().setSession(mockSession);
      useAuthStore.getState().setIsStoreOwner(false);
      useAuthStore.getState().setLoading(false);

      expect(useAuthStore.getState().session).not.toBeNull();
      expect(useAuthStore.getState().loading).toBe(false);
    });
  });
});
