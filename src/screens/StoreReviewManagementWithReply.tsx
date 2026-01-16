import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface StoreReviewManagementProps {
  onBack: () => void;
}

interface Review {
  id: string;
  rating: number;
  content: string;
  reply: string | null;
  created_at: string;
  consumers: {
    nickname: string;
  };
  products: {
    name: string;
  };
}

export default function StoreReviewManagementWithReply({ onBack }: StoreReviewManagementProps) {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [storeId, setStoreId] = useState('');

  // 답글 모달
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchStoreId = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('사용자 정보를 찾을 수 없습니다');

      const { data: storeData, error } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return storeData.id;
    } catch (error) {
      console.error('업체 정보 로딩 오류:', error);
      throw error;
    }
  }, []);

  const fetchReviews = useCallback(async (storeIdParam: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reviews')
        .select('*, consumers(nickname), products(name)')
        .eq('store_id', storeIdParam)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('리뷰 로딩 오류:', error);
      Alert.alert('오류', '리뷰를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const id = await fetchStoreId();
        setStoreId(id);
        await fetchReviews(id);
      } catch {
        Alert.alert('오류', '리뷰를 불러오는데 실패했습니다.');
      }
    };

    init();
  }, [fetchStoreId, fetchReviews]);

  const openReplyModal = (review: Review) => {
    setSelectedReview(review);
    setReplyText(review.reply || '');
    setReplyModalVisible(true);
  };

  const handleSubmitReply = async () => {
    if (!selectedReview) return;
    if (!replyText.trim()) {
      Alert.alert('알림', '답글을 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('reviews')
        .update({ reply: replyText.trim() })
        .eq('id', selectedReview.id);

      if (error) throw error;

      Alert.alert('완료', '답글이 등록되었습니다.');
      setReplyModalVisible(false);
      setReplyText('');
      setSelectedReview(null);
      await fetchReviews(storeId);
    } catch (error) {
      console.error('답글 등록 오류:', error);
      Alert.alert('오류', '답글 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReply = async () => {
    if (!selectedReview) return;

    Alert.alert('확인', '답글을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            setSubmitting(true);

            const { error } = await supabase
              .from('reviews')
              .update({ reply: null })
              .eq('id', selectedReview.id);

            if (error) throw error;

            Alert.alert('완료', '답글이 삭제되었습니다.');
            setReplyModalVisible(false);
            setReplyText('');
            setSelectedReview(null);
            await fetchReviews(storeId);
          } catch (error) {
            console.error('답글 삭제 오류:', error);
            Alert.alert('오류', '답글 삭제에 실패했습니다.');
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>리뷰 관리</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 통계 */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{reviews.length}</Text>
          <Text style={styles.statLabel}>전체 리뷰</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {reviews.filter((r) => r.reply).length}
          </Text>
          <Text style={styles.statLabel}>답글 작성</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {reviews.length > 0
              ? (
                  reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                ).toFixed(1)
              : '0.0'}
          </Text>
          <Text style={styles.statLabel}>평균 평점</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {reviews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>아직 리뷰가 없습니다.</Text>
          </View>
        ) : (
          reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              {/* 리뷰 헤더 */}
              <View style={styles.reviewHeader}>
                <View>
                  <Text style={styles.reviewerName}>{review.consumers?.nickname}</Text>
                  <Text style={styles.reviewDate}>{formatDate(review.created_at)}</Text>
                </View>
                <Text style={styles.reviewRating}>{renderStars(review.rating)}</Text>
              </View>

              {/* 상품명 */}
              <Text style={styles.productName}>📦 {review.products?.name}</Text>

              {/* 리뷰 내용 */}
              <Text style={styles.reviewContent}>{review.content}</Text>

              {/* 답글 */}
              {review.reply && (
                <View style={styles.replyContainer}>
                  <Text style={styles.replyLabel}>💚 업주 답글</Text>
                  <Text style={styles.replyText}>{review.reply}</Text>
                </View>
              )}

              {/* 답글 버튼 */}
              <TouchableOpacity
                style={styles.replyButton}
                onPress={() => openReplyModal(review)}
              >
                <Text style={styles.replyButtonText}>
                  {review.reply ? '답글 수정' : '답글 작성'}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 답글 모달 */}
      <Modal
        visible={replyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReplyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* 모달 헤더 */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setReplyModalVisible(false)}>
                <Text style={styles.modalBackButton}>←</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>답글 작성</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* 원본 리뷰 */}
            {selectedReview && (
              <View style={styles.originalReview}>
                <Text style={styles.originalReviewLabel}>원본 리뷰</Text>
                <Text style={styles.originalReviewRating}>
                  {renderStars(selectedReview.rating)}
                </Text>
                <Text style={styles.originalReviewContent}>{selectedReview.content}</Text>
              </View>
            )}

            {/* 답글 입력 */}
            <TextInput
              style={styles.replyInput}
              value={replyText}
              onChangeText={setReplyText}
              placeholder="친절하고 감사한 답글을 작성해주세요."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* 버튼 */}
            <View style={styles.modalButtons}>
              {selectedReview?.reply && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDeleteReply}
                  disabled={submitting}
                >
                  <Text style={styles.deleteButtonText}>삭제</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  !selectedReview?.reply && { flex: 1 },
                ]}
                onPress={handleSubmitReply}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {selectedReview?.reply ? '수정' : '등록'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    fontSize: 28,
    color: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },

  // 통계
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00D563',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },

  // 스크롤뷰
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // 빈 화면
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
  },

  // 리뷰 카드
  reviewCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  reviewRating: {
    fontSize: 16,
  },
  productName: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  reviewContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },

  // 답글
  replyContainer: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  replyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00A84D',
    marginBottom: 6,
  },
  replyText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },

  // 답글 버튼
  replyButton: {
    backgroundColor: '#00D563',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  replyButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // 모달
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalBackButton: {
    fontSize: 28,
    color: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },

  // 원본 리뷰
  originalReview: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  originalReviewLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  originalReviewRating: {
    fontSize: 16,
    marginBottom: 8,
  },
  originalReviewContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },

  // 답글 입력
  replyInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 120,
    marginBottom: 20,
  },

  // 버튼
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#00D563',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
