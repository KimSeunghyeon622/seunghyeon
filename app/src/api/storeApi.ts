/**
 * 업체(Store) 관련 API 함수
 * Supabase 쿼리를 중앙 집중화하여 관리
 */
import { supabase } from '../lib/supabase';
import type { Store, Product } from '../types';

// 모든 승인된 업체 목록 조회
export async function fetchStores() {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Store[];
}

// 업체 상세 정보 조회
export async function fetchStoreById(storeId: string) {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', storeId)
    .single();

  if (error) throw error;
  return data as Store;
}

// 내 업체 정보 조회 (업주용)
export async function fetchMyStore(userId: string) {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data as Store;
}

// 업체 정보 수정
export async function updateStore(storeId: string, updates: Partial<Store>) {
  const { data, error } = await supabase
    .from('stores')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', storeId)
    .select()
    .single();

  if (error) throw error;
  return data as Store;
}

// 업체의 활성 상품 목록 조회
export async function fetchStoreProducts(storeId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .gt('stock_quantity', 0)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Product[];
}

// 업체의 모든 상품 목록 조회 (업주용)
export async function fetchAllStoreProducts(storeId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Product[];
}

/**
 * 업체 평점 업데이트 (리뷰 작성 후 호출)
 * @deprecated DB 트리거로 자동 계산됨. 이 함수는 더 이상 호출할 필요 없음.
 * reviews 테이블에 INSERT/UPDATE/DELETE 시 stores.average_rating, review_count가 자동 업데이트됨.
 * 기존 코드 호환성을 위해 유지하지만, 새 코드에서는 사용하지 마세요.
 */
export async function updateStoreRating(storeId: string, newRating: number, newReviewCount: number) {
  console.warn('updateStoreRating: DB 트리거로 자동 계산되므로 이 함수 호출 불필요');

  const { error } = await supabase
    .from('stores')
    .update({
      average_rating: newRating,
      review_count: newReviewCount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', storeId);

  if (error) throw error;
}
