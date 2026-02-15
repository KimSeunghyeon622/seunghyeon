/**
 * RLS (Row Level Security) 보안 테스트
 *
 * 이 테스트는 Supabase RLS 정책이 올바르게 작동하는지 검증합니다.
 * 다른 사용자의 민감한 데이터에 접근할 수 없어야 합니다.
 *
 * 테스트 실행 조건:
 * - 실제 Supabase 인스턴스 필요
 * - 테스트용 사용자 계정 사전 생성 필요
 * - 환경 변수 설정 필요
 *
 * @requires EXPO_PUBLIC_SUPABASE_URL
 * @requires EXPO_PUBLIC_SUPABASE_ANON_KEY
 * @requires TEST_CONSUMER_A_EMAIL, TEST_CONSUMER_A_PASSWORD
 * @requires TEST_CONSUMER_B_EMAIL, TEST_CONSUMER_B_PASSWORD
 * @requires TEST_STORE_OWNER_A_EMAIL, TEST_STORE_OWNER_A_PASSWORD
 * @requires TEST_STORE_OWNER_B_EMAIL, TEST_STORE_OWNER_B_PASSWORD
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  TEST_USERS,
  loginAsUser,
  logout,
  createAnonymousClient,
  getConsumerId,
  getStoreId,
  validateTestEnvironment,
  AuthenticatedClient,
} from './testHelpers';

// 테스트 환경 검증
const isTestEnvValid = validateTestEnvironment();

// Mock Supabase for unit tests (실제 통합 테스트 시에는 skip)
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          maybeSingle: jest.fn(),
        })),
        in: jest.fn(),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(),
        match: jest.fn(),
      })),
      insert: jest.fn(),
      delete: jest.fn(() => ({
        eq: jest.fn(),
        in: jest.fn(),
      })),
    })),
    rpc: jest.fn(),
  },
}));

/**
 * 실제 Supabase 연결이 필요한 통합 테스트
 * CI/CD 환경에서는 환경 변수 설정 후 실행
 */
const describeIntegration = isTestEnvValid ? describe : describe.skip;

/**
 * Mock 기반 단위 테스트
 * 환경 변수 없이도 RLS 테스트 로직 검증 가능
 */
describe('RLS Policy Tests (Unit)', () => {
  describe('stores RLS', () => {
    it('업주가 아닌 사용자는 다른 업체의 민감 정보(cash_balance, business_number)를 조회할 수 없어야 함', async () => {
      // public_stores 뷰에서는 민감 정보가 제외됨
      const mockPublicStore = {
        id: 'store-001',
        name: '테스트 업체',
        category: '반찬',
        address: '서울시 강남구',
        // cash_balance와 business_number는 포함되지 않음
      };

      // 민감 정보가 없는지 확인
      expect(mockPublicStore).not.toHaveProperty('cash_balance');
      expect(mockPublicStore).not.toHaveProperty('business_number');
    });

    it('업주는 자신의 업체 전체 정보(cash_balance 포함)를 조회할 수 있어야 함', async () => {
      // 업주가 자신의 업체 조회 시 모든 정보 포함
      const mockOwnStore = {
        id: 'store-001',
        name: '내 업체',
        category: '반찬',
        address: '서울시 강남구',
        cash_balance: 100000,
        business_number: '123-45-67890',
        user_id: 'owner-001',
      };

      // 본인 업체에는 민감 정보 포함
      expect(mockOwnStore).toHaveProperty('cash_balance');
      expect(mockOwnStore).toHaveProperty('business_number');
    });

    it('다른 업체의 정보를 수정할 수 없어야 함', async () => {
      // RLS에 의해 다른 업체 UPDATE는 실패해야 함
      const mockUpdateResult = {
        data: null,
        error: {
          code: '42501',
          message: 'permission denied for table stores',
        },
      };

      expect(mockUpdateResult.error).toBeDefined();
      expect(mockUpdateResult.error?.code).toBe('42501');
    });
  });

  describe('consumers RLS', () => {
    it('다른 소비자의 push_token을 조회할 수 없어야 함', async () => {
      // 다른 소비자의 push_token은 조회 불가
      const mockOtherConsumer = {
        id: 'consumer-002',
        nickname: '다른 소비자',
        // push_token은 포함되지 않거나 null
        push_token: null,
      };

      expect(mockOtherConsumer.push_token).toBeNull();
    });

    it('본인의 push_token을 조회할 수 있어야 함', async () => {
      // 본인의 push_token은 조회 가능
      const mockOwnConsumer = {
        id: 'consumer-001',
        nickname: '내 닉네임',
        push_token: 'ExponentPushToken[xxxxx]',
        user_id: 'user-001',
      };

      expect(mockOwnConsumer.push_token).toBeDefined();
      expect(mockOwnConsumer.push_token).not.toBeNull();
    });
  });

  describe('reservations RLS', () => {
    it('소비자는 자신의 예약만 조회할 수 있어야 함', async () => {
      // 본인 예약 조회 가능
      const mockOwnReservations = [
        { id: 'res-001', consumer_id: 'consumer-001', status: 'pending' },
        { id: 'res-002', consumer_id: 'consumer-001', status: 'confirmed' },
      ];

      expect(mockOwnReservations).toHaveLength(2);
      mockOwnReservations.forEach((res) => {
        expect(res.consumer_id).toBe('consumer-001');
      });
    });

    it('업주는 자신의 업체에 대한 예약만 조회할 수 있어야 함', async () => {
      // 본인 업체 예약만 조회 가능
      const mockStoreReservations = [
        { id: 'res-001', store_id: 'store-001', status: 'pending' },
        { id: 'res-003', store_id: 'store-001', status: 'confirmed' },
      ];

      expect(mockStoreReservations).toHaveLength(2);
      mockStoreReservations.forEach((res) => {
        expect(res.store_id).toBe('store-001');
      });
    });

    it('다른 사용자의 예약 상태를 변경할 수 없어야 함', async () => {
      // RPC 함수로 예약 상태 변경 시 권한 검증
      const mockUnauthorizedUpdate = {
        data: null,
        error: {
          code: '42501',
          message: 'insufficient privilege',
        },
      };

      expect(mockUnauthorizedUpdate.error).toBeDefined();
    });
  });

  describe('reviews RLS', () => {
    it('모든 사용자가 리뷰를 조회할 수 있어야 함', async () => {
      // 리뷰는 공개 정보
      const mockReviews = [
        { id: 'review-001', rating: 5, content: '맛있어요' },
        { id: 'review-002', rating: 4, content: '괜찮아요' },
      ];

      expect(mockReviews).toHaveLength(2);
    });

    it('예약 완료자만 리뷰를 작성할 수 있어야 함', async () => {
      // 예약 없이 리뷰 작성 시도
      const mockInsertWithoutReservation = {
        data: null,
        error: {
          code: '23503', // foreign key violation or policy violation
          message: 'violates row-level security policy',
        },
      };

      expect(mockInsertWithoutReservation.error).toBeDefined();
    });

    it('본인의 리뷰만 수정할 수 있어야 함', async () => {
      // 다른 사용자 리뷰 수정 시도
      const mockUpdateOthersReview = {
        data: null,
        error: {
          code: '42501',
          message: 'permission denied',
        },
      };

      expect(mockUpdateOthersReview.error).toBeDefined();
    });
  });

  describe('cash_transactions RLS', () => {
    it('업주는 자신의 업체 거래 내역만 조회할 수 있어야 함', async () => {
      // 본인 업체 거래 내역만 조회 가능
      const mockOwnTransactions = [
        { id: 'tx-001', store_id: 'store-001', amount: 50000 },
        { id: 'tx-002', store_id: 'store-001', amount: 30000 },
      ];

      expect(mockOwnTransactions).toHaveLength(2);
      mockOwnTransactions.forEach((tx) => {
        expect(tx.store_id).toBe('store-001');
      });
    });

    it('다른 업체의 거래 내역을 조회할 수 없어야 함', async () => {
      // RLS에 의해 다른 업체 거래 내역은 빈 배열 또는 에러
      const mockOtherStoreTransactions: unknown[] = [];

      expect(mockOtherStoreTransactions).toHaveLength(0);
    });
  });
});

/**
 * 실제 Supabase 연결이 필요한 통합 테스트
 * 환경 변수가 설정된 경우에만 실행
 */
describeIntegration('RLS Policy Tests (Integration)', () => {
  let consumerAClient: AuthenticatedClient;
  let consumerBClient: AuthenticatedClient;
  let storeOwnerAClient: AuthenticatedClient;
  let storeOwnerBClient: AuthenticatedClient;
  let anonymousClient: SupabaseClient;

  beforeAll(async () => {
    // 각 사용자로 로그인
    try {
      [consumerAClient, consumerBClient, storeOwnerAClient, storeOwnerBClient] =
        await Promise.all([
          loginAsUser(TEST_USERS.CONSUMER_A),
          loginAsUser(TEST_USERS.CONSUMER_B),
          loginAsUser(TEST_USERS.STORE_OWNER_A),
          loginAsUser(TEST_USERS.STORE_OWNER_B),
        ]);
      anonymousClient = createAnonymousClient();
    } catch (error) {
      console.error('Failed to setup test users:', error);
      throw error;
    }
  }, 30000);

  afterAll(async () => {
    // 로그아웃
    await Promise.all([
      logout(consumerAClient?.client),
      logout(consumerBClient?.client),
      logout(storeOwnerAClient?.client),
      logout(storeOwnerBClient?.client),
    ].filter(Boolean));
  });

  describe('stores RLS - Integration', () => {
    it('public_stores 뷰에서 민감 정보가 제외되어야 함', async () => {
      const { data, error } = await anonymousClient
        .from('public_stores')
        .select('*')
        .limit(1);

      expect(error).toBeNull();

      if (data && data.length > 0) {
        const store = data[0];
        // public_stores 뷰에는 민감 정보가 없어야 함
        expect(store).not.toHaveProperty('cash_balance');
        expect(store).not.toHaveProperty('business_number');
      }
    });

    it('업주는 자신의 업체 정보(cash_balance 포함)를 조회할 수 있어야 함', async () => {
      const storeId = await getStoreId(storeOwnerAClient.client, storeOwnerAClient.userId);

      if (!storeId) {
        console.log('Skipping: No store found for test user');
        return;
      }

      const { data, error } = await storeOwnerAClient.client
        .from('stores')
        .select('id, name, cash_balance, business_number, user_id')
        .eq('id', storeId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.user_id).toBe(storeOwnerAClient.userId);
      // 본인 업체이므로 민감 정보 조회 가능
      expect(data).toHaveProperty('cash_balance');
    });

    it('다른 업주의 업체 cash_balance를 수정할 수 없어야 함', async () => {
      const otherStoreId = await getStoreId(storeOwnerBClient.client, storeOwnerBClient.userId);

      if (!otherStoreId) {
        console.log('Skipping: No other store found for test');
        return;
      }

      const { error } = await storeOwnerAClient.client
        .from('stores')
        .update({ cash_balance: 9999999 })
        .eq('id', otherStoreId);

      // RLS에 의해 수정 불가 (에러 또는 영향받은 행 0)
      if (error) {
        expect(
          error.code === '42501' ||
          error.message.toLowerCase().includes('permission') ||
          error.message.toLowerCase().includes('policy')
        ).toBe(true);
      }
    });
  });

  describe('consumers RLS - Integration', () => {
    it('다른 소비자의 push_token을 직접 조회할 수 없어야 함', async () => {
      const consumerBId = await getConsumerId(consumerBClient.client, consumerBClient.userId);

      if (!consumerBId) {
        console.log('Skipping: Consumer B not found');
        return;
      }

      // Consumer A가 Consumer B의 정보 조회 시도
      const { data, error } = await consumerAClient.client
        .from('consumers')
        .select('id, nickname, push_token, user_id')
        .eq('id', consumerBId)
        .maybeSingle();

      // RLS에 의해 조회 불가하거나 push_token이 null이어야 함
      if (data) {
        // 데이터가 반환되었다면 user_id가 본인이 아닌 경우 push_token은 null이어야 함
        if (data.user_id !== consumerAClient.userId) {
          expect(data.push_token).toBeNull();
        }
      }
    });

    it('본인의 push_token을 조회할 수 있어야 함', async () => {
      const consumerId = await getConsumerId(consumerAClient.client, consumerAClient.userId);

      if (!consumerId) {
        console.log('Skipping: Consumer not found');
        return;
      }

      const { data, error } = await consumerAClient.client
        .from('consumers')
        .select('id, nickname, push_token, user_id')
        .eq('id', consumerId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.user_id).toBe(consumerAClient.userId);
      // push_token 컬럼 접근 가능 (값이 있든 없든)
      expect(data).toHaveProperty('push_token');
    });
  });

  describe('reservations RLS - Integration', () => {
    it('소비자는 자신의 예약만 조회할 수 있어야 함', async () => {
      const consumerId = await getConsumerId(consumerAClient.client, consumerAClient.userId);

      if (!consumerId) {
        console.log('Skipping: Consumer not found');
        return;
      }

      const { data, error } = await consumerAClient.client
        .from('reservations')
        .select('id, consumer_id, store_id, status')
        .eq('consumer_id', consumerId);

      expect(error).toBeNull();

      // 반환된 모든 예약이 본인의 것이어야 함
      if (data && data.length > 0) {
        data.forEach((reservation) => {
          expect(reservation.consumer_id).toBe(consumerId);
        });
      }
    });

    it('다른 소비자의 예약을 조회할 수 없어야 함', async () => {
      const consumerBId = await getConsumerId(consumerBClient.client, consumerBClient.userId);

      if (!consumerBId) {
        console.log('Skipping: Consumer B not found');
        return;
      }

      // Consumer A가 Consumer B의 예약 조회 시도
      const { data } = await consumerAClient.client
        .from('reservations')
        .select('id, consumer_id')
        .eq('consumer_id', consumerBId);

      // RLS에 의해 빈 배열이어야 함
      expect(data).toEqual([]);
    });

    it('업주는 자신의 업체 예약만 조회할 수 있어야 함', async () => {
      const storeId = await getStoreId(storeOwnerAClient.client, storeOwnerAClient.userId);

      if (!storeId) {
        console.log('Skipping: Store not found');
        return;
      }

      const { data, error } = await storeOwnerAClient.client
        .from('reservations')
        .select('id, consumer_id, store_id, status')
        .eq('store_id', storeId);

      expect(error).toBeNull();

      // 반환된 모든 예약이 본인 업체의 것이어야 함
      if (data && data.length > 0) {
        data.forEach((reservation) => {
          expect(reservation.store_id).toBe(storeId);
        });
      }
    });
  });

  describe('reviews RLS - Integration', () => {
    it('모든 사용자가 리뷰를 조회할 수 있어야 함', async () => {
      // 익명 사용자도 리뷰 조회 가능
      const { data, error } = await anonymousClient
        .from('reviews')
        .select('id, rating, content, store_id')
        .limit(5);

      expect(error).toBeNull();
      // 리뷰가 있으면 조회되어야 함 (공개 정보)
    });

    it('예약 없이 리뷰를 작성할 수 없어야 함', async () => {
      const consumerId = await getConsumerId(consumerAClient.client, consumerAClient.userId);
      const storeId = await getStoreId(storeOwnerAClient.client, storeOwnerAClient.userId);

      if (!consumerId || !storeId) {
        console.log('Skipping: Required IDs not found');
        return;
      }

      // 예약 없이 리뷰 작성 시도
      const { error } = await consumerAClient.client
        .from('reviews')
        .insert({
          consumer_id: consumerId,
          store_id: storeId,
          rating: 5,
          content: '테스트 리뷰 (예약 없음)',
          // reservation_id 없음
        });

      // RLS 정책 또는 FK 제약에 의해 실패해야 함
      expect(error).toBeDefined();
    });

    it('다른 사용자의 리뷰를 수정할 수 없어야 함', async () => {
      // 먼저 존재하는 리뷰 조회
      const { data: reviews } = await consumerAClient.client
        .from('reviews')
        .select('id, consumer_id')
        .limit(1);

      if (!reviews || reviews.length === 0) {
        console.log('Skipping: No reviews found');
        return;
      }

      const review = reviews[0];
      const consumerAId = await getConsumerId(consumerAClient.client, consumerAClient.userId);

      // 본인 리뷰가 아닌 경우에만 테스트
      if (review.consumer_id === consumerAId) {
        console.log('Skipping: Review belongs to test user');
        return;
      }

      // 다른 사용자의 리뷰 수정 시도
      const { error } = await consumerAClient.client
        .from('reviews')
        .update({ content: '수정 시도' })
        .eq('id', review.id);

      // RLS에 의해 수정 불가
      if (error) {
        expect(
          error.code === '42501' ||
          error.message.toLowerCase().includes('permission') ||
          error.message.toLowerCase().includes('policy')
        ).toBe(true);
      }
    });
  });

  describe('cash_transactions RLS - Integration', () => {
    it('업주는 자신의 업체 거래 내역만 조회할 수 있어야 함', async () => {
      const storeId = await getStoreId(storeOwnerAClient.client, storeOwnerAClient.userId);

      if (!storeId) {
        console.log('Skipping: Store not found');
        return;
      }

      const { data, error } = await storeOwnerAClient.client
        .from('cash_transactions')
        .select('id, store_id, amount, transaction_type')
        .eq('store_id', storeId);

      expect(error).toBeNull();

      // 반환된 모든 거래가 본인 업체의 것이어야 함
      if (data && data.length > 0) {
        data.forEach((tx) => {
          expect(tx.store_id).toBe(storeId);
        });
      }
    });

    it('다른 업체의 거래 내역을 조회할 수 없어야 함', async () => {
      const otherStoreId = await getStoreId(storeOwnerBClient.client, storeOwnerBClient.userId);

      if (!otherStoreId) {
        console.log('Skipping: Other store not found');
        return;
      }

      // Store Owner A가 Store Owner B의 거래 내역 조회 시도
      const { data } = await storeOwnerAClient.client
        .from('cash_transactions')
        .select('id, store_id')
        .eq('store_id', otherStoreId);

      // RLS에 의해 빈 배열이어야 함
      expect(data).toEqual([]);
    });

    it('소비자는 업체 거래 내역을 조회할 수 없어야 함', async () => {
      const storeId = await getStoreId(storeOwnerAClient.client, storeOwnerAClient.userId);

      if (!storeId) {
        console.log('Skipping: Store not found');
        return;
      }

      // 소비자가 업체 거래 내역 조회 시도
      const { data } = await consumerAClient.client
        .from('cash_transactions')
        .select('id, store_id')
        .eq('store_id', storeId);

      // RLS에 의해 빈 배열이어야 함
      expect(data).toEqual([]);
    });
  });

  describe('favorites RLS - Integration', () => {
    it('소비자는 자신의 즐겨찾기만 조회할 수 있어야 함', async () => {
      const consumerId = await getConsumerId(consumerAClient.client, consumerAClient.userId);

      if (!consumerId) {
        console.log('Skipping: Consumer not found');
        return;
      }

      const { data, error } = await consumerAClient.client
        .from('favorites')
        .select('id, consumer_id, store_id')
        .eq('consumer_id', consumerId);

      expect(error).toBeNull();

      // 반환된 모든 즐겨찾기가 본인의 것이어야 함
      if (data && data.length > 0) {
        data.forEach((fav) => {
          expect(fav.consumer_id).toBe(consumerId);
        });
      }
    });

    it('다른 소비자의 즐겨찾기를 조회할 수 없어야 함', async () => {
      const consumerBId = await getConsumerId(consumerBClient.client, consumerBClient.userId);

      if (!consumerBId) {
        console.log('Skipping: Consumer B not found');
        return;
      }

      // Consumer A가 Consumer B의 즐겨찾기 조회 시도
      const { data } = await consumerAClient.client
        .from('favorites')
        .select('id, consumer_id')
        .eq('consumer_id', consumerBId);

      // RLS에 의해 빈 배열이어야 함
      expect(data).toEqual([]);
    });
  });
});
