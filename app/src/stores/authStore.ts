/**
 * 인증 상태 관리 스토어
 * - 세션, 사용자 정보, 업주 여부 등을 전역으로 관리
 */
import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// 상태 타입 정의
interface AuthState {
  // 상태
  session: Session | null;
  isStoreOwner: boolean;
  loading: boolean;
  needsProfileSetup: boolean; // 소셜 로그인 후 프로필 설정 필요 여부
  isSocialLogin: boolean; // 소셜 로그인 여부

  // 액션
  setSession: (session: Session | null) => void;
  setIsStoreOwner: (isOwner: boolean) => void;
  setLoading: (loading: boolean) => void;
  setNeedsProfileSetup: (needs: boolean) => void;
  setIsSocialLogin: (isSocial: boolean) => void;

  // 복합 액션
  checkUserType: (userId: string) => Promise<boolean>; // 프로필 존재 여부 반환
  checkSession: () => Promise<void>;
  logout: () => Promise<void>;
  reset: () => void;
}

// 초기 상태
const initialState = {
  session: null,
  isStoreOwner: false,
  loading: true,
  needsProfileSetup: false,
  isSocialLogin: false,
};

// 스토어 생성
export const useAuthStore = create<AuthState>((set, get) => ({
  // 초기 상태
  ...initialState,

  // 단순 액션
  setSession: (session) => set({ session }),
  setIsStoreOwner: (isOwner) => set({ isStoreOwner: isOwner }),
  setLoading: (loading) => set({ loading }),
  setNeedsProfileSetup: (needs) => set({ needsProfileSetup: needs }),
  setIsSocialLogin: (isSocial) => set({ isSocialLogin: isSocial }),

  // 사용자 유형 확인 (소비자/업주) - 프로필 존재 여부 반환
  checkUserType: async (userId: string): Promise<boolean> => {
    try {
      // 소비자 체크
      const { data: consumer } = await supabase
        .from('consumers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      // 업주 체크
      const { data: store } = await supabase
        .from('stores')
        .select('id, is_approved')
        .eq('user_id', userId)
        .maybeSingle();

      if (store) {
        set({ isStoreOwner: true });
      }

      // 소비자 또는 업주 데이터가 있으면 프로필 존재
      if (consumer || store) {
        set({ needsProfileSetup: false });
        return true;
      }

      // 둘 다 없으면 프로필 설정 필요
      console.log('프로필 설정이 필요합니다');
      set({ needsProfileSetup: true });
      return false;
    } catch (error) {
      console.error('사용자 유형 확인 오류:', error);
      return false;
    }
  },

  // 세션 확인
  checkSession: async () => {
    try {
      set({ loading: true });
      const { data: { session } } = await supabase.auth.getSession();
      set({ session });

      if (session) {
        // 소셜 로그인 여부 확인 (provider가 email이 아니면 소셜 로그인)
        const provider = session.user.app_metadata?.provider;
        const isSocial = Boolean(provider && provider !== 'email');
        set({ isSocialLogin: isSocial });

        // 프로필 존재 여부 확인
        await get().checkUserType(session.user.id);
      }
    } catch (error) {
      console.error('세션 확인 오류:', error);
    } finally {
      set({ loading: false });
    }
  },

  // 로그아웃
  logout: async () => {
    await supabase.auth.signOut();
    get().reset();
  },

  // 상태 초기화
  reset: () => set({ ...initialState, loading: false }),
}));
