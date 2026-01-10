import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

interface DashboardStats {
  cashBalance: number;
  pendingReservations: number;
  confirmedReservations: number;
  totalProducts: number;
  activeProducts: number;
  todayRevenue: number;
}

export default function StoreDashboard({
  onManageProducts,
  onManageCash,
  onManageReservations,
  onLogout,
}: {
  onManageProducts: () => void;
  onManageCash: () => void;
  onManageReservations: () => void;
  onLogout: () => void;
}) {
  const [storeName, setStoreName] = useState('');
  const [stats, setStats] = useState<DashboardStats>({
    cashBalance: 0,
    pendingReservations: 0,
    confirmedReservations: 0,
    totalProducts: 0,
    activeProducts: 0,
    todayRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 업체 정보 가져오기
      const { data: store } = await supabase
        .from('stores')
        .select('id, name, cash_balance')
        .eq('user_id', user.id)
        .single();

      if (!store) {
        Alert.alert('오류', '업체 정보를 찾을 수 없습니다');
        return;
      }

      setStoreName(store.name);

      // 통계 계산
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 대기중 예약 수
      const { count: pendingCount } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .eq('status', 'pending');

      // 확인된 예약 수
      const { count: confirmedCount } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .eq('status', 'confirmed');

      // 전체 상품 수
      const { count: totalProductsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id);

      // 활성 상품 수
      const { count: activeProductsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .eq('is_active', true);

      // 오늘 매출 (완료된 예약)
      const { data: todayReservations } = await supabase
        .from('reservations')
        .select('total_amount')
        .eq('store_id', store.id)
        .eq('status', 'completed')
        .gte('created_at', today.toISOString());

      const todayRevenue = todayReservations?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0;

      setStats({
        cashBalance: store.cash_balance || 0,
        pendingReservations: pendingCount || 0,
        confirmedReservations: confirmedCount || 0,
        totalProducts: totalProductsCount || 0,
        activeProducts: activeProductsCount || 0,
        todayRevenue,
      });
    } catch (err: any) {
      console.error('대시보드 로드 오류:', err);
      Alert.alert('오류', '데이터를 불러오는 중 문제가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        onPress: async () => {
          await supabase.auth.signOut();
          onLogout();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>로딩 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{storeName}</Text>
        <Text style={styles.subtitle}>업체 관리</Text>
      </View>

      {/* 캐시 잔액 */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>현재 캐시 잔액</Text>
        <Text style={styles.balanceAmount}>{stats.cashBalance.toLocaleString()}원</Text>
      </View>

      {/* 통계 카드 */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>대기중 예약</Text>
          <Text style={[styles.statValue, { color: '#FF9500' }]}>{stats.pendingReservations}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>확인된 예약</Text>
          <Text style={[styles.statValue, { color: '#007AFF' }]}>{stats.confirmedReservations}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>전체 상품</Text>
          <Text style={styles.statValue}>{stats.totalProducts}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>판매중 상품</Text>
          <Text style={[styles.statValue, { color: '#34C759' }]}>{stats.activeProducts}</Text>
        </View>
      </View>

      {/* 오늘 매출 */}
      <View style={styles.revenueCard}>
        <Text style={styles.revenueLabel}>오늘 매출</Text>
        <Text style={styles.revenueAmount}>{stats.todayRevenue.toLocaleString()}원</Text>
      </View>

      {/* 메뉴 버튼 */}
      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuButton} onPress={onManageReservations}>
          <Text style={styles.menuIcon}>📋</Text>
          <Text style={styles.menuText}>예약 관리</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={onManageProducts}>
          <Text style={styles.menuIcon}>📦</Text>
          <Text style={styles.menuText}>상품 관리</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={onManageCash}>
          <Text style={styles.menuIcon}>💰</Text>
          <Text style={styles.menuText}>캐시 관리</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuButton, styles.logoutButton]} onPress={handleLogout}>
          <Text style={styles.menuIcon}>🚪</Text>
          <Text style={[styles.menuText, { color: '#FF3B30' }]}>로그아웃</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 새로고침 버튼 */}
      <TouchableOpacity style={styles.refreshButton} onPress={loadDashboard}>
        <Text style={styles.refreshText}>🔄 새로고침</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#007AFF',
    padding: 25,
    paddingTop: 50,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#fff', opacity: 0.9 },
  balanceCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceLabel: { fontSize: 14, color: '#999', marginBottom: 8 },
  balanceAmount: { fontSize: 32, fontWeight: 'bold', color: '#007AFF' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  statCard: {
    backgroundColor: '#fff',
    width: '48%',
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
    marginHorizontal: '1%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statLabel: { fontSize: 13, color: '#999', marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  revenueCard: {
    backgroundColor: '#34C759',
    marginHorizontal: 15,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  revenueLabel: { fontSize: 14, color: '#fff', opacity: 0.9, marginBottom: 5 },
  revenueAmount: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  menuSection: { paddingHorizontal: 15, marginBottom: 20 },
  menuButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutButton: { borderWidth: 1, borderColor: '#FF3B30' },
  menuIcon: { fontSize: 24, marginRight: 15 },
  menuText: { flex: 1, fontSize: 16, fontWeight: '600', color: '#333' },
  menuArrow: { fontSize: 24, color: '#ccc' },
  refreshButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 15,
    marginBottom: 30,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  refreshText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
