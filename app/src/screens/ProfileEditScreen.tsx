import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface ProfileEditScreenProps {
  onBack: () => void;
}

export default function ProfileEditScreen({ onBack }: ProfileEditScreenProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [consumerId, setConsumerId] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email || '');

      const { data: consumerData, error } = await supabase
        .from('consumers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (consumerData) {
        setConsumerId(consumerData.id);
        setNickname(consumerData.nickname || '');
        setPhone(consumerData.phone || '');
        setAddress(consumerData.address || '');
      }
    } catch (error) {
      console.error('프로필 로딩 오류:', error);
      Alert.alert('오류', '프로필을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!nickname.trim()) {
        Alert.alert('알림', '닉네임을 입력해주세요.');
        return;
      }

      setSaving(true);

      const { error } = await supabase
        .from('consumers')
        .update({
          nickname: nickname.trim(),
          phone: phone.trim(),
          address: address.trim(),
        })
        .eq('id', consumerId);

      if (error) throw error;

      Alert.alert('완료', '프로필이 저장되었습니다.', [{ text: '확인', onPress: onBack }]);
    } catch (error) {
      console.error('프로필 저장 오류:', error);
      Alert.alert('오류', '프로필 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
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
        <Text style={styles.headerTitle}>프로필 편집</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 이메일 (읽기 전용) */}
        <Text style={styles.label}>이메일</Text>
        <View style={[styles.input, styles.inputDisabled]}>
          <Text style={styles.inputTextDisabled}>{email}</Text>
        </View>

        {/* 닉네임 */}
        <Text style={styles.label}>닉네임 *</Text>
        <TextInput
          style={styles.input}
          value={nickname}
          onChangeText={setNickname}
          placeholder="닉네임을 입력하세요"
          placeholderTextColor="#999"
        />

        {/* 연락처 */}
        <Text style={styles.label}>연락처</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="010-1234-5678"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
        />

        {/* 주소 */}
        <Text style={styles.label}>주소</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={address}
          onChangeText={setAddress}
          placeholder="서울시 강남구 테헤란로 123"
          placeholderTextColor="#999"
          multiline
          numberOfLines={2}
        />

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
    paddingTop: 30,
  },

  // 라벨
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
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
  },
  inputDisabled: {
    backgroundColor: '#F5F5F5',
  },
  inputTextDisabled: {
    fontSize: 15,
    color: '#999',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },

  // 저장 버튼
  saveButton: {
    backgroundColor: '#00D563',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});