/**
 * @deprecated 이 파일은 더 이상 사용되지 않습니다.
 * StoreSalesStatistics.tsx로 통합되었습니다.
 *
 * 이 파일은 향후 삭제될 예정입니다.
 * 새로운 기능 추가나 수정은 StoreSalesStatistics.tsx에서 진행하세요.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// import { LineChart, BarChart } from 'react-native-chart-kit'; // 임시 주석 처리 (react-native-svg 오류 해결 전까지)
import { supabase } from '../lib/supabase';

interface StoreStatisticsProps {
  onBack: () => void;
}

interface DailySales {
  date: string;
  amount: number;
  count: number;
}

interface ProductSales {
  name: string;
  quantity: number;
  amount: number;
}

interface StatsSummary {
  todaySales: number;
  todayCount: number;
  weekSales: number;
  weekCount: number;
  monthSales: number;
  monthCount: number;
}

// const screenWidth = Dimensions.get('window').width; // 차트 사용 시 필요

export default function StoreStatistics({ onBack }: StoreStatisticsProps) {
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState<string>('');
  const [summary, setSummary] = useState<StatsSummary>({
    todaySales: 0,
    todayCount: 0,
    weekSales: 0,
    weekCount: 0,
    monthSales: 0,
    monthCount: 0,
  });
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [productSales, setProductSales] = useState<ProductSales[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  // 날짜 포맷팅 (YYYY-MM-DD)
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // 날짜 표시용 포맷 (M/D)
  const formatDisplayDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 업체 ID 가져오기
  useEffect(() => {
    const fetchStoreId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: storeData } = await supabase
          .from('stores')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (storeData) {
          setStoreId(storeData.id);
        }
      } catch (error) {
        console.error('업체 ID 조회 오류:', error);
      }
    };

    fetchStoreId();
  }, []);

  // 통계 데이터 로드
  const loadStatistics = useCallback(async () => {
    if (!storeId) return;

    try {
      setLoading(true);

      const now = new Date();
      const today = formatDate(now);
      
      // 이번 주 시작일 (일요일 기준)
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      const weekStartStr = formatDate(weekStart);

      // 이번 달 시작일
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthStartStr = formatDate(monthStart);

      // 완료된 예약만 조회 (매출로 집계)
      const { data: reservations, error } = await supabase
        .from('reservations')
        .select(`
          id,
          total_amount,
          quantity,
          created_at,
          picked_up_at,
          products (
            name
          )
        `)
        .eq('store_id', storeId)
        .eq('status', 'completed')
        .gte('created_at', monthStartStr)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 오늘 매출
      const todayReservations = reservations?.filter(r => 
        r.created_at.startsWith(today)
      ) || [];
      const todaySales = todayReservations.reduce((sum, r) => sum + Number(r.total_amount), 0);
      const todayCount = todayReservations.length;

      // 이번 주 매출
      const weekReservations = reservations?.filter(r => 
        r.created_at >= weekStartStr
      ) || [];
      const weekSales = weekReservations.reduce((sum, r) => sum + Number(r.total_amount), 0);
      const weekCount = weekReservations.length;

      // 이번 달 매출
      const monthSales = reservations?.reduce((sum, r) => sum + Number(r.total_amount), 0) || 0;
      const monthCount = reservations?.length || 0;

      setSummary({
        todaySales,
        todayCount,
        weekSales,
        weekCount,
        monthSales,
        monthCount,
      });

      // 일별 매출 (최근 7일 또는 30일)
      const days = selectedPeriod === 'week' ? 7 : 30;
      const dailyMap = new Map<string, { amount: number; count: number }>();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        const dateStr = formatDate(date);
        dailyMap.set(dateStr, { amount: 0, count: 0 });
      }

      // 일별 집계
      const periodStart = new Date(now);
      periodStart.setDate(now.getDate() - days + 1);
      const periodStartStr = formatDate(periodStart);

      const { data: periodReservations } = await supabase
        .from('reservations')
        .select('total_amount, created_at')
        .eq('store_id', storeId)
        .eq('status', 'completed')
        .gte('created_at', periodStartStr);

      periodReservations?.forEach(r => {
        const dateStr = r.created_at.split('T')[0];
        if (dailyMap.has(dateStr)) {
          const current = dailyMap.get(dateStr)!;
          dailyMap.set(dateStr, {
            amount: current.amount + Number(r.total_amount),
            count: current.count + 1,
          });
        }
      });

      const dailyData: DailySales[] = [];
      dailyMap.forEach((value, key) => {
        dailyData.push({
          date: key,
          amount: value.amount,
          count: value.count,
        });
      });

      setDailySales(dailyData);

      // 상품별 판매 순위
      const productMap = new Map<string, { quantity: number; amount: number }>();
      
      reservations?.forEach(r => {
        const productName = (r.products as any)?.name || '알 수 없음';
        const current = productMap.get(productName) || { quantity: 0, amount: 0 };
        productMap.set(productName, {
          quantity: current.quantity + r.quantity,
          amount: current.amount + Number(r.total_amount),
        });
      });

      const productData: ProductSales[] = [];
      productMap.forEach((value, key) => {
        productData.push({
          name: key,
          quantity: value.quantity,
          amount: value.amount,
        });
      });

      // 판매량 기준 정렬 (상위 5개)
      productData.sort((a, b) => b.quantity - a.quantity);
      setProductSales(productData.slice(0, 5));

    } catch (error) {
      console.error('통계 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  }, [storeId, selectedPeriod]);

  useEffect(() => {
    if (storeId) {
      loadStatistics();
    }
  }, [storeId, loadStatistics]);

  // 차트 데이터 준비 (임시 주석 처리)
  // const chartData = {
  //   labels: dailySales.slice(-7).map(d => formatDisplayDate(d.date)),
  //   datasets: [
  //     {
  //       data: dailySales.slice(-7).map(d => d.amount / 1000), // 천원 단위
  //       color: (opacity = 1) => `rgba(0, 213, 99, ${opacity})`,
  //       strokeWidth: 2,
  //     },
  //   ],
  //   legend: ['매출 (천원)'],
  // };

  // const barChartData = {
  //   labels: productSales.map(p => p.name.length > 5 ? p.name.substring(0, 5) + '..' : p.name),
  //   datasets: [
  //     {
  //       data: productSales.length > 0 ? productSales.map(p => p.quantity) : [0],
  //     },
  //   ],
  // };

  // const chartConfig = {
  //   backgroundColor: '#ffffff',
  //   backgroundGradientFrom: '#ffffff',
  //   backgroundGradientTo: '#ffffff',
  //   decimalPlaces: 0,
  //   color: (opacity = 1) => `rgba(0, 213, 99, ${opacity})`,
  //   labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
  //   style: {
  //     borderRadius: 16,
  //   },
  //   propsForDots: {
  //     r: '4',
  //     strokeWidth: '2',
  //     stroke: '#00D563',
  //   },
  // };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D563" />
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
        <Text style={styles.title}>매출 통계</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 매출 요약 카드 */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>오늘 매출</Text>
            <Text style={styles.summaryAmount}>
              {summary.todaySales.toLocaleString()}원
            </Text>
            <Text style={styles.summaryCount}>{summary.todayCount}건</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>이번 주</Text>
            <Text style={styles.summaryAmount}>
              {summary.weekSales.toLocaleString()}원
            </Text>
            <Text style={styles.summaryCount}>{summary.weekCount}건</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>이번 달</Text>
            <Text style={styles.summaryAmount}>
              {summary.monthSales.toLocaleString()}원
            </Text>
            <Text style={styles.summaryCount}>{summary.monthCount}건</Text>
          </View>
        </View>

        {/* 기간 선택 */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'week' && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === 'week' && styles.periodButtonTextActive,
              ]}
            >
              최근 7일
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'month' && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === 'month' && styles.periodButtonTextActive,
              ]}
            >
              최근 30일
            </Text>
          </TouchableOpacity>
        </View>

        {/* 일별 매출 차트 */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>📈 일별 매출 추이</Text>
          {dailySales.length > 0 ? (
            <View style={styles.dailySalesList}>
              {dailySales.slice(-7).map((daily, index) => (
                <View key={daily.date} style={styles.dailySalesItem}>
                  <Text style={styles.dailySalesDate}>{formatDisplayDate(daily.date)}</Text>
                  <View style={styles.dailySalesRight}>
                    <Text style={styles.dailySalesAmount}>{daily.amount.toLocaleString()}원</Text>
                    <Text style={styles.dailySalesCount}>{daily.count}건</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyText}>데이터가 없습니다</Text>
            </View>
          )}
        </View>

        {/* 상품별 판매 순위 */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>🏆 상품별 판매 순위 (TOP 5)</Text>
          {productSales.length > 0 ? (
            <View style={styles.productList}>
              {productSales.map((product, index) => (
                <View key={product.name} style={styles.productItem}>
                  <View style={styles.productRank}>
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productStats}>
                      {product.quantity}개 판매 · {product.amount.toLocaleString()}원
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyText}>판매 데이터가 없습니다</Text>
            </View>
          )}
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 20,
  },

  // 매출 요약
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00D563',
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 12,
    color: '#666',
  },

  // 기간 선택
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#00D563',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#FFF',
  },

  // 차트 섹션
  chartSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 12,
    marginLeft: -16,
  },
  emptyChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },

  // 일별 매출 리스트
  dailySalesList: {
    marginTop: 8,
  },
  dailySalesItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dailySalesDate: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  dailySalesRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dailySalesAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00D563',
  },
  dailySalesCount: {
    fontSize: 13,
    color: '#999',
  },

  // 상품 목록
  productList: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  productRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF9F40',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  productStats: {
    fontSize: 13,
    color: '#999',
  },
});
