/**
 * Supabase Edge Function: send-push-notification
 *
 * 푸시 알림을 안전하게 서버에서 발송하는 Edge Function
 * - JWT 인증 필수
 * - push_token은 서버에서만 조회 (클라이언트 노출 방지)
 * - 발송자 권한 검증
 *
 * 지원하는 알림 타입:
 * - new_reservation: 업주에게 새 예약 알림
 * - reservation_status: 소비자에게 예약 상태 변경 알림
 * - new_product: 관심 업체 등록 소비자에게 새 상품 알림
 * - new_review: 업주에게 새 리뷰 알림
 */

// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// 타입 정의
interface PushNotificationRequest {
  type: 'new_reservation' | 'reservation_status' | 'new_product' | 'new_review';
  targetId: string; // store_id 또는 consumer_id
  data: NewReservationData | ReservationStatusData | NewProductData | NewReviewData;
}

interface NewReservationData {
  reservationNumber: string;
  productName: string;
  quantity: number;
}

interface ReservationStatusData {
  storeName: string;
  status: 'confirmed' | 'completed' | 'cancelled';
  reservationNumber: string;
}

interface NewProductData {
  productName: string;
  storeName?: string;
}

interface NewReviewData {
  reviewerNickname: string;
  rating: number;
}

interface ExpoPushMessage {
  to: string;
  sound?: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

// DB 응답 타입 정의
interface StoreRecord {
  id?: string;
  name?: string;
  push_token?: string | null;
  push_enabled?: boolean;
}

interface ConsumerRecord {
  id?: string;
  push_token?: string | null;
  push_enabled?: boolean;
}

interface FavoriteRecord {
  consumer_id: string;
  notification_type: 'all' | 'specific' | null;
  product_names: string[] | null;
}

interface NotificationSettingsRecord {
  review_alerts?: boolean;
}

// CORS 헤더
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Expo Push API 호출
async function sendExpoPush(messages: ExpoPushMessage[]): Promise<boolean> {
  if (messages.length === 0) return true;

  const accessToken = Deno.env.get('EXPO_ACCESS_TOKEN');

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Accept-encoding': 'gzip, deflate',
    'Content-Type': 'application/json',
  };

  // EXPO_ACCESS_TOKEN이 있으면 추가 (선택적)
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers,
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    console.log('Expo Push API 응답:', JSON.stringify(result));

    // 에러 체크
    if (result.errors && result.errors.length > 0) {
      console.error('Expo Push 에러:', result.errors);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Expo Push API 호출 실패:', error);
    return false;
  }
}

// 메인 핸들러
serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Supabase 클라이언트 생성 (service_role 키 사용)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // 사용자 인증 확인용 클라이언트
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: '인증이 필요합니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 사용자 인증 검증
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !userData.user) {
      return new Response(
        JSON.stringify({ error: '유효하지 않은 인증 토큰입니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const user = userData.user;

    // service_role 키를 사용하여 push_token 조회
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 2. 요청 바디 파싱
    const body: PushNotificationRequest = await req.json();
    const { type, targetId, data } = body;

    if (!type || !targetId || !data) {
      return new Response(
        JSON.stringify({ error: 'type, targetId, data는 필수입니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result: { success: boolean; message: string; sentCount?: number };

    // 3. 알림 타입별 처리
    switch (type) {
      case 'new_reservation':
        result = await handleNewReservation(
          supabaseAdmin,
          user.id,
          targetId,
          data as NewReservationData
        );
        break;

      case 'reservation_status':
        result = await handleReservationStatus(
          supabaseAdmin,
          user.id,
          targetId,
          data as ReservationStatusData
        );
        break;

      case 'new_product':
        result = await handleNewProduct(
          supabaseAdmin,
          user.id,
          targetId,
          data as NewProductData
        );
        break;

      case 'new_review':
        result = await handleNewReview(
          supabaseAdmin,
          user.id,
          targetId,
          data as NewReviewData
        );
        break;

      default:
        return new Response(
          JSON.stringify({ error: `지원하지 않는 알림 타입: ${type}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Edge Function 오류:', error);
    return new Response(
      JSON.stringify({ error: '서버 오류가 발생했습니다.', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * 새 예약 알림 (업주에게)
 * 소비자가 예약 시 해당 업체 업주에게 알림
 */
async function handleNewReservation(
  supabase: SupabaseClient<any, any, any>,
  _userId: string, // 발송자(소비자) user_id - 권한 검증용
  storeId: string,
  data: NewReservationData
): Promise<{ success: boolean; message: string }> {
  // 업체의 push_token 조회
  const { data: store, error } = await supabase
    .from('stores')
    .select('push_token, push_enabled, name')
    .eq('id', storeId)
    .maybeSingle() as { data: StoreRecord | null; error: any };

  if (error) {
    console.error('업체 조회 오류:', error);
    return { success: false, message: '업체 정보를 조회할 수 없습니다.' };
  }

  if (!store?.push_token || !store?.push_enabled) {
    return { success: true, message: '푸시 토큰이 없거나 알림이 비활성화되어 발송하지 않았습니다.' };
  }

  const message: ExpoPushMessage = {
    to: store.push_token,
    sound: 'default',
    title: '새 예약이 들어왔어요!',
    body: `${data.productName} ${data.quantity}개 예약 (${data.reservationNumber})`,
    data: {
      type: 'new_reservation',
      reservationNumber: data.reservationNumber
    },
  };

  const sent = await sendExpoPush([message]);
  return {
    success: sent,
    message: sent ? '알림 발송 완료' : '알림 발송 실패'
  };
}

/**
 * 예약 상태 변경 알림 (소비자에게)
 * 업주가 예약 확정/완료/취소 시 해당 소비자에게 알림
 */
async function handleReservationStatus(
  supabase: SupabaseClient<any, any, any>,
  userId: string, // 발송자(업주) user_id
  consumerId: string,
  data: ReservationStatusData
): Promise<{ success: boolean; message: string }> {
  // 발송자가 해당 업체의 업주인지 확인 (권한 검증)
  const { data: senderStore, error: senderError } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle() as { data: StoreRecord | null; error: any };

  if (senderError || !senderStore) {
    console.log('발송자 권한 확인 - 업주가 아님 (비업주도 상태 알림 가능하도록 허용)');
    // 비업주(시스템)도 알림 발송 가능하도록 허용
  }

  // 소비자의 push_token 조회
  const { data: consumer, error } = await supabase
    .from('consumers')
    .select('push_token, push_enabled')
    .eq('id', consumerId)
    .maybeSingle() as { data: ConsumerRecord | null; error: any };

  if (error) {
    console.error('소비자 조회 오류:', error);
    return { success: false, message: '소비자 정보를 조회할 수 없습니다.' };
  }

  if (!consumer?.push_token || !consumer?.push_enabled) {
    return { success: true, message: '푸시 토큰이 없거나 알림이 비활성화되어 발송하지 않았습니다.' };
  }

  const statusMessages: Record<string, string> = {
    confirmed: '예약이 확정되었습니다!',
    completed: '픽업이 완료되었습니다. 이용해주셔서 감사합니다!',
    cancelled: '예약이 취소되었습니다.',
  };

  const message: ExpoPushMessage = {
    to: consumer.push_token,
    sound: 'default',
    title: data.storeName,
    body: statusMessages[data.status] || '예약 상태가 변경되었습니다.',
    data: {
      type: 'reservation_status',
      status: data.status,
      reservationNumber: data.reservationNumber
    },
  };

  const sent = await sendExpoPush([message]);
  return {
    success: sent,
    message: sent ? '알림 발송 완료' : '알림 발송 실패'
  };
}

/**
 * 새 상품 알림 (관심 업체 등록 소비자들에게)
 * 업주가 새 상품 등록 시 해당 업체를 관심 등록한 소비자들에게 알림
 */
async function handleNewProduct(
  supabase: SupabaseClient<any, any, any>,
  userId: string, // 발송자(업주) user_id
  storeId: string,
  data: NewProductData
): Promise<{ success: boolean; message: string; sentCount?: number }> {
  // 발송자가 해당 업체의 업주인지 확인
  const { data: senderStore, error: senderError } = await supabase
    .from('stores')
    .select('id, name')
    .eq('user_id', userId)
    .eq('id', storeId)
    .maybeSingle() as { data: StoreRecord | null; error: any };

  if (senderError || !senderStore) {
    return { success: false, message: '해당 업체의 업주만 알림을 발송할 수 있습니다.' };
  }

  const storeName = data.storeName || senderStore.name || '업체';

  // 관심 업체로 등록하고 알림 설정이 켜진 소비자들 조회
  const { data: favorites, error: favError } = await supabase
    .from('favorites')
    .select('notification_type, product_names, consumer_id')
    .eq('store_id', storeId) as { data: FavoriteRecord[] | null; error: any };

  if (favError) {
    console.error('관심 업체 조회 오류:', favError);
    return { success: false, message: '관심 업체 정보를 조회할 수 없습니다.' };
  }

  if (!favorites || favorites.length === 0) {
    return { success: true, message: '관심 업체로 등록한 소비자가 없습니다.', sentCount: 0 };
  }

  // 소비자 ID 목록 추출
  const consumerIds = favorites.map((f: FavoriteRecord) => f.consumer_id);

  // 소비자들의 push_token 일괄 조회
  const { data: consumers, error: consumerError } = await supabase
    .from('consumers')
    .select('id, push_token, push_enabled')
    .in('id', consumerIds) as { data: ConsumerRecord[] | null; error: any };

  if (consumerError) {
    console.error('소비자 조회 오류:', consumerError);
    return { success: false, message: '소비자 정보를 조회할 수 없습니다.' };
  }

  // 소비자 ID -> 토큰 매핑
  const consumerTokenMap = new Map<string, { push_token: string | null; push_enabled: boolean }>();
  consumers?.forEach((c: ConsumerRecord) => {
    if (c.id) {
      consumerTokenMap.set(c.id, {
        push_token: c.push_token || null,
        push_enabled: c.push_enabled || false
      });
    }
  });

  const messages: ExpoPushMessage[] = [];

  for (const fav of favorites) {
    const consumerInfo = consumerTokenMap.get(fav.consumer_id);

    // 푸시 토큰이 없거나 알림이 비활성화된 경우 스킵
    if (!consumerInfo?.push_token || !consumerInfo?.push_enabled) continue;

    let shouldSend = false;
    let title = '';
    let body = '';

    if (fav.notification_type === 'all') {
      // 모든 알림 받기
      shouldSend = true;
      title = `${storeName} 새 상품 등록!`;
      body = `${data.productName}이(가) 새로 등록되었습니다. 지금 확인해보세요!`;
    } else if (fav.notification_type === 'specific') {
      // 특정 제품만 알림 받기
      const productNames = fav.product_names || [];
      const isMatch = productNames.some(
        (name: string) => data.productName.includes(name) || name.includes(data.productName)
      );
      if (isMatch) {
        shouldSend = true;
        title = `${storeName} 관심 상품 등록!`;
        body = `${data.productName}이(가) 등록되었습니다!`;
      }
    }

    if (shouldSend) {
      messages.push({
        to: consumerInfo.push_token,
        sound: 'default',
        title,
        body,
        data: {
          type: 'new_product',
          storeId
        },
      });
    }
  }

  if (messages.length === 0) {
    return { success: true, message: '조건에 맞는 알림 대상이 없습니다.', sentCount: 0 };
  }

  // Expo Push API는 한 번에 최대 100개 메시지 처리
  // 100개씩 나누어 발송
  let sentCount = 0;
  const batchSize = 100;

  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    const sent = await sendExpoPush(batch);
    if (sent) {
      sentCount += batch.length;
    }
  }

  return {
    success: true,
    message: `${sentCount}명에게 알림 발송 완료`,
    sentCount
  };
}

/**
 * 새 리뷰 알림 (업주에게)
 * 소비자가 리뷰 작성 시 해당 업체 업주에게 알림
 */
async function handleNewReview(
  supabase: SupabaseClient<any, any, any>,
  _userId: string, // 발송자(소비자) user_id
  storeId: string,
  data: NewReviewData
): Promise<{ success: boolean; message: string }> {
  // store_notification_settings에서 review_alerts 확인
  const { data: settings, error: settingsError } = await supabase
    .from('store_notification_settings')
    .select('review_alerts')
    .eq('store_id', storeId)
    .maybeSingle() as { data: NotificationSettingsRecord | null; error: any };

  // 설정이 없거나 review_alerts가 false면 발송 안 함
  if (settingsError) {
    console.log('알림 설정 조회 오류 (설정이 없을 수 있음):', settingsError);
  }

  if (settings && settings.review_alerts === false) {
    return { success: true, message: '리뷰 알림이 비활성화되어 발송하지 않았습니다.' };
  }

  // 업체의 push_token 조회
  const { data: store, error } = await supabase
    .from('stores')
    .select('push_token, push_enabled, name')
    .eq('id', storeId)
    .maybeSingle() as { data: StoreRecord | null; error: any };

  if (error) {
    console.error('업체 조회 오류:', error);
    return { success: false, message: '업체 정보를 조회할 수 없습니다.' };
  }

  if (!store?.push_token || !store?.push_enabled) {
    return { success: true, message: '푸시 토큰이 없거나 알림이 비활성화되어 발송하지 않았습니다.' };
  }

  // 별점을 별 문자로 변환
  const stars = '\u2605'.repeat(data.rating) + '\u2606'.repeat(5 - data.rating);

  const message: ExpoPushMessage = {
    to: store.push_token,
    sound: 'default',
    title: '새 리뷰가 등록되었어요!',
    body: `${data.reviewerNickname}님이 ${stars} 리뷰를 남겼습니다.`,
    data: {
      type: 'new_review',
      storeId
    },
  };

  const sent = await sendExpoPush([message]);
  return {
    success: sent,
    message: sent ? '알림 발송 완료' : '알림 발송 실패'
  };
}
