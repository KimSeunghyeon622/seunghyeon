import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';
// MVP 단계에서 구글 로그인 비활성화 - 나중에 필요시 재활성화
// import * as WebBrowser from 'expo-web-browser';
// import * as Linking from 'expo-linking';

// WebBrowser를 완전히 닫도록 설정
// WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({
  onSignup,
  onViewNotices,
}: {
  onSignup: () => void;
  onViewNotices?: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // MVP 단계에서 구글 로그인 비활성화 - 나중에 필요시 재활성화
  // const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        Alert.alert('로그인 실패', '이메일 또는 비밀번호가 올바르지 않습니다. 다시 확인해주세요.');
      }
      // 성공 시 App.tsx의 세션 리스너가 자동으로 처리
    } catch (error) {
      Alert.alert('오류', '로그인 중 문제가 발생했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // MVP 단계에서 구글 로그인 비활성화 - 나중에 필요시 재활성화
  /* const handleGoogleLogin = async () => {
    setSocialLoading('google');
    try {
      // Expo 앱의 redirect URL (exp://로 시작하는 딥링크)
      const redirectUrl = Linking.createURL('/auth/callback');
      console.log('=== 구글 로그인 시작 ===');
      console.log('Redirect URL:', redirectUrl);
      console.log('이 URL을 Supabase Dashboard → Authentication → URL Configuration → Redirect URLs에 추가해주세요');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true, // true로 설정하여 URL만 받기
          queryParams: {
            prompt: 'select_account', // 항상 계정 선택 표시
            access_type: 'offline', // refresh token 받기
          },
        },
      });

      if (error) {
        Alert.alert('구글 로그인 실패', error.message);
        setSocialLoading(null);
        return;
      }

      // OAuth URL이 반환되면 WebBrowser로 열기
      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (result.type === 'success' && result.url) {
          // URL에서 토큰 추출 시도
          // 1. 해시 파라미터 형식 (#access_token=...)
          // 2. 쿼리 파라미터 형식 (?access_token=...)
          let accessToken: string | null = null;
          let refreshToken: string | null = null;
          
          try {
            // 해시에서 추출 시도
            if (result.url.includes('#')) {
              const hashPart = result.url.split('#')[1];
              const hashParams = new URLSearchParams(hashPart);
              accessToken = hashParams.get('access_token');
              refreshToken = hashParams.get('refresh_token');
            }
            
            // 쿼리에서 추출 시도 (해시에서 못 찾은 경우)
            if (!accessToken && result.url.includes('?')) {
              const urlObj = new URL(result.url);
              accessToken = urlObj.searchParams.get('access_token');
              refreshToken = urlObj.searchParams.get('refresh_token');
            }
          } catch (parseError) {
            console.log('URL 파싱 시도:', result.url);
          }

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              Alert.alert('세션 설정 실패', sessionError.message);
            }
            // 성공 시 App.tsx의 세션 리스너가 자동으로 처리
          } else {
            // 토큰을 추출하지 못한 경우 - Supabase 세션 확인
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData.session) {
              console.log('OAuth 응답 URL:', result.url);
              Alert.alert(
                '로그인 실패', 
                '구글 인증은 완료되었지만 세션을 설정할 수 없습니다. 다시 시도해주세요.'
              );
            }
          }
        } else if (result.type === 'cancel') {
          // 사용자가 취소한 경우
          console.log('구글 로그인 취소됨');
        }
      }
    } catch (error: any) {
      console.error('구글 로그인 오류:', error);
      Alert.alert('오류', '구글 로그인 중 오류가 발생했습니다.');
    } finally {
      setSocialLoading(null);
    }
  }; */

  return (
    <View style={styles.container}>
      <Text style={styles.title}>재고 할인 플랫폼</Text>
      
      {/* 이메일/비밀번호 로그인 */}
      <TextInput 
        style={styles.input} 
        placeholder="이메일" 
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!loading}
      />
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          editable={!loading}
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowPassword(!showPassword)}
          disabled={loading}
        >
          <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>로그인</Text>
        )}
      </TouchableOpacity>

      {/* 구분선 - MVP 단계에서 구글 로그인 비활성화 */}
      {/* <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>또는</Text>
        <View style={styles.dividerLine} />
      </View> */}

      {/* 소셜 로그인 - MVP 단계에서 비활성화 (나중에 필요시 재활성화) */}
      {/* <TouchableOpacity 
        style={[styles.socialButton, styles.googleButton, socialLoading && styles.buttonDisabled]} 
        onPress={handleGoogleLogin}
        disabled={!!socialLoading}
      >
        {socialLoading === 'google' ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.socialButtonIcon}>🔍</Text>
            <Text style={styles.socialButtonText}>구글로 로그인</Text>
          </>
        )}
      </TouchableOpacity> */}

      <TouchableOpacity onPress={onSignup}>
        <Text style={styles.link}>계정이 없으신가요? 회원가입</Text>
      </TouchableOpacity>

      {onViewNotices && (
        <TouchableOpacity onPress={onViewNotices}>
          <Text style={styles.noticeLink}>공지사항 보기</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    justifyContent: 'center', 
    backgroundColor: '#fff' 
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    marginBottom: 30, 
    textAlign: 'center' 
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  eyeButton: {
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 20,
  },
  button: { 
    backgroundColor: '#007AFF', 
    padding: 18, 
    borderRadius: 10, 
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#999',
    fontSize: 14,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 10,
    marginBottom: 10,
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  socialButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  socialButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  link: { 
    color: '#007AFF', 
    textAlign: 'center', 
    marginTop: 20 
  },
  noticeLink: {
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
  },
});
