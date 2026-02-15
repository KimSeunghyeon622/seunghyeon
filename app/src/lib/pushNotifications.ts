/**
 * 푸시 알림 서비스
 * Expo Push Notification을 사용한 푸시 알림 관리
 */
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

let hasLoggedFcmWarning = false;

function isFirebaseInitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return (
    message.includes('Default FirebaseApp is not initialized') ||
    message.includes('FirebaseApp.initializeApp') ||
    message.includes('fcm-credentials')
  );
}

// 알림 핸들러 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * 푸시 알림 권한 요청 및 토큰 발급
 * 참고: Expo Go에서는 SDK 53부터 푸시 알림이 지원되지 않음
 * Development Build 사용 시에만 푸시 알림 가능
 */
export async function registerForPushNotifications(): Promise<string | null> {
  let token: string | null = null;

  // 실제 기기에서만 푸시 알림 가능
  if (!Device.isDevice) {
    console.log('푸시 알림은 실제 기기에서만 사용 가능합니다.');
    return null;
  }

  // Expo Go 환경 체크 (SDK 53+에서는 푸시 알림 미지원)
  const isExpoGo = Constants.appOwnership === 'expo';
  if (isExpoGo) {
    console.log('Expo Go에서는 푸시 알림이 지원되지 않습니다. Development Build를 사용해주세요.');
    return null;
  }

  // 알림 권한 확인
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // 권한이 없으면 요청
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('푸시 알림 권한이 거부되었습니다.');
    return null;
  }

  // Expo 푸시 토큰 발급
  try {
    // Android에서 FCM 설정 파일이 없으면 토큰 발급을 시도하지 않는다.
    if (Platform.OS === 'android' && !Constants.expoConfig?.android?.googleServicesFile) {
      if (!hasLoggedFcmWarning) {
        console.warn('FCM 설정이 없어 푸시 토큰 발급을 건너뜁니다. google-services.json 설정 후 다시 시도하세요.');
        hasLoggedFcmWarning = true;
      }
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    // projectId가 없으면 토큰 발급 스킵
    if (!projectId) {
      console.log('projectId가 없어 푸시 토큰 발급을 건너뜁니다. EAS Build 설정이 필요합니다.');
      return null;
    }
    
    const pushToken = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });
    
    token = pushToken.data;
    console.log('푸시 토큰 발급:', token);
  } catch (error) {
    if (isFirebaseInitError(error)) {
      if (!hasLoggedFcmWarning) {
        console.warn('FCM 초기화가 되지 않아 푸시 토큰 발급을 건너뜁니다. FCM 설정 후 재빌드가 필요합니다.');
        hasLoggedFcmWarning = true;
      }
      return null;
    }

    console.error('푸시 토큰 발급 오류:', error);
    return null;
  }

  // Android 알림 채널 설정
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00D563',
    });
  }

  return token;
}

/**
 * 소비자의 푸시 토큰을 DB에 저장
 */
export async function saveConsumerPushToken(token: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('consumers')
      .update({ push_token: token })
      .eq('user_id', user.id);

    if (error) {
      console.error('소비자 푸시 토큰 저장 오류:', error);
      return false;
    }

    console.log('소비자 푸시 토큰 저장 완료');
    return true;
  } catch (error) {
    console.error('소비자 푸시 토큰 저장 오류:', error);
    return false;
  }
}

/**
 * 업주의 푸시 토큰을 DB에 저장
 */
export async function saveStorePushToken(token: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('stores')
      .update({ push_token: token })
      .eq('user_id', user.id);

    if (error) {
      console.error('업주 푸시 토큰 저장 오류:', error);
      return false;
    }

    console.log('업주 푸시 토큰 저장 완료');
    return true;
  } catch (error) {
    console.error('업주 푸시 토큰 저장 오류:', error);
    return false;
  }
}

/**
 * 푸시 알림 활성화/비활성화 설정
 */
export async function setPushEnabled(
  enabled: boolean, 
  userType: 'consumer' | 'store'
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const table = userType === 'consumer' ? 'consumers' : 'stores';
    
    const { error } = await supabase
      .from(table)
      .update({ push_enabled: enabled })
      .eq('user_id', user.id);

    if (error) {
      console.error('푸시 알림 설정 변경 오류:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('푸시 알림 설정 변경 오류:', error);
    return false;
  }
}

/**
 * 로컬 알림 발송 (테스트용)
 */
export async function sendLocalNotification(
  title: string, 
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
    },
    trigger: null, // 즉시 발송
  });
}

/**
 * Edge Function을 통한 푸시 알림 발송 (보안 강화)
 * 프론트엔드에서 직접 Expo 서버를 호출하지 않고 Edge Function을 통해 발송
 */
export async function sendPushNotificationSecure(
  type: 'new_reservation' | 'reservation_status' | 'new_product' | 'new_review',
  targetId: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; message: string }> {
  try {
    const { data: result, error } = await supabase.functions.invoke('send-push-notification', {
      body: { type, targetId, data },
    });

    if (error) {
      console.error('푸시 알림 Edge Function 오류:', error);
      return { success: false, message: error.message };
    }

    return result as { success: boolean; message: string };
  } catch (error) {
    console.error('푸시 알림 발송 오류:', error);
    return { success: false, message: String(error) };
  }
}

/**
 * Expo 푸시 서버로 알림 발송
 * @deprecated Edge Function 사용을 권장합니다. sendPushNotificationSecure()를 사용하세요.
 * 주의: 실제 서비스에서는 서버에서 호출해야 함 (보안)
 */
export async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<boolean> {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data: data || {},
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log('푸시 알림 발송 결과:', result);
    return true;
  } catch (error) {
    console.error('푸시 알림 발송 오류:', error);
    return false;
  }
}

/**
 * 특정 업체를 관심업체로 등록한 소비자들에게 알림 발송
 * (새 제품 등록 시 호출)
 * Edge Function을 통해 서버 측에서 알림 발송 처리
 */
export async function notifyFavoriteConsumers(
  storeId: string,
  storeName: string,
  productName: string
): Promise<void> {
  try {
    await sendPushNotificationSecure('new_product', storeId, {
      productName,
      storeName,
    });
  } catch (error) {
    console.error('관심업체 알림 발송 오류:', error);
  }
}

/**
 * 업주에게 새 예약 알림 발송
 * Edge Function을 통해 서버 측에서 알림 발송 처리
 */
export async function notifyStoreNewReservation(
  storeId: string,
  reservationNumber: string,
  productName: string,
  quantity: number
): Promise<void> {
  try {
    await sendPushNotificationSecure('new_reservation', storeId, {
      reservationNumber,
      productName,
      quantity,
    });
  } catch (error) {
    console.error('업주 알림 발송 오류:', error);
  }
}

/**
 * 소비자에게 예약 상태 변경 알림 발송
 * Edge Function을 통해 서버 측에서 알림 발송 처리
 */
export async function notifyConsumerReservationStatus(
  consumerId: string,
  storeName: string,
  status: 'confirmed' | 'completed' | 'cancelled',
  reservationNumber: string
): Promise<void> {
  try {
    await sendPushNotificationSecure('reservation_status', consumerId, {
      storeName,
      status,
      reservationNumber,
    });
  } catch (error) {
    console.error('소비자 알림 발송 오류:', error);
  }
}
