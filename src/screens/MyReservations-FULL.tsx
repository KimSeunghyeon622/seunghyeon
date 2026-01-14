import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Clipboard, Modal, TextInput, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

interface MyReservationsFullProps {
  onBack: () => void;
  onWriteReview: (reservation: any) => void;
}

export default function MyReservationsFull({ onBack, onWriteReview }: MyReservationsFullProps) {
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<any[]>([]);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: consumer } = await supabase.from('consumers').select('id').eq('user_id', user.id).single();
      if (!consumer) return;

      const { data, error } = await supabase
        .from('reservations')
        .select('*, stores(name, address, phone, refund_policy, no_show_policy), products(name)')
        .eq('consumer_id', consumer.id)
        .eq('picked_up', false)
        .in('status', ['confirmed', 'pending'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error('예약 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickupComplete = async (reservationId: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ picked_up: true, picked_up_at: new Date().toISOString() })
        .eq('id', reservationId);

      if (error) throw error;

      const reservation = reservations.find(r => r.id === reservationId);
      onWriteReview(reservation);
    } catch (error) {
      console.error('픽업 완료 오류:', error);
      alert('픽업 완료 처리에 실패했습니다.');
    }
  };

  const copyAddress = (address: string) => {
    Clipboard.setString(address);
    alert('주소가 복사되었습니다.');
  };

  const openCancelModal = (reservationId: string) => {
    setSelectedReservationId(reservationId);
    setCancelModalVisible(true);
  };

  const handleCancelReservation = async () => {
    if (!selectedReservationId) return;
    if (!cancelReason.trim()) {
      Alert.alert('알림', '취소 사유를 입력해주세요.');
      return;
    }

    try {
      const { error } = await supabase
        .from('reservations')
        .update({
          status: 'cancelled_by_consumer',
          cancel_reason: cancelReason.trim()
        })
        .eq('id', selectedReservationId);

      if (error) throw error;

      Alert.alert('완료', '예약이 취소되었습니다.');
      setCancelModalVisible(false);
      setCancelReason('');
      setSelectedReservationId(null);
      fetchReservations(); // 목록 새로고침
    } catch (error) {
      console.error('예약 취소 오류:', error);
      Alert.alert('오류', '예약 취소에 실패했습니다.');
    }
  };

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
        <Text style={styles.notificationIcon}>🔔</Text>
      </View>

      <View style={styles.topTab}>
        <TouchableOpacity style={styles.topTabButton}>
          <Text style={styles.topTabTextActive}>내 매장 예약</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.topTabButton, { backgroundColor: '#E8F5E9' }]}>
          <Text style={styles.topTabText}>나의 예약</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {reservations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>예약 내역이 없습니다.</Text>
          </View>
        ) : (
          reservations.map((reservation) => (
            <View key={reservation.id} style={styles.reservationCard}>
              <View style={styles.reservationHeader}>
                <Text style={styles.reservationNumber}>예약번호 #{reservation.reservation_number}</Text>
                <Text style={[styles.reservationStatus, reservation.status === 'confirmed' ? styles.statusConfirmed : styles.statusPending]}>
                  {reservation.status === 'confirmed' ? '예약 확정' : '곧 방문'}
                </Text>
              </View>

              <Text style={styles.storeName}>{reservation.stores?.name}</Text>

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
                  픽업 예약 시간: {reservation.pickup_time ? new Date(reservation.pickup_time).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}
                </Text>
              </View>

              <View style={styles.storeInfoBox}>
                <View style={styles.storeInfoRow}>
                  <Text style={styles.storeInfoIcon}>📍</Text>
                  <Text style={styles.storeInfoText}>{reservation.stores?.address}</Text>
                  <TouchableOpacity onPress={() => copyAddress(reservation.stores?.address)}>
                    <Text style={styles.copyButton}>복사</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.storeInfoRow}>
                  <Text style={styles.storeInfoIcon}>📞</Text>
                  <Text style={styles.storeInfoText}>{reservation.stores?.phone}</Text>
                  <TouchableOpacity>
                    <Text style={styles.callButton}>전화하기</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.policyBox}>
                <Text style={styles.policyTitle}>환불 및 노쇼 정책</Text>
                <Text style={styles.policyText}>• {reservation.stores?.refund_policy}</Text>
                <Text style={styles.policyText}>• {reservation.stores?.no_show_policy}</Text>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => openCancelModal(reservation.id)}
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
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 취소 모달 */}
      <Modal
        visible={cancelModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>예약 취소</Text>
            <Text style={styles.modalSubtitle}>취소 사유를 입력해주세요</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="예: 일정이 변경되어서, 다른 곳 예약함 등"
              placeholderTextColor="#999"
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setCancelModalVisible(false);
                  setCancelReason('');
                  setSelectedReservationId(null);
                }}
              >
                <Text style={styles.modalButtonTextCancel}>닫기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleCancelReservation}
              >
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
  notificationIcon: { fontSize: 24 },
  topTab: { flexDirection: 'row', backgroundColor: '#FFF', padding: 15, gap: 10 },
  topTabButton: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#1A1A2E', alignItems: 'center' },
  topTabText: { fontSize: 14, fontWeight: '600', color: '#00A84D' },
  topTabTextActive: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  scrollView: { flex: 1, paddingHorizontal: 20, paddingTop: 15 },
  emptyContainer: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#999' },
  reservationCard: { backgroundColor: '#FFF', padding: 18, borderRadius: 12, marginBottom: 12 },
  reservationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  reservationNumber: { fontSize: 13, color: '#999' },
  reservationStatus: { fontSize: 13, fontWeight: '600', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusConfirmed: { backgroundColor: '#E8F5E9', color: '#00A84D' },
  statusPending: { backgroundColor: '#FFE5E5', color: '#FF9800' },
  storeName: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8 },
  productIcon: { fontSize: 24 },
  productName: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 4 },
  productPrice: { fontSize: 16, fontWeight: 'bold', color: '#00D563' },
  priceLabel: { fontSize: 13, color: '#666', fontWeight: 'normal' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  timeIcon: { fontSize: 18 },
  timeText: { fontSize: 14, color: '#666' },
  storeInfoBox: { backgroundColor: '#F9F9F9', padding: 12, borderRadius: 8, marginBottom: 12 },
  storeInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  storeInfoIcon: { fontSize: 16, marginRight: 8 },
  storeInfoText: { flex: 1, fontSize: 13, color: '#333' },
  copyButton: { fontSize: 13, color: '#00D563', fontWeight: '600' },
  callButton: { fontSize: 13, color: '#007AFF', fontWeight: '600' },
  policyBox: { backgroundColor: '#FFF4E5', padding: 12, borderRadius: 8, marginBottom: 12 },
  policyTitle: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6 },
  policyText: { fontSize: 12, color: '#666', lineHeight: 18, marginBottom: 2 },
  buttonRow: { flexDirection: 'row', gap: 10 },
  cancelButton: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center' },
  cancelButtonText: { fontSize: 14, fontWeight: '600', color: '#666' },
  completeButton: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#00D563', alignItems: 'center' },
  completeButtonText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  // 모달 스타일
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  modalInput: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 12, fontSize: 14, color: '#333', minHeight: 80, textAlignVertical: 'top', marginBottom: 20 },
  modalButtonRow: { flexDirection: 'row', gap: 10 },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  modalButtonCancel: { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  modalButtonConfirm: { backgroundColor: '#FF6B6B' },
  modalButtonTextCancel: { fontSize: 14, fontWeight: '600', color: '#666' },
  modalButtonTextConfirm: { fontSize: 14, fontWeight: '600', color: '#FFF' },
});
