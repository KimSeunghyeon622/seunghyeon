# 📸 상품 이미지 업로드 기능 설치 가이드

> **작업**: 상품에 이미지를 추가하고 표시하는 기능
> **난이도**: ⭐⭐ 쉬움
> **예상 시간**: 10분

---

## 📋 작업 순서

1. [Supabase SQL 실행](#1단계-supabase-sql-실행)
2. [StoreProductManagement 파일 교체](#2단계-storeproductmanagement-파일-교체)
3. [테스트](#3단계-테스트)

---

## 1단계: Supabase SQL 실행

### Supabase Dashboard 접속

1. https://supabase.com 접속
2. 로그인
3. 프로젝트 선택

### SQL 실행

1. 왼쪽 메뉴: **SQL Editor** 클릭
2. **New query** 클릭
3. 아래 SQL 복사 & 붙여넣기:

```sql
-- products 테이블에 image_url 컬럼 추가
ALTER TABLE products
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 코멘트 추가
COMMENT ON COLUMN products.image_url IS '상품 이미지 URL (Supabase Storage)';
```

4. **RUN** 버튼 클릭

### 성공 확인

```
Success. No rows returned
```

또는

```
ALTER TABLE
COMMENT
```

이렇게 나오면 성공!

---

## 2단계: StoreProductManagement 파일 교체

### Windows VSCode에서:

1. **GitHub에서 파일 다운로드:**
   - https://github.com/KimSeunghyeon622/seunghyeon/blob/claude/continue-platform-dev-GZurO/docs/FINAL-CODE/StoreProductManagement-WITH-IMAGE.tsx
   - **Raw** 버튼 클릭
   - 전체 내용 복사 (Ctrl+A → Ctrl+C)

2. **기존 파일 백업:**
   - `src/screens/StoreProductManagement.tsx` 파일 열기
   - 내용 전체 선택 (Ctrl+A)
   - 새 탭에 붙여넣기 (백업)

3. **새 코드 적용:**
   - 다시 `src/screens/StoreProductManagement.tsx` 파일 열기
   - 전체 선택 (Ctrl+A)
   - GitHub에서 복사한 코드 붙여넣기 (Ctrl+V)
   - 저장 (Ctrl+S)

---

## 3단계: 테스트

### Metro 재시작

터미널에서:

```bash
# Ctrl+C (중지)
npx expo start
```

### 앱에서 테스트

1. **업주 계정으로 로그인**
   - 이메일: storeowner@gmail.com
   - 비밀번호: store1234

2. **대시보드** → **상품 관리** 클릭

3. **+ 상품 등록** 클릭

4. **📷 이미지 선택** 버튼 클릭
   - 갤러리에서 이미지 선택
   - 미리보기 확인

5. 상품 정보 입력:
   - 상품명: 크로와상
   - 정가: 5000
   - 할인가: 3000
   - 재고: 10

6. **저장** 클릭

7. 상품 카드에 이미지가 표시되는지 확인! ✅

---

## 🎨 추가 기능

### 이미지가 표시되는 곳:

✅ **상품 관리 화면** (업주)
- 상품 카드에 큰 이미지 표시

추후 추가 예정:
- ⏳ 상품 목록 (소비자)
- ⏳ 상품 상세 (소비자)
- ⏳ 예약 화면

---

## ✅ 완료!

이제 상품에 이미지를 추가할 수 있습니다!

### 저장 위치:
- **Supabase Storage** → `store-documents` 버킷
- **폴더**: `product-images/`

### 파일명 형식:
```
product-images/{상품ID}_{타임스탬프}.jpg
```

예시:
```
product-images/abc123_1673456789.jpg
```

---

## 📸 다음 단계

사용자님이 준비하신 **UI 이미지 파일(PNG)**을 적용하면:
- 더 예쁜 상품 카드
- 할인 뱃지
- 카드 레이아웃

이 가능합니다!

---

**작성일**: 2026-01-11
**작성자**: Claude Code
