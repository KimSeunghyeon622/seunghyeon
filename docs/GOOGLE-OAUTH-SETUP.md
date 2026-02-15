# 구글 OAuth 설정 가이드

## 1. 패키지 이름 (Package Name)
✅ **이미 설정 완료**: `com.saveit.app`

`app.json`에 다음이 설정되어 있습니다:
```json
"android": {
  "package": "com.saveit.app"
}
```

---

## 2. SHA-1 인증서 지문 (Certificate Fingerprint)

### 방법 A: Expo Go 사용 중인 경우 (권장)

**Expo Go의 공개 키 SHA-1을 사용합니다:**

1. **Google Cloud Console**에서 OAuth 클라이언트 생성 시:
   - **패키지 이름**: `com.saveit.app`
   - **SHA-1 지문**: 아래 중 하나 사용

#### Expo Go (Debug) SHA-1:
```
58:11:9B:0D:6C:2C:3C:82:06:B2:57:30:30:07:2A:43:AF:82:31:31
```

#### 또는 다음 명령어로 확인:
```bash
# Windows PowerShell
keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android

# Mac/Linux
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**참고**: Expo Go를 사용하는 경우, 위의 Expo 공개 키 SHA-1을 사용하거나, 로컬 debug keystore의 SHA-1을 사용할 수 있습니다.

---

### 방법 B: 개발 빌드 (Development Build) 사용 중인 경우

**로컬 keystore의 SHA-1을 사용합니다:**

1. **로컬 keystore 확인**:
   ```bash
   # Windows
   keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
   
   # Mac/Linux
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

2. 출력에서 **SHA1:** 라인을 찾아 복사합니다.
   ```
   예시: SHA1: 58:11:9B:0D:6C:2C:3C:82:06:B2:57:30:30:07:2A:43:AF:82:31:31
   ```

---

### 방법 C: 프로덕션 빌드 (Production Build) 사용 중인 경우

**EAS Build로 생성한 keystore의 SHA-1을 사용합니다:**

1. **EAS CLI 설치** (아직 안 했다면):
   ```bash
   npm install -g eas-cli
   ```

2. **EAS 로그인**:
   ```bash
   eas login
   ```

3. **프로젝트 연결**:
   ```bash
   cd app
   eas build:configure
   ```

4. **Android 빌드 실행** (keystore 자동 생성):
   ```bash
   eas build --platform android --profile production
   ```

5. **빌드 완료 후**, EAS 대시보드에서 keystore 정보 확인:
   - https://expo.dev/accounts/[your-account]/projects/[your-project]/credentials
   - Android keystore의 SHA-1 지문 확인

---

## 3. Google Cloud Console 설정

### Step 1: OAuth 동의 화면 설정
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 프로젝트 선택 (없으면 생성)
3. **API 및 서비스** → **OAuth 동의 화면**
4. **외부** 선택 → **만들기**
5. 필수 정보 입력:
   - 앱 이름: `Save It`
   - 사용자 지원 이메일: 본인 이메일
   - 개발자 연락처 정보: 본인 이메일
6. **저장 후 계속**

### Step 2: OAuth 클라이언트 ID 생성
1. **API 및 서비스** → **사용자 인증 정보**
2. **사용자 인증 정보 만들기** → **OAuth 클라이언트 ID**
3. **애플리케이션 유형**: **Android** 선택
4. 정보 입력:
   - **이름**: `Save It Android`
   - **패키지 이름**: `com.saveit.app`
   - **SHA-1 인증서 지문**: 위에서 확인한 SHA-1 입력
5. **만들기** 클릭
6. **클라이언트 ID** 복사 (나중에 필요)

### Step 3: 웹 애플리케이션 클라이언트 ID 생성 (Supabase용)
1. **사용자 인증 정보 만들기** → **OAuth 클라이언트 ID**
2. **애플리케이션 유형**: **웹 애플리케이션** 선택
3. 정보 입력:
   - **이름**: `Save It Web`
   - **승인된 리디렉션 URI**: 
     ```
     https://qycwdncplofgzdrjtklb.supabase.co/auth/v1/callback
     ```
4. **만들기** 클릭
5. **클라이언트 ID**와 **클라이언트 보안 비밀번호** 복사

---

## 4. Supabase 설정

1. [Supabase 대시보드](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. **Authentication** → **Providers** → **Google** 클릭
4. **Enable Sign in with Google** 활성화
5. 정보 입력:
   - **Client ID (for OAuth)**: 웹 애플리케이션의 클라이언트 ID
   - **Client Secret (for OAuth)**: 웹 애플리케이션의 클라이언트 보안 비밀번호
6. **Save** 클릭

---

## 5. 테스트

앱에서 구글 로그인 버튼을 눌러 정상 작동하는지 확인합니다.

---

## 문제 해결

### SHA-1을 찾을 수 없는 경우
- **Expo Go 사용 중**: 위의 Expo 공개 키 SHA-1 사용
- **개발 빌드**: `keytool` 명령어로 확인
- **프로덕션 빌드**: EAS 대시보드에서 확인

### "패키지 이름이 일치하지 않습니다" 오류
- `app.json`의 `android.package`가 Google Cloud Console에 입력한 것과 정확히 일치하는지 확인
- 대소문자 구분 주의

### "SHA-1이 일치하지 않습니다" 오류
- 사용 중인 빌드 타입(Expo Go/개발/프로덕션)에 맞는 SHA-1을 사용했는지 확인
- 여러 SHA-1을 모두 등록할 수 있습니다 (Google Cloud Console에서 여러 개 추가 가능)
