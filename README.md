# 재고 할인 중개 플랫폼

> 여러 매장들의 재고 할인 제품을 소비자들이 구매할 수 있도록 하는 하이브리드 모바일 중개 플랫폼

[![React Native](https://img.shields.io/badge/React%20Native-0.73-blue)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-52-black)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.com/)

---

## 📖 프로젝트 개요

이 프로젝트는 재고 할인 제품을 판매하는 **업체**와 저렴한 가격에 제품을 구매하려는 **소비자**를 연결하는 중개 플랫폼입니다.

음식물 낭비를 줄이고, 소비자에게는 경제적 혜택을, 업체에게는 재고 처리 기회를 제공합니다.

---

## ✨ 핵심 기능

### 소비자 (Consumer)

- 🗺️ **업체 탐색**: 거리순/평점순으로 주변 업체 조회
- 🛒 **제품 예약**: 할인 제품을 예약하고 픽업 시간 선택
- ⭐ **리뷰 작성**: 픽업 완료 후 별점 및 리뷰 작성
- 💰 **절약 금액 추적**: 누적 절약 금액 확인
- ❤️ **즐겨찾기**: 자주 가는 업체 즐겨찾기

### 업체 (Store)

- 📦 **상품 관리**: 재고 할인 상품 등록/수정/삭제
- 💳 **캐시 관리**: 플랫폼 사용 수수료 선결제 (토스 페이먼츠)
- 📋 **예약 관리**: 실시간 예약 알림 및 관리
- 💬 **리뷰 답글**: 고객 리뷰에 답글 작성
- 📊 **통계 대시보드**: 매출, 예약 건수, 평점 확인

### 운영자 (Admin)

- 📈 **전체 통계**: 사용자, 업체, 예약 현황
- 🛡️ **콘텐츠 관리**: 리뷰 삭제, 업체 정지/해제
- ⚙️ **수수료 관리**: 업체별 수수료율 설정

---

## 🏗️ 기술 스택

### Frontend

| 카테고리 | 기술 |
|----------|------|
| Framework | React Native + Expo |
| Language | TypeScript |
| Navigation | React Navigation 6 |
| 상태 관리 | Zustand + React Query |
| UI Library | React Native Paper |
| Forms | React Hook Form + Zod |

### Backend

| 카테고리 | 기술 |
|----------|------|
| BaaS | Supabase |
| Database | PostgreSQL |
| Authentication | Supabase Auth |
| Storage | Supabase Storage |
| Serverless | Supabase Edge Functions (Deno) |

### External Services

| 서비스 | 용도 |
|--------|------|
| 토스 페이먼츠 | 업체 캐시 충전 |
| Google Maps API | 지도 표시 및 거리 계산 |
| Expo Push Notifications | 앱 푸시 알림 |
| Kakao Alimtalk | 카카오톡 알림 |
| Sentry | 에러 추적 및 모니터링 |

---

## 📂 프로젝트 구조

```
/
├── app/                      # Expo Router (파일 기반 라우팅)
│   ├── (auth)/              # 인증 관련 화면
│   ├── (consumer)/          # 소비자 앱
│   ├── (store)/             # 업체 앱
│   └── (admin)/             # 운영자 앱
│
├── src/
│   ├── components/          # 재사용 컴포넌트
│   ├── features/            # 기능별 모듈 (auth, store, product, etc.)
│   ├── hooks/               # 커스텀 훅
│   ├── lib/                 # 외부 라이브러리 설정
│   ├── store/               # 전역 상태 (Zustand)
│   ├── types/               # TypeScript 타입
│   ├── utils/               # 유틸리티 함수
│   └── constants/           # 상수
│
├── docs/                    # 설계 문서
│   ├── 01-database-schema.md
│   ├── 02-system-architecture.md
│   ├── 03-api-design.md
│   ├── 04-development-roadmap.md
│   └── 05-setup-guide.md
│
├── assets/                  # 정적 파일
├── app.json                 # Expo 설정
├── eas.json                 # EAS Build 설정
└── package.json
```

---

## 🚀 빠른 시작

### 1. 저장소 클론

```bash
git clone https://github.com/your-username/discount-marketplace.git
cd discount-marketplace
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env` 파일 생성:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
EXPO_PUBLIC_TOSS_CLIENT_KEY=your-toss-client-key
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### 4. 개발 서버 실행

```bash
npm start
```

**옵션**:
- `i`: iOS 시뮬레이터
- `a`: Android 에뮬레이터
- `w`: 웹 브라우저

---

## 📚 문서

상세한 설계 문서는 `docs/` 디렉토리에서 확인할 수 있습니다:

### 설계 문서
1. **[초보자 가이드](docs/00-beginner-guide.md)**: 개발 시작을 위한 완벽 가이드
2. **[데이터베이스 스키마](docs/01-database-schema.md)**: 테이블 구조, 인덱스, 트리거
3. **[시스템 아키텍처](docs/02-system-architecture.md)**: 전체 시스템 구성도, 폴더 구조
4. **[API 설계](docs/03-api-design.md)**: 엔드포인트 명세, 요청/응답 형식
5. **[개발 로드맵](docs/04-development-roadmap.md)**: MVP 및 단계별 개발 계획
6. **[프로젝트 초기 설정 가이드](docs/05-setup-guide.md)**: 환경 설정부터 배포까지

### 구현 가이드
7. **[리뷰 기능 통합 가이드](docs/06-review-integration-guide.md)**: App.tsx 리뷰 시스템 통합
8. **[App.tsx 참조 코드](docs/app-tsx-reference.md)**: 완전한 App.tsx 예제 코드

### 코드 예제
- **[MyReservations.tsx](docs/code-examples/MyReservations.tsx)**: 예약 내역 화면
- **[ReviewScreen.tsx](docs/code-examples/ReviewScreen.tsx)**: 리뷰 작성 화면

---

## 🎯 비즈니스 모델

### 수익 구조

```
업체 → 플랫폼: 캐시 선충전 (토스 페이먼츠)
픽업 완료 시: 거래 금액의 15% 수수료 차감 (실시간)
소비자 → 업체: 현장 결제 (카드/현금/이체)
```

### 핵심 가치

- **소비자**: 할인된 가격으로 제품 구매 → 경제적 혜택
- **업체**: 폐기 예정 재고 처리 → 손실 최소화
- **플랫폼**: 거래 수수료 → 수익 창출
- **환경**: 음식물 낭비 감소 → 사회적 가치

---

## 🔐 보안

- **인증**: Supabase Auth (JWT 토큰)
- **권한 관리**: Row Level Security (RLS)
- **API Key**: 환경 변수로 관리
- **입력 검증**: Zod 스키마 검증
- **에러 추적**: Sentry로 모니터링

---

## 🧪 테스트

### 단위 테스트

```bash
npm test
```

### E2E 테스트

```bash
npm run test:e2e
```

---

## 📦 빌드 & 배포

### 개발 빌드

```bash
eas build --profile development --platform ios
```

### 프로덕션 빌드

```bash
eas build --profile production --platform all
```

### 앱 스토어 제출

```bash
# iOS
eas submit -p ios

# Android
eas submit -p android
```

---

## 🗺️ 로드맵

### ✅ MVP (Phase 1) - 8-10주 - **100% 완료!** 🎉

- [x] 인증 시스템
- [x] 업체 탐색 (거리순/평점순)
- [x] 예약 시스템
- [x] 리뷰 시스템
- [x] 상품 관리
- [x] 캐시 관리

### 🔄 Phase 2 - 4-6주

- [ ] 지도 기반 업체 탐색
- [ ] 소셜 로그인
- [ ] 알림 구독
- [ ] 검색 기능
- [ ] 카카오톡 알림

### 📅 Phase 3 - 6-8주

- [ ] 운영자 대시보드
- [ ] 실시간 채팅
- [ ] 쿠폰/프로모션
- [ ] 다크 모드
- [ ] 다국어 지원

---

## 🤝 기여

프로젝트에 기여하고 싶으신 분은 다음 절차를 따라주세요:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 라이선스

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 팀

- **개발자**: [Your Name]
- **디자이너**: [Designer Name]
- **PM**: [PM Name]

---

## 📞 문의

- **이메일**: your-email@example.com
- **GitHub**: [@your-username](https://github.com/your-username)

---

## 🙏 감사의 말

이 프로젝트는 다음 오픈소스 프로젝트의 도움을 받았습니다:

- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [Supabase](https://supabase.com/)
- [React Navigation](https://reactnavigation.org/)

---

**Made with ❤️ by Claude Code**
