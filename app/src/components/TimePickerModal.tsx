/**
 * 픽업 시간 선택 모달 컴포넌트
 * - 하단에서 올라오는 모달 형태
 * - 30분 단위로 시간 생성
 * - 업체 영업시간을 고려하여 선택 가능한 시간만 표시
 */
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface TimePickerModalProps {
  visible: boolean;
  selectedTime: string; // "HH:MM" 형식
  storeId: string;
  onSelect: (time: string) => void;
  onClose: () => void;
}

interface OperatingHours {
  openTime: string; // "HH:MM"
  closeTime: string; // "HH:MM"
}

export default function TimePickerModal({
  visible,
  selectedTime,
  storeId,
  onSelect,
  onClose,
}: TimePickerModalProps) {
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [operatingHours, setOperatingHours] = useState<OperatingHours | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  // visible이 변경되거나 selectedTime이 변경되면 내부 state 업데이트
  useEffect(() => {
    if (visible && selectedTime) {
      // selectedTime이 "HH:MM" 형식이면 해당하는 시간 슬롯 찾기
      const matchingSlot = timeSlots.find(slot => slot.startsWith(selectedTime));
      setSelectedTimeSlot(matchingSlot || '');
    }
  }, [visible, selectedTime, timeSlots]);

  // 모달 표시/숨김 애니메이션
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  // 업체 영업시간 조회 및 시간 슬롯 생성
  useEffect(() => {
    if (visible && storeId) {
      fetchOperatingHours();
    }
  }, [visible, storeId]);

  const fetchOperatingHours = async () => {
    try {
      setLoading(true);

      // 오늘 요일 가져오기 (0: 일요일, 6: 토요일)
      const today = new Date().getDay();

      // store_operating_hours 테이블에서 오늘 요일의 영업시간 조회
      const { data, error } = await supabase
        .from('store_operating_hours')
        .select('open_time, close_time, is_closed')
        .eq('store_id', storeId)
        .eq('day_of_week', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116은 "no rows returned" 에러
        console.error('영업시간 조회 오류:', error);
      }

      let openTime = '09:00'; // 기본값
      let closeTime = '21:00'; // 기본값

      if (data && !data.is_closed && data.open_time && data.close_time) {
        // TIME 형식을 "HH:MM" 형식으로 변환
        openTime = data.open_time.slice(0, 5);
        closeTime = data.close_time.slice(0, 5);
      } else {
        // store_operating_hours가 없으면 stores 테이블의 opening_hours_text 확인
        const { data: storeData } = await supabase
          .from('stores')
          .select('opening_hours_text')
          .eq('id', storeId)
          .single();

        if (storeData && storeData.opening_hours_text) {
          // opening_hours_text 파싱 (예: "09:00 - 21:00")
          const match = storeData.opening_hours_text.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
          if (match) {
            openTime = match[1];
            closeTime = match[2];
          }
        }
      }

      setOperatingHours({ openTime, closeTime });
      const slots = generateTimeSlots(openTime, closeTime);
      setTimeSlots(slots);
    } catch (error) {
      console.error('영업시간 조회 오류:', error);
      // 기본값 사용
      setOperatingHours({ openTime: '09:00', closeTime: '21:00' });
      setTimeSlots(generateTimeSlots('09:00', '21:00'));
    } finally {
      setLoading(false);
    }
  };

  // 30분 단위로 시간 슬롯 생성 (구간 형식: "HH:MM ~ HH:MM")
  const generateTimeSlots = (openTime: string, closeTime: string): string[] => {
    const slots: string[] = [];
    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);

    let currentHour = openHour;
    let currentMin = openMin;

    while (
      currentHour < closeHour ||
      (currentHour === closeHour && currentMin < closeMin)
    ) {
      const startTime = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      
      // 30분 추가하여 종료 시간 계산
      let endHour = currentHour;
      let endMin = currentMin + 30;
      if (endMin >= 60) {
        endMin = 0;
        endHour += 1;
      }
      
      const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
      const timeSlot = `${startTime} ~ ${endTime}`;
      slots.push(timeSlot);

      // 다음 슬롯으로 이동
      currentMin = endMin;
      currentHour = endHour;
    }

    return slots;
  };

  const handleTimeSelect = (timeSlot: string) => {
    // "HH:MM ~ HH:MM" 형식 전체를 선택
    setSelectedTimeSlot(timeSlot);
    onSelect(timeSlot); // 전체 시간 슬롯 전달 (xx:xx ~ xx:xx)
  };

  const handleConfirm = () => {
    if (selectedTimeSlot) {
      onSelect(selectedTimeSlot); // 전체 시간 슬롯 전달
      onClose();
    }
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            {/* 헤더 */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>픽업 시간 선택</Text>
              <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            {/* 영업시간 표시 */}
            {operatingHours && (
              <Text style={styles.operatingHoursText}>
                영업시간: {operatingHours.openTime} - {operatingHours.closeTime}
              </Text>
            )}

            {/* 시간 리스트 */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>영업시간을 불러오는 중...</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.timeListContainer}
                showsVerticalScrollIndicator={false}
              >
                {timeSlots.map((time) => {
                  const isSelected = time === selectedTime;
                  return (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeSlot,
                        isSelected && styles.timeSlotSelected,
                      ]}
                      onPress={() => handleTimeSelect(time)}
                    >
                      <Text
                        style={[
                          styles.timeSlotText,
                          isSelected && styles.timeSlotTextSelected,
                        ]}
                      >
                        {time}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* 확인 버튼 */}
            <TouchableOpacity
              style={[
                styles.confirmButton,
                !selectedTimeSlot && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!selectedTimeSlot}
            >
              <Text style={styles.confirmButtonText}>확인</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  modalCloseButton: {
    padding: 5,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 28,
    color: '#666666',
    lineHeight: 28,
  },
  operatingHoursText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
  },
  timeListContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    maxHeight: 400,
  },
  timeSlot: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginVertical: 4,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  timeSlotSelected: {
    backgroundColor: '#00D563',
    borderColor: '#00D563',
  },
  timeSlotText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
    textAlign: 'center',
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
  },
  confirmButton: {
    backgroundColor: '#00D563',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
  },
  confirmButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
