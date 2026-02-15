/**
 * 리뷰 작성 화면
 * - 별점 선택 (1-5)
 * - 리뷰 내용 입력
 * - 사진 업로드 (최대 2장)
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import ReviewImagePicker from '../components/ReviewImagePicker';

interface ReviewScreenProps {
  reservation: {
    id: string;
    store_id: string;
    store?: { name: string };
    product?: { name: string };
  };
  onBack: () => void;
  onComplete?: () => void; // 리뷰 작성 완료 시 호출 (있으면 onComplete, 없으면 onBack 호출)
}

export default function ReviewScreen({ reservation, onBack, onComplete }: ReviewScreenProps) {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('오류', '로그인이 필요합니다');
        return;
      }

      const { data: consumer } = await supabase
        .from('consumers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!consumer) {
        Alert.alert('오류', '소비자 정보를 찾을 수 없습니다');
        return;
      }

      // 리뷰 작성 (이미지 포함)
      const { error } = await supabase.from('reviews').insert({
        reservation_id: reservation.id,
        consumer_id: consumer.id,
        store_id: reservation.store_id,
        rating,
        content: content.trim(),
        image_urls: images.length > 0 ? images : null,
      });

      if (error) {
        Alert.alert('오류', '리뷰 정보를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      // 업체 평점 업데이트
      try {
        // 약간의 딜레이 후 평점 계산 (DB 반영 대기)
        await new Promise(resolve => setTimeout(resolve, 500));

        const { data: reviews, error: reviewsError } = await supabase
          .from('reviews')
          .select('rating')
          .eq('store_id', reservation.store_id);

        if (reviewsError) {
          console.error('리뷰 조회 오류:', reviewsError);
        } else if (reviews && reviews.length > 0) {
          const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
          const roundedRating = Math.round(avgRating * 10) / 10;

          console.log(`평점 업데이트: ${reviews.length}개 리뷰, 평균 ${roundedRating}점`);

          const { error: updateError } = await supabase
            .from('stores')
            .update({
              average_rating: roundedRating,
              review_count: reviews.length,
            })
            .eq('id', reservation.store_id);

          if (updateError) {
            console.error('업체 평점 업데이트 오류:', updateError);
          }
        }
      } catch (ratingError) {
        console.error('평점 계산 오류:', ratingError);
        // 평점 업데이트 실패해도 리뷰 작성은 완료로 처리
      }

      Alert.alert('완료', '리뷰가 작성되었습니다!', [
        { text: '확인', onPress: onComplete ?? onBack }
      ]);
    } catch (err) {
      console.error('리뷰 작성 오류:', err);
      Alert.alert('오류', '리뷰 작성에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>X</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>리뷰 작성</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 업체/상품 정보 */}
        <View style={styles.infoCard}>
          <Text style={styles.storeName}>{reservation.store?.name || '업체명 없음'}</Text>
          <Text style={styles.productName}>{reservation.product?.name || '상품명 없음'}</Text>
        </View>

        {/* 별점 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>별점을 선택해주세요</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Text style={[styles.star, star <= rating ? styles.starActive : styles.starInactive]}>
                  {star <= rating ? '\u2605' : '\u2606'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingText}>
            {rating === 5 ? '아주 좋아요!' :
             rating === 4 ? '좋아요' :
             rating === 3 ? '보통이에요' :
             rating === 2 ? '별로예요' : '아쉬워요'}
          </Text>
        </View>

        {/* 리뷰 내용 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>리뷰를 작성해주세요</Text>
          <TextInput
            style={styles.textArea}
            value={content}
            onChangeText={setContent}
            placeholder="상품 품질, 가격, 픽업 경험 등을 자유롭게 작성해주세요"
            placeholderTextColor="#999"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{content.length}/500</Text>
        </View>

        {/* 사진 업로드 */}
        <View style={styles.section}>
          <ReviewImagePicker
            images={images}
            onImagesChange={setImages}
            maxImages={2}
            disabled={submitting}
          />
        </View>

        {/* 안내 문구 */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeTitle}>작성 안내</Text>
          <Text style={styles.noticeText}>
            {'\u2022'} 욕설, 비방, 허위 사실 등은 삭제될 수 있습니다.{'\n'}
            {'\u2022'} 리뷰는 다른 고객에게 큰 도움이 됩니다.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.bottomButton}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>별점 등록</Text>
          )}
        </TouchableOpacity>
      </View>
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
    fontSize: 20,
    color: '#333',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 30,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  star: {
    fontSize: 40,
  },
  starActive: {
    color: '#FFB800',
  },
  starInactive: {
    color: '#E0E0E0',
  },
  ratingText: {
    fontSize: 14,
    color: '#00D563',
    fontWeight: '600',
    textAlign: 'center',
  },
  textArea: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    fontSize: 15,
    color: '#333',
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
  noticeBox: {
    backgroundColor: '#FFF4E5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9800',
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  bottomButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 16,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  submitButton: {
    backgroundColor: '#00D563',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
