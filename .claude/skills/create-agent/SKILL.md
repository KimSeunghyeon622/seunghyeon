---
name: create-agent
description: 새로운 서브에이전트 또는 스킬을 생성하는 스킬. 사용자의 요구사항에 맞춰 커스텀 서브에이전트나 스킬을 만들어줍니다. Anthropic 공식 Skill Creator 가이드라인 기반.
---

# 서브에이전트 & 스킬 생성 스킬 (Anthropic Skill Creator 기반)

이 스킬은 사용자의 요구사항에 맞는 새로운 **서브에이전트** 또는 **스킬**을 생성합니다.

---

## 핵심 원칙 (Anthropic 공식 가이드라인)

### 1. 간결성이 핵심
- 컨텍스트 윈도우는 공유 자원
- **기본 가정**: Claude는 이미 매우 똑똑함
- Claude가 이미 알고 있는 컨텍스트는 추가하지 말 것
- 상세한 설명보다 간결한 예제 선호

### 2. 적절한 자유도 설정

| 자유도 | 사용 시기 | 예시 |
|-------|---------|------|
| **높음** (텍스트 기반) | 여러 접근이 유효하거나 휴리스틱 가이드 | 일반 지침 |
| **중간** (의사코드/파라미터) | 선호 패턴 존재하거나 설정이 동작 영향 | 설정 가능한 스크립트 |
| **낮음** (특정 스크립트) | 작업이 취약하거나 순서가 중요 | PDF 변환, 데이터 처리 |

### 3. 점진적 공개 (Progressive Disclosure)

3단계 로딩 시스템으로 컨텍스트 효율화:
1. **메타데이터** (name + description) - 항상 로딩 (~100단어)
2. **SKILL.md 본문** - 스킬 트리거 시 (<5k단어)
3. **번들 리소스** - Claude가 필요 시 (무제한)

---

## 실행 지침 (6단계 프로세스)

### Step 1: 생성 유형 및 예제 확인

사용자에게 질문:
- **무엇을 생성할지**: 서브에이전트 vs 스킬
- **구체적 사용 예제**: "이 스킬이 어떤 상황에서 사용될까요?"
- **트리거 문구**: "사용자가 이 기능을 호출할 때 뭐라고 말할까요?"

### Step 2: 재사용 가능한 컨텐츠 계획

각 예제를 분석하여 필요한 리소스 파악:
- **scripts/**: 반복 실행되는 스크립트
- **references/**: 참고할 문서 (스키마, API 문서 등)
- **assets/**: 출력에 사용할 파일 (템플릿, 이미지 등)

### Step 3: 구조 생성

#### 서브에이전트의 경우
```
.claude/agents/{agent-name}.md
```

#### 스킬의 경우
```
.claude/skills/{skill-name}/
├── SKILL.md (필수)
├── scripts/     # 실행 가능한 코드
├── references/  # 참고 문서
└── assets/      # 템플릿, 이미지 등
```

### Step 4: 프론트매터 작성

```yaml
name: skill-name
description: 무엇을 하는지 + 언제 사용하는지 (트리거 조건 포함!)
```

**중요**: `description`이 스킬 트리거의 주요 메커니즘입니다!

예시:
```yaml
name: docx
description: 전문 문서 생성, 편집 및 분석. 다음에 사용: (1) 새 문서 생성, (2) 컨텐츠 수정, (3) 추적 변경 작업, (4) 댓글 추가
```

### Step 5: 본문 작성

- 명령형/부정사형 사용
- **500줄 이하** 유지
- 길면 별도 파일로 분할하고 참조

### Step 6: 검증 및 반복

1. 실제 작업에서 스킬 사용
2. 어려움이나 비효율 발견
3. 개선 사항 구현
4. 다시 테스트

---

## 서브에이전트 생성

### 수집할 정보
| 항목 | 필수 | 설명 |
|-----|------|------|
| 목적/역할 | 예 | 에이전트가 하는 일 |
| 이름 | 아니오 | 없으면 적절히 생성 |
| 도구 | 아니오 | Read, Write, Edit, Bash, Grep, Glob 등 |
| 모델 | 아니오 | sonnet, opus, haiku, inherit |
| 권한 모드 | 아니오 | default, acceptEdits, dontAsk 등 |

### 저장 위치
`.claude/agents/{agent-name}.md`

### 파일 형식

```markdown
---
name: agent-name
description: 에이전트가 하는 일에 대한 설명. 언제 사용하는지 포함!
tools: Read, Grep, Glob
model: sonnet
---

에이전트의 시스템 프롬프트를 여기에 작성합니다.
구체적인 작업 지침, 체크리스트, 응답 형식 등을 포함하세요.
```

### 프론트매터 필드

| 필드 | 필수 | 설명 |
|-----|------|------|
| `name` | 예 | 소문자와 하이픈만 사용한 고유 식별자 |
| `description` | 예 | Claude가 이 에이전트에 위임할 시점을 판단하는 설명 |
| `tools` | 아니오 | 사용 가능한 도구 목록 (쉼표 구분) |
| `disallowedTools` | 아니오 | 금지할 도구 목록 |
| `model` | 아니오 | sonnet, opus, haiku, inherit (기본: sonnet) |
| `permissionMode` | 아니오 | 권한 모드 설정 |
| `skills` | 아니오 | 로드할 스킬 목록 |

---

## 스킬 생성

### 수집할 정보
| 항목 | 필수 | 설명 |
|-----|------|------|
| 목적/역할 | 예 | 스킬이 하는 일 |
| 이름 | 아니오 | 없으면 적절히 생성 |
| 트리거 조건 | 예 | 언제 이 스킬이 호출되는지 |
| 필요한 리소스 | 아니오 | scripts, references, assets |

### 저장 위치
`.claude/skills/{skill-name}/SKILL.md`

### 스킬 디렉토리 구조

```
skill-name/
├── SKILL.md (필수)
│   ├── YAML 프론트매터
│   │   ├── name: (필수)
│   │   └── description: (필수, 트리거 조건 포함!)
│   └── 마크다운 지침
└── 번들 리소스 (선택)
    ├── scripts/      # 실행 가능한 코드
    ├── references/   # 참고 문서
    └── assets/       # 템플릿, 이미지, 폰트 등
```

### 프론트매터 필드

| 필드 | 필수 | 설명 |
|-----|------|------|
| `name` | 예 | 스킬의 고유 이름 |
| `description` | 예 | 무엇을 하는지 + **언제 사용하는지** |
| `allowed-tools` | 아니오 | 스킬이 사용할 수 있는 도구 제한 |
| `model` | 아니오 | 특정 모델 지정 |
| `visibility` | 아니오 | private, public, model-only |

### 번들 리소스 가이드

#### scripts/ (실행 스크립트)
- **용도**: 반복 실행되거나 결정적 신뢰성이 필요한 코드
- **예**: `scripts/rotate_pdf.py`, `scripts/convert_data.sh`
- **이점**: 토큰 효율적, 결정적, 컨텍스트 로드 없이 실행

#### references/ (참고 문서)
- **용도**: Claude가 작업 중 참고할 문서
- **예**: `references/schema.md`, `references/api_docs.md`
- **중요**: SKILL.md에는 개요만, 상세는 여기로!

#### assets/ (출력 자산)
- **용도**: 출력에서 사용될 파일 (컨텍스트에 로드 안 됨)
- **예**: `assets/template.pptx`, `assets/logo.png`

---

## 점진적 공개 패턴

### 패턴 1: 고수준 가이드 + 참고자료
```markdown
# 스킬 이름

## 빠른 시작
[간단한 예제]

## 고급 기능
- **양식 채우기**: [FORMS.md](references/FORMS.md) 참고
- **API 참고**: [REFERENCE.md](references/REFERENCE.md) 참고
```

### 패턴 2: 도메인별 분할
```
bigquery-skill/
├── SKILL.md (개요 및 네비게이션)
└── references/
    ├── finance.md    # 수익, 청구 메트릭
    ├── sales.md      # 기회, 파이프라인
    └── product.md    # API 사용, 기능
```

### 중요 가이드라인
- **깊게 중첩된 참고 방지**: 참고 파일은 SKILL.md에서 한 단계 깊이로
- **긴 참고 파일 구조화**: 100줄 이상은 상단에 목차 포함

---

## 스킬에 포함하지 말 것

다음은 **포함하지 않습니다**:
- README.md
- INSTALLATION_GUIDE.md
- CHANGELOG.md
- 기타 보조 문서

스킬은 **AI 에이전트가 작업 수행에 필요한 정보만** 포함해야 합니다.

---

## 서브에이전트 vs 스킬 선택 가이드

### 서브에이전트 선택
- 독립적인 컨텍스트가 필요한 복잡한 작업
- 특정 도구만 사용하도록 제한 필요
- 메인 대화와 분리된 작업
- 저렴한 모델(haiku) 사용으로 비용 절감

### 스킬 선택
- 반복적인 작업 자동화
- 복잡한 프롬프트 재사용
- Claude 자동 발견 및 실행
- 슬래시 명령어로 직접 호출

---

## 사용 가능한 도구 목록

| 도구 | 설명 |
|-----|------|
| **Read** | 파일 읽기 |
| **Write** | 파일 생성 |
| **Edit** | 파일 수정 |
| **Bash** | 터미널 명령 실행 |
| **Grep** | 코드 검색 |
| **Glob** | 파일 패턴 매칭 |
| **WebFetch** | 웹 페이지 가져오기 |
| **WebSearch** | 웹 검색 |
| **Task** | 다른 서브에이전트 호출 (주의: 서브에이전트는 호출 불가) |

---

## 예시

### 서브에이전트 예시

```markdown
---
name: security-auditor
description: 보안 취약점을 검사하는 전문가. 코드 변경 후, PR 생성 전, 보안 검토가 필요할 때 사용.
tools: Read, Grep, Glob, Bash
model: sonnet
---

당신은 시니어 보안 감사자입니다.

호출 시:
1. 변경된 파일 목록 확인
2. 보안 체크리스트 기반 검토
3. 발견된 이슈를 신뢰도 점수와 함께 보고

체크리스트:
- [ ] SQL 인젝션 취약점
- [ ] XSS 취약점
- [ ] 민감 정보 노출
- [ ] 인증/인가 우회
```

### 스킬 예시

```markdown
---
name: db-migration
description: 데이터베이스 마이그레이션 SQL을 생성합니다. 다음에 사용: (1) 새 테이블 생성, (2) 컬럼 추가/수정, (3) 인덱스 생성, (4) RLS 정책 설정
---

# DB 마이그레이션 스킬

## 실행 지침

1. 변경 요구사항 확인
2. `references/schema.md`에서 현재 스키마 확인
3. 마이그레이션 SQL 생성
4. 롤백 SQL도 함께 생성
5. `scripts/validate_migration.py`로 검증

## 출력 형식

- 파일명: `docs/sql/YYYYMMDD-description.sql`
- 롤백 파일: `docs/sql/YYYYMMDD-description-rollback.sql`
```

---

## 주의사항

- 이름은 소문자와 하이픈만 사용 (예: my-agent, my-skill)
- **description에 "언제 사용하는지" 반드시 포함**
- 보안을 위해 필요한 최소한의 도구만 부여
- SKILL.md 본문은 **500줄 이하** 유지
- 새로 생성한 항목은 세션 재시작 또는 `/agents` 실행 후 로드
