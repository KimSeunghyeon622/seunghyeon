# 리뷰 기능 통합 가이드

> **작성일**: 2026-01-10
> **목적**: MyReservations 및 ReviewScreen을 App.tsx에 통합

---

## 📋 개요

이 문서는 리뷰 작성 기능을 App.tsx 네비게이션 시스템에 통합하는 방법을 설명합니다.

---

## 🔧 App.tsx 수정사항

### 1. ReviewScreen Import 추가

**위치**: App.tsx 상단 import 섹션

**추가할 코드**:
```typescript
import ReviewScreen from './src/screens/ReviewScreen';
```

---

### 2. Screen State 타입 확장

**기존 코드**:
```typescript
const [screen, setScreen] = useState<'login' | 'signup' | 'home' | 'stores' | 'detail' | 'reserve' | 'myreservations'>('login');
```

**수정된 코드**:
```typescript
const [screen, setScreen] = useState<'login' | 'signup' | 'home' | 'stores' | 'detail' | 'reserve' | 'myreservations' | 'review'>('login');
```

---

### 3. Reservation State 추가

**위치**: 기존 state 선언 아래

**추가할 코드**:
```typescript
const [selectedReservation, setSelectedReservation] = useState<any>(null);
```

---

### 4. MyReservations 화면 수정

**기존 코드** (찾기):
```typescript
{screen === 'myreservations' && (
  <MyReservations onBack={() => setScreen('home')} />
)}
```

**수정된 코드**:
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
```

---

### 5. ReviewScreen 화면 추가

**위치**: MyReservations 화면 렌더링 코드 바로 아래

**추가할 코드**:
```typescript
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

---

## 📝 전체 App.tsx 수정 요약

### Import 섹션
```typescript
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';
import StoreListScreen from './src/screens/StoreList';
import StoreDetail from './src/screens/StoreDetail';
import ReservationScreen from './src/screens/ReservationScreen';
import MyReservations from './src/screens/MyReservations';
import ReviewScreen from './src/screens/ReviewScreen';  // ← 추가
```

### State 선언 섹션
```typescript
const [session, setSession] = useState<any>(null);
const [screen, setScreen] = useState<'login' | 'signup' | 'home' | 'stores' | 'detail' | 'reserve' | 'myreservations' | 'review'>('login');  // ← 'review' 추가
const [selectedStore, setSelectedStore] = useState('');
const [selectedProduct, setSelectedProduct] = useState<any>(null);
const [selectedReservation, setSelectedReservation] = useState<any>(null);  // ← 추가
```

### 화면 렌더링 섹션 (session 있을 때)
```typescript
{session && (
  <>
    {screen === 'home' && (
      <HomeScreen
        onViewStores={() => setScreen('stores')}
        onViewReservations={() => setScreen('myreservations')}
      />
    )}

    {screen === 'stores' && (
      <StoreListScreen onSelectStore={(id) => { setSelectedStore(id); setScreen('detail'); }} />
    )}

    {screen === 'detail' && (
      <StoreDetail
        storeId={selectedStore}
        onReserve={(product) => {
          setSelectedProduct(product);
          setScreen('reserve');
        }}
        onBack={() => setScreen('stores')}
      />
    )}

    {screen === 'reserve' && selectedProduct && (
      <ReservationScreen
        product={selectedProduct}
        onBack={() => setScreen('detail')}
        onComplete={() => setScreen('myreservations')}
      />
    )}

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
  </>
)}
```

---

## ✅ 테스트 플로우

1. **로그인** → HomeScreen
2. **"내 예약 보기"** 클릭 → MyReservations
3. **예약 내역 중 "리뷰 작성"** 버튼 클릭 → ReviewScreen
4. **별점 선택 및 리뷰 내용 입력** → 리뷰 등록 버튼 클릭
5. **완료 알림** → MyReservations로 복귀
6. **업체 평점 자동 업데이트** 확인 (Supabase에서)

---

## 🔍 예상되는 이슈 및 해결방법

### 이슈 1: "리뷰 작성" 버튼이 보이지 않음
**원인**: 예약 상태가 'confirmed'가 아님
**해결**: Supabase에서 reservations 테이블의 status를 'confirmed'로 변경

### 이슈 2: 리뷰 제출 시 에러
**원인**: reviews 테이블에 이미 해당 reservation_id 리뷰가 존재
**해결**: 중복 리뷰 방지 로직 추가 필요 (향후 개선)

### 이슈 3: 평점이 업데이트되지 않음
**원인**: ReviewScreen의 평점 업데이트 로직 실행 실패
**확인**: Supabase에서 reviews 테이블 데이터 확인 및 stores 테이블의 average_rating 컬럼 확인

---

## 📊 데이터베이스 확인

### 리뷰 확인
```sql
SELECT * FROM reviews ORDER BY created_at DESC;
```

### 업체 평점 확인
```sql
SELECT id, name, average_rating FROM stores;
```

### 예약 상태 확인
```sql
SELECT id, reservation_number, status FROM reservations WHERE status = 'confirmed';
```

---

## 🚀 다음 단계

리뷰 기능 통합 완료 후:

1. **리뷰 중복 방지**: 이미 리뷰 작성한 예약은 버튼 숨김 처리
2. **리뷰 목록 표시**: StoreDetail에 리뷰 목록 추가
3. **리뷰 답글**: 업체가 리뷰에 답글 작성 기능
4. **이미지 첨부**: 리뷰 작성 시 사진 업로드 기능

---

**문서 작성**: Claude Code
**최종 검토**: 2026-01-10
