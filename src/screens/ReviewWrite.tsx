import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';

interface ReviewWriteProps {
  reservation: any;
  onBack: () => void;
  onComplete: () => void;
}

export default function ReviewWrite({ reservation, onBack, onComplete }: ReviewWriteProps) {
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('별점을 선택해주세요.');
      return;
    }
    if (!content.trim()) {
      alert('리뷰 내용을 입력해주세요.');
      return;
    }
    if (content.length > 500) {
      alert('리뷰는 500자 이내로 작성해주세요.');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.from('reviews').insert({
        reservation_id: reservation.id,
        consumer_id: reservation.consumer_id,
        store_id: reservation.store_id,
        rating,
        content,
      });

      if (error) throw error;

      alert('리뷰가 등록되었습니다.');
      onComplete();
    } catch (error) {
      console.error('리뷰 등록 오류:', error);
      alert('리뷰 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💚 Save It</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* 픽업 완료 아이콘 */}
        <View style={styles.completeIconContainer}>
          <View style={styles.completeIcon}>
            <Text style={styles.completeIconText}>✓</Text>
          </View>
        </View>

        <Text style={styles.title}>픽업 완료!</Text>
        <Text style={styles.subtitle}>매장에서의 경험은 어떠셨나요?</Text>

        {/* 가게 정보 */}
        <View style={styles.storeCard}>
          <View style={styles.storeIcon}>
            <Text style={styles.storeIconText}>🏪</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.storeName}>{reservation.stores?.name || 'Green Garden Bistro'}</Text>
            <Text style={styles.productName}>{reservation.products?.name} x{reservation.quantity}</Text>
            <Text style={styles.reservationNumber}>주문번호 #{reservation.reservation_number}</Text>
          </View>
        </View>

        {/* 별점 선택 */}
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Text style={styles.star}>{star <= rating ? '★' : '☆'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingLabel}>
          {rating === 0
            ? '별점을 선택해주세요'
            : rating === 5
            ? '아주 좋아요'
            : rating === 4
            ? '좋아요'
            : rating === 3
            ? '보통이에요'
            : rating === 2
            ? '별로에요'
            : '아쉬워요'}
        </Text>

        {/* 리뷰 작성 */}
        <Text style={styles.label}>리뷰 작성하기</Text>
        <TextInput
          style={styles.textarea}
          value={content}
          onChangeText={setContent}
          placeholder="다른 분들께 도움이 되도록 상품이나 픽업 과정에 대한 후기를 남겨주세요."
          placeholderTextColor="#999"
          multiline
          numberOfLines={6}
          maxLength={500}
        />
        <Text style={styles.charCount}>{content.length} / 500</Text>

        {/* 안내 */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            리뷰는 공성된 피드백을 위해 업체별 1회만 작성 가능하며, 작성 시 수정이 불가하니 신중하게 작성해 주세요.
          </Text>
        </View>

        {/* 버튼 */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>리뷰 등록하기 ➤</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={onBack}>
          <Text style={styles.skipButtonText}>나중에하기</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  backButton: { fontSize: 28, color: '#333' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 30 },
  completeIconContainer: { alignItems: 'center', marginBottom: 20 },
  completeIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  completeIconText: { fontSize: 40, color: '#00D563', fontWeight: 'bold' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 30 },
  storeCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 30, flexDirection: 'row', alignItems: 'center', gap: 12 },
  storeIcon: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  storeIconText: { fontSize: 24 },
  storeName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  productName: { fontSize: 14, color: '#666', marginBottom: 2 },
  reservationNumber: { fontSize: 13, color: '#00D563', fontWeight: '600' },
  ratingContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 12 },
  star: { fontSize: 48, color: '#FFB800' },
  ratingLabel: { fontSize: 16, color: '#FF9800', textAlign: 'center', marginBottom: 30, fontWeight: '600' },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  textarea: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, fontSize: 15, color: '#333', height: 150, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 8 },
  charCount: { fontSize: 13, color: '#999', textAlign: 'right', marginBottom: 20 },
  infoBox: { backgroundColor: '#FFF4E5', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 20 },
  infoIcon: { fontSize: 18 },
  infoText: { flex: 1, fontSize: 13, color: '#666', lineHeight: 18 },
  submitButton: { backgroundColor: '#00D563', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  skipButton: { paddingVertical: 14, alignItems: 'center' },
  skipButtonText: { fontSize: 15, color: '#999' },
});
