import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from './src/lib/supabase';

// 로그인/회원가입 화면
import LoginScreen from './src/screens/LoginScreen';
import SignupTypeScreen from './src/screens/SignupTypeScreen';
import ConsumerSignupScreen from './src/screens/ConsumerSignupScreen';
import StoreSignupScreen from './src/screens/StoreSignupScreen';

// 소비자 화면
import HomeScreen from './src/screens/HomeScreen';
import StoreListScreen from './src/screens/StoreList';
import StoreDetail from './src/screens/StoreDetail';
import ReservationScreen from './src/screens/ReservationScreen';
import MyReservations from './src/screens/MyReservations';
import ReviewScreen from './src/screens/ReviewScreen';

// 업주 화면
import StoreDashboard from './src/screens/StoreDashboard';
import StoreProductManagement from './src/screens/StoreProductManagement';
import StoreCashManagement from './src/screens/StoreCashManagement';
import StoreReservationManagement from './src/screens/StoreReservationManagement';

type UserType = 'consumer' | 'store' | null;
type AuthScreen = 'login' | 'signupType' | 'consumerSignup' | 'storeSignup';
type ConsumerScreen = 'home' | 'stores' | 'detail' | 'reserve' | 'myreservations' | 'review';
type StoreScreen = 'dashboard' | 'products' | 'cash' | 'reservations';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [userType, setUserType] = useState<UserType>(null);
  const [loading, setLoading] = useState(true);

  // 인증 화면 상태
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');

  // 소비자 상태
  const [consumerScreen, setConsumerScreen] = useState<ConsumerScreen>('home');
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);

  // 업주 상태
  const [storeScreen, setStoreScreen] = useState<StoreScreen>('dashboard');

  const checkUserType = useCallback(async (userId: string) => {
    try {
      // 소비자 체크
      const { data: consumer } = await supabase
        .from('consumers')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (consumer) {
        setUserType('consumer');
        setConsumerScreen('home');
        return;
      }

      // 업주 체크
      const { data: store } = await supabase
        .from('stores')
        .select('id, is_approved')
        .eq('user_id', userId)
        .single();

      if (store) {
        setUserType('store');
        setStoreScreen('dashboard');
        return;
      }

      // 둘 다 아니면 로그아웃
      console.log('사용자 유형을 찾을 수 없습니다');
      await supabase.auth.signOut();
      setUserType(null);
      setAuthScreen('login');
    } catch (error) {
      console.error('사용자 유형 확인 오류:', error);
    }
  }, []);

  const checkUser = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        await checkUserType(session.user.id);
      }
    } catch (error) {
      console.error('사용자 확인 오류:', error);
    } finally {
      setLoading(false);
    }
  }, [checkUserType]);

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkUserType(session.user.id);
      } else {
        setUserType(null);
        setAuthScreen('login');
      }
    });

    return () => subscription.unsubscribe();
  }, [checkUser, checkUserType]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // 로그인하지 않은 경우
  if (!session) {
    return (
      <View style={{ flex: 1 }}>
        {authScreen === 'login' && (
          <LoginScreen onSignup={() => setAuthScreen('signupType')} />
        )}

        {authScreen === 'signupType' && (
          <SignupTypeScreen
            onSelectConsumer={() => setAuthScreen('consumerSignup')}
            onSelectStore={() => setAuthScreen('storeSignup')}
            onBack={() => setAuthScreen('login')}
          />
        )}

        {authScreen === 'consumerSignup' && (
          <ConsumerSignupScreen
            onBack={() => setAuthScreen('signupType')}
            onSuccess={() => setAuthScreen('login')}
          />
        )}

        {authScreen === 'storeSignup' && (
          <StoreSignupScreen
            onBack={() => setAuthScreen('signupType')}
            onSuccess={() => setAuthScreen('login')}
          />
        )}
      </View>
    );
  }

  // 소비자인 경우
  if (userType === 'consumer') {
    return (
      <View style={{ flex: 1 }}>
        {consumerScreen === 'home' && (
          <HomeScreen
            onViewStores={() => setConsumerScreen('stores')}
            onViewReservations={() => setConsumerScreen('myreservations')}
          />
        )}

        {consumerScreen === 'stores' && (
          <StoreListScreen
            onSelectStore={(id) => {
              setSelectedStore(id);
              setConsumerScreen('detail');
            }}
          />
        )}

        {consumerScreen === 'detail' && (
          <StoreDetail
            storeId={selectedStore}
            onReserve={(product) => {
              setSelectedProduct(product);
              setConsumerScreen('reserve');
            }}
            onBack={() => setConsumerScreen('stores')}
          />
        )}

        {consumerScreen === 'reserve' && selectedProduct && (
          <ReservationScreen
            product={selectedProduct}
            onBack={() => setConsumerScreen('detail')}
            onComplete={() => setConsumerScreen('myreservations')}
          />
        )}

        {consumerScreen === 'myreservations' && (
          <MyReservations
            onBack={() => setConsumerScreen('home')}
            onWriteReview={(reservation) => {
              setSelectedReservation(reservation);
              setConsumerScreen('review');
            }}
          />
        )}

        {consumerScreen === 'review' && selectedReservation && (
          <ReviewScreen
            reservation={selectedReservation}
            onBack={() => {
              setSelectedReservation(null);
              setConsumerScreen('myreservations');
            }}
          />
        )}
      </View>
    );
  }

  // 업주인 경우
  if (userType === 'store') {
    return (
      <View style={{ flex: 1 }}>
        {storeScreen === 'dashboard' && (
          <StoreDashboard
            onManageProducts={() => setStoreScreen('products')}
            onManageCash={() => setStoreScreen('cash')}
            onManageReservations={() => setStoreScreen('reservations')}
            onLogout={async () => {
              await supabase.auth.signOut();
              setUserType(null);
              setAuthScreen('login');
            }}
          />
        )}

        {storeScreen === 'products' && (
          <StoreProductManagement
            onBack={() => setStoreScreen('dashboard')}
          />
        )}

        {storeScreen === 'cash' && (
          <StoreCashManagement
            onBack={() => setStoreScreen('dashboard')}
          />
        )}

        {storeScreen === 'reservations' && (
          <StoreReservationManagement
            onBack={() => setStoreScreen('dashboard')}
          />
        )}
      </View>
    );
  }

  // 사용자 유형 확인 중
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}
