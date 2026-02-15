/**
 * RLS 보안 테스트 헬퍼 함수
 * 다른 사용자로 로그인하여 RLS 정책 테스트를 지원
 */

import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';

// 테스트 환경 설정
// 실제 테스트 실행 시 환경변수로 제공되어야 함
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// 테스트용 사용자 계정 (환경변수로 관리)
export const TEST_USERS = {
  CONSUMER_A: {
    email: process.env.TEST_CONSUMER_A_EMAIL || 'test-consumer-a@example.com',
    password: process.env.TEST_CONSUMER_A_PASSWORD || 'test-password-123',
  },
  CONSUMER_B: {
    email: process.env.TEST_CONSUMER_B_EMAIL || 'test-consumer-b@example.com',
    password: process.env.TEST_CONSUMER_B_PASSWORD || 'test-password-123',
  },
  STORE_OWNER_A: {
    email: process.env.TEST_STORE_OWNER_A_EMAIL || 'test-store-owner-a@example.com',
    password: process.env.TEST_STORE_OWNER_A_PASSWORD || 'test-password-123',
  },
  STORE_OWNER_B: {
    email: process.env.TEST_STORE_OWNER_B_EMAIL || 'test-store-owner-b@example.com',
    password: process.env.TEST_STORE_OWNER_B_PASSWORD || 'test-password-123',
  },
};

export interface TestUser {
  email: string;
  password: string;
}

export interface AuthenticatedClient {
  client: SupabaseClient;
  session: Session;
  userId: string;
}

/**
 * 새로운 Supabase 클라이언트 생성
 * 각 테스트에서 독립적인 클라이언트를 사용하기 위함
 */
export function createTestClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * 특정 사용자로 로그인하여 인증된 클라이언트 반환
 */
export async function loginAsUser(user: TestUser): Promise<AuthenticatedClient> {
  const client = createTestClient();

  const { data, error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });

  if (error) {
    throw new Error(`Login failed for ${user.email}: ${error.message}`);
  }

  if (!data.session || !data.user) {
    throw new Error(`No session returned for ${user.email}`);
  }

  return {
    client,
    session: data.session,
    userId: data.user.id,
  };
}

/**
 * 익명(비인증) 클라이언트 생성
 */
export function createAnonymousClient(): SupabaseClient {
  return createTestClient();
}

/**
 * 로그아웃 처리
 */
export async function logout(client: SupabaseClient): Promise<void> {
  await client.auth.signOut();
}

/**
 * 테스트용 consumer_id 조회
 */
export async function getConsumerId(
  client: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data, error } = await client
    .from('consumers')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to get consumer_id:', error);
    return null;
  }

  return data?.id || null;
}

/**
 * 테스트용 store_id 조회 (업주 계정용)
 */
export async function getStoreId(
  client: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data, error } = await client
    .from('stores')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to get store_id:', error);
    return null;
  }

  return data?.id || null;
}

/**
 * 테스트 결과 검증 헬퍼
 */
export function expectAccessDenied(error: { code?: string; message?: string } | null): void {
  // RLS에 의해 접근이 거부되면 보통 다음과 같은 에러 발생
  // - code: 'PGRST116' (row not found)
  // - code: '42501' (insufficient privilege)
  // - message contains 'permission denied' or 'policy violation'

  if (!error) {
    // 에러가 없어도 데이터가 반환되지 않으면 RLS가 작동한 것
    return;
  }

  const isAccessDenied =
    error.code === 'PGRST116' ||
    error.code === '42501' ||
    error.message?.toLowerCase().includes('permission denied') ||
    error.message?.toLowerCase().includes('policy') ||
    error.message?.toLowerCase().includes('unauthorized');

  if (!isAccessDenied) {
    throw new Error(`Expected access denied error, but got: ${error.message}`);
  }
}

/**
 * 테스트 데이터 정리를 위한 유틸리티
 * 테스트 후 생성된 데이터 삭제
 */
export async function cleanupTestData(
  client: SupabaseClient,
  table: string,
  ids: string[]
): Promise<void> {
  if (ids.length === 0) return;

  const { error } = await client
    .from(table)
    .delete()
    .in('id', ids);

  if (error) {
    console.warn(`Failed to cleanup ${table}:`, error);
  }
}

/**
 * 테스트 환경 검증
 * 테스트 실행 전 필요한 환경 변수가 설정되어 있는지 확인
 */
export function validateTestEnvironment(): boolean {
  const requiredVars = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missingVars = requiredVars.filter((v) => !process.env[v]);

  if (missingVars.length > 0) {
    console.warn(
      `Missing environment variables for RLS tests: ${missingVars.join(', ')}`
    );
    return false;
  }

  return true;
}
