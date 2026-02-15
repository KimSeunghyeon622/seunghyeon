# Claude Code Skills 완벽 가이드

## Skills란?

Skills는 Claude Code의 자동화 기능으로, 특정 작업을 수행하기 위해 설계된 재사용 가능한 커스텀 명령어입니다. 사용자가 정의한 작업을 효율적으로 실행할 수 있게 해줍니다.

## Skills 생성 및 구성

### 1. 첫 번째 Skill 만들기

Skills는 SKILL.md 파일로 정의되며, 다음 구조를 따릅니다:

```markdown
---
name: skill-name
description: Skill에 대한 설명
---

# Skill 실행 지침

Skill이 수행할 작업을 설명합니다.
```

### 2. SKILL.md 메타데이터 필드

SKILL.md 파일의 frontmatter에서 사용 가능한 필드:

- `name`: Skill의 이름 (필수)
- `description`: Skill이 수행하는 작업 설명
- `tools`: Skill이 사용할 수 있는 도구 지정
- `model`: 특정 모델 지정
- `visibility`: Skill의 가시성 설정

### 3. Skills 위치 (Where Skills Live)

Skills는 프로젝트 내 다음 위치에 저장됩니다:

- 프로젝트 레벨: `.claude/skills/`
- 사용자 레벨: `~/.claude/skills/`
- 플러그인: 플러그인 내에 포함

## Skills vs 다른 옵션

### Skills를 사용해야 할 때:
- 반복적인 작업 자동화
- 복잡한 프롬프트 필요
- Claude가 자동으로 발견하고 사용하길 원할 때

### 다른 옵션:
- **Slash Commands**: 사용자가 명시적으로 호출
- **Subagents**: 더 복잡한 워크플로우나 병렬 처리
- **Hooks**: 이벤트 기반 트리거

## Skills 설정 심화

### 1. 도구 접근 제한 (allowed-tools)

```yaml
---
name: database-skill
allowed-tools:
  - bash
  - read
---
```

이는 Skill이 특정 도구에만 접근하도록 제한합니다.

### 2. Forked Context에서 실행

Skill을 격리된 컨텍스트에서 실행하여 부작용을 방지합니다.

### 3. Skill용 Hooks 정의

Skill 파일 또는 프로젝트 설정에서 hooks를 정의할 수 있습니다:

```yaml
hooks:
  - event: PreToolUse
    script: scripts/validate.sh
```

### 4. Skill 가시성 제어

- `private`: 현재 프로젝트에서만 사용
- `public`: 다른 프로젝트에서도 사용 가능
- `model-only`: Claude만 자동 실행 (사용자는 명시적으로 호출 불가)

## 다중 파일 Skill 구조

복잡한 Skill은 여러 파일로 구성될 수 있습니다:

```
.claude/skills/
└── my-skill/
    ├── SKILL.md
    ├── helper.js
    └── config.json
```

Progressive disclosure를 통해 필요한 파일만 로드할 수 있습니다.

## Subagents와 함께 사용

Skill을 subagent에 제공:

```yaml
---
name: review-subagent
skills:
  - code-reviewer
  - security-checker
---
```

## Skill 배포

Skills는 다음을 통해 배포할 수 있습니다:

- 프로젝트 리포지토리
- 플러그인으로 패키징
- 마켓플레이스를 통해 공유

## 문제 해결

### Skill이 실행되지 않을 때:

1. **Skill 확인**: `/agents` 명령어로 활성화된 Skills 확인
2. **에러 확인**: SKILL.md의 YAML 문법 검증
3. **도구 권한**: allowed-tools 설정 확인
4. **가시성**: Skill 가시성 설정 확인

### 여러 Skill 충돌 시:

- Skill 이름의 고유성 확인
- 가시성 설정으로 범위 제한
- 우선순위 설정 검토

## 실제 예시

### 예시 1: 간단한 Skill (단일 파일)

```markdown
---
name: format-markdown
description: 마크다운 파일 자동 포맷팅
---

# 마크다운 포맷팅 Skill

사용자가 요청하면 마크다운 파일을 자동으로 포맷팅합니다.

1. 파일 읽기
2. 포맷팅 규칙 적용
3. 결과 저장
```

### 예시 2: 다중 파일 Skill

```markdown
---
name: security-audit
description: 보안 감사 수행
allowed-tools:
  - bash
  - read
  - write
---

# 보안 감사 Skill

코드베이스의 보안 문제를 자동으로 검사합니다.

이 Skill은 다음 작업을 수행합니다:
- 의존성 취약점 검사
- 보안 설정 검증
- 로깅 및 모니터링 확인
```

## 참고 문서

- Skills 전체 가이드: https://code.claude.com/docs/en/skills
- Slash Commands: https://code.claude.com/docs/en/slash-commands
- Subagents: https://code.claude.com/docs/en/sub-agents
- Hooks 설정: https://code.claude.com/docs/en/hooks-guide
