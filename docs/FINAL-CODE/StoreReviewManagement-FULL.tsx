import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image, Modal } from 'react-native';
import { supabase } from '../lib/supabase';

interface StoreReviewManagementProps {
  onBack: () => void;
}

export default function StoreReviewManagement({ onBack }: StoreReviewManagementProps) {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'replied'>('pending');
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState({ avgRating: 0, totalCount: 0, ratingDist: [0, 0, 0, 0, 0] });
  const [replyModal, setReplyModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: store } = await supabase.from('stores').select('id, average_rating, review_count').eq('user_id', user.id).single();

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*, consumers(nickname)')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      setReviews(reviewsData || []);

      // 별점 분포 계산
      const dist = [0, 0, 0, 0, 0];
      reviewsData?.forEach((r) => {
        dist[r.rating - 1]++;
      });
      setStats({ avgRating: store.average_rating || 0, totalCount: store.review_count || 0, ratingDist: dist });
    } catch (error) {
      console.error('리뷰 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) {
      alert('답글을 입력해주세요.');
      return;
    }
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ reply: replyText, replied_at: new Date().toISOString() })
        .eq('id', selectedReview.id);

      if (error) throw error;
      alert('답글이 등록되었습니다.');
      setReplyModal(false);
      setSelectedReview(null);
      setReplyText('');
      fetchReviews();
    } catch (error) {
      console.error('답글 등록 오류:', error);
      alert('답글 등록에 실패했습니다.');
    }
  };

  const pendingReviews = reviews.filter((r) => !r.reply);
  const repliedReviews = reviews.filter((r) => r.reply);

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
        <Text style={styles.headerTitle}>리뷰 관리</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 가게 평점 */}
        <View style={styles.statsCard}>
          <View style={styles.statsLeft}>
            <Text style={styles.ratingBig}>{stats.avgRating.toFixed(1)}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Text key={s} style={styles.star}>
                  {s <= Math.round(stats.avgRating) ? '★' : '☆'}
                </Text>
              ))}
            </View>
            <Text style={styles.statsTotal}>전체 리뷰 {stats.totalCount}개</Text>
          </View>
          <View style={styles.statsRight}>
            {[5, 4, 3, 2, 1].map((rating, idx) => {
              const count = stats.ratingDist[rating - 1];
              const percent = stats.totalCount > 0 ? Math.round((count / stats.totalCount) * 100) : 0;
              return (
                <View key={rating} style={styles.barRow}>
                  <Text style={styles.barLabel}>{rating}</Text>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${percent}%` }]} />
                  </View>
                  <Text style={styles.barPercent}>{percent}%</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 탭 */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, tab === 'pending' && styles.tabActive]}
            onPress={() => setTab('pending')}
          >
            <Text style={[styles.tabText, tab === 'pending' && styles.tabTextActive]}>답변 대기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'replied' && styles.tabActive]}
            onPress={() => setTab('replied')}
          >
            <Text style={[styles.tabText, tab === 'replied' && styles.tabTextActive]}>답변 완료</Text>
          </TouchableOpacity>
        </View>

        {/* 리뷰 목록 */}
        <Text style={styles.sectionTitle}>고객 리뷰 목록</Text>
        {(tab === 'pending' ? pendingReviews : repliedReviews).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>리뷰가 없습니다.</Text>
          </View>
        ) : (
          (tab === 'pending' ? pendingReviews : repliedReviews).map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewLeft}>
                  <Text style={styles.reviewUser}>{review.consumers?.nickname || '익명'}</Text>
                  <View style={styles.reviewStarsRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Text key={s} style={styles.reviewStar}>
                        {s <= review.rating ? '★' : '☆'}
                      </Text>
                    ))}
                    <Text style={styles.reviewRating}>{review.rating.toFixed(1)}</Text>
                  </View>
                  <Text style={styles.reviewDate}>
                    {new Date(review.created_at).toLocaleDateString('ko-KR')}
                  </Text>
                </View>
                <Image source={{ uri: 'https://via.placeholder.com/60' }} style={styles.reviewImage} />
              </View>
              <Text style={styles.reviewContent}>{review.content}</Text>
              {review.reply ? (
                <View style={styles.replyBox}>
                  <Text style={styles.replyLabel}>💬 업주 답글</Text>
                  <Text style={styles.replyText}>{review.reply}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedReview(review);
                      setReplyText(review.reply);
                      setReplyModal(true);
                    }}
                  >
                    <Text style={styles.replyEdit}>수정</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.replyButton}
                  onPress={() => {
                    setSelectedReview(review);
                    setReplyText('');
                    setReplyModal(true);
                  }}
                >
                  <Text style={styles.replyButtonText}>💬 답글 달기</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 답글 작성 모달 */}
      <Modal visible={replyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>답글 작성</Text>
            <TextInput
              style={styles.modalInput}
              value={replyText}
              onChangeText={setReplyText}
              placeholder="고객에게 답글을 남겨주세요."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setReplyModal(false);
                  setSelectedReview(null);
                  setReplyText('');
                }}
              >
                <Text style={styles.modalButtonTextCancel}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonConfirm]} onPress={handleReply}>
                <Text style={styles.modalButtonTextConfirm}>등록</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  statsCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, marginBottom: 15, flexDirection: 'row', gap: 20 },
  statsLeft: { alignItems: 'center' },
  ratingBig: { fontSize: 48, fontWeight: 'bold', color: '#333' },
  starsRow: { flexDirection: 'row', marginVertical: 8 },
  star: { fontSize: 20, color: '#00D563' },
  statsTotal: { fontSize: 13, color: '#00D563', fontWeight: '600' },
  statsRight: { flex: 1, justifyContent: 'center', gap: 8 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { fontSize: 13, color: '#333', width: 10 },
  barBg: { flex: 1, height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#00D563', borderRadius: 4 },
  barPercent: { fontSize: 12, color: '#00D563', fontWeight: '600', width: 40, textAlign: 'right' },
  tabRow: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#00D563' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  tabTextActive: { color: '#FFF' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  emptyContainer: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#999' },
  reviewCard: { backgroundColor: '#FFF', padding: 18, borderRadius: 12, marginBottom: 12 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  reviewLeft: { flex: 1 },
  reviewUser: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 4 },
  reviewStarsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  reviewStar: { fontSize: 14, color: '#FFB800' },
  reviewRating: { fontSize: 13, fontWeight: '600', color: '#333', marginLeft: 4 },
  reviewDate: { fontSize: 12, color: '#999' },
  reviewImage: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#E0E0E0' },
  reviewContent: { fontSize: 14, color: '#333', lineHeight: 20, marginBottom: 12 },
  replyBox: { backgroundColor: '#F9F9F9', padding: 12, borderRadius: 8 },
  replyLabel: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 6 },
  replyText: { fontSize: 13, color: '#333', lineHeight: 18, marginBottom: 8 },
  replyEdit: { fontSize: 13, color: '#00D563', fontWeight: '600' },
  replyButton: { backgroundColor: '#00D563', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  replyButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  modalInput: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 16, fontSize: 15, color: '#333', height: 120, textAlignVertical: 'top', marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  modalButtonCancel: { backgroundColor: '#F5F5F5' },
  modalButtonConfirm: { backgroundColor: '#00D563' },
  modalButtonTextCancel: { fontSize: 15, fontWeight: '600', color: '#666' },
  modalButtonTextConfirm: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});
