# Expo Go 모바일 연결 실패 해결 가이드

## 현재 상황
- ✅ 웹에서는 정상 작동 (`npx expo start --web`)
- ❌ 스마트폰(Expo Go)에서는 "Failed to download remote update" 오류
- ✅ 개발 서버는 정상 작동 중
- ✅ 코드 자체는 문제없음

**결론**: 문제는 Expo Go 앱과 개발 서버 간의 연결입니다.

---

## 해결 방법 (우선순위 순)

### 1. Expo Go 앱 재설치 (가장 효과적) ⭐⭐⭐

**Expo Go 앱의 캐시나 손상된 데이터가 원인일 수 있습니다.**

#### Android
1. **Expo Go 앱 삭제**
   - 설정 → 앱 → Expo Go → 삭제
   - 또는 앱 아이콘 길게 누르기 → 삭제

2. **앱 스토어에서 재설치**
   - Play Store에서 "Expo Go" 검색
   - 설치

3. **앱 열기 및 연결**
   - Expo Go 앱 열기
   - 터널 모드로 실행한 서버의 QR 코드 스캔
   - 또는 URL 직접 입력

#### iOS
1. **Expo Go 앱 삭제**
   - 앱 아이콘 길게 누르기 → 삭제

2. **App Store에서 재설치**
   - App Store에서 "Expo Go" 검색
   - 설치

3. **앱 열기 및 연결**

---

### 2. 모바일 데이터로 시도 ⭐⭐

**Wi-Fi 네트워크 문제일 수 있습니다.**

1. **스마트폰의 Wi-Fi 끄기**
2. **모바일 데이터 켜기**
3. **터널 모드로 서버 실행** (이미 실행 중이면 그대로 사용)
4. **QR 코드 스캔 또는 URL 직접 입력**

**참고**: 터널 모드는 모바일 데이터에서도 작동합니다.

---

### 3. Expo Go에서 URL 직접 입력 ⭐⭐

**QR 코드 스캔이 실패하는 경우:**

1. **터미널에서 URL 확인**
   - 터널 모드 실행 시 터미널에 표시되는 URL 확인
   - 예: `exp://192.168.x.x:8081` 또는 `exp://xxx.ngrok.io:80`

2. **Expo Go 앱에서 직접 입력**
   - Expo Go 앱 열기
   - 하단의 "Enter URL manually" 또는 "연결" 메뉴 선택
   - 터미널에 표시된 URL 입력
   - 연결

---

### 4. Expo Go 앱 캐시 삭제 (Android) ⭐

**앱을 삭제하지 않고 캐시만 정리:**

1. **설정 → 앱 → Expo Go**
2. **저장 공간 → 캐시 삭제**
3. **앱 재시작**
4. **QR 코드 스캔 재시도**

---

### 5. 다른 네트워크 환경에서 시도 ⭐

**현재 네트워크 환경의 문제일 수 있습니다.**

1. **다른 Wi-Fi 네트워크로 변경**
2. **또는 모바일 데이터 사용** (터널 모드 필수)
3. **연결 시도**

---

### 6. Expo Go 버전 확인 및 재설치

**SDK 54 호환 버전인지 확인:**

1. **Expo Go 앱 열기**
2. **설정(⚙️) 메뉴로 이동**
3. **하단에 버전 정보 확인**
   - 예: "Version 54.0.6" 또는 "SDK 54"

**SDK 54가 아닌 경우:**
- SDK 54 호환 버전 재설치 필요
- 자세한 내용: `docs/EXPO-GO-VERSION-CHECK.md` 참조

---

### 7. Development Build 사용 (최후의 수단)

**Expo Go 대신 Development Build 사용:**

```powershell
# EAS Build 설치
npm install -g eas-cli

# 로그인
eas login

# Development Build 생성
eas build --profile development --platform android
# 또는
eas build --profile development --platform ios
```

**장점:**
- Expo Go 제약 없음
- 모든 네이티브 모듈 사용 가능
- SDK 버전 독립적

**단점:**
- 빌드 시간 소요 (10-20분)
- EAS 계정 필요

---

## 체크리스트

다음 순서로 시도하세요:

- [ ] **Expo Go 앱 재설치** (가장 효과적)
- [ ] 모바일 데이터로 시도 (Wi-Fi 문제 확인)
- [ ] Expo Go에서 URL 직접 입력
- [ ] Expo Go 앱 캐시 삭제 (Android)
- [ ] 다른 네트워크 환경에서 시도
- [ ] Expo Go 버전 확인 (SDK 54 호환)
- [ ] Development Build 사용 (최후의 수단)

---

## 예방 방법

1. **정기적으로 Expo Go 앱 업데이트**
2. **앱 캐시 정리** (주기적으로)
3. **안정적인 네트워크 환경 사용**
4. **터널 모드를 기본으로 사용** (네트워크 제약 없음)

---

## 요약

**가장 빠른 해결책**: Expo Go 앱 재설치

**네트워크 문제 의심 시**: 모바일 데이터로 시도

**QR 코드 스캔 실패 시**: URL 직접 입력

**지속적인 문제**: Development Build 고려
