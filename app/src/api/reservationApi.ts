/**
 * 예약(Reservation) 관련 API 함수
 */
import { supabase } from '../lib/supabase';
import type { Reservation, ReservationWithDetails } from '../types';
import { ReservationStatus } from '../constants';

// 보안 예약 생성 (서버 측 가격 검증)
export async function createReservationSecure(
  productId: string,
  quantity: number,
  pickupTime: string
) {
  const { data, error } = await supabase.rpc('create_reservation_secure', {
    p_product_id: productId,
    p_quantity: quantity,
    p_pickup_time: pickupTime,
  });

  if (error) throw error;

  const result = data?.[0];
  if (!result?.success) {
    throw new Error(result?.error_message || '예약 생성에 실패했습니다');
  }

  return {
    reservationNumber: result.reservation_number,
    totalAmount: result.total_amount,
  };
}

// 소비자의 예약 목록 조회
export async function fetchConsumerReservations(consumerId: string) {
  const { data, error } = await supabase
    .from('reservations')
    .select('*, stores(name, address, phone, refund_policy, no_show_policy), products(name, image_url)')
    .eq('consumer_id', consumerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as ReservationWithDetails[];
}

// 소비자의 활성 예약 목록 조회 (대기/확정 상태)
export async function fetchActiveReservations(consumerId: string) {
  const { data, error } = await supabase
    .from('reservations')
    .select('*, stores(name, address, phone, refund_policy, no_show_policy), products(name)')
    .eq('consumer_id', consumerId)
    .eq('picked_up', false)
    .in('status', [ReservationStatus.CONFIRMED, ReservationStatus.PENDING])
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as ReservationWithDetails[];
}

// 업체의 예약 목록 조회 (업주용)
export async function fetchStoreReservations(storeId: string) {
  const { data, error } = await supabase
    .from('reservations')
    .select('*, consumers(nickname, phone), products(name)')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as ReservationWithDetails[];
}

// 예약 상태 업데이트 (RPC 함수 사용 - 보안 강화)
export async function updateReservationStatus(
  reservationId: string,
  status: string,
  cancelReason?: string
): Promise<{ success: boolean; message: string }> {
  const { data, error } = await supabase.rpc('update_reservation_status', {
    p_reservation_id: reservationId,
    p_new_status: status,
    p_cancel_reason: cancelReason || null,
  });

  if (error) throw error;

  const result = data?.[0];
  if (!result?.success) {
    throw new Error(result?.message || '예약 상태 변경에 실패했습니다');
  }

  return { success: true, message: result.message };
}

// 픽업 완료 처리 (RPC 함수 사용)
export async function markAsPickedUp(reservationId: string) {
  return updateReservationStatus(reservationId, ReservationStatus.COMPLETED);
}

// 예약 취소
export async function cancelReservation(reservationId: string, reason: string) {
  return updateReservationStatus(reservationId, ReservationStatus.CANCELLED, reason);
}
