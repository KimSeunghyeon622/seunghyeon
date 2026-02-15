import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface StoreProductManagementProps {
  onBack: () => void;
}

interface Product {
  id: string;
  name: string;
  category: string;
  original_price: number;
  discounted_price: number;
  stock_quantity: number;
  image_url: string | null;
  expiry_date: string | null;
  is_active: boolean;
  send_notification: boolean;
}

interface PastProduct {
  id: string;
  name: string;
  original_price: number;
  discounted_price: number;
  image_url: string | null;
  expiry_date: string | null;
}

type ViewMode = 'list' | 'create' | 'edit';

export default function StoreProductManagement({ onBack }: StoreProductManagementProps) {
  const RANDOM_PRODUCT_IMAGE = require('../../assets/images/random-box.png');
  const [loading, setLoading] = useState(false);
  const [storeId, setStoreId] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // 상품 리스트
  const [products, setProducts] = useState<Product[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 상품 정보 (등록/수정 폼)
  const [productImage, setProductImage] = useState<any>(null);
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('빵');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState(5);
  const [expiryDate, setExpiryDate] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryDay, setExpiryDay] = useState('');
  const [sendNotification, setSendNotification] = useState(true);

  // 과거 상품 관련
  const [showPastProducts, setShowPastProducts] = useState(false);
  const [pastProducts, setPastProducts] = useState<PastProduct[]>([]);
  const [filteredPastProducts, setFilteredPastProducts] = useState<PastProduct[]>([]);
  const [loadingPastProducts, setLoadingPastProducts] = useState(false);
  const [pastProductSearchQuery, setPastProductSearchQuery] = useState('');

  // 오늘 날짜를 YYYY-MM-DD 형식으로 반환
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 할인율 계산
  const discountRate = useCallback(() => {
    const original = parseFloat(originalPrice);
    const discounted = parseFloat(discountedPrice);
    if (original > 0 && discounted > 0 && discounted < original) {
      return Math.round(((original - discounted) / original) * 100);
    }
    return 0;
  }, [originalPrice, discountedPrice]);

  // 소비기한 입력 (연/월/일) 동기화
  const applyExpiryParts = (dateString: string | null) => {
    if (!dateString) {
      setExpiryYear('');
      setExpiryMonth('');
      setExpiryDay('');
      return;
    }
    const parts = dateString.split('-');
    setExpiryYear(parts[0] || '');
    setExpiryMonth(parts[1] || '');
    setExpiryDay(parts[2] || '');
  };

  // 소비기한 날짜 유효성 검증
  const isValidExpiryDate = (yearStr: string, monthStr: string, dayStr: string): boolean => {
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return false;
    if (year < 2000 || year > 2099) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    const dateObj = new Date(year, month - 1, day);
    if (
      dateObj.getFullYear() !== year ||
      dateObj.getMonth() !== month - 1 ||
      dateObj.getDate() !== day
    ) {
      return false;
    }

    return true;
  };

  const buildExpiryDate = () => {
    if (!expiryYear && !expiryMonth && !expiryDay) return null;
    const year = expiryYear.padStart(4, '0');
    const month = expiryMonth.padStart(2, '0');
    const day = expiryDay.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 과거 상품 검색 필터링
  useEffect(() => {
    if (pastProductSearchQuery.trim() === '') {
      setFilteredPastProducts(pastProducts);
    } else {
      const query = pastProductSearchQuery.toLowerCase().trim();
      const filtered = pastProducts.filter((product) =>
        product.name.toLowerCase().includes(query)
      );
      setFilteredPastProducts(filtered);
    }
  }, [pastProducts, pastProductSearchQuery]);

  // 업체 ID 가져오기 및 상품 리스트 로드
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

        // 상품 리스트 로드
        await fetchProducts(storeData.id);
      } catch (error) {
        console.error('업체 정보 로딩 오류:', error);
        alert('업체 정보를 불러오는데 실패했습니다.');
      }
    };

    fetchStoreId();
  }, []);

  // 상품 리스트 조회
  const fetchProducts = async (id?: string) => {
    try {
      setListLoading(true);
      const targetStoreId = id || storeId;

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', targetStoreId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('상품 리스트 로딩 오류:', error);
    } finally {
      setListLoading(false);
      setRefreshing(false);
    }
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  // 폼 초기화
  const resetForm = () => {
    setProductImage(null);
    setProductImageUrl(null);
    setProductName('');
    setProductCategory('빵');
    setOriginalPrice('');
    setDiscountedPrice('');
    setStockQuantity(5);
    setExpiryDate('');
    setExpiryYear('');
    setExpiryMonth('');
    setExpiryDay('');
    setSendNotification(true);
    setEditingProduct(null);
  };

  // 신규 등록 모드로 전환
  const goToCreateMode = () => {
    resetForm();
    setExpiryDate(getTodayDate());
    applyExpiryParts(getTodayDate());
    setViewMode('create');
  };

  // 수정 모드로 전환
  const goToEditMode = (product: Product) => {
    setEditingProduct(product);
    setProductName(product.name);
    setProductCategory(product.category);
    setOriginalPrice(product.original_price.toString());
    setDiscountedPrice(product.discounted_price.toString());
    setStockQuantity(product.stock_quantity);
    setProductImageUrl(product.image_url);
    setExpiryDate(product.expiry_date || '');
    applyExpiryParts(product.expiry_date || null);
    setSendNotification(product.send_notification);
    setProductImage(null);
    setViewMode('edit');
  };

  // 리스트 모드로 전환
  const goToListMode = () => {
    resetForm();
    setViewMode('list');
    fetchProducts();
  };

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
      setProductImageUrl(null);
    }
  };

  // 재고 증감
  const increaseStock = () => setStockQuantity(stockQuantity + 1);
  const decreaseStock = () => {
    if (stockQuantity > 0) setStockQuantity(stockQuantity - 1);
  };

  // 상품 등록/수정
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
      // 할인율 최소 40% 검증
      const currentDiscount = discountRate();
      if (currentDiscount < 40) {
        Alert.alert(
          '할인율 부족',
          `현재 할인율은 ${currentDiscount}%입니다.\n최소 40% 이상 할인된 가격으로 등록해주세요.`,
          [{ text: '확인' }]
        );
        return;
      }
      if (stockQuantity <= 0) {
        alert('재고 수량을 1개 이상 입력해주세요.');
        return;
      }

      // 소비기한 유효성 검증
      if (expiryYear || expiryMonth || expiryDay) {
        if (!expiryYear || !expiryMonth || !expiryDay) {
          Alert.alert(
            '소비기한 오류',
            '소비기한의 연도, 월, 일을 모두 입력해주세요.\n예: 2026년 3월 15일',
            [{ text: '확인' }]
          );
          return;
        }
        if (!isValidExpiryDate(expiryYear, expiryMonth, expiryDay)) {
          Alert.alert(
            '소비기한 오류',
            '올바른 날짜를 입력해주세요.\n예: 2026년 3월 15일',
            [{ text: '확인' }]
          );
          return;
        }
      }

      setLoading(true);
      const normalizedExpiryDate = buildExpiryDate();

      // 1. 상품 이미지 업로드 (선택 사항)
      let imageUrl = productImageUrl;
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

      if (viewMode === 'edit' && editingProduct) {
        // 상품 수정
        const { error } = await supabase
          .from('products')
          .update({
            name: productName,
            category: productCategory,
            original_price: parseFloat(originalPrice),
            discounted_price: parseFloat(discountedPrice),
            stock_quantity: stockQuantity,
            image_url: imageUrl,
            expiry_date: normalizedExpiryDate,
            send_notification: sendNotification,
          })
          .eq('id', editingProduct.id);

        if (error) throw error;
        alert('상품이 수정되었습니다.');
      } else {
        // 상품 등록
        const { error } = await supabase.from('products').insert({
          store_id: storeId,
          name: productName,
          category: productCategory,
          original_price: parseFloat(originalPrice),
          discounted_price: parseFloat(discountedPrice),
          stock_quantity: stockQuantity,
          image_url: imageUrl,
          expiry_date: normalizedExpiryDate,
          send_notification: sendNotification,
          is_active: true,
        });

        if (error) throw error;
        alert('상품이 등록되었습니다.');
      }

      goToListMode();
    } catch (error: any) {
      console.error('상품 저장 오류:', error);
      let errorMessage = '상품 저장 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
      if (error?.code === '22008') {
        errorMessage = '소비기한 날짜가 올바르지 않습니다. 날짜를 확인해주세요.';
      } else if (error?.code === '23505') {
        errorMessage = '이미 동일한 상품이 등록되어 있습니다.';
      } else if (error?.code === '23503') {
        errorMessage = '업체 정보를 찾을 수 없습니다. 다시 로그인해주세요.';
      }
      Alert.alert('상품 저장 실패', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 상품 삭제 (soft delete: 예약 내역 참조로 인해 hard delete 불가)
  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      '상품 삭제',
      `'${product.name}'을(를) 삭제하시겠습니까?\n(예약 내역이 있는 경우 비활성화 처리됩니다)`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              // soft delete: is_active만 false로 설정 (상품명은 유지)
              const { error } = await supabase
                .from('products')
                .update({
                  is_active: false,
                })
                .eq('id', product.id);

              if (error) throw error;
              Alert.alert('완료', '상품이 삭제되었습니다.');
              fetchProducts();
            } catch (error) {
              console.error('상품 삭제 오류:', error);
              Alert.alert('오류', '상품 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  // 상품 상태 토글 (판매중/판매중지)
  const toggleProductStatus = async (product: Product) => {
    try {
      const newStatus = !product.is_active;
      const { error } = await supabase
        .from('products')
        .update({ is_active: newStatus })
        .eq('id', product.id);

      if (error) throw error;

      // 로컬 상태 업데이트
      setProducts(prev =>
        prev.map(p => p.id === product.id ? { ...p, is_active: newStatus } : p)
      );
    } catch (error) {
      console.error('상품 상태 변경 오류:', error);
      alert('상품 상태 변경에 실패했습니다.');
    }
  };

  // 과거 상품 불러오기
  const loadPastProducts = async () => {
    try {
      setLoadingPastProducts(true);
      setShowPastProducts(true);

      const { data, error } = await supabase
        .from('products')
        .select('id, name, original_price, discounted_price, image_url, expiry_date, created_at')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const uniqueProducts: PastProduct[] = [];
      const seenNames = new Set<string>();

      (data || []).forEach((product) => {
        if (!seenNames.has(product.name)) {
          seenNames.add(product.name);
          uniqueProducts.push({
            id: product.id,
            name: product.name,
            original_price: product.original_price,
            discounted_price: product.discounted_price,
            image_url: product.image_url,
            expiry_date: product.expiry_date,
          });
        }
      });

      setPastProducts(uniqueProducts.slice(0, 50));
    } catch (error) {
      console.error('과거 상품 로딩 오류:', error);
      alert('과거 상품을 불러오는데 실패했습니다.');
      setShowPastProducts(false);
    } finally {
      setLoadingPastProducts(false);
    }
  };

  const applyRandomProductTemplate = () => {
    setProductName('두근두근 랜덤 상품 박스');
    setProductImage(null);
    const resolved = Image.resolveAssetSource(RANDOM_PRODUCT_IMAGE);
    setProductImageUrl(resolved?.uri || null);
  };

  // 과거 상품 선택
  const selectPastProduct = (product: PastProduct) => {
    setProductName(product.name);
    setOriginalPrice(product.original_price.toString());
    setDiscountedPrice(product.discounted_price.toString());
    setProductImageUrl(product.image_url);
    setProductImage(null);
    setExpiryDate(product.expiry_date || '');
    applyExpiryParts(product.expiry_date || null);
    setShowPastProducts(false);
    alert('상품 정보를 불러왔습니다. 재고만 입력하고 등록해주세요!');
  };

  // 뒤로가기 처리
  const handleBack = () => {
    if (viewMode === 'list') {
      onBack();
    } else {
      goToListMode();
    }
  };

  // 상품 카드 렌더링
  const renderProductItem = ({ item }: { item: Product }) => {
    const discountPercent = Math.round(((item.original_price - item.discounted_price) / item.original_price) * 100);

    return (
      <View style={styles.productCard}>
        <Image
          source={{ uri: item.image_url || 'https://via.placeholder.com/80' }}
          style={styles.productCardImage}
          resizeMode="cover"
        />
        <View style={styles.productCardInfo}>
          <Text style={styles.productCardName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.productCardPriceRow}>
            <Text style={styles.productCardOriginalPrice}>
              {item.original_price.toLocaleString()}원
            </Text>
            <Text style={styles.productCardDiscountedPrice}>
              {item.discounted_price.toLocaleString()}원
            </Text>
            <Text style={styles.productCardDiscount}>({discountPercent}% 할인)</Text>
          </View>
          <View style={styles.productCardStatusRow}>
            <Text style={styles.productCardStock}>재고: {item.stock_quantity}개</Text>
            <View style={[
              styles.productCardStatusBadge,
              item.is_active ? styles.statusActive : styles.statusInactive
            ]}>
              <Text style={[
                styles.productCardStatusText,
                item.is_active ? styles.statusTextActive : styles.statusTextInactive
              ]}>
                {item.is_active ? '판매중' : '판매중지'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.productCardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => goToEditMode(item)}
          >
            <Text style={styles.actionButtonText}>수정</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonDanger]}
            onPress={() => handleDeleteProduct(item)}
          >
            <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>삭제</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, item.is_active ? styles.actionButtonWarning : styles.actionButtonSuccess]}
            onPress={() => toggleProductStatus(item)}
          >
            <Text style={[styles.actionButtonText, item.is_active ? styles.actionButtonTextWarning : styles.actionButtonTextSuccess]}>
              {item.is_active ? '중지' : '재판매'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // 과거 상품 아이템 렌더링
  const renderPastProductItem = ({ item }: { item: PastProduct }) => (
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

  // 상품 리스트 화면
  const renderListView = () => (
    <View style={styles.listContainer}>
      {/* 신규 상품등록 버튼 */}
      <TouchableOpacity style={styles.createButton} onPress={goToCreateMode}>
        <Text style={styles.createButtonIcon}>+</Text>
        <Text style={styles.createButtonText}>신규 상품등록</Text>
      </TouchableOpacity>

      {listLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#00D563" />
          <Text style={styles.loadingText}>상품을 불러오는 중...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>등록된 상품이 없습니다</Text>
          <Text style={styles.emptySubText}>상품을 등록해주세요</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={goToCreateMode}>
            <Text style={styles.emptyButtonText}>첫 상품 등록하기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.productList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#00D563']}
              tintColor="#00D563"
            />
          }
        />
      )}
    </View>
  );

  // 상품 등록/수정 폼
  const renderFormView = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      {/* 과거 등록 상품 불러오기 (등록 모드에서만) */}
      {viewMode === 'create' && (
        <View style={styles.topActionRow}>
          <TouchableOpacity style={[styles.loadPastButton, styles.topActionButton]} onPress={loadPastProducts}>
            <Text style={styles.loadPastIcon}>🔄</Text>
            <Text style={styles.loadPastText}>과거 등록 상품{'\n'}불러오기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.randomButton, styles.topActionButton]} onPress={applyRandomProductTemplate}>
            <Text style={styles.randomIcon}>🎁</Text>
            <Text style={styles.randomText}>랜덤 상품으로{'\n'}등록</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 기본 정보 */}
      <Text style={styles.sectionTitle}>기본 정보</Text>

      {/* 상품 사진 추가 */}
      <Text style={styles.label}>상품 사진</Text>
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

      <Text style={styles.label}>상품명 *</Text>
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
          <Text style={styles.stockButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.stockValue}>{stockQuantity}</Text>
        <TouchableOpacity style={styles.stockButton} onPress={increaseStock}>
          <Text style={styles.stockButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* 소비기한 */}
      <View style={styles.dateRow}>
        <View style={styles.dateColumn}>
          <Text style={styles.label}>소비기한</Text>
          <View style={styles.dateSplitRow}>
            <TextInput
              style={styles.dateSplitInputYear}
              value={expiryYear}
              onChangeText={(value) => setExpiryYear(value.replace(/[^0-9]/g, '').slice(0, 4))}
              placeholder="2026"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={4}
            />
            <Text style={styles.dateSplitLabel}>년</Text>
            <TextInput
              style={styles.dateSplitInput}
              value={expiryMonth}
              onChangeText={(value) => setExpiryMonth(value.replace(/[^0-9]/g, '').slice(0, 2))}
              placeholder="02"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={2}
            />
            <Text style={styles.dateSplitLabel}>월</Text>
            <TextInput
              style={styles.dateSplitInput}
              value={expiryDay}
              onChangeText={(value) => setExpiryDay(value.replace(/[^0-9]/g, '').slice(0, 2))}
              placeholder="03"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={2}
            />
            <Text style={styles.dateSplitLabel}>일</Text>
          </View>
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

      {/* 상품 등록/수정 완료 버튼 */}
      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Text style={styles.submitButtonText}>
            {viewMode === 'edit' ? '상품 수정 완료' : '상품 등록 완료'}
          </Text>
        )}
      </TouchableOpacity>

      {/* 하단 여백 */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {viewMode === 'list' ? '상품 관리' : viewMode === 'edit' ? '상품 수정' : '상품 등록'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 메인 콘텐츠 */}
      {viewMode === 'list' ? renderListView() : renderFormView()}

      {/* 과거 상품 목록 Modal */}
      <Modal
        visible={showPastProducts}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPastProducts(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowPastProducts(false)}>
                <Text style={styles.modalBackButton}>←</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>과거 등록 상품</Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="상품 이름으로 검색"
                placeholderTextColor="#999"
                value={pastProductSearchQuery}
                onChangeText={setPastProductSearchQuery}
                autoCapitalize="none"
              />
              {pastProductSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setPastProductSearchQuery('')}>
                  <Text style={{ fontSize: 16, color: '#999', marginLeft: 8 }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {loadingPastProducts ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#00D563" />
                <Text style={styles.loadingText}>상품을 불러오는 중...</Text>
              </View>
            ) : filteredPastProducts.length === 0 ? (
              <View style={styles.centerContainer}>
                <Text style={styles.emptyIcon}>📦</Text>
                <Text style={styles.emptyText}>
                  {pastProductSearchQuery.trim()
                    ? '검색 결과가 없습니다'
                    : '과거 등록 상품이 없습니다'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredPastProducts}
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

  // 리스트 컨테이너
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // 신규 상품등록 버튼
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00D563',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  createButtonIcon: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: 'bold',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },

  // 상품 리스트
  productList: {
    paddingBottom: 20,
  },

  // 상품 카드
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  productCardImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  productCardInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  productCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productCardPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  productCardOriginalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  productCardDiscountedPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00D563',
  },
  productCardDiscount: {
    fontSize: 12,
    color: '#FF6B00',
  },
  productCardStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productCardStock: {
    fontSize: 13,
    color: '#666',
  },
  productCardStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusActive: {
    backgroundColor: '#E8F5E9',
  },
  statusInactive: {
    backgroundColor: '#FFE5E5',
  },
  productCardStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#00A84D',
  },
  statusTextInactive: {
    color: '#FF6B6B',
  },
  productCardActions: {
    justifyContent: 'center',
    gap: 6,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  actionButtonDanger: {
    backgroundColor: '#FFF0F0',
  },
  actionButtonWarning: {
    backgroundColor: '#FFF4E5',
  },
  actionButtonSuccess: {
    backgroundColor: '#E8F5E9',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  actionButtonTextDanger: {
    color: '#FF6B6B',
  },
  actionButtonTextWarning: {
    color: '#FF9800',
  },
  actionButtonTextSuccess: {
    color: '#00A84D',
  },

  // 중앙 컨테이너 (로딩, 빈 상태)
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#999',
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
  },
  emptyButton: {
    marginTop: 12,
    backgroundColor: '#00D563',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // 스크롤뷰 (폼)
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // 과거 상품 불러오기
  topActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  topActionButton: {
    flex: 1,
    paddingVertical: 12,
  },
  loadPastButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
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
    textAlign: 'center',
    lineHeight: 18,
  },
  randomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FF6B00',
  },
  randomIcon: {
    fontSize: 18,
  },
  randomText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E65100',
    textAlign: 'center',
    lineHeight: 18,
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
  dateSplitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateSplitInputYear: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: 90,
    textAlign: 'center',
  },
  dateSplitInput: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: 60,
    textAlign: 'center',
  },
  dateSplitLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
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

  // 카테고리 선택
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryButtonActive: {
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
});
