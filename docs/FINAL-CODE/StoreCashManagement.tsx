import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput, Modal } from 'react-native';
import { supabase } from '../lib/supabase';

interface CashTransaction {
  id: string;
  transaction_type: 'charge' | 'fee' | 'refund';
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

export default function StoreCashManagement({ onBack }: { onBack: () => void }) {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [storeId, setStoreId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [chargeModalVisible, setChargeModalVisible] = useState(false);
  const [chargeAmount, setChargeAmount] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 업체 정보 가져오기
      const { data: store } = await supabase
        .from('stores')
        .select('id, cash_balance')
        .eq('user_id', user.id)
        .single();

      if (!store) {
        Alert.alert('오류', '업체 정보를 찾을 수 없습니다');
        return;
      }

      setStoreId(store.id);
      setBalance(store.cash_balance || 0);

      // 거래 내역 가져오기
      const { data: transactionsData, error } = await supabase
        .from('cash_transactions')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (transactionsData) setTransactions(transactionsData);
    } catch (err: any) {
      console.error('데이터 로드 오류:', err);
      Alert.alert('오류', '데이터를 불러오는 중 문제가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleCharge = async () => {
    const amount = parseFloat(chargeAmount);

    if (!amount || amount <= 0) {
      Alert.alert('오류', '충전 금액을 올바르게 입력해주세요');
      return;
    }

    try {
      // 실제로는 토스페이먼츠 결제를 먼저 진행해야 함
      // 여기서는 데모용으로 바로 충전
      const { error } = await supabase.rpc('charge_store_cash', {
        p_store_id: storeId,
        p_amount: amount,
        p_description: '캐시 충전',
      });

      if (error) throw error;

      Alert.alert('완료', `${amount.toLocaleString()}원이 충전되었습니다`);
      setChargeModalVisible(false);
      setChargeAmount('');
      loadData();
    } catch (err: any) {
      console.error('충전 오류:', err);
      Alert.alert('오류', '충전 중 문제가 발생했습니다');
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'charge':
        return '#34C759';
      case 'fee':
        return '#FF3B30';
      case 'refund':
        return '#007AFF';
      default:
        return '#999';
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'charge':
        return '충전';
      case 'fee':
        return '수수료';
      case 'refund':
        return '환불';
      default:
        return '기타';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>로딩 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.title}>캐시 관리</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* 캐시 잔액 */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>현재 캐시 잔액</Text>
        <Text style={styles.balanceAmount}>{balance.toLocaleString()}원</Text>
        <TouchableOpacity
          style={styles.chargeButton}
          onPress={() => setChargeModalVisible(true)}
        >
          <Text style={styles.chargeButtonText}>캐시 충전</Text>
        </TouchableOpacity>
      </View>

      {/* 거래 내역 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>거래 내역</Text>
      </View>

      <ScrollView style={styles.content}>
        {transactions.length === 0 ? (
          <Text style={styles.emptyText}>거래 내역이 없습니다</Text>
        ) : (
          transactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <View style={[styles.typeBadge, { backgroundColor: getTransactionColor(transaction.transaction_type) }]}>
                  <Text style={styles.typeText}>{getTransactionLabel(transaction.transaction_type)}</Text>
                </View>
                <Text
                  style={[
                    styles.amount,
                    { color: transaction.transaction_type === 'charge' ? '#34C759' : '#FF3B30' },
                  ]}
                >
                  {transaction.amount >= 0 ? '+' : ''}
                  {transaction.amount.toLocaleString()}원
                </Text>
              </View>

              <Text style={styles.description}>{transaction.description}</Text>

              <View style={styles.transactionFooter}>
                <Text style={styles.date}>{formatDate(transaction.created_at)}</Text>
                <Text style={styles.balanceAfter}>
                  잔액: {transaction.balance_after.toLocaleString()}원
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* 충전 모달 */}
      <Modal visible={chargeModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>캐시 충전</Text>

            <Text style={styles.infoText}>
              💡 실제 서비스에서는 토스페이먼츠를 통해 결제됩니다
            </Text>

            <Text style={styles.label}>충전 금액 (원)</Text>
            <TextInput
              style={styles.input}
              value={chargeAmount}
              onChangeText={setChargeAmount}
              placeholder="예: 100000"
              keyboardType="numeric"
            />

            <View style={styles.presetButtons}>
              {[10000, 50000, 100000, 500000].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={styles.presetButton}
                  onPress={() => setChargeAmount(amount.toString())}
                >
                  <Text style={styles.presetButtonText}>{amount.toLocaleString()}원</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setChargeModalVisible(false);
                  setChargeAmount('');
                }}
              >
                <Text style={styles.buttonText}>취소</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleCharge}
              >
                <Text style={styles.buttonText}>충전하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backText: { fontSize: 16, color: '#007AFF' },
  title: { fontSize: 20, fontWeight: 'bold' },
  balanceCard: {
    backgroundColor: '#007AFF',
    margin: 15,
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
  },
  balanceLabel: { color: '#fff', fontSize: 16, marginBottom: 10 },
  balanceAmount: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginBottom: 20 },
  chargeButton: { backgroundColor: '#fff', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  chargeButtonText: { color: '#007AFF', fontWeight: 'bold', fontSize: 16 },
  section: { paddingHorizontal: 15, paddingTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  content: { flex: 1, paddingHorizontal: 15 },
  emptyText: { textAlign: 'center', marginTop: 30, fontSize: 16, color: '#999' },
  transactionCard: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 10 },
  transactionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5 },
  typeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  amount: { fontSize: 18, fontWeight: 'bold' },
  description: { fontSize: 14, color: '#333', marginBottom: 10 },
  transactionFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  date: { fontSize: 12, color: '#999' },
  balanceAfter: { fontSize: 12, color: '#666', fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: { backgroundColor: '#fff', borderRadius: 10, padding: 20, width: '90%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  infoText: {
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 5,
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 15,
  },
  label: { fontSize: 14, fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 5,
    fontSize: 18,
    marginBottom: 15,
  },
  presetButtons: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  presetButton: {
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 5,
    margin: 5,
    minWidth: '45%',
    alignItems: 'center',
  },
  presetButtonText: { color: '#007AFF', fontWeight: 'bold' },
  modalButtons: { flexDirection: 'row', marginTop: 10, justifyContent: 'space-between' },
  modalButton: { flex: 1, padding: 15, borderRadius: 5, marginHorizontal: 5, alignItems: 'center' },
  cancelButton: { backgroundColor: '#999' },
  confirmButton: { backgroundColor: '#34C759' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
