# Expo Go "Something went wrong" 에러 디버깅 가이드

## 현재 상황
- Expo Go 54.0.6 사용 중 (SDK 54 호환)
- 프로젝트: Expo SDK 54.0.31
- 문제: QR 코드 스캔 또는 URL 입력 후 "Something went wrong" 에러 화면 표시

---

## 🔍 단계별 디버깅 방법

### 1단계: 개발 서버 상태 확인

**터미널에서 개발 서버 실행 상태 확인:**

```powershell
cd app
npm start
```

**확인 사항:**
- [ ] 개발 서버가 정상적으로 시작되는지
- [ ] QR 코드가 표시되는지
- [ ] 터미널에 에러 메시지가 있는지
- [ ] "Metro waiting on..." 메시지가 표시되는지

**예상되는 정상 출력:**
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

---

### 2단계: Expo Go에서 에러 로그 확인

**Expo Go 앱에서:**
1. "Something went wrong" 화면에서 **"View error log"** 클릭
2. 에러 로그 내용 확인
3. 에러 로그 내용을 복사하여 저장

**주요 확인 사항:**
- SDK 버전 불일치 오류
- 모듈을 찾을 수 없다는 오류
- 환경 변수 관련 오류
- 네트워크 연결 오류

---

### 3단계: 환경 변수 확인

**`.env` 파일 확인:**

```powershell
# app/.env 파일이 존재하는지 확인
cd app
dir .env
```

**필수 환경 변수:**
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**확인 사항:**
- [ ] `.env` 파일이 존재하는지
- [ ] 환경 변수가 올바르게 설정되어 있는지
- [ ] `EXPO_PUBLIC_` 접두사가 있는지 (Expo에서는 필수)

---

### 4단계: 네트워크 연결 확인

**같은 Wi-Fi 네트워크 확인:**
- [ ] PC와 모바일 기기가 같은 Wi-Fi에 연결되어 있는지
- [ ] 방화벽이 포트 8081을 차단하지 않는지

**대안: 터널 모드 사용**

```powershell
cd app
npx expo start --tunnel
```

터널 모드는 다른 네트워크에서도 작동하지만 느릴 수 있습니다.

---

### 5단계: 프로젝트 코드 확인

**주요 확인 파일:**

1. **`app/index.js`** - 진입점
2. **`app/App.tsx`** - 메인 앱 컴포넌트
3. **`app/src/lib/supabase.ts`** - Supabase 초기화

**확인 사항:**
- [ ] 모든 import 경로가 올바른지
- [ ] 환경 변수를 올바르게 사용하는지
- [ ] 필수 의존성이 설치되어 있는지

---

### 6단계: 캐시 정리 및 재설치

**Metro bundler 캐시 정리:**

```powershell
cd app
npx expo start --clear
```

**의존성 재설치:**

```powershell
cd app
rm -rf node_modules package-lock.json
npm install
npx expo start --clear
```

---

### 7단계: 웹에서 테스트 (대안)

**웹 빌드로 문제 격리:**

```powershell
cd app
npx expo start --web
```

웹에서 정상 작동하면 Expo Go 연결 문제일 가능성이 높습니다.

---

## 🐛 일반적인 원인 및 해결 방법

### 원인 1: 환경 변수 누락 또는 오류

**증상:**
- "Cannot read property 'createClient' of undefined"
- "SUPABASE_URL is not defined"

**해결:**
1. `app/.env` 파일 확인
2. `EXPO_PUBLIC_` 접두사 확인
3. 개발 서버 재시작

### 원인 2: SDK 버전 불일치

**증상:**
- "SDK version mismatch"
- "This project requires Expo SDK X"

**해결:**
1. Expo Go 버전 확인 (설정 메뉴)
2. 프로젝트 SDK 버전 확인 (`package.json`의 `expo` 버전)
3. 호환되는 Expo Go 버전 설치

### 원인 3: 네트워크 연결 문제 (가장 흔한 원인)

**증상:**
- "Unable to connect to development server"
- "Network request failed"
- **"Failed to download remote update"** ⭐ 현재 발생한 오류

**해결:**
1. **터널 모드 사용** (`npx expo start --tunnel`) - 가장 효과적
2. 같은 Wi-Fi 네트워크 확인
3. 방화벽 설정 확인 (포트 8081 허용)
4. 개발 서버 재시작 (`--clear` 옵션 사용)
5. Expo Go 앱 완전 재시작

### 원인 4: 모듈을 찾을 수 없음

**증상:**
- "Cannot find module 'xxx'"
- "Module not found"

**해결:**
1. `npm install` 재실행
2. `node_modules` 삭제 후 재설치
3. 캐시 정리 (`--clear`)

### 원인 5: 코드 에러

**증상:**
- 특정 파일에서 에러 발생
- 빌드 실패

**해결:**
1. 에러 로그 확인
2. 해당 파일 수정
3. 개발 서버 재시작

---

## 📋 체크리스트

### 개발 서버 실행 전
- [ ] `app` 디렉토리로 이동
- [ ] `npm install` 완료 확인
- [ ] `.env` 파일 존재 및 올바른 값 확인

### 개발 서버 실행 중
- [ ] 터미널에 QR 코드 표시 확인
- [ ] 에러 메시지 없음 확인
- [ ] "Metro waiting on..." 메시지 확인

### Expo Go 연결 시
- [ ] 같은 Wi-Fi 네트워크 확인
- [ ] QR 코드 스캔 또는 URL 입력
- [ ] 연결 시도 후 에러 로그 확인

### 문제 발생 시
- [ ] "View error log"에서 에러 내용 확인
- [ ] 개발 서버 터미널 로그 확인
- [ ] 위의 단계별 디버깅 방법 따라하기

---

## 🔧 즉시 시도할 수 있는 해결 방법

### 방법 1: 개발 서버 재시작 (캐시 정리) ⭐ 가장 먼저 시도

```powershell
cd app
npx expo start --clear
```

**중요**: 기존 개발 서버가 실행 중이면 `Ctrl+C`로 중지한 후 실행

### 방법 2: 터널 모드 사용 (네트워크 문제 해결) ⭐ 권장

```powershell
cd app
npx expo start --tunnel
```

터널 모드는 다른 네트워크에서도 작동하며, 방화벽 문제를 우회할 수 있습니다.

### 방법 3: LAN 모드로 재시작

```powershell
cd app
npx expo start --lan
```

같은 네트워크에서 명시적으로 LAN 모드로 실행

### 방법 4: Expo Go 앱 재시작

1. Expo Go 앱 완전 종료 (백그라운드에서도 종료)
2. 앱 다시 열기
3. QR 코드 재스캔 또는 URL 재입력

### 방법 5: 웹에서 확인 (문제 격리)

```powershell
cd app
npx expo start --web
```

웹에서 정상 작동하면 Expo Go 연결 문제일 가능성이 높습니다.

### 방법 6: Metro bundler 완전 재시작

```powershell
cd app
# 기존 프로세스 종료
# Windows: 작업 관리자에서 node.exe 프로세스 종료
# 또는 터미널에서 Ctrl+C

# 캐시 완전 정리
npx expo start --clear

# 또는 watchman 캐시 정리 (설치되어 있다면)
watchman watch-del-all
```

---

## 🚨 "Failed to download remote update" 오류 특별 해결 가이드

**현재 발생한 오류**: `java.io.IOException: Failed to download remote update`

이 오류는 Expo Go가 개발 서버에서 JavaScript 번들을 다운로드하는 데 실패했다는 의미입니다.

---

## 🚨 "ngrok tunnel took too long to connect" 오류 해결 가이드

**현재 발생한 오류**: `CommandError: ngrok tunnel took too long to connect.`

이 오류는 Expo가 ngrok 터널을 설정하는 데 시간이 너무 오래 걸렸다는 의미입니다.

### 즉시 시도할 해결 방법 (우선순위 순)

#### 1. LAN 모드로 시도 (가장 빠른 해결) ⭐⭐⭐

```powershell
cd app
npx expo start --lan
```

**조건**: PC와 모바일 기기가 같은 Wi-Fi에 연결되어 있어야 합니다.

#### 2. 캐시 정리 후 터널 모드 재시도 ⭐⭐

```powershell
cd app
# 기존 서버 중지 (Ctrl+C)
npx expo start --tunnel --clear
```

#### 3. Expo CLI 업데이트

```powershell
npm install -g expo-cli@latest
# 또는
npm install -g @expo/cli@latest
```

#### 4. 네트워크 확인

- 인터넷 연결 상태 확인
- 방화벽/프록시 설정 확인
- VPN 사용 중이라면 일시적으로 끄고 시도

#### 5. 잠시 후 재시도

ngrok 서비스가 일시적으로 과부하 상태일 수 있습니다. 5-10분 후 다시 시도해보세요.

#### 6. 대안: 웹에서 테스트

```powershell
cd app
npx expo start --web
```

웹에서 정상 작동하면 네트워크/터널 문제일 가능성이 높습니다.

---

## 🚨 "Failed to download remote update" 오류 특별 해결 가이드

**발생한 오류**: `java.io.IOException: Failed to download remote update`

이 오류는 Expo Go가 개발 서버에서 JavaScript 번들을 다운로드하는 데 실패했다는 의미입니다.

### 즉시 시도할 해결 방법 (우선순위 순)

#### 1. 터널 모드로 재시작 (가장 효과적) ⭐⭐⭐

```powershell
cd app
npx expo start --tunnel
```

터널 모드는 Expo의 서버를 통해 연결하므로 네트워크/방화벽 문제를 우회할 수 있습니다.

#### 2. 개발 서버 완전 재시작 (캐시 정리)

```powershell
cd app
# 기존 서버 중지 (Ctrl+C)
npx expo start --clear
```

#### 3. Expo Go 앱 완전 재시작

1. Expo Go 앱 완전 종료 (백그라운드 포함)
2. 앱 다시 열기
3. 터널 모드로 실행한 서버의 QR 코드 스캔

#### 4. 네트워크 확인

- PC와 모바일이 같은 Wi-Fi에 연결되어 있는지 확인
- 방화벽이 포트 8081을 차단하지 않는지 확인
- 회사/학교 네트워크라면 방화벽 정책 확인

#### 5. LAN 모드로 재시작

```powershell
cd app
npx expo start --lan
```

### 추가 확인 사항

**개발 서버 터미널 확인:**
- QR 코드가 정상적으로 표시되는지
- "Metro waiting on..." 메시지가 있는지
- 에러 메시지가 없는지

**Expo Go 연결 시:**
- 터널 모드로 실행한 경우 QR 코드가 `exp://`로 시작하는지 확인
- 일반 모드로 실행한 경우 `exp://192.168.x.x:8081` 형식인지 확인

---

## 📞 다음 단계

위의 방법들을 시도한 후에도 문제가 해결되지 않으면:

1. **개발 서버 터미널 로그 공유** - 터미널에 표시된 전체 메시지
2. **터널 모드 시도 결과** - 터널 모드로 실행했을 때의 결과
3. **네트워크 환경**:
   - 같은 Wi-Fi인지
   - 회사/학교 네트워크인지
   - 방화벽 사용 여부

---

**중요**: "Failed to download remote update" 오류는 대부분 네트워크 연결 문제입니다. **터널 모드(`--tunnel`)를 사용하면 대부분 해결됩니다.**
