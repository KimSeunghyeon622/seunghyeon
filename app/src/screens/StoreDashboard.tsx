import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface StoreDashboardProps {
  onManageProducts: () => void;
  onManageReservations: () => void;
  onManageInfo: () => void;
  onManageReviews: () => void;
  onManageRegulars: () => void;
  onViewSalesStatistics: () => void;
  onNotificationSettings: () => void;
  onLogout: () => void;
}

interface StoreInfo {
  id: string;
  name: string;
  cash_balance: number;
  is_open: boolean;
}

export default function StoreDashboard({
  onManageProducts,
  onManageReservations,
  onManageInfo,
  onManageReviews,
  onManageRegulars,
  onViewSalesStatistics,
  onNotificationSettings,
  onLogout,
}: StoreDashboardProps) {
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // 업체 정보 가져오기
  const fetchStoreInfo = useCallback(async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('사용자 정보를 찾을 수 없습니다');

      const { data: storeData, error } = await supabase
        .from('stores')
        .select('id, name, cash_balance, is_open')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setStore(storeData);
      setIsOpen(storeData.is_open);
    } catch (error) {
      console.error('업체 정보 로딩 오류:', error);
      alert('업체 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStoreInfo();
  }, [fetchStoreInfo]);

  // 매장 상태 토글
  const toggleStoreStatus = async (value: boolean) => {
    try {
      if (!store) return;

      const { error } = await supabase
        .from('stores')
        .update({ is_open: value })
        .eq('id', store.id);

      if (error) throw error;

      setIsOpen(value);
      alert(value ? '매장이 영업 중으로 변경되었습니다.' : '매장이 영업 종료 상태로 변경되었습니다.');
    } catch (error) {
      console.error('매장 상태 변경 오류:', error);
      alert('매장 상태 변경에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D563" />
      </View>
    );
  }

  if (!store) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>업체 정보를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onLogout}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏪 Save It</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 가게 정보 관리 카드 */}
        <TouchableOpacity style={styles.infoCard} onPress={onManageInfo}>
          <View style={styles.infoCardLeft}>
            <Text style={styles.infoCardIcon}>🏪</Text>
            <View>
              <Text style={styles.infoCardTitle}>가게 정보 관리</Text>
              <Text style={styles.infoCardSubtitle}>가게 사진, 운영시간 설정</Text>
            </View>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {/* 매장 상태 카드 */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <Text style={styles.statusDot}>●</Text>
              <Text style={styles.statusText}>매장 상태: {isOpen ? '영업 중' : '영업 종료'}</Text>
            </View>
            <Switch
              value={isOpen}
              onValueChange={toggleStoreStatus}
              trackColor={{ false: '#D0D0D0', true: '#00D563' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#D0D0D0"
            />
          </View>
        </View>

        {/* 빠른 관리 섹션 */}
        <Text style={styles.sectionTitle}>빠른 관리</Text>

        <View style={styles.quickActionsGrid}>
          {/* 판매상품 관리 */}
          <TouchableOpacity style={styles.quickActionCard} onPress={onManageProducts}>
            <View style={styles.quickActionIconContainer}>
              <Text style={styles.quickActionIcon}>🛒</Text>
            </View>
            <Text style={styles.quickActionText}>판매상품 관리</Text>
          </TouchableOpacity>

          {/* 리뷰 관리 */}
          <TouchableOpacity style={styles.quickActionCard} onPress={onManageReviews}>
            <View style={styles.quickActionIconContainer}>
              <Text style={styles.quickActionIcon}>💬</Text>
            </View>
            <Text style={styles.quickActionText}>리뷰 관리</Text>
          </TouchableOpacity>

          {/* 단골 고객 현황 */}
          <TouchableOpacity style={styles.quickActionCard} onPress={onManageRegulars}>
            <View style={styles.quickActionIconContainer}>
              <Text style={styles.quickActionIcon}>👥</Text>
            </View>
            <Text style={styles.quickActionText}>단골 고객 현황</Text>
          </TouchableOpacity>

          {/* 알림 설정 */}
          <TouchableOpacity style={styles.quickActionCard} onPress={onNotificationSettings}>
            <View style={styles.quickActionIconContainer}>
              <Text style={styles.quickActionIcon}>🔔</Text>
            </View>
            <Text style={styles.quickActionText}>상품 등록 알림</Text>
          </TouchableOpacity>

          {/* 매출 분석 */}
          <TouchableOpacity style={styles.quickActionCard} onPress={onViewSalesStatistics}>
            <View style={styles.quickActionIconContainer}>
              <Text style={styles.quickActionIcon}>📊</Text>
            </View>
            <Text style={styles.quickActionText}>매출 분석</Text>
          </TouchableOpacity>
        </View>

        {/* 하단 여백 */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    fontSize: 28,
    color: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },

  // 스크롤뷰
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // 가게 정보 관리 카드
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E9',
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#00D563',
  },
  infoCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  infoCardIcon: {
    fontSize: 32,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  infoCardSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  arrow: {
    fontSize: 28,
    color: '#00D563',
    fontWeight: '300',
  },

  // 매장 상태 카드
  statusCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    fontSize: 12,
    color: '#00D563',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },

  // 보유 캐시 카드
  cashCard: {
    backgroundColor: '#E8F5E9',
    padding: 24,
    borderRadius: 16,
    marginBottom: 30,
    position: 'relative',
    overflow: 'hidden',
  },
  cashLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cashAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  chargeButton: {
    backgroundColor: '#00D563',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  chargeButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  cashIconContainer: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: -30,
  },
  cashIcon: {
    fontSize: 60,
    opacity: 0.3,
  },

  // 섹션 타이틀
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },

  // 빠른 관리 그리드
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#F5F5F5',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionIcon: {
    fontSize: 28,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});
