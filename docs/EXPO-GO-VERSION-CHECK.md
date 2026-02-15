# Expo Go 버전 확인 및 SDK 54 호환 버전 설치 가이드

## 현재 상황
- 프로젝트: Expo SDK 54.0.31
- Expo Go: 54.0.6 (사용자 확인)
- 문제: QR 코드 스캔 후 경고 화면 표시

## Expo Go 버전 확인 방법

### Android
1. Expo Go 앱 열기
2. 설정(⚙️) 메뉴로 이동
3. 하단에 버전 정보 표시 (예: "Version 54.0.6" 또는 "SDK 54")

### iOS
1. Expo Go 앱 열기
2. 설정(⚙️) 메뉴로 이동
3. 하단에 버전 정보 표시

## SDK 54 호환 Expo Go 버전 설치 방법

### 방법 1: Expo Go SDK 54 버전 직접 다운로드 (Android)

1. **APK 파일 다운로드**
   - Expo 공식 GitHub Releases에서 SDK 54 호환 버전 찾기
   - 또는 APKMirror 같은 신뢰할 수 있는 사이트에서 다운로드
   - 검색어: "Expo Go SDK 54 APK"

2. **APK 설치**
   - 기존 Expo Go 앱 삭제 (선택사항)
   - 다운로드한 APK 파일 실행
   - "알 수 없는 소스" 허용 (필요시)
   - 설치 완료

### 방법 2: Play Store에서 이전 버전 설치 (Android)

1. **APK 다운로드 사이트 사용**
   - APKMirror (https://www.apkmirror.com/)
   - 검색: "Expo Go"
   - SDK 54를 지원하는 버전 선택 (보통 2024년 중반 버전)
   - 다운로드 및 설치

### 방법 3: iOS TestFlight (iOS)

1. Expo 공식 TestFlight 프로그램 참여
2. SDK 54 호환 버전이 있는지 확인
3. 설치

## 프로젝트 연결 확인

### 정상 연결 확인 방법

1. **개발 서버 실행**
   ```powershell
   cd app
   npm start
   ```

2. **QR 코드 스캔 후 확인사항**
   - 경고 배너는 무시하고 계속 진행
   - 앱이 실제로 로드되는지 확인
   - 개발 서버 터미널에 연결 로그 확인

3. **연결 성공 신호**
   - Expo Go에서 앱 화면이 표시됨
   - 개발 서버 터미널에 "Connected" 메시지
   - 코드 변경 시 자동 리로드 동작

### 연결 실패 시 확인사항

1. **개발 서버 로그 확인**
   - 터미널에 에러 메시지가 있는지 확인
   - SDK 버전 불일치 오류 확인

2. **Expo Go 앱 로그 확인**
   - 연결 시도 후 에러 메시지 확인
   - "SDK version mismatch" 같은 오류 확인

## 대안: Development Build 사용

Expo Go 대신 Development Build을 사용하면 SDK 버전 문제를 피할 수 있습니다.

### Development Build 생성

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

### 장점
- Expo Go 제약 없음
- 모든 네이티브 모듈 사용 가능
- SDK 버전 독립적

### 단점
- 빌드 시간 소요 (10-20분)
- EAS 계정 필요

## 문제 해결 체크리스트

- [ ] Expo Go 앱 버전 확인 (설정 메뉴)
- [ ] SDK 54 호환 버전인지 확인
- [ ] 개발 서버가 정상 실행되는지 확인
- [ ] 같은 Wi-Fi 네트워크에 연결되어 있는지 확인
- [ ] QR 코드 스캔 후 실제 앱 로드 여부 확인
- [ ] 개발 서버 터미널 로그 확인
- [ ] Expo Go 앱에서 에러 메시지 확인

## 다음 단계

1. Expo Go 버전 확인
2. SDK 54 호환 버전이 아니면 재설치
3. 프로젝트 연결 재시도
4. 여전히 문제가 있으면 Development Build 고려
