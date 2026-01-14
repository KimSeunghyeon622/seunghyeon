import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

interface StoreReservationManagementNewProps {
  onBack: () => void;
}

export default function StoreReservationManagementNew({ onBack }: StoreReservationManagementNewProps) {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pickup' | 'completed'>('pickup');
  const [reservations, setReservations] = useState<any[]>([]);
  const [cancelModal, setCancelModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: store } = await supabase.from('stores').select('id').eq('user_id', user.id).single();
      if (!store) return;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('reservations')
        .select('*, consumers(nickname), products(name, image_url)')
        .eq('store_id', store.id)
        .gte('created_at', oneWeekAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error('예약 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickupComplete = (reservationId: string) => {
    Alert.alert(
      '픽업 완료 확인',
      '고객이 상품을 픽업했습니까?\n픽업 완료 처리 후에는 되돌릴 수 없습니다.',
      [
        {
          text: '취소',
          style: 'cancel'
        },
        {
          text: '픽업 완료',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('reservations')
                .update({ status: 'completed', picked_up: true, picked_up_at: new Date().toISOString() })
                .eq('id', reservationId);

              if (error) throw error;
              Alert.alert('완료', '픽업이 완료되었습니다.');
              fetchReservations();
            } catch (error) {
              console.error('픽업 완료 오류:', error);
              Alert.alert('오류', '픽업 완료 처리에 실패했습니다.');
            }
          }
        }
      ]
    );
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      alert('취소 사유를 입력해주세요.');
      return;
    }
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled_by_store', cancel_reason: cancelReason })
        .eq('id', selectedReservation.id);

      if (error) throw error;
      alert('예약이 취소되었습니다.');
      setCancelModal(false);
      setSelectedReservation(null);
      setCancelReason('');
      fetchReservations();
    } catch (error) {
      console.error('예약 취소 오류:', error);
      alert('예약 취소에 실패했습니다.');
    }
  };

  const pickupReservations = reservations.filter((r) => r.status === 'confirmed' && !r.picked_up);
  const completedReservations = reservations.filter((r) => r.status === 'completed' || r.picked_up);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D563" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💚 Save It</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.topTab}>
        <TouchableOpacity style={styles.topTabButton}>
          <Text style={styles.topTabTextActive}>내 매장 예약</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.topTabButton, { backgroundColor: '#E8F5E9' }]}>
          <Text style={styles.topTabText}>나의 예약</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.subTab}>
        <TouchableOpacity
          style={[styles.subTabButton, tab === 'pickup' && styles.subTabButtonActive]}
          onPress={() => setTab('pickup')}
        >
          <Text style={[styles.subTabText, tab === 'pickup' && styles.subTabTextActive]}>픽업 대기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subTabButton, tab === 'completed' && styles.subTabButtonActive]}
          onPress={() => setTab('completed')}
        >
          <Text style={[styles.subTabText, tab === 'completed' && styles.subTabTextActive]}>완료됨</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {(tab === 'pickup' ? pickupReservations : completedReservations).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>예약이 없습니다.</Text>
          </View>
        ) : (
          (tab === 'pickup' ? pickupReservations : completedReservations).map((reservation) => (
            <View key={reservation.id} style={styles.reservationCard}>
              <View style={styles.reservationHeader}>
                <Text style={styles.reservationNumber}>예약번호 #{reservation.reservation_number}</Text>
                <Text style={[styles.reservationStatus, reservation.status === 'completed' ? styles.statusCompleted : styles.statusConfirmed]}>
                  {reservation.status === 'completed' ? '픽업 완료' : '예약 확정'}
                </Text>
              </View>
              <Text style={styles.storeName}>{reservation.consumers?.nickname || '고객'}</Text>

              <View style={styles.productRow}>
                <Text style={styles.productIcon}>🛒</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{reservation.products?.name} x{reservation.quantity}</Text>
                  <Text style={styles.productPrice}>{reservation.total_amount?.toLocaleString()}원 <Text style={styles.priceLabel}>(현장 결제)</Text></Text>
                </View>
              </View>

              <View style={styles.timeRow}>
                <Text style={styles.timeIcon}>🕐</Text>
                <Text style={styles.timeText}>
                  픽업 예약 시간: {new Date(reservation.pickup_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>

              {tab === 'pickup' ? (
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setSelectedReservation(reservation);
                      setCancelModal(true);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>예약 취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => handlePickupComplete(reservation.id)}
                  >
                    <Text style={styles.completeButtonText}>픽업 완료</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 취소 모달 */}
      <Modal visible={cancelModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>예약 취소</Text>
            <Text style={styles.modalLabel}>취소 사유를 입력해주세요</Text>
            <TextInput
              style={styles.modalInput}
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="예: 재고 소진, 영업 종료 등"
              placeholderTextColor="#999"
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setCancelModal(false);
                  setSelectedReservation(null);
                  setCancelReason('');
                }}
              >
                <Text style={styles.modalButtonTextCancel}>닫기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonConfirm]} onPress={handleCancel}>
                <Text style={styles.modalButtonTextConfirm}>취소하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  backButton: { fontSize: 28, color: '#333' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  topTab: { flexDirection: 'row', backgroundColor: '#FFF', padding: 15, gap: 10 },
  topTabButton: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#1A1A2E', alignItems: 'center' },
  topTabText: { fontSize: 14, fontWeight: '600', color: '#00A84D' },
  topTabTextActive: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  subTab: { flexDirection: 'row', backgroundColor: '#FFF', paddingHorizontal: 15, paddingBottom: 10, gap: 10 },
  subTabButton: { flex: 1, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center' },
  subTabButtonActive: { backgroundColor: '#00D563' },
  subTabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  subTabTextActive: { color: '#FFF' },
  scrollView: { flex: 1, paddingHorizontal: 20, paddingTop: 15 },
  emptyContainer: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#999' },
  reservationCard: { backgroundColor: '#FFF', padding: 18, borderRadius: 12, marginBottom: 12 },
  reservationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  reservationNumber: { fontSize: 13, color: '#999' },
  reservationStatus: { fontSize: 13, fontWeight: '600', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusConfirmed: { backgroundColor: '#E8F5E9', color: '#00A84D' },
  statusCompleted: { backgroundColor: '#FFE5E5', color: '#FF6B6B' },
  storeName: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8 },
  productIcon: { fontSize: 24 },
  productName: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 4 },
  productPrice: { fontSize: 16, fontWeight: 'bold', color: '#00D563' },
  priceLabel: { fontSize: 13, color: '#666', fontWeight: 'normal' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  timeIcon: { fontSize: 18 },
  timeText: { fontSize: 14, color: '#666' },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelButton: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center' },
  cancelButtonText: { fontSize: 14, fontWeight: '600', color: '#666' },
  completeButton: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#00D563', alignItems: 'center' },
  completeButtonText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  modalLabel: { fontSize: 14, color: '#666', marginBottom: 12 },
  modalInput: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 16, fontSize: 15, color: '#333', height: 100, textAlignVertical: 'top', marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  modalButtonCancel: { backgroundColor: '#F5F5F5' },
  modalButtonConfirm: { backgroundColor: '#FF6B6B' },
  modalButtonTextCancel: { fontSize: 15, fontWeight: '600', color: '#666' },
  modalButtonTextConfirm: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});
