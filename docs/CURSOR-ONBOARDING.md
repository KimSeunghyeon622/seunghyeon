# Cursor 프로젝트 온보딩 가이드

> **프로젝트명**: 재고 할인 중개 플랫폼 (투굿투고 유사 서비스)  
> **프로젝트 위치**: `C:\Users\user\claude-test`  
> **마지막 업데이트**: 2026-01-20  
> **현재 상태**: MVP 개발 진행 중 (90% 완료)

---

## 📋 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [프로젝트 구조](#2-프로젝트-구조)
3. [개발 환경 설정](#3-개발-환경-설정)
4. [주요 문서 위치](#4-주요-문서-위치)
5. [현재 진행 상태](#5-현재-진행-상태)
6. [다음 작업 목록](#6-다음-작업-목록)
7. [팀 운영 규칙](#7-팀-운영-규칙)
8. [테스트 환경](#8-테스트-환경)
9. [빠른 시작 가이드](#9-빠른-시작-가이드)

---

## 1. 프로젝트 개요

### 1.1 비즈니스 모델
- **목적**: 음식물 낭비 감소 + 소비자 할인 혜택 제공
- **수익 모델**: 업체 캐시 선결제 → 픽업 완료 시 15~20% 수수료 차감
- **결제 방식**: 소비자는 업체에서 현장 결제 (카드/현금/이체)

### 1.2 기술 스택
| 영역 | 기술 | 버전 |
|------|------|------|
| Frontend | React Native + Expo | SDK 54, RN 0.81.5 |
| Language | TypeScript | 5.9.2 |
| Backend | Supabase (PostgreSQL) | Latest |
| Authentication | Supabase Auth | JWT |
| 상태관리 | Zustand | 5.0.10 |
| 테스트 | Jest, Playwright MCP | - |

---

## 2. 프로젝트 구조

```
C:\Users\user\claude-test\
├── app/                          # React Native + Expo 앱
│   ├── src/
│   │   ├── api/                  # Supabase 쿼리 함수
│   │   ├── components/           # 재사용 UI 컴포넌트
│   │   ├── constants/            # Enum, 상수, 설정값
│   │   ├── hooks/                # 비즈니스 로직 커스텀 훅
│   │   ├── lib/                  # 외부 라이브러리 설정
│   │   ├── screens/              # 화면 컴포넌트 (31개)
│   │   ├── stores/               # Zustand 상태 관리
│   │   └── types/                # 전역 타입 정의
│   ├── package.json
│   ├── app.json                  # Expo 설정
│   └── .env                      # 환경변수 (Supabase)
│
├── docs/                         # 프로젝트 문서
│   ├── PRD.md                    # 제품 요구사항 정의서
│   ├── TRD.md                    # 기술명세서
│   ├── WORK-LOG.md               # 업무 이력 (⚠️ 먼저 읽기!)
│   ├── TOOL-SWITCH-LOG.md        # 툴 간 작업 이력 (⚠️ 툴 교체 시 필수 확인!)
│   ├── CODE-INSPECTION-REPORT.md # 코드 점검 보고서
│   ├── SECURITY-GUIDE.md         # 보안 가이드
│   ├── REFACTORING-GUIDE.md      # 리팩토링 가이드
│   ├── Test-Plan.md              # 테스트 계획
│   ├── TEST-DATA-GUIDE.md        # 테스트 데이터 가이드
│   └── *.sql                     # SQL 스크립트들
│
└── .claude/                      # Claude 에이전트 설정
    ├── agents/                   # 서브에이전트 정의
    │   ├── prd-agent.md          # PRD 작성 에이전트
    │   ├── trd-agent.md          # TRD 작성 에이전트
    │   ├── tdd-agent.md          # TDD 에이전트
    │   └── ux-ui-agent.md        # UX/UI 에이전트
    ├── skills/                    # 스킬 정의
    └── settings.local.json        # 권한 설정
```

---

## 3. 개발 환경 설정

### 3.1 필수 요구사항
- Node.js (LTS 버전 권장)
- npm 또는 yarn
- Expo CLI (`npm install -g expo-cli`)
- Supabase 계정 및 프로젝트

### 3.2 초기 설정

```bash
# 1. 프로젝트 디렉토리로 이동
cd C:\Users\user\claude-test\app

# 2. 의존성 설치
npm install

# 3. 환경변수 설정 (.env 파일 생성)
# Supabase URL과 Anon Key 필요
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# 4. 개발 서버 실행
npm start
# 또는
npx expo start

# 5. 웹 빌드 (E2E 테스트용)
npx expo export --platform web
```

### 3.3 MCP 서버 설정 (Cursor에서 사용)

MCP 서버는 이미 설정되어 있습니다. 확인하려면:

```bash
claude mcp list
```

**설정된 MCP 서버:**
- `playwright`: E2E 테스트 (웹 브라우저 자동화)
- `supabase`: SQL 쿼리 실행 및 검증

---

## 4. 주요 문서 위치

### 4.1 필수 읽기 문서 (우선순위 순)

1. **`docs/WORK-LOG.md`** ⭐ **가장 먼저 읽기!**
   - 프로젝트 전체 이력
   - 현재 진행 상태
   - 다음 작업 목록
   - 테스트 환경 현황

2. **`CLAUDE.md`**
   - 팀 운영 규칙
   - 에이전트 구조
   - 코드 가이드라인
   - 보안 원칙

3. **`docs/PRD.md`**
   - 제품 비전 및 목표
   - 기능 요구사항
   - 사용자 시나리오

4. **`docs/TRD.md`**
   - 기술 스택 상세
   - 아키텍처 설계
   - 보안 구현

### 4.2 참고 문서

| 문서 | 설명 |
|------|------|
| `docs/CODE-INSPECTION-REPORT.md` | PRD/TRD 기준 코드 점검 결과 |
| `docs/SECURITY-GUIDE.md` | 보안 강화 상세 가이드 |
| `docs/REFACTORING-GUIDE.md` | 코드 구조 개선 계획 |
| `docs/Test-Plan.md` | 테스트 전략 및 계획 |
| `docs/TEST-DATA-GUIDE.md` | 테스트 데이터 설정 방법 |

### 4.3 SQL 스크립트

| 파일 | 설명 |
|------|------|
| `docs/test-data-setup.sql` | 테스트 데이터 생성 (3개 업주, 12개 상품 등) |
| `docs/security-enhancement.sql` | 보안 강화 SQL (미적용) |
| `docs/supabase-cleanup-all.sql` | DB 정리 스크립트 |
| `docs/supabase-final-fix.sql` | DB 수정 스크립트 |

---

## 5. 현재 진행 상태

### 5.1 기능 구현 현황

**소비자 기능** (90% 완료)
- ✅ 로그인/회원가입
- ✅ 업체 리스트 조회
- ✅ 업체 상세 보기
- ✅ 예약하기
- ✅ 예약 내역 조회 (전화하기 기능 포함)
- ✅ 리뷰 작성
- ✅ 마이페이지 (5개 메뉴 완성)
- ✅ 즐겨찾기 (관심업체 화면)
- ✅ 작성한 리뷰 화면
- ✅ 알림 설정 화면
- ✅ FAQ 화면
- ✅ 고객센터 화면
- ❌ 지도 탐색 (미구현)
- ❌ 소셜 로그인 (미구현)
- ❌ 푸시 알림 연동 (미구현, UI만 완료)

**업주 기능** (85% 완료)
- ✅ 업주 회원가입
- ✅ 대시보드
- ✅ 상품 관리 (과거상품 검색 기능 포함)
- ✅ 캐시 관리 (영업상태 수동 변경 가능)
- ✅ 예약 관리
- ✅ 리뷰 관리
- ✅ 업체 정보 관리
- ❌ 매출 통계 (미구현)
- ❌ 재고 예측 (미구현)

### 5.2 코드 품질 상태
- **코드 구조**: 개선 필요 (컴포넌트 분리 미흡)
- **상태 관리**: 양호 (Zustand 적용)
- **타입 안전성**: 부분적 (일부 any 타입)
- **보안**: 양호 (RLS 정책 적용)
- **테스트 환경**: 부분 구축 완료

---

## 6. 다음 작업 목록

### 🔥 즉시 진행 필요

1. **MCP 서버 활용 테스트**
   - Supabase MCP: SQL 쿼리 실행 테스트
   - Playwright MCP: 웹 브라우저 자동화 테스트

2. **추가 테스트 코드 작성**
   - API 함수 테스트
   - 컴포넌트 테스트
   - (참고: Zustand 스토어 테스트는 54개 케이스 완료)

### 우선순위 높음

3. **보안 강화 SQL 적용**
   - `docs/security-enhancement.sql` 적용

4. **지도 탐색 기능 구현**
   - 카카오맵 연동

### 우선순위 중간

5. **토스페이먼츠 실결제 연동**
6. **푸시 알림 실제 연동** (Expo Push)
7. **매출 통계 기능 구현**

### 우선순위 낮음

8. **소셜 로그인 구현** (카카오/구글)
9. **운영자 대시보드 구현**

---

## 7. 팀 운영 규칙

### 7.1 에이전트 구조

이 프로젝트는 Claude의 팀장-팀원 구조로 운영됩니다:

**서브에이전트 (복잡한 작업)**
- **prd-agent**: PRD(제품 요구사항 정의서) 작성
- **ux-ui-agent**: 고객 여정 및 사용자 시나리오 설계
- **trd-agent**: 기술명세서(TRD) 작성
- **tdd-agent**: 테스트 주도 개발, 코드 품질 검증

**스킬 (정형화된 문서/작업)**
- **api-spec**: API 명세서 작성
- **erd**: ERD(엔티티 관계 다이어그램) 작성
- **ia-db**: IA 점검 보고서 및 DB 스키마 설계
- **test-plan**: 테스트 계획서 작성
- **deploy-strategy**: 배포 전략 수립
- **supabase-helper**: Supabase DB 관리
- **frontend-design**: 고품질 UI 디자인
- **webapp-testing**: Playwright 기반 웹앱 테스트

### 7.2 핵심 원칙

1. **팀장은 직접 개발하지 않음** - 모든 개발은 tdd-agent에게 위임
2. **테스트 우선** - 모든 개발은 테스트를 거쳐야 함
3. **보안 우선** - API 키 하드코딩 금지, 민감 정보 로그 금지
4. **지속적 개선** - 사용자 피드백 기반 가이드라인 업데이트

### 7.3 코드 가이드라인

**폴더 구조 (표준)**
```
src/
├── api/           # Supabase 쿼리 함수 (Data Access Layer)
├── components/    # 재사용 가능한 UI 컴포넌트
├── constants/     # Enum, 상수, 설정값
├── hooks/         # 비즈니스 로직 커스텀 훅
├── lib/           # 외부 라이브러리 설정 (supabase.ts)
├── screens/       # 화면 컴포넌트 (UI Layer)
├── stores/        # 상태 관리 (Zustand)
└── types/         # 전역 타입 정의
```

**관심사 분리 원칙**
- **화면(Screen)**: UI 렌더링만 담당, 비즈니스 로직 최소화
- **api/**: Supabase 쿼리를 함수로 추상화
- **hooks/**: 데이터 로딩, 필터링, 상태 관리 로직
- **types/**: 중복 Interface 제거, 전역 타입 통합

**하드코딩 금지**
```typescript
// Bad
if (status === 'confirmed') { ... }

// Good
import { ReservationStatus } from '../constants';
if (status === ReservationStatus.CONFIRMED) { ... }
```

**보안 가이드라인**
- 가격/금액 계산은 반드시 서버(DB 함수)에서 수행
- 재고 처리는 FOR UPDATE 행 잠금 사용
- expo-secure-store 사용 (AsyncStorage 대신)
- 환경변수(.env)로 API 키 관리

---

## 8. 테스트 환경

### 8.1 테스트 도구 현황

| 테스트 유형 | 도구 | 상태 | 비고 |
|------------|------|------|------|
| **SQL 쿼리 검증** | Supabase MCP | ✅ 준비 완료 | 새 세션에서 MCP 도구 사용 |
| **E2E 테스트** | Playwright MCP | ✅ 준비 완료 | Expo 웹 빌드 완료 (`dist/`) |
| **유닛 테스트** | Jest | ✅ 준비 완료 | `npm test` 실행 가능 |

### 8.2 테스트 실행 방법

**유닛 테스트**
```bash
cd app
npm test
# 또는
npm run test:watch    # 감시 모드
npm run test:coverage # 커버리지 리포트
```

**E2E 테스트 (Playwright MCP)**
```bash
# 1. Expo 웹 서버 실행
cd app
npx expo start --web

# 2. 새 세션에서 Playwright MCP 도구로 브라우저 자동화 테스트
# - browser_navigate: URL 이동
# - browser_click: 요소 클릭
# - browser_screenshot: 스크린샷
```

**SQL 검증 (Supabase MCP)**
```bash
# 새 세션에서 Supabase MCP 도구로 직접 쿼리 실행
# - supabase_execute_sql: SQL 쿼리 실행
```

### 8.3 테스트 데이터

테스트 데이터는 `docs/test-data-setup.sql`에 정의되어 있습니다:
- 3개 업주
- 12개 상품
- 6개 예약
- 5개 리뷰

설정 방법은 `docs/TEST-DATA-GUIDE.md` 참고.

---

## 9. 빠른 시작 가이드

### 9.1 Cursor에서 프로젝트 시작하기

1. **프로젝트 열기**
   ```
   Cursor에서 C:\Users\user\claude-test 폴더 열기
   ```

2. **필수 문서 읽기**
   - **`docs/TOOL-SWITCH-LOG.md`** - ⚠️ **툴 교체 시 반드시 먼저 확인!** (Claude에서 작업했다면 필수)
   - `docs/WORK-LOG.md` - 현재 상태 파악
   - `CLAUDE.md` - 팀 운영 규칙 확인
   - `docs/PRD.md` - 기능 요구사항 확인

3. **개발 환경 확인**
   ```bash
   cd app
   npm install  # 의존성 확인
   npm test     # 테스트 환경 확인
   ```

4. **MCP 서버 확인** (선택사항)
   ```bash
   claude mcp list
   ```

5. **다음 작업 선택**
   - `docs/WORK-LOG.md`의 "다음 작업 목록" 참고
   - 우선순위에 따라 작업 진행

### 9.2 툴 교체 시 작업 흐름 (중요!)

**Cursor와 Claude를 번갈아가며 작업할 때:**

#### 툴 교체 후 작업 시작 시 (필수)
1. **`docs/TOOL-SWITCH-LOG.md` 먼저 확인**
   - 이전 툴에서 완료된 작업 파악
   - 진행 중인 작업 상태 확인
   - 다음 작업 계획 확인
   - 주의사항 및 특이사항 확인

2. **`docs/WORK-LOG.md` 확인**
   - 전체 프로젝트 진행 상황 파악

3. **연속성 확보**
   - 이전 툴에서 진행 중이던 작업을 이어서 진행

#### 툴 교체 전 작업 종료 시 (필수)
1. **`docs/TOOL-SWITCH-LOG.md` 업데이트**
   - 완료된 작업 기록
   - 진행 중인 작업 상태 기록
   - 다음 작업 계획 기록
   - 주의사항 및 특이사항 기록

2. **`docs/WORK-LOG.md` 업데이트** (필요시)
   - 중요한 작업 완료 시 전체 이력에 기록

### 9.3 일반적인 작업 흐름

1. **작업 시작 전**
   - `docs/WORK-LOG.md` 확인하여 현재 상태 파악
   - 관련 문서 (PRD, TRD 등) 확인

2. **작업 수행**
   - 팀 운영 규칙에 따라 적절한 에이전트/스킬 활용
   - 테스트 우선 개발 원칙 준수

3. **작업 완료 후**
   - 테스트 실행 및 검증
   - `docs/WORK-LOG.md` 업데이트 (작업 이력 기록)
   - 관련 문서 업데이트 (필요시)

### 9.4 문제 해결

**의존성 오류**
```bash
cd app
rm -rf node_modules package-lock.json
npm install
```

**테스트 실패**
- `docs/Test-Plan.md` 참고
- 테스트 데이터 확인 (`docs/TEST-DATA-GUIDE.md`)

**Supabase 연결 오류**
- `.env` 파일 확인
- Supabase 프로젝트 상태 확인

**코드 구조 문제**
- `docs/REFACTORING-GUIDE.md` 참고
- `CLAUDE.md`의 코드 가이드라인 확인

---

## 10. 추가 정보

### 10.1 프로젝트 연락처/리소스

- **Supabase 프로젝트**: Supabase 대시보드에서 확인
- **환경변수**: `app/.env` 파일
- **에이전트 설정**: `.claude/agents/` 폴더
- **스킬 설정**: `.claude/skills/` 폴더

### 10.2 유용한 명령어

```bash
# 개발 서버 실행
cd app && npm start

# 웹 빌드
cd app && npx expo export --platform web

# 테스트 실행
cd app && npm test

# 린트 체크
cd app && npm run lint

# MCP 서버 확인
claude mcp list
```

### 10.3 주의사항

⚠️ **중요**: 
- API 키는 절대 하드코딩하지 않기
- 민감한 정보는 로그에 남기지 않기
- SQL 작성 시 TypeScript 타입이 아닌 실제 DB 스키마 확인하기
- 테스트는 반드시 실행하여 검증하기

---

## 11. 다음 단계

1. `docs/WORK-LOG.md` 읽기 - 프로젝트 전체 상태 파악
2. `CLAUDE.md` 읽기 - 팀 운영 규칙 이해
3. 개발 환경 설정 확인
4. 다음 작업 목록에서 우선순위 높은 작업 선택
5. 작업 시작!

---

**문의사항이나 문제가 있으면 `docs/WORK-LOG.md`의 이력을 참고하거나, 관련 문서를 확인하세요.**

**마지막 업데이트**: 2026-01-20
