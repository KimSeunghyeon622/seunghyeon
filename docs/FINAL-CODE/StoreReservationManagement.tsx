import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

interface Reservation {
  id: string;
  reservation_number: string;
  product: { name: string };
  consumer: { nickname: string };
  quantity: number;
  total_amount: number;
  pickup_time: string;
  status: string;
  created_at: string;
}

export default function StoreReservationManagement({ onBack }: { onBack: () => void }) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');

  const loadReservations = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 업체 정보 가져오기
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!store) {
        Alert.alert('오류', '업체 정보를 찾을 수 없습니다');
        return;
      }

      // 예약 목록 가져오기
      let query = supabase
        .from('reservations')
        .select('*, product:products(name), consumer:consumers(nickname)')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (data) setReservations(data);
    } catch (err: any) {
      console.error('예약 조회 오류:', err);
      Alert.alert('오류', '예약을 불러오는 중 문제가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  const updateStatus = async (reservationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: newStatus })
        .eq('id', reservationId);

      if (error) throw error;

      Alert.alert('완료', `예약 상태가 ${getStatusLabel(newStatus)}(으)로 변경되었습니다`);
      loadReservations();
    } catch (err: any) {
      console.error('상태 변경 오류:', err);
      Alert.alert('오류', '상태 변경 중 문제가 발생했습니다');
    }
  };

  const confirmReservation = (reservationId: string) => {
    Alert.alert(
      '예약 확인',
      '이 예약을 확인하시겠습니까?\n확인 시 15% 수수료가 차감됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: () => updateStatus(reservationId, 'confirmed'),
        },
      ]
    );
  };

  const completeReservation = (reservationId: string) => {
    Alert.alert(
      '픽업 완료',
      '고객이 상품을 픽업했나요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '완료',
          onPress: () => updateStatus(reservationId, 'completed'),
        },
      ]
    );
  };

  const cancelReservation = (reservationId: string) => {
    Alert.alert(
      '예약 취소',
      '이 예약을 취소하시겠습니까?',
      [
        { text: '아니오', style: 'cancel' },
        {
          text: '취소',
          style: 'destructive',
          onPress: () => updateStatus(reservationId, 'cancelled'),
        },
      ]
    );
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '대기중';
      case 'confirmed':
        return '확인됨';
      case 'completed':
        return '완료';
      case 'cancelled':
        return '취소됨';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'confirmed':
        return '#007AFF';
      case 'completed':
        return '#34C759';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#999';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>로딩 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.title}>예약 관리</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* 필터 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {[
          { key: 'all', label: '전체' },
          { key: 'pending', label: '대기중' },
          { key: 'confirmed', label: '확인됨' },
          { key: 'completed', label: '완료' },
          { key: 'cancelled', label: '취소됨' },
        ].map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.filterButton, filter === item.key && styles.filterButtonActive]}
            onPress={() => setFilter(item.key as any)}
          >
            <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 예약 목록 */}
      <ScrollView style={styles.content}>
        {reservations.length === 0 ? (
          <Text style={styles.emptyText}>예약이 없습니다</Text>
        ) : (
          reservations.map((reservation) => (
            <View key={reservation.id} style={styles.reservationCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.reservationNumber}>{reservation.reservation_number}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(reservation.status) }]}>
                  <Text style={styles.statusText}>{getStatusLabel(reservation.status)}</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.label}>고객: {reservation.consumer?.nickname || '알 수 없음'}</Text>
                <Text style={styles.label}>상품: {reservation.product?.name || '알 수 없음'}</Text>
                <Text style={styles.label}>수량: {reservation.quantity}개</Text>
                <Text style={styles.label}>금액: {reservation.total_amount?.toLocaleString() || 0}원</Text>
                <Text style={styles.label}>픽업 시간: {formatDate(reservation.pickup_time)}</Text>
                <Text style={styles.dateText}>예약 시간: {formatDate(reservation.created_at)}</Text>
              </View>

              {/* 액션 버튼 */}
              <View style={styles.actionButtons}>
                {reservation.status === 'pending' && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.confirmButton]}
                      onPress={() => confirmReservation(reservation.id)}
                    >
                      <Text style={styles.buttonText}>예약 확인</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={() => cancelReservation(reservation.id)}
                    >
                      <Text style={styles.buttonText}>취소</Text>
                    </TouchableOpacity>
                  </>
                )}

                {reservation.status === 'confirmed' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.completeButton]}
                    onPress={() => completeReservation(reservation.id)}
                  >
                    <Text style={styles.buttonText}>픽업 완료</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backText: { fontSize: 16, color: '#007AFF' },
  title: { fontSize: 20, fontWeight: 'bold' },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  filterButtonActive: { backgroundColor: '#007AFF' },
  filterText: { fontSize: 14, color: '#666' },
  filterTextActive: { color: '#fff', fontWeight: 'bold' },
  content: { flex: 1, padding: 15 },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#999' },
  reservationCard: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 15 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reservationNumber: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  cardBody: { marginBottom: 15 },
  label: { fontSize: 14, color: '#333', marginBottom: 5 },
  dateText: { fontSize: 12, color: '#999', marginTop: 5 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  confirmButton: { backgroundColor: '#007AFF' },
  completeButton: { backgroundColor: '#34C759' },
  cancelButton: { backgroundColor: '#FF3B30' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
