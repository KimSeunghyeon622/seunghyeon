# 🚀 MVP 개선 기능 설치 가이드

> **작업**: 상품 이미지 + 검색 기능 + UI 개선
> **난이도**: ⭐⭐ 쉬움
> **예상 시간**: 20분

---

## 📋 추가되는 기능

### ✅ 1. 상품 이미지 업로드
- 업주가 상품 등록/수정 시 이미지 선택
- 상품 카드에 큰 이미지 표시
- Supabase Storage 자동 저장

### ✅ 2. 검색 기능
- 가게명 검색
- 주소 검색
- 실시간 검색 결과 표시

### ✅ 3. UI 개선
- 검색창 디자인
- 할인율 표시
- 평점 뱃지 개선
- 카드 레이아웃 개선

---

## 🔧 설치 순서

### 1단계: Supabase SQL 실행

#### Supabase Dashboard 접속:

1. https://supabase.com 로그인
2. 프로젝트 선택
3. 왼쪽 메뉴: **SQL Editor** 클릭
4. **New query** 클릭

#### SQL 복사 & 실행:

```sql
-- products 테이블에 image_url 컬럼 추가
ALTER TABLE products
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 코멘트 추가
COMMENT ON COLUMN products.image_url IS '상품 이미지 URL (Supabase Storage)';
```

5. **RUN** 버튼 클릭

#### 성공 확인:
```
ALTER TABLE
COMMENT
```

또는

```
Success. No rows returned
```

---

### 2단계: 파일 교체

Windows VSCode에서 다음 파일들을 교체합니다.

#### 교체할 파일 2개:

| 기존 파일 | 새 파일 | 위치 |
|-----------|---------|------|
| `src/screens/StoreProductManagement.tsx` | `StoreProductManagement-WITH-IMAGE.tsx` | `docs/FINAL-CODE/` |
| `src/screens/StoreList.tsx` | `StoreList-WITH-SEARCH.tsx` | `docs/FINAL-CODE/` |

---

#### 파일 교체 방법:

##### A. StoreProductManagement.tsx 교체

1. **GitHub에서 복사:**
   - https://github.com/KimSeunghyeon622/seunghyeon/blob/claude/continue-platform-dev-GZurO/docs/FINAL-CODE/StoreProductManagement-WITH-IMAGE.tsx
   - **Raw** 버튼 클릭
   - 전체 선택 (Ctrl+A) → 복사 (Ctrl+C)

2. **VSCode에서 교체:**
   - `src/screens/StoreProductManagement.tsx` 파일 열기
   - 전체 선택 (Ctrl+A)
   - 붙여넣기 (Ctrl+V)
   - 저장 (Ctrl+S)

##### B. StoreList.tsx 교체

1. **GitHub에서 복사:**
   - https://github.com/KimSeunghyeon622/seunghyeon/blob/claude/continue-platform-dev-GZurO/docs/FINAL-CODE/StoreList-WITH-SEARCH.tsx
   - **Raw** 버튼 클릭
   - 전체 선택 (Ctrl+A) → 복사 (Ctrl+C)

2. **VSCode에서 교체:**
   - `src/screens/StoreList.tsx` 파일 열기
   - 전체 선택 (Ctrl+A)
   - 붙여넣기 (Ctrl+V)
   - 저장 (Ctrl+S)

---

### 3단계: Metro 재시작

VSCode 터미널에서:

```bash
# Ctrl+C (Metro 서버 중지)
npx expo start
```

앱 새로고침:
- **R** 키 누르기 (새로고침)

---

## 🎯 테스트 방법

### 1️⃣ 검색 기능 테스트

#### 소비자 계정으로 로그인:

1. 앱 실행
2. 로그인 (일반고객 계정)
3. **업체 보기** 클릭

#### 검색 시도:

- 검색창에 "베이커리" 입력
- 검색 결과 확인
- **✕** 버튼으로 초기화

✅ **성공**: 검색어에 맞는 업체만 표시됨

---

### 2️⃣ 상품 이미지 업로드 테스트

#### 업주 계정으로 로그인:

1. 앱 실행
2. 로그인 (업주 계정)
   - 이메일: storeowner@gmail.com
   - 비밀번호: store1234

#### 상품에 이미지 추가:

1. **대시보드** → **상품 관리** 클릭
2. **+ 상품 등록** 클릭
3. **📷 이미지 선택** 클릭
4. 갤러리에서 이미지 선택
5. 상품 정보 입력:
   - 상품명: 크로와상
   - 정가: 5000
   - 할인가: 3000
   - 재고: 10
6. **저장** 클릭

✅ **성공**: 상품 카드에 이미지가 크게 표시됨

---

### 3️⃣ UI 개선 확인

#### 개선된 부분:

1. **검색창**
   - 깔끔한 디자인
   - 검색 결과 개수 표시
   - 초기화 버튼 (✕)

2. **상품 카드**
   - 큰 이미지 (150px 높이)
   - 둥근 모서리
   - 그림자 효과

3. **평점 표시**
   - ⭐ 아이콘
   - 배경색 뱃지

---

## 📊 Before & After

### Before (기존):
```
❌ 상품 이미지 없음
❌ 검색 기능 없음
❌ 단순한 리스트
```

### After (개선):
```
✅ 상품 이미지 업로드 & 표시
✅ 실시간 검색
✅ 검색 결과 개수 표시
✅ 큰 이미지 카드
✅ 할인율 계산 (향후 추가 가능)
```

---

## 🎨 사용자 UI 이미지 적용 (다음 단계)

사용자님이 준비하신 **PNG 파일**을 적용하면:

### 추가할 수 있는 것:

1. **할인 뱃지**
   ```tsx
   const discountRate = Math.round(
     ((originalPrice - discountedPrice) / originalPrice) * 100
   );

   <Text>{discountRate}% 할인</Text>
   ```

2. **배경 이미지**
   - 상품 카드 배경
   - 홈 화면 히어로 이미지

3. **아이콘**
   - 커스텀 아이콘
   - 로고

준비되시면 알려주세요!

---

## ✅ 완료!

모든 기능이 추가되었습니다!

### 추가된 기능 요약:

| 기능 | 상태 | 설명 |
|------|------|------|
| 상품 이미지 업로드 | ✅ | Expo ImagePicker + Supabase Storage |
| 검색 기능 | ✅ | 가게명/주소 실시간 검색 |
| 검색 결과 표시 | ✅ | "N개 업체 검색됨" |
| UI 개선 | ✅ | 카드 레이아웃, 평점 뱃지 |

---

## 🚀 다음 단계 (선택)

### 추가 개선 가능한 기능:

1. **할인율 자동 계산 & 표시**
2. **즐겨찾기 기능**
3. **상품 필터링** (할인율순, 평점순)
4. **무한 스크롤**
5. **상품 상세에서도 이미지 표시**

원하시는 기능 있으면 말씀해주세요!

---

**작성일**: 2026-01-11
**작성자**: Claude Code
**버전**: 1.0
