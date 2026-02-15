# 재고 할인 중개 플랫폼

> **프로젝트명**: 재고 할인 중개 플랫폼 (투굿투고 유사 서비스)  
> **프로젝트 위치**: `C:\Users\user\claude-test`  
> **현재 상태**: MVP 개발 진행 중 (90% 완료)

---

## 🚨 AI 어시스턴트 (Claude/Cursor) 필수 확인사항

**⚠️ 새로운 세션 시작 시 반드시 확인:**

### 자동 확인 프로세스 (사용자 요청 불필요)

새로운 세션이 시작되거나 대화가 시작될 때, **사용자가 요청하지 않아도** 반드시 다음을 자동으로 수행해야 합니다:

1. **`docs/TOOL-SWITCH-LOG.md` 읽기 및 확인**
   - 이전 툴(Cursor/Claude)에서 완료된 작업 확인
   - 진행 중인 작업 상태 파악
   - 다음 작업 계획 확인
   - 주의사항 및 특이사항 확인

2. **`docs/WORK-LOG.md`의 "최근 업데이트" 섹션 읽기**
   - 현재 프로젝트 진행 상태 파악
   - 최근 완료된 작업 확인

3. **확인 완료 후 자동 보고**
   - 확인한 문서 목록
   - 현재 프로젝트 상태 요약
   - 다음 작업 계획
   - 주의사항

**이 프로세스는 Cursor ↔ Claude 양방향 모두 적용됩니다.**

---

## 📋 필수 문서 읽기 순서

작업 시작 전 반드시 읽어야 할 문서:

1. **`docs/TOOL-SWITCH-LOG.md`** - 툴 간 작업 이력 (툴 교체 시 필수)
2. **`docs/WORK-LOG.md`** - 프로젝트 전체 이력 및 현재 상태
3. **`docs/CURSOR-ONBOARDING.md`** - 프로젝트 구조 및 온보딩 가이드
4. **`CLAUDE.md`** - 팀 운영 규칙 및 가이드라인
5. **`CURSOR_USER_RULES.md`** - Cursor 사용 규칙

---

## 🏗️ 프로젝트 구조

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
│   │   └── types/                 # 전역 타입 정의
│   ├── package.json
│   ├── app.json                  # Expo 설정
│   └── .env                      # 환경변수 (Supabase)
│
├── docs/                         # 프로젝트 문서
│   ├── PRD.md                    # 제품 요구사항 정의서
│   ├── TRD.md                    # 기술명세서
│   ├── WORK-LOG.md               # 업무 이력 (⚠️ 먼저 읽기!)
│   ├── TOOL-SWITCH-LOG.md        # 툴 간 작업 이력 (⚠️ 툴 교체 시 필수!)
│   ├── SESSION-START-CHECKLIST.md # 세션 시작 체크리스트
│   └── ...
│
└── .claude/                      # Claude 에이전트 설정
    ├── agents/                   # 서브에이전트 정의
    └── skills/                   # 스킬 정의
```

---

## 🛠️ 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| Frontend | React Native + Expo | SDK 54, RN 0.81.5 |
| Language | TypeScript | 5.9.2 |
| Backend | Supabase (PostgreSQL) | Latest |
| Authentication | Supabase Auth | JWT |
| 상태관리 | Zustand | 5.0.10 |
| 테스트 | Jest, Playwright MCP | - |

---

## 📚 주요 문서

- **`docs/PRD.md`** - 제품 요구사항 정의서
- **`docs/TRD.md`** - 기술명세서
- **`docs/WORK-LOG.md`** - 프로젝트 작업 이력
- **`docs/TOOL-SWITCH-LOG.md`** - 툴 간 작업 이력
- **`CLAUDE.md`** - 팀 운영 규칙
- **`CURSOR_USER_RULES.md`** - Cursor 사용 규칙
- **`.cursorrules`** - 프로젝트 작업 규칙

---

## 🚀 빠른 시작

### 개발 환경 설정

```bash
# 1. 프로젝트 디렉토리로 이동
cd C:\Users\user\claude-test\app

# 2. 의존성 설치
npm install

# 3. 환경변수 설정
# .env 파일에 Supabase 설정 추가

# 4. 개발 서버 시작
npm start
```

### Expo Go 연결

- **터널 모드 (권장)**: `npm start` (기본값으로 `--tunnel` 사용)
- **LAN 모드**: `npm run start:lan`

---

## 📊 현재 진행 상태

- **전체 진행률**: 약 90% 완료
- **소비자 기능**: 90% 완료 (지도 탐색, 소셜 로그인, 푸시 알림 미구현)
- **업주 기능**: 85% 완료 (매출 통계, 재고 예측 미구현)

---

## 🔄 툴 간 작업 연속성

이 프로젝트는 Cursor와 Claude를 번갈아가며 작업할 수 있도록 설계되었습니다.

### 툴 교체 전 (작업 종료 시)
1. `docs/TOOL-SWITCH-LOG.md` 업데이트
2. 완료된 작업 기록
3. 진행 중인 작업 상태 기록
4. 다음 작업 계획 기록

### 툴 교체 후 (작업 시작 시)
1. **자동으로** `docs/TOOL-SWITCH-LOG.md` 확인
2. **자동으로** `docs/WORK-LOG.md` 확인
3. 이전 작업 이어서 진행

---

## 👥 팀 구조

이 프로젝트는 **팀장-팀원 구조**로 운영됩니다.

### 팀장
- 프로젝트 관리 및 팀원 조율
- 사용자와 직접 소통
- 작업 계획 수립 및 진행 상황 보고

### 팀원 (에이전트/스킬)
- `.claude/agents/` - 복잡한 작업 담당
- `.claude/skills/` - 정형화된 문서/작업 담당

**중요**: 팀장은 직접 개발하지 않으며, 모든 개발은 적절한 팀원에게 위임합니다.

---

## 📝 작업 원칙

1. **테스트 주도 개발 (TDD)**: 모든 개발은 tdd-agent가 TDD 방식으로 수행
2. **보안 우선**: API 키 하드코딩 금지, 민감 정보 로그 금지
3. **문서화**: 모든 작업은 `docs/WORK-LOG.md`에 기록
4. **팀원 위임**: 개발 작업은 적절한 팀원(에이전트/스킬)에게 위임

---

## 🔗 관련 링크

- [Supabase 문서](https://supabase.com/docs)
- [Expo 문서](https://docs.expo.dev/)
- [React Native 문서](https://reactnative.dev/docs/getting-started)

---

**마지막 업데이트**: 2026-01-22
