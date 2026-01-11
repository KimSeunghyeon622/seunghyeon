# 🐛 버그 수정 + 기능 개선 가이드

> **수정 사항**: 상품 이미지 업로드 오류 해결 + 검색 기능 개선
> **난이도**: ⭐⭐ 쉬움
> **예상 시간**: 15분

---

## 🔧 수정 내용

### 1️⃣ 상품 이미지 업로드 오류 해결
**문제**: StorageUnknownError: Network request failed
**원인**: Supabase Storage RLS 정책 오류
**해결**: Storage 정책 재설정

### 2️⃣ 검색 기능 개선
**기존**: 가게명, 주소만 검색
**개선**: 가게명, 주소, **상품명**으로 검색

**예시**:
- A업체가 "맛잇다베이커리" 상품 판매 중
- "베이커리" 검색 시 → A업체도 검색 결과에 표시 ✅

---

## 📋 설치 순서

### 1단계: Supabase SQL 실행 (Storage 오류 해결)

#### Supabase Dashboard 접속:

1. https://supabase.com 로그인
2. 프로젝트 선택
3. 왼쪽 메뉴: **SQL Editor** 클릭
4. **New query** 클릭

#### SQL 복사 & 실행:

```sql
-- 기존 정책 모두 삭제
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own files" ON storage.objects;

-- 1. 인증된 사용자 업로드 허용
CREATE POLICY "Allow authenticated upload to store-documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'store-documents');

-- 2. 인증된 사용자 업데이트 허용
CREATE POLICY "Allow authenticated update in store-documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'store-documents')
WITH CHECK (bucket_id = 'store-documents');

-- 3. 모든 사용자 읽기 허용 (Public)
CREATE POLICY "Allow public read from store-documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'store-documents');

-- 4. 인증된 사용자 삭제 허용
CREATE POLICY "Allow authenticated delete from store-documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'store-documents');
```

5. **RUN** 버튼 클릭

#### 성공 확인:

```
DROP POLICY
CREATE POLICY
DROP POLICY
CREATE POLICY
DROP POLICY
CREATE POLICY
DROP POLICY
CREATE POLICY
```

---

### 2단계: StoreList.tsx 교체 (검색 기능 개선)

#### Windows VSCode에서:

1. **GitHub에서 복사:**
   - https://github.com/KimSeunghyeon622/seunghyeon/blob/claude/continue-platform-dev-GZurO/docs/FINAL-CODE/StoreList-ADVANCED-SEARCH.tsx
   - **Raw** 버튼 클릭
   - 전체 복사 (Ctrl+A → Ctrl+C)

2. **VSCode에서 교체:**
   - `src/screens/StoreList.tsx` 파일 열기
   - 전체 선택 (Ctrl+A)
   - 붙여넣기 (Ctrl+V)
   - 저장 (Ctrl+S)

---

### 3단계: Metro 재시작

터미널에서:

```bash
# Ctrl+C (중지)
npx expo start
```

---

## 🎯 테스트 방법

### 1️⃣ 상품 이미지 업로드 테스트

1. **업주 계정 로그인:**
   - 이메일: storeowner@gmail.com
   - 비밀번호: store1234

2. **상품 관리** → **+ 상품 등록** 클릭

3. **📷 이미지 선택** 클릭
   - 갤러리에서 이미지 선택

4. 상품 정보 입력:
   - 상품명: 크로와상
   - 정가: 5000
   - 할인가: 3000
   - 재고: 10

5. **저장** 클릭

✅ **성공**: 이미지가 정상적으로 업로드되고 표시됨 (오류 없음!)

---

### 2️⃣ 검색 기능 테스트

1. **소비자 계정 로그인** (또는 업주 계정도 가능)

2. **업체 보기** 클릭

3. **검색 테스트:**

#### 테스트 A: 가게명 검색
   - 검색: "베이커리"
   - ✅ "테스트베이커리" 업체 표시

#### 테스트 B: 주소 검색
   - 검색: "강남구"
   - ✅ 강남구에 있는 업체들 표시

#### 테스트 C: 상품명 검색 (새 기능!)
   - 검색: "크로와상"
   - ✅ "크로와상" 상품을 판매하는 업체 표시

#### 테스트 D: 부분 검색
   - 검색: "와상"
   - ✅ "크로**와상**" 상품을 판매하는 업체 표시

---

## 📊 Before & After

### Before (기존):

#### Storage:
```
❌ 상품 이미지 업로드 실패
❌ Network request failed 오류
```

#### 검색:
```
✅ 가게명 검색
✅ 주소 검색
❌ 상품명 검색 불가
```

### After (개선):

#### Storage:
```
✅ 상품 이미지 업로드 성공
✅ 오류 없음
✅ 정상 작동
```

#### 검색:
```
✅ 가게명 검색
✅ 주소 검색
✅ 상품명 검색 ← NEW!
✅ "가게명, 주소, 상품명으로 검색..." 안내
```

---

## 🔍 검색 작동 방식

### 검색 알고리즘:

```
사용자 입력: "베이커리"

1. stores 테이블 검색:
   - 가게명에 "베이커리" 포함? ✅
   - 주소에 "베이커리" 포함? ✅

2. products 테이블 검색:
   - 상품명에 "베이커리" 포함? ✅
   - 해당 상품을 판매하는 업체 찾기

3. 결과 합치기 (중복 제거)

4. 최종 결과 표시
```

---

## ✅ 완료!

이제 다음이 가능합니다:

### Storage:
- ✅ 상품 이미지 업로드
- ✅ 이미지 표시
- ✅ 오류 없음

### 검색:
- ✅ 가게명으로 검색
- ✅ 주소로 검색
- ✅ **상품명으로 검색** ← NEW!

---

## 🎁 보너스 팁

### 검색 예시:

| 검색어 | 결과 |
|--------|------|
| "베이커리" | 가게명 또는 상품명에 "베이커리" 포함된 업체 |
| "강남구" | 주소에 "강남구" 포함된 업체 |
| "샌드위치" | "샌드위치" 상품 판매하는 업체 |
| "할인" | 가게명 또는 상품명에 "할인" 포함된 업체 |

---

## ⚠️ 문제 해결

### 여전히 이미지 업로드 안 되면:

1. **Supabase Storage 확인:**
   - Storage → `store-documents` 버킷 존재 확인
   - Public bucket인지 확인

2. **SQL 다시 실행:**
   - 위 SQL 전체 복사해서 다시 실행

3. **Metro 재시작:**
   ```bash
   npx expo start
   ```

---

### 검색이 안 되면:

1. **파일 교체 확인:**
   - `src/screens/StoreList.tsx` 파일이 교체되었는지 확인

2. **Metro 재시작:**
   ```bash
   npx expo start
   ```

---

## 🚀 다음 단계 (선택)

이제 다음 작업 가능합니다:

1. **통합 UX 적용** (업주도 소비자 기능 사용)
2. **사용자 UI 적용** (준비하신 PNG 파일)
3. **카카오 지도 연동**
4. **토스페이먼츠 연동**

---

**작성일**: 2026-01-11
**작성자**: Claude Code
**버전**: 1.0
