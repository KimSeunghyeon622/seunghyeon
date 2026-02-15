# Cursor User Rules

> **이 문서는 CLAUDE.md를 보완합니다.**
> **팀장 핵심 규칙, 위임 원칙, 보고 형식은 `CLAUDE.md`를 참조하세요.**

---

## 🚨 최우선 규칙 (CLAUDE.md에서 상세 확인)

1. **팀장 직접 코딩 금지** - 모든 코드 작업은 팀원에게 위임
2. **담당 팀원 필수 명시** - 보고서에 담당자 없으면 무효
3. **MCP 직접 실행** - 사용자에게 실행 요청하지 않음

**상세 규칙**: `CLAUDE.md` 참조

---

## 세션 시작 프로세스 (MANDATORY)

### 자동 확인 (사용자 요청 불필요)

1. **파일 자동 읽기**
   - `docs/TOOL-SWITCH-LOG.md` (툴 교체 시)
   - `docs/WORK-LOG.md` (최근 업데이트)
   - `CLAUDE.md` (팀 규칙)

2. **자동 보고**
   ```markdown
   ## ✅ 프로젝트 상태 확인 완료
   - 확인한 문서: [목록]
   - 현재 상태: [요약]
   - 다음 작업: [계획]
   ```

---

## 팀 구조

### 에이전트 (`.claude/agents/`)
| 에이전트 | 담당 업무 |
|---------|----------|
| `prd-agent` | PRD 작성 |
| `trd-agent` | TRD 작성 |
| `tdd-agent` | **코드 작성/수정**, 테스트, SQL |
| `ux-ui-agent` | UI/UX 설계 |

### 스킬 (`.claude/skills/`)
| 스킬 | 담당 업무 |
|-----|----------|
| `supabase-helper` | DB 관리, SQL 실행 |
| `frontend-design` | UI 디자인 |
| `test-plan` | 테스트 계획 |
| `api-spec` | API 명세 |
| `deploy-strategy` | 배포 전략 |

---

## 작업 위임 가이드

### 작업 → 담당 팀원 매핑

| 작업 유형 | 담당 팀원 | 팀장 직접 가능? |
|----------|----------|----------------|
| 코드 작성/수정 | `tdd-agent` | ❌ 불가 |
| SQL 스크립트 | `tdd-agent` / `supabase-helper` | ❌ 불가 |
| UI 디자인 | `frontend-design` | ❌ 불가 |
| PRD 작성 | `prd-agent` | ⚠️ 가능하나 위임 권장 |
| TRD 작성 | `trd-agent` | ⚠️ 가능하나 위임 권장 |

### 팀원 활용 방법

1. **가이드라인 파일 읽기**
   ```
   코드 작업 → .claude/agents/tdd-agent.md
   SQL 작업 → .claude/skills/supabase-helper/SKILL.md
   UI 작업 → .claude/skills/frontend-design/SKILL.md
   ```

2. **작업 위임 후 검증**
   - 타입 체크 실행
   - 테스트 실행
   - SQL 결과 확인

---

## 보안 가이드라인

### 필수 준수
- 가격/금액 계산: 서버(DB 함수)에서만
- 재고 처리: FOR UPDATE 행 잠금 사용
- 인증 토큰: expo-secure-store 사용
- API 키: 환경변수(.env) 관리, 하드코딩 금지

### RLS 정책
- 모든 테이블에 RLS 활성화
- 민감 컬럼은 본인만 조회 가능

---

## 코드 아키텍처

### 폴더 구조 (표준)
```
src/
├── api/        # Supabase 쿼리 함수
├── components/ # 재사용 UI 컴포넌트
├── constants/  # Enum, 상수
├── hooks/      # 비즈니스 로직 훅
├── lib/        # 외부 라이브러리 설정
├── screens/    # 화면 컴포넌트
├── stores/     # Zustand 상태 관리
└── types/      # 타입 정의
```

### 원칙
- 화면(Screen): UI만, 비즈니스 로직 최소화
- api/: Supabase 쿼리 추상화
- hooks/: 데이터 로딩, 상태 관리
- 하드코딩 금지: constants/ 사용

---

## SQL 작성 원칙

### TypeScript ≠ DB 스키마

SQL 작성 시 반드시:
1. 기존 코드에서 쿼리 확인 (Grep 사용)
2. NOT NULL 제약 확인
3. CHECK 제약 확인
4. 컬럼명 확인 (`is_open` vs `is_closed`)
5. 타입 캐스팅 (`'09:00'::TIME`)

**절대 금지**: `types/*.ts`만 보고 SQL 작성

---

## 문제 발생 시 규칙 업데이트

### 프로세스
1. 근본 원인 파악
2. 관련 가이드라인 파일 확인
3. 규칙 추가/업데이트
4. `docs/WORK-LOG.md`에 기록

### 대상 파일
- 에이전트: `.claude/agents/*.md`
- 스킬: `.claude/skills/*/SKILL.md`
- 일반: `CURSOR_USER_RULES.md`
- 팀 운영: `CLAUDE.md`

---

## 기술 스택

- **Frontend**: React Native + Expo (SDK 54)
- **Backend**: Supabase (PostgreSQL)
- **State**: Zustand
- **Language**: TypeScript

---

## 현재 프로젝트 상태

- **진행률**: ~90%
- **소비자 기능**: 90% (지도, 소셜 로그인, 푸시 미구현)
- **업주 기능**: 85% (통계, 예측 미구현)

---

**참조 문서**:
- `CLAUDE.md` - 팀장 핵심 규칙 (최우선)
- `docs/CURSOR-ONBOARDING.md` - 프로젝트 구조
- `docs/WORK-LOG.md` - 작업 이력
