import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { useCartStore } from '../stores/cartStore';
import BannerCarousel from '../components/BannerCarousel';
import MapPlaceholder from '../components/MapPlaceholder';
import { Banner } from '../types';

interface StoreListHomeProps {
  onSelectStore: (id: string) => void;
  onViewReservations: () => void;
  onViewMyPage: () => void;
  onViewCart?: () => void;
  onBannerPress?: (banner: Banner) => void;
  initialView?: 'list' | 'map';
  focusStoreId?: string | null;
  onViewChange?: (view: 'list' | 'map') => void;
}

interface Product {
  original_price: number;
  discounted_price: number;
  is_active: boolean;
  stock_quantity: number;
}

interface ReviewRating {
  rating: number;
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
  latitude: number;
  longitude: number;
  distance?: number; // 사용자로부터의 거리 (km)
  products?: Product[];
  reviews?: ReviewRating[]; // 리뷰 배열 (실시간 계산용)
}

type SortType = 'recommended' | 'distance' | 'map';
type CategoryType = '전체' | '반찬' | '제과' | '식자재' | '밀키트';

const CATEGORIES: CategoryType[] = ['전체', '반찬', '제과', '식자재', '밀키트'];
const RATING_OPTIONS = [4.5, 4.0, 3.5, 3.0];

export default function StoreListHome({
  onSelectStore,
  onViewReservations,
  onViewMyPage,
  onViewCart,
  onBannerPress,
  initialView = 'list',
  focusStoreId,
  onViewChange,
}: StoreListHomeProps) {
  const [stores, setStores] = useState<Store[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('전체');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sortType, setSortType] = useState<SortType>('recommended');
  const [selectedMapStoreId, setSelectedMapStoreId] = useState<string | null>(focusStoreId ?? null);

  const [showRatingDropdown, setShowRatingDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const [currentTab, setCurrentTab] = useState<'home' | 'reservations' | 'mypage'>('home');
  const [refreshing, setRefreshing] = useState(false);

  // 관심업체(즐겨찾기) 관련 상태
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [consumerId, setConsumerId] = useState<string>('');

  // 장바구니 스토어
  const cartCount = useCartStore((state) => state.getTotalCount());

  // 위치 관련 상태
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (initialView === 'map') {
      setSortType('map');
      return;
    }

    if (sortType === 'map') {
      setSortType('recommended');
    }
  }, [initialView]);

  useEffect(() => {
    if (!focusStoreId) return;
    setSortType('map');
    setSelectedMapStoreId(focusStoreId);
    if (!userLocation) {
      requestAndGetLocation();
    }
  }, [focusStoreId]);

  useEffect(() => {
    if (!onViewChange) return;
    onViewChange(sortType === 'map' ? 'map' : 'list');
  }, [sortType, onViewChange]);

  // 소비자 ID 가져오기 (이미 등록된 사용자만 조회)
  useEffect(() => {
    const fetchConsumer = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 기존 소비자 조회
        const { data: consumerData, error } = await supabase
          .from('consumers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('소비자 조회 오류:', error);
          return;
        }

        if (consumerData) {
          setConsumerId(consumerData.id);
        }
        // 소비자 데이터가 없으면 (업주 전용 계정) consumerId는 빈 문자열로 유지
        // 이 경우 즐겨찾기 기능은 사용 불가
      } catch (error) {
        console.error('소비자 ID 가져오기 오류:', error);
      }
    };

    fetchConsumer();
  }, []);

  // Haversine 공식으로 거리 계산 (km)
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // 지구 반지름 (km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // 위치 권한 요청 및 현재 위치 가져오기 (거리순 선택 시에만 호출)
  const requestAndGetLocation = async (): Promise<boolean> => {
    try {
      setLocationLoading(true);
      setLocationError(null);

      // 위치 서비스 활성화 확인 (iOS, Android 모두)
      const serviceEnabled = await Location.hasServicesEnabledAsync();
      if (!serviceEnabled) {
        Alert.alert(
          'GPS 켜기',
          '위치 서비스가 꺼져 있습니다. GPS를 켜주세요.',
          [
            { text: '취소', style: 'cancel' },
            { 
              text: '설정으로 이동', 
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }
            },
          ]
        );
        setLocationLoading(false);
        return false;
      }

      // 위치 권한 상태 확인
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      let finalStatus = existingStatus;
      
      // 권한이 없으면 요청
      if (existingStatus !== 'granted') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        setLocationError('위치 권한이 필요합니다');
        Alert.alert(
          '위치 권한 필요',
          '가까운 업체를 찾기 위해 위치 권한이 필요합니다. 설정에서 위치 권한을 허용해주세요.',
          [
            { text: '취소', style: 'cancel' },
            { 
              text: '설정으로 이동', 
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }
            },
          ]
        );
        setLocationLoading(false);
        return false;
      }

      // 현재 위치 가져오기 (항상 최신 위치)
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      return true;
    } catch (error) {
      console.error('위치 가져오기 오류:', error);
      setLocationError('위치를 가져올 수 없습니다');
      Alert.alert('오류', '현재 위치를 가져올 수 없습니다. GPS가 켜져 있는지 확인해주세요.');
      return false;
    } finally {
      setLocationLoading(false);
    }
  };

  // 즐겨찾기 목록 가져오기
  const fetchFavorites = useCallback(async () => {
    if (!consumerId) return;

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('store_id')
        .eq('consumer_id', consumerId);

      if (error) throw error;

      const ids = data?.map((fav) => fav.store_id) || [];
      setFavoriteIds(ids);
    } catch (error) {
      console.error('즐겨찾기 로딩 오류:', error);
    }
  }, [consumerId]);

  useEffect(() => {
    if (consumerId) {
      fetchFavorites();
    }
  }, [consumerId, fetchFavorites]);

  // 관심업체 토글 (등록/해제)
  const toggleFavorite = async (storeId: string, e: any) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지

    if (!consumerId) {
      // consumerId가 아직 로딩 중인 경우 잠시 대기 안내
      alert('잠시 후 다시 시도해주세요.');
      return;
    }

    try {
      const isFavorite = favoriteIds.includes(storeId);

      if (isFavorite) {
        // 관심업체 해제
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('consumer_id', consumerId)
          .eq('store_id', storeId);

        if (error) throw error;
        setFavoriteIds(favoriteIds.filter((id) => id !== storeId));
      } else {
        // 관심업체 등록
        const { error } = await supabase.from('favorites').insert({
          consumer_id: consumerId,
          store_id: storeId,
        });

        if (error) throw error;
        setFavoriteIds([...favoriteIds, storeId]);
      }
    } catch (error) {
      console.error('즐겨찾기 토글 오류:', error);
      alert('즐겨찾기 처리 중 오류가 발생했습니다.');
    }
  };

  const fetchStores = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const { data, error } = await supabase
        .from('stores')
        .select(`
          *,
          products (
            original_price,
            discounted_price,
            is_active,
            stock_quantity
          ),
          reviews (
            rating
          )
        `)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('업체 목록 로딩 오류:', error);
      alert('업체 목록을 불러오는데 실패했습니다.');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (sortType === 'distance') {
        await requestAndGetLocation();
      }
      await fetchStores(false);
      await fetchFavorites();
    } finally {
      setRefreshing(false);
    }
  }, [fetchFavorites, fetchStores, requestAndGetLocation, sortType]);

  useEffect(() => {
    let result = [...stores];

    // 사용자 위치가 있으면 각 업체까지의 거리 계산
    if (userLocation) {
      result = result.map((store) => ({
        ...store,
        distance: calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          Number(store.latitude),
          Number(store.longitude)
        ),
      }));
    }

    if (selectedCategory !== '전체') {
      result = result.filter((store) => store.category === selectedCategory);
    }

    if (selectedRating !== null) {
      // reviews 배열에서 직접 평균 계산하여 필터링
      result = result.filter((store) => {
        const reviews = store.reviews || [];
        if (reviews.length === 0) return false;
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        return avgRating >= selectedRating;
      });
    }

    if (sortType === 'recommended') {
      // reviews 배열 기반 정렬 (리뷰 많은 순)
      result.sort((a, b) => (b.reviews?.length || 0) - (a.reviews?.length || 0));
    } else if (sortType === 'distance') {
      // 거리순 정렬 (거리가 없으면 맨 뒤로)
      result.sort((a, b) => {
        if (a.distance === undefined && b.distance === undefined) return 0;
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
    }

    setFilteredStores(result);
  }, [stores, selectedCategory, selectedRating, sortType, userLocation]);

  const mapFilteredStores = filteredStores;

  useEffect(() => {
    if (sortType !== 'map') return;
    if (selectedMapStoreId) {
      const exists = mapFilteredStores.some((store) => store.id === selectedMapStoreId);
      if (!exists) {
        setSelectedMapStoreId(null);
      }
      return;
    }

    if (focusStoreId && mapFilteredStores.some((store) => store.id === focusStoreId)) {
      setSelectedMapStoreId(focusStoreId);
    }
  }, [sortType, mapFilteredStores, selectedMapStoreId, focusStoreId]);

  const selectedMapStore = mapFilteredStores.find((store) => store.id === selectedMapStoreId) ?? null;
  const isMapMode = sortType === 'map';

  const enterMapMode = useCallback(async () => {
    if (!userLocation) {
      await requestAndGetLocation();
    }
    setSortType('map');
    setSelectedMapStoreId(null);
    setShowSortDropdown(false);
    setShowRatingDropdown(false);
  }, [requestAndGetLocation, userLocation]);

  const leaveMapMode = useCallback(() => {
    setSortType('recommended');
    setSelectedMapStoreId(null);
    setShowSortDropdown(false);
    setShowRatingDropdown(false);
  }, []);

  const isStoreClosed = (store: Store) => {
    if (store.cash_balance <= 10000) return true;
    if (store.is_open === false) return true;
    return false;
  };

  const calculateDiscount = (store: Store): number => {
    if (!store.products || store.products.length === 0) {
      return 0;
    }

    // 활성화된 상품 중 재고가 있는 상품만 필터링
    const activeProducts = store.products.filter(
      (p) => p.is_active && p.stock_quantity > 0 && p.original_price > 0
    );

    if (activeProducts.length === 0) {
      return 0;
    }

    // 최대 할인율 계산
    const discountRates = activeProducts.map((p) =>
      Math.round(((p.original_price - p.discounted_price) / p.original_price) * 100)
    );

    return Math.max(...discountRates);
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
        <View style={styles.headerLeft} />
        <Text style={styles.logo}>💚 Save It</Text>
        <TouchableOpacity
          style={styles.cartHeaderButton}
          onPress={onViewCart}
          accessibilityLabel="장바구니"
        >
          <Text style={styles.cartHeaderIcon}>🛒</Text>
          {cartCount > 0 && (
            <View style={styles.cartHeaderBadge}>
              <Text style={styles.cartHeaderBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* 배너 캐러셀 */}
      {!isMapMode && onBannerPress && (
        <BannerCarousel onBannerPress={onBannerPress} />
      )}

      {/* 카테고리 + 필터 통합 컨테이너 */}
      {!isMapMode && (
      <View style={styles.filterContainer}>
        {/* 카테고리 탭 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScrollView}
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

        <TouchableOpacity
          style={styles.filterButtonWhite}
          onPress={() => setShowRatingDropdown(!showRatingDropdown)}
        >
          <Text style={styles.filterButtonTextDark}>
            ⭐ {selectedRating ? `★ ${selectedRating}` : '전체'}
          </Text>
        </TouchableOpacity>
      </View>
      </View>
      )}

      {/* 정렬 드롭다운 */}
      {!isMapMode && showSortDropdown && (
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
            onPress={async () => {
              setShowSortDropdown(false);
              
              // 거리순 선택 시 항상 최신 위치 가져오기
              const success = await requestAndGetLocation();
              if (success) {
                setSortType('distance');
              }
            }}
          >
            <Text style={styles.dropdownText}>
              거리순 {locationLoading && '(로딩중...)'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={enterMapMode}
          >
            <Text style={styles.dropdownText}>지도보기</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 별점 드롭다운 */}
      {!isMapMode && showRatingDropdown && (
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

      {isMapMode ? (
        <View style={styles.mapModeContainer}>
          <MapPlaceholder
            markers={mapFilteredStores.map((store) => {
              const latitude = Number(store.latitude);
              const longitude = Number(store.longitude);
              return {
                id: store.id,
                name: store.name,
                latitude: Number.isFinite(latitude) ? latitude : null,
                longitude: Number.isFinite(longitude) ? longitude : null,
                category: store.category,
                distanceKm: store.distance,
              };
            })}
            selectedId={selectedMapStoreId}
            userLocation={userLocation}
            onSelect={(id) => {
              setSelectedMapStoreId((current) => (current === id ? null : id));
            }}
            onBackgroundPress={() => setSelectedMapStoreId(null)}
            title=""
            containerStyle={styles.mapCanvas}
            useNativeMap
          />

          {locationError && (
            <Text style={styles.mapErrorOverlay}>{locationError}</Text>
          )}

          {selectedMapStore && (
            <View style={styles.mapBottomSheet}>
              <TouchableOpacity
                style={styles.mapBottomCard}
                activeOpacity={0.9}
                onPress={() => onSelectStore(selectedMapStore.id)}
              >
                {selectedMapStore.cover_image_url ? (
                  <Image
                    source={{ uri: selectedMapStore.cover_image_url }}
                    style={styles.mapBottomImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.mapBottomImagePlaceholder}>
                    <Text style={styles.mapBottomImagePlaceholderText}>🏬</Text>
                  </View>
                )}
                <View style={styles.mapBottomInfo}>
                  <Text style={styles.mapSelectedName} numberOfLines={1}>
                    {selectedMapStore.name}
                  </Text>
                  <Text style={styles.mapSelectedMeta} numberOfLines={1}>
                    {selectedMapStore.category}
                    {selectedMapStore.distance !== undefined
                      ? ` · ${selectedMapStore.distance.toFixed(1)}km`
                      : ''}
                  </Text>
                  <Text style={styles.mapSelectedAddress} numberOfLines={2}>
                    {selectedMapStore.address}
                  </Text>
                  <Text style={styles.mapBottomHint}>탭해서 업체 상세 보기</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.storeList}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
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

                    {closed && (
                      <View style={styles.closedOverlay}>
                        <View style={styles.closedBadge}>
                          <Text style={styles.closedText}>준비중</Text>
                        </View>
                      </View>
                    )}

                    {!closed && calculateDiscount(store) > 0 && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>~{calculateDiscount(store)}% 할인</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.heartButton}
                      onPress={(e) => toggleFavorite(store.id, e)}
                    >
                      <Text style={styles.heartIcon}>
                        {favoriteIds.includes(store.id) ? '❤️' : '🤍'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* 업체 정보 */}
                  <View style={styles.storeInfo}>
                    <Text style={styles.storeName} numberOfLines={1}>
                      {store.name}
                    </Text>
                    <View style={styles.ratingRow}>
                      <Text style={styles.rating}>
                        ⭐ {store.reviews && store.reviews.length > 0
                          ? (store.reviews.reduce((sum, r) => sum + r.rating, 0) / store.reviews.length).toFixed(1)
                          : '0.0'}
                      </Text>
                      <Text style={styles.reviewCount}>리뷰 {store.reviews?.length || 0}</Text>
                      {store.distance !== undefined && (
                        <Text style={styles.distanceText}>
                          📍 {store.distance < 1
                            ? `${Math.round(store.distance * 1000)}m`
                            : `${store.distance.toFixed(1)}km`}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.storeAddress} numberOfLines={1}>
                      {store.address}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      <TouchableOpacity
        style={[styles.floatingSwitchButton, isMapMode && styles.floatingSwitchButtonExpanded]}
        onPress={isMapMode ? leaveMapMode : enterMapMode}
        activeOpacity={0.9}
      >
        <Text style={styles.floatingSwitchIcon}>{isMapMode ? '☰' : '📍'}</Text>
        {isMapMode ? <Text style={styles.floatingSwitchText}>목록보기</Text> : null}
      </TouchableOpacity>

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
          <Text style={styles.navIcon}>📦</Text>
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
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerLeft: {
    width: 44,
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  cartHeaderButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartHeaderIcon: {
    fontSize: 24,
  },
  cartHeaderBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  cartHeaderBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // 카테고리 + 필터 통합 컨테이너
  filterContainer: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },

  // 카테고리 탭
  categoryScrollView: {
    flexGrow: 0,
  },
  categoryContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryTabActive: {
    backgroundColor: '#00D563',
    borderColor: '#00D563',
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
    paddingTop: 0,
    paddingBottom: 12,
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
    top: 157,
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
    top: 157,
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
  distanceText: {
    fontSize: 13,
    color: '#00D563',
    fontWeight: '500',
    marginLeft: 8,
  },
  mapModeContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  mapTopControls: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    zIndex: 10,
    gap: 8,
  },
  mapRecenterButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  mapRecenterText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
  mapDistanceScroll: {
    flexGrow: 0,
  },
  mapFilterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 12,
  },
  mapFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D7DEE8',
    backgroundColor: '#FFFFFF',
  },
  mapFilterChipActive: {
    borderColor: '#00D563',
    backgroundColor: '#E8F9F0',
  },
  mapFilterChipText: {
    fontSize: 13,
    color: '#546173',
    fontWeight: '500',
  },
  mapFilterChipTextActive: {
    color: '#008A40',
    fontWeight: '700',
  },
  mapCanvas: {
    flex: 1,
    margin: 0,
    borderRadius: 0,
    borderWidth: 0,
    padding: 0,
  },
  mapErrorOverlay: {
    position: 'absolute',
    top: 86,
    left: 16,
    right: 16,
    color: '#D64545',
    fontSize: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  mapBottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 86,
    height: '40%',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  mapBottomCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5EAF1',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  mapBottomImage: {
    width: '100%',
    height: 130,
    borderRadius: 12,
    marginBottom: 10,
  },
  mapBottomImagePlaceholder: {
    width: '100%',
    height: 130,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#E7EDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapBottomImagePlaceholderText: {
    fontSize: 28,
  },
  mapBottomInfo: {
    gap: 4,
  },
  mapSelectedName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  mapSelectedMeta: {
    fontSize: 13,
    color: '#5E6A7C',
    marginBottom: 4,
  },
  mapSelectedAddress: {
    fontSize: 13,
    color: '#758197',
  },
  mapBottomHint: {
    marginTop: 6,
    fontSize: 12,
    color: '#008A40',
    fontWeight: '600',
  },
  floatingSwitchButton: {
    position: 'absolute',
    left: '50%',
    marginLeft: -28,
    bottom: 114,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E6ED',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingSwitchButtonExpanded: {
    marginLeft: -68,
    width: 136,
    borderRadius: 28,
    flexDirection: 'row',
    gap: 6,
  },
  floatingSwitchIcon: {
    fontSize: 22,
    color: '#252B33',
  },
  floatingSwitchText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#252B33',
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
