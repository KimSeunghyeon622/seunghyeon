/**
 * 리뷰 관리 화면
 * - 일반 소비자: 내가 작성한 리뷰 목록
 * - 업주: 우리 가게 리뷰 (답글 기능) + 내가 작성한 리뷰 (2탭)
 * - 리뷰 사진 표시 및 수정 기능
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import ReviewImages from '../components/ReviewImages';
import ReviewImagePicker from '../components/ReviewImagePicker';

interface MyReviewsScreenProps {
  onBack: () => void;
  onNavigateToStore?: (storeId: string) => void;
}

// 내가 작성한 리뷰
interface MyReviewItem {
  id: string;
  rating: number;
  content: string;
  image_urls?: string[];
  reply?: string;
  replied_at?: string;
  created_at: string;
  stores: {
    id: string;
    name: string;
    category: string;
  };
}

// 우리 가게에 달린 리뷰
interface StoreReviewItem {
  id: string;
  rating: number;
  content: string;
  image_urls?: string[];
  reply?: string;
  replied_at?: string;
  created_at: string;
  consumers: {
    nickname: string;
  };
}

export default function MyReviewsScreen({ onBack, onNavigateToStore }: MyReviewsScreenProps) {
  // 공통 상태
  const [loading, setLoading] = useState(true);
  const [isStoreOwner, setIsStoreOwner] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'store' | 'my'>('store');

  // 내가 작성한 리뷰 상태
  const [myReviews, setMyReviews] = useState<MyReviewItem[]>([]);

  // 우리 가게 리뷰 상태
  const [storeReviews, setStoreReviews] = useState<StoreReviewItem[]>([]);

  // 리뷰 수정 모달 상태 (내가 작성한 리뷰)
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedMyReview, setSelectedMyReview] = useState<MyReviewItem | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editContent, setEditContent] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);

  // 답글 모달 상태 (우리 가게 리뷰)
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [selectedStoreReview, setSelectedStoreReview] = useState<StoreReviewItem | null>(null);
  const [replyText, setReplyText] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 업주 여부 확인
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const ownerStatus = !!store;
      setIsStoreOwner(ownerStatus);

      if (store) {
        setStoreId(store.id);
        // 우리 가게 리뷰 조회
        const { data: storeReviewsData } = await supabase
          .from('reviews')
          .select(`
            id,
            rating,
            content,
            image_urls,
            reply,
            replied_at,
            created_at,
            consumers (nickname)
          `)
          .eq('store_id', store.id)
          .order('created_at', { ascending: false });

        setStoreReviews((storeReviewsData as unknown as StoreReviewItem[]) || []);
      } else {
        // 일반 소비자는 '내가 작성한 리뷰' 탭만 표시
        setActiveTab('my');
      }

      // 소비자 ID 조회 (maybeSingle 사용)
      const { data: consumer } = await supabase
        .from('consumers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (consumer) {
        // 내가 작성한 리뷰 목록 조회
        const { data: myReviewsData } = await supabase
          .from('reviews')
          .select(`
            id,
            rating,
            content,
            image_urls,
            reply,
            replied_at,
            created_at,
            stores (
              id,
              name,
              category
            )
          `)
          .eq('consumer_id', consumer.id)
          .order('created_at', { ascending: false });

        setMyReviews((myReviewsData as unknown as MyReviewItem[]) || []);
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ============ 내가 작성한 리뷰 관련 함수 ============
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const openEditModal = (review: MyReviewItem) => {
    setSelectedMyReview(review);
    setEditRating(review.rating);
    setEditContent(review.content);
    setEditImages(review.image_urls || []);
    setEditModalVisible(true);
  };

  const handleEditMyReview = async () => {
    if (!selectedMyReview) return;

    if (!editContent.trim()) {
      Alert.alert('알림', '리뷰 내용을 입력해주세요.');
      return;
    }

    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          rating: editRating,
          content: editContent.trim(),
          image_urls: editImages.length > 0 ? editImages : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedMyReview.id);

      if (error) throw error;

      Alert.alert('완료', '리뷰가 수정되었습니다.');
      setEditModalVisible(false);
      setSelectedMyReview(null);
      setEditImages([]);
      loadData();
    } catch (error) {
      console.error('리뷰 수정 오류:', error);
      Alert.alert('오류', '리뷰 수정에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const renderStarSelector = () => {
    return (
      <View style={styles.starSelector}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setEditRating(star)}>
            <Text style={styles.starButton}>
              {star <= editRating ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // ============ 우리 가게 리뷰 관련 함수 ============
  const openReplyModal = (review: StoreReviewItem) => {
    setSelectedStoreReview(review);
    setReplyText(review.reply || '');
    setReplyModalVisible(true);
  };

  const handleReply = async () => {
    if (!selectedStoreReview) return;

    if (!replyText.trim()) {
      Alert.alert('알림', '답글을 입력해주세요.');
      return;
    }

    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          reply: replyText.trim(),
          replied_at: new Date().toISOString()
        })
        .eq('id', selectedStoreReview.id);

      if (error) throw error;

      Alert.alert('완료', '답글이 등록되었습니다.');
      setReplyModalVisible(false);
      setSelectedStoreReview(null);
      setReplyText('');
      loadData();
    } catch (error) {
      console.error('답글 등록 오류:', error);
      Alert.alert('오류', '답글 등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  // ============ 렌더 함수 ============
  const renderMyReviewItem = ({ item }: { item: MyReviewItem }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.storeInfo}>
          <TouchableOpacity
            onPress={() => onNavigateToStore && item.stores?.id && onNavigateToStore(item.stores.id)}
            disabled={!onNavigateToStore}
          >
            <Text style={[styles.storeName, onNavigateToStore && styles.storeNameClickable]}>
              {item.stores?.name || '업체명 없음'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.storeCategory}>{item.stores?.category}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.reviewDate}>{formatDate(item.created_at)}</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => openEditModal(item)}
          >
            <Text style={styles.editButtonText}>수정</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.ratingRow}>
        <Text style={styles.stars}>{renderStars(item.rating)}</Text>
      </View>

      <Text style={styles.reviewContent}>{item.content}</Text>

      {/* 리뷰 이미지 */}
      {item.image_urls && item.image_urls.length > 0 && (
        <ReviewImages images={item.image_urls} size="medium" />
      )}

      {item.reply && (
        <View style={styles.replyBox}>
          <View style={styles.replyHeader}>
            <Text style={styles.replyLabel}>사장님 답변</Text>
            {item.replied_at && (
              <Text style={styles.replyDate}>{formatDate(item.replied_at)}</Text>
            )}
          </View>
          <Text style={styles.replyContent}>{item.reply}</Text>
        </View>
      )}
    </View>
  );

  const renderStoreReviewItem = ({ item }: { item: StoreReviewItem }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.storeInfo}>
          <Text style={styles.customerName}>{item.consumers?.nickname || '익명'}</Text>
          <View style={styles.ratingRowSmall}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Text key={s} style={styles.starSmall}>
                {s <= item.rating ? '★' : '☆'}
              </Text>
            ))}
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
        </View>
        <Text style={styles.reviewDate}>{formatDate(item.created_at)}</Text>
      </View>

      <Text style={styles.reviewContent}>{item.content}</Text>

      {/* 리뷰 이미지 */}
      {item.image_urls && item.image_urls.length > 0 && (
        <ReviewImages images={item.image_urls} size="medium" />
      )}

      {item.reply ? (
        <View style={styles.replyBox}>
          <View style={styles.replyHeader}>
            <Text style={styles.replyLabel}>내 답글</Text>
            <TouchableOpacity onPress={() => openReplyModal(item)}>
              <Text style={styles.replyEditLink}>수정</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.replyContent}>{item.reply}</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.replyButton}
          onPress={() => openReplyModal(item)}
        >
          <Text style={styles.replyButtonText}>답글 달기</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{isStoreOwner ? '리뷰 관리' : '작성한 리뷰'}</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00D563" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{isStoreOwner ? '리뷰 관리' : '작성한 리뷰'}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 업주용 탭 */}
      {isStoreOwner && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'store' && styles.tabButtonActive]}
            onPress={() => setActiveTab('store')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'store' }}
          >
            <Text style={activeTab === 'store' ? styles.tabTextActive : styles.tabText}>
              우리 가게 리뷰
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'my' && styles.tabButtonActive]}
            onPress={() => setActiveTab('my')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'my' }}
          >
            <Text style={activeTab === 'my' ? styles.tabTextActive : styles.tabText}>
              내가 작성한 리뷰
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 컨텐츠 */}
      {activeTab === 'store' && isStoreOwner ? (
        // 우리 가게 리뷰
        storeReviews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>아직 리뷰가 없습니다</Text>
            <Text style={styles.emptySubText}>
              고객이 리뷰를 작성하면{'\n'}여기에 표시됩니다
            </Text>
          </View>
        ) : (
          <FlatList
            data={storeReviews}
            renderItem={renderStoreReviewItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : (
        // 내가 작성한 리뷰
        myReviews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>작성한 리뷰가 없습니다</Text>
            <Text style={styles.emptySubText}>
              상품을 픽업한 후{'\n'}리뷰를 작성해보세요
            </Text>
          </View>
        ) : (
          <FlatList
            data={myReviews}
            renderItem={renderMyReviewItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )
      )}

      {/* 내 리뷰 수정 모달 */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>리뷰 수정</Text>

            <Text style={styles.modalLabel}>별점</Text>
            {renderStarSelector()}

            <Text style={styles.modalLabel}>리뷰 내용</Text>
            <TextInput
              style={styles.modalInput}
              value={editContent}
              onChangeText={setEditContent}
              placeholder="리뷰 내용을 입력해주세요"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />

            {/* 이미지 수정 */}
            <ReviewImagePicker
              images={editImages}
              onImagesChange={setEditImages}
              maxImages={2}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setEditModalVisible(false);
                  setSelectedMyReview(null);
                  setEditImages([]);
                }}
              >
                <Text style={styles.modalButtonTextCancel}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleEditMyReview}
              >
                <Text style={styles.modalButtonTextConfirm}>수정</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 답글 작성/수정 모달 */}
      <Modal
        visible={replyModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setReplyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedStoreReview?.reply ? '답글 수정' : '답글 작성'}
            </Text>

            <Text style={styles.modalLabel}>고객 리뷰</Text>
            <View style={styles.customerReviewBox}>
              <Text style={styles.customerReviewName}>
                {selectedStoreReview?.consumers?.nickname || '익명'}
              </Text>
              <Text style={styles.customerReviewContent}>
                {selectedStoreReview?.content}
              </Text>
            </View>

            <Text style={styles.modalLabel}>답글</Text>
            <TextInput
              style={styles.modalInput}
              value={replyText}
              onChangeText={setReplyText}
              placeholder="고객에게 답글을 남겨주세요"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setReplyModalVisible(false);
                  setSelectedStoreReview(null);
                  setReplyText('');
                }}
              >
                <Text style={styles.modalButtonTextCancel}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleReply}
              >
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 탭 스타일
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 15,
    gap: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#1A1A2E',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00A84D',
  },
  tabTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  // 빈 상태
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  // 목록
  listContainer: {
    padding: 16,
  },
  // 리뷰 카드 공통
  reviewCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  storeInfo: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  storeNameClickable: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  storeCategory: {
    fontSize: 13,
    color: '#666',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  editButton: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
  },
  editButtonText: {
    fontSize: 12,
    color: '#00A84D',
    fontWeight: '600',
  },
  ratingRow: {
    marginBottom: 8,
  },
  stars: {
    fontSize: 14,
    letterSpacing: 2,
  },
  ratingRowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starSmall: {
    fontSize: 14,
    color: '#FFB800',
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  reviewContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  // 답글 영역
  replyBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  replyLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00D563',
  },
  replyDate: {
    fontSize: 11,
    color: '#999',
  },
  replyEditLink: {
    fontSize: 13,
    color: '#00D563',
    fontWeight: '600',
  },
  replyContent: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  replyButton: {
    backgroundColor: '#00D563',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  replyButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  starSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  starButton: {
    fontSize: 32,
    color: '#FFB800',
  },
  modalInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#333',
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  customerReviewBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  customerReviewName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  customerReviewContent: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F5F5F5',
  },
  modalButtonConfirm: {
    backgroundColor: '#00D563',
  },
  modalButtonTextCancel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  modalButtonTextConfirm: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
});
