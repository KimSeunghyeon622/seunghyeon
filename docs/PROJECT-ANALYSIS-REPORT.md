# 프로젝트 현황 분석 보고서

> **작성일**: 2026-01-16
> **프로젝트명**: 재고 할인 중개 플랫폼 (투굿투고 유사 서비스)
> **분석 대상**: GitHub 저장소, 실제 프로젝트 폴더, Word 문서

---

## 1. 프로젝트 개요

### 1.1 비즈니스 모델
- **목적**: 음식물 낭비 감소 + 소비자 할인 혜택 제공
- **수익 모델**: 업체 캐시 선결제 → 픽업 완료 시 15~20% 수수료 차감
- **결제 방식**: 소비자는 업체에서 현장 결제 (카드/현금/이체)

### 1.2 사용자 유형
| 유형 | 역할 | 구현 상태 |
|------|------|----------|
| 소비자 | 할인 상품 검색, 예약, 리뷰 | ✅ 완료 |
| 업주 | 상품 등록, 예약 관리, 캐시 관리 | ✅ 완료 |
| 운영자 | 전체 관리, 클레임 처리 | ❌ 미구현 |

### 1.3 기술 스택
| 영역 | 기술 | 버전 |
|------|------|------|
| Frontend | React Native + Expo | SDK 54, RN 0.81.5 |
| Language | TypeScript | 5.9.2 |
| Backend | Supabase (PostgreSQL) | Latest |
| Authentication | Supabase Auth | JWT |
| 예정 | 토스페이먼츠, 카카오맵 | 미연동 |

---

## 2. 현재 프로젝트 구조

### 2.1 실제 프로젝트 위치
```
C:\Users\user\OneDrive\바탕 화면\투굿투고\myapp\
```

### 2.2 폴더 구조
```
myapp/
├── App.tsx                    # 메인 앱 (통합 네비게이션)
├── app.json                   # Expo 설정
├── package.json               # 의존성
├── .env                       # 환경변수 (Supabase)
├── src/
│   ├── lib/
│   │   └── supabase.ts       # Supabase 클라이언트
│   ├── screens/              # 27개 화면 파일
│   │   ├── LoginScreen.tsx
│   │   ├── ConsumerSignupScreen.tsx
│   │   ├── StoreSignupScreen.tsx
│   │   ├── StoreListHome.tsx
│   │   ├── StoreDetail.tsx
│   │   ├── ReservationScreen.tsx
│   │   ├── MyReservations.tsx
│   │   ├── ReviewScreen.tsx
│   │   ├── MyPageScreen.tsx
│   │   ├── StoreDashboard.tsx
│   │   ├── StoreProductManagement.tsx
│   │   ├── StoreCashManagement.tsx
│   │   ├── StoreReservationManagement.tsx
│   │   ├── StoreReviewManagement.tsx
│   │   └── ... (기타)
│   └── components/           # 공통 컴포넌트
├── assets/                   # 정적 파일
└── node_modules/
```

### 2.3 GitHub 저장소
- **초기 브랜치**: `claude/marketplace-architecture-design-bbYHF`
- **최신 브랜치**: `claude/continue-platform-dev-GZurO`
- **내용**: 주로 문서와 가이드, 코드 예제 (실행 가능한 프로젝트 아님)

---

## 3. 구현 현황

### 3.1 완료된 기능 (문서 기준 MVP 90%)

#### 소비자 기능
| 기능 | 파일 | 상태 |
|------|------|------|
| 로그인 | LoginScreen.tsx | ✅ |
| 소비자 회원가입 | ConsumerSignupScreen.tsx | ✅ |
| 업체 리스트 | StoreListHome.tsx | ✅ |
| 업체 상세 | StoreDetail.tsx | ✅ |
| 예약하기 | ReservationScreen.tsx | ✅ |
| 예약 내역 | MyReservations.tsx | ✅ |
| 리뷰 작성 | ReviewScreen.tsx | ✅ |
| 마이페이지 | MyPageScreen.tsx | ✅ |

#### 업주 기능
| 기능 | 파일 | 상태 |
|------|------|------|
| 업주 회원가입 | StoreSignupScreen.tsx | ✅ |
| 대시보드 | StoreDashboard.tsx | ✅ |
| 상품 관리 | StoreProductManagement.tsx | ✅ |
| 캐시 관리 | StoreCashManagement.tsx | ✅ |
| 캐시 내역 | StoreCashHistory.tsx | ✅ |
| 예약 관리 | StoreReservationManagement.tsx | ✅ |
| 리뷰 관리 | StoreReviewManagement.tsx | ✅ |
| 업체 정보 | StoreInfoManagement.tsx | ✅ |
| 단골 고객 | StoreRegularCustomers.tsx | ✅ |

### 3.2 미구현 기능

| 기능 | 우선순위 | 비고 |
|------|----------|------|
| 지도 기반 탐색 | 높음 | 카카오/구글 맵 연동 필요 |
| 실결제 연동 | 높음 | 토스페이먼츠 연동 필요 |
| 푸시 알림 | 중간 | Expo Push, 카카오 알림톡 |
| 운영자 대시보드 | 중간 | 전체 관리 기능 |
| 소셜 로그인 | 낮음 | 카카오, 구글 |
| 즐겨찾기 | 낮음 | 업체 즐겨찾기 |
| 검색 기능 | 중간 | 업체/상품 검색 |

---

## 4. 발견된 문제점

### 4.1 코드 관리 문제

#### 문제 1: 코드 분산
```
- 실제 앱: C:\...\투굿투고\myapp\
- GitHub: 문서와 가이드만 저장
- 코드 동기화 방식: 수동 복사-붙여넣기
```

**위험**: 버전 관리 어려움, 코드 유실 가능성

#### 문제 2: 중복 파일
```
GitHub 저장소 내:
- StoreProductManagement.tsx
- StoreProductManagement-FIXED.tsx
- StoreProductManagement-NEW.tsx
- StoreProductManagement-WITH-IMAGE.tsx
```

**위험**: 어떤 파일이 최신인지 혼란

#### 문제 3: 테스트 부재
- 자동화된 테스트 없음
- 수동 Expo 테스트만 진행
- 품질 보증 체계 없음

### 4.2 아키텍처 문제

#### 문제 4: 네비게이션 구조
- Expo Router 미사용 (파일 기반 라우팅 X)
- App.tsx에서 수동 상태 관리로 화면 전환
- 확장성 제한

#### 문제 5: 상태 관리
- 전역 상태 관리 라이브러리 없음
- useState로만 관리
- 복잡한 상태 흐름 어려움

---

## 5. 경쟁사 분석 인사이트 (Word 문서 기반)

### 5.1 주요 경쟁사
| 서비스 | 특징 | 참고 포인트 |
|--------|------|------------|
| Too Good To Go | 글로벌, 서프라이즈 백 | 지구 보호 메시지 |
| 럭키밀 | 50%+ 할인, Bubble MVP | 선물/행운 브랜딩 |
| 마감 히어로 | 30초 상품 등록 | 매장 추천 버튼 |
| 라스트 오더 | 실재고 미연동 문제 | 반면교사 |

### 5.2 핵심 교훈 (라스트 오더 리뷰 분석)
1. **재고 신뢰**: 결제 전 재고 확정 필수
2. **가격 신뢰**: 정가 증빙 필요
3. **품질 기준**: D-몇일, 제조일 표시 의무
4. **환불 신속**: 자동 환불 (수동 CS 배제)
5. **픽업 전용**: 배송 확장은 나중에

---

## 6. 요구사항 vs 구현 갭 분석

### 6.1 소비자 시나리오 매칭

| 요구사항 (Word) | 구현 상태 | 갭 |
|----------------|----------|-----|
| 거리순 업체 리스트 | ✅ | - |
| 지도 기반 탐색 | ❌ | 지도 API 연동 필요 |
| 즐겨찾기 | ❌ | 미구현 |
| 예약 시 수량 차감 | ✅ | - |
| 60분 내 예약 취소 | ❓ | 확인 필요 |
| 픽업 완료 버튼 | ✅ | - |
| 누적 절약 금액 | ❓ | 확인 필요 |
| 알림 구독 | ❌ | 미구현 |

### 6.2 업주 시나리오 매칭

| 요구사항 (Word) | 구현 상태 | 갭 |
|----------------|----------|-----|
| 상품 등록 (정가/할인가/수량) | ✅ | - |
| 제조일/소비기한 자동 설정 | ❓ | 확인 필요 |
| 예약 취소 조건 (30분/2시간 규칙) | ❓ | 확인 필요 |
| 캐시 충전 | ✅ | 실결제 미연동 |
| 캐시 1만원 미만 시 비활성화 | ❓ | 확인 필요 |
| 영업시간 외 비활성화 | ❓ | 확인 필요 |

---

## 7. 권장 조치

### 7.1 즉시 조치 (1단계)

1. **프로젝트 통합**
   - 실제 앱 코드를 이 작업 폴더로 이동
   - Git으로 버전 관리 시작
   - 중복 파일 정리

2. **문서 체계화**
   - PRD 정리 (요구사항 문서)
   - TRD 정리 (기술 문서)
   - API 명세 정리

3. **테스트 환경 구축**
   - 테스트 계정 생성
   - 기본 테스트 시나리오 작성

### 7.2 단기 조치 (2단계)

1. **코드 리팩토링**
   - 네비게이션 구조 개선 (Expo Router 적용 검토)
   - 상태 관리 라이브러리 도입 (Zustand 권장)
   - 공통 컴포넌트 분리

2. **핵심 기능 완성**
   - 지도 연동 (카카오맵)
   - 결제 연동 (토스페이먼츠)
   - 알림 시스템

### 7.3 장기 조치 (3단계)

1. **운영자 기능**
2. **성능 최적화**
3. **테스트 자동화**

---

## 8. 다음 단계

팀장으로서 다음 순서로 진행할 것을 제안합니다:

1. **프로젝트 통합**: 실제 앱 코드를 현재 작업 폴더로 이동
2. **PRD 정리**: PRD 에이전트 호출하여 요구사항 문서화
3. **TRD 정리**: TRD 에이전트 호출하여 기술 문서화
4. **테스트 환경 구축**: TDD 에이전트와 협력하여 테스트 체계 수립
5. **개발 재개**: 미구현 기능 순차적 개발

---

**다음 액션**: 사용자 확인 후 프로젝트 통합 진행
