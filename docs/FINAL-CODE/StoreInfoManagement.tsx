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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
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

export default function StoreInfoManagement({ onBack, onManageProducts }: StoreInfoManagementProps) {
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState('');

  // 가게 정보
  const [coverImage, setCoverImage] = useState<any>(null);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [refundPolicy, setRefundPolicy] = useState('');
  const [noShowPolicy, setNoShowPolicy] = useState('');

  // 운영시간
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    DAYS.map(({ day, dayShort }) => ({
      day,
      dayShort,
      startTime: '09:00',
      endTime: '09:00',
      enabled: false,
    }))
  );

  // 업체 정보 가져오기
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
      setCoverImageUrl(storeData.cover_image_url || '');
      setRefundPolicy(
        storeData.refund_policy || '픽업 1시간 전까지 취소 가능하며, 전액 환불됩니다.'
      );
      setNoShowPolicy(
        storeData.no_show_policy || '노쇼 시 다음 예약이 제한될 수 있습니다.'
      );

      // 운영시간 로드 (opening_hours JSONB)
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

  // 대표 사진 선택
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

  // 운영시간 토글
  const toggleDay = (index: number) => {
    const newSchedule = [...schedule];
    newSchedule[index].enabled = !newSchedule[index].enabled;
    setSchedule(newSchedule);
  };

  // 시간 변경
  const updateTime = (index: number, type: 'start' | 'end', value: string) => {
    const newSchedule = [...schedule];
    if (type === 'start') {
      newSchedule[index].startTime = value;
    } else {
      newSchedule[index].endTime = value;
    }
    setSchedule(newSchedule);
  };

  // 저장하기
  const handleSave = async () => {
    try {
      if (!storeName.trim()) {
        alert('가게명을 입력해주세요.');
        return;
      }

      setLoading(true);

      // 1. 커버 이미지 업로드 (새로 선택한 경우)
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

      // 2. 운영시간 JSON 생성
      const openingHours: any = {};
      schedule.forEach((item) => {
        openingHours[item.dayShort] = {
          start: item.startTime,
          end: item.endTime,
          enabled: item.enabled,
        };
      });

      // 3. DB 업데이트
      const { error } = await supabase
        .from('stores')
        .update({
          name: storeName,
          description: storeDescription,
          cover_image_url: finalCoverUrl,
          opening_hours: openingHours,
          refund_policy: refundPolicy,
          no_show_policy: noShowPolicy,
        })
        .eq('id', storeId);

      if (error) throw error;

      alert('가게 정보가 저장되었습니다.');
      onBack();
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장에 실패했습니다.');
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
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>가게 정보 관리</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 대표 사진 추가 */}
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

        {/* 가게 정보 */}
        <Text style={styles.sectionTitle}>가게 정보</Text>

        <Text style={styles.label}>가게명</Text>
        <TextInput
          style={styles.input}
          value={storeName}
          onChangeText={setStoreName}
          placeholder="예: 세이브잇 베이커리 성수점"
          placeholderTextColor="#999"
        />

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

        {/* 판매상품 관리 버튼 */}
        <TouchableOpacity style={styles.productManageButton} onPress={onManageProducts}>
          <View style={styles.productManageLeft}>
            <Text style={styles.productManageIcon}>🛒</Text>
            <Text style={styles.productManageText}>판매상품 관리</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {/* 운영 및 정책 관리 */}
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
                <TextInput
                  style={styles.timeInput}
                  value={item.startTime}
                  onChangeText={(value) => updateTime(index, 'start', value)}
                  placeholder="09:00"
                  placeholderTextColor="#999"
                />
                <Text style={styles.timeSeparator}>~</Text>
                <TextInput
                  style={styles.timeInput}
                  value={item.endTime}
                  onChangeText={(value) => updateTime(index, 'end', value)}
                  placeholder="09:00"
                  placeholderTextColor="#999"
                />
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

        {/* 환불/교환/노쇼 정책 */}
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

        {/* 저장 버튼 */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>✓ 변경사항 저장하기</Text>
        </TouchableOpacity>

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

  // 섹션 타이틀
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 15,
  },

  // 이미지 업로드
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

  // 입력 필드
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
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

  // 판매상품 관리 버튼
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

  // 운영시간 스케줄
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

  // 정책
  policyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 10,
  },

  // 저장 버튼
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
});
