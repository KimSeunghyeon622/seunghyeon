import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';

export default function MyReservations({ onBack, onWriteReview }: { onBack: () => void; onWriteReview: (reservation: any) => void }) {
  const [reservations, setReservations] = useState<any[]>([]);

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: consumer } = await supabase.from('consumers').select('id').eq('user_id', user.id).single();
    if (!consumer) return;

    const { data } = await supabase
      .from('reservations')
      .select('*, product:products(*), store:stores(*)')
      .eq('consumer_id', consumer.id)
      .order('created_at', { ascending: false });

    if (data) setReservations(data);
  };

  const checkReviewExists = async (reservationId: string) => {
    const { data } = await supabase
      .from('reviews')
      .select('id')
      .eq('reservation_id', reservationId)
      .single();

    return !!data;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>← 뒤로</Text>
      </TouchableOpacity>
      <Text style={styles.title}>내 예약 내역</Text>
      <FlatList
        data={reservations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.number}>예약번호: {item.reservation_number}</Text>
            <Text style={styles.store}>{item.store.name}</Text>
            <Text style={styles.product}>{item.product.name} x {item.quantity}</Text>
            <Text style={styles.amount}>{item.total_amount.toLocaleString()}원</Text>
            <Text style={styles.status}>
              {item.status === 'confirmed' ? '✅ 예약완료' : item.status}
            </Text>
            {item.status === 'confirmed' && (
              <TouchableOpacity
                style={styles.reviewButton}
                onPress={() => onWriteReview(item)}
              >
                <Text style={styles.reviewButtonText}>리뷰 작성</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  backButton: { marginBottom: 15 },
  backText: { fontSize: 16, color: '#007AFF' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: '#f5f5f5', padding: 15, borderRadius: 10, marginBottom: 10 },
  number: { fontSize: 14, color: '#666', marginBottom: 5 },
  store: { fontSize: 18, fontWeight: 'bold', marginBottom: 3 },
  product: { fontSize: 16, color: '#333', marginBottom: 3 },
  amount: { fontSize: 16, color: '#007AFF', fontWeight: 'bold', marginBottom: 3 },
  status: { fontSize: 14, color: '#00C853' },
  reviewButton: { backgroundColor: '#FF9800', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  reviewButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});
