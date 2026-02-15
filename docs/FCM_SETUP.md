# Firebase Cloud Messaging (FCM) 설정 가이드

## 개요
푸시 알림 기능을 위한 Firebase Cloud Messaging 설정 가이드입니다.

---

## 1단계: Firebase 프로젝트 생성

### 1.1 Firebase Console 접속
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. Google 계정으로 로그인

### 1.2 프로젝트 생성
1. **프로젝트 추가** 클릭
2. 프로젝트 이름 입력: `SaveIt` (또는 원하는 이름)
3. Google Analytics 설정 (선택사항 - 비활성화 가능)
4. **프로젝트 만들기** 클릭

---

## 2단계: Android 앱 등록

### 2.1 앱 추가
1. Firebase 프로젝트 대시보드에서 **Android 아이콘** 클릭
2. 다음 정보 입력:

| 필드 | 값 |
|------|-----|
| Android 패키지 이름 | `com.saveit.app` |
| 앱 닉네임 (선택) | `SaveIt Android` |
| 디버그 서명 인증서 SHA-1 (선택) | 나중에 추가 가능 |

3. **앱 등록** 클릭

### 2.2 google-services.json 다운로드
1. **google-services.json 다운로드** 버튼 클릭
2. 파일 저장

### 2.3 파일 배치
다운로드한 `google-services.json` 파일을 앱 루트 디렉토리에 배치:

```
claude-test/
└── app/
    ├── google-services.json  ← 여기에 배치
    ├── app.json
    ├── package.json
    └── ...
```

---

## 3단계: iOS 앱 등록 (선택)

### 3.1 앱 추가
1. Firebase 프로젝트 대시보드에서 **iOS 아이콘** 클릭
2. 다음 정보 입력:

| 필드 | 값 |
|------|-----|
| Apple 번들 ID | `com.saveit.app` |
| 앱 닉네임 (선택) | `SaveIt iOS` |
| App Store ID (선택) | 나중에 추가 |

3. **앱 등록** 클릭

### 3.2 GoogleService-Info.plist 다운로드
1. **GoogleService-Info.plist 다운로드** 버튼 클릭
2. 앱 루트 디렉토리에 배치

---

## 4단계: app.json 설정

### 4.1 Android FCM 설정
`app.json`의 `android` 섹션에 추가:

```json
{
  "expo": {
    "android": {
      "package": "com.saveit.app",
      "googleServicesFile": "./google-services.json",
      "adaptiveIcon": {
        ...
      }
    }
  }
}
```

### 4.2 iOS FCM 설정 (선택)
`app.json`의 `ios` 섹션에 추가:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.saveit.app",
      "googleServicesFile": "./GoogleService-Info.plist",
      "supportsTablet": true
    }
  }
}
```

### 4.3 전체 app.json 예시 (FCM 설정 포함)

```json
{
  "expo": {
    "name": "myapp",
    "slug": "myapp",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "myapp",
    "userInterfaceStyle": "automatic",
    "ios": {
      "bundleIdentifier": "com.saveit.app",
      "googleServicesFile": "./GoogleService-Info.plist",
      "supportsTablet": true
    },
    "android": {
      "package": "com.saveit.app",
      "googleServicesFile": "./google-services.json",
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundImage": "./assets/images/android-icon-background.png",
        "monochromeImage": "./assets/images/android-icon-monochrome.png"
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false,
      "newArchEnabled": true
    },
    "plugins": [
      "expo-router",
      ["expo-splash-screen", { ... }],
      "expo-secure-store",
      "@react-native-community/datetimepicker",
      ["expo-build-properties", { ... }],
      ["@react-native-kakao/core", { "nativeAppKey": "..." }]
    ],
    ...
  }
}
```

---

## 5단계: EAS 빌드

### 5.1 개발 빌드 생성
```bash
# Android 개발 빌드
eas build --profile development --platform android

# iOS 개발 빌드 (Mac 필요)
eas build --profile development --platform ios
```

### 5.2 빌드 완료 후 설치
1. 빌드 완료 시 QR 코드 또는 다운로드 링크 제공
2. 실기기에 설치

### 5.3 개발 서버 실행
```bash
npx expo start --dev-client -c
```

---

## 6단계: 테스트

### 6.1 푸시 토큰 확인
앱 실행 후 콘솔에서 푸시 토큰이 정상 발급되는지 확인:
```
푸시 토큰 발급 성공: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
```

### 6.2 오류 해결

| 오류 | 원인 | 해결 |
|------|------|------|
| `FirebaseApp is not initialized` | google-services.json 미설정 | 파일 배치 + EAS 재빌드 |
| `Push token registration failed` | 권한 미허용 | 앱 설정에서 알림 권한 허용 |

---

## 체크리스트

- [ ] Firebase 프로젝트 생성 완료
- [ ] Android 앱 등록 완료
- [ ] `google-services.json` 다운로드
- [ ] `google-services.json` 앱 루트에 배치
- [ ] `app.json`에 `googleServicesFile` 추가
- [ ] (선택) iOS 앱 등록 + `GoogleService-Info.plist` 배치
- [ ] EAS 개발 빌드 생성
- [ ] 실기기 설치 및 테스트

---

## 참고 링크

- [Expo Push Notifications 공식 가이드](https://docs.expo.dev/push-notifications/overview/)
- [Expo FCM Credentials 설정](https://docs.expo.dev/push-notifications/fcm-credentials/)
- [Firebase Console](https://console.firebase.google.com/)
