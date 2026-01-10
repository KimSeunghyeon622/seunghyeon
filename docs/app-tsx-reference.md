# App.tsx 완전한 참조 코드

> **작성일**: 2026-01-10
> **목적**: 리뷰 기능이 통합된 완전한 App.tsx 코드 예시

---

## 📄 전체 코드

```typescript
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from './src/lib/supabase';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';
import StoreListScreen from './src/screens/StoreList';
import StoreDetail from './src/screens/StoreDetail';
import ReservationScreen from './src/screens/ReservationScreen';
import MyReservations from './src/screens/MyReservations';
import ReviewScreen from './src/screens/ReviewScreen';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<'login' | 'signup' | 'home' | 'stores' | 'detail' | 'reserve' | 'myreservations' | 'review'>('login');
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);

  useEffect(() => {
    // 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) {
        setScreen('home');
      }
    });

    // 세션 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setScreen('home');
      } else {
        setScreen('login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* 로그인하지 않은 경우 */}
      {!session && (
        <>
          {screen === 'login' && (
            <LoginScreen onSignupPress={() => setScreen('signup')} />
          )}
          {screen === 'signup' && (
            <SignupScreen onLoginPress={() => setScreen('login')} />
          )}
        </>
      )}

      {/* 로그인한 경우 */}
      {session && (
        <>
          {screen === 'home' && (
            <HomeScreen
              onViewStores={() => setScreen('stores')}
              onViewReservations={() => setScreen('myreservations')}
            />
          )}

          {screen === 'stores' && (
            <StoreListScreen
              onSelectStore={(id) => {
                setSelectedStore(id);
                setScreen('detail');
              }}
            />
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
    </View>
  );
}
```

---

## 🔑 주요 변경사항 요약

### 1. Import 추가
```typescript
import ReviewScreen from './src/screens/ReviewScreen';
```

### 2. State 추가
```typescript
const [selectedReservation, setSelectedReservation] = useState<any>(null);
```

### 3. Screen Type 확장
```typescript
'login' | 'signup' | 'home' | 'stores' | 'detail' | 'reserve' | 'myreservations' | 'review'
```

### 4. MyReservations Props 추가
```typescript
<MyReservations
  onBack={() => setScreen('home')}
  onWriteReview={(reservation) => {
    setSelectedReservation(reservation);
    setScreen('review');
  }}
/>
```

### 5. ReviewScreen 렌더링 추가
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

## 📱 네비게이션 흐름

```
Login → Signup → Home
                   ↓
                Stores → StoreDetail → ReservationScreen
                   ↓                          ↓
              MyReservations ←――――――――――――――――――
                   ↓
              ReviewScreen
                   ↓
              MyReservations
```

---

## ✅ 완료 체크리스트

- [x] ReviewScreen import 추가
- [x] selectedReservation state 추가
- [x] screen type에 'review' 추가
- [x] MyReservations에 onWriteReview props 전달
- [x] ReviewScreen 렌더링 조건 추가
- [x] 뒤로가기 시 state 초기화 (setSelectedReservation(null))

---

**문서 작성**: Claude Code
**최종 검토**: 2026-01-10
