import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';

export default function ReviewScreen({ reservation, onBack }: any) {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('오류', '리뷰 내용을 입력해주세요');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('오류', '로그인이 필요합니다');
        return;
      }

      const { data: consumer } = await supabase
        .from('consumers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!consumer) {
        Alert.alert('오류', '소비자 정보를 찾을 수 없습니다');
        return;
      }

      // 리뷰 작성
      const { error } = await supabase.from('reviews').insert({
        reservation_id: reservation.id,
        consumer_id: consumer.id,
        store_id: reservation.store_id,
        rating,
        content: content.trim(),
      });

      if (error) {
        Alert.alert('오류', error.message);
        return;
      }

      // 업체 평점 업데이트
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('store_id', reservation.store_id);

      if (reviews && reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        await supabase
          .from('stores')
          .update({ average_rating: avgRating })
          .eq('id', reservation.store_id);
      }

      Alert.alert('완료', '리뷰가 작성되었습니다!', [
        { text: '확인', onPress: onBack }
      ]);
    } catch (err) {
      Alert.alert('오류', '리뷰 작성 중 문제가 발생했습니다');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>← 뒤로</Text>
      </TouchableOpacity>

      <Text style={styles.title}>리뷰 작성</Text>

      <View style={styles.section}>
        <Text style={styles.label}>업체</Text>
        <Text style={styles.value}>{reservation.store?.name || '업체명 없음'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>상품</Text>
        <Text style={styles.value}>{reservation.product?.name || '상품명 없음'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>별점</Text>
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Text style={styles.star}>{star <= rating ? '⭐' : '☆'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>리뷰 내용</Text>
        <TextInput
          style={styles.textArea}
          value={content}
          onChangeText={setContent}
          placeholder="이용 경험을 공유해주세요"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>리뷰 등록</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20
  },
  backButton: {
    marginBottom: 15
  },
  backText: {
    fontSize: 16,
    color: '#007AFF'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20
  },
  section: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5
  },
  value: {
    fontSize: 16,
    color: '#333'
  },
  ratingContainer: {
    flexDirection: 'row',
    marginTop: 10
  },
  star: {
    fontSize: 40,
    marginRight: 5
  },
  textArea: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginTop: 5,
    minHeight: 150,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 20
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
});
