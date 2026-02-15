/**
 * 업주 상품 등록 알림 설정 화면
 * - 마감할인 상품 등록 리마인더 알림 시간 설정
 * - 요일별 알림 on/off
 * - 테스트 알림 기능
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';

interface OwnerNotificationSettingsScreenProps {
  storeId: string;
  onBack: () => void;
}

interface NotificationTime {
  id: string;
  time: string; // "HH:MM" 형식
  days: number[]; // 0=일, 1=월, ... 6=토
}

interface NotificationSettings {
  id?: string;
  store_id: string;
  is_enabled: boolean;
  notification_times: NotificationTime[];
  push_token?: string;
  last_notification_sent_at?: string;
  review_alerts?: boolean;
}

// 요일 레이블 (월요일부터 시작)
const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];
// 요일 인덱스 매핑 (표시순서 -> DB 저장값)
const DAY_INDEX_MAP = [1, 2, 3, 4, 5, 6, 0]; // 월=1, 화=2, ... 일=0

export default function OwnerNotificationSettingsScreen({
  storeId,
  onBack,
}: OwnerNotificationSettingsScreenProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notificationTimes, setNotificationTimes] = useState<NotificationTime[]>([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTimeId, setSelectedTimeId] = useState<string | null>(null);
  const [tempTime, setTempTime] = useState(new Date());

  // 설정 불러오기
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('store_notification_settings')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setNotificationTimes(data.notification_times || []);
      } else {
        setNotificationTimes([]);
      }
    } catch (error) {
      console.error('알림 설정 로드 오류:', error);
      Alert.alert('오류', '알림 설정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // 설정 저장
  const saveSettings = async (times: NotificationTime[]) => {
    try {
      setSaving(true);

      const settings = {
        store_id: storeId,
        is_enabled: times.length > 0,
        notification_times: times,
      };

      const { error } = await supabase
        .from('store_notification_settings')
        .upsert(settings, { onConflict: 'store_id' });

      if (error) throw error;
    } catch (error) {
      console.error('알림 설정 저장 오류:', error);
      Alert.alert('오류', '알림 설정 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 알림 시간 추가
  const addNotificationTime = () => {
    setSelectedTimeId(null);
    // 기본값: 오후 2시
    const defaultTime = new Date();
    defaultTime.setHours(14, 0, 0, 0);
    setTempTime(defaultTime);
    setShowTimePicker(true);
  };

  // 시간 선택 완료
  const handleTimeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }

    if (event.type === 'set' && date) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;

      if (selectedTimeId) {
        // 기존 시간 수정
        const updatedTimes = notificationTimes.map((t) =>
          t.id === selectedTimeId ? { ...t, time: timeString } : t
        );
        setNotificationTimes(updatedTimes);
        saveSettings(updatedTimes);
      } else {
        // 새 시간 추가 (기본: 모든 요일)
        const newTime: NotificationTime = {
          id: Date.now().toString(),
          time: timeString,
          days: [0, 1, 2, 3, 4, 5, 6], // 모든 요일
        };
        const updatedTimes = [...notificationTimes, newTime];
        setNotificationTimes(updatedTimes);
        saveSettings(updatedTimes);
      }

      if (Platform.OS === 'ios') {
        setShowTimePicker(false);
      }
    } else if (event.type === 'dismissed') {
      setShowTimePicker(false);
    }
  };

  // 알림 시간 삭제
  const deleteNotificationTime = (id: string) => {
    Alert.alert(
      '알림 삭제',
      '이 알림 시간을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            const updatedTimes = notificationTimes.filter((t) => t.id !== id);
            setNotificationTimes(updatedTimes);
            saveSettings(updatedTimes);
          },
        },
      ]
    );
  };

  // 요일 토글
  const toggleDay = (timeId: string, dayIndex: number) => {
    const dbDayIndex = DAY_INDEX_MAP[dayIndex];
    const updatedTimes = notificationTimes.map((t) => {
      if (t.id === timeId) {
        const days = t.days.includes(dbDayIndex)
          ? t.days.filter((d) => d !== dbDayIndex)
          : [...t.days, dbDayIndex].sort();

        // 최소 1개 요일 필수
        if (days.length === 0) {
          Alert.alert('알림', '최소 1개 이상의 요일을 선택해주세요.');
          return t;
        }

        return { ...t, days };
      }
      return t;
    });
    setNotificationTimes(updatedTimes);
    saveSettings(updatedTimes);
  };

  // 프리셋: 매일
  const selectAllDays = (timeId: string) => {
    const updatedTimes = notificationTimes.map((t) =>
      t.id === timeId ? { ...t, days: [0, 1, 2, 3, 4, 5, 6] } : t
    );
    setNotificationTimes(updatedTimes);
    saveSettings(updatedTimes);
  };

  // 프리셋: 평일만
  const selectWeekdays = (timeId: string) => {
    const updatedTimes = notificationTimes.map((t) =>
      t.id === timeId ? { ...t, days: [1, 2, 3, 4, 5] } : t
    );
    setNotificationTimes(updatedTimes);
    saveSettings(updatedTimes);
  };

  // 프리셋: 주말만
  const selectWeekend = (timeId: string) => {
    const updatedTimes = notificationTimes.map((t) =>
      t.id === timeId ? { ...t, days: [0, 6] } : t
    );
    setNotificationTimes(updatedTimes);
    saveSettings(updatedTimes);
  };

  // 요일 표시 텍스트 생성
  const getDaysText = (days: number[]): string => {
    if (days.length === 7) return '매일';
    if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) {
      return '평일';
    }
    if (days.length === 2 && days.includes(0) && days.includes(6)) {
      return '주말';
    }

    // 개별 요일 표시 (월요일부터)
    return DAY_INDEX_MAP
      .map((dbIndex, displayIndex) => (days.includes(dbIndex) ? DAY_LABELS[displayIndex] : null))
      .filter(Boolean)
      .join(', ');
  };

  // 시간 포맷 (24시간 -> 오전/오후)
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours < 12 ? '오전' : '오후';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${period} ${displayHours}:${minutes.toString().padStart(2, '0')}`;
  };

  // 테스트 알림 발송
  const sendTestNotification = async () => {
    try {
      // 알림 권한 확인
      const { status } = await Notifications.getPermissionsAsync();

      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert(
            '알림 권한 필요',
            '알림을 받으려면 설정에서 알림 권한을 허용해주세요.',
            [
              { text: '취소', style: 'cancel' },
              { text: '설정으로 이동', onPress: () => Linking.openSettings() },
            ]
          );
          return;
        }
      }

      // 로컬 알림 발송
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Save It',
          body: '마감할인 상품 등록 시간이에요! 오늘의 할인 상품을 등록해주세요.',
          sound: true,
        },
        trigger: null, // 즉시 발송
      });

      Alert.alert('테스트 알림 발송 완료', '알림이 정상적으로 발송되었습니다.');
    } catch (error) {
      console.error('테스트 알림 발송 오류:', error);
      Alert.alert('오류', '테스트 알림 발송에 실패했습니다.');
    }
  };

  // 로딩 화면
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>상품 등록 알림 설정</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00D563" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>상품 등록 알림 설정</Text>
        <View style={styles.placeholder}>
          {saving && <ActivityIndicator size="small" color="#00D563" />}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 안내 문구 */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            알림 시간을 추가하면 해당 요일과 시간에 상품 등록 알림을 받아요
          </Text>
        </View>

        {/* 알림 시간 설정 */}
        <View style={styles.settingsContainer}>
          <Text style={styles.sectionTitle}>알림 시간 설정</Text>

          {/* 알림 시간 추가 버튼 */}
          <TouchableOpacity
            style={styles.addTimeButton}
            onPress={addNotificationTime}
            disabled={false}
          >
            <Text style={styles.addIcon}>+</Text>
            <Text style={styles.addText}>알림 시간 추가</Text>
          </TouchableOpacity>

          {/* 알림 시간 목록 */}
          {notificationTimes.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyText}>설정된 알림이 없습니다</Text>
              <Text style={styles.emptySubText}>+ 버튼을 눌러 알림 시간을 추가하세요</Text>
            </View>
          ) : (
            notificationTimes.map((item) => (
              <View key={item.id} style={styles.timeCard}>
                {/* 시간 정보 */}
                <View style={styles.timeHeader}>
                  <TouchableOpacity
                    style={styles.timeLeft}
                    onPress={() => {
                      setSelectedTimeId(item.id);
                      const [hours, minutes] = item.time.split(':').map(Number);
                      const date = new Date();
                      date.setHours(hours, minutes);
                      setTempTime(date);
                      setShowTimePicker(true);
                    }}
                    disabled={false}
                  >
                    <View style={styles.timeIconContainer}>
                      <Text style={styles.timeIcon}>🔔</Text>
                    </View>
                    <View style={styles.timeInfo}>
                      <Text style={styles.timeText}>{formatTime(item.time)}</Text>
                      <Text style={styles.timeStatus}>{getDaysText(item.days)}</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deleteNotificationTime(item.id)}
                    disabled={false}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteIcon}>×</Text>
                  </TouchableOpacity>
                </View>

                {/* 요일 선택 */}
                <View style={styles.daysSection}>
                  <View style={styles.dayButtonsContainer}>
                    {DAY_LABELS.map((day, index) => {
                      const dbIndex = DAY_INDEX_MAP[index];
                      const isSelected = item.days.includes(dbIndex);
                      return (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.dayButton,
                            isSelected && styles.dayButtonActive,
                          ]}
                          onPress={() => toggleDay(item.id, index)}
                          disabled={false}
                        >
                          <Text
                            style={[
                              styles.dayText,
                              isSelected && styles.dayTextActive,
                            ]}
                          >
                            {day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* 프리셋 버튼 */}
                  <View style={styles.presetContainer}>
                    <TouchableOpacity
                      style={[
                        styles.presetButton,
                        item.days.length === 7 && styles.presetButtonActive,
                      ]}
                      onPress={() => selectAllDays(item.id)}
                      disabled={false}
                    >
                      <Text
                        style={[
                          styles.presetText,
                          item.days.length === 7 && styles.presetTextActive,
                        ]}
                      >
                        매일
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.presetButton,
                        item.days.length === 5 &&
                          [1, 2, 3, 4, 5].every((d) => item.days.includes(d)) &&
                          styles.presetButtonActive,
                      ]}
                      onPress={() => selectWeekdays(item.id)}
                      disabled={false}
                    >
                      <Text
                        style={[
                          styles.presetText,
                          item.days.length === 5 &&
                            [1, 2, 3, 4, 5].every((d) => item.days.includes(d)) &&
                            styles.presetTextActive,
                        ]}
                      >
                        평일만
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.presetButton,
                        item.days.length === 2 &&
                          item.days.includes(0) &&
                          item.days.includes(6) &&
                          styles.presetButtonActive,
                      ]}
                      onPress={() => selectWeekend(item.id)}
                      disabled={false}
                    >
                      <Text
                        style={[
                          styles.presetText,
                          item.days.length === 2 &&
                            item.days.includes(0) &&
                            item.days.includes(6) &&
                            styles.presetTextActive,
                        ]}
                      >
                        주말만
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}

          {/* 알림 미리보기 */}
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>알림 미리보기</Text>
            <View style={styles.previewContent}>
              <Text style={styles.previewIcon}>🔔</Text>
              <View style={styles.previewTextContainer}>
                <Text style={styles.previewAppName}>Save It</Text>
                <Text style={styles.previewMessage}>
                  마감할인 상품 등록 시간이에요!
                </Text>
                <Text style={styles.previewSubMessage}>
                  오늘의 할인 상품을 등록해주세요.
                </Text>
              </View>
            </View>
          </View>

          {/* 테스트 알림 버튼 */}
          <TouchableOpacity
            style={styles.testButton}
            onPress={sendTestNotification}
            disabled={false}
          >
            <Text style={styles.testButtonText}>알림 테스트 보내기</Text>
          </TouchableOpacity>
        </View>

        {/* 하단 여백 */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* iOS Time Picker Modal */}
      {showTimePicker && Platform.OS === 'ios' && (
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Text style={styles.pickerCancelText}>취소</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>시간 선택</Text>
              <TouchableOpacity
                onPress={() => handleTimeChange({ type: 'set' } as DateTimePickerEvent, tempTime)}
              >
                <Text style={styles.pickerConfirmText}>완료</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={tempTime}
                mode="time"
                display="spinner"
                onChange={(_event: DateTimePickerEvent, date?: Date) => {
                  if (date) setTempTime(date);
                }}
                minuteInterval={5}
                locale="ko-KR"
                textColor="#000000"
                accentColor="#FFD700"
                themeVariant="light"
                style={styles.timePicker}
              />
            </View>
          </View>
        </View>
      )}

      {/* Android Time Picker */}
      {showTimePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={tempTime}
          mode="time"
          display="default"
          onChange={handleTimeChange}
          minuteInterval={5}
        />
      )}
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
    padding: 5,
  },
  backText: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 34,
    alignItems: 'center',
  },

  scrollView: {
    flex: 1,
  },

  // 안내 카드
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF9E6',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 13,
    color: '#666',
  },

  // 설정 컨테이너
  settingsContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  disabledContainer: {
    opacity: 0.5,
    pointerEvents: 'none',
  },

  // 섹션 타이틀
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },

  // 알림 시간 추가 버튼
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    gap: 8,
    marginBottom: 12,
  },
  addIcon: {
    fontSize: 24,
    color: '#00D563',
    fontWeight: '300',
  },
  addText: {
    fontSize: 15,
    color: '#00D563',
    fontWeight: '600',
  },

  // 빈 상태
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12,
  },
  emptyIcon: {
    fontSize: 40,
    opacity: 0.3,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 13,
    color: '#999',
  },

  // 시간 카드
  timeCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  timeLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIconContainer: {
    width: 44,
    height: 44,
    backgroundColor: '#E8F5E9',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timeIcon: {
    fontSize: 20,
  },
  timeInfo: {
    flex: 1,
  },
  timeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  timeStatus: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  deleteIcon: {
    fontSize: 24,
    color: '#FF5252',
  },

  // 요일 선택
  daysSection: {
    padding: 16,
    paddingTop: 12,
  },
  dayButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#00D563',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  dayTextActive: {
    color: '#FFF',
  },

  // 프리셋 버튼
  presetContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  presetButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  presetButtonActive: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#00D563',
  },
  presetText: {
    fontSize: 13,
    color: '#666',
  },
  presetTextActive: {
    color: '#00D563',
    fontWeight: '600',
  },

  // 알림 미리보기
  previewCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  previewTitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  previewIcon: {
    fontSize: 24,
  },
  previewTextContainer: {
    flex: 1,
  },
  previewAppName: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  previewMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  previewSubMessage: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },

  // 테스트 버튼
  testButton: {
    backgroundColor: '#FFF',
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00D563',
  },
  testButtonText: {
    fontSize: 16,
    color: '#00D563',
    fontWeight: '600',
  },

  // iOS Time Picker Modal
  pickerModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pickerCancelText: {
    fontSize: 16,
    color: '#AAAAAA',
  },
  pickerConfirmText: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: '600',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
  },
  timePicker: {
    height: 200,
    backgroundColor: '#FFFFFF',
  },
});
