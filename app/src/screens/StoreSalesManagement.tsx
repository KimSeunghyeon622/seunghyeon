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

interface StoreSalesManagementProps {
  onBack: () => void;
}

interface TimeSlotData {
  slot: string;      // '09-12', '12-15', '15-18', '18-21', '21-24'
  amount: number;    // 금액
  count: number;     // 건수
  isPeak: boolean;   // 피크타임 여부
}

interface RevenueData {
  totalSales: number;   // 총매출
}

interface SalesSummary {
  todaySales: number;
  todayGrowth: number;      // 전일 대비 증감률
  weekSales: number;
  weekGrowth: number;       // 전주 대비 증감률
}

// ============================================================
// 상수 정의
// ============================================================

const TIME_SLOTS = ['09-12', '12-15', '15-18', '18-21', '21-24'];

// ============================================================
// 컴포넌트
// ============================================================

export default function StoreSalesManagement({ onBack }: StoreSalesManagementProps) {
  // 상태
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [storeId, setStoreId] = useState<string>('');
  const [activeTab, setActiveTab] = useState(0);  // 0: 시간 분석, 1: 수익 분석
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 30>(7);

  // 데이터
  const [summary, setSummary] = useState<SalesSummary>({
    todaySales: 0,
    todayGrowth: 0,
    weekSales: 0,
    weekGrowth: 0,
  });
  const [timeSlotData, setTimeSlotData] = useState<TimeSlotData[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData>({
    totalSales: 0,
  });
  const [peakTimeMessage, setPeakTimeMessage] = useState<string>('');
  const [dailyRevenueData, setDailyRevenueData] = useState<{date: string; amount: number}[]>([]);
  const [weeklyRevenueData, setWeeklyRevenueData] = useState<{week: string; amount: number}[]>([]);

  // ------------------------------------------------------------
  // 유틸리티 함수
  // ------------------------------------------------------------

  // 날짜 포맷팅 (YYYY-MM-DD)
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
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
      '09-12': '오전 9-12시가 가장 바빠요!',
      '12-15': '점심시간(12-15시)이 가장 바빠요!',
      '15-18': '오후 3-6시가 가장 바빠요!',
      '18-21': '저녁시간(18-21시)이 가장 바빠요!',
      '21-24': '야간 시간(21-24시)이 가장 바빠요!',
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

      // 기간 시작일 (7일 또는 30일)
      const periodStart = new Date(now);
      periodStart.setDate(now.getDate() - selectedPeriod);
      const periodStartStr = formatDate(periodStart);

      // 완료된 예약 조회
      const { data: reservations, error } = await supabase
        .from('reservations')
        .select('id, total_amount, quantity, created_at')
        .eq('store_id', storeId)
        .eq('status', 'completed')
        .gte('created_at', periodStartStr)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // ----------------------------------------------------------------
      // 1. 매출 요약 계산
      // ----------------------------------------------------------------

      // 오늘 매출
      const todayReservations = reservations?.filter(r =>
        r.created_at.startsWith(today)
      ) || [];
      const todaySales = todayReservations.reduce((sum, r) => sum + Number(r.total_amount), 0);

      // 어제 매출 (증감률 계산용)
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

      setSummary({
        todaySales,
        todayGrowth,
        weekSales,
        weekGrowth,
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
      // 3. 수익 분석
      // ----------------------------------------------------------------

      const periodReservations = reservations || [];
      const totalSales = periodReservations.reduce((sum, r) => sum + Number(r.total_amount), 0);

      setRevenueData({
        totalSales,
      });

      // ----------------------------------------------------------------
      // 4. 일자별/주간별 매출 데이터
      // ----------------------------------------------------------------

      // 일자별 매출 계산 (최근 7일)
      const dailyData: {date: string; amount: number}[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateStr = formatDate(d);
        const dayReservations = reservations?.filter(r => r.created_at.startsWith(dateStr)) || [];
        const dayAmount = dayReservations.reduce((sum, r) => sum + Number(r.total_amount), 0);
        dailyData.push({
          date: `${d.getMonth() + 1}/${d.getDate()}`,
          amount: dayAmount
        });
      }
      setDailyRevenueData(dailyData);

      // 주간별 매출 계산 (최근 4주)
      const weeklyData: {week: string; amount: number}[] = [];
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
          amount: weekAmount
        });
      }
      setWeeklyRevenueData(weeklyData);

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

  // 매출 요약 카드
  const renderSummaryCard = (
    label: string,
    amount: number,
    growth?: number,
  ) => {
    const showGrowth = growth !== undefined && growth !== 0;
    const isPositive = growth && growth > 0;

    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={styles.summaryAmount}>{formatAmount(amount)}</Text>
        {showGrowth ? (
          <Text style={[
            styles.summaryGrowth,
            isPositive ? styles.growthPositive : styles.growthNegative
          ]}>
            {formatGrowth(growth)}
          </Text>
        ) : (
          <Text style={styles.summarySuffix}>-</Text>
        )}
      </View>
    );
  };

  // 탭 네비게이션
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
          수익 분석
        </Text>
      </TouchableOpacity>
    </View>
  );

  // 시간대별 막대 그래프
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

  // 수익 분석
  const renderRevenueAnalysis = () => {
    const isDaily = selectedPeriod === 7;

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

        {/* 매출 분석 카드 */}
        <View style={styles.revenueCard}>
          <Text style={styles.sectionTitle}>매출 분석 (최근 {selectedPeriod}일)</Text>

          {/* 총매출 */}
          <View style={styles.totalSalesRow}>
            <Text style={styles.totalSalesLabel}>총매출</Text>
            <Text style={styles.totalSalesAmount}>{formatAmount(revenueData.totalSales)}</Text>
          </View>

          {/* 그래프 */}
          <Text style={styles.chartSubtitle}>
            {isDaily ? '일자별 매출' : '주간별 매출'}
          </Text>
          {isDaily ? (
            // 일자별 매출 그래프
            (() => {
              const maxChartAmount = Math.max(...dailyRevenueData.map(d => d.amount), 1);
              return dailyRevenueData.map((data, index) => {
                const widthPercent = (data.amount / maxChartAmount) * 100;
                return (
                  <View key={index} style={styles.barRow}>
                    <Text style={styles.barLabel}>{data.date}</Text>
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
            })()
          ) : (
            // 주간별 매출 그래프
            (() => {
              const maxChartAmount = Math.max(...weeklyRevenueData.map(d => d.amount), 1);
              return weeklyRevenueData.map((data, index) => {
                const widthPercent = (data.amount / maxChartAmount) * 100;
                return (
                  <View key={index} style={styles.barRow}>
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
            })()
          )}
        </View>
      </View>
    );
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
        <Text style={styles.title}>판매 관리</Text>
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
        {/* 매출 요약 카드 */}
        <View style={styles.summaryContainer}>
          {renderSummaryCard('오늘 매출', summary.todaySales, summary.todayGrowth)}
          {renderSummaryCard('이번 주', summary.weekSales, summary.weekGrowth)}
        </View>

        {/* 탭 네비게이션 */}
        {renderTabNavigation()}

        {/* 탭 콘텐츠 */}
        <View style={styles.contentContainer}>
          {activeTab === 0 ? renderTimeAnalysis() : renderRevenueAnalysis()}
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

  // 매출 요약
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
  summaryGrowth: {
    fontSize: 12,
    fontWeight: '600',
  },
  growthPositive: {
    color: '#00D563',
  },
  growthNegative: {
    color: '#FF6B6B',
  },
  summarySuffix: {
    fontSize: 12,
    color: '#999',
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
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#00D563',
  },
  tabText: {
    fontSize: 15,
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
    backgroundColor: '#A8E6CF',  // 연한 그린
    borderRadius: 6,
  },
  barFillPeak: {
    backgroundColor: '#00D563',  // 진한 그린 (피크)
  },
  barRight: {
    width: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barAmount: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
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
    alignItems: 'center',
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
    fontSize: 14,
    flex: 1,
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

  // 수익 분석
  revenueCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  totalSalesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  totalSalesLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  totalSalesAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00D563',
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
});
