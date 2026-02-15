import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// useFocusEffect 제거 - NavigationContainer가 없어서 오류 발생
// import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { fetchStoreReviews } from '../api/reviewApi';
import type { ReviewWithConsumer } from '../types';
import { useCartStore } from '../stores/cartStore';
import QuantitySelector from '../components/QuantitySelector';
import ReviewImages from '../components/ReviewImages';
import MapPlaceholder from '../components/MapPlaceholder';

// 업체 과거 등록 제품 타입 (알람 설정용)
interface PastProductCategory {
  name: string;
  count: number;
}

interface StoreDetailProps {
  storeId: string;
  onReserve: (product: any) => void;
  onViewCart?: () => void;
  onBack: () => void;
  onViewAllReviews?: (storeId: string, storeName: string) => void;
  onViewMap?: () => void;
}

interface Store {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  phone: string;
  cover_image_url: string;
  logo_url: string;
  average_rating: number;
  review_count: number;
  opening_hours_text: string;
  opening_hours?: any;
  product_upload_time?: string;
  refund_policy: string;
  no_show_policy: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface Product {
  id: string;
  name: string;
  original_price: number;
  discounted_price: number;
  stock_quantity: number;
  image_url: string;
  description: string;
  store_id: string;
  expiry_date: string | null;
}

export default function StoreDetail({
  storeId,
  onReserve,
  onViewCart,
  onBack,
  onViewAllReviews,
  onViewMap,
}: StoreDetailProps) {
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ReviewWithConsumer[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // 장바구니 스토어
  const { addItem, getTotalCount, getItemsByStore, clearCart } = useCartStore();
  const cartItems = getItemsByStore(storeId);
  const cartCount = getTotalCount();

  // 스크롤 참조 (리뷰 섹션으로 자동 스크롤용)
  const scrollViewRef = useRef<ScrollView>(null);
  const reviewsSectionRef = useRef<View>(null);

  // 알람 설정 관련 상태
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [consumerId, setConsumerId] = useState<string>('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string>('');
  const [notificationType, setNotificationType] = useState<'all' | 'specific' | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [pastProductCategories, setPastProductCategories] = useState<PastProductCategory[]>([]);
  const [loadingAlarm, setLoadingAlarm] = useState(false);

  // 소비자 ID 및 관심업체 상태 가져오기 (없으면 자동 등록)
  useEffect(() => {
    const fetchOrCreateConsumerAndFavorite = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 기존 소비자 조회
        let { data: consumerData, error: consumerError } = await supabase
          .from('consumers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (consumerError) {
          console.error('소비자 조회 오류:', consumerError);
          return;
        }

        // consumers 테이블에 없으면 자동 등록
        if (!consumerData) {
          const { data: newConsumer, error: insertError } = await supabase
            .from('consumers')
            .insert({
              user_id: user.id,
              nickname: user.email?.split('@')[0] || '사용자',
            })
            .select('id')
            .single();

          if (insertError) {
            console.error('소비자 자동 등록 오류:', insertError);
            return;
          }

          consumerData = newConsumer;
        }

        if (consumerData) {
          setConsumerId(consumerData.id);

          // 현재 업체가 관심업체인지 확인
          const { data: favoriteData } = await supabase
            .from('favorites')
            .select('id, notification_type, product_names')
            .eq('consumer_id', consumerData.id)
            .eq('store_id', storeId)
            .maybeSingle();

          if (favoriteData) {
            setIsFavorite(true);
            setFavoriteId(favoriteData.id);
            setNotificationType(favoriteData.notification_type || null);
            setSelectedProducts(favoriteData.product_names || []);
          }
        }
      } catch (error) {
        console.error('소비자 정보 가져오기 오류:', error);
      }
    };

    fetchOrCreateConsumerAndFavorite();
  }, [storeId]);

  // 과거 등록 제품 카테고리 목록 가져오기 (알람 설정용)
  const fetchPastProductCategories = useCallback(async () => {
    try {
      // 해당 업체에서 등록했던 모든 제품 이름 조회 (중복 제거)
      const { data, error } = await supabase
        .from('products')
        .select('name')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 제품명별 등록 횟수 계산
      const productCounts: Record<string, number> = {};
      (data || []).forEach((item) => {
        productCounts[item.name] = (productCounts[item.name] || 0) + 1;
      });

      // 카테고리 리스트 생성
      const categories: PastProductCategory[] = Object.entries(productCounts).map(
        ([name, count]) => ({ name, count })
      );

      setPastProductCategories(categories);
    } catch (error) {
      console.error('과거 제품 카테고리 로딩 오류:', error);
    }
  }, [storeId]);

  // 알람 모달 열기
  const handleOpenAlarmModal = async () => {
    if (!consumerId) {
      // consumerId가 아직 로딩 중인 경우 잠시 대기 안내
      Alert.alert('알림', '데이터를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    await fetchPastProductCategories();
    setShowAlarmModal(true);
  };

  // 알람 설정 저장
  const handleSaveAlarmSettings = async () => {
    if (!consumerId) return;

    try {
      setLoadingAlarm(true);

      if (notificationType === null) {
        // 알람 해제 - 관심업체에서 삭제
        if (isFavorite && favoriteId) {
          const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('id', favoriteId);

          if (error) throw error;

          setIsFavorite(false);
          setFavoriteId('');
          setSelectedProducts([]);
        }
        Alert.alert('알림', '알람이 해제되었습니다.');
      } else {
        // 알람 설정
        const favoriteData = {
          consumer_id: consumerId,
          store_id: storeId,
          notification_type: notificationType,
          product_names: notificationType === 'specific' ? selectedProducts : null,
        };

        if (isFavorite && favoriteId) {
          // 기존 관심업체 업데이트
          const { error } = await supabase
            .from('favorites')
            .update({
              notification_type: notificationType,
              product_names: notificationType === 'specific' ? selectedProducts : null,
            })
            .eq('id', favoriteId);

          if (error) throw error;
        } else {
          // 새로 관심업체 등록
          const { data, error } = await supabase
            .from('favorites')
            .insert(favoriteData)
            .select('id')
            .single();

          if (error) throw error;

          setIsFavorite(true);
          setFavoriteId(data.id);
        }

        Alert.alert(
          '알림',
          notificationType === 'all'
            ? '모든 알림을 받도록 설정되었습니다.'
            : `${selectedProducts.length}개 제품의 알림을 받도록 설정되었습니다.`
        );
      }

      setShowAlarmModal(false);
    } catch (error) {
      console.error('알람 설정 오류:', error);
      Alert.alert('오류', '알람 설정에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoadingAlarm(false);
    }
  };

  // 제품 선택 토글
  const toggleProductSelection = (productName: string) => {
    if (selectedProducts.includes(productName)) {
      setSelectedProducts(selectedProducts.filter((p) => p !== productName));
    } else {
      setSelectedProducts([...selectedProducts, productName]);
    }
  };

  const fetchStoreDetails = useCallback(async () => {
    try {
      setLoading(true);

      // 업체 정보 가져오기
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      if (storeError) throw storeError;
      setStore(storeData);

      // 활성화된 상품 가져오기 (재고 0인 상품도 포함하여 SOLD OUT 표시)
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;
      const productsList = productsData || [];
      setProducts(productsList);

      // 각 제품의 초기 수량을 1로 설정
      const initialQuantities: Record<string, number> = {};
      productsList.forEach((product) => {
        initialQuantities[product.id] = 1;
      });
      setProductQuantities(initialQuantities);
    } catch (error) {
      console.error('업체 정보 로딩 오류:', error);
      Alert.alert('오류', '업체 정보를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchStoreDetails();
  }, [fetchStoreDetails]);

  // 리뷰 목록 가져오기
  const fetchReviews = useCallback(async () => {
    try {
      setReviewsLoading(true);
      const reviewsData = await fetchStoreReviews(storeId);
      setReviews(reviewsData);
    } catch (error) {
      console.error('리뷰 로딩 오류:', error);
    } finally {
      setReviewsLoading(false);
    }
  }, [storeId]);

  // 리뷰 데이터 로드 (storeId 변경 시)
  // 참고: useFocusEffect는 NavigationContainer가 필요하므로 useEffect로 대체
  // 리뷰 작성 후 새로고침이 필요하면 refreshTrigger prop을 활용하거나
  // App.tsx에서 StoreDetail을 리마운트하는 방식으로 처리
  useEffect(() => {
    if (storeId) {
      fetchReviews();
    }
  }, [storeId, fetchReviews]);

  // 리뷰 더보기/접기 토글
  const toggleReviewExpansion = (reviewId: string) => {
    const newExpanded = new Set(expandedReviews);
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId);
    } else {
      newExpanded.add(reviewId);
    }
    setExpandedReviews(newExpanded);
  };

  // 별점 렌더링
  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  // 수량 변경 핸들러
  const handleQuantityChange = (productId: string, quantity: number) => {
    setProductQuantities((prev) => ({
      ...prev,
      [productId]: quantity,
    }));
  };

  // 장바구니에 담기
  const handleAddToCart = (product: Product) => {
    const quantity = productQuantities[product.id] || 1;

    if (quantity > product.stock_quantity) {
      Alert.alert('오류', `재고가 부족합니다. (재고: ${product.stock_quantity}개)`);
      return;
    }

    // 장바구니에 다른 업체 상품이 있는지 확인
    const cartItems = useCartStore.getState().items;
    const hasOtherStoreItems = cartItems.length > 0 && cartItems[0].storeId !== product.store_id;

    if (hasOtherStoreItems) {
      // 다른 업체 상품이 있으면 선택 다이얼로그 표시
      Alert.alert(
        '장바구니 확인',
        '장바구니에 다른 업체의 상품이 있습니다.\n어떻게 하시겠습니까?',
        [
          {
            text: '기존 상품 예약하기',
            onPress: () => {
              // 장바구니 화면으로 이동하여 기존 상품 예약
              if (onViewCart) {
                onViewCart();
              }
            },
          },
          {
            text: '장바구니 비우고 담기',
            onPress: () => {
              // 장바구니 비우고 새 상품 담기
              clearCart();
              addItemToCart(product, quantity);
            },
            style: 'destructive',
          },
          {
            text: '취소',
            style: 'cancel',
          },
        ]
      );
    } else {
      // 같은 업체거나 장바구니가 비어있으면 바로 담기
      addItemToCart(product, quantity);
    }
  };

  // 실제 장바구니에 담는 함수
  const addItemToCart = (product: Product, quantity: number) => {
    addItem({
      productId: product.id,
      productName: product.name,
      imageUrl: product.image_url,
      originalPrice: product.original_price,
      discountedPrice: product.discounted_price,
      quantity,
      stockQuantity: product.stock_quantity,
      storeId: product.store_id,
      storeName: store?.name || '알 수 없는 업체',
    });

    Alert.alert('장바구니에 추가되었습니다', `${product.name} ${quantity}개가 장바구니에 담겼습니다.`);
  };

  // 장바구니 화면으로 이동
  const handleViewCart = () => {
    if (onViewCart) {
      onViewCart();
    } else {
      Alert.alert('장바구니', `장바구니에 ${cartCount}개의 상품이 있습니다.`);
    }
  };

  // 리뷰 섹션으로 자동 스크롤
  const scrollToReviews = () => {
    if (reviewsSectionRef.current) {
      reviewsSectionRef.current.measure((x, y, width, height, pageX, pageY) => {
        if (scrollViewRef.current) {
          // 리뷰 섹션의 절대 위치로 스크롤 (약간 위로 여백 추가)
          scrollViewRef.current.scrollTo({ y: pageY - 100, animated: true });
        }
      });
    }
  };

  const handleCallStore = () => {
    if (store?.phone) {
      Linking.openURL(`tel:${store.phone}`);
    }
  };

  const calculateDiscount = (original: number, discounted: number) => {
    const discount = Math.round(((original - discounted) / original) * 100);
    return discount;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  if (!store) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>업체를 찾을 수 없습니다.</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* 커버 이미지 */}
        <View style={styles.coverContainer}>
          {store.cover_image_url ? (
            <Image
              source={{ uri: store.cover_image_url }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Text style={styles.coverPlaceholderText}>🏪</Text>
            </View>
          )}

          {/* 뒤로가기 버튼 */}
          <TouchableOpacity style={styles.backIconButton} onPress={onBack}>
            <Text style={styles.backIconText}>←</Text>
          </TouchableOpacity>

          {/* 업체 로고 */}
          <View style={styles.logoContainer}>
            {store.logo_url ? (
              <Image
                source={{ uri: store.logo_url }}
                style={styles.logoImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoPlaceholderText}>🏪</Text>
              </View>
            )}
          </View>
        </View>

        {/* 업체 기본 정보 */}
        <View style={styles.infoContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.storeName}>{store.name}</Text>
          </View>

          {/* 평점 및 리뷰 (클릭 가능) - reviews 배열에서 직접 계산 */}
          <TouchableOpacity
            style={styles.ratingRow}
            onPress={scrollToReviews}
            activeOpacity={0.7}
          >
            <Text style={styles.rating}>
              ⭐ {reviews.length > 0
                ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                : '0.0'}
            </Text>
            <Text style={styles.reviewCount}>리뷰 {reviews.length}개</Text>
          </TouchableOpacity>

          {/* 영업시간 */}
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>🕒</Text>
            <Text style={styles.detailText}>
              {store.opening_hours_text || '영업시간 정보 없음'}
            </Text>
          </View>

          {(() => {
            const match = store.opening_hours_text?.match(/상품 업로드 시간:\s*([^|]+)/);
            const uploadTime =
              store.product_upload_time ||
              store.opening_hours?.product_upload_time ||
              match?.[1]?.trim();
            if (!uploadTime) return null;
            return (
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>⏱️</Text>
                <Text style={styles.detailText}>
                  상품 업로드 시간: {uploadTime}
                </Text>
              </View>
            );
          })()}

          {/* 주소 */}
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={styles.detailText}>{store.address}</Text>
          </View>

          <View style={styles.locationSection}>
            <MapPlaceholder
              markers={[
                {
                  id: store.id,
                  name: store.name,
                  latitude: store.latitude ?? null,
                  longitude: store.longitude ?? null,
                },
              ]}
              selectedId={store.id}
              title="매장 위치"
              height={180}
              useNativeMap
            />
            {onViewMap && (
              <TouchableOpacity style={styles.viewMapButton} onPress={onViewMap}>
                <Text style={styles.viewMapButtonText}>지도 크게 보기</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 전화번호 */}
          {store.phone && (
            <TouchableOpacity style={styles.detailRow} onPress={handleCallStore}>
              <Text style={styles.detailIcon}>📞</Text>
              <Text style={[styles.detailText, styles.phoneText]}>{store.phone}</Text>
            </TouchableOpacity>
          )}

          {/* 알람 설정 버튼 */}
          <TouchableOpacity
            style={[
              styles.alarmButton,
              notificationType !== null && styles.alarmButtonActive,
            ]}
            onPress={handleOpenAlarmModal}
          >
            <Text style={styles.alarmButtonIcon}>
              {notificationType !== null ? '🔔' : '🔕'}
            </Text>
            <Text
              style={[
                styles.alarmButtonText,
                notificationType !== null && styles.alarmButtonTextActive,
              ]}
            >
              {notificationType === null
                ? '알림 받기'
                : notificationType === 'all'
                ? '전체 알림 ON'
                : `${selectedProducts.length}개 제품 알림 ON`}
            </Text>
          </TouchableOpacity>

          {/* 업체 설명 */}
          {store.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>업체 소개</Text>
              <Text style={styles.descriptionText}>{store.description}</Text>
            </View>
          )}

        </View>

        {/* 구분선 */}
        <View style={styles.divider} />

        {/* 상품 리스트 */}
        <View style={styles.productsContainer}>
          <Text style={styles.productsTitle}>할인 상품 ({products.length})</Text>

          {products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>현재 판매 중인 상품이 없습니다.</Text>
            </View>
          ) : (
            products.map((product) => {
              const isSoldOut = product.stock_quantity <= 0;

              return (
                <View
                  key={product.id}
                  style={[
                    styles.productCard,
                    isSoldOut && styles.productCardSoldOut,
                  ]}
                >
                  {/* 상품 이미지 */}
                  <View style={styles.productImageContainer}>
                    {product.image_url ? (
                      <Image
                        source={{ uri: product.image_url }}
                        style={styles.productImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.productImagePlaceholder}>
                        <Text style={styles.productImagePlaceholderText}>🍞</Text>
                      </View>
                    )}

                    {/* 할인율 뱃지 */}
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountBadgeText}>
                        {calculateDiscount(product.original_price, product.discounted_price)}% ↓
                      </Text>
                    </View>

                    {/* SOLD OUT 오버레이 */}
                    {isSoldOut && (
                      <View style={styles.soldOutOverlay}>
                        <Text style={styles.soldOutText}>SOLD OUT</Text>
                      </View>
                    )}
                  </View>

                  {/* 상품 정보 */}
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    {product.description && (
                      <Text style={styles.productDescription} numberOfLines={2}>
                        {product.description}
                      </Text>
                    )}

                    <View style={styles.priceRow}>
                      <Text style={styles.originalPrice}>
                        {product.original_price.toLocaleString()}원
                      </Text>
                      <Text style={styles.discountedPrice}>
                        {product.discounted_price.toLocaleString()}원
                      </Text>
                    </View>

                    <View style={styles.stockRow}>
                      {isSoldOut ? (
                        <Text style={styles.stockTextSoldOut}>품절</Text>
                      ) : (
                        <Text style={styles.stockText}>재고: {product.stock_quantity}개</Text>
                      )}
                    </View>
                    {product.expiry_date && (
                      <Text style={styles.expiryText}>소비기한: {product.expiry_date}</Text>
                    )}

                    {/* 수량 선택 - 재고 있을 때만 표시 */}
                    {!isSoldOut && (
                      <View style={styles.quantitySection}>
                        <Text style={styles.quantityLabel}>수량</Text>
                        <QuantitySelector
                          quantity={productQuantities[product.id] || 1}
                          min={1}
                          max={product.stock_quantity}
                          onQuantityChange={(qty) => handleQuantityChange(product.id, qty)}
                        />
                      </View>
                    )}

                    {/* 액션 버튼 */}
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[
                          styles.cartButton,
                          isSoldOut && styles.cartButtonDisabled,
                        ]}
                        onPress={() => !isSoldOut && handleAddToCart(product)}
                        disabled={isSoldOut}
                      >
                        <Text style={[
                          styles.cartButtonText,
                          isSoldOut && styles.cartButtonTextDisabled,
                        ]}>
                          🛒 장바구니 담기
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.reserveButton,
                          isSoldOut && styles.buttonDisabled,
                        ]}
                        onPress={() => {
                          if (isSoldOut) return;
                          const qty = productQuantities[product.id] || 1;
                          if (qty > product.stock_quantity) {
                            Alert.alert('오류', `재고가 부족합니다. (재고: ${product.stock_quantity}개)`);
                            return;
                          }
                          onReserve({ ...product, quantity: qty });
                        }}
                        disabled={isSoldOut}
                      >
                        <Text style={[
                          styles.reserveButtonText,
                          isSoldOut && styles.reserveButtonTextDisabled,
                        ]}>
                          예약하기 →
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* 구분선 */}
        <View style={styles.divider} />

        {/* 리뷰 섹션 (제품 아래로 이동) - reviews 배열에서 직접 계산 */}
        <View ref={reviewsSectionRef} style={styles.reviewsContainer}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.reviewsTitle}>
              리뷰 ({reviews.length}개)
            </Text>
            <Text style={styles.reviewsRating}>
              ⭐ {reviews.length > 0
                ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                : '0.0'}
            </Text>
          </View>

          {reviewsLoading ? (
            <View style={styles.reviewsLoadingContainer}>
              <ActivityIndicator size="small" color="#00D563" />
            </View>
          ) : reviews.length === 0 ? (
            <View style={styles.reviewsEmptyContainer}>
              <Text style={styles.reviewsEmptyIcon}>💬</Text>
              <Text style={styles.reviewsEmptyText}>아직 리뷰가 없습니다</Text>
              <Text style={styles.reviewsEmptySubText}>
                첫 번째 리뷰를 작성해주세요!
              </Text>
            </View>
          ) : (
            reviews.slice(0, 3).map((review) => {
              const isExpanded = expandedReviews.has(review.id);
              const shouldShowMore = review.content.length > 100;
              const displayContent = isExpanded || !shouldShowMore
                ? review.content
                : review.content.substring(0, 100) + '...';

              return (
                <View key={review.id} style={styles.reviewCard}>
                  {/* 리뷰 헤더 */}
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewHeaderLeft}>
                      {review.consumers?.avatar_url ? (
                        <Image
                          source={{ uri: review.consumers.avatar_url }}
                          style={styles.reviewProfileImage}
                        />
                      ) : (
                        <View style={styles.reviewProfilePlaceholder}>
                          <Text style={styles.reviewProfilePlaceholderText}>👤</Text>
                        </View>
                      )}
                      <View style={styles.reviewHeaderInfo}>
                        <Text style={styles.reviewerName}>
                          {review.consumers?.nickname || '익명'}
                        </Text>
                        <Text style={styles.reviewDate}>
                          {formatDate(review.created_at)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.reviewStarsContainer}>
                      <Text style={styles.reviewStars}>
                        {renderStars(review.rating)}
                      </Text>
                    </View>
                  </View>

                  {/* 리뷰 내용 */}
                  <Text style={styles.reviewContent}>{displayContent}</Text>

                  {/* 리뷰 이미지 */}
                  {review.image_urls && review.image_urls.length > 0 && (
                    <ReviewImages images={review.image_urls} size="small" />
                  )}

                  {/* 더보기 버튼 */}
                  {shouldShowMore && (
                    <TouchableOpacity
                      onPress={() => toggleReviewExpansion(review.id)}
                      style={styles.reviewMoreButton}
                    >
                      <Text style={styles.reviewMoreButtonText}>
                        {isExpanded ? '접기' : '더보기'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* 업주 답글 */}
                  {review.reply && (
                    <View style={styles.replyContainer}>
                      <Text style={styles.replyLabel}>💚 업주 답글</Text>
                      <Text style={styles.replyText}>{review.reply}</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}

          {/* 리뷰 더 보기 버튼 (리뷰가 3개 초과일 때만 표시) */}
          {reviews.length > 3 && (
            <TouchableOpacity
              style={styles.viewAllReviewsButton}
              onPress={() => {
                if (onViewAllReviews && store) {
                  onViewAllReviews(storeId, store.name);
                }
              }}
            >
              <Text style={styles.viewAllReviewsButtonText}>
                리뷰 더 보기 ({reviews.length}개)
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 구분선 */}
        <View style={styles.divider} />

        {/* 환불/노쇼 정책 (리뷰 아래, 화면 최하단) */}
        <View style={styles.policyBottomContainer}>
          <View style={styles.policyItem}>
            <Text style={styles.policyTitle}>💰 환불 정책</Text>
            <Text style={styles.policyText}>
              {store.refund_policy || '픽업 1시간 전까지 취소 가능하며, 전액 환불됩니다.'}
            </Text>
          </View>
          <View style={styles.policyItem}>
            <Text style={styles.policyTitle}>⚠️ 노쇼 정책</Text>
            <Text style={styles.policyText}>
              {store.no_show_policy || '노쇼 시 다음 예약이 제한될 수 있습니다.'}
            </Text>
          </View>
        </View>

        {/* 하단 여백 */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 고정 장바구니 아이콘 (Floating Button) */}
      <TouchableOpacity
        style={styles.floatingCartButton}
        onPress={handleViewCart}
        accessibilityLabel="장바구니"
        accessibilityRole="button"
      >
        <Text style={styles.floatingCartIcon}>🛒</Text>
        {cartCount > 0 && (
          <View style={styles.floatingCartBadge}>
            <Text style={styles.floatingCartBadgeText}>{cartCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* 알람 설정 모달 */}
      <Modal
        visible={showAlarmModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAlarmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.alarmModalContainer}>
            {/* 모달 헤더 */}
            <View style={styles.alarmModalHeader}>
              <TouchableOpacity onPress={() => setShowAlarmModal(false)}>
                <Text style={styles.alarmModalCloseBtn}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.alarmModalTitle}>알림 설정</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* 스크롤 가능한 컨텐츠 영역 */}
            <ScrollView
              style={styles.alarmModalScrollContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* 알림 타입 선택 */}
              <View style={styles.alarmTypeContainer}>
                <Text style={styles.alarmSectionTitle}>알림 유형 선택</Text>

                {/* 알림 해제 */}
                <TouchableOpacity
                  style={[
                    styles.alarmTypeOption,
                    notificationType === null && styles.alarmTypeOptionActive,
                  ]}
                  onPress={() => {
                    setNotificationType(null);
                    setSelectedProducts([]);
                  }}
                >
                  <Text style={styles.alarmTypeIcon}>🔕</Text>
                  <View style={styles.alarmTypeTextContainer}>
                    <Text style={styles.alarmTypeLabel}>알림 받지 않기</Text>
                    <Text style={styles.alarmTypeDesc}>이 업체의 알림을 받지 않습니다</Text>
                  </View>
                  {notificationType === null && (
                    <Text style={styles.checkMark}>✓</Text>
                  )}
                </TouchableOpacity>

                {/* 모든 알림 */}
                <TouchableOpacity
                  style={[
                    styles.alarmTypeOption,
                    notificationType === 'all' && styles.alarmTypeOptionActive,
                  ]}
                  onPress={() => {
                    setNotificationType('all');
                    setSelectedProducts([]);
                  }}
                >
                  <Text style={styles.alarmTypeIcon}>🔔</Text>
                  <View style={styles.alarmTypeTextContainer}>
                    <Text style={styles.alarmTypeLabel}>모든 알림 받기</Text>
                    <Text style={styles.alarmTypeDesc}>새 제품이 등록되면 모두 알려드립니다</Text>
                  </View>
                  {notificationType === 'all' && (
                    <Text style={styles.checkMark}>✓</Text>
                  )}
                </TouchableOpacity>

                {/* 특정 제품군만 */}
                <TouchableOpacity
                  style={[
                    styles.alarmTypeOption,
                    notificationType === 'specific' && styles.alarmTypeOptionActive,
                  ]}
                  onPress={() => setNotificationType('specific')}
                >
                  <Text style={styles.alarmTypeIcon}>📋</Text>
                  <View style={styles.alarmTypeTextContainer}>
                    <Text style={styles.alarmTypeLabel}>특정 제품만 알림</Text>
                    <Text style={styles.alarmTypeDesc}>선택한 제품이 등록되면 알려드립니다</Text>
                  </View>
                  {notificationType === 'specific' && (
                    <Text style={styles.checkMark}>✓</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* 특정 제품 선택 (notificationType === 'specific'일 때만 표시) */}
              {notificationType === 'specific' && (
                <View style={styles.productSelectContainer}>
                  <Text style={styles.alarmSectionTitle}>
                    알림 받을 제품 선택 ({selectedProducts.length}개 선택)
                  </Text>

                  {pastProductCategories.length === 0 ? (
                    <View style={styles.emptyProductList}>
                      <Text style={styles.emptyProductText}>
                        이 업체에서 등록한 제품이 없습니다
                      </Text>
                    </View>
                  ) : (
                    pastProductCategories.map((category) => (
                      <TouchableOpacity
                        key={category.name}
                        style={[
                          styles.productSelectItem,
                          selectedProducts.includes(category.name) &&
                            styles.productSelectItemActive,
                        ]}
                        onPress={() => toggleProductSelection(category.name)}
                      >
                        <View style={styles.productSelectInfo}>
                          <Text style={styles.productSelectName}>{category.name}</Text>
                          <Text style={styles.productSelectCount}>
                            {category.count}회 등록됨
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.productCheckbox,
                            selectedProducts.includes(category.name) &&
                              styles.productCheckboxActive,
                          ]}
                        >
                          {selectedProducts.includes(category.name) && (
                            <Text style={styles.productCheckboxMark}>✓</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}

              {/* 하단 여백 */}
              <View style={{ height: 20 }} />
            </ScrollView>

            {/* 저장 버튼 - 모달 하단에 고정 */}
            <View style={styles.alarmSaveButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.alarmSaveButton,
                  loadingAlarm && styles.alarmSaveButtonDisabled,
                ]}
                onPress={handleSaveAlarmSettings}
                disabled={loadingAlarm}
              >
                {loadingAlarm ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.alarmSaveButtonText}>설정 저장</Text>
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // 커버 이미지 영역
  coverContainer: {
    position: 'relative',
    height: 200,
    backgroundColor: '#E0E0E0',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPlaceholderText: {
    fontSize: 60,
  },
  backIconButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backIconText: {
    fontSize: 24,
    color: '#333',
  },
  logoContainer: {
    position: 'absolute',
    bottom: -40,
    left: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderText: {
    fontSize: 32,
  },

  // 업체 정보 영역
  infoContainer: {
    backgroundColor: '#FFF',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  storeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  category: {
    fontSize: 14,
    color: '#FFF',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  reviewCount: {
    fontSize: 14,
    color: '#999',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailIcon: {
    fontSize: 18,
    marginRight: 10,
    width: 24,
  },
  detailText: {
    fontSize: 15,
    color: '#666',
    flex: 1,
  },
  locationSection: {
    marginTop: 8,
    marginBottom: 2,
    gap: 10,
  },
  viewMapButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#00D563',
    backgroundColor: '#E8F9F0',
  },
  viewMapButtonText: {
    color: '#008A40',
    fontSize: 13,
    fontWeight: '700',
  },
  phoneText: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  descriptionContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  policyContainer: {
    marginTop: 15,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 15,
  },
  policyBottomContainer: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  policyItem: {
    marginBottom: 12,
  },
  policyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  policyText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },

  // 구분선
  divider: {
    height: 8,
    backgroundColor: '#F0F0F0',
  },

  // 상품 리스트 영역
  productsContainer: {
    backgroundColor: '#FFF',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  productsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
  },
  productCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  productCardSoldOut: {
    opacity: 0.7,
  },
  productImageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImagePlaceholderText: {
    fontSize: 60,
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  discountBadgeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  soldOutOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  productDescription: {
    fontSize: 14,
    color: '#999',
    marginBottom: 10,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  originalPrice: {
    fontSize: 15,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 10,
  },
  discountedPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stockText: {
    fontSize: 14,
    color: '#666',
  },
  stockTextSoldOut: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
  },
  expiryText: {
    fontSize: 13,
    color: '#FF6B6B',
    marginTop: 4,
    fontWeight: '500',
  },
  reserveButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  reserveButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  reserveButtonTextDisabled: {
    color: '#999999',
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },

  // 장바구니 아이콘
  cartIconButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cartIconText: {
    fontSize: 24,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // 수량 선택 섹션
  quantitySection: {
    marginTop: 12,
    marginBottom: 12,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },

  // 액션 버튼
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cartButton: {
    flex: 1,
    backgroundColor: '#F0F9F4',
    borderWidth: 2,
    borderColor: '#00D563',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  cartButtonText: {
    color: '#00D563',
    fontSize: 14,
    fontWeight: '600',
  },
  cartButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#CCCCCC',
  },
  cartButtonTextDisabled: {
    color: '#999999',
  },

  // 리뷰 섹션
  reviewsContainer: {
    backgroundColor: '#FFF',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  reviewsRating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  reviewsLoadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  reviewsEmptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  reviewsEmptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  reviewsEmptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 4,
  },
  reviewsEmptySubText: {
    fontSize: 14,
    color: '#999999',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reviewHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#F0F0F0',
  },
  reviewProfilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewProfilePlaceholderText: {
    fontSize: 20,
  },
  reviewHeaderInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 13,
    color: '#999999',
  },
  reviewStarsContainer: {
    marginLeft: 8,
  },
  reviewStars: {
    fontSize: 16,
  },
  reviewContent: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewMoreButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 8,
  },
  reviewMoreButtonText: {
    fontSize: 13,
    color: '#00D563',
    fontWeight: '600',
  },
  replyContainer: {
    backgroundColor: '#F0F9F4',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
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

  // 알람 버튼
  alarmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  alarmButtonActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#00D563',
  },
  alarmButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  alarmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  alarmButtonTextActive: {
    color: '#00D563',
  },

  // 고정 장바구니 버튼 (Floating)
  floatingCartButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00D563',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  floatingCartIcon: {
    fontSize: 28,
  },
  floatingCartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  floatingCartBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },

  // 알람 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  alarmModalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  alarmModalScrollContent: {
    flexGrow: 0,
  },
  alarmModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  alarmModalCloseBtn: {
    fontSize: 20,
    color: '#999',
    padding: 4,
  },
  alarmModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  alarmTypeContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  alarmSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  alarmTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  alarmTypeOptionActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#00D563',
  },
  alarmTypeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  alarmTypeTextContainer: {
    flex: 1,
  },
  alarmTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  alarmTypeDesc: {
    fontSize: 13,
    color: '#999',
  },
  checkMark: {
    fontSize: 18,
    color: '#00D563',
    fontWeight: 'bold',
  },
  productSelectContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  emptyProductList: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyProductText: {
    fontSize: 14,
    color: '#999',
  },
  productSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  productSelectItemActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#00D563',
  },
  productSelectInfo: {
    flex: 1,
  },
  productSelectName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  productSelectCount: {
    fontSize: 12,
    color: '#999',
  },
  productCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  productCheckboxActive: {
    backgroundColor: '#00D563',
    borderColor: '#00D563',
  },
  productCheckboxMark: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  alarmSaveButtonContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 30,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  alarmSaveButton: {
    backgroundColor: '#00D563',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  alarmSaveButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  alarmSaveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // 리뷰 더 보기 버튼
  viewAllReviewsButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  viewAllReviewsButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00D563',
  },
});
