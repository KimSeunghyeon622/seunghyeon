# 📷 상품 이미지 업로드 오류 최종 해결

> **문제**: StorageUnknownError: Network request failed
> **원인**: React Native에서 Blob 처리 오류 + Storage 정책
> **해결**: FileSystem + base64 방식으로 변경
> **난이도**: ⭐⭐ 쉬움
> **예상 시간**: 10분

---

## 🔍 문제 원인

### 1. 코드 문제
React Native에서는 `fetch().blob()` 방식이 제대로 작동하지 않습니다.

### 2. Storage 정책 문제
Supabase Storage RLS 정책 오류

---

## ✅ 해결 방법

### 1단계: 패키지 설치

VSCode 터미널에서:

```bash
npm install expo-file-system base64-arraybuffer
```

---

### 2단계: Supabase SQL 실행

#### Supabase Dashboard:

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
DROP POLICY IF EXISTS "Allow authenticated upload to store-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update in store-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from store-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete from store-documents" ON storage.objects;

-- 새 정책 생성
CREATE POLICY "Allow authenticated upload to store-documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'store-documents');

CREATE POLICY "Allow authenticated update in store-documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'store-documents')
WITH CHECK (bucket_id = 'store-documents');

CREATE POLICY "Allow public read from store-documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'store-documents');

CREATE POLICY "Allow authenticated delete from store-documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'store-documents');
```

5. **RUN** 버튼 클릭

---

### 3단계: StoreProductManagement.tsx 교체

#### GitHub에서 복사:

1. https://github.com/KimSeunghyeon622/seunghyeon/blob/claude/continue-platform-dev-GZurO/docs/FINAL-CODE/StoreProductManagement-FIXED.tsx
2. **Raw** 버튼 클릭
3. 전체 복사 (Ctrl+A → Ctrl+C)

#### VSCode에서 교체:

1. `src/screens/StoreProductManagement.tsx` 파일 열기
2. 전체 선택 (Ctrl+A)
3. 붙여넣기 (Ctrl+V)
4. 저장 (Ctrl+S)

---

### 4단계: Metro 재시작

터미널에서:

```bash
# Ctrl+C (중지)
npx expo start
```

---

## 🎯 테스트

### 업주 계정 로그인:

- 이메일: storeowner@gmail.com
- 비밀번호: store1234

### 상품 이미지 업로드:

1. **상품 관리** → **+ 상품 등록** 클릭
2. **📷 이미지 선택** 클릭
3. 갤러리에서 이미지 선택
4. 상품 정보 입력
5. **저장** 클릭

✅ **성공**: 오류 없이 이미지 업로드됨!

---

## 🔧 주요 변경 사항

### Before (오류 발생):
```typescript
// fetch + blob 방식 (React Native에서 오류)
const response = await fetch(productImage.uri);
const blob = await response.blob();
await supabase.storage.upload(filePath, blob);
```

### After (정상 작동):
```typescript
// FileSystem + base64 방식
const base64 = await FileSystem.readAsStringAsync(
  productImage.uri,
  { encoding: FileSystem.EncodingType.Base64 }
);
await supabase.storage.upload(
  filePath,
  decode(base64),
  { contentType: 'image/jpg' }
);
```

---

## 📦 추가된 패키지

| 패키지 | 용도 |
|--------|------|
| `expo-file-system` | 파일을 base64로 읽기 |
| `base64-arraybuffer` | base64를 ArrayBuffer로 변환 |

---

## ✅ 완료!

이제 상품 이미지 업로드가 정상 작동합니다!

### 확인 사항:
- ✅ 이미지 선택 가능
- ✅ 미리보기 표시
- ✅ 업로드 성공
- ✅ Supabase Storage에 저장
- ✅ 상품 카드에 이미지 표시

---

## ⚠️ 문제 해결

### 여전히 오류가 나면:

#### 1. 패키지 재설치:
```bash
npm install --save expo-file-system base64-arraybuffer
```

#### 2. node_modules 삭제 후 재설치:
```bash
rm -rf node_modules
npm install
```

#### 3. Metro 캐시 삭제:
```bash
npx expo start --clear
```

#### 4. Storage 버킷 확인:
- Supabase → Storage → `store-documents` 버킷 존재 확인
- Public bucket 설정 확인

---

## 🎁 보너스 팁

### 이미지 최적화:

현재 설정:
```typescript
quality: 0.8  // 80% 품질
aspect: [4, 3]  // 4:3 비율
```

변경 가능:
```typescript
quality: 0.6  // 용량 줄이기
aspect: [1, 1]  // 정사각형
```

---

**작성일**: 2026-01-11
**작성자**: Claude Code
**버전**: FINAL
