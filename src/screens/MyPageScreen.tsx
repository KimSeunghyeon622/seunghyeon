import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Share, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

interface MyPageScreenProps {
  onViewReservations: () => void;
  onViewStoreManagement: () => void;
  onBack: () => void;
}

export default function MyPageScreen({ onViewReservations, onViewStoreManagement, onBack }: MyPageScreenProps) {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isStoreOwner, setIsStoreOwner] = useState(false);
  const [stats, setStats] = useState({ savings: 0, carbonReduced: 0, mealsRescued: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: consumer } = await supabase
        .from('consumers')
        .select('id, nickname, phone, total_savings')
        .eq('user_id', user.id)
        .single();

      const { data: store } = await supabase
        .from('stores')
        .select('name, owner_name')
        .eq('user_id', user.id)
        .single();

      if (consumer) {
        setUserInfo({
          nickname: consumer.nickname,
          email: user.email,
          total_savings: consumer.total_savings || 0,
        });

        // 통계 계산
        const { data: completedReservations } = await supabase
          .from('reservations')
          .select('total_amount')
          .eq('consumer_id', consumer.id)
          .eq('status', 'completed');

        const totalSavings = consumer.total_savings || 0;
        const mealsRescued = completedReservations?.length || 0;
        const carbonReduced = mealsRescued * 0.5; // 1건당 0.5kg 가정

        setStats({
          savings: totalSavings,
          carbonReduced: parseFloat(carbonReduced.toFixed(1)),
          mealsRescued,
        });

        // 최근 구매 내역 (최대 2건)
        const { data: recent } = await supabase
          .from('reservations')
          .select('*, stores(name), products(name)')
          .eq('consumer_id', consumer.id)
          .in('status', ['confirmed', 'completed'])
          .order('created_at', { ascending: false })
          .limit(2);

        setRecentOrders(recent || []);
      }

      if (store) {
        setIsStoreOwner(true);
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Save It 앱으로 음식물 낭비를 줄이고 할인 혜택을 받아보세요! 🌍',
      });
    } catch (error) {
      console.error('공유 오류:', error);
    }
  };

  const handleFavorites = () => {
    Alert.alert('관심업체', '관심업체 기능은 곧 출시될 예정입니다.');
  };

  const handleReviews = () => {
    Alert.alert('작성한 리뷰', '작성한 리뷰 기능은 곧 출시될 예정입니다.');
  };

  const handleNotifications = () => {
    Alert.alert('알림 설정', '알림 설정 기능은 곧 출시될 예정입니다.');
  };

  const handleFAQ = () => {
    Alert.alert(
      '자주 묻는 질문',
      '1. 예약 취소는 어떻게 하나요?\n→ 예약 내역에서 취소 버튼을 눌러주세요.\n\n2. 환불 정책은?\n→ 각 업체의 환불 정책을 확인해주세요.\n\n3. 픽업 시간을 변경할 수 있나요?\n→ 업체에 직접 전화로 문의해주세요.',
      [{ text: '확인' }]
    );
  };

  const handleCustomerService = () => {
    Alert.alert(
      '고객센터',
      '이메일: support@saveit.com\n전화: 1588-0000\n운영시간: 평일 9시-18시',
      [{ text: '확인' }]
    );
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '1일전';
    return `${diffDays}일전`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>💚 Save It</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>로딩 중...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.logo}>💚 Save It</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 프로필 섹션 */}
        <View style={styles.profileSection}>
          <View style={styles.profileIcon}>
            <Text style={styles.profileEmoji}>👤</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.profileHeader}>
              <Text style={styles.profileName}>{userInfo?.nickname || '사용자'}님 ✓</Text>
              {isStoreOwner && (
                <TouchableOpacity onPress={onViewStoreManagement} style={styles.storeLink}>
                  <Text style={styles.storeLinkText}>사장님 페이지 ›</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.profileSubtitle}>지구를 지키는 중</Text>
          </View>
        </View>

        {/* 통계 박스 */}
        <View style={styles.statsBox}>
          <Text style={styles.statsLabel}>지금까지 아낀금액</Text>
          <Text style={styles.statsAmount}>{stats.savings.toLocaleString()} 원</Text>
          <View style={styles.statsRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.statsSubLabel}>절감 탄소</Text>
              <Text style={styles.statsSubValue}>{stats.carbonReduced}kg</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statsSubLabel}>구조한 음식</Text>
              <Text style={styles.statsSubValue}>{stats.mealsRescued}건</Text>
            </View>
          </View>
        </View>

        {/* 최근 구매 내역 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>최근 구매 내역</Text>
            <TouchableOpacity onPress={onViewReservations}>
              <Text style={styles.sectionLink}>전체보기</Text>
            </TouchableOpacity>
          </View>

          {recentOrders.length === 0 ? (
            <View style={styles.emptyOrders}>
              <Text style={styles.emptyText}>최근 구매 내역이 없습니다</Text>
            </View>
          ) : (
            recentOrders.map((order) => (
              <TouchableOpacity key={order.id} style={styles.orderItem}>
                <View style={styles.orderImage}>
                  <Text style={styles.orderImageText}>🏪</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.orderHeader}>
                    {order.status === 'completed' && (
                      <Text style={styles.orderBadge}>수량 완료</Text>
                    )}
                    <Text style={styles.orderTime}>{getTimeAgo(order.created_at)}</Text>
                  </View>
                  <Text style={styles.orderStoreName}>{order.stores?.name}</Text>
                  <Text style={styles.orderProductName}>{order.products?.name}</Text>
                </View>
                <Text style={styles.orderArrow}>›</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* 공유 박스 */}
        <TouchableOpacity style={styles.shareBox} onPress={handleShare}>
          <View style={styles.shareIcon}>
            <Text style={styles.shareIconText}>👥</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.shareText}>친구에게 공유하고</Text>
            <Text style={styles.shareText}>함께 지구를 구해요!</Text>
          </View>
          <Text style={styles.shareArrow}>⤴</Text>
        </TouchableOpacity>

        {/* 메뉴 섹션 */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={handleFavorites}>
            <Text style={styles.menuIcon}>❤️</Text>
            <Text style={styles.menuText}>관심업체</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleReviews}>
            <Text style={styles.menuIcon}>💬</Text>
            <Text style={styles.menuText}>작성한 리뷰</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleNotifications}>
            <Text style={styles.menuIcon}>🔔</Text>
            <Text style={styles.menuText}>알림 설정</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleFAQ}>
            <Text style={styles.menuIcon}>❓</Text>
            <Text style={styles.menuText}>자주 묻는 질문</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleCustomerService}>
            <Text style={styles.menuIcon}>📞</Text>
            <Text style={styles.menuText}>고객센터</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 하단 네비게이션 */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={onBack}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>홈</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={onViewReservations}>
          <Text style={styles.navIcon}>📦</Text>
          <Text style={styles.navLabel}>주문/예약</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Text style={styles.navIconActive}>👤</Text>
          <Text style={styles.navLabelActive}>내정보</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { backgroundColor: '#FFF', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  logo: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  scrollView: { flex: 1 },
  profileSection: { backgroundColor: '#FFF', padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#F0E5D8', justifyContent: 'center', alignItems: 'center' },
  profileEmoji: { fontSize: 36 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  profileName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  storeLink: { paddingHorizontal: 8 },
  storeLinkText: { fontSize: 14, color: '#999' },
  profileSubtitle: { fontSize: 14, color: '#999' },
  statsBox: { backgroundColor: '#E8F5E9', margin: 20, padding: 20, borderRadius: 12 },
  statsLabel: { fontSize: 14, color: '#2E7D32', marginBottom: 8 },
  statsAmount: { fontSize: 32, fontWeight: 'bold', color: '#1B5E20', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 20 },
  statsSubLabel: { fontSize: 13, color: '#2E7D32', marginBottom: 4 },
  statsSubValue: { fontSize: 18, fontWeight: 'bold', color: '#1B5E20' },
  section: { backgroundColor: '#FFF', paddingHorizontal: 20, paddingTop: 16, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  sectionLink: { fontSize: 14, color: '#999' },
  emptyOrders: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#999' },
  orderItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  orderImage: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  orderImageText: { fontSize: 24 },
  orderHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  orderBadge: { fontSize: 12, color: '#00D563', fontWeight: '600' },
  orderTime: { fontSize: 12, color: '#999' },
  orderStoreName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  orderProductName: { fontSize: 14, color: '#666' },
  orderArrow: { fontSize: 20, color: '#CCC', marginLeft: 8 },
  shareBox: { backgroundColor: '#E8F5E9', marginHorizontal: 20, marginBottom: 20, padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  shareIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  shareIconText: { fontSize: 24 },
  shareText: { fontSize: 14, color: '#1B5E20', fontWeight: '600' },
  shareArrow: { fontSize: 24, color: '#00D563' },
  menuSection: { backgroundColor: '#FFF', marginBottom: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  menuIcon: { fontSize: 20, width: 30, marginRight: 12 },
  menuText: { flex: 1, fontSize: 16, color: '#333' },
  menuArrow: { fontSize: 20, color: '#CCC' },
  bottomNav: { flexDirection: 'row', backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E0E0E0', paddingBottom: 20, paddingTop: 10 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  navItemActive: {},
  navIcon: { fontSize: 24, marginBottom: 4, color: '#999' },
  navIconActive: { fontSize: 24, marginBottom: 4, color: '#00D563' },
  navLabel: { fontSize: 12, color: '#999' },
  navLabelActive: { fontSize: 12, color: '#00D563', fontWeight: '600' },
});
