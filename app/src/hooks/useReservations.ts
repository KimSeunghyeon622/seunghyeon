/**
 * 예약 관련 커스텀 훅
 */
import { useCallback, useEffect, useState } from 'react';
import {
  fetchActiveReservations,
  fetchConsumerReservations,
  fetchStoreReservations,
  createReservationSecure,
  cancelReservation,
  markAsPickedUp,
} from '../api';
import type { ReservationWithDetails } from '../types';

// 소비자용 예약 목록 훅
export function useConsumerReservations(consumerId: string | null) {
  const [reservations, setReservations] = useState<ReservationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadReservations = useCallback(async () => {
    if (!consumerId) {
      setReservations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchActiveReservations(consumerId);
      setReservations(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('예약 목록 로딩 실패'));
    } finally {
      setLoading(false);
    }
  }, [consumerId]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  // 예약 취소
  const cancel = useCallback(async (reservationId: string, reason: string) => {
    await cancelReservation(reservationId, reason);
    await loadReservations(); // 목록 새로고침
  }, [loadReservations]);

  // 픽업 완료
  const completePickup = useCallback(async (reservationId: string) => {
    await markAsPickedUp(reservationId);
    await loadReservations();
  }, [loadReservations]);

  return {
    reservations,
    loading,
    error,
    refresh: loadReservations,
    cancel,
    completePickup,
  };
}

// 업체용 예약 관리 훅
export function useStoreReservations(storeId: string | null) {
  const [reservations, setReservations] = useState<ReservationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadReservations = useCallback(async () => {
    if (!storeId) {
      setReservations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchStoreReservations(storeId);
      setReservations(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('예약 목록 로딩 실패'));
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  return {
    reservations,
    loading,
    error,
    refresh: loadReservations,
  };
}

// 예약 생성 훅
export function useCreateReservation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = useCallback(async (
    productId: string,
    quantity: number,
    pickupTime: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await createReservationSecure(productId, quantity, pickupTime);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('예약 생성 실패');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    create,
    loading,
    error,
  };
}
