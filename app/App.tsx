/**
 * 재고 할인 중개 플랫폼 - 메인 앱
 * Zustand를 사용한 상태 관리
 */
import React, { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, BackHandler, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import { supabase } from './src/lib/supabase';
import {
  registerForPushNotifications,
  saveConsumerPushToken,
  saveStorePushToken,
} from './src/lib/pushNotifications';

// Zustand 스토어
import {
  useAuthStore,
  useNavigationStore,
  useSelectionStore,
} from './src/stores';

// 로그인/회원가입 화면
import ConsumerSignupScreen from './src/screens/ConsumerSignupScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupTypeScreen from './src/screens/SignupTypeScreen';
import StoreSignupScreen from './src/screens/StoreSignupScreen';

// 소비자 화면
import CartScreen from './src/screens/CartScreen';
import CustomerServiceScreen from './src/screens/CustomerServiceScreen';
import FAQScreen from './src/screens/FAQScreen';
import FavoriteStoresScreen from './src/screens/FavoriteStoresScreen';
import MyPageScreen from './src/screens/MyPageScreen';
import MyReservations from './src/screens/MyReservations';
import MyReviewsScreen from './src/screens/MyReviewsScreen';
import NotificationSettingsScreen from './src/screens/NotificationSettingsScreen';
import PurchaseHistoryScreen from './src/screens/PurchaseHistoryScreen';
import ReservationScreen from './src/screens/ReservationScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import StoreAllReviewsScreen from './src/screens/StoreAllReviewsScreen';
import StoreDetail from './src/screens/StoreDetail';
import StoreListHome from './src/screens/StoreListHome';
import BannerDetailScreen from './src/screens/BannerDetailScreen';
import NoticeListScreen from './src/screens/NoticeListScreen';
import NoticeDetailScreen from './src/screens/NoticeDetailScreen';

// 업주 화면
import StoreCashHistory from './src/screens/StoreCashHistory';
import StoreCashManagement from './src/screens/StoreCashManagement';
import StoreDashboard from './src/screens/StoreDashboard';
import StoreInfoManagement from './src/screens/StoreInfoManagement';
import StoreProductManagement from './src/screens/StoreProductManagement';
import StoreRegularCustomers from './src/screens/StoreRegularCustomers';
import StoreReservationManagement from './src/screens/StoreReservationManagement';
import StoreReviewManagement from './src/screens/StoreReviewManagement';
import StoreSalesStatistics from './src/screens/StoreSalesStatistics';
import OwnerNotificationSettingsScreen from './src/screens/OwnerNotificationSettingsScreen';

export default function App() {
  // 인증 스토어
  const {
    session,
    isStoreOwner,
    loading,
    needsProfileSetup,
    isSocialLogin,
    checkSession,
    checkUserType,
    setSession,
    setIsStoreOwner,
    setNeedsProfileSetup,
    setIsSocialLogin,
    reset: resetAuth,
  } = useAuthStore();

  // 네비게이션 스토어
  const {
    authScreen,
    socialSignupScreen,
    consumerScreen,
    storeScreen,
    showStoreMode,
    setAuthScreen,
    setSocialSignupScreen,
    setConsumerScreen,
    setStoreScreen,
    setShowStoreMode,
    goToLogin,
    reset: resetNav,
  } = useNavigationStore();

  // 선택 스토어
  const {
    selectedStoreId,
    selectedProduct,
    selectedReservation,
    reviewReturnScreen,
    selectStore,
    selectProduct,
    selectReservation,
    setReviewReturnScreen,
    clearReservation,
    clearReviewReturnScreen,
  } = useSelectionStore();

  // 장바구니 스토어 (업체 이름 가져오기용)
  const [currentStoreName, setCurrentStoreName] = React.useState<string>('');

  // 전체 리뷰 화면 상태
  const [allReviewsStoreId, setAllReviewsStoreId] = React.useState<string | null>(null);
  const [allReviewsStoreName, setAllReviewsStoreName] = React.useState<string>('');

  // 배너 상세 화면 상태
  const [selectedBannerId, setSelectedBannerId] = React.useState<string | null>(null);

  // 공지사항 상세 화면 상태
  const [selectedNoticeId, setSelectedNoticeId] = React.useState<string | null>(null);
  const [publicNoticeView, setPublicNoticeView] = React.useState<'list' | 'detail' | null>(null);

  // 업주 알림 설정을 위한 storeId
  const [ownerStoreId, setOwnerStoreId] = React.useState<string>('');

  // 스토어 리스트 뷰 상태
  const [storeListView, setStoreListView] = React.useState<'list' | 'map'>('list');
  const [mapFocusStoreId, setMapFocusStoreId] = React.useState<string | null>(null);

  // 앱 시작 시 세션 확인
  useEffect(() => {
    checkSession();

    // 인증 상태 변화 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkUserType(session.user.id);
      } else {
        setIsStoreOwner(false);
        setShowStoreMode(false);
        goToLogin();
      }
    });

    return () => subscription.unsubscribe();
  }, [checkSession, checkUserType, setSession, setIsStoreOwner, setShowStoreMode, goToLogin]);

  const handleDeepLink = useCallback(
    (url: string) => {
      const parsed = Linking.parse(url);
      const parsedPath = parsed.path ? parsed.path.split('/').filter(Boolean) : [];
      const rawSegments = url
        .replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, '')
        .split('?')[0]
        .split('/')
        .filter(Boolean);
      const segments = parsedPath.length >= 2 ? parsedPath : rawSegments;
      if (segments.length === 0) return;

      if (segments[0] === 'store' && segments[1]) {
        selectStore(segments[1]);
        setConsumerScreen('detail');
        setShowStoreMode(false);
        return;
      }

      if (segments[0] === 'screen' && segments[1]) {
        if (segments[1] === 'storelist') {
          setStoreListView('list');
          setMapFocusStoreId(null);
        }
        setConsumerScreen(segments[1] as any);
        setShowStoreMode(false);
      }
    },
    [selectStore, setConsumerScreen, setShowStoreMode, setStoreListView, setMapFocusStoreId]
  );

  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    return () => subscription.remove();
  }, [handleDeepLink]);

  // 푸시 알림 초기화 및 토큰 등록
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // 로그인 상태에서만 푸시 토큰 등록
    if (!session) return;

    const initializePushNotifications = async () => {
      const token = await registerForPushNotifications();
      
      if (token) {
        // 소비자/업주 모두에게 토큰 저장 시도
        await saveConsumerPushToken(token);
        if (isStoreOwner) {
          await saveStorePushToken(token);
        }
      }
    };

    initializePushNotifications();

    // 알림 수신 리스너
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('알림 수신:', notification);
    });

    // 알림 클릭 리스너
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('알림 클릭:', response);
      const data = response.notification.request.content.data;
      
      // 알림 데이터에 따라 화면 이동
      if (data.storeId) {
        selectStore(data.storeId as string);
        setConsumerScreen('detail');
      } else if (data.reservationNumber) {
        setConsumerScreen('myreservations');
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [session, isStoreOwner, selectStore, setConsumerScreen]);

  // 안드로이드 뒤로가기 버튼 처리
  useEffect(() => {
    const backAction = () => {
      if (!session && publicNoticeView) {
        if (publicNoticeView === "detail") {
          setPublicNoticeView("list");
          return true;
        }
        if (publicNoticeView === "list") {
          setPublicNoticeView(null);
          return true;
        }
      }

      // 업주 모드에서 뒤로가기
      if (showStoreMode && isStoreOwner) {
        if (storeScreen !== 'dashboard') {
          setStoreScreen('dashboard');
          return true;
        }
        // 대시보드에서는 소비자 모드로 전환
        setShowStoreMode(false);
        setConsumerScreen('mypage');
        return true;
      }

      // 소비자 모드에서 뒤로가기
      switch (consumerScreen) {
        case 'storelist':
          // 배너 상세 화면이 열려있으면 먼저 닫기
          if (selectedBannerId) {
            setSelectedBannerId(null);
            return true;
          }
          // 메인 화면에서는 기본 동작 (앱 종료 확인)
          return false;
        case 'detail':
          // 전체 리뷰 화면이 열려있으면 먼저 닫기
          if (allReviewsStoreId) {
            setAllReviewsStoreId(null);
            return true;
          }
          setConsumerScreen('storelist');
          return true;
        case 'cart':
          setConsumerScreen('detail');
          return true;
        case 'reserve':
          setConsumerScreen('detail');
          return true;
        case 'myreservations':
          setConsumerScreen('storelist');
          return true;
        case 'review':
          clearReservation();
          setConsumerScreen('myreservations');
          return true;
        case 'mypage':
          setConsumerScreen('storelist');
          return true;
        case 'noticeDetail':
          setConsumerScreen('notices');
          return true;
        case 'notices':
          setConsumerScreen('mypage');
          return true;

        case 'favorites':
        case 'myreviews':
        case 'notifications':
        case 'faq':
        case 'customerservice':
        case 'purchasehistory':
          setConsumerScreen('mypage');
          return true;
        default:
          return false;
      }
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [
    session,
    showStoreMode,
    isStoreOwner,
    storeScreen,
    consumerScreen,
    publicNoticeView,
    setPublicNoticeView,
    setStoreScreen,
    setShowStoreMode,
    setConsumerScreen,
    clearReservation,
    allReviewsStoreId,
    selectedBannerId,
  ]);

  // 로딩 화면
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00D563" />
      </View>
    );
  }

  // ==================== 로그인하지 않은 경우 ====================
  if (!session && publicNoticeView) {
    return (
      <View style={{ flex: 1 }}>
        {publicNoticeView === 'list' && (
          <NoticeListScreen
            onBack={() => setPublicNoticeView(null)}
            onSelectNotice={(noticeId) => {
              setSelectedNoticeId(noticeId);
              setPublicNoticeView('detail');
            }}
          />
        )}

        {publicNoticeView === 'detail' && selectedNoticeId && (
          <NoticeDetailScreen
            noticeId={selectedNoticeId}
            onBack={() => setPublicNoticeView('list')}
          />
        )}
        {publicNoticeView === 'detail' && !selectedNoticeId && (
          <NoticeListScreen
            onBack={() => setPublicNoticeView(null)}
            onSelectNotice={(noticeId) => {
              setSelectedNoticeId(noticeId);
              setPublicNoticeView('detail');
            }}
          />
        )}
      </View>
    );
  }

  if (!session) {
    return (
      <View style={{ flex: 1 }}>
        {authScreen === 'login' && (
        <LoginScreen
          onSignup={() => setAuthScreen('signupType')}
          onViewNotices={() => {
            setSelectedNoticeId(null);
            setPublicNoticeView('list');
          }}
        />
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
            onSignupComplete={() => setAuthScreen('login')}
          />
        )}
      </View>
    );
  }

  // ==================== 소셜 로그인 후 프로필 설정 필요 ====================
  if (needsProfileSetup && isSocialLogin) {
    return (
      <View style={{ flex: 1 }}>
        {socialSignupScreen === 'socialSignupType' && (
          <SignupTypeScreen
            isSocialLogin={true}
            onSelectConsumer={() => setSocialSignupScreen('socialConsumerSignup')}
            onSelectStore={() => setSocialSignupScreen('socialStoreSignup')}
            onBack={async () => {
              // 로그아웃
              await supabase.auth.signOut();
              resetAuth();
              resetNav();
            }}
          />
        )}

        {socialSignupScreen === 'socialConsumerSignup' && (
          <ConsumerSignupScreen
            isSocialLogin={true}
            onBack={() => setSocialSignupScreen('socialSignupType')}
            onSuccess={() => {
              // 프로필 설정 완료
              setNeedsProfileSetup(false);
              setSocialSignupScreen('socialSignupType');
            }}
          />
        )}

        {socialSignupScreen === 'socialStoreSignup' && (
          <StoreSignupScreen
            isSocialLogin={true}
            onBack={() => setSocialSignupScreen('socialSignupType')}
            onSignupComplete={() => {
              // 프로필 설정 완료 - 업주는 승인 필요
              setNeedsProfileSetup(false);
              setIsStoreOwner(true);
              setSocialSignupScreen('socialSignupType');
            }}
          />
        )}
      </View>
    );
  }

  // ==================== 업주 모드 ====================
  if (showStoreMode && isStoreOwner) {
    return (
      <View style={{ flex: 1 }}>
        {storeScreen === 'dashboard' && (
          <StoreDashboard
            onManageProducts={() => setStoreScreen('products')}
            onManageReservations={() => setStoreScreen('reservations')}
            onManageInfo={() => setStoreScreen('info')}
            onManageReviews={() => setStoreScreen('reviews')}
            onManageRegulars={() => setStoreScreen('regulars')}
            onViewSalesStatistics={() => setStoreScreen('salesStatistics')}
            onNotificationSettings={async () => {
              // 업주의 storeId 가져오기
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const { data: storeData } = await supabase
                  .from('stores')
                  .select('id')
                  .eq('user_id', user.id)
                  .single();
                if (storeData) {
                  setOwnerStoreId(storeData.id);
                  setStoreScreen('ownerNotifications');
                }
              }
            }}
            onLogout={() => {
              setShowStoreMode(false);
              setConsumerScreen('mypage');
            }}
          />
        )}

        {storeScreen === 'info' && (
          <StoreInfoManagement
            onBack={() => setStoreScreen('dashboard')}
            onManageProducts={() => setStoreScreen('products')}
          />
        )}

        {storeScreen === 'products' && (
          <StoreProductManagement onBack={() => setStoreScreen('dashboard')} />
        )}

        {storeScreen === 'cash' && (
          <StoreCashManagement
            onBack={() => setStoreScreen('dashboard')}
            onViewHistory={() => setStoreScreen('cashHistory')}
          />
        )}

        {storeScreen === 'cashHistory' && (
          <StoreCashHistory onBack={() => setStoreScreen('dashboard')} />
        )}

        {storeScreen === 'reservations' && (
          <StoreReservationManagement onBack={() => setStoreScreen('dashboard')} />
        )}

        {storeScreen === 'reviews' && (
          <StoreReviewManagement onBack={() => setStoreScreen('dashboard')} />
        )}

        {storeScreen === 'regulars' && (
          <StoreRegularCustomers onBack={() => setStoreScreen('dashboard')} />
        )}

        {storeScreen === 'salesStatistics' && (
          <StoreSalesStatistics onBack={() => setStoreScreen('dashboard')} />
        )}

        {storeScreen === 'ownerNotifications' && ownerStoreId && (
          <OwnerNotificationSettingsScreen
            storeId={ownerStoreId}
            onBack={() => setStoreScreen('dashboard')}
          />
        )}
      </View>
    );
  }

  // ==================== 소비자 모드 ====================
  return (
    <View style={{ flex: 1 }}>
      {consumerScreen === 'storelist' && !selectedBannerId && (
        <StoreListHome
          onSelectStore={(id) => {
            selectStore(id);
            setConsumerScreen('detail');
          }}
          onViewReservations={() => setConsumerScreen('myreservations')}
          onViewMyPage={() => setConsumerScreen('mypage')}
          onViewCart={() => setConsumerScreen('cart')}
          initialView={storeListView}
          focusStoreId={mapFocusStoreId}
          onViewChange={(view) => {
            setStoreListView(view);
            if (view !== 'map') {
              setMapFocusStoreId(null);
            }
          }}
          onBannerPress={(banner) => {
            if (banner.link_type === 'store' && banner.store_id) {
              // 업체 상세로 바로 이동
              selectStore(banner.store_id);
              setConsumerScreen('detail');
            } else if (banner.link_type === 'external' && banner.external_url) {
              // 외부 URL은 BannerDetailScreen에서 처리
              setSelectedBannerId(banner.id);
            } else {
              // detail 타입: 배너 상세 화면으로 이동
              setSelectedBannerId(banner.id);
            }
          }}
        />
      )}

      {consumerScreen === 'storelist' && selectedBannerId && (
        <BannerDetailScreen
          bannerId={selectedBannerId}
          onBack={() => setSelectedBannerId(null)}
          onNavigateToStore={(storeId) => {
            setSelectedBannerId(null);
            selectStore(storeId);
            setConsumerScreen('detail');
          }}
        />
      )}

      {consumerScreen === 'detail' && !allReviewsStoreId && (
        <StoreDetail
          storeId={selectedStoreId}
          onReserve={(product) => {
            selectProduct(product);
            setConsumerScreen('reserve');
          }}
          onViewCart={() => {
            // 업체 이름 가져오기
            supabase
              .from('stores')
              .select('name')
              .eq('id', selectedStoreId)
              .single()
              .then(({ data }) => {
                if (data) {
                  setCurrentStoreName(data.name);
                }
                setConsumerScreen('cart');
              });
          }}
          onBack={() => setConsumerScreen('storelist')}
          onViewMap={() => {
            if (selectedStoreId) {
              setMapFocusStoreId(selectedStoreId);
              setStoreListView('map');
              setConsumerScreen('storelist');
            }
          }}
          onViewAllReviews={(storeId, storeName) => {
            setAllReviewsStoreId(storeId);
            setAllReviewsStoreName(storeName);
          }}
        />
      )}

      {consumerScreen === 'detail' && allReviewsStoreId && (
        <StoreAllReviewsScreen
          storeId={allReviewsStoreId}
          storeName={allReviewsStoreName}
          onBack={() => setAllReviewsStoreId(null)}
        />
      )}

      {consumerScreen === 'cart' && (
        <CartScreen
          storeId={selectedStoreId}
          storeName={currentStoreName}
          onBack={() => setConsumerScreen('detail')}
          onComplete={() => setConsumerScreen('myreservations')}
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
            selectReservation(reservation);
            setConsumerScreen('review');
          }}
          onNavigateToStore={(storeId) => {
            selectStore(storeId);
            setConsumerScreen('detail');
          }}
        />
      )}

      {consumerScreen === 'review' && selectedReservation && (
        <ReviewScreen
          reservation={selectedReservation}
          onBack={() => {
            clearReservation();
            clearReviewReturnScreen();
            setConsumerScreen('myreservations');
          }}
          onComplete={() => {
            clearReservation();
            // reviewReturnScreen이 설정되어 있으면 해당 화면으로, 아니면 myreservations로
            const returnScreen = reviewReturnScreen ?? 'myreservations';
            clearReviewReturnScreen();
            setConsumerScreen(returnScreen);
          }}
        />
      )}

      {consumerScreen === 'mypage' && (
        <MyPageScreen
          onViewReservations={() => setConsumerScreen('myreservations')}
          onViewPurchaseHistory={() => setConsumerScreen('purchasehistory')}
          onViewStoreManagement={() => {
            if (isStoreOwner) {
              setShowStoreMode(true);
              setStoreScreen('dashboard');
            }
          }}
          onBack={() => setConsumerScreen('storelist')}
          onViewFavorites={() => setConsumerScreen('favorites')}
          onViewMyReviews={() => setConsumerScreen('myreviews')}
          onViewNotifications={() => setConsumerScreen('notifications')}
          onViewNotices={() => setConsumerScreen('notices')}
          onViewFAQ={() => setConsumerScreen('faq')}
          onViewCustomerService={() => setConsumerScreen('customerservice')}
          onLogout={async () => {
            await supabase.auth.signOut();
            resetAuth();
            resetNav();
          }}
        />
      )}

      {consumerScreen === 'favorites' && (
        <FavoriteStoresScreen
          onBack={() => setConsumerScreen('mypage')}
          onSelectStore={(id) => {
            selectStore(id);
            setConsumerScreen('detail');
          }}
        />
      )}

      {consumerScreen === 'myreviews' && (
        <MyReviewsScreen
          onBack={() => setConsumerScreen('mypage')}
          onNavigateToStore={(storeId) => {
            selectStore(storeId);
            setConsumerScreen('detail');
          }}
        />
      )}

      {consumerScreen === 'notifications' && (
        <NotificationSettingsScreen
          onBack={() => setConsumerScreen('mypage')}
          isStoreOwner={isStoreOwner}
        />
      )}

      {consumerScreen === 'notices' && (
        <NoticeListScreen
          onBack={() => setConsumerScreen('mypage')}
          onSelectNotice={(noticeId) => {
            setSelectedNoticeId(noticeId);
            setConsumerScreen('noticeDetail');
          }}
        />
      )}

      {consumerScreen === 'noticeDetail' && selectedNoticeId && (
        <NoticeDetailScreen
          noticeId={selectedNoticeId}
          onBack={() => setConsumerScreen('notices')}
        />
      )}

      {consumerScreen === 'faq' && (
        <FAQScreen
          onBack={() => setConsumerScreen('mypage')}
          onViewCustomerService={() => setConsumerScreen('customerservice')}
        />
      )}

      {consumerScreen === 'customerservice' && (
        <CustomerServiceScreen
          onBack={() => setConsumerScreen('mypage')}
          onGoToFAQ={() => setConsumerScreen('faq')}
        />
      )}

      {consumerScreen === 'purchasehistory' && (
        <PurchaseHistoryScreen
          onBack={() => setConsumerScreen('mypage')}
          onNavigateToStore={(storeId) => {
            selectStore(storeId);
            setConsumerScreen('detail');
          }}
          onWriteReview={(reservation) => {
            selectReservation(reservation);
            setReviewReturnScreen('purchasehistory'); // 리뷰 작성 후 purchasehistory로 돌아오도록 설정
            setConsumerScreen('review');
          }}
          onNavigateToMyReviews={() => setConsumerScreen('myreviews')}
        />
      )}
    </View>
  );
}
