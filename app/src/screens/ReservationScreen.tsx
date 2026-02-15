import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';
import TimePickerModal from '../components/TimePickerModal';
import MapPlaceholder from '../components/MapPlaceholder';

interface ReservationScreenProps {
  product: {
    id: string;
    name: string;
    discounted_price: number;
    stock_quantity: number;
    store_id: string;
  };
  store?: {
    name: string;
    address?: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  onBack: () => void;
  onComplete?: () => void;
}

interface StoreInfo {
  name: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export default function ReservationScreen({ product, store, onBack, onComplete }: ReservationScreenProps) {
  // product에 quantity가 포함되어 있으면 사용, 없으면 1
  const initialQuantity = (product as any).quantity || 1;
  const [quantity, setQuantity] = useState(String(initialQuantity));
  const [pickupTime, setPickupTime] = useState('18:00 ~ 18:30');
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({
    name: store?.name || '',
    address: store?.address,
    latitude: store?.latitude,
    longitude: store?.longitude,
  });
  const [loading, setLoading] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  // store 정보가 없으면 가져오기
  React.useEffect(() => {
    if ((!storeInfo.name || !storeInfo.address) && product?.store_id) {
      const fetchStoreInfo = async () => {
        try {
          const { data, error } = await supabase
            .from('stores')
            .select('name, address, latitude, longitude')
            .eq('id', product.store_id)
            .single();
          
          if (!error && data) {
            setStoreInfo({
              name: data.name || '',
              address: data.address || '',
              latitude: data.latitude ?? null,
              longitude: data.longitude ?? null,
            });
          }
        } catch (error) {
          console.error('업체 정보 로딩 오류:', error);
        }
      };
      fetchStoreInfo();
    }
  }, [product?.store_id, storeInfo.name, storeInfo.address]);

  // 픽업 시간 슬롯에서 시작 시간만 추출 (예: "17:00 ~ 17:30" → "17:00")
  const extractStartTime = (timeSlot: string): string => {
    if (timeSlot.includes('~')) {
      return timeSlot.split('~')[0].trim();
    }
    return timeSlot;
  };

  const handleReserve = async () => {
    if (!product) {
      Alert.alert('오류', '상품 정보를 불러올 수 없습니다.');
      return;
    }

    const qty = parseInt(quantity);
    if (!qty || qty < 1) {
      Alert.alert('오류', '수량을 확인해주세요');
      return;
    }

    if (qty > product.stock_quantity) {
      Alert.alert('오류', `재고가 부족합니다. (재고: ${product.stock_quantity}개)`);
      return;
    }

    try {
      setLoading(true);

      // 서버 측 보안 함수 호출 (가격 검증 + 재고 동시성 처리)
      // 픽업 시간 슬롯에서 시작 시간만 추출하여 전달 (예: "17:00 ~ 17:30" → "17:00")
      const { data, error } = await supabase.rpc('create_reservation_secure', {
        p_product_id: product.id,
        p_quantity: qty,
        p_pickup_time: extractStartTime(pickupTime),
      });

      if (error) {
        Alert.alert('오류', '상품 정보를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      // RPC 함수 결과 확인
      const result = data?.[0];
      if (!result?.success) {
        Alert.alert('예약 실패', result?.error_message || '예약 처리에 실패했습니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      // 예약 성공 시 업주에게 알림 생성
      try {
        // 업체의 user_id 조회
        const { data: storeData } = await supabase
          .from('stores')
          .select('user_id')
          .eq('id', product.store_id)
          .single();

        if (storeData?.user_id) {
          await supabase.from('notifications').insert({
            user_id: storeData.user_id,
            type: 'new_reservation',
            title: '새로운 예약',
            message: `고객님이 '${product.name}'을 ${qty}개 예약했습니다.\n예약번호: ${result.reservation_number}`,
            related_reservation_id: result.reservation_id,
            related_store_id: product.store_id
          });
        }
      } catch (notifError) {
        // 알림 생성 실패해도 예약은 성공으로 처리
        console.error('업주 알림 생성 오류:', notifError);
      }

      Alert.alert(
        '예약 완료!',
        `예약번호: ${result.reservation_number}\n결제금액: ${result.total_amount?.toLocaleString()}원\n픽업시간: ${pickupTime}`,
        [{ text: '확인', onPress: () => {
          if (onComplete) {
            onComplete();
          } else {
            onBack();
          }
        }}]
      );
    } catch (error) {
      console.error('예약 오류:', error);
      Alert.alert('오류', '예약 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  if (!product) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>상품 정보를 불러올 수 없습니다.</Text>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalAmount = product.discounted_price * parseInt(quantity || '1');

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>← 뒤로</Text>
      </TouchableOpacity>

      <Text style={styles.title}>예약하기</Text>
      
      {storeInfo.name && (
        <View style={styles.section}>
          <Text style={styles.label}>업체</Text>
          <Text style={styles.value}>{storeInfo.name}</Text>
          {storeInfo.address && (
            <Text style={styles.addressText}>{storeInfo.address}</Text>
          )}
        </View>
      )}

      {(storeInfo.address || (storeInfo.latitude && storeInfo.longitude)) && (
        <View style={styles.section}>
          <MapPlaceholder
            markers={[
              {
                id: product.store_id,
                name: storeInfo.name || '매장',
                latitude: storeInfo.latitude ?? null,
                longitude: storeInfo.longitude ?? null,
              },
            ]}
            selectedId={product.store_id}
            title="픽업 위치"
            height={180}
            useNativeMap
          />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.label}>상품</Text>
        <Text style={styles.value}>{product.name}</Text>
        <Text style={styles.price}>{product.discounted_price.toLocaleString()}원</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>수량 (재고: {product.stock_quantity}개)</Text>
        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="number-pad"
          placeholder="1"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>픽업 시간</Text>
        <TouchableOpacity
          style={styles.timeInputContainer}
          onPress={() => setTimePickerVisible(true)}
        >
          <Text style={styles.timeInputText}>
            {pickupTime || '시간 선택'}
          </Text>
          <Text style={styles.timeInputIcon}>🕒</Text>
        </TouchableOpacity>
      </View>

      <TimePickerModal
        visible={timePickerVisible}
        selectedTime={pickupTime}
        storeId={product.store_id}
        onSelect={(time) => {
          setPickupTime(time);
          setTimePickerVisible(false);
        }}
        onClose={() => setTimePickerVisible(false)}
      />

      <View style={styles.totalSection}>
        <Text style={styles.totalLabel}>총 결제 금액</Text>
        <Text style={styles.totalAmount}>{totalAmount.toLocaleString()}원</Text>
      </View>

      <View style={styles.noticeBox}>
        <Text style={styles.noticeTitle}>픽업 시간 안내</Text>
        <Text style={styles.noticeText}>
          픽업 시간 준수는 필수이며, 미준수 시 서비스 이용에 패널티가 있을 수 있습니다.
          {'\n'}부득이하게 미준수가 예상되는 경우, 사장님께 사전 연락해주세요.
          {'\n'}원활한 예약/픽업을 위해 고객님의 닉네임과 휴대전화번호가 매장에 전달됩니다.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleReserve}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>예약하기</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  backButton: { marginBottom: 15 },
  backText: { fontSize: 16, color: '#007AFF' },
  errorText: { fontSize: 16, color: '#666', marginBottom: 20, textAlign: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  section: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  value: { fontSize: 16, color: '#333' },
  addressText: { fontSize: 13, color: '#666', marginTop: 4 },
  price: { fontSize: 14, color: '#666', marginTop: 3 },
  input: { backgroundColor: '#f5f5f5', padding: 15, borderRadius: 10, fontSize: 16, marginTop: 5 },
  timeInputContainer: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    marginTop: 5,
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
  totalSection: { backgroundColor: '#f9f9f9', padding: 20, borderRadius: 10, marginVertical: 20 },
  totalLabel: { fontSize: 16, color: '#666', marginBottom: 5 },
  totalAmount: { fontSize: 32, fontWeight: 'bold', color: '#007AFF' },
  noticeBox: {
    backgroundColor: '#F7F9FB',
    borderColor: '#E3E8EF',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  noticeTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  noticeText: { fontSize: 12, color: '#666', lineHeight: 18 },
  button: { backgroundColor: '#00C853', padding: 18, borderRadius: 10, alignItems: 'center', marginBottom: 30 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
