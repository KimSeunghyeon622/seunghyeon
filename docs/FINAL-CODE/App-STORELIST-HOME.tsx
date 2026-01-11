import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from './src/lib/supabase';

// 로그인/회원가입 화면
import LoginScreen from './src/screens/LoginScreen';
import SignupTypeScreen from './src/screens/SignupTypeScreen';
import ConsumerSignupScreen from './src/screens/ConsumerSignupScreen';
import StoreSignupScreen from './src/screens/StoreSignupScreen';

// 소비자 화면 (모든 사용자 공통)
import StoreListHome from './src/screens/StoreListHome';
import StoreDetail from './src/screens/StoreDetail';
import ReservationScreen from './src/screens/ReservationScreen';
import MyReservations from './src/screens/MyReservations';
import ReviewScreen from './src/screens/ReviewScreen';
import MyPageScreen from './src/screens/MyPageScreen';

// 업주 화면 (마이페이지에서 접근)
import StoreDashboard from './src/screens/StoreDashboard';
import StoreProductManagement from './src/screens/StoreProductManagement';
import StoreCashManagement from './src/screens/StoreCashManagement';
import StoreReservationManagement from './src/screens/StoreReservationManagement';

type AuthScreen = 'login' | 'signupType' | 'consumerSignup' | 'storeSignup';
type ConsumerScreen = 'storelist' | 'detail' | 'reserve' | 'myreservations' | 'review' | 'mypage';
type StoreScreen = 'dashboard' | 'products' | 'cash' | 'reservations';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [isStoreOwner, setIsStoreOwner] = useState(false);
  const [showStoreMode, setShowStoreMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // 인증 화면 상태
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');

  // 소비자 화면 상태 (모든 사용자 공통) - 기본값을 'storelist'로 변경
  const [consumerScreen, setConsumerScreen] = useState<ConsumerScreen>('storelist');
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);

  // 업주 화면 상태
  const [storeScreen, setStoreScreen] = useState<StoreScreen>('dashboard');

  const checkUserType = useCallback(async (userId: string) => {
    try {
      // 소비자 체크
      const { data: consumer } = await supabase
        .from('consumers')
        .select('id')
        .eq('user_id', userId)
        .single();

      // 업주 체크
      const { data: store } = await supabase
        .from('stores')
        .select('id, is_approved')
        .eq('user_id', userId)
        .single();

      if (store) {
        setIsStoreOwner(true);
      }

      // 소비자 또는 업주 데이터가 있으면 로그인 성공
      if (consumer || store) {
        setConsumerScreen('storelist'); // 기본 화면을 업체 리스트로
        setShowStoreMode(false);
        return;
      }

      // 둘 다 없으면 로그아웃
      console.log('사용자 유형을 찾을 수 없습니다');
      await supabase.auth.signOut();
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
        setIsStoreOwner(false);
        setShowStoreMode(false);
        setAuthScreen('login');
      }
    });

    return () => subscription.unsubscribe();
  }, [checkUser, checkUserType]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00D563" />
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

  // 업주 모드 (사장님 페이지)
  if (showStoreMode && isStoreOwner) {
    return (
      <View style={{ flex: 1 }}>
        {storeScreen === 'dashboard' && (
          <StoreDashboard
            onManageProducts={() => setStoreScreen('products')}
            onManageCash={() => setStoreScreen('cash')}
            onManageReservations={() => setStoreScreen('reservations')}
            onLogout={async () => {
              setShowStoreMode(false);
              setConsumerScreen('mypage');
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

  // 소비자 모드 (모든 사용자 공통) - StoreListHome이 기본 홈 화면
  return (
    <View style={{ flex: 1 }}>
      {consumerScreen === 'storelist' && (
        <StoreListHome
          onSelectStore={(id) => {
            setSelectedStore(id);
            setConsumerScreen('detail');
          }}
          onViewReservations={() => setConsumerScreen('myreservations')}
          onViewMyPage={() => setConsumerScreen('mypage')}
        />
      )}

      {consumerScreen === 'detail' && (
        <StoreDetail
          storeId={selectedStore}
          onReserve={(product) => {
            setSelectedProduct(product);
            setConsumerScreen('reserve');
          }}
          onBack={() => setConsumerScreen('storelist')}
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
          onBack={() => setConsumerScreen('storelist')}
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

      {consumerScreen === 'mypage' && (
        <MyPageScreen
          onViewReservations={() => setConsumerScreen('myreservations')}
          onViewStoreManagement={() => {
            if (isStoreOwner) {
              setShowStoreMode(true);
              setStoreScreen('dashboard');
            }
          }}
          onBack={() => setConsumerScreen('storelist')}
        />
      )}
    </View>
  );
}
