import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Switch,
  Modal,
  FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';

interface StoreProductManagementProps {
  onBack: () => void;
}

interface PastProduct {
  id: string;
  name: string;
  original_price: number;
  discounted_price: number;
  image_url: string | null;
  manufactured_date: string | null;
  expiry_date: string | null;
}

export default function StoreProductManagement({ onBack }: StoreProductManagementProps) {
  const [loading, setLoading] = useState(false);
  const [storeId, setStoreId] = useState('');

  // 상품 정보
  const [productImage, setProductImage] = useState<any>(null);
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState(5);
  const [manufacturedDate, setManufacturedDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [sendNotification, setSendNotification] = useState(true);

  // 과거 상품 관련
  const [showPastProducts, setShowPastProducts] = useState(false);
  const [pastProducts, setPastProducts] = useState<PastProduct[]>([]);
  const [loadingPastProducts, setLoadingPastProducts] = useState(false);

  // 할인율 계산
  const discountRate = useCallback(() => {
    const original = parseFloat(originalPrice);
    const discounted = parseFloat(discountedPrice);
    if (original > 0 && discounted > 0 && discounted < original) {
      return Math.round(((original - discounted) / original) * 100);
    }
    return 0;
  }, [originalPrice, discountedPrice]);

  // 업체 ID 가져오기
  useEffect(() => {
    const fetchStoreId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('사용자 정보를 찾을 수 없습니다');

        const { data: storeData, error } = await supabase
          .from('stores')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setStoreId(storeData.id);
      } catch (error) {
        console.error('업체 정보 로딩 오류:', error);
        alert('업체 정보를 불러오는데 실패했습니다.');
      }
    };

    fetchStoreId();
  }, []);

  // 상품 사진 선택
  const pickProductImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('사진 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProductImage(result.assets[0]);
      setProductImageUrl(null); // 새 이미지 선택 시 URL 초기화
    }
  };

  // 재고 증감
  const increaseStock = () => setStockQuantity(stockQuantity + 1);
  const decreaseStock = () => {
    if (stockQuantity > 0) setStockQuantity(stockQuantity - 1);
  };

  // 상품 등록
  const handleSubmit = async () => {
    try {
      // 유효성 검사
      if (!productName.trim()) {
        alert('상품명을 입력해주세요.');
        return;
      }
      if (!originalPrice || parseFloat(originalPrice) <= 0) {
        alert('정가를 입력해주세요.');
        return;
      }
      if (!discountedPrice || parseFloat(discountedPrice) <= 0) {
        alert('할인가를 입력해주세요.');
        return;
      }
      if (parseFloat(discountedPrice) >= parseFloat(originalPrice)) {
        alert('할인가는 정가보다 낮아야 합니다.');
        return;
      }
      if (stockQuantity <= 0) {
        alert('재고 수량을 1개 이상 입력해주세요.');
        return;
      }

      setLoading(true);

      // 1. 상품 이미지 업로드 (선택 사항)
      let imageUrl = productImageUrl; // 과거 상품에서 가져온 URL 유지
      if (productImage) {
        const fileExt = productImage.uri.split('.').pop();
        const fileName = `${storeId}-product-${Date.now()}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const base64 = await FileSystem.readAsStringAsync(productImage.uri, {
          encoding: 'base64',
        });

        const { error: uploadError } = await supabase.storage
          .from('store-documents')
          .upload(filePath, decode(base64), {
            contentType: `image/${fileExt}`,
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('store-documents')
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      // 2. 상품 등록
      const { error } = await supabase.from('products').insert({
        store_id: storeId,
        name: productName,
        original_price: parseFloat(originalPrice),
        discounted_price: parseFloat(discountedPrice),
        stock_quantity: stockQuantity,
        image_url: imageUrl,
        manufactured_date: manufacturedDate || null,
        expiry_date: expiryDate || null,
        send_notification: sendNotification,
        is_active: true,
      });

      if (error) throw error;

      alert('상품이 등록되었습니다.');

      // 폼 초기화
      setProductImage(null);
      setProductImageUrl(null);
      setProductName('');
      setOriginalPrice('');
      setDiscountedPrice('');
      setStockQuantity(5);
      setManufacturedDate('');
      setExpiryDate('');
      setSendNotification(true);

      onBack();
    } catch (error) {
      console.error('상품 등록 오류:', error);
      alert('상품 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 과거 상품 불러오기
  const loadPastProducts = async () => {
    try {
      setLoadingPastProducts(true);
      setShowPastProducts(true);

      const { data, error } = await supabase
        .from('products')
        .select('id, name, original_price, discounted_price, image_url, manufactured_date, expiry_date')
        .eq('store_id', storeId)
        .eq('is_active', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setPastProducts(data || []);
    } catch (error) {
      console.error('과거 상품 로딩 오류:', error);
      alert('과거 상품을 불러오는데 실패했습니다.');
      setShowPastProducts(false);
    } finally {
      setLoadingPastProducts(false);
    }
  };

  // 과거 상품 선택
  const selectPastProduct = (product: PastProduct) => {
    setProductName(product.name);
    setOriginalPrice(product.original_price.toString());
    setDiscountedPrice(product.discounted_price.toString());
    setProductImageUrl(product.image_url);
    setProductImage(null); // 로컬 이미지 초기화
    setManufacturedDate(product.manufactured_date || '');
    setExpiryDate(product.expiry_date || '');

    setShowPastProducts(false);
    alert('상품 정보를 불러왔습니다. 재고만 입력하고 등록해주세요!');
  };

  // 과거 상품 아이템 렌더링
  const renderPastProductItem = ({ item }: { item: PastProduct }) => {
    const discount = Math.round(((item.original_price - item.discounted_price) / item.original_price) * 100);

    return (
      <View style={styles.pastProductItem}>
        <Image
          source={{ uri: item.image_url || 'https://via.placeholder.com/80' }}
          style={styles.pastProductImage}
          resizeMode="cover"
        />
        <View style={styles.pastProductInfo}>
          <Text style={styles.pastProductName}>{item.name}</Text>
          <View style={styles.pastProductPriceRow}>
            <Text style={styles.pastProductOriginalPrice}>
              정가: {item.original_price.toLocaleString()}원
            </Text>
            <Text style={styles.pastProductDiscountedPrice}>
              할인가: {item.discounted_price.toLocaleString()}원
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => selectPastProduct(item)}
        >
          <Text style={styles.selectButtonText}>선택</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>상품 등록</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 과거 등록 상품 불러오기 */}
        <TouchableOpacity style={styles.loadPastButton} onPress={loadPastProducts}>
          <Text style={styles.loadPastIcon}>🔄</Text>
          <Text style={styles.loadPastText}>과거 등록 상품 불러오기</Text>
        </TouchableOpacity>

        {/* 기본 정보 */}
        <Text style={styles.sectionTitle}>기본 정보</Text>

        {/* 상품 사진 추가 */}
        <Text style={styles.label}>상품명</Text>
        <TouchableOpacity style={styles.imageUploadBox} onPress={pickProductImage}>
          {productImage ? (
            <Image
              source={{ uri: productImage.uri }}
              style={styles.uploadedImage}
              resizeMode="cover"
            />
          ) : productImageUrl ? (
            <Image
              source={{ uri: productImageUrl }}
              style={styles.uploadedImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imageUploadPlaceholder}>
              <Text style={styles.imageUploadIcon}>📷+</Text>
              <Text style={styles.imageUploadText}>상품 사진 추가</Text>
            </View>
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={productName}
          onChangeText={setProductName}
          placeholder="예: 유기농 딸기"
          placeholderTextColor="#999"
        />

        {/* 가격 및 재고 */}
        <Text style={styles.sectionTitle}>가격 및 재고</Text>

        <View style={styles.priceRow}>
          <View style={styles.priceColumn}>
            <Text style={styles.label}>정가</Text>
            <TextInput
              style={styles.priceInput}
              value={originalPrice}
              onChangeText={setOriginalPrice}
              placeholder="10000"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
            <Text style={styles.priceUnit}>원</Text>
          </View>

          <View style={styles.priceColumn}>
            <Text style={styles.label}>할인가</Text>
            <TextInput
              style={[styles.priceInput, styles.discountInput]}
              value={discountedPrice}
              onChangeText={setDiscountedPrice}
              placeholder="7000"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
            <Text style={styles.priceUnit}>원</Text>
          </View>
        </View>

        {/* 현재 할인율 */}
        {discountRate() > 0 && (
          <View style={styles.discountRateBox}>
            <Text style={styles.discountRateLabel}>현재 할인율</Text>
            <Text style={styles.discountRateValue}>{discountRate()}% 할인</Text>
          </View>
        )}

        {/* 재고 수량 */}
        <Text style={styles.label}>재고 수량</Text>
        <View style={styles.stockRow}>
          <TouchableOpacity style={styles.stockButton} onPress={decreaseStock}>
            <Text style={styles.stockButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.stockValue}>{stockQuantity}</Text>
          <TouchableOpacity style={styles.stockButton} onPress={increaseStock}>
            <Text style={styles.stockButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* 제조날짜 & 소비기한 */}
        <View style={styles.dateRow}>
          <View style={styles.dateColumn}>
            <Text style={styles.label}>제조날짜</Text>
            <TextInput
              style={styles.dateInput}
              value={manufacturedDate}
              onChangeText={setManufacturedDate}
              placeholder="24/05/20"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.dateColumn}>
            <Text style={styles.label}>소비기한</Text>
            <TextInput
              style={styles.dateInput}
              value={expiryDate}
              onChangeText={setExpiryDate}
              placeholder="24/05/23"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* 단골 알람 전송 */}
        <View style={styles.notificationBox}>
          <View>
            <Text style={styles.notificationTitle}>단골 알람 전송</Text>
            <Text style={styles.notificationSubtitle}>
              가게 단골분들에게 상품 등록 알림을 보냅니다.
            </Text>
          </View>
          <Switch
            value={sendNotification}
            onValueChange={setSendNotification}
            trackColor={{ false: '#D0D0D0', true: '#00D563' }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#D0D0D0"
          />
        </View>

        {/* 상품 등록 완료 버튼 */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>🛒 상품 등록 완료</Text>
          )}
        </TouchableOpacity>

        {/* 하단 여백 */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 과거 상품 목록 Modal */}
      <Modal
        visible={showPastProducts}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPastProducts(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal 헤더 */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowPastProducts(false)}>
                <Text style={styles.modalBackButton}>←</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>과거 등록 상품</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* 검색 바 */}
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="상품 이름으로 검색"
                placeholderTextColor="#999"
              />
            </View>

            {/* 과거 상품 목록 */}
            {loadingPastProducts ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00D563" />
                <Text style={styles.loadingText}>상품을 불러오는 중...</Text>
              </View>
            ) : pastProducts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📦</Text>
                <Text style={styles.emptyText}>과거 등록 상품이 없습니다</Text>
              </View>
            ) : (
              <FlatList
                data={pastProducts}
                renderItem={renderPastProductItem}
                keyExtractor={(item) => item.id}
                style={styles.pastProductList}
                showsVerticalScrollIndicator={false}
              />
            )}
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

  // 스크롤뷰
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // 과거 상품 불러오기
  loadPastButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#00D563',
  },
  loadPastIcon: {
    fontSize: 18,
  },
  loadPastText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00A84D',
  },

  // 섹션 타이틀
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 15,
  },

  // 라벨
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },

  // 이미지 업로드
  imageUploadBox: {
    width: '100%',
    height: 200,
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 15,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  imageUploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageUploadIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  imageUploadText: {
    fontSize: 15,
    color: '#666',
  },

  // 입력 필드
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 15,
  },

  // 가격 행
  priceRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 15,
  },
  priceColumn: {
    flex: 1,
    position: 'relative',
  },
  priceInput: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    paddingRight: 45,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  discountInput: {
    borderColor: '#00D563',
    borderWidth: 2,
  },
  priceUnit: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    fontSize: 15,
    color: '#999',
  },

  // 할인율 표시
  discountRateBox: {
    backgroundColor: '#FFF4E5',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  discountRateLabel: {
    fontSize: 15,
    color: '#666',
  },
  discountRateValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B00',
  },

  // 재고 수량
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  stockButton: {
    width: 44,
    height: 44,
    backgroundColor: '#F5F5F5',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockButtonText: {
    fontSize: 24,
    color: '#333',
    fontWeight: '300',
  },
  stockValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 40,
  },

  // 날짜 행
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  dateColumn: {
    flex: 1,
  },
  dateInput: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  // 단골 알람
  notificationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notificationSubtitle: {
    fontSize: 13,
    color: '#999',
  },

  // 제출 버튼
  submitButton: {
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

  // Modal 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
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

  // 검색 바
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    margin: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  searchIcon: {
    fontSize: 18,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },

  // 과거 상품 목록
  pastProductList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  pastProductItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 12,
  },
  pastProductImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  pastProductInfo: {
    flex: 1,
  },
  pastProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  pastProductPriceRow: {
    gap: 4,
  },
  pastProductOriginalPrice: {
    fontSize: 13,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  pastProductDiscountedPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00D563',
  },
  selectButton: {
    backgroundColor: '#00D563',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  selectButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // 로딩 & 빈 화면
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
