import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { APP_INSTALL_URL, buildDeepLink } from '../constants';

interface MyPageScreenProps {
  onViewReservations: () => void;
  onViewPurchaseHistory: () => void;
  onViewStoreManagement: () => void;
  onBack: () => void;
  onViewFavorites: () => void;
  onViewMyReviews: () => void;
  onViewNotifications: () => void;
  onViewNotices: () => void;
  onViewFAQ: () => void;
  onViewCustomerService: () => void;
  onLogout: () => void;
}

export default function MyPageScreen({
  onViewReservations,
  onViewPurchaseHistory,
  onViewStoreManagement,
  onBack,
  onViewFavorites,
  onViewMyReviews,
  onViewNotifications,
  onViewNotices,
  onViewFAQ,
  onViewCustomerService,
  onLogout,
}: MyPageScreenProps) {
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
        .select('id, nickname, phone')
        .eq('user_id', user.id)
        .single();

      const { data: store } = await supabase
        .from('stores')
        .select('name, owner_name')
        .eq('user_id', user.id)
        .single();

      if (consumer) {
        // 픽업 완료된 예약 기준으로 절감 금액 계산
        const { data: completedReservations } = await supabase
          .from('reservations')
          .select('quantity, status, picked_up, products(original_price, discounted_price)')
          .eq('consumer_id', consumer.id)
          .or('status.eq.completed,picked_up.eq.true');

        const totalSavings = (completedReservations || []).reduce((sum, reservation: any) => {
          const product = reservation.products;
          const originalPrice = product?.original_price ?? 0;
          const discountedPrice = product?.discounted_price ?? 0;
          const quantity = reservation.quantity ?? 0;
          const diff = Math.max(0, originalPrice - discountedPrice);
          return sum + diff * quantity;
        }, 0);

        const mealsRescued = (completedReservations || []).reduce(
          (sum, reservation) => sum + (reservation.quantity ?? 0),
          0
        );
        const carbonReduced = mealsRescued * 0.5; // 1개당 0.5kg 가정

        setUserInfo({
          nickname: consumer.nickname,
          email: user.email,
          total_savings: totalSavings,
        });

        setStats({
          savings: totalSavings,
          carbonReduced: parseFloat(carbonReduced.toFixed(1)),
          mealsRescued,
        });

        // 최근 구매 내역 (최대 2건 - 픽업 완료된 건만 표시)
        const { data: recent } = await supabase
          .from('reservations')
          .select('*, stores(name), products(name)')
          .eq('consumer_id', consumer.id)
          .eq('picked_up', true)
          .order('picked_up_at', { ascending: false })
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
      const message = [
        '오늘득템 앱에서 주변 할인 상품을 확인해보세요.',
        `앱 설치: ${APP_INSTALL_URL}`,
        `바로가기: ${buildDeepLink('screen/storelist')}`,
      ].join('\n');

      await Share.share({
        message,
      });
    } catch (error) {
      console.error('공유 오류:', error);
    }
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
          <Text style={styles.logo}>Save It</Text>
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
        <Text style={styles.logo}>Save It</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 프로필 섹션 */}
        <View style={styles.profileSection}>
          <View style={styles.profileIcon}>
            <Text style={styles.profileEmoji}>👤</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.profileHeader}>
              <Text style={styles.profileName}>{userInfo?.nickname || '사용자'}</Text>
              {isStoreOwner && (
                <TouchableOpacity onPress={onViewStoreManagement} style={styles.storeLink}>
                  <Text style={styles.storeLinkText}>사장님 페이지</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.profileSubtitle}>지구를 지키는 중</Text>
          </View>
        </View>

        {/* 통계 박스 */}
        <View style={styles.statsBox}>
          <Text style={styles.statsLabel}>지금까지 아낀 금액</Text>
          <Text style={styles.statsAmount}>{stats.savings.toLocaleString()} 원</Text>
          <View style={styles.statsRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.statsSubLabel}>절감 탄소</Text>
              <Text style={styles.statsSubValue}>{stats.carbonReduced}kg</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statsSubLabel}>구한 음식</Text>
              <Text style={styles.statsSubValue}>{stats.mealsRescued}건</Text>
            </View>
          </View>
        </View>

        {/* 최근 구매 내역 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>최근 구매 내역</Text>
            <TouchableOpacity onPress={onViewPurchaseHistory}>
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
                  <Text style={styles.orderImageText}>🛒</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.orderHeader}>
                    {order.status === 'completed' && (
                      <Text style={styles.orderBadge}>수령 완료</Text>
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
            <Text style={styles.shareIconText}>🎁</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.shareText}>친구에게 공유하고</Text>
            <Text style={styles.shareText}>함께 지구를 구해요</Text>
          </View>
          <Text style={styles.shareArrow}>›</Text>
        </TouchableOpacity>

        {/* 메뉴 섹션 */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={onViewFavorites}>
            <Text style={styles.menuIcon}>❤️</Text>
            <Text style={styles.menuText}>관심업체</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onViewMyReviews}>
            <Text style={styles.menuIcon}>📝</Text>
            <Text style={styles.menuText}>리뷰 관리</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onViewNotifications}>
            <Text style={styles.menuIcon}>🔔</Text>
            <Text style={styles.menuText}>알림</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onViewFAQ}>
            <Text style={styles.menuIcon}>❓</Text>
            <Text style={styles.menuText}>자주 묻는 질문</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onViewCustomerService}>
            <Text style={styles.menuIcon}>💬</Text>
            <Text style={styles.menuText}>고객센터</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onViewNotices}>
            <Text style={styles.menuIcon}>📢</Text>
            <Text style={styles.menuText}>공지사항</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 로그아웃 버튼 */}
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 하단 네비게이션 */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={onBack}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>홈</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={onViewReservations}>
          <Text style={styles.navIcon}>📋</Text>
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
  menuSection: { backgroundColor: '#FFF', marginBottom: 12 },
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
  logoutButton: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  logoutText: {
    fontSize: 16,
    color: '#FF5252',
    fontWeight: '600'
  },
});
