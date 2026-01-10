# 프로젝트 초기 설정 가이드

> **재고 할인 중개 플랫폼 - Setup Guide**
>
> - **Last Updated**: 2026-01-10
> - **환경**: macOS, Windows, Linux

---

## 📋 목차

1. [개발 환경 준비](#개발-환경-준비)
2. [Expo 프로젝트 생성](#expo-프로젝트-생성)
3. [Supabase 설정](#supabase-설정)
4. [외부 서비스 연동](#외부-서비스-연동)
5. [프로젝트 실행](#프로젝트-실행)
6. [배포 설정](#배포-설정)

---

## 개발 환경 준비

### 1. Node.js 설치

**필수 버전**: Node.js 18 이상

```bash
# macOS (Homebrew)
brew install node

# Windows (Node.js 공식 사이트)
# https://nodejs.org 에서 다운로드

# 버전 확인
node --version  # v18.0.0 이상
npm --version   # 9.0.0 이상
```

---

### 2. Git 설치

```bash
# macOS
brew install git

# Windows
# https://git-scm.com 에서 다운로드

# 버전 확인
git --version
```

---

### 3. 코드 에디터 설치

**추천**: Visual Studio Code

**필수 확장 프로그램**:
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- React Native Tools
- Expo Tools

---

### 4. 모바일 개발 도구 설치

#### iOS (macOS만)

```bash
# Xcode 설치 (App Store에서)
xcode-select --install

# CocoaPods 설치
sudo gem install cocoapods
```

#### Android

1. Android Studio 설치: https://developer.android.com/studio
2. Android SDK 설치 (API 33 이상)
3. 환경 변수 설정:

```bash
# ~/.zshrc 또는 ~/.bash_profile에 추가
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
# export ANDROID_HOME=$HOME/Android/Sdk  # Linux
# export ANDROID_HOME=C:\Users\{username}\AppData\Local\Android\Sdk  # Windows

export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

---

### 5. Expo CLI 설치

```bash
npm install -g expo-cli eas-cli

# 버전 확인
expo --version
eas --version
```

---

## Expo 프로젝트 생성

### 1. 프로젝트 생성

```bash
# 프로젝트 디렉토리로 이동
cd /path/to/your/workspace

# Expo 프로젝트 생성
npx create-expo-app discount-marketplace --template expo-template-blank-typescript

cd discount-marketplace
```

---

### 2. 필수 패키지 설치

```bash
# 네비게이션
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context

# 상태 관리
npm install zustand @tanstack/react-query

# Supabase
npm install @supabase/supabase-js
npm install @react-native-async-storage/async-storage

# UI 라이브러리
npm install react-native-paper
npm install react-native-vector-icons

# 폼 관리
npm install react-hook-form zod @hookform/resolvers

# 지도
npm install react-native-maps

# 이미지
npm install expo-image expo-image-picker

# 알림
npm install expo-notifications

# 위치
npm install expo-location

# 에러 추적
npm install @sentry/react-native

# 유틸리티
npm install date-fns

# 개발 도구
npm install -D @types/react @types/react-native
npm install -D eslint prettier eslint-config-prettier eslint-plugin-react
```

---

### 3. 프로젝트 구조 생성

```bash
# 폴더 생성
mkdir -p src/{components,features,hooks,lib,store,types,utils,constants}
mkdir -p src/components/{common,consumer,store}
mkdir -p src/features/{auth,store,product,reservation,review,payment,notification}
mkdir -p assets/{images,fonts,icons}

# Expo Router 설정 (파일 기반 라우팅)
mkdir -p app/{(auth),(consumer),(store),(admin)}
```

---

### 4. 환경 변수 설정

`.env` 파일 생성:

```bash
# .env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
EXPO_PUBLIC_TOSS_CLIENT_KEY=your-toss-client-key
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

`.gitignore`에 추가:

```bash
# .gitignore
.env
.env.local
```

---

### 5. TypeScript 설정

`tsconfig.json`:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

### 6. ESLint & Prettier 설정

`.eslintrc.js`:

```javascript
module.exports = {
  extends: ['expo', 'prettier'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
  },
};
```

`.prettierrc`:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

---

## Supabase 설정

### 1. Supabase 프로젝트 생성

1. https://supabase.com 접속
2. 새 프로젝트 생성
   - Project Name: `discount-marketplace`
   - Database Password: 안전한 비밀번호 설정
   - Region: `Northeast Asia (Seoul)`
3. Project URL 및 API Keys 복사

---

### 2. 데이터베이스 마이그레이션

Supabase 대시보드 → SQL Editor에서 실행:

#### Extensions 설치

```sql
-- UUID 생성
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 지리적 검색
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "earthdistance" CASCADE;
```

#### Types 생성

```sql
-- 사용자 타입
CREATE TYPE user_type AS ENUM ('consumer', 'store', 'admin');

-- 업체 상태
CREATE TYPE store_status AS ENUM ('active', 'inactive', 'suspended');

-- 캐시 상태
CREATE TYPE cash_status AS ENUM ('sufficient', 'low', 'depleted');

-- 상품 상태
CREATE TYPE product_status AS ENUM ('active', 'sold_out', 'deleted');

-- 예약 상태
CREATE TYPE reservation_status AS ENUM (
  'confirmed',
  'cancelled_by_consumer',
  'cancelled_by_store',
  'completed',
  'no_show'
);

-- 거래 타입
CREATE TYPE transaction_type AS ENUM ('charge', 'deduct', 'refund');

-- 거래 상태
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');

-- 알림 타입
CREATE TYPE notification_type AS ENUM (
  'product_registered',
  'reservation_confirmed',
  'reservation_cancelled',
  'pickup_reminder',
  'review_received',
  'cash_low',
  'cash_depleted'
);

-- 알림 채널
CREATE TYPE notification_channel AS ENUM ('push', 'kakao', 'email');

-- 구독 타입
CREATE TYPE subscription_type AS ENUM ('all_products', 'specific_product');
```

#### Tables 생성

**전체 테이블 생성 SQL은 `docs/01-database-schema.md` 참조**

---

### 3. Row Level Security (RLS) 설정

Supabase 대시보드 → Authentication → Policies에서 설정

**주요 정책**:

```sql
-- consumers: 자신의 정보만 조회/수정
ALTER TABLE consumers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "소비자는 자신의 정보만 조회" ON consumers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "소비자는 자신의 정보만 수정" ON consumers
  FOR UPDATE USING (auth.uid() = user_id);

-- stores: 모든 사용자 조회 가능, 소유자만 수정
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "모든 사용자가 업체 정보 조회" ON stores
  FOR SELECT USING (true);

CREATE POLICY "업체는 자신의 정보만 수정" ON stores
  FOR UPDATE USING (auth.uid() = user_id);
```

---

### 4. Storage 설정

Supabase 대시보드 → Storage → New Bucket:

- `products`: 상품 이미지
- `stores`: 업체 이미지
- `reviews`: 리뷰 이미지
- `avatars`: 프로필 이미지

**Public Access 설정**: 모든 버킷 Public으로 설정

---

### 5. Edge Functions 생성

```bash
# Supabase CLI 설치
npm install -g supabase

# Supabase 로그인
supabase login

# 프로젝트 링크
supabase link --project-ref your-project-ref

# Edge Function 생성
supabase functions new auth-signup
supabase functions new create-reservation
supabase functions new send-notification
supabase functions new toss-webhook
```

---

### 6. Supabase Client 설정

`src/lib/supabase.ts`:

```typescript
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

---

## 외부 서비스 연동

### 1. 토스 페이먼츠

1. https://developers.tosspayments.com 회원가입
2. 개발자 센터 → 내 애플리케이션 → 새 애플리케이션 등록
3. 클라이언트 키 발급 (.env에 추가)

**SDK 설치**:

```bash
npm install @tosspayments/payment-sdk
```

---

### 2. Google Maps API

1. https://console.cloud.google.com 접속
2. 새 프로젝트 생성
3. APIs & Services → Library → 다음 API 활성화:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Geocoding API
   - Distance Matrix API
4. Credentials → API Key 생성 (.env에 추가)

**SDK 설정**:

`app.json`:

```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
        }
      }
    },
    "ios": {
      "config": {
        "googleMapsApiKey": "YOUR_GOOGLE_MAPS_API_KEY"
      }
    }
  }
}
```

---

### 3. Expo Push Notifications

`app.json`:

```json
{
  "expo": {
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#FF6B6B",
      "androidMode": "default",
      "androidCollapsedTitle": "#{unread_notifications} new messages"
    }
  }
}
```

---

### 4. Sentry

1. https://sentry.io 회원가입
2. 새 프로젝트 생성 (React Native)
3. DSN 복사 (.env에 추가)

**설정**:

```bash
npx @sentry/wizard -i reactNative -p ios android
```

`app/_layout.tsx`:

```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 1.0,
});
```

---

## 프로젝트 실행

### 1. 개발 서버 실행

```bash
# Expo 개발 서버 시작
npx expo start

# 또는
npm start
```

**옵션**:
- `i`: iOS 시뮬레이터
- `a`: Android 에뮬레이터
- `w`: 웹 브라우저

---

### 2. 물리 기기에서 테스트

1. **Expo Go 앱 설치**
   - iOS: App Store에서 "Expo Go" 검색
   - Android: Play Store에서 "Expo Go" 검색

2. **QR 코드 스캔**
   - iOS: 카메라 앱으로 QR 코드 스캔
   - Android: Expo Go 앱에서 스캔

---

### 3. 시뮬레이터/에뮬레이터에서 실행

#### iOS Simulator (macOS만)

```bash
npx expo start --ios
```

#### Android Emulator

```bash
# Android Studio에서 에뮬레이터 실행 후
npx expo start --android
```

---

## 배포 설정

### 1. EAS Build 설정

```bash
# EAS CLI 로그인
eas login

# EAS 프로젝트 설정
eas build:configure
```

`eas.json` 파일이 자동 생성됩니다.

---

### 2. 앱 아이콘 & 스플래시 생성

`app.json`:

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    }
  }
}
```

**아이콘 크기**:
- `icon.png`: 1024x1024px
- `splash.png`: 1284x2778px

---

### 3. 빌드 실행

```bash
# 개발 빌드
eas build --profile development --platform ios

# 프로덕션 빌드
eas build --profile production --platform all
```

---

### 4. 앱 스토어 제출

```bash
# iOS App Store
eas submit -p ios

# Google Play Store
eas submit -p android
```

---

## 다음 단계

이제 모든 설정이 완료되었습니다! 🎉

1. **개발 시작**: `docs/04-development-roadmap.md` 참조
2. **데이터베이스 스키마**: `docs/01-database-schema.md` 참조
3. **API 설계**: `docs/03-api-design.md` 참조

### 첫 번째 작업: 인증 시스템 구현

```bash
# 인증 관련 파일 생성
touch src/features/auth/screens/LoginScreen.tsx
touch src/features/auth/screens/RegisterScreen.tsx
touch src/features/auth/hooks/useAuth.ts
touch src/features/auth/services/authService.ts
```

**Happy Coding! 🚀**

---

**문서 작성**: Claude Code
**최종 검토**: 2026-01-10
