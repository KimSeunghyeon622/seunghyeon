import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface StoreSignupScreenProps {
  onBack: () => void;
  onSignupComplete: () => void;
}

export default function StoreSignupScreen({ onBack, onSignupComplete }: StoreSignupScreenProps) {
  const [loading, setLoading] = useState(false);

  // 인증 정보
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  // 업체 정보
  const [storeName, setStoreName] = useState('');
  const [storeCategory, setStoreCategory] = useState('제과');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');

  const categories = ['반찬', '제과', '식자재', '밀키트'];

  const handleSignup = async () => {
    try {
      // 유효성 검사
      if (!email || !password || !passwordConfirm) {
        Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
        return;
      }

      if (password !== passwordConfirm) {
        Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
        return;
      }

      if (password.length < 6) {
        Alert.alert('오류', '비밀번호는 6자 이상이어야 합니다.');
        return;
      }

      if (!storeName || !ownerName || !phone || !address) {
        Alert.alert('오류', '모든 필수 정보를 입력해주세요.');
        return;
      }

      if (!businessNumber || businessNumber.length < 10) {
        Alert.alert('오류', '올바른 사업자등록번호를 입력해주세요.');
        return;
      }

      setLoading(true);

      // 1. 사용자 생성 (Supabase Auth)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('회원가입 중 오류가 발생했습니다.');
      }

      // 2. 업체 정보 저장
      const { error: storeError } = await supabase.from('stores').insert({
        user_id: authData.user.id,
        name: storeName.trim(),
        category: storeCategory,
        owner_name: ownerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        business_number: businessNumber.trim(),
        cash_balance: 0,
        average_rating: 0,
        review_count: 0,
        is_open: false, // 승인 전까지 영업 중지
        is_approved: false, // 관리자 승인 필요
        latitude: 37.5665, // 기본값 (서울)
        longitude: 126.9780,
      });

      if (storeError) throw storeError;

      Alert.alert(
        '회원가입 완료',
        '업체 등록이 완료되었습니다.\n관리자 승인 후 서비스를 이용하실 수 있습니다.\n\n승인까지 1-2일 소요됩니다.',
        [{ text: '확인', onPress: onSignupComplete }]
      );
    } catch (error: any) {
      console.error('회원가입 오류:', error);
      Alert.alert('오류', error.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>업주 회원가입</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 안내 메시지 */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>📋</Text>
          <Text style={styles.infoText}>
            업체 정보를 입력하시면 관리자 승인 후{'\n'}서비스를 이용하실 수 있습니다.
          </Text>
        </View>

        {/* 로그인 정보 */}
        <Text style={styles.sectionTitle}>로그인 정보</Text>

        <Text style={styles.label}>이메일 *</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="store@example.com"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>비밀번호 *</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="6자 이상"
          placeholderTextColor="#999"
          secureTextEntry
        />

        <Text style={styles.label}>비밀번호 확인 *</Text>
        <TextInput
          style={styles.input}
          value={passwordConfirm}
          onChangeText={setPasswordConfirm}
          placeholder="비밀번호 재입력"
          placeholderTextColor="#999"
          secureTextEntry
        />

        {/* 업체 정보 */}
        <Text style={styles.sectionTitle}>업체 정보</Text>

        <Text style={styles.label}>업체명 *</Text>
        <TextInput
          style={styles.input}
          value={storeName}
          onChangeText={setStoreName}
          placeholder="예: 투굿 베이커리"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>카테고리 *</Text>
        <View style={styles.categoryContainer}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryButton,
                storeCategory === cat && styles.categoryButtonActive,
              ]}
              onPress={() => setStoreCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryText,
                  storeCategory === cat && styles.categoryTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>대표자명 *</Text>
        <TextInput
          style={styles.input}
          value={ownerName}
          onChangeText={setOwnerName}
          placeholder="홍길동"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>연락처 *</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="010-1234-5678"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>사업자등록번호 *</Text>
        <TextInput
          style={styles.input}
          value={businessNumber}
          onChangeText={setBusinessNumber}
          placeholder="000-00-00000"
          placeholderTextColor="#999"
          keyboardType="numeric"
        />

        <Text style={styles.label}>주소 *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={address}
          onChangeText={setAddress}
          placeholder="서울시 강남구 테헤란로 123"
          placeholderTextColor="#999"
          multiline
          numberOfLines={2}
        />

        {/* 가입하기 버튼 */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>가입하기</Text>
          )}
        </TouchableOpacity>

        {/* 안내사항 */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeTitle}>📢 안내사항</Text>
          <Text style={styles.noticeText}>• 가입 후 1-2일 내 승인 처리됩니다.</Text>
          <Text style={styles.noticeText}>
            • 승인 완료 시 이메일로 안내드립니다.
          </Text>
          <Text style={styles.noticeText}>• 서비스 이용 전 캐시 충전이 필요합니다.</Text>
        </View>

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

  // 안내 박스
  infoBox: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  infoIcon: {
    fontSize: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#00A84D',
    lineHeight: 20,
  },

  // 섹션
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },

  // 카테고리 선택
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
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

  // 제출 버튼
  submitButton: {
    backgroundColor: '#00D563',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // 안내사항
  noticeBox: {
    backgroundColor: '#FFF4E5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  noticeText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
});
