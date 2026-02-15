/**
 * 소비자(Consumer) 관련 API 함수
 */
import { supabase } from '../lib/supabase';
import type { Consumer } from '../types';

// 현재 로그인한 사용자의 소비자 정보 조회
export async function fetchCurrentConsumer() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('consumers')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // 데이터 없음
    throw error;
  }
  return data as Consumer;
}

// 소비자 정보 조회 (user_id로)
export async function fetchConsumerByUserId(userId: string) {
  const { data, error } = await supabase
    .from('consumers')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data as Consumer;
}

// 소비자 정보 수정
export async function updateConsumer(consumerId: string, updates: Partial<Consumer>) {
  const { data, error } = await supabase
    .from('consumers')
    .update(updates)
    .eq('id', consumerId)
    .select()
    .single();

  if (error) throw error;
  return data as Consumer;
}

// 소비자 회원가입
export async function createConsumer(consumer: {
  userId: string;
  nickname: string;
  phone?: string;
}) {
  const { data, error } = await supabase
    .from('consumers')
    .insert({
      user_id: consumer.userId,
      nickname: consumer.nickname,
      phone: consumer.phone,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Consumer;
}
