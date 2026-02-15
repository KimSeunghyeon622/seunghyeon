import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Clipboard,
  Dimensions,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { supabase } from '../lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.8;

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_store_id?: string;
}

interface MyReservationsFullProps {
  onBack: () => void;
  onWriteReview: (reservation: any) => void;
  onNavigateToStore?: (storeId: string) => void;
}

export default function MyReservationsFull({ onBack, onWriteReview, onNavigateToStore }: MyReservationsFullProps) {
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<any[]>([]);
  const [storeReservations, setStoreReservations] = useState<any[]>([]);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [activeTab, setActiveTab] = useState<'my' | 'store'>('my');
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeUserId, setStoreUserId] = useState<string | null>(null);

  // 업주용 취소 모달 상태
  const [storeCancelModalVisible, setStoreCancelModalVisible] = useState(false);
  const [storeCancelReservation, setStoreCancelReservation] = useState<any>(null);
  const [storeCancelReason, setStoreCancelReason] = useState('');

  // 알림 사이드바 상태
  const [notificationSidebarVisible, setNotificationSidebarVisible] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const sidebarAnim = useRef(new Animated.Value(SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // 픽업 시간 포맷팅 함수
  const formatPickupTime = (pickupTime: string) => {
    const date = new Date(pickupTime);
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hour = String(date.getUTCHours()).padStart(2, '0');
    const minute = String(date.getUTCMinutes()).padStart(2, '0');
    return `${month}월 ${day}일 ${hour}:${minute}`;
  };

  // 상대 시간 포맷팅 (알림용)
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 취소 가능 여부 체크 (픽업 2시간 전까지만 가능)
  const canCancelReservation = (pickupTime: string): boolean => {
    const pickup = new Date(pickupTime);
    const now = new Date();
    const hoursUntilPickup = (pickup.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilPickup >= 2;
  };

  // 알림 사이드바 열기
  const openNotificationSidebar = () => {
    setNotificationSidebarVisible(true);
    fetchNotifications();
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // 알림 사이드바 닫기
  const closeNotificationSidebar = () => {
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: SIDEBAR_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setNotificationSidebarVisible(false);
    });
  };

  // 알림 조회
  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('알림 조회 오류:', error);
        return;
      }

      setNotifications(data || []);
      setUnreadCount(data?.filter((n: Notification) => !n.is_read).length || 0);
    } catch (error) {
      console.error('알림 조회 오류:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // 알림 읽음 처리
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('알림 읽음 처리 오류:', error);
    }
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('전체 읽음 처리 오류:', error);
    }
  };

  useEffect(() => {
    fetchReservations();
    // 초기 안읽은 알림 개수 조회
    fetchUnreadCount();
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (!error && count !== null) {
        setUnreadCount(count);
      }
    } catch (error) {
      console.error('안읽은 알림 개수 조회 오류:', error);
    }
  };

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 소비자 ID 조회
      const { data: consumer } = await supabase
        .from('consumers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      // 업주 정보 조회 (매장 ID 확인)
      const { data: store } = await supabase
        .from('stores')
        .select('id, user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (store) {
        setStoreId(store.id);
        setStoreUserId(store.user_id);
        setActiveTab('store'); // 업주일 경우 '내 매장 예약' 탭 디폴트
      }

      // 나의 예약 (소비자로서 한 예약)
      if (consumer) {
        const { data, error } = await supabase
          .from('reservations')
          .select('*, stores(name, address, phone, user_id), products(name)')
          .eq('consumer_id', consumer.id)
          .eq('picked_up', false)
          .in('status', ['confirmed', 'pending'])
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReservations(data || []);
      }

      // 내 매장 예약 (내 매장에 들어온 예약)
      if (store) {
        const { data: storeData, error: storeError } = await supabase
          .from('reservations')
          .select('*, consumers(id, nickname, phone, user_id), products(name)')
          .eq('store_id', store.id)
          .eq('picked_up', false)
          .in('status', ['confirmed', 'pending', 'cancelled_by_consumer'])
          .order('created_at', { ascending: false });

        if (storeError) throw storeError;

        // RLS 정책으로 인해 consumers JOIN이 실패할 경우 별도로 조회
        const reservationsWithConsumers = await Promise.all(
          (storeData || []).map(async (reservation) => {
            // consumers가 이미 있으면 그대로 사용
            if (reservation.consumers?.nickname || reservation.consumers?.phone) {
              return reservation;
            }

            // consumers가 없으면 consumer_id로 직접 조회
            if (reservation.consumer_id) {
              const { data: consumerData } = await supabase
                .from('consumers')
                .select('id, nickname, phone, user_id')
                .eq('id', reservation.consumer_id)
                .maybeSingle();

              return {
                ...reservation,
                consumers: consumerData
              };
            }

            return reservation;
          })
        );

        setStoreReservations(reservationsWithConsumers);
      }
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

      if (activeTab === 'my') {
        // 소비자 픽업 완료 시 리뷰 작성 선택 옵션 제공
        const reservation = reservations.find(r => r.id === reservationId);
        Alert.alert(
          '픽업 완료',
          '픽업이 완료되었습니다.\n리뷰를 작성하시겠습니까?',
          [
            {
              text: '나중에 작성하기',
              style: 'cancel',
              onPress: () => fetchReservations()
            },
            {
              text: '리뷰 작성',
              onPress: () => onWriteReview(reservation)
            }
          ]
        );
      } else {
        Alert.alert('완료', '픽업이 완료되었습니다.');
        fetchReservations();
      }
    } catch (error) {
      console.error('픽업 완료 오류:', error);
      Alert.alert('오류', '픽업 완료 처리에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const copyAddress = (address: string) => {
    Clipboard.setString(address);
    Alert.alert('알림', '주소가 복사되었습니다.');
  };

  const handleCall = (phone: string) => {
    if (!phone) {
      Alert.alert('알림', '전화번호 정보가 없습니다.');
      return;
    }
    const phoneNumber = `tel:${phone.replace(/-/g, '')}`;
    Linking.canOpenURL(phoneNumber)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneNumber);
        } else {
          Alert.alert('알림', '전화 기능을 사용할 수 없습니다.');
        }
      })
      .catch((error) => {
        console.error('전화 연결 오류:', error);
        Alert.alert('오류', '전화 연결에 실패했습니다. 기기의 전화 앱 설정을 확인해주세요.');
      });
  };

  // 소비자용 취소 모달 열기 (2시간 체크 포함)
  const openCancelModal = (reservation: any) => {
    // 픽업 2시간 전 체크
    if (!canCancelReservation(reservation.pickup_time)) {
      Alert.alert(
        '예약 취소 불가',
        '픽업 2시간 전부터는 앱에서 취소가 불가합니다.\n업체에 직접 연락해주세요.',
        [
          { text: '닫기', style: 'cancel' },
          {
            text: '전화하기',
            onPress: () => handleCall(reservation.stores?.phone)
          }
        ]
      );
      return;
    }

    setSelectedReservationId(reservation.id);
    setSelectedReservation(reservation);
    setCancelModalVisible(true);
  };

  // 업주용 취소 모달 열기 (시간 제한 없음, 취소 사유 입력 모달 표시)
  const openStoreCancelModal = (reservation: any) => {
    setStoreCancelReservation(reservation);
    setStoreCancelReason('');
    setStoreCancelModalVisible(true);
  };

  // 소비자 예약 취소 처리
  const handleCancelReservation = async () => {
    if (!selectedReservationId || !selectedReservation) return;
    if (!cancelReason.trim()) {
      Alert.alert('알림', '취소 사유를 입력해주세요.');
      return;
    }

    try {
      // 예약 취소
      const { error } = await supabase
        .from('reservations')
        .update({
          status: 'cancelled_by_consumer',
          cancel_reason: cancelReason.trim()
        })
        .eq('id', selectedReservationId);

      if (error) throw error;

      // 업주에게 알림 생성
      const storeUserId = selectedReservation.stores?.user_id;
      if (storeUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: consumer } = await supabase
          .from('consumers')
          .select('nickname')
          .eq('user_id', user?.id)
          .maybeSingle();

        await supabase.from('notifications').insert({
          user_id: storeUserId,
          type: 'reservation_cancelled',
          title: '예약 취소 알림',
          message: `고객 '${consumer?.nickname || '고객'}'님이 예약을 취소했습니다.\n(사유: ${cancelReason.trim()})`,
          related_reservation_id: selectedReservationId,
          related_store_id: selectedReservation.store_id
        });
      }

      // 재고 복구 (optional - 필요시 RPC 함수로 처리)

      Alert.alert('완료', '예약이 취소되었습니다.');
      setCancelModalVisible(false);
      setCancelReason('');
      setSelectedReservationId(null);
      setSelectedReservation(null);
      fetchReservations();
    } catch (error) {
      console.error('예약 취소 오류:', error);
      Alert.alert('오류', '예약 취소에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  // 업주 예약 취소 처리 (취소 사유 포함)
  const handleStoreCancelReservation = async () => {
    if (!storeCancelReservation) return;
    if (!storeCancelReason.trim()) {
      Alert.alert('알림', '취소 사유를 입력해주세요.');
      return;
    }

    try {
      const { error } = await supabase
        .from('reservations')
        .update({
          status: 'cancelled_by_store',
          cancel_reason: storeCancelReason.trim()
        })
        .eq('id', storeCancelReservation.id);

      if (error) throw error;

      // 소비자에게 알림 생성
      const consumerUserId = storeCancelReservation.consumers?.user_id;
      if (consumerUserId) {
        const { data: store } = await supabase
          .from('stores')
          .select('name')
          .eq('id', storeCancelReservation.store_id)
          .single();

        await supabase.from('notifications').insert({
          user_id: consumerUserId,
          type: 'reservation_cancelled_by_store',
          title: '예약 취소 알림',
          message: `'${store?.name || '업체'}'에서 예약을 취소했습니다.\n상품: ${storeCancelReservation.products?.name}\n사유: ${storeCancelReason.trim()}`,
          related_reservation_id: storeCancelReservation.id,
          related_store_id: storeCancelReservation.store_id
        });
      }

      Alert.alert('완료', '예약이 취소되었습니다.');
      setStoreCancelModalVisible(false);
      setStoreCancelReason('');
      setStoreCancelReservation(null);
      fetchReservations();
    } catch (error) {
      console.error('업주 예약 취소 오류:', error);
      Alert.alert('오류', '예약 취소에 실패했습니다. 잠시 후 다시 시도해주세요.');
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
        <Text style={styles.headerTitle}>Save It</Text>
        <TouchableOpacity onPress={openNotificationSidebar} style={styles.notificationButton}>
          <Text style={styles.notificationIcon}>🔔</Text>
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.topTab}>
        <TouchableOpacity
          style={[styles.topTabButton, activeTab === 'store' && styles.topTabButtonActive]}
          onPress={() => setActiveTab('store')}
        >
          <Text style={activeTab === 'store' ? styles.topTabTextActive : styles.topTabText}>
            내 매장 예약 {storeReservations.length > 0 && `(${storeReservations.length})`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.topTabButton, activeTab === 'my' && styles.topTabButtonActive]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={activeTab === 'my' ? styles.topTabTextActive : styles.topTabText}>
            나의 예약
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {activeTab === 'my' ? (
          // 나의 예약 (소비자로서 한 예약)
          reservations.length === 0 ? (
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

                <TouchableOpacity
                  onPress={() => onNavigateToStore && reservation.store_id && onNavigateToStore(reservation.store_id)}
                  disabled={!onNavigateToStore}
                >
                  <Text style={[styles.storeName, onNavigateToStore && styles.storeNameClickable]}>{reservation.stores?.name}</Text>
                </TouchableOpacity>

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
                    픽업 예약 시간: {reservation.pickup_time ? formatPickupTime(reservation.pickup_time) : '-'}
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
                    <TouchableOpacity onPress={() => handleCall(reservation.stores?.phone)}>
                      <Text style={styles.callButton}>전화하기</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.policyBox}>
                  <Text style={styles.policyTitle}>취소 및 노쇼 정책</Text>
                  <Text style={styles.policyText}>• 픽업 2시간 전까지 앱에서 취소 가능</Text>
                  <Text style={styles.policyText}>• 노쇼 시 이용이 제한될 수 있습니다</Text>
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => openCancelModal(reservation)}
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
          )
        ) : (
          // 내 매장 예약 (업주 화면)
          storeReservations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>매장 예약이 없습니다.</Text>
            </View>
          ) : (
            storeReservations.map((reservation) => (
              <View key={reservation.id} style={styles.reservationCard}>
                <View style={styles.reservationHeader}>
                  <Text style={styles.reservationNumber}>예약번호 #{reservation.reservation_number}</Text>
                  <Text style={[
                    styles.reservationStatus,
                    reservation.status === 'cancelled_by_consumer' ? styles.statusCancelled :
                    reservation.status === 'confirmed' ? styles.statusConfirmed : styles.statusPending
                  ]}>
                    {reservation.status === 'cancelled_by_consumer' ? '고객 취소' :
                     reservation.status === 'confirmed' ? '예약 확정' : '대기 중'}
                  </Text>
                </View>

                <View style={styles.customerRow}>
                  <Text style={styles.customerIcon}>👤</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.customerName}>{reservation.consumers?.nickname || '고객'}</Text>
                    <Text style={styles.customerPhone}>{reservation.consumers?.phone || '전화번호 없음'}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.callCustomerButton}
                    onPress={() => handleCall(reservation.consumers?.phone)}
                  >
                    <Text style={styles.callCustomerText}>📞 전화</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.productRow}>
                  <Text style={styles.productIcon}>🛒</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{reservation.products?.name} x{reservation.quantity}</Text>
                    <Text style={styles.productPrice}>{reservation.total_amount?.toLocaleString()}원</Text>
                  </View>
                </View>

                <View style={styles.timeRow}>
                  <Text style={styles.timeIcon}>🕐</Text>
                  <Text style={styles.timeText}>
                    픽업 예약 시간: {reservation.pickup_time ? formatPickupTime(reservation.pickup_time) : '-'}
                  </Text>
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.storeCancelButton}
                    onPress={() => openStoreCancelModal(reservation)}
                  >
                    <Text style={styles.storeCancelButtonText}>예약 취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => handlePickupComplete(reservation.id)}
                  >
                    <Text style={styles.completeButtonText}>픽업 완료 처리</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 취소 모달 (소비자용) */}
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
                  setSelectedReservation(null);
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

      {/* 업주용 취소 모달 */}
      <Modal
        visible={storeCancelModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setStoreCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>예약 취소</Text>
            <Text style={styles.modalSubtitle}>
              {storeCancelReservation?.consumers?.nickname || '고객'}님의 예약을 취소합니다.{'\n'}
              상품: {storeCancelReservation?.products?.name} x{storeCancelReservation?.quantity}개
            </Text>

            <Text style={styles.modalInputLabel}>취소 사유 (필수)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="예: 재고 소진, 영업 종료 등"
              placeholderTextColor="#999"
              value={storeCancelReason}
              onChangeText={setStoreCancelReason}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setStoreCancelModalVisible(false);
                  setStoreCancelReason('');
                  setStoreCancelReservation(null);
                }}
              >
                <Text style={styles.modalButtonTextCancel}>닫기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleStoreCancelReservation}
              >
                <Text style={styles.modalButtonTextConfirm}>취소하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 알림 사이드바 */}
      {notificationSidebarVisible && (
        <View style={StyleSheet.absoluteFill}>
          {/* 오버레이 */}
          <TouchableWithoutFeedback onPress={closeNotificationSidebar}>
            <Animated.View
              style={[
                styles.sidebarOverlay,
                { opacity: overlayAnim }
              ]}
            />
          </TouchableWithoutFeedback>

          {/* 사이드바 */}
          <Animated.View
            style={[
              styles.sidebar,
              { transform: [{ translateX: sidebarAnim }] }
            ]}
          >
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>알림</Text>
              {notifications.length > 0 && (
                <TouchableOpacity onPress={markAllAsRead}>
                  <Text style={styles.markAllReadText}>모두 읽음</Text>
                </TouchableOpacity>
              )}
            </View>

            {notificationsLoading ? (
              <View style={styles.sidebarLoading}>
                <ActivityIndicator size="small" color="#00D563" />
              </View>
            ) : notifications.length === 0 ? (
              <View style={styles.sidebarEmpty}>
                <Text style={styles.sidebarEmptyIcon}>🔔</Text>
                <Text style={styles.sidebarEmptyText}>새로운 알림이 없습니다</Text>
              </View>
            ) : (
              <ScrollView style={styles.sidebarContent}>
                {notifications.map((notification) => (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      styles.notificationItem,
                      !notification.is_read && styles.notificationItemUnread
                    ]}
                    onPress={() => {
                      if (!notification.is_read) {
                        markNotificationAsRead(notification.id);
                      }
                    }}
                  >
                    <View style={styles.notificationItemHeader}>
                      <Text style={styles.notificationItemTitle}>{notification.title}</Text>
                      <Text style={styles.notificationItemTime}>
                        {formatRelativeTime(notification.created_at)}
                      </Text>
                    </View>
                    <Text style={styles.notificationItemMessage}>{notification.message}</Text>
                    {!notification.is_read && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  backButton: { fontSize: 28, color: '#333' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#00D563' },
  notificationButton: { position: 'relative', padding: 4 },
  notificationIcon: { fontSize: 24 },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4
  },
  notificationBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  topTab: { flexDirection: 'row', backgroundColor: '#FFF', padding: 15, gap: 10 },
  topTabButton: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#E8F5E9', alignItems: 'center' },
  topTabButtonActive: { backgroundColor: '#1A1A2E' },
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
  statusCancelled: { backgroundColor: '#FFEBEE', color: '#D32F2F' },
  storeName: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  storeNameClickable: { color: '#007AFF', textDecorationLine: 'underline' },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, backgroundColor: '#F0F9F4', padding: 12, borderRadius: 8 },
  customerIcon: { fontSize: 24 },
  customerName: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 4 },
  customerPhone: { fontSize: 13, color: '#666' },
  callCustomerButton: { backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  callCustomerText: { fontSize: 13, color: '#00A84D', fontWeight: '600' },
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
  storeCancelButton: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#FF6B6B', alignItems: 'center' },
  storeCancelButtonText: { fontSize: 14, fontWeight: '600', color: '#FF6B6B' },
  completeButton: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#00D563', alignItems: 'center' },
  completeButtonText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  // 모달 스타일
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 20, lineHeight: 20 },
  modalInputLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  modalInput: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 12, fontSize: 14, color: '#333', minHeight: 80, textAlignVertical: 'top', marginBottom: 20 },
  modalButtonRow: { flexDirection: 'row', gap: 10 },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  modalButtonCancel: { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  modalButtonConfirm: { backgroundColor: '#FF6B6B' },
  modalButtonTextCancel: { fontSize: 14, fontWeight: '600', color: '#666' },
  modalButtonTextConfirm: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  // 사이드바 스타일
  sidebarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  sidebarTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  markAllReadText: { fontSize: 13, color: '#00D563', fontWeight: '600' },
  sidebarLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sidebarEmpty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  sidebarEmptyIcon: { fontSize: 48, marginBottom: 12, opacity: 0.5 },
  sidebarEmptyText: { fontSize: 14, color: '#999' },
  sidebarContent: { flex: 1 },
  notificationItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    position: 'relative'
  },
  notificationItemUnread: { backgroundColor: '#F0FFF4' },
  notificationItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  notificationItemTitle: { fontSize: 14, fontWeight: '600', color: '#333' },
  notificationItemTime: { fontSize: 12, color: '#999' },
  notificationItemMessage: { fontSize: 13, color: '#666', lineHeight: 18 },
  unreadDot: {
    position: 'absolute',
    top: 16,
    left: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00D563'
  },
});
