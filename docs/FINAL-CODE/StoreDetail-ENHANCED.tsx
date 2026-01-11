import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface StoreDetailProps {
  storeId: string;
  onReserve: (product: any) => void;
  onBack: () => void;
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
  pickup_start_time: string;
  pickup_end_time: string;
  refund_policy: string;
  no_show_policy: string;
}

interface Product {
  id: string;
  name: string;
  original_price: number;
  discounted_price: number;
  stock_quantity: number;
  image_url: string;
  description: string;
}

export default function StoreDetail({ storeId, onReserve, onBack }: StoreDetailProps) {
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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

      // 활성화된 상품 가져오기
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .gt('stock_quantity', 0)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (error) {
      console.error('업체 정보 로딩 오류:', error);
      alert('업체 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchStoreDetails();
  }, [fetchStoreDetails]);

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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
            <Text style={styles.category}>{store.category}</Text>
          </View>

          {/* 평점 및 리뷰 */}
          <View style={styles.ratingRow}>
            <Text style={styles.rating}>
              ⭐ {store.average_rating?.toFixed(1) || '0.0'}
            </Text>
            <Text style={styles.reviewCount}>리뷰 {store.review_count || 0}개</Text>
          </View>

          {/* 영업시간 */}
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>🕒</Text>
            <Text style={styles.detailText}>
              {store.opening_hours_text || '영업시간 정보 없음'}
            </Text>
          </View>

          {/* 픽업 시간 */}
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📦</Text>
            <Text style={styles.detailText}>
              픽업 가능 시간: {store.pickup_start_time?.slice(0, 5)} - {store.pickup_end_time?.slice(0, 5)}
            </Text>
          </View>

          {/* 주소 */}
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={styles.detailText}>{store.address}</Text>
          </View>

          {/* 전화번호 */}
          {store.phone && (
            <TouchableOpacity style={styles.detailRow} onPress={handleCallStore}>
              <Text style={styles.detailIcon}>📞</Text>
              <Text style={[styles.detailText, styles.phoneText]}>{store.phone}</Text>
            </TouchableOpacity>
          )}

          {/* 업체 설명 */}
          {store.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>업체 소개</Text>
              <Text style={styles.descriptionText}>{store.description}</Text>
            </View>
          )}

          {/* 환불/노쇼 정책 */}
          <View style={styles.policyContainer}>
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
            products.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => onReserve(product)}
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
                    <Text style={styles.stockText}>재고: {product.stock_quantity}개</Text>
                    <View style={styles.reserveButton}>
                      <Text style={styles.reserveButtonText}>예약하기 →</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* 하단 여백 */}
        <View style={{ height: 30 }} />
      </ScrollView>
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
});
