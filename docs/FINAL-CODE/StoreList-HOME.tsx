import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface StoreListHomeProps {
  onSelectStore: (id: string) => void;
  onViewReservations: () => void;
  onViewMyPage: () => void;
}

interface Store {
  id: string;
  name: string;
  category: string;
  address: string;
  cover_image_url: string;
  average_rating: number;
  review_count: number;
  cash_balance: number;
  is_open: boolean;
}

type SortType = 'recommended' | 'distance' | 'map';
type CategoryType = '전체' | '반찬' | '제과' | '식자재' | '밀키트' | '정육' | '기타';

const CATEGORIES: CategoryType[] = ['전체', '반찬', '제과', '식자재', '밀키트', '정육', '기타'];
const RATING_OPTIONS = [4.5, 4.0, 3.5, 3.0];

export default function StoreListHome({
  onSelectStore,
  onViewReservations,
  onViewMyPage,
}: StoreListHomeProps) {
  const [stores, setStores] = useState<Store[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 필터 상태
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('전체');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sortType, setSortType] = useState<SortType>('recommended');

  // 드롭다운 표시 상태
  const [showRatingDropdown, setShowRatingDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const [currentTab, setCurrentTab] = useState<'home' | 'reservations' | 'mypage'>('home');

  // 업체 목록 가져오기
  const fetchStores = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('업체 목록 로딩 오류:', error);
      alert('업체 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  // 필터링 및 정렬
  useEffect(() => {
    let result = [...stores];

    // 1. 카테고리 필터
    if (selectedCategory !== '전체') {
      result = result.filter((store) => store.category === selectedCategory);
    }

    // 2. 별점 필터
    if (selectedRating !== null) {
      result = result.filter((store) => store.average_rating >= selectedRating);
    }

    // 3. 검색어 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (store) =>
          store.name.toLowerCase().includes(query) ||
          store.address.toLowerCase().includes(query)
      );
    }

    // 4. 정렬
    if (sortType === 'recommended') {
      // 추천순: 리뷰수 많은 순
      result.sort((a, b) => b.review_count - a.review_count);
    } else if (sortType === 'distance') {
      // 거리순: 추후 구현 (일단 이름순으로 대체)
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredStores(result);
  }, [stores, selectedCategory, selectedRating, searchQuery, sortType]);

  // 준비중 여부 확인
  const isStoreClosed = (store: Store) => {
    // 1. 캐시 잔액 10,000원 이하
    if (store.cash_balance <= 10000) return true;
    // 2. 영업 중 설정이 false
    if (store.is_open === false) return true;
    // 3. 영업시간 외 (추후 구현)
    return false;
  };

  const calculateDiscount = () => {
    // 일단 고정값, 추후 실제 할인율 계산 로직 추가
    return 50;
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
        <Text style={styles.logo}>🛒 투굿투고</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* 카테고리 탭 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryTab,
              selectedCategory === category && styles.categoryTabActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 필터 버튼 */}
      <View style={styles.filterRow}>
        {/* 정렬 필터 */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowSortDropdown(!showSortDropdown)}
        >
          <Text style={styles.filterButtonText}>
            {sortType === 'recommended'
              ? '추천순'
              : sortType === 'distance'
              ? '거리순'
              : '지도보기'}
            {' ▼'}
          </Text>
        </TouchableOpacity>

        {/* 별점 필터 */}
        <TouchableOpacity
          style={styles.filterButtonWhite}
          onPress={() => setShowRatingDropdown(!showRatingDropdown)}
        >
          <Text style={styles.filterButtonTextDark}>
            ⭐ {selectedRating ? `★ ${selectedRating}` : '전체'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 정렬 드롭다운 */}
      {showSortDropdown && (
        <View style={styles.dropdown}>
          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => {
              setSortType('recommended');
              setShowSortDropdown(false);
            }}
          >
            <Text style={styles.dropdownText}>추천순</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => {
              setSortType('distance');
              setShowSortDropdown(false);
            }}
          >
            <Text style={styles.dropdownText}>거리순</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => {
              alert('지도 기능은 추후 구현 예정입니다.');
              setShowSortDropdown(false);
            }}
          >
            <Text style={styles.dropdownText}>지도보기</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 별점 드롭다운 */}
      {showRatingDropdown && (
        <View style={styles.dropdownRating}>
          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => {
              setSelectedRating(null);
              setShowRatingDropdown(false);
            }}
          >
            <Text style={styles.dropdownText}>전체</Text>
          </TouchableOpacity>
          {RATING_OPTIONS.map((rating) => (
            <TouchableOpacity
              key={rating}
              style={styles.dropdownItem}
              onPress={() => {
                setSelectedRating(rating);
                setShowRatingDropdown(false);
              }}
            >
              <Text style={styles.dropdownText}>⭐ {rating} 이상</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 업체 리스트 */}
      <ScrollView style={styles.storeList} showsVerticalScrollIndicator={false}>
        {filteredStores.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>조건에 맞는 업체가 없습니다.</Text>
          </View>
        ) : (
          filteredStores.map((store) => {
            const closed = isStoreClosed(store);
            return (
              <TouchableOpacity
                key={store.id}
                style={styles.storeCard}
                onPress={() => !closed && onSelectStore(store.id)}
                disabled={closed}
              >
                {/* 이미지 */}
                <View style={styles.imageContainer}>
                  {store.cover_image_url ? (
                    <Image
                      source={{ uri: store.cover_image_url }}
                      style={[styles.storeImage, closed && styles.storeImageClosed]}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.imagePlaceholder,
                        closed && styles.storeImageClosed,
                      ]}
                    >
                      <Text style={styles.imagePlaceholderText}>🏪</Text>
                    </View>
                  )}

                  {/* 준비중 라벨 */}
                  {closed && (
                    <View style={styles.closedOverlay}>
                      <View style={styles.closedBadge}>
                        <Text style={styles.closedText}>준비중</Text>
                      </View>
                    </View>
                  )}

                  {/* 할인율 뱃지 */}
                  {!closed && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>~{calculateDiscount()}% 할인</Text>
                    </View>
                  )}

                  {/* 하트 버튼 */}
                  <TouchableOpacity style={styles.heartButton}>
                    <Text style={styles.heartIcon}>🤍</Text>
                  </TouchableOpacity>
                </View>

                {/* 업체 정보 */}
                <View style={styles.storeInfo}>
                  <Text style={styles.storeName} numberOfLines={1}>
                    {store.name}
                  </Text>
                  <View style={styles.ratingRow}>
                    <Text style={styles.rating}>⭐ {store.average_rating.toFixed(1)}</Text>
                    <Text style={styles.reviewCount}>리뷰 {store.review_count}</Text>
                  </View>
                  <Text style={styles.storeAddress} numberOfLines={1}>
                    {store.address}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* 하단 여백 */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 하단 네비게이션 */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab('home')}
        >
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={[styles.navText, currentTab === 'home' && styles.navTextActive]}>
            홈
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setCurrentTab('reservations');
            onViewReservations();
          }}
        >
          <Text style={styles.navIcon}>🎁</Text>
          <Text
            style={[styles.navText, currentTab === 'reservations' && styles.navTextActive]}
          >
            주문/예약
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setCurrentTab('mypage');
            onViewMyPage();
          }}
        >
          <Text style={styles.navIcon}>👤</Text>
          <Text style={[styles.navText, currentTab === 'mypage' && styles.navTextActive]}>
            내 정보
          </Text>
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
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  searchButton: {
    padding: 5,
  },
  searchIcon: {
    fontSize: 20,
  },

  // 카테고리 탭
  categoryContainer: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoryContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  categoryTabActive: {
    backgroundColor: '#333',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },

  // 필터 버튼
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    gap: 10,
  },
  filterButton: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00D563',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#00A84D',
    fontWeight: '600',
  },
  filterButtonWhite: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  filterButtonTextDark: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },

  // 드롭다운
  dropdown: {
    position: 'absolute',
    top: 185,
    left: 20,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    minWidth: 120,
  },
  dropdownRating: {
    position: 'absolute',
    top: 185,
    right: 20,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    minWidth: 120,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
  },

  // 업체 리스트
  storeList: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
  },

  // 업체 카드
  storeCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  storeImage: {
    width: '100%',
    height: '100%',
  },
  storeImageClosed: {
    opacity: 0.4,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 60,
  },

  // 준비중 오버레이
  closedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },

  // 할인율 뱃지
  discountBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#00D563',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  discountText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },

  // 하트 버튼
  heartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  heartIcon: {
    fontSize: 22,
  },

  // 업체 정보
  storeInfo: {
    padding: 16,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rating: {
    fontSize: 14,
    color: '#333',
    marginRight: 8,
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: 13,
    color: '#999',
  },
  storeAddress: {
    fontSize: 13,
    color: '#999',
  },

  // 하단 네비게이션
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingBottom: 20,
    paddingTop: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navText: {
    fontSize: 12,
    color: '#999',
  },
  navTextActive: {
    color: '#00D563',
    fontWeight: '600',
  },
});
