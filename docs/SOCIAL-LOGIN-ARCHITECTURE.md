# 하이브리드 앱 소셜 로그인 아키텍처 설명

## 🤔 왜 "웹 애플리케이션" 클라이언트 ID가 필요한가?

하이브리드 앱이라고 해서 반드시 Android 클라이언트 ID만 필요한 것은 아닙니다. **어떤 방식으로 구글 로그인을 구현하느냐**에 따라 다릅니다.

---

## 📊 두 가지 구현 방식 비교

### 방식 1: Supabase OAuth 사용 (현재 프로젝트 방식) ⭐ 권장

```
[앱] ←→ [Supabase 서버] ←→ [구글 서버]
```

**필요한 클라이언트 ID:**
- ✅ **웹 애플리케이션 클라이언트 ID** (Supabase가 구글과 통신)
- ✅ Android 클라이언트 ID (선택사항, 나중에 직접 구현 시 사용)

**장점:**
- ✅ 구현이 매우 간단 (`supabase.auth.signInWithOAuth()` 한 줄)
- ✅ 보안이 좋음 (클라이언트 시크릿이 서버에만 있음)
- ✅ Supabase의 모든 인증 기능 활용 가능
- ✅ 웹, iOS, Android 모두 동일한 코드로 작동

**단점:**
- ❌ Supabase에 의존적

---

### 방식 2: 직접 구글 SDK 사용

```
[앱] ←→ [구글 서버]
```

**필요한 클라이언트 ID:**
- ✅ **Android 클라이언트 ID** (앱이 직접 구글과 통신)
- ❌ 웹 애플리케이션 클라이언트 ID 불필요

**장점:**
- ✅ Supabase에 의존하지 않음
- ✅ 더 많은 제어 가능

**단점:**
- ❌ 구현이 복잡함 (`@react-native-google-signin/google-signin` 등 SDK 필요)
- ❌ Android와 iOS 각각 다른 코드 필요
- ❌ 토큰 관리, 세션 관리 등 직접 구현 필요

---

## 🎯 현재 프로젝트 상황

**현재 프로젝트는 Supabase를 백엔드로 사용 중입니다.**

따라서 **방식 1 (Supabase OAuth)**을 사용하는 것이 맞습니다.

---

## ✅ 결론: 웹 애플리케이션 클라이언트 ID가 맞습니다!

**"웹 애플리케이션"이라는 이름이 혼란스러울 수 있지만:**

- 이것은 **Supabase 서버**가 구글과 통신하기 위한 것입니다
- 앱 자체가 웹이 아니라, **백엔드 서버(Supabase)가 웹 애플리케이션 역할**을 합니다
- 하이브리드 앱이지만, 인증은 Supabase를 통해 처리하므로 웹 애플리케이션 클라이언트 ID가 필요합니다

---

## 📝 실제 동작 흐름

1. **사용자가 앱에서 "구글 로그인" 버튼 클릭**
2. **앱이 Supabase에 요청**: `supabase.auth.signInWithOAuth({ provider: 'google' })`
3. **Supabase가 구글 서버로 리디렉션**: 웹 브라우저 또는 인앱 브라우저 열림
4. **사용자가 구글에서 로그인**
5. **구글이 Supabase로 리디렉션**: `https://qycwdncplofgzdrjtklb.supabase.co/auth/v1/callback`
6. **Supabase가 토큰을 받아서 앱으로 전달**
7. **앱이 Supabase 세션으로 로그인 완료**

이 과정에서 **Supabase가 구글과 통신**하므로, **웹 애플리케이션 클라이언트 ID**가 필요합니다.

---

## 🔄 만약 직접 구글 SDK를 사용한다면?

만약 Supabase를 거치지 않고 직접 구글 SDK를 사용한다면:

```typescript
// @react-native-google-signin/google-signin 사용
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: '...', // 여기서는 웹 클라이언트 ID 필요 (ID 토큰용)
  iosClientId: '...', // iOS용
  androidClientId: '...', // Android 클라이언트 ID 사용
});
```

하지만 이 경우에도:
- **ID 토큰을 받기 위해** 웹 클라이언트 ID가 필요할 수 있습니다
- Supabase에 토큰을 전달해야 하므로 결국 Supabase OAuth가 더 간단합니다

---

## 💡 최종 권장사항

**현재 프로젝트 구조상 Supabase OAuth를 사용하는 것이 가장 좋습니다:**

1. ✅ 이미 Supabase를 사용 중
2. ✅ 구현이 매우 간단
3. ✅ 보안이 좋음
4. ✅ 웹/모바일 모두 동일한 코드

**따라서 웹 애플리케이션 클라이언트 ID를 만드는 것이 맞습니다!**

---

## 📋 다음 단계

1. **웹 애플리케이션 클라이언트 ID 생성**
   - 이름: `Save It Web`
   - 리디렉션 URI: `https://qycwdncplofgzdrjtklb.supabase.co/auth/v1/callback`

2. **클라이언트 ID와 시크릿을 Supabase에 설정**

3. **앱 코드 구현** (매우 간단):
   ```typescript
   await supabase.auth.signInWithOAuth({
     provider: 'google',
   });
   ```

이렇게 하면 하이브리드 앱에서도 완벽하게 구글 로그인이 작동합니다!
