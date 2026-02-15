/**
 * 리뷰(Review) 관련 API 함수
 */
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';
import type { Review, ReviewWithConsumer } from '../types';

// 업체의 리뷰 목록 조회 (Signed URL 적용)
export async function fetchStoreReviews(storeId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, consumers(nickname, avatar_url)')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // 리뷰 이미지를 Signed URL로 변환
  const reviewsWithSignedUrls = await Promise.all(
    (data || []).map(async (review) => {
      if (review.image_urls && review.image_urls.length > 0) {
        const signedUrls = await getReviewImageUrls(review.image_urls);
        return { ...review, image_urls: signedUrls };
      }
      return review;
    })
  );

  return reviewsWithSignedUrls as ReviewWithConsumer[];
}

// 리뷰 이미지 업로드
export async function uploadReviewImage(uri: string, userId: string): Promise<string> {
  try {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substr(2, 9);
    const fileName = `${userId}/${timestamp}_${randomStr}.jpg`;

    // expo-file-system으로 base64 읽기 (React Native 호환)
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // base64를 ArrayBuffer로 변환 후 업로드
    const { error } = await supabase.storage
      .from('review-images')
      .upload(fileName, decode(base64), {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) throw error;

    // 파일 경로 반환 (signed URL은 조회 시 생성)
    return fileName;
  } catch (error) {
    console.error('리뷰 이미지 업로드 오류:', error);
    throw error;
  }
}

/**
 * 리뷰 이미지 Signed URL 생성
 * @param filePath 저장된 파일 경로
 * @param expiresIn 만료 시간 (초), 기본 1시간
 */
export async function getReviewImageUrl(filePath: string, expiresIn: number = 3600): Promise<string | null> {
  if (!filePath) return null;

  // 이미 전체 URL인 경우 (기존 데이터 호환)
  if (filePath.startsWith('http')) {
    // 기존 public URL에서 파일 경로 추출
    const match = filePath.match(/review-images\/(.+)$/);
    if (match) {
      filePath = match[1];
    } else {
      return filePath; // 추출 실패 시 그대로 반환
    }
  }

  const { data, error } = await supabase.storage
    .from('review-images')
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    console.error('Signed URL 생성 오류:', error);
    return null;
  }

  return data.signedUrl;
}

/**
 * 여러 리뷰 이미지 Signed URL 일괄 생성
 */
export async function getReviewImageUrls(filePaths: string[], expiresIn: number = 3600): Promise<string[]> {
  if (!filePaths || filePaths.length === 0) return [];

  const urls = await Promise.all(
    filePaths.map(path => getReviewImageUrl(path, expiresIn))
  );

  return urls.filter((url): url is string => url !== null);
}

// 리뷰 이미지 삭제
export async function deleteReviewImage(imageUrl: string): Promise<void> {
  try {
    // URL에서 파일 경로 추출
    const urlParts = imageUrl.split('/review-images/');
    if (urlParts.length < 2) return;

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from('review-images')
      .remove([filePath]);

    if (error) {
      console.error('리뷰 이미지 삭제 오류:', error);
    }
  } catch (error) {
    console.error('리뷰 이미지 삭제 오류:', error);
  }
}

// 리뷰 작성
export async function createReview(review: {
  consumerId: string;
  storeId: string;
  reservationId: string;
  rating: number;
  content: string;
  imageUrls?: string[];
}) {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      consumer_id: review.consumerId,
      store_id: review.storeId,
      reservation_id: review.reservationId,
      rating: review.rating,
      content: review.content,
      image_urls: review.imageUrls || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Review;
}

// 리뷰 수정 (이미지 포함)
export async function updateReview(reviewId: string, updates: {
  rating?: number;
  content?: string;
  imageUrls?: string[];
}) {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.rating !== undefined) {
    updateData.rating = updates.rating;
  }
  if (updates.content !== undefined) {
    updateData.content = updates.content;
  }
  if (updates.imageUrls !== undefined) {
    updateData.image_urls = updates.imageUrls.length > 0 ? updates.imageUrls : null;
  }

  const { error } = await supabase
    .from('reviews')
    .update(updateData)
    .eq('id', reviewId);

  if (error) throw error;
}

// 리뷰에 답글 달기 (업주용)
export async function replyToReview(reviewId: string, reply: string) {
  const { error } = await supabase
    .from('reviews')
    .update({
      reply,
      reply_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId);

  if (error) throw error;
}

// 리뷰 삭제
export async function deleteReview(reviewId: string) {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId);

  if (error) throw error;
}

/**
 * 업체 평균 평점 계산
 * @deprecated DB 트리거로 자동 계산됨. 이 함수는 더 이상 호출할 필요 없음.
 * reviews 테이블에 INSERT/UPDATE/DELETE 시 stores.average_rating, review_count가 자동 업데이트됨.
 * 기존 코드 호환성을 위해 유지하지만, 새 코드에서는 사용하지 마세요.
 */
export async function calculateStoreRating(storeId: string) {
  console.warn('calculateStoreRating: DB 트리거로 자동 계산되므로 이 함수 호출 불필요');

  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('store_id', storeId);

  if (error) throw error;

  if (!data || data.length === 0) {
    return { averageRating: 0, reviewCount: 0 };
  }

  const sum = data.reduce((acc, review) => acc + review.rating, 0);
  const averageRating = Math.round((sum / data.length) * 10) / 10;

  return {
    averageRating,
    reviewCount: data.length,
  };
}
