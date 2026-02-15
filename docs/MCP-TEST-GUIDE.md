# MCP 서버 활용 테스트 가이드

> **작성일**: 2026-01-20  
> **목적**: MCP 서버 (Supabase, Playwright) 활용 테스트  
> **상태**: 테스트 진행 중

---

## 1. MCP 서버 연결 상태 확인

### 현재 연결 상태
```bash
claude mcp list
```

**예상 결과:**
```
playwright: npx -y @playwright/mcp --headless - ✓ Connected
supabase: npx -y @supabase/mcp-server-supabase@latest - ✓ Connected
```

---

## 2. Supabase MCP 테스트

### 2.1 테스트 목적
- Supabase MCP 서버를 통해 SQL 쿼리를 실행할 수 있는지 확인
- 실제 DB 연결 및 쿼리 실행 검증

### 2.2 테스트 케이스

#### 테스트 1: 간단한 SELECT 쿼리
**목적**: 기본적인 쿼리 실행 확인

**SQL 쿼리:**
```sql
-- 테이블 목록 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**예상 결과:**
- stores, products, reservations, reviews 등의 테이블 목록 반환

#### 테스트 2: 데이터 조회 쿼리
**목적**: 실제 데이터 조회 확인

**SQL 쿼리:**
```sql
-- 업체 목록 조회 (최대 5개)
SELECT id, name, address, is_open
FROM stores
LIMIT 5;
```

**예상 결과:**
- 업체 데이터 반환 (없으면 빈 결과)

#### 테스트 3: 함수 실행 테스트
**목적**: DB 함수 호출 확인

**SQL 쿼리:**
```sql
-- 현재 시간 확인
SELECT NOW() as current_time;
```

**예상 결과:**
- 현재 시간 반환

### 2.3 테스트 실행 방법

**새 세션에서 실행:**
1. `/clear` 명령으로 새 세션 시작
2. Supabase MCP 도구 사용:
   ```
   Supabase MCP를 사용하여 다음 쿼리를 실행하세요:
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;
   ```

**또는 Cursor에서:**
- MCP 도구가 사용 가능한 경우 직접 호출

### 2.4 테스트 결과 기록

| 테스트 케이스 | 실행일시 | 결과 | 비고 |
|--------------|---------|------|------|
| 테스트 1: 테이블 목록 조회 | 2026-01-22 | ✅ 성공 | MCP 도구(`mcp_supabase_execute_sql`) 사용, 9개 테이블 조회 |
| 테스트 2: 데이터 조회 | 2026-01-22 | ✅ 성공 | MCP 도구 사용, 5개 업체 조회 성공 |
| 테스트 3: 함수 실행 | 2026-01-22 | ✅ 성공 | MCP 도구 사용, 현재 시간 반환 성공 |

**테스트 실행 방법:**
```bash
cd app
node test-supabase-mcp.js
```

**테스트 결과:**
- ✅ Supabase 연결 성공
- ✅ 업체 데이터 조회 성공 (5개 업체)
- ⚠️ RPC 함수(`exec_sql`) 사용 불가 - 직접 쿼리로 대체
- ✅ 현재 시간 반환 성공

**MCP 도구 테스트 결과 (2026-01-22):**
- ✅ **테스트 1**: `mcp_supabase_execute_sql`로 테이블 목록 조회 성공 (9개 테이블)
- ✅ **테스트 2**: `mcp_supabase_execute_sql`로 업체 데이터 조회 성공 (5개 업체)
- ✅ **테스트 3**: `mcp_supabase_execute_sql`로 NOW() 함수 실행 성공

**확인된 테이블 목록:**
- `cash_transactions`, `consumers`, `favorites`, `products`, `reservations`, `reviews`, `store_operating_hours`, `stores`, `user_profiles`

**참고:**
- ✅ MCP 서버 도구(`mcp_supabase_execute_sql`) 정상 작동 확인 완료
- ✅ Cursor에서 Supabase MCP 서버 연결 및 사용 가능 확인

---

## 3. Playwright MCP 테스트

### 3.1 테스트 목적
- Playwright MCP 서버를 통해 웹 브라우저 자동화가 가능한지 확인
- Expo 웹 빌드 결과물을 브라우저에서 테스트

### 3.2 사전 준비

#### 3.2.1 Expo 웹 빌드 확인
```bash
cd app
ls dist/
```

**확인 사항:**
- `dist/index.html` 파일 존재
- `dist/_expo/static/js/web/` 폴더에 JS 번들 존재

#### 3.2.2 웹 서버 실행
```bash
cd app
npx expo start --web
```

**또는 정적 파일 서버:**
```bash
cd app/dist
# Python이 설치되어 있다면
python -m http.server 8000

# 또는 Node.js http-server
npx http-server -p 8000
```

### 3.3 테스트 케이스

#### 테스트 1: 페이지 로드 확인
**목적**: 웹 페이지가 정상적으로 로드되는지 확인

**테스트 시나리오:**
1. 브라우저에서 `http://localhost:8081` (또는 실행된 포트) 접속
2. 페이지 로드 확인
3. 스크린샷 캡처

**예상 결과:**
- 페이지가 정상적으로 로드됨
- React 앱이 렌더링됨

#### 테스트 2: 기본 네비게이션
**목적**: 페이지 간 이동 확인

**테스트 시나리오:**
1. 홈 화면에서 로그인 화면으로 이동
2. 뒤로가기 버튼 클릭
3. 네비게이션 동작 확인

**예상 결과:**
- 페이지 전환이 정상적으로 작동

#### 테스트 3: 폼 입력 테스트
**목적**: 사용자 입력 처리 확인

**테스트 시나리오:**
1. 로그인 화면에서 이메일/비밀번호 입력
2. 제출 버튼 클릭
3. 에러 메시지 또는 성공 처리 확인

**예상 결과:**
- 입력 필드에 값이 입력됨
- 제출 버튼이 작동함

### 3.4 테스트 실행 방법

**새 세션에서 실행:**
1. 웹 서버 실행: `cd app && npx expo start --web`
2. `/clear` 명령으로 새 세션 시작
3. Playwright MCP 도구 사용:
   ```
   Playwright MCP를 사용하여 다음을 수행하세요:
   1. http://localhost:8081 접속
   2. 페이지 로드 확인
   3. 스크린샷 캡처
   ```

**Playwright MCP 도구 예시:**
- `browser_navigate`: URL 이동
- `browser_click`: 요소 클릭
- `browser_screenshot`: 스크린샷 캡처
- `browser_fill`: 입력 필드에 값 입력

### 3.5 테스트 결과 기록

| 테스트 케이스 | 실행일시 | 결과 | 비고 |
|--------------|---------|------|------|
| 테스트 1: 페이지 로드 | 2026-01-22 | ✅ 성공 | Playwright(Node) 스크립트, 스크린샷 저장 |
| 테스트 2: 네비게이션 | - | ⬜ 미실행 | - |
| 테스트 3: 폼 입력 | 2026-01-22 | ⚠️ 부분 성공 | 이메일/비밀번호 필드 입력까지 완료, 로그인 버튼 셀렉터 보완 필요 |

### 3.6 Playwright E2E 테스트 실행 방법 (2026-01-22)

**사전 준비**
1. **웹 서버 실행** (둘 중 하나)
   - `cd app && npx expo start --web` (Expo 개발 서버, 기본 8081)
   - 또는 정적 빌드: `cd app/dist && npx http-server -p 8081 --cors`
2. **Playwright 설치** (최초 1회): `npm install playwright` 후 `npx playwright install chromium`

**실행**
```bash
# 프로젝트 루트에서
node scripts/playwright-e2e-test.mjs
```

**스크립트**: `scripts/playwright-e2e-test.mjs`  
- `http://localhost:8081` 접속 → 페이지 로드 확인 → 스크린샷 저장 (`tests/screenshots/`)  
- 이메일/비밀번호 필드 탐색 및 입력, 로그인 버튼 클릭(선택)  
- MCP-TEST-GUIDE의 테스트 1·3 시나리오를 Node Playwright로 실행

**참고**
- Playwright **MCP 도구**(`browser_navigate` 등) 대신 **Node Playwright 스크립트**로 동일 시나리오 검증
- Expo `start --web` 오류 시 `app/dist` + `http-server` 사용

---

## 4. 통합 테스트 시나리오

### 4.1 전체 플로우 테스트
**목적**: Supabase MCP와 Playwright MCP를 함께 사용하여 E2E 테스트

**시나리오:**
1. **Supabase MCP**: 테스트 데이터 확인
   ```sql
   SELECT COUNT(*) as store_count FROM stores;
   ```
2. **Playwright MCP**: 웹 앱에서 업체 목록 조회
3. **Supabase MCP**: 예약 생성
4. **Playwright MCP**: 웹 앱에서 예약 확인

---

## 5. 문제 해결

### 5.1 Supabase MCP 연결 실패
**증상**: `claude mcp list`에서 supabase가 연결되지 않음

**해결 방법:**
1. Supabase 프로젝트 URL과 API 키 확인
2. 환경변수 설정 확인
3. MCP 서버 재시작

### 5.2 Playwright MCP 연결 실패
**증상**: `claude mcp list`에서 playwright가 연결되지 않음

**해결 방법:**
1. Playwright 설치 확인: `npx playwright install`
2. MCP 서버 재시작

### 5.3 웹 서버 접속 불가
**증상**: 브라우저에서 localhost 접속 불가

**해결 방법:**
1. Expo 서버가 실행 중인지 확인
2. 포트 번호 확인 (기본: 8081)
3. 방화벽 설정 확인

---

## 6. 다음 단계

테스트 완료 후:
1. 테스트 결과를 `docs/WORK-LOG.md`에 기록
2. 문제가 발견되면 지속적 개선 원칙에 따라 룰 생성
3. 테스트 자동화 스크립트 작성 검토

---

**마지막 업데이트**: 2026-01-22

---

## 7. Supabase 클라이언트 직접 사용 테스트 (2026-01-22)

### 7.1 테스트 스크립트
MCP 서버 도구를 직접 사용할 수 없는 경우를 대비하여, Supabase 클라이언트를 직접 사용하는 테스트 스크립트를 작성했습니다.

**파일 위치:** `app/test-supabase-mcp.js`

### 7.2 실행 방법
```bash
cd app
node test-supabase-mcp.js
```

### 7.3 테스트 결과 (2026-01-22)
- ✅ Supabase 연결 성공
- ✅ 업체 데이터 조회 성공 (5개 업체: 할인마트 홍대점, 투굿투고 강남점, 테스트 베이커리, 테스트베이커리, 엄마손 반찬집)
- ⚠️ RPC 함수(`exec_sql`) 사용 불가 - 직접 쿼리로 대체
- ✅ 현재 시간 반환 성공

### 7.4 한계점
- 실제 MCP 서버 도구(`execute_sql`)를 직접 사용하지 않음
- Supabase 클라이언트를 통한 간접 테스트
- MCP 서버 도구 직접 사용은 새 세션에서 별도 테스트 필요

### 7.5 다음 단계
1. 새 세션에서 MCP 서버 도구 직접 사용 테스트
2. `execute_sql` 도구를 통한 SQL 쿼리 실행 확인
3. MCP 서버 설정 확인 및 문제 해결

### 7.6 Cursor에서 MCP 서버 직접 사용 테스트 방법

**Cursor에서 MCP 서버 사용 가능 여부:**
- ✅ Cursor는 MCP 서버를 지원합니다
- ✅ MCP 서버 도구를 직접 사용할 수 있습니다
- ⚠️ MCP 서버 설정이 필요할 수 있습니다

**테스트 방법:**

#### 방법 1: Cursor 채팅에서 직접 요청
Cursor 채팅에서 다음과 같이 요청하면 MCP 서버 도구를 사용할 수 있습니다:

```
Supabase MCP를 사용하여 다음 쿼리를 실행하세요:
SELECT COUNT(*) as store_count FROM stores;
```

또는:

```
Supabase MCP의 execute_sql 도구를 사용하여 다음 쿼리를 실행해주세요:
SELECT id, name, address FROM stores LIMIT 5;
```

#### 방법 2: MCP 서버 설정 확인
1. **Cursor 설정 확인**
   - Cursor 설정 (Settings) → Features → MCP Servers
   - 또는 Cursor 설정 파일 확인 (보통 `~/.cursor/mcp.json` 또는 프로젝트 루트의 설정 파일)

2. **MCP 서버 설정 예시**
   ```json
   {
     "mcpServers": {
       "supabase": {
         "command": "npx",
         "args": ["-y", "@supabase/mcp-server-supabase@latest"],
         "env": {
           "SUPABASE_URL": "your_supabase_url",
           "SUPABASE_ANON_KEY": "your_supabase_anon_key"
         }
       }
     }
   }
   ```

#### 방법 3: 현재 세션에서 테스트
현재 Cursor 세션에서 바로 테스트할 수 있습니다. 아래와 같이 요청하세요:

**테스트 케이스 1: 업체 개수 조회**
```
Supabase MCP를 사용하여 stores 테이블의 총 개수를 조회해주세요.
```

**테스트 케이스 2: 업체 목록 조회**
```
Supabase MCP를 사용하여 stores 테이블에서 최대 5개의 업체 정보를 조회해주세요.
```

**테스트 케이스 3: 테이블 목록 조회**
```
Supabase MCP를 사용하여 public 스키마의 모든 테이블 목록을 조회해주세요.
```

**참고:**
- Cursor에서 MCP 서버가 자동으로 인식되면 도구를 직접 사용할 수 있습니다
- MCP 서버가 연결되지 않는 경우, Cursor를 재시작하거나 MCP 서버 설정을 확인하세요
- 환경변수(`SUPABASE_URL`, `SUPABASE_ANON_KEY`)가 설정되어 있어야 합니다
