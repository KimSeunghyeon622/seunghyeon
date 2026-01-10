# 🚀 리뷰 기능 추가 - 초간단 가이드

> **오류 수정 완료! 이 가이드만 따라하세요!**

---

## 📂 1단계: MyReservations.tsx 수정

**파일 위치**: `C:\Users\user\OneDrive\바탕 화면\투굿투고\myapp\src\screens\MyReservations.tsx`

### ✅ 할 일:
1. 기존 파일을 **모두 삭제**
2. `FIXED-MyReservations.tsx` 내용을 **전부 복사해서 붙여넣기**
3. 저장 (Ctrl+S)

---

## 📂 2단계: ReviewScreen.tsx 새로 만들기

**파일 위치**: `C:\Users\user\OneDrive\바탕 화면\투굿투고\myapp\src\screens\ReviewScreen.tsx`

### ✅ 할 일:
1. `src/screens` 폴더에 **새 파일** 생성: `ReviewScreen.tsx`
2. `FIXED-ReviewScreen.tsx` 내용을 **전부 복사해서 붙여넣기**
3. 저장 (Ctrl+S)

---

## 📂 3단계: App.tsx 수정

**파일 위치**: `C:\Users\user\OneDrive\바탕 화면\투굿투고\myapp\App.tsx`

### ✅ 할 일:

#### 3-1. Import 추가 (8번째 줄쯤)
기존:
```typescript
import ReservationScreen from './src/screens/ReservationScreen';
```

아래에 **이 줄 추가**:
```typescript
import MyReservations from './src/screens/MyReservations';
import ReviewScreen from './src/screens/ReviewScreen';
```

---

#### 3-2. Screen 타입 수정 (찾기: `useState<'login'`)
기존:
```typescript
const [screen, setScreen] = useState<'login' | 'signup' | 'home' | 'stores' | 'detail' | 'reserve'>('login');
```

변경:
```typescript
const [screen, setScreen] = useState<'login' | 'signup' | 'home' | 'stores' | 'detail' | 'reserve' | 'myreservations' | 'review'>('login');
```

---

#### 3-3. State 추가 (selectedProduct 아래)
기존:
```typescript
const [selectedProduct, setSelectedProduct] = useState<any>(null);
```

아래에 **이 줄 추가**:
```typescript
const [selectedReservation, setSelectedReservation] = useState<any>(null);
```

---

#### 3-4. HomeScreen 수정 (찾기: `{screen === 'home'`)
기존:
```typescript
{screen === 'home' && (
  <HomeScreen onViewStores={() => setScreen('stores')} />
)}
```

변경:
```typescript
{screen === 'home' && (
  <HomeScreen
    onViewStores={() => setScreen('stores')}
    onViewReservations={() => setScreen('myreservations')}
  />
)}
```

---

#### 3-5. ReservationScreen 수정 (찾기: `{screen === 'reserve'`)
기존:
```typescript
{screen === 'reserve' && selectedProduct && (
  <ReservationScreen
    product={selectedProduct}
    onBack={() => setScreen('detail')}
    onComplete={() => setScreen('home')}
  />
)}
```

변경 (`onComplete` 부분만):
```typescript
{screen === 'reserve' && selectedProduct && (
  <ReservationScreen
    product={selectedProduct}
    onBack={() => setScreen('detail')}
    onComplete={() => setScreen('myreservations')}
  />
)}
```

---

#### 3-6. 새 화면 추가 (ReservationScreen 아래, `</>`  위)
ReservationScreen 렌더링 코드 **바로 아래**에 **이 코드 추가**:

```typescript
{screen === 'myreservations' && (
  <MyReservations
    onBack={() => setScreen('home')}
    onWriteReview={(reservation) => {
      setSelectedReservation(reservation);
      setScreen('review');
    }}
  />
)}

{screen === 'review' && selectedReservation && (
  <ReviewScreen
    reservation={selectedReservation}
    onBack={() => {
      setSelectedReservation(null);
      setScreen('myreservations');
    }}
  />
)}
```

저장 (Ctrl+S)

---

## 📂 4단계: HomeScreen.tsx 수정

**파일 위치**: `C:\Users\user\OneDrive\바탕 화면\투굿투고\myapp\src\screens\HomeScreen.tsx`

### ✅ 할 일:

#### 4-1. Props 타입 수정 (찾기: `export default function HomeScreen`)
기존:
```typescript
export default function HomeScreen({ onViewStores }: { onViewStores: () => void })
```

변경:
```typescript
export default function HomeScreen({ onViewStores, onViewReservations }: {
  onViewStores: () => void;
  onViewReservations: () => void;
})
```

---

#### 4-2. 버튼 추가 (찾기: "주변 업체 보기" 버튼)
"주변 업체 보기" 버튼 **바로 아래**에 **이 코드 추가**:

```typescript
<TouchableOpacity style={styles.button} onPress={onViewReservations}>
  <Text style={styles.buttonText}>내 예약 보기</Text>
</TouchableOpacity>
```

저장 (Ctrl+S)

---

## ✅ 완료!

이제 앱을 실행하세요:

```bash
npx expo start
```

### 테스트 순서:
1. 로그인
2. "내 예약 보기" 버튼 클릭
3. 예약 내역 확인
4. "리뷰 작성" 버튼 클릭 (confirmed 상태 예약만)
5. 별점 선택 + 리뷰 작성
6. "리뷰 등록" 버튼 클릭

---

## ❗ 만약 오류가 나면

### 오류 1: "내 예약 보기" 버튼이 안 보임
→ HomeScreen.tsx의 4단계를 다시 확인

### 오류 2: Cannot find module 'ReviewScreen'
→ 2단계에서 ReviewScreen.tsx 파일을 만들었는지 확인

### 오류 3: "리뷰 작성" 버튼이 안 보임
→ Supabase에서 예약 상태를 'confirmed'로 변경:
```sql
UPDATE reservations SET status = 'confirmed' WHERE id = '예약ID';
```

### 오류 4: TypeScript 타입 오류
→ 모든 수정사항을 정확히 따라했는지 다시 확인

---

## 📌 빠른 참조

### 수정할 파일 목록:
- ✅ MyReservations.tsx (전체 교체)
- ✅ ReviewScreen.tsx (새로 생성)
- ✅ App.tsx (6곳 수정)
- ✅ HomeScreen.tsx (2곳 수정)

**총 4개 파일 수정**

---

**작성**: Claude Code
**수정 완료**: 2026-01-10
