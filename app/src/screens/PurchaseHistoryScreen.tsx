/**
 * 최근 구매 내역 화면
 * - 픽업 완료된 거래 내역만 표시 (picked_up = true)
 * - 리뷰 미작성 건은 리뷰 작성 버튼 표시
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface PurchaseItem {
  id: string;
  reservation_number: string;
  quantity: number;
  total_amount: number;
  pickup_time: string;
  picked_up_at: string;
  store_id: string;
  stores: {
    id: string;
    name: string;
  };
  products: {
    id: string;
    name: string;
  };
  reviews: { id: string }[] | null;
}

interface PurchaseHistoryScreenProps {
  onBack: () => void;
  onNavigateToStore: (storeId: string) => void;
  onWriteReview: (reservation: any) => void;
  onNavigateToMyReviews: () => void;
}

export default function PurchaseHistoryScreen({
  onBack,
  onNavigateToStore,
  onWriteReview,
  onNavigateToMyReviews,
}: PurchaseHistoryScreenProps) {
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPurchases = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 소비자 ID 조회
      const { data: consumer } = await supabase
        .from('consumers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!consumer) return;

      // 픽업 완료된 예약 목록 조회
      const { data: reservationsData, error } = await supabase
        .from('reservations')
        .select(`
          id,
          reservation_number,
          quantity,
          total_amount,
          pickup_time,
          picked_up_at,
          store_id,
          stores (id, name),
          products (id, name)
        `)
        .eq('consumer_id', consumer.id)
        .eq('picked_up', true)
        .order('picked_up_at', { ascending: false });

      if (error) throw error;

      // 각 예약에 대해 리뷰 존재 여부 명시적 확인
      const purchasesWithReviews = await Promise.all(
        (reservationsData || []).map(async (reservation) => {
          const { data: reviewData } = await supabase
            .from('reviews')
            .select('id')
            .eq('reservation_id', reservation.id)
            .maybeSingle();

          return {
            ...reservation,
            reviews: reviewData ? [{ id: reviewData.id }] : null,
          };
        })
      );

      setPurchases(purchasesWithReviews as unknown as PurchaseItem[]);
    } catch (error) {
      console.error('구매 내역 로드 오류:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPurchases();
  }, [loadPurchases]);

  // 상대 시간 포맷팅
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '1일전';
    if (diffDays < 7) return `${diffDays}일전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주전`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월전`;
    return `${Math.floor(diffDays / 365)}년전`;
  };

  // 리뷰 존재 여부 확인
  const hasReview = (item: PurchaseItem) => {
    return item.reviews && item.reviews.length > 0;
  };

  const renderItem = ({ item }: { item: PurchaseItem }) => (
    <TouchableOpacity
      style={styles.purchaseCard}
      onPress={() => onNavigateToStore(item.store_id)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.storeImagePlaceholder}>
          <Text style={styles.storeEmoji}>🏪</Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <TouchableOpacity
              onPress={() => onNavigateToStore(item.store_id)}
            >
              <Text style={styles.storeName}>{item.stores?.name || '업체명 없음'}</Text>
            </TouchableOpacity>
            <Text style={styles.dateText}>
              {item.picked_up_at ? formatRelativeTime(item.picked_up_at) : '-'}
            </Text>
          </View>
          <Text style={styles.productName}>
            {item.products?.name || '상품명 없음'} x{item.quantity}
          </Text>
          <Text style={styles.amount}>
            {item.total_amount?.toLocaleString()}원
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        {hasReview(item) ? (
          <TouchableOpacity
            style={styles.reviewCompleteBadge}
            onPress={(e) => {
              e.stopPropagation();
              onNavigateToMyReviews();
            }}
          >
            <Text style={styles.reviewCompleteText}>리뷰 완료</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={(e) => {
              e.stopPropagation();
              // 리뷰 작성에 필요한 정보 전달
              onWriteReview({
                id: item.id,
                store_id: item.store_id,
                store: { name: item.stores?.name },
                product: { name: item.products?.name },
              });
            }}
          >
            <Text style={styles.reviewButtonText}>리뷰 작성</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>최근 구매 내역</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00D563" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>최근 구매 내역</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 요약 */}
      <View style={styles.summaryBox}>
        <Text style={styles.summaryText}>총 {purchases.length}건의 구매 내역</Text>
      </View>

      {/* 목록 */}
      {purchases.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛍️</Text>
          <Text style={styles.emptyText}>구매 내역이 없습니다</Text>
          <Text style={styles.emptySubText}>
            상품을 픽업하면 여기에 표시됩니다
          </Text>
        </View>
      ) : (
        <FlatList
          data={purchases}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#00D563']}
              tintColor="#00D563"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFF',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 5,
  },
  backText: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 34,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryBox: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  purchaseCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
  },
  storeImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  storeEmoji: {
    fontSize: 28,
  },
  cardContent: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  productName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00D563',
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  reviewButton: {
    backgroundColor: '#00D563',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  reviewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  reviewCompleteBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  reviewCompleteText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00A84D',
  },
});
