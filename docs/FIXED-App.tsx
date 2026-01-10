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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) {
        setScreen('home');
      }
    });

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
