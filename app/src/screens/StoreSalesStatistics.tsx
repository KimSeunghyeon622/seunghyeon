import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

// ============================================================
// 타입 정의
// ============================================================

interface StoreSalesStatisticsProps {
  onBack: () => void;
}

// 매출 요약 (오늘/주간/월간 - 증감률 + 건수)
interface SalesSummary {
  todaySales: number;
  todayCount: number;
  todayGrowth: number;      // 전일 대비 증감률
  weekSales: number;
  weekCount: number;
  weekGrowth: number;       // 전주 대비 증감률
  monthSales: number;
  monthCount: number;
  monthGrowth: number;      // 전월 대비 증감률
}

// 시간대별 판매 데이터
interface TimeSlotData {
  slot: string;      // '09-12', '12-15', '15-18', '18-21', '21-24'
  amount: number;    // 금액
  count: number;     // 건수
  isPeak: boolean;   // 피크타임 여부
}

// 일별 매출 데이터
interface DailySales {
  date: string;
  amount: number;
  count: number;
}

// 주간별 매출 데이터
interface WeeklySales {
  week: string;
  amount: number;
}

// 상품별 판매 데이터
interface ProductSales {
  name: string;
  quantity: number;
  amount: number;
}

// ============================================================
// 상수 정의
// ============================================================

const TIME_SLOTS = ['09-12', '12-15', '15-18', '18-21', '21-24'];

// ============================================================
// 컴포넌트
// ============================================================

export default function StoreSalesStatistics({ onBack }: StoreSalesStatisticsProps) {
  // 상태
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [storeId, setStoreId] = useState<string>('');
  const [activeTab, setActiveTab] = useState(0);  // 0: 시간 분석, 1: 매출 추이, 2: 상품 분석
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 30>(7);

  // 데이터
  const [summary, setSummary] = useState<SalesSummary>({
    todaySales: 0,
    todayCount: 0,
    todayGrowth: 0,
    weekSales: 0,
    weekCount: 0,
    weekGrowth: 0,
    monthSales: 0,
    monthCount: 0,
    monthGrowth: 0,
  });
  const [timeSlotData, setTimeSlotData] = useState<TimeSlotData[]>([]);
  const [peakTimeMessage, setPeakTimeMessage] = useState<string>('');
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [weeklySales, setWeeklySales] = useState<WeeklySales[]>([]);
  const [productSales, setProductSales] = useState<ProductSales[]>([]);

  // ------------------------------------------------------------
  // 유틸리티 함수
  // ------------------------------------------------------------

  // 날짜 포맷팅 (YYYY-MM-DD)
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // 날짜 표시용 포맷 (M/D)
  const formatDisplayDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 시간대 슬롯 계산 (09-12, 12-15, 15-18, 18-21, 21-24)
  const getTimeSlot = (dateStr: string): string | null => {
    const date = new Date(dateStr);
    const hour = date.getHours();

    if (hour >= 9 && hour < 12) return '09-12';
    if (hour >= 12 && hour < 15) return '12-15';
    if (hour >= 15 && hour < 18) return '15-18';
    if (hour >= 18 && hour < 21) return '18-21';
    if (hour >= 21 && hour < 24) return '21-24';
    return null;  // 영업시간 외
  };

  // 피크타임 메시지 생성
  const generatePeakMessage = (peakSlot: string): string => {
    const messages: Record<string, string> = {
      '09-12': '오전 9-12시가 가장 바빠요! 이 시간대에 프로모션을 추천합니다.',
      '12-15': '점심시간(12-15시)이 가장 바빠요! 점심 메뉴 강화를 고려해보세요.',
      '15-18': '오후 3-6시가 가장 바빠요! 간식/디저트 상품이 잘 팔릴 거예요.',
      '18-21': '저녁시간(18-21시)이 가장 바빠요! 저녁 식사용 상품을 추천합니다.',
      '21-24': '야간 시간(21-24시)이 가장 바빠요! 야식 상품을 고려해보세요.',
    };
    return messages[peakSlot] || '판매 데이터를 분석중입니다.';
  };

  // 금액 포맷팅
  const formatAmount = (amount: number): string => {
    return amount.toLocaleString() + '원';
  };

  // 증감률 포맷팅
  const formatGrowth = (growth: number): string => {
    const sign = growth > 0 ? '+' : '';
    return `${sign}${growth.toFixed(0)}%`;
  };

  // ------------------------------------------------------------
  // 데이터 로딩
  // ------------------------------------------------------------

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
          .maybeSingle();

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

      // 어제 날짜
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = formatDate(yesterday);

      // 이번 주 시작일 (일요일 기준)
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      const weekStartStr = formatDate(weekStart);

      // 지난주 시작/종료
      const lastWeekStart = new Date(weekStart);
      lastWeekStart.setDate(weekStart.getDate() - 7);
      const lastWeekStartStr = formatDate(lastWeekStart);
      const lastWeekEndStr = formatDate(weekStart);

      // 이번 달 시작일
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthStartStr = formatDate(monthStart);

      // 지난달 시작/종료
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const lastMonthStartStr = formatDate(lastMonthStart);
      const lastMonthEndStr = formatDate(lastMonthEnd);

      // 기간 시작일 (최근 30일로 모든 데이터 조회)
      const periodStart = new Date(now);
      periodStart.setDate(now.getDate() - 30);
      const periodStartStr = formatDate(periodStart);

      // 완료된 예약 조회
      const { data: reservations, error } = await supabase
        .from('reservations')
        .select(`
          id,
          total_amount,
          quantity,
          created_at,
          products (
            name
          )
        `)
        .eq('store_id', storeId)
        .eq('status', 'completed')
        .gte('created_at', periodStartStr)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // ----------------------------------------------------------------
      // 1. 매출 요약 계산 (오늘/주간/월간 + 증감률 + 건수)
      // ----------------------------------------------------------------

      // 오늘 매출
      const todayReservations = reservations?.filter(r =>
        r.created_at.startsWith(today)
      ) || [];
      const todaySales = todayReservations.reduce((sum, r) => sum + Number(r.total_amount), 0);
      const todayCount = todayReservations.length;

      // 어제 매출 (오늘 증감률 계산용)
      const yesterdayReservations = reservations?.filter(r =>
        r.created_at.startsWith(yesterdayStr)
      ) || [];
      const yesterdaySales = yesterdayReservations.reduce((sum, r) => sum + Number(r.total_amount), 0);
      const todayGrowth = yesterdaySales > 0
        ? ((todaySales - yesterdaySales) / yesterdaySales) * 100
        : 0;

      // 이번 주 매출
      const weekReservations = reservations?.filter(r =>
        r.created_at >= weekStartStr
      ) || [];
      const weekSales = weekReservations.reduce((sum, r) => sum + Number(r.total_amount), 0);
      const weekCount = weekReservations.length;

      // 지난주 매출 (별도 쿼리)
      const { data: lastWeekReservations } = await supabase
        .from('reservations')
        .select('total_amount')
        .eq('store_id', storeId)
        .eq('status', 'completed')
        .gte('created_at', lastWeekStartStr)
        .lt('created_at', lastWeekEndStr);

      const lastWeekSales = lastWeekReservations?.reduce((sum, r) => sum + Number(r.total_amount), 0) || 0;
      const weekGrowth = lastWeekSales > 0
        ? ((weekSales - lastWeekSales) / lastWeekSales) * 100
        : 0;

      // 이번 달 매출
      const monthReservations = reservations?.filter(r =>
        r.created_at >= monthStartStr
      ) || [];
      const monthSales = monthReservations.reduce((sum, r) => sum + Number(r.total_amount), 0);
      const monthCount = monthReservations.length;

      // 지난달 매출 (별도 쿼리)
      const { data: lastMonthReservations } = await supabase
        .from('reservations')
        .select('total_amount')
        .eq('store_id', storeId)
        .eq('status', 'completed')
        .gte('created_at', lastMonthStartStr)
        .lte('created_at', lastMonthEndStr);

      const lastMonthSales = lastMonthReservations?.reduce((sum, r) => sum + Number(r.total_amount), 0) || 0;
      const monthGrowth = lastMonthSales > 0
        ? ((monthSales - lastMonthSales) / lastMonthSales) * 100
        : 0;

      setSummary({
        todaySales,
        todayCount,
        todayGrowth,
        weekSales,
        weekCount,
        weekGrowth,
        monthSales,
        monthCount,
        monthGrowth,
      });

      // ----------------------------------------------------------------
      // 2. 시간대별 분석
      // ----------------------------------------------------------------

      const slotMap: Record<string, { amount: number; count: number }> = {};
      TIME_SLOTS.forEach(slot => {
        slotMap[slot] = { amount: 0, count: 0 };
      });

      reservations?.forEach(r => {
        const slot = getTimeSlot(r.created_at);
        if (slot && slotMap[slot]) {
          slotMap[slot].amount += Number(r.total_amount);
          slotMap[slot].count += r.quantity || 1;
        }
      });

      // 피크타임 찾기
      let maxAmount = 0;
      let peakSlot = '';
      TIME_SLOTS.forEach(slot => {
        if (slotMap[slot].amount > maxAmount) {
          maxAmount = slotMap[slot].amount;
          peakSlot = slot;
        }
      });

      const timeData: TimeSlotData[] = TIME_SLOTS.map(slot => ({
        slot,
        amount: slotMap[slot].amount,
        count: slotMap[slot].count,
        isPeak: slot === peakSlot && maxAmount > 0,
      }));

      setTimeSlotData(timeData);
      setPeakTimeMessage(maxAmount > 0 ? generatePeakMessage(peakSlot) : '아직 판매 데이터가 충분하지 않습니다.');

      // ----------------------------------------------------------------
      // 3. 일별 매출 데이터 (선택한 기간에 따라)
      // ----------------------------------------------------------------

      const days = selectedPeriod;
      const dailyData: DailySales[] = [];

      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateStr = formatDate(d);
        const dayReservations = reservations?.filter(r => r.created_at.startsWith(dateStr)) || [];
        const dayAmount = dayReservations.reduce((sum, r) => sum + Number(r.total_amount), 0);
        const dayCount = dayReservations.length;

        dailyData.push({
          date: dateStr,
          amount: dayAmount,
          count: dayCount,
        });
      }

      setDailySales(dailyData);

      // ----------------------------------------------------------------
      // 4. 주간별 매출 데이터 (30일 선택 시)
      // ----------------------------------------------------------------

      const weeklyData: WeeklySales[] = [];
      for (let w = 3; w >= 0; w--) {
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() - (w * 7));
        const weekStartDate = new Date(weekEnd);
        weekStartDate.setDate(weekEnd.getDate() - 6);

        const weekStartDateStr = formatDate(weekStartDate);
        const weekEndStr = formatDate(weekEnd);

        const weekReservationsForChart = reservations?.filter(r =>
          r.created_at >= weekStartDateStr && r.created_at <= weekEndStr + 'T23:59:59'
        ) || [];
        const weekAmount = weekReservationsForChart.reduce((sum, r) => sum + Number(r.total_amount), 0);

        weeklyData.push({
          week: `${weekStartDate.getMonth() + 1}/${weekStartDate.getDate()}~`,
          amount: weekAmount,
        });
      }

      setWeeklySales(weeklyData);

      // ----------------------------------------------------------------
      // 5. 상품별 판매 순위 (TOP 5)
      // ----------------------------------------------------------------

      const productMap = new Map<string, { quantity: number; amount: number }>();

      reservations?.forEach(r => {
        // products는 단일 객체 또는 배열로 반환될 수 있음
        const products = r.products as { name: string } | { name: string }[] | null;
        let productName = '알 수 없음';
        if (products) {
          if (Array.isArray(products)) {
            productName = products[0]?.name || '알 수 없음';
          } else {
            productName = products.name || '알 수 없음';
          }
        }
        const current = productMap.get(productName) || { quantity: 0, amount: 0 };
        productMap.set(productName, {
          quantity: current.quantity + (r.quantity || 1),
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
      setRefreshing(false);
    }
  }, [storeId, selectedPeriod]);

  useEffect(() => {
    if (storeId) {
      loadStatistics();
    }
  }, [storeId, loadStatistics]);

  // 새로고침
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStatistics();
  }, [loadStatistics]);

  // ------------------------------------------------------------
  // 렌더링: 서브 컴포넌트
  // ------------------------------------------------------------

  // 매출 요약 카드 (3개: 오늘/주간/월간)
  const renderSummaryCards = () => (
    <View style={styles.summaryContainer}>
      {/* 오늘 매출 */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>오늘 매출</Text>
        <Text style={styles.summaryAmount}>{formatAmount(summary.todaySales)}</Text>
        <View style={styles.summaryMeta}>
          {summary.todayGrowth !== 0 && (
            <Text style={[
              styles.summaryGrowth,
              summary.todayGrowth > 0 ? styles.growthPositive : styles.growthNegative
            ]}>
              {formatGrowth(summary.todayGrowth)} {summary.todayGrowth > 0 ? '↑' : '↓'}
            </Text>
          )}
          <Text style={styles.summaryCount}>{summary.todayCount}건</Text>
        </View>
      </View>

      {/* 이번 주 매출 */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>이번 주</Text>
        <Text style={styles.summaryAmount}>{formatAmount(summary.weekSales)}</Text>
        <View style={styles.summaryMeta}>
          {summary.weekGrowth !== 0 && (
            <Text style={[
              styles.summaryGrowth,
              summary.weekGrowth > 0 ? styles.growthPositive : styles.growthNegative
            ]}>
              {formatGrowth(summary.weekGrowth)} {summary.weekGrowth > 0 ? '↑' : '↓'}
            </Text>
          )}
          <Text style={styles.summaryCount}>{summary.weekCount}건</Text>
        </View>
      </View>

      {/* 이번 달 매출 */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>이번 달</Text>
        <Text style={styles.summaryAmount}>{formatAmount(summary.monthSales)}</Text>
        <View style={styles.summaryMeta}>
          {summary.monthGrowth !== 0 && (
            <Text style={[
              styles.summaryGrowth,
              summary.monthGrowth > 0 ? styles.growthPositive : styles.growthNegative
            ]}>
              {formatGrowth(summary.monthGrowth)} {summary.monthGrowth > 0 ? '↑' : '↓'}
            </Text>
          )}
          <Text style={styles.summaryCount}>{summary.monthCount}건</Text>
        </View>
      </View>
    </View>
  );

  // 탭 네비게이션 (3개 탭)
  const renderTabNavigation = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 0 && styles.tabActive]}
        onPress={() => setActiveTab(0)}
      >
        <Text style={[styles.tabText, activeTab === 0 && styles.tabTextActive]}>
          시간 분석
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 1 && styles.tabActive]}
        onPress={() => setActiveTab(1)}
      >
        <Text style={[styles.tabText, activeTab === 1 && styles.tabTextActive]}>
          매출 추이
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 2 && styles.tabActive]}
        onPress={() => setActiveTab(2)}
      >
        <Text style={[styles.tabText, activeTab === 2 && styles.tabTextActive]}>
          상품 분석
        </Text>
      </TouchableOpacity>
    </View>
  );

  // 탭1: 시간대별 분석
  const renderTimeAnalysis = () => {
    const maxAmount = Math.max(...timeSlotData.map(d => d.amount), 1);

    return (
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>시간대별 판매</Text>

        {timeSlotData.map((data) => {
          const widthPercent = (data.amount / maxAmount) * 100;

          return (
            <View key={data.slot} style={styles.barRow}>
              <Text style={styles.barLabel}>{data.slot}시</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${Math.max(widthPercent, 2)}%` },
                    data.isPeak && styles.barFillPeak
                  ]}
                />
              </View>
              <View style={styles.barRight}>
                <Text style={styles.barAmount}>{formatAmount(data.amount)}</Text>
                {data.isPeak && data.amount > 0 && (
                  <Text style={styles.peakBadge}>피크!</Text>
                )}
              </View>
            </View>
          );
        })}

        {/* 인사이트 팁 */}
        <View style={styles.tipContainer}>
          <Text style={styles.tipLabel}>TIP</Text>
          <Text style={styles.tipText}>{peakTimeMessage}</Text>
        </View>
      </View>
    );
  };

  // 탭2: 매출 추이
  const renderSalesTrend = () => {
    const isDaily = selectedPeriod === 7;
    const displayData = isDaily ? dailySales.slice(-7) : dailySales;
    const maxAmount = Math.max(...displayData.map(d => d.amount), 1);

    return (
      <View>
        {/* 기간 선택 */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 7 && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod(7)}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === 7 && styles.periodButtonTextActive]}>
              7일
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 30 && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod(30)}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === 30 && styles.periodButtonTextActive]}>
              30일
            </Text>
          </TouchableOpacity>
        </View>

        {/* 일별 매출 그래프 */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>일별 매출 추이</Text>

          {displayData.length > 0 ? (
            <View style={styles.dailySalesList}>
              {displayData.map((daily) => {
                const widthPercent = (daily.amount / maxAmount) * 100;

                return (
                  <View key={daily.date} style={styles.barRow}>
                    <Text style={styles.barLabel}>{formatDisplayDate(daily.date)}</Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${Math.max(widthPercent, 2)}%` }
                        ]}
                      />
                    </View>
                    <View style={styles.barRightCompact}>
                      <Text style={styles.barAmount}>{formatAmount(daily.amount)}</Text>
                      <Text style={styles.barCount}>{daily.count}건</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>데이터가 없습니다</Text>
            </View>
          )}
        </View>

        {/* 주간별 매출 (30일 선택 시) */}
        {selectedPeriod === 30 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>주간별 매출</Text>

            {(() => {
              const maxWeekAmount = Math.max(...weeklySales.map(d => d.amount), 1);
              return weeklySales.map((data) => {
                const widthPercent = (data.amount / maxWeekAmount) * 100;

                return (
                  <View key={data.week} style={styles.barRow}>
                    <Text style={styles.barLabel}>{data.week}</Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${Math.max(widthPercent, 2)}%` }
                        ]}
                      />
                    </View>
                    <Text style={styles.barAmount}>{formatAmount(data.amount)}</Text>
                  </View>
                );
              });
            })()}
          </View>
        )}
      </View>
    );
  };

  // 탭3: 상품별 분석
  const renderProductAnalysis = () => {
    return (
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>상품별 판매 순위 (TOP 5)</Text>

        {productSales.length > 0 ? (
          <View style={styles.productList}>
            {productSales.map((product, index) => (
              <View key={product.name} style={styles.productItem}>
                <View style={[
                  styles.productRank,
                  index === 0 && styles.productRankGold,
                  index === 1 && styles.productRankSilver,
                  index === 2 && styles.productRankBronze,
                ]}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={styles.productStats}>
                    {product.quantity}개 판매
                  </Text>
                </View>
                <Text style={styles.productAmount}>
                  {formatAmount(product.amount)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>판매 데이터가 없습니다</Text>
          </View>
        )}
      </View>
    );
  };

  // 탭 콘텐츠 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return renderTimeAnalysis();
      case 1:
        return renderSalesTrend();
      case 2:
        return renderProductAnalysis();
      default:
        return null;
    }
  };

  // ------------------------------------------------------------
  // 렌더링: 메인
  // ------------------------------------------------------------

  if (loading && !refreshing) {
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
          <Text style={styles.backText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>매출 분석</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#00D563']}
            tintColor="#00D563"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 매출 요약 카드 (3개) */}
        {renderSummaryCards()}

        {/* 탭 네비게이션 (3개 탭) */}
        {renderTabNavigation()}

        {/* 탭 콘텐츠 */}
        <View style={styles.contentContainer}>
          {renderTabContent()}
        </View>

        {/* 하단 여백 */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ============================================================
// 스타일
// ============================================================

const styles = StyleSheet.create({
  // 컨테이너
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },

  // 헤더
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

  // 매출 요약 (3개 카드)
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
  },
  summaryAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00D563',
    marginBottom: 4,
  },
  summaryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryGrowth: {
    fontSize: 11,
    fontWeight: '600',
  },
  growthPositive: {
    color: '#00D563',
  },
  growthNegative: {
    color: '#FF6B6B',
  },
  summaryCount: {
    fontSize: 11,
    color: '#666',
  },

  // 탭 네비게이션
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#00D563',
  },
  tabText: {
    fontSize: 14,
    color: '#999',
  },
  tabTextActive: {
    color: '#333',
    fontWeight: 'bold',
  },

  // 차트 섹션
  chartSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },

  // 막대 그래프
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barLabel: {
    width: 55,
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  barTrack: {
    flex: 1,
    height: 24,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#A8E6CF',
    borderRadius: 6,
  },
  barFillPeak: {
    backgroundColor: '#00D563',
  },
  barRight: {
    width: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barRightCompact: {
    width: 100,
    alignItems: 'flex-end',
  },
  barAmount: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  barCount: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  peakBadge: {
    marginLeft: 4,
    fontSize: 11,
    color: '#00D563',
    fontWeight: 'bold',
  },

  // 인사이트 팁
  tipContainer: {
    backgroundColor: '#E8F8EF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
  },
  tipLabel: {
    backgroundColor: '#00D563',
    color: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 'bold',
    marginRight: 8,
    overflow: 'hidden',
  },
  tipText: {
    color: '#00D563',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },

  // 기간 선택
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  periodButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
    marginRight: 8,
  },
  periodButtonActive: {
    backgroundColor: '#00D563',
    borderColor: '#00D563',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#FFF',
  },

  // 일별 매출 리스트
  dailySalesList: {
    marginTop: 8,
  },

  // 상품 목록
  productList: {
    marginTop: 8,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  productRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#BDBDBD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productRankGold: {
    backgroundColor: '#FFD700',
  },
  productRankSilver: {
    backgroundColor: '#C0C0C0',
  },
  productRankBronze: {
    backgroundColor: '#CD7F32',
  },
  rankText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  productStats: {
    fontSize: 12,
    color: '#999',
  },
  productAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00D563',
  },

  // 빈 상태
  emptyState: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});
