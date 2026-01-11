# 🏪 업주 회원가입 기능 설치 가이드

> **작업**: 일반고객/사업자고객 회원가입 분리 및 사업자 정보 입력 기능 추가
> **난이도**: ⭐⭐⭐ 중급
> **예상 시간**: 30분

---

## 📋 목차

1. [필요한 패키지 설치](#1단계-필요한-패키지-설치)
2. [새로운 화면 파일 추가](#2단계-새로운-화면-파일-추가)
3. [App.tsx 교체](#3단계-apptsx-교체)
4. [Supabase 데이터베이스 수정](#4단계-supabase-데이터베이스-수정)
5. [Supabase Storage 설정](#5단계-supabase-storage-설정)
6. [테스트](#6단계-테스트)

---

## 1단계: 필요한 패키지 설치

### VSCode에서 터미널 열기

1. VSCode 상단 메뉴: **터미널** → **새 터미널**
2. 터미널에서 프로젝트 폴더로 이동 확인:
   ```
   C:\Users\user\OneDrive\바탕 화면\투굿투고\myapp
   ```

### expo-image-picker 설치

터미널에서 다음 명령어 실행:

```bash
npm install expo-image-picker
```

설치가 완료될 때까지 기다립니다 (약 1분).

---

## 2단계: 새로운 화면 파일 추가

다음 파일들을 `C:\Users\user\OneDrive\바탕 화면\투굿투고\myapp\src\screens\` 폴더에 추가합니다.

### 파일 위치 확인

```
myapp/
  └── src/
      └── screens/
          ├── SignupTypeScreen.tsx          ← 새로 추가
          ├── ConsumerSignupScreen.tsx      ← 새로 추가
          └── StoreSignupScreen.tsx         ← 새로 추가
```

### 파일 생성 방법

1. VSCode에서 `src/screens` 폴더 우클릭
2. **새 파일** 클릭
3. 파일명 입력 (예: `SignupTypeScreen.tsx`)
4. GitHub에서 다운로드한 코드 복사 → 붙여넣기

### 다운로드할 파일

- `SignupTypeScreen.tsx` - 회원가입 유형 선택 화면
- `ConsumerSignupScreen.tsx` - 일반고객 회원가입 화면
- `StoreSignupScreen.tsx` - 사업자 회원가입 화면

**파일 위치**: `docs/FINAL-CODE/` 폴더에 있습니다.

---

## 3단계: App.tsx 교체

### 기존 App.tsx 백업

1. 프로젝트 루트의 `App.tsx` 파일 열기
2. 전체 내용 복사
3. 새 파일 `App.tsx.backup` 만들어서 붙여넣기 (나중에 되돌리기 위함)

### 새 App.tsx 적용

1. `docs/FINAL-CODE/App-WITH-STORE-SIGNUP.tsx` 파일 열기
2. 전체 내용 복사
3. 프로젝트 루트의 `App.tsx` 파일에 붙여넣기 (기존 내용 전체 교체)
4. 저장 (Ctrl + S)

---

## 4단계: Supabase 데이터베이스 수정

### Supabase Dashboard 접속

1. https://supabase.com 접속
2. 로그인
3. 프로젝트 선택 (`qycwdncplofgzdrjtklb`)

### SQL 실행

1. 왼쪽 메뉴: **SQL Editor** 클릭
2. 우측 상단: **New query** 클릭
3. `docs/sql/04-add-store-signup-columns.sql` 파일 열기
4. **전체 내용 복사**
5. SQL Editor에 **붙여넿기**
6. 우측 하단: **RUN** 버튼 클릭

### 성공 확인

실행 후 다음 메시지가 나오면 성공:

```
Success. No rows returned
```

또는

```
ALTER TABLE
UPDATE 0
COMMENT
```

### 오류 발생 시

- SQL을 다시 복사해서 붙여넣기
- **RUN** 버튼 다시 클릭
- 그래도 안 되면 에러 메시지 캡처해서 Claude에게 보여주기

---

## 5단계: Supabase Storage 설정

### Storage 버킷 생성

1. Supabase Dashboard → 왼쪽 메뉴: **Storage** 클릭
2. 우측 상단: **New bucket** 버튼 클릭
3. 다음 정보 입력:
   - **Name**: `store-documents`
   - **Public bucket**: **✓ 체크** (꼭 체크하세요!)
   - **File size limit**: `5 MB`
4. **Create bucket** 클릭

### Storage 정책 설정

1. 방금 만든 `store-documents` 버킷 클릭
2. 상단 **Policies** 탭 클릭
3. **New policy** 버튼 클릭

#### 정책 1: 업로드 허용

- **Policy name**: `Allow authenticated users to upload`
- **Allowed operation**: `INSERT` 선택
- **Target roles**: `authenticated` 선택
- **WITH CHECK using the following SQL**:
  ```sql
  true
  ```
- **Create policy** 클릭

#### 정책 2: 읽기 허용

- **New policy** 버튼 다시 클릭
- **Policy name**: `Allow public read access`
- **Allowed operation**: `SELECT` 선택
- **Target roles**: `public` 선택
- **USING the following SQL**:
  ```sql
  true
  ```
- **Create policy** 클릭

### 완료 확인

`store-documents` 버킷의 **Policies** 탭에 2개의 정책이 보이면 성공!

---

## 6단계: 테스트

### 앱 실행

터미널에서:

```bash
npx expo start
```

### 테스트 시나리오

#### 테스트 1: 일반고객 회원가입

1. 앱 실행
2. **회원가입** 버튼 클릭
3. **일반고객** 선택
4. 정보 입력:
   - 이름: 홍길동
   - 전화번호: 010-1234-5678
   - 이메일: test@test.com
   - 비밀번호: test1234
5. **회원가입** 버튼 클릭
6. 성공 메시지 확인

#### 테스트 2: 사업자 회원가입

1. 앱 실행
2. **회원가입** 버튼 클릭
3. **사업자고객** 선택
4. 기본 정보 입력:
   - 이름: 김업주
   - 전화번호: 010-9876-5432
   - 이메일: store@test.com
   - 비밀번호: store1234
5. 사업자 정보 입력:
   - 가게명: 테스트베이커리
   - 사업자번호: 123-45-67890
   - 주소: 서울시 강남구 테헤란로 123
6. **이미지 선택** 버튼 클릭 → 사진 선택
7. **회원가입** 버튼 클릭
8. 성공 메시지 확인

### Supabase에서 확인

#### consumers 테이블 확인

1. Supabase Dashboard → **Table Editor** → `consumers`
2. 방금 가입한 일반고객 데이터 확인

#### stores 테이블 확인

1. Supabase Dashboard → **Table Editor** → `stores`
2. 방금 가입한 사업자 데이터 확인
3. 다음 컬럼 확인:
   - ✅ owner_name: "김업주"
   - ✅ business_number: "123-45-67890"
   - ✅ business_registration_url: URL 값 존재
   - ✅ is_approved: false

#### Storage 파일 확인

1. Supabase Dashboard → **Storage** → `store-documents`
2. `business-registrations/` 폴더 클릭
3. 업로드된 이미지 파일 확인

---

## ✅ 완료!

모든 단계가 성공했다면 업주 회원가입 기능이 완성되었습니다!

---

## 🎯 다음 단계

### 관리자 승인 기능 (선택 사항)

현재 사업자 가입 시 `is_approved = false`로 설정됩니다.

**관리자 승인 방법**:

1. Supabase Dashboard → **Table Editor** → `stores`
2. 승인할 업체 찾기
3. `is_approved` 컬럼을 `true`로 변경
4. 저장

**향후 개선**:
- 관리자 대시보드 화면 만들기
- 승인 대기 목록 보기
- 사업자등록증 이미지 확인
- 승인/거부 버튼

---

## ⚠️ 문제 해결

### 패키지 설치 오류

```bash
npm install --legacy-peer-deps expo-image-picker
```

### import 오류

- 파일 경로 확인: `./src/screens/SignupTypeScreen`
- 파일명 대소문자 확인

### 이미지 업로드 실패

- Storage 버킷 이름 확인: `store-documents`
- Public bucket 체크 확인
- RLS 정책 확인

### 회원가입 후 로그인 안 됨

- Supabase에서 `consumers` 또는 `stores` 테이블에 데이터가 있는지 확인
- `user_id`가 올바르게 저장되었는지 확인

---

## 📞 도움이 필요하면

- 에러 메시지 캡처
- 어느 단계에서 문제가 발생했는지 메모
- Claude에게 질문하기

---

**작성일**: 2026-01-11
**작성자**: Claude Code
**버전**: 1.0
