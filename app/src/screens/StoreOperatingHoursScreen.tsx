import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface StoreOperatingHoursScreenProps {
  onBack: () => void;
}

interface OperatingHour {
  id?: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

const DAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

export default function StoreOperatingHoursScreen({ onBack }: StoreOperatingHoursScreenProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeId, setStoreId] = useState('');
  const [operatingHours, setOperatingHours] = useState<OperatingHour[]>([]);

  const fetchStoreId = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('사용자 정보를 찾을 수 없습니다');

      const { data: storeData, error } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return storeData.id;
    } catch (error) {
      console.error('업체 정보 로딩 오류:', error);
      throw error;
    }
  }, []);

  const fetchOperatingHours = useCallback(async (storeIdParam: string) => {
    try {
      const { data, error } = await supabase
        .from('store_operating_hours')
        .select('*')
        .eq('store_id', storeIdParam)
        .order('day_of_week', { ascending: true });

      if (error) throw error;

      // 기본값 설정 (데이터가 없으면)
      const defaultHours: OperatingHour[] = [];
      for (let i = 0; i < 7; i++) {
        const existing = data?.find((h: any) => h.day_of_week === i);
        if (existing) {
          defaultHours.push(existing);
        } else {
          defaultHours.push({
            day_of_week: i,
            open_time: '09:00',
            close_time: '18:00',
            is_closed: false,
          });
        }
      }

      setOperatingHours(defaultHours);
    } catch (error) {
      console.error('영업시간 로딩 오류:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const id = await fetchStoreId();
        setStoreId(id);
        await fetchOperatingHours(id);
      } catch {
        Alert.alert('오류', '영업시간을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [fetchStoreId, fetchOperatingHours]);

  const updateHour = (dayIndex: number, field: string, value: any) => {
    const newHours = [...operatingHours];
    newHours[dayIndex] = { ...newHours[dayIndex], [field]: value };
    setOperatingHours(newHours);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // 기존 데이터 삭제
      await supabase.from('store_operating_hours').delete().eq('store_id', storeId);

      // 새 데이터 삽입
      const insertData = operatingHours.map((hour) => ({
        store_id: storeId,
        day_of_week: hour.day_of_week,
        open_time: hour.open_time,
        close_time: hour.close_time,
        is_closed: hour.is_closed,
      }));

      const { error } = await supabase.from('store_operating_hours').insert(insertData);

      if (error) throw error;

      Alert.alert('완료', '영업시간이 저장되었습니다.', [{ text: '확인', onPress: onBack }]);
    } catch (error) {
      console.error('영업시간 저장 오류:', error);
      Alert.alert('오류', '영업시간 저장에 실패했습니다.');
    } finally {
      setSaving(false);
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
        <Text style={styles.headerTitle}>영업시간 관리</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {operatingHours.map((hour, index) => (
          <View key={index} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayName}>{DAYS[hour.day_of_week]}</Text>
              <View style={styles.closedSwitch}>
                <Text style={styles.closedLabel}>휴무</Text>
                <Switch
                  value={hour.is_closed}
                  onValueChange={(value) => updateHour(index, 'is_closed', value)}
                  trackColor={{ false: '#D0D0D0', true: '#FF6B6B' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#D0D0D0"
                />
              </View>
            </View>

            {!hour.is_closed && (
              <View style={styles.timeRow}>
                <View style={styles.timeColumn}>
                  <Text style={styles.timeLabel}>오픈</Text>
                  <View style={styles.timePicker}>
                    <Text style={styles.timeText}>{hour.open_time}</Text>
                  </View>
                </View>

                <Text style={styles.timeSeparator}>~</Text>

                <View style={styles.timeColumn}>
                  <Text style={styles.timeLabel}>마감</Text>
                  <View style={styles.timePicker}>
                    <Text style={styles.timeText}>{hour.close_time}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        ))}

        {/* 안내 메시지 */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            영업시간은 예약 가능 시간에 반영됩니다.{'\n'}휴무일로 설정하면 해당 요일에는 예약이
            불가합니다.
          </Text>
        </View>

        {/* 저장 버튼 */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>저장하기</Text>
          )}
        </TouchableOpacity>

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

  // 요일 카드
  dayCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  closedSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closedLabel: {
    fontSize: 14,
    color: '#666',
  },

  // 시간 행
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  timeColumn: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  timePicker: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  timeText: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  timeSeparator: {
    fontSize: 18,
    color: '#999',
    marginTop: 20,
  },

  // 안내 박스
  infoBox: {
    backgroundColor: '#FFF4E5',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    marginBottom: 20,
    gap: 12,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },

  // 저장 버튼
  saveButton: {
    backgroundColor: '#00D563',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});