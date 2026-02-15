import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationSettingsScreenProps {
  onBack: () => void;
  isStoreOwner?: boolean;
}

interface NotificationSettings {
  pushEnabled: boolean;
  favoriteStoreAlerts: boolean;
  reviewReplyAlerts: boolean;
  storeReviewAlerts: boolean; // 사장님 전용: 내 가게 리뷰 알림
}

const DEFAULT_SETTINGS: NotificationSettings = {
  pushEnabled: true,
  favoriteStoreAlerts: true,
  reviewReplyAlerts: true,
  storeReviewAlerts: true,
};

const STORAGE_KEY = '@notification_settings';

export default function NotificationSettingsScreen({
  onBack,
  isStoreOwner = false,
}: NotificationSettingsScreenProps) {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('설정 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('설정 저장 오류:', error);
      Alert.alert('오류', '알림 설정 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const toggleSetting = (key: keyof NotificationSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };

    // 푸시 알림을 끄면 모든 알림 끄기 (예약 취소 알림 제외 - 항상 켜짐)
    if (key === 'pushEnabled' && settings.pushEnabled) {
      newSettings.favoriteStoreAlerts = false;
      newSettings.reviewReplyAlerts = false;
      newSettings.storeReviewAlerts = false;
    }

    // 푸시 알림을 켜면 기본값으로 복원
    if (key === 'pushEnabled' && !settings.pushEnabled) {
      newSettings.favoriteStoreAlerts = true;
      newSettings.reviewReplyAlerts = true;
      newSettings.storeReviewAlerts = true;
    }

    saveSettings(newSettings);
  };

  const renderSettingItem = (
    title: string,
    description: string,
    key: keyof NotificationSettings,
    disabled: boolean = false
  ) => (
    <View style={[styles.settingItem, disabled && styles.settingItemDisabled]}>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, disabled && styles.disabledText]}>
          {title}
        </Text>
        <Text style={[styles.settingDescription, disabled && styles.disabledText]}>
          {description}
        </Text>
      </View>
      <Switch
        value={settings[key]}
        onValueChange={() => toggleSetting(key)}
        trackColor={{ false: '#E0E0E0', true: '#81C784' }}
        thumbColor={settings[key] ? '#00D563' : '#f4f3f4'}
        disabled={disabled}
      />
    </View>
  );

  // 항상 켜져있는 필수 알림 (끌 수 없음)
  const renderFixedSettingItem = (
    title: string,
    description: string
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <View style={styles.titleRow}>
          <Text style={styles.settingTitle}>{title}</Text>
          <View style={styles.requiredBadge}>
            <Text style={styles.requiredBadgeText}>필수</Text>
          </View>
        </View>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={true}
        onValueChange={() => {}}
        trackColor={{ false: '#E0E0E0', true: '#81C784' }}
        thumbColor="#00D563"
        disabled={true}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>알림 설정</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text>로딩 중...</Text>
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
        <Text style={styles.title}>알림 설정</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* 메인 푸시 알림 설정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기본 설정</Text>
          {renderSettingItem(
            '푸시 알림',
            '모든 알림을 켜거나 끕니다',
            'pushEnabled'
          )}
        </View>

        {/* 세부 알림 설정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>알림 유형</Text>
          {renderFixedSettingItem(
            '예약 취소 알림',
            '가게에서 예약을 취소했을 때'
          )}
          {renderSettingItem(
            '관심업체 알림',
            '즐겨찾기한 업체의 새 상품 등록',
            'favoriteStoreAlerts',
            !settings.pushEnabled
          )}
          {renderSettingItem(
            '리뷰 답변 알림',
            '내 리뷰에 사장님이 답변했을 때',
            'reviewReplyAlerts',
            !settings.pushEnabled
          )}
          {isStoreOwner && renderSettingItem(
            '내 가게 리뷰 알림',
            '내 가게에 새 리뷰가 등록되었을 때',
            'storeReviewAlerts',
            !settings.pushEnabled
          )}
        </View>

        {/* 안내 메시지 */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            알림을 받으려면 기기 설정에서도 앱 알림을 허용해야 합니다.{'\n'}
            설정 {'>'} 알림 {'>'} Save It에서 확인해주세요.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFF',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 34,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFF',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  requiredBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  requiredBadgeText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 13,
    color: '#999',
  },
  disabledText: {
    color: '#CCC',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF9E6',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
});
