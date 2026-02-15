# Sub-Agents 설정 및 사용 완벽 가이드

## 개요

Sub-agents는 Claude Code에서 특정 작업을 담당하는 전문화된 AI 어시스턴트입니다. 각 sub-agent는 독립적인 컨텍스트 윈도우, 커스텀 시스템 프롬프트, 특정 도구 접근, 독립적인 권한으로 실행됩니다.

### Sub-agents의 주요 장점

- **컨텍스트 보존**: 탐색과 구현을 메인 대화에서 분리
- **제약 조건 강제**: sub-agent가 사용할 수 있는 도구 제한
- **구성 재사용**: 프로젝트 간 설정 재사용 (사용자 수준 sub-agent)
- **동작 전문화**: 특정 영역을 위한 커스텀 시스템 프롬프트
- **비용 제어**: Haiku 같은 빠르고 저렴한 모델로 라우팅

---

## 내장 Sub-agents

Claude Code에는 자동으로 사용되는 여러 내장 sub-agent가 있습니다.

### 1. Explore (탐색 에이전트)

**빠른 읽기 전용 에이전트로 코드베이스 검색 및 분석에 최적화**

- **모델**: Haiku (빠르고 낮은 지연시간)
- **도구**: 읽기 전용 도구 (Write 및 Edit 도구 접근 불가)
- **목적**: 파일 발견, 코드 검색, 코드베이스 탐색

Claude는 변경 없이 코드베이스를 검색하거나 이해해야 할 때 Explore에 위임합니다. 이는 탐색 결과를 메인 대화 컨텍스트 밖에 유지합니다.

Explore 호출 시 Claude는 철저함 수준을 지정합니다:
- **quick**: 대상 조회
- **medium**: 균형잡힌 탐색
- **very thorough**: 포괄적 분석

### 2. Plan (계획 에이전트)

**Plan 모드 중에 계획을 제시하기 전에 컨텍스트를 수집하는 연구 에이전트**

- **모델**: 메인 대화에서 상속
- **도구**: 읽기 전용 도구 (Write 및 Edit 도구 접근 불가)
- **목적**: 계획을 위한 코드베이스 연구

Plan 모드에서 Claude가 코드베이스를 이해해야 할 때 Plan sub-agent에 위임합니다. 이는 무한 중첩을 방지합니다.

### 3. General-purpose (범용 에이전트)

**탐색과 실행 모두 필요한 복잡한 다단계 작업을 위한 유능한 에이전트**

- **모델**: 메인 대화에서 상속
- **도구**: 모든 도구
- **목적**: 복잡한 연구, 다단계 작업, 코드 수정

### 4. 기타 헬퍼 에이전트

| 에이전트 | 모델 | 사용 시기 |
|---------|------|---------|
| Bash | 상속 | 별도 컨텍스트에서 터미널 명령 실행 |
| statusline-setup | Sonnet | `/statusline` 실행 시 상태 라인 설정 |
| Claude Code Guide | Haiku | Claude Code 기능에 대한 질문 |

---

## 첫 번째 Sub-agent 만들기 (Quickstart)

Sub-agents는 YAML 프론트매터가 있는 Markdown 파일로 정의됩니다.

### 단계별 가이드

#### 1단계: Sub-agents 인터페이스 열기

```bash
/agents
```

#### 2단계: 새 사용자 수준 에이전트 생성

**Create new agent** → **User-level** 선택 (모든 프로젝트에서 사용 가능하도록 `~/.claude/agents/`에 저장)

#### 3단계: Claude로 생성

**Generate with Claude** 선택 후 sub-agent 설명:

```
A code improvement agent that scans files and suggests improvements
for readability, performance, and best practices. It should explain
each issue, show the current code, and provide an improved version.
```

#### 4단계: 도구 선택

읽기 전용 검토자인 경우 **Read-only tools**만 선택

#### 5단계: 모델 선택

이 예제에서는 **Sonnet** 선택 (코드 패턴 분석을 위해 기능과 속도의 균형)

#### 6단계: 색상 선택

UI에서 sub-agent를 식별하기 위한 배경색 선택

#### 7단계: 저장 및 테스트

```bash
Use the code-improver agent to suggest improvements in this project
```

---

## Sub-agents 설정

### /agents 커맨드 사용

`/agents` 커맨드는 sub-agents 관리를 위한 대화형 인터페이스를 제공합니다:

- 모든 사용 가능한 sub-agents 보기 (내장, 사용자, 프로젝트, 플러그인)
- 새 sub-agents 생성
- 기존 sub-agent 설정 및 도구 접근 편집
- 커스텀 sub-agents 삭제
- 활성 sub-agents 확인

### Sub-agent 범위 선택

Sub-agents를 저장하는 위치에 따라 범위가 결정됩니다. 같은 이름의 여러 sub-agents가 있을 경우 높은 우선순위 위치가 우선합니다.

| 위치 | 범위 | 우선순위 | 생성 방법 |
|-----|------|--------|---------|
| `--agents` CLI 플래그 | 현재 세션 | 1 (최고) | Claude Code 실행 시 JSON 전달 |
| `.claude/agents/` | 현재 프로젝트 | 2 | 대화형 또는 수동 |
| `~/.claude/agents/` | 모든 프로젝트 | 3 | 대화형 또는 수동 |
| 플러그인 `agents/` | 플러그인 활성화된 위치 | 4 (최저) | 플러그인으로 설치 |

**프로젝트 Sub-agents** (`.claude/agents/`):
- 특정 코드베이스용
- 버전 제어에 체크인하여 팀이 협력 가능

**사용자 Sub-agents** (`~/.claude/agents/`):
- 모든 프로젝트에서 사용 가능한 개인용

**CLI 정의 Sub-agents**:
Claude Code 실행 시 JSON으로 전달. 디스크에 저장되지 않음.

```bash
claude --agents '{
  "code-reviewer": {
    "description": "Expert code reviewer. Use proactively after code changes.",
    "prompt": "You are a senior code reviewer. Focus on code quality, security, and best practices.",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  }
}'
```

### Sub-agent 파일 작성

Sub-agent 파일 기본 구조:

```markdown
---
name: code-reviewer
description: Reviews code for quality and best practices
tools: Read, Glob, Grep
model: sonnet
---

You are a code reviewer. When invoked, analyze the code and provide
specific, actionable feedback on quality, security, and best practices.
```

**주의**: Sub-agents는 세션 시작 시 로드됩니다. 파일을 수동으로 추가한 경우 세션을 재시작하거나 `/agents`를 사용하여 즉시 로드하세요.

#### 지원되는 프론트매터 필드

| 필드 | 필수 | 설명 |
|-----|------|------|
| `name` | 예 | 소문자 및 하이픈을 사용한 고유 식별자 |
| `description` | 예 | Claude가 이 sub-agent에 위임해야 하는 경우 |
| `tools` | 아니오 | Sub-agent가 사용할 수 있는 도구 (생략 시 모든 도구 상속) |
| `disallowedTools` | 아니오 | 거부할 도구 (상속되거나 지정된 목록에서 제거) |
| `model` | 아니오 | 사용할 모델: `sonnet`, `opus`, `haiku`, 또는 `inherit` (기본값: `sonnet`) |
| `permissionMode` | 아니오 | 권한 모드: `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, 또는 `plan` |
| `skills` | 아니오 | Sub-agent에 로드할 Skills |
| `hooks` | 아니오 | Sub-agent 범위의 라이프사이클 hooks |

### 모델 선택

`model` 필드가 sub-agent가 사용하는 AI 모델을 제어합니다:

- **모델 별칭**: `sonnet`, `opus`, 또는 `haiku`
- **inherit**: 메인 대화와 동일한 모델 사용
- **생략됨**: 기본값으로 `sonnet` 사용

### Sub-agent 기능 제어

#### 사용 가능한 도구

Sub-agents는 Claude Code의 모든 내부 도구를 사용할 수 있습니다. 기본적으로 메인 대화의 모든 도구를 상속합니다.

도구 제한:

```yaml
---
name: safe-researcher
description: Research agent with restricted capabilities
tools: Read, Grep, Glob, Bash
disallowedTools: Write, Edit
---
```

#### 권한 모드

`permissionMode` 필드가 권한 프롬프트 처리 방식을 제어합니다:

| 모드 | 동작 |
|-----|------|
| `default` | 표준 권한 확인 및 프롬프트 |
| `acceptEdits` | 파일 편집 자동 수락 |
| `dontAsk` | 권한 프롬프트 자동 거부 |
| `bypassPermissions` | 모든 권한 확인 건너뛰기 ⚠️ |
| `plan` | Plan 모드 (읽기 전용 탐색) |

**주의**: `bypassPermissions`를 조심스럽게 사용하세요. 모든 권한 확인을 건너뜁니다.

#### Hooks를 통한 조건부 규칙

`PreToolUse` hooks를 사용하여 도구 사용을 동적으로 제어합니다. 도구의 일부 작업은 허용하고 다른 작업은 차단할 때 유용합니다.

**예제: 읽기 전용 데이터베이스 쿼리만 허용**

```yaml
---
name: db-reader
description: Execute read-only database queries
tools: Bash
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-readonly-query.sh"
---
```

검증 스크립트 (`./scripts/validate-readonly-query.sh`):

```bash
#!/bin/bash
# 읽기 전용 데이터베이스 쿼리 검증

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# SQL 쓰기 작업 차단 (대소문자 구분 없음)
if echo "$COMMAND" | grep -iE '\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\b' > /dev/null; then
  echo "Blocked: Only SELECT queries are allowed" >&2
  exit 2
fi

exit 0
```

#### 특정 Sub-agents 비활성화

settings에 `deny` 배열을 추가하여 특정 sub-agents 사용 방지:

```json
{
  "permissions": {
    "deny": ["Task(Explore)", "Task(my-custom-agent)"]
  }
}
```

또는 CLI 플래그 사용:

```bash
claude --disallowedTools "Task(Explore)"
```

### Sub-agents를 위한 Hooks 정의

Sub-agents는 라이프사이클 중 실행되는 hooks를 정의할 수 있습니다:

1. **Sub-agent 프론트매터에서**: 해당 sub-agent가 활성화된 동안만 실행되는 hooks
2. **`settings.json`에서**: Sub-agents가 시작/중지할 때 메인 세션에서 실행되는 hooks

#### Sub-agent 프론트매터의 Hooks

Sub-agent markdown 파일에 직접 hooks를 정의합니다. 이 hooks는 해당 sub-agent가 활성화된 동안만 실행됩니다.

| 이벤트 | 매처 입력 | 발생 시점 |
|------|---------|---------|
| `PreToolUse` | 도구 이름 | Sub-agent가 도구를 사용하기 전 |
| `PostToolUse` | 도구 이름 | Sub-agent가 도구를 사용한 후 |
| `Stop` | (없음) | Sub-agent가 완료될 때 |

**예제: Bash 명령 검증 및 파일 편집 후 린터 실행**

```yaml
---
name: code-reviewer
description: Review code changes with automatic linting
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-command.sh $TOOL_INPUT"
  PostToolUse:
    - matcher: "Edit|Write"
      hooks:
        - type: command
          command: "./scripts/run-linter.sh"
---
```

#### Sub-agent 이벤트를 위한 프로젝트 수준 Hooks

메인 세션에서 sub-agent 라이프사이클 이벤트에 응답하는 hooks를 `settings.json`에서 구성합니다:

| 이벤트 | 매처 입력 | 발생 시점 |
|------|---------|---------|
| `SubagentStart` | 에이전트 타입 이름 | Sub-agent가 실행 시작 시 |
| `SubagentStop` | 에이전트 타입 이름 | Sub-agent가 완료될 때 |

**예제: DB 에이전트 시작/중지 시 설정/정리 스크립트**

```json
{
  "hooks": {
    "SubagentStart": [
      {
        "matcher": "db-agent",
        "hooks": [
          { "type": "command", "command": "./scripts/setup-db-connection.sh" }
        ]
      }
    ],
    "SubagentStop": [
      {
        "matcher": "db-agent",
        "hooks": [
          { "type": "command", "command": "./scripts/cleanup-db-connection.sh" }
        ]
      }
    ]
  }
}
```

---

## Sub-agents와 함께 작업하기

### 자동 위임 이해

Claude는 작업 설명, sub-agent 구성의 `description` 필드, 현재 컨텍스트를 기반으로 자동으로 작업을 위임합니다.

**구체적인 요청**:

```
Use the test-runner subagent to fix failing tests
Have the code-reviewer subagent look at my recent changes
```

### Foreground 또는 Background에서 Sub-agents 실행

- **Foreground sub-agents**: 메인 대화를 차단. 완료될 때까지 기다립니다.
- **Background sub-agents**: 메인 작업 중 동시 실행. 자동으로 사전 승인되지 않은 권한 거부.

**Background 작업 비활성화**:

```bash
export CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1
```

**Background 태스크 전환**:
- `Ctrl+B` 누르기
- "run this in the background" 요청

### 일반적인 패턴

#### 1. 대량 작업 분리

테스트 실행, 문서 가져오기, 로그 파일 처리 같은 대량 출력 작업을 sub-agent에 위임:

```
Use a subagent to run the test suite and report only the failing tests
with their error messages
```

#### 2. 병렬 연구

독립적인 조사를 위해 여러 sub-agents를 동시에 실행:

```
Research the authentication, database, and API modules in parallel
using separate subagents
```

#### 3. Sub-agents 체인

다단계 워크플로우의 경우 sub-agents를 순차적으로 사용:

```
Use the code-reviewer subagent to find performance issues, then use
the optimizer subagent to fix them
```

**주의**: Sub-agents는 다른 sub-agents를 생성할 수 없습니다. 중첩된 위임이 필요하면 Skills을 사용하거나 메인 대화에서 sub-agents를 체인하세요.

### Sub-agents vs 메인 대화 선택

**메인 대화 사용:**
- 빈번한 왕복 또는 반복적 개선 필요
- 여러 단계가 상당한 컨텍스트 공유 (계획 → 구현 → 테스트)
- 빠른 대상 변경 필요
- 지연시간 중요

**Sub-agents 사용:**
- 메인 컨텍스트에 필요 없는 자세한 출력 생성
- 특정 도구 제한 또는 권한 강제
- 자체 포함되고 요약 반환 가능

### Sub-agent 컨텍스트 관리

#### Sub-agents 재개

각 sub-agent 호출은 새로운 인스턴스를 생성합니다. 처음부터 시작하는 대신 기존 sub-agent의 작업을 계속하려면 Claude에 재개하도록 요청하세요:

```
Use the code-reviewer subagent to review the authentication module
[Agent completes]

Continue that code review and now analyze the authorization logic
[Claude resumes the subagent with full context from previous conversation]
```

Sub-agent 트랜스크립트:
- **메인 대화 압축**: 메인 대화가 압축되어도 sub-agent 트랜스크립트는 영향 없음
- **세션 지속**: 트랜스크립트는 세션 내에 지속
- **자동 정리**: `cleanupPeriodDays` 설정 기반으로 정리 (기본값: 30일)

#### 자동 압축

Sub-agents는 메인 대화와 동일한 자동 압축 로직을 지원합니다. 컨텍스트가 한계에 접근하면 Claude Code는 중요한 컨텍스트를 보존하면서 오래된 메시지를 요약합니다.

---

## 예제 Sub-agents

### 1. 코드 리뷰어

읽기 전용 sub-agent로 코드를 검토하되 수정하지 않습니다:

```markdown
---
name: code-reviewer
description: Expert code review specialist. Proactively reviews code for quality, security, and maintainability. Use immediately after writing or modifying code.
tools: Read, Grep, Glob, Bash
model: inherit
---

You are a senior code reviewer ensuring high standards of code quality and security.

When invoked:
1. Run git diff to see recent changes
2. Focus on modified files
3. Begin review immediately

Review checklist:
- Code is clear and readable
- Functions and variables are well-named
- No duplicated code
- Proper error handling
- No exposed secrets or API keys
- Input validation implemented
- Good test coverage
- Performance considerations addressed

Provide feedback organized by priority:
- Critical issues (must fix)
- Warnings (should fix)
- Suggestions (consider improving)

Include specific examples of how to fix issues.
```

### 2. 디버거

버그 분석과 수정이 모두 가능한 sub-agent:

```markdown
---
name: debugger
description: Debugging specialist for errors, test failures, and unexpected behavior. Use proactively when encountering any issues.
tools: Read, Edit, Bash, Grep, Glob
---

You are an expert debugger specializing in root cause analysis.

When invoked:
1. Capture error message and stack trace
2. Identify reproduction steps
3. Isolate the failure location
4. Implement minimal fix
5. Verify solution works

Debugging process:
- Analyze error messages and logs
- Check recent code changes
- Form and test hypotheses
- Add strategic debug logging
- Inspect variable states

For each issue, provide:
- Root cause explanation
- Evidence supporting the diagnosis
- Specific code fix
- Testing approach
- Prevention recommendations

Focus on fixing the underlying issue, not the symptoms.
```

### 3. 데이터 과학자

데이터 분석 작업을 위한 도메인 특화 sub-agent:

```markdown
---
name: data-scientist
description: Data analysis expert for SQL queries, BigQuery operations, and data insights. Use proactively for data analysis tasks and queries.
tools: Bash, Read, Write
model: sonnet
---

You are a data scientist specializing in SQL and BigQuery analysis.

When invoked:
1. Understand the data analysis requirement
2. Write efficient SQL queries
3. Use BigQuery command line tools (bq) when appropriate
4. Analyze and summarize results
5. Present findings clearly

Key practices:
- Write optimized SQL queries with proper filters
- Use appropriate aggregations and joins
- Include comments explaining complex logic
- Format results for readability
- Provide data-driven recommendations

For each analysis:
- Explain the query approach
- Document any assumptions
- Highlight key findings
- Suggest next steps based on data

Always ensure queries are efficient and cost-effective.
```

### 4. 데이터베이스 쿼리 검증자

Bash 접근을 허용하지만 읽기 전용 SQL 쿼리만 검증:

```markdown
---
name: db-reader
description: Execute read-only database queries. Use when analyzing data or generating reports.
tools: Bash
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-readonly-query.sh"
---

You are a database analyst with read-only access. Execute SELECT queries to answer questions about the data.

When asked to analyze data:
1. Identify which tables contain the relevant data
2. Write efficient SELECT queries with appropriate filters
3. Present results clearly with context

You cannot modify data. If asked to INSERT, UPDATE, DELETE, or modify schema, explain that you only have read access.
```

**검증 스크립트** (`./scripts/validate-readonly-query.sh`):

```bash
#!/bin/bash
# Blocks SQL write operations, allows SELECT queries

# Read JSON input from stdin
INPUT=$(cat)

# Extract the command field from tool_input using jq
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ -z "$COMMAND" ]; then
  exit 0
fi

# Block write operations (case-insensitive)
if echo "$COMMAND" | grep -iE '\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|REPLACE|MERGE)\b' > /dev/null; then
  echo "Blocked: Write operations not allowed. Use SELECT queries only." >&2
  exit 2
fi

exit 0
```

스크립트를 실행 가능하게 만들기:

```bash
chmod +x ./scripts/validate-readonly-query.sh
```

---

## 모범 사례

- **집중된 sub-agents 설계**: 각 sub-agent는 하나의 특정 작업에 탁월함
- **자세한 설명 작성**: Claude가 위임 시점을 결정할 때 설명 사용
- **도구 접근 제한**: 보안과 집중을 위해 필요한 권한만 부여
- **버전 제어에 체크인**: 팀과 프로젝트 sub-agents 공유

---

## 참고 문서

- Sub-agents 전체 가이드: https://code.claude.com/docs/en/sub-agents
- 플러그인으로 배포: https://code.claude.com/docs/en/plugins
- Agent SDK (프로그래매틱 실행): https://code.claude.com/docs/en/headless
- MCP 서버 사용: https://code.claude.com/docs/en/mcp
