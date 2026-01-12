import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';

interface StoreCashHistoryProps {
  onBack: () => void;
}

type FilterType = '전체' | '충전' | '사용';

export default function StoreCashHistory({ onBack }: StoreCashHistoryProps) {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('전체');
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (!store) return;

      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      const { data, error } = await supabase
        .from('cash_transactions')
        .select('*')
        .eq('store_id', store.id)
        .gte('created_at', twoYearsAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('내역 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    if (filter === '충전') return t.transaction_type === 'charge';
    if (filter === '사용') return t.transaction_type === 'fee';
    return true;
  });

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
        <Text style={styles.headerTitle}>캐시 내역</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.filterRow}>
        {(['전체', '충전', '사용'] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollView}>
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>내역이 없습니다.</Text>
          </View>
        ) : (
          filteredTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View>
                <Text style={styles.transactionType}>
                  {transaction.transaction_type === 'charge' ? '💵 충전' : '💸 사용'}
                </Text>
                <Text style={styles.transactionDesc}>{transaction.description}</Text>
                <Text style={styles.transactionDate}>
                  {new Date(transaction.created_at).toLocaleString('ko-KR')}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={[
                    styles.transactionAmount,
                    transaction.transaction_type === 'charge'
                      ? styles.transactionAmountCharge
                      : styles.transactionAmountFee,
                  ]}
                >
                  {transaction.transaction_type === 'charge' ? '+' : '-'}
                  {Math.abs(transaction.amount).toLocaleString()}원
                </Text>
                <Text style={styles.transactionBalance}>
                  잔액: {transaction.balance_after.toLocaleString()}원
                </Text>
              </View>
            </View>
          ))
        )}
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
  filterRow: { flexDirection: 'row', backgroundColor: '#FFF', padding: 15, gap: 10 },
  filterButton: { flex: 1, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center' },
  filterButtonActive: { backgroundColor: '#00D563' },
  filterText: { fontSize: 14, fontWeight: '600', color: '#666' },
  filterTextActive: { color: '#FFF' },
  scrollView: { flex: 1, paddingHorizontal: 20, paddingTop: 15 },
  emptyContainer: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#999' },
  transactionCard: { backgroundColor: '#FFF', padding: 18, borderRadius: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  transactionType: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 4 },
  transactionDesc: { fontSize: 13, color: '#666', marginBottom: 4 },
  transactionDate: { fontSize: 12, color: '#999' },
  transactionAmount: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  transactionAmountCharge: { color: '#00D563' },
  transactionAmountFee: { color: '#FF6B6B' },
  transactionBalance: { fontSize: 13, color: '#999' },
});
