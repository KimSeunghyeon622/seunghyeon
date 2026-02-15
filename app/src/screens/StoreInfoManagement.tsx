import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface StoreInfoManagementProps {
  onBack: () => void;
  onManageProducts: () => void;
}

interface DaySchedule {
  day: string;
  dayShort: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

const DAYS: { day: string; dayShort: string }[] = [
  { day: '월', dayShort: 'mon' },
  { day: '화', dayShort: 'tue' },
  { day: '수', dayShort: 'wed' },
  { day: '목', dayShort: 'thu' },
  { day: '금', dayShort: 'fri' },
  { day: '토', dayShort: 'sat' },
  { day: '일', dayShort: 'sun' },
];

const CATEGORIES = ['반찬', '제과', '식자재', '밀키트'];

export default function StoreInfoManagement({ onBack, onManageProducts }: StoreInfoManagementProps) {
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState('');

  const [coverImage, setCoverImage] = useState<any>(null);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [category, setCategory] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [storeAddress, setStoreAddress] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [productUploadTime, setProductUploadTime] = useState('');
  const [openingHoursText, setOpeningHoursText] = useState('');
  const [refundPolicy, setRefundPolicy] = useState('');
  const [noShowPolicy, setNoShowPolicy] = useState('');

  const [schedule, setSchedule] = useState<DaySchedule[]>(
    DAYS.map(({ day, dayShort }) => ({
      day,
      dayShort,
      startTime: '09:00',
      endTime: '09:00',
      enabled: false,
    }))
  );

  const fetchStoreInfo = useCallback(async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('사용자 정보를 찾을 수 없습니다');

      const { data: storeData, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setStoreId(storeData.id);
      setStoreName(storeData.name || '');
      setStoreDescription(storeData.description || '');
      setCategory(storeData.category || '');
      setCoverImageUrl(storeData.cover_image_url || '');
      setStoreAddress(storeData.address || '');
      setStorePhone(storeData.phone || '');
      setProductUploadTime(
        storeData.product_upload_time || storeData.opening_hours?.product_upload_time || ''
      );
      setOpeningHoursText(storeData.opening_hours_text || '');
      setRefundPolicy(
        storeData.refund_policy || '픽업 1시간 전까지 취소 가능하며, 전액 환불됩니다.'
      );
      setNoShowPolicy(
        storeData.no_show_policy || '노쇼 시 다음 예약이 제한될 수 있습니다.'
      );

      if (storeData.opening_hours) {
        const loadedSchedule = DAYS.map(({ day, dayShort }) => {
          const dayData = storeData.opening_hours[dayShort];
          if (dayData) {
            return {
              day,
              dayShort,
              startTime: dayData.start || '09:00',
              endTime: dayData.end || '09:00',
              enabled: dayData.enabled || false,
            };
          }
          return {
            day,
            dayShort,
            startTime: '09:00',
            endTime: '09:00',
            enabled: false,
          };
        });
        setSchedule(loadedSchedule);
      }
    } catch (error) {
      console.error('업체 정보 로딩 오류:', error);
      alert('업체 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStoreInfo();
  }, [fetchStoreInfo]);

  const pickCoverImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('사진 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCoverImage(result.assets[0]);
    }
  };

  const toggleDay = (index: number) => {
    const newSchedule = [...schedule];
    newSchedule[index].enabled = !newSchedule[index].enabled;
    setSchedule(newSchedule);
  };

  const updateTime = (index: number, type: 'start' | 'end', timeType: 'hour' | 'minute', value: string) => {
    const newSchedule = [...schedule];
    const currentTime = type === 'start' ? newSchedule[index].startTime : newSchedule[index].endTime;
    const [currentHour, currentMinute] = currentTime.split(':');

    // 숫자만 허용, 2자리까지
    const sanitizedValue = value.replace(/[^0-9]/g, '').slice(0, 2);

    let newTime: string;
    if (timeType === 'hour') {
      // 입력 중에는 값 그대로 유지 (빈 문자열, 한 자리 숫자 허용)
      // 저장 시점에 형식 검증
      newTime = `${sanitizedValue}:${currentMinute}`;
    } else {
      // 입력 중에는 값 그대로 유지 (빈 문자열, 한 자리 숫자 허용)
      // 저장 시점에 형식 검증
      newTime = `${currentHour}:${sanitizedValue}`;
    }

    if (type === 'start') {
      newSchedule[index].startTime = newTime;
    } else {
      newSchedule[index].endTime = newTime;
    }
    setSchedule(newSchedule);
  };

  const handleSave = async () => {
    try {
      if (!storeName.trim()) {
        alert('가게명을 입력해주세요.');
        return;
      }
      if (!category) {
        alert('카테고리를 선택해주세요.');
        return;
      }

      setLoading(true);

      let finalCoverUrl = coverImageUrl;
      if (coverImage) {
        const fileExt = coverImage.uri.split('.').pop();
        const fileName = `${storeId}-cover-${Date.now()}.${fileExt}`;
        const filePath = `covers/${fileName}`;

        const base64 = await FileSystem.readAsStringAsync(coverImage.uri, {
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

        finalCoverUrl = urlData.publicUrl;
      }

      // 시간 문자열을 "HH:MM" 형식으로 정규화하는 헬퍼 함수
      // 입력 중 불완전한 형식("9:00", ":30", "9:" 등)을 올바른 형식으로 변환
      const normalizeTime = (time: string): string => {
        const [h, m] = time.split(':');
        const hour = Math.min(23, Math.max(0, parseInt(h || '0', 10)));
        const minute = Math.min(59, Math.max(0, parseInt(m || '0', 10)));
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      };

      const openingHours: any = {};
      schedule.forEach((item) => {
        openingHours[item.dayShort] = {
          start: normalizeTime(item.startTime),
          end: normalizeTime(item.endTime),
          enabled: item.enabled,
        };
      });
      const uploadLabel = productUploadTime ? `상품 업로드 시간: ${productUploadTime}` : '';
      const cleanedHoursText = (openingHoursText || '').replace(/\s*\|\s*상품 업로드 시간:.*$/g, '').trim();
      const combinedHoursText =
        cleanedHoursText && uploadLabel
          ? `${cleanedHoursText} | ${uploadLabel}`
          : cleanedHoursText || uploadLabel;

      const { error } = await supabase
        .from('stores')
        .update({
          name: storeName,
          description: storeDescription,
          category: category,
          cover_image_url: finalCoverUrl,
          opening_hours: openingHours,
          opening_hours_text: combinedHoursText,
          address: storeAddress,
          phone: storePhone,
          refund_policy: refundPolicy,
          no_show_policy: noShowPolicy,
        })
        .eq('id', storeId);

      if (error) throw error;

      alert('가게 정보가 저장되었습니다.');
      onBack();
    } catch (error) {
      console.error('저장 오류:', error);
      const message =
        (error as any)?.message ||
        (error as any)?.details ||
        (error as any)?.hint ||
        '저장에 실패했습니다.';
      alert(`저장에 실패했습니다.\n${message}`);
    } finally {
      setLoading(false);
    }
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
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>가게 정보 관리</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>대표 사진 추가</Text>
        <TouchableOpacity style={styles.imageUploadBox} onPress={pickCoverImage}>
          {coverImage || coverImageUrl ? (
            <Image
              source={{ uri: coverImage ? coverImage.uri : coverImageUrl }}
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

        <Text style={styles.sectionTitle}>가게 정보</Text>

        <Text style={styles.label}>가게명</Text>
        <TextInput
          style={styles.input}
          value={storeName}
          onChangeText={setStoreName}
          placeholder="예: 세이브잇 베이커리 성수점"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>카테고리</Text>
        <TouchableOpacity
          style={styles.categorySelector}
          onPress={() => setShowCategoryModal(true)}
        >
          <Text style={category ? styles.categorySelectorText : styles.categorySelectorPlaceholder}>
            {category || '카테고리 선택'}
          </Text>
          <Text style={styles.categorySelectorArrow}>▼</Text>
        </TouchableOpacity>

        <Text style={styles.label}>가게 소개글</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={storeDescription}
          onChangeText={setStoreDescription}
          placeholder="매일 아침 신선한 새로운 성수를 다룹 빵을 굽습니다. 남은 빵은 'Save It'을 통해 할인된 가격에 제공하고 있으니 맛은 관심부탁드립니다!"
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>가게 주소</Text>
        <TextInput
          style={styles.input}
          value={storeAddress}
          onChangeText={setStoreAddress}
          placeholder="예: 서울특별시 성동구 성수이로 123"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>전화번호</Text>
        <TextInput
          style={styles.input}
          value={storePhone}
          onChangeText={setStorePhone}
          placeholder="예: 02-1234-5678"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>상품 업로드 시간</Text>
        <TextInput
          style={styles.input}
          value={productUploadTime}
          onChangeText={setProductUploadTime}
          placeholder="예: 매일 17:00"
          placeholderTextColor="#999"
        />
        <Text style={styles.helperText}>고객에게 업체 상세페이지에 표시됩니다.</Text>

        <TouchableOpacity style={styles.productManageButton} onPress={onManageProducts}>
          <View style={styles.productManageLeft}>
            <Text style={styles.productManageIcon}>🛒</Text>
            <Text style={styles.productManageText}>판매상품 관리</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>운영 및 정책 관리</Text>

        <View style={styles.scheduleBox}>
          <View style={styles.scheduleHeader}>
            <Text style={styles.scheduleIcon}>🕐</Text>
            <Text style={styles.scheduleTitle}>오픈일 운영시간 설정</Text>
          </View>

          <View style={styles.scheduleTableHeader}>
            <Text style={[styles.scheduleTableCell, { flex: 1 }]}>요일</Text>
            <Text style={[styles.scheduleTableCell, { flex: 2 }]}>운영 시간 (시작 ~ 종료)</Text>
            <Text style={[styles.scheduleTableCell, { flex: 1 }]}>휴무</Text>
          </View>

          {schedule.map((item, index) => (
            <View key={item.dayShort} style={styles.scheduleRow}>
              <Text style={[styles.scheduleCell, { flex: 1 }]}>{item.day}</Text>
              <View style={[styles.scheduleCell, styles.scheduleTimeCell, { flex: 2 }]}>
                {/* 시작 시간 */}
                <View style={styles.timeInputGroup}>
                  <TextInput
                    style={styles.timeInputSmall}
                    value={item.startTime.split(':')[0]}
                    onChangeText={(value) => updateTime(index, 'start', 'hour', value)}
                    placeholder="09"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <Text style={styles.timeColon}>:</Text>
                  <TextInput
                    style={styles.timeInputSmall}
                    value={item.startTime.split(':')[1]}
                    onChangeText={(value) => updateTime(index, 'start', 'minute', value)}
                    placeholder="00"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
                <Text style={styles.timeSeparator}>~</Text>
                {/* 종료 시간 */}
                <View style={styles.timeInputGroup}>
                  <TextInput
                    style={styles.timeInputSmall}
                    value={item.endTime.split(':')[0]}
                    onChangeText={(value) => updateTime(index, 'end', 'hour', value)}
                    placeholder="18"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <Text style={styles.timeColon}>:</Text>
                  <TextInput
                    style={styles.timeInputSmall}
                    value={item.endTime.split(':')[1]}
                    onChangeText={(value) => updateTime(index, 'end', 'minute', value)}
                    placeholder="00"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
              </View>
              <TouchableOpacity
                style={[styles.scheduleCell, { flex: 1 }]}
                onPress={() => toggleDay(index)}
              >
                <View
                  style={[
                    styles.checkbox,
                    item.enabled && styles.checkboxChecked,
                  ]}
                >
                  {item.enabled && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>환불/교환/노쇼 정책</Text>

        <Text style={styles.policyLabel}>환불 정책</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={refundPolicy}
          onChangeText={setRefundPolicy}
          multiline
          numberOfLines={3}
          placeholderTextColor="#999"
        />

        <Text style={styles.policyLabel}>노쇼 정책</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={noShowPolicy}
          onChangeText={setNoShowPolicy}
          multiline
          numberOfLines={3}
          placeholderTextColor="#999"
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>✓ 변경사항 저장하기</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 카테고리 선택 모달 */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>카테고리 선택</Text>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={styles.modalItem}
                onPress={() => {
                  setCategory(cat);
                  setShowCategoryModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{cat}</Text>
                {category === cat && <Text style={styles.modalItemCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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

  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 15,
  },

  imageUploadBox: {
    width: '100%',
    height: 200,
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
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

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#888',
    marginTop: -10,
    marginBottom: 15,
  },
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
  textarea: {
    height: 100,
    textAlignVertical: 'top',
  },

  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 15,
  },
  categorySelectorText: {
    fontSize: 15,
    color: '#333',
  },
  categorySelectorPlaceholder: {
    fontSize: 15,
    color: '#999',
  },
  categorySelectorArrow: {
    fontSize: 12,
    color: '#999',
  },

  productManageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 20,
  },
  productManageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  productManageIcon: {
    fontSize: 24,
  },
  productManageText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  arrow: {
    fontSize: 24,
    color: '#999',
  },

  scheduleBox: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  scheduleIcon: {
    fontSize: 24,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  scheduleTableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  scheduleTableCell: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  scheduleCell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleTimeCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInputSmall: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 13,
    color: '#333',
    textAlign: 'center',
    width: 36,
  },
  timeColon: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    marginHorizontal: 2,
  },
  timeInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  timeSeparator: {
    fontSize: 14,
    color: '#999',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#00D563',
    borderColor: '#00D563',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  policyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 10,
  },

  saveButton: {
    backgroundColor: '#00D563',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // 모달
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalItemCheck: {
    fontSize: 18,
    color: '#00D563',
    fontWeight: 'bold',
  },
});
