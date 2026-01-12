import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Switch } from 'react-native';
import { supabase } from '../lib/supabase';

interface StoreCashManagementProps {
  onBack: () => void;
  onViewHistory: () => void;
}

const QUICK_AMOUNTS = [30000, 50000, 100000];

export default function StoreCashManagement({ onBack, onViewHistory }: StoreCashManagementProps) {
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState('');
  const [cashBalance, setCashBalance] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(50000);
  const [customAmount, setCustomAmount] = useState('');

  const fetchStoreInfo = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('사용자 정보 없음');

      const { data, error } = await supabase
        .from('stores')
        .select('id, cash_balance')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setStoreId(data.id);
      setCashBalance(data.cash_balance);
      setIsActive(data.cash_balance >= 10000);
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

  const handleCharge = async () => {
    const amount = customAmount ? parseInt(customAmount) : selectedAmount;
    if (!amount || amount < 1000) {
      alert('1,000원 이상 충전해주세요.');
      return;
    }
    if (amount % 1000 !== 0) {
      alert('1,000원 단위로 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.rpc('charge_store_cash', {
        p_store_id: storeId,
        p_amount: amount,
        p_description: '캐시 충전',
      });

      if (error) throw error;
      alert('충전이 완료되었습니다.');
      fetchStoreInfo();
      setCustomAmount('');
    } catch (error) {
      console.error('충전 오류:', error);
      alert('충전에 실패했습니다.');
    } finally {
      setLoading(false);
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
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 활성화 상태 */}
        <View style={styles.statusCard}>
          <View style={styles.statusLeft}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>🏪</Text>
            </View>
            <View>
              <Text style={styles.storeName}>그린베이커리 서울점</Text>
              <Text style={styles.statusLabel}>영업 상태: {isActive ? '운영 중' : '준비중'}</Text>
            </View>
          </View>
          <Switch
            value={isActive}
            disabled={true}
            trackColor={{ false: '#D0D0D0', true: '#00D563' }}
            thumbColor="#FFF"
          />
          <Text style={styles.statusBadge}>{isActive ? '활성화' : '비활성'}</Text>
        </View>

        {/* 잔액 카드 */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceAmount}>{cashBalance.toLocaleString()}원</Text>
          <Text style={styles.balanceLabel}>현재 보유 캐시</Text>
          <TouchableOpacity style={styles.chargeButton}>
            <Text style={styles.chargeButtonText}>충전중</Text>
          </TouchableOpacity>
        </View>

        {/* 경고 메시지 */}
        {cashBalance < 10000 && (
          <View style={styles.warningBox}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.warningTitle}>캐시 잔액이 1만원 미만입니다.</Text>
              <Text style={styles.warningText}>
                충전하시면 가게 목록에서 비활성화 처리될 수 있습니다.
              </Text>
            </View>
          </View>
        )}

        {/* 캐시 충전 */}
        <Text style={styles.sectionTitle}>캐시 충전</Text>
        <View style={styles.quickAmountRow}>
          {QUICK_AMOUNTS.map((amt) => (
            <TouchableOpacity
              key={amt}
              style={[
                styles.quickAmountButton,
                selectedAmount === amt && styles.quickAmountButtonActive,
              ]}
              onPress={() => {
                setSelectedAmount(amt);
                setCustomAmount('');
              }}
            >
              <Text style={styles.quickAmountLabel}>{amt / 10000}만</Text>
              <Text
                style={[
                  styles.quickAmountValue,
                  selectedAmount === amt && styles.quickAmountValueActive,
                ]}
              >
                {amt.toLocaleString()}원
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 직접 입력 */}
        <View style={styles.customInputContainer}>
          <TextInput
            style={styles.customInput}
            value={customAmount}
            onChangeText={(val) => {
              setCustomAmount(val);
              setSelectedAmount(null);
            }}
            placeholder="직접 입력"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
          <Text style={styles.customInputUnit}>원</Text>
        </View>

        {/* 충전하기 버튼 */}
        <TouchableOpacity style={styles.submitButton} onPress={handleCharge}>
          <Text style={styles.submitButtonText}>캐시 충전하기</Text>
        </TouchableOpacity>

        {/* 내역 버튼 */}
        <TouchableOpacity style={styles.historyButton} onPress={onViewHistory}>
          <Text style={styles.historyIcon}>🔄</Text>
          <Text style={styles.historyText}>캐시 사용 및 충전 내역</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {/* 안내 */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            예약 완료 시 상품 금액의 15~20%가 캐시에서 수수료로 자감됩니다. 캐시 잔액이 부족할 경우 웹 노중이 중단되오니 충전 금액을 확인해 주세요.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  backButton: { fontSize: 28, color: '#333' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  scrollView: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  statusCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, marginBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  logoCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 24 },
  storeName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  statusLabel: { fontSize: 13, color: '#666' },
  statusBadge: { position: 'absolute', top: 10, right: 10, fontSize: 12, color: '#00D563', fontWeight: '600' },
  balanceCard: { backgroundColor: '#00D563', padding: 24, borderRadius: 16, marginBottom: 15 },
  balanceAmount: { fontSize: 36, fontWeight: 'bold', color: '#FFF', marginBottom: 8 },
  balanceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  chargeButton: { position: 'absolute', bottom: 24, right: 24, backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  chargeButtonText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  warningBox: { backgroundColor: '#FFF4E5', padding: 16, borderRadius: 12, marginBottom: 20, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  warningIcon: { fontSize: 20 },
  warningTitle: { fontSize: 14, fontWeight: '600', color: '#FF6B00', marginBottom: 4 },
  warningText: { fontSize: 13, color: '#666', lineHeight: 18 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  quickAmountRow: { flexDirection: 'row', gap: 12, marginBottom: 15 },
  quickAmountButton: { flex: 1, backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center' },
  quickAmountButtonActive: { borderWidth: 2, borderColor: '#00D563', backgroundColor: '#E8F5E9' },
  quickAmountLabel: { fontSize: 13, color: '#666', marginBottom: 4 },
  quickAmountValue: { fontSize: 15, fontWeight: '600', color: '#333' },
  quickAmountValueActive: { color: '#00D563' },
  customInputContainer: { position: 'relative', marginBottom: 20 },
  customInput: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, paddingRight: 50, fontSize: 15, color: '#333', borderWidth: 1, borderColor: '#E0E0E0' },
  customInputUnit: { position: 'absolute', right: 16, top: 16, fontSize: 15, color: '#999' },
  submitButton: { backgroundColor: '#00D563', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
  submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  historyButton: { backgroundColor: '#FFF', padding: 18, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#E0E0E0' },
  historyIcon: { fontSize: 24, marginRight: 12 },
  historyText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#333' },
  arrow: { fontSize: 24, color: '#999' },
  infoBox: { backgroundColor: '#F9F9F9', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoIcon: { fontSize: 18 },
  infoText: { flex: 1, fontSize: 13, color: '#666', lineHeight: 18 },
});
