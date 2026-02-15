/**
 * 장바구니 화면
 * - 선택한 제품들을 확인하고 수정
 * - 여러 제품을 한번에 예약
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCartStore, type CartItem } from '../stores/cartStore';
import QuantitySelector from '../components/QuantitySelector';
import TimePickerModal from '../components/TimePickerModal';
import { createReservationSecure } from '../api/reservationApi';

interface CartScreenProps {
  storeId: string;
  storeName?: string;
  onBack: () => void;
  onComplete?: () => void;
}

export default function CartScreen({
  storeId,
  storeName,
  onBack,
  onComplete,
}: CartScreenProps) {
  const { items, updateQuantity, removeItem, getTotalCount, getTotalAmount, clearCart } =
    useCartStore();
  
  // 모든 장바구니 아이템 표시 (업체 관계없이)
  const cartItems = items;
  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.discountedPrice * item.quantity,
    0
  );

  const [pickupTime, setPickupTime] = useState('18:00 ~ 18:30');
  const [loading, setLoading] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  // 장바구니 아이템에서 storeId 가져오기 (첫 번째 아이템 기준)
  const firstItemStoreId = cartItems.length > 0 ? cartItems[0].storeId : storeId;
  
  // 업체별로 그룹핑
  const itemsByStore = cartItems.reduce((acc, item) => {
    if (!acc[item.storeId]) {
      acc[item.storeId] = [];
    }
    acc[item.storeId].push(item);
    return acc;
  }, {} as Record<string, CartItem[]>);

  // 아이템 삭제 확인
  const handleRemoveItem = (productId: string, productName: string) => {
    Alert.alert('장바구니에서 삭제', `${productName}을(를) 장바구니에서 삭제하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => removeItem(productId),
      },
    ]);
  };

  // 여러 제품 한번에 예약
  const handleReserveAll = async () => {
    if (cartItems.length === 0) {
      Alert.alert('오류', '장바구니가 비어있습니다.');
      return;
    }

    // 픽업 시간에서 시작 시간만 추출 (예약 API 호출용)
    const pickupStartTime = pickupTime.includes(' ~ ') 
      ? pickupTime.split(' ~ ')[0] 
      : pickupTime;
      
    if (!pickupStartTime || !pickupStartTime.match(/^\d{2}:\d{2}$/)) {
      Alert.alert('오류', '픽업 시간을 올바르게 선택해주세요.');
      return;
    }

    try {
      setLoading(true);

      const results: Array<{
        productName: string;
        reservationNumber: string;
        totalAmount: number;
      }> = [];
      const errors: Array<{
        productName: string;
        error: string;
      }> = [];

      // 각 상품별로 예약 생성
      for (const item of cartItems) {
        try {
          const result = await createReservationSecure(
            item.productId,
            item.quantity,
            pickupStartTime
          );
          results.push({
            productName: item.productName,
            reservationNumber: result.reservationNumber,
            totalAmount: result.totalAmount,
          });
        } catch (error: any) {
          errors.push({
            productName: item.productName,
            error: error.message || '예약 실패',
          });
        }
      }

      // 결과 표시
      if (results.length > 0) {
        const successMessage = results
          .map(
            (r) =>
              `• ${r.productName}\n  예약번호: ${r.reservationNumber}\n  금액: ${r.totalAmount.toLocaleString()}원`
          )
          .join('\n\n');

        let message = `✅ 예약 완료 (${results.length}개)\n\n${successMessage}`;

        if (errors.length > 0) {
          message += `\n\n❌ 예약 실패 (${errors.length}개)\n\n`;
          message += errors.map((e) => `• ${e.productName}: ${e.error}`).join('\n');
        }

        Alert.alert('예약 결과', message, [
          {
            text: '확인',
            onPress: () => {
              // 성공한 아이템들은 장바구니에서 제거
              results.forEach((result) => {
                const item = cartItems.find(
                  (i) => i.productName === result.productName
                );
                if (item) {
                  removeItem(item.productId);
                }
              });

              // 장바구니가 비었거나 모든 예약이 완료되면 화면 닫기
              if (errors.length === 0) {
                clearCart();
                if (onComplete) {
                  onComplete();
                } else {
                  onBack();
                }
              }
            },
          },
        ]);
      } else {
        // 모든 예약 실패
        const errorMessage = errors
          .map((e) => `• ${e.productName}: ${e.error}`)
          .join('\n');
        Alert.alert('예약 실패', `모든 예약이 실패했습니다:\n\n${errorMessage}`);
      }
    } catch (error) {
      console.error('예약 오류:', error);
      Alert.alert('오류', '예약 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyText}>장바구니가 비어있습니다</Text>
          <Text style={styles.emptySubText}>상품을 담아주세요!</Text>
          <TouchableOpacity style={styles.continueButton} onPress={onBack}>
            <Text style={styles.continueButtonText}>쇼핑 계속하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>← 뒤로</Text>
          </TouchableOpacity>
          <Text style={styles.title}>장바구니</Text>
          <View style={styles.cartIcon}>
            <Text style={styles.cartIconText}>🛒</Text>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalCount}</Text>
            </View>
          </View>
        </View>

        {/* 장바구니 아이템 목록 (업체별로 그룹핑) */}
        <View style={styles.itemsContainer}>
          {Object.entries(itemsByStore).map(([groupStoreId, storeItems]) => (
            <View key={groupStoreId} style={styles.storeGroup}>
              {/* 업체 정보 */}
              <View style={styles.storeInfo}>
                <Text style={styles.storeName}>
                  🏪 {storeItems[0]?.storeName || '알 수 없는 업체'}
                </Text>
                <Text style={styles.storeItemCount}>
                  {storeItems.length}개 상품
                </Text>
              </View>
              
              {/* 해당 업체의 아이템들 */}
              {storeItems.map((item) => (
                <View key={item.productId} style={styles.cartItemCard}>
                  {/* 상품 이미지 */}
                  <View style={styles.cartItemImageContainer}>
                    {item.imageUrl ? (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.cartItemImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.cartItemImagePlaceholder}>
                        <Text style={styles.cartItemImagePlaceholderText}>🍞</Text>
                      </View>
                    )}
                  </View>

                  {/* 상품 정보 */}
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName}>{item.productName}</Text>

                    <View style={styles.cartItemPriceRow}>
                      <Text style={styles.cartItemOriginalPrice}>
                        {item.originalPrice.toLocaleString()}원
                      </Text>
                      <Text style={styles.cartItemDiscountedPrice}>
                        {item.discountedPrice.toLocaleString()}원
                      </Text>
                    </View>

                    {/* 수량 선택 */}
                    <View style={styles.cartItemQuantity}>
                      <Text style={styles.quantityLabel}>수량</Text>
                      <QuantitySelector
                        quantity={item.quantity}
                        min={1}
                        max={item.stockQuantity}
                        onQuantityChange={(qty) => updateQuantity(item.productId, qty)}
                      />
                    </View>

                    {/* 아이템 총액 */}
                    <Text style={styles.cartItemTotal}>
                      {(item.discountedPrice * item.quantity).toLocaleString()}원
                    </Text>
                  </View>

                  {/* 삭제 버튼 */}
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveItem(item.productId, item.productName)}
                  >
                    <Text style={styles.removeButtonText}>삭제</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* 합계 섹션 */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>총 상품 수</Text>
            <Text style={styles.summaryValue}>{totalCount}개</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>총 결제 금액</Text>
            <Text style={styles.totalAmount}>{totalAmount.toLocaleString()}원</Text>
          </View>
        </View>

        {/* 픽업 시간 선택 */}
        <View style={styles.pickupTimeSection}>
          <Text style={styles.pickupTimeLabel}>픽업 시간</Text>
          <TouchableOpacity
            style={styles.timeInputContainer}
            onPress={() => setTimePickerVisible(true)}
          >
            <Text style={styles.timeInputText}>{pickupTime}</Text>
            <Text style={styles.timeInputIcon}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* 시간 선택 모달 */}
        <TimePickerModal
          visible={timePickerVisible}
          selectedTime={pickupTime}
          storeId={firstItemStoreId}
          onSelect={setPickupTime}
          onClose={() => setTimePickerVisible(false)}
        />

        {/* 예약하기 버튼 */}
        <TouchableOpacity
          style={[styles.reserveButton, loading && styles.reserveButtonDisabled]}
          onPress={handleReserveAll}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.reserveButtonText}>
              한번에 예약하기 ({totalAmount.toLocaleString()}원)
            </Text>
          )}
        </TouchableOpacity>

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
  backButton: {
    padding: 10,
    marginBottom: 10,
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
    textAlign: 'center',
  },
  cartIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
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
  storeGroup: {
    marginBottom: 20,
  },
  storeInfo: {
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  storeItemCount: {
    fontSize: 14,
    color: '#666666',
  },
  itemsContainer: {
    padding: 20,
  },
  cartItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'row',
  },
  cartItemImageContainer: {
    marginRight: 12,
  },
  cartItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  cartItemImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartItemImagePlaceholderText: {
    fontSize: 32,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  cartItemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cartItemOriginalPrice: {
    fontSize: 14,
    color: '#999999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  cartItemDiscountedPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  cartItemQuantity: {
    marginBottom: 8,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },
  cartItemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 8,
  },
  removeButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  removeButtonText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  pickupTimeSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
  },
  pickupTimeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  timeInputContainer: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeInputText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  timeInputIcon: {
    fontSize: 14,
    color: '#666666',
  },
  reserveButton: {
    backgroundColor: '#00C853',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
  },
  reserveButtonDisabled: {
    opacity: 0.6,
  },
  reserveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 30,
  },
  continueButton: {
    backgroundColor: '#00D563',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 25,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
