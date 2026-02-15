/**
 * 업체 전체 리뷰 화면
 * - 업체 상세페이지에서 '리뷰 더 보기' 클릭 시 표시
 * - 모든 리뷰 목록, 평점 요약, 정렬 기능 제공
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchStoreReviews } from '../api/reviewApi';
import type { ReviewWithConsumer } from '../types';
import ReviewImages from '../components/ReviewImages';

interface StoreAllReviewsScreenProps {
  storeId: string;
  storeName: string;
  onBack: () => void;
}

type SortType = 'latest' | 'rating_high' | 'rating_low';

export default function StoreAllReviewsScreen({
  storeId,
  storeName,
  onBack,
}: StoreAllReviewsScreenProps) {
  const [reviews, setReviews] = useState<ReviewWithConsumer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortType, setSortType] = useState<SortType>('latest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // 리뷰 데이터 가져오기
  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const reviewsData = await fetchStoreReviews(storeId);
      setReviews(reviewsData);
    } catch (err) {
      console.error('리뷰 로딩 오류:', err);
      setError('리뷰를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // 정렬된 리뷰 목록
  const getSortedReviews = () => {
    const sorted = [...reviews];
    switch (sortType) {
      case 'latest':
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'rating_high':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'rating_low':
        sorted.sort((a, b) => a.rating - b.rating);
        break;
    }
    return sorted;
  };

  // 평균 평점 계산
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  // 별점 분포 계산
  const ratingDistribution = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length,
  };

  // 최대 분포 값 (바 너비 계산용)
  const maxDistribution = Math.max(...Object.values(ratingDistribution), 1);

  // 별점 렌더링
  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  // 정렬 타입 레이블
  const getSortLabel = (type: SortType) => {
    switch (type) {
      case 'latest':
        return '최신순';
      case 'rating_high':
        return '별점 높은순';
      case 'rating_low':
        return '별점 낮은순';
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {storeName} 리뷰
          </Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00D563" />
          <Text style={styles.loadingText}>로딩 중...</Text>
        </View>
      </View>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {storeName} 리뷰
          </Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>!</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchReviews}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 빈 상태
  if (reviews.length === 0) {
    return (
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {storeName} 리뷰
          </Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>{'(O)'}</Text>
          <Text style={styles.emptyText}>아직 리뷰가 없습니다</Text>
          <Text style={styles.emptySubText}>첫 번째 리뷰를 작성해주세요!</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {storeName} 리뷰
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* 평점 요약 섹션 */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryHeader}>
            <Text style={styles.averageRating}>{averageRating}</Text>
            <View style={styles.summaryInfo}>
              <Text style={styles.averageStars}>{'star'.repeat(Math.round(Number(averageRating)))}</Text>
              <Text style={styles.totalReviews}>리뷰 {reviews.length}개</Text>
            </View>
          </View>

          {/* 별점 분포 */}
          <View style={styles.distributionContainer}>
            {[5, 4, 3, 2, 1].map((star) => (
              <View key={star} style={styles.distributionRow}>
                <Text style={styles.distributionStars}>{star}점</Text>
                <View style={styles.distributionBar}>
                  <View
                    style={[
                      styles.distributionBarFill,
                      {
                        width: `${(ratingDistribution[star as keyof typeof ratingDistribution] / maxDistribution) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.distributionCount}>
                  {ratingDistribution[star as keyof typeof ratingDistribution]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 정렬 버튼 */}
        <View style={styles.sortContainer}>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSortDropdown(!showSortDropdown)}
          >
            <Text style={styles.sortButtonText}>
              {getSortLabel(sortType)} {'v'}
            </Text>
          </TouchableOpacity>

          {/* 정렬 드롭다운 */}
          {showSortDropdown && (
            <View style={styles.sortDropdown}>
              {(['latest', 'rating_high', 'rating_low'] as SortType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.sortDropdownItem,
                    sortType === type && styles.sortDropdownItemActive,
                  ]}
                  onPress={() => {
                    setSortType(type);
                    setShowSortDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.sortDropdownText,
                      sortType === type && styles.sortDropdownTextActive,
                    ]}
                  >
                    {getSortLabel(type)}
                  </Text>
                  {sortType === type && (
                    <Text style={styles.sortCheckMark}>{'v'}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 리뷰 목록 */}
        {getSortedReviews().map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            {/* 리뷰 헤더 */}
            <View style={styles.reviewHeader}>
              <View style={styles.reviewProfileContainer}>
                {review.consumers?.avatar_url ? (
                  <Image
                    source={{ uri: review.consumers.avatar_url }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={styles.profilePlaceholder}>
                    <Text style={styles.profilePlaceholderText}>{'( )'}</Text>
                  </View>
                )}
                <View style={styles.reviewerInfo}>
                  <Text style={styles.reviewerName}>
                    {review.consumers?.nickname || '익명'}
                  </Text>
                  <Text style={styles.reviewDate}>
                    {formatDate(review.created_at)}
                  </Text>
                </View>
              </View>
              <Text style={styles.reviewStars}>{renderStars(review.rating)}</Text>
            </View>

            {/* 리뷰 내용 */}
            <Text style={styles.reviewContent}>{review.content}</Text>

            {/* 리뷰 이미지 */}
            {review.image_urls && review.image_urls.length > 0 && (
              <ReviewImages images={review.image_urls} size="medium" />
            )}

            {/* 업주 답글 */}
            {review.reply && (
              <View style={styles.replyContainer}>
                <Text style={styles.replyLabel}>{'<3'} 업주 답글</Text>
                <Text style={styles.replyText}>{review.reply}</Text>
              </View>
            )}
          </View>
        ))}

        {/* 하단 여백 */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#333333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  headerRight: {
    width: 40,
  },

  // 스크롤 뷰
  scrollView: {
    flex: 1,
  },

  // 로딩 상태
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999999',
  },

  // 에러 상태
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
    color: '#FF6B6B',
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#00D563',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // 빈 상태
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
    color: '#CCCCCC',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999999',
  },

  // 평점 요약
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  averageRating: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333333',
    marginRight: 16,
  },
  summaryInfo: {
    flex: 1,
  },
  averageStars: {
    fontSize: 18,
    marginBottom: 4,
  },
  totalReviews: {
    fontSize: 14,
    color: '#666666',
  },
  distributionContainer: {
    marginTop: 8,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  distributionStars: {
    width: 40,
    fontSize: 13,
    color: '#666666',
  },
  distributionBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  distributionBarFill: {
    height: '100%',
    backgroundColor: '#00D563',
    borderRadius: 4,
  },
  distributionCount: {
    width: 30,
    fontSize: 13,
    color: '#999999',
    textAlign: 'right',
  },

  // 정렬 버튼
  sortContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'relative',
    zIndex: 100,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  sortDropdown: {
    position: 'absolute',
    top: 52,
    left: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 140,
    zIndex: 200,
  },
  sortDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  sortDropdownItemActive: {
    backgroundColor: '#E8F5E9',
  },
  sortDropdownText: {
    fontSize: 14,
    color: '#333333',
  },
  sortDropdownTextActive: {
    color: '#00D563',
    fontWeight: '600',
  },
  sortCheckMark: {
    fontSize: 14,
    color: '#00D563',
    fontWeight: 'bold',
  },

  // 리뷰 카드
  reviewCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewProfileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePlaceholderText: {
    fontSize: 20,
    color: '#CCCCCC',
  },
  reviewerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },
  reviewDate: {
    fontSize: 13,
    color: '#999999',
    marginTop: 2,
  },
  reviewStars: {
    fontSize: 16,
    marginLeft: 8,
  },
  reviewContent: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 8,
  },

  // 업주 답글
  replyContainer: {
    backgroundColor: '#F0F9F4',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#00D563',
  },
  replyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00D563',
    marginBottom: 4,
  },
  replyText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
});
