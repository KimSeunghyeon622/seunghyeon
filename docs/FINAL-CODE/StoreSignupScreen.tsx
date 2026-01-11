import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';

interface StoreSignupScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function StoreSignupScreen({ onBack, onSuccess }: StoreSignupScreenProps) {
  // 기본 정보
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 사업자 정보
  const [storeName, setStoreName] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [businessRegistration, setBusinessRegistration] = useState<any>(null);
  const [address, setAddress] = useState('');

  const [loading, setLoading] = useState(false);

  // 사업자등록증 선택
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요합니다.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setBusinessRegistration(result.assets[0]);
      }
    } catch (error) {
      console.error('이미지 선택 오류:', error);
      Alert.alert('오류', '이미지를 선택하는 중 오류가 발생했습니다.');
    }
  };

  // 사업자등록증 업로드
  const uploadBusinessRegistration = async (userId: string): Promise<string | null> => {
    if (!businessRegistration) return null;

    try {
      const fileExt = businessRegistration.uri.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `business-registrations/${fileName}`;

      // Fetch를 사용하여 이미지를 Blob으로 변환
      const response = await fetch(businessRegistration.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('store-documents')
        .upload(filePath, blob, {
          contentType: businessRegistration.type || 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      // Public URL 가져오기
      const { data: urlData } = supabase.storage
        .from('store-documents')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      throw error;
    }
  };

  const handleSignup = async () => {
    // 입력 검증
    if (!name || !phone || !email || !password || !confirmPassword) {
      Alert.alert('오류', '모든 기본 정보를 입력해주세요.');
      return;
    }

    if (!storeName || !businessNumber || !address) {
      Alert.alert('오류', '모든 사업자 정보를 입력해주세요.');
      return;
    }

    if (!businessRegistration) {
      Alert.alert('오류', '사업자등록증을 첨부해주세요.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('오류', '비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    try {
      // 1. Supabase Auth에 회원가입
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('회원가입에 실패했습니다.');
      }

      // 2. 사업자등록증 업로드
      const registrationUrl = await uploadBusinessRegistration(authData.user.id);

      // 3. stores 테이블에 추가 정보 저장
      const { error: storeError } = await supabase
        .from('stores')
        .insert([
          {
            user_id: authData.user.id,
            name: storeName.trim(),
            owner_name: name.trim(),
            phone: phone.trim(),
            address: address.trim(),
            business_number: businessNumber.trim(),
            business_registration_url: registrationUrl,
            latitude: 37.5665, // 기본값 (서울시청)
            longitude: 126.9780, // 기본값
            cash_balance: 0,
            average_rating: 0,
            is_approved: false, // 관리자 승인 대기
          },
        ]);

      if (storeError) throw storeError;

      Alert.alert(
        '회원가입 완료',
        '사업자 회원가입이 완료되었습니다!\n관리자 승인 후 이용 가능합니다.\n로그인해주세요.',
        [{ text: '확인', onPress: onSuccess }]
      );
    } catch (error: any) {
      console.error('회원가입 오류:', error);
      Alert.alert('회원가입 실패', error.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>사업자 회원가입</Text>
        <Text style={styles.subtitle}>상품을 등록하고 판매하세요!</Text>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>📋 기본 정보</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>이름 (담당자명)</Text>
            <TextInput
              style={styles.input}
              placeholder="홍길동"
              value={name}
              onChangeText={setName}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>전화번호</Text>
            <TextInput
              style={styles.input}
              placeholder="010-1234-5678"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>이메일</Text>
            <TextInput
              style={styles.input}
              placeholder="example@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>비밀번호</Text>
            <TextInput
              style={styles.input}
              placeholder="최소 6자 이상"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>비밀번호 확인</Text>
            <TextInput
              style={styles.input}
              placeholder="비밀번호를 다시 입력하세요"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>🏪 사업자 정보</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>가게명</Text>
            <TextInput
              style={styles.input}
              placeholder="투굿베이커리"
              value={storeName}
              onChangeText={setStoreName}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>사업자번호</Text>
            <TextInput
              style={styles.input}
              placeholder="123-45-67890"
              value={businessNumber}
              onChangeText={setBusinessNumber}
              keyboardType="numbers-and-punctuation"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>주소</Text>
            <TextInput
              style={styles.input}
              placeholder="서울시 강남구 테헤란로 123"
              value={address}
              onChangeText={setAddress}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>사업자등록증</Text>
            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={pickImage}
              disabled={loading}
            >
              <Text style={styles.imagePickerButtonText}>
                {businessRegistration ? '📎 이미지 변경' : '📎 이미지 선택'}
              </Text>
            </TouchableOpacity>

            {businessRegistration && (
              <View style={styles.imagePreview}>
                <Image
                  source={{ uri: businessRegistration.uri }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
                <Text style={styles.imageFileName}>
                  ✓ {businessRegistration.fileName || '이미지 선택됨'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>
              ⚠️ 사업자 회원가입 후 관리자 승인이 필요합니다.
            </Text>
            <Text style={styles.noticeSubText}>
              승인은 1-2일 정도 소요될 수 있습니다.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.signupButton, loading && styles.disabledButton]}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.signupButtonText}>
              {loading ? '가입 중...' : '회원가입'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={onBack} disabled={loading}>
            <Text style={styles.backButtonText}>뒤로 가기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  form: {
    gap: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  imagePickerButton: {
    backgroundColor: '#F0F0F0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderStyle: 'dashed',
  },
  imagePickerButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  imagePreview: {
    marginTop: 10,
    gap: 10,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  imageFileName: {
    fontSize: 14,
    color: '#28A745',
    fontWeight: '600',
  },
  noticeBox: {
    backgroundColor: '#FFF9E6',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
    gap: 5,
  },
  noticeText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '600',
  },
  noticeSubText: {
    fontSize: 12,
    color: '#856404',
  },
  signupButton: {
    backgroundColor: '#FF9500',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 15,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
});
