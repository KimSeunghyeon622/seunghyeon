/**
 * 상품/업체 카테고리 상수
 */

// 업체 카테고리
export const STORE_CATEGORIES = [
  '전체',
  '반찬',
  '제과',
  '식자재',
  '밀키트',
] as const;

export type StoreCategory = typeof STORE_CATEGORIES[number];

// 상품 카테고리
export const PRODUCT_CATEGORIES = [
  '빵류',
  '도시락/반찬',
  '음료',
  '과일/채소',
  '유제품',
  '기타',
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

// 별점 필터 옵션
export const RATING_OPTIONS = [4.5, 4.0, 3.5, 3.0] as const;

// 정렬 옵션
export const SORT_OPTIONS = {
  recommended: '추천순',
  distance: '거리순',
  rating: '평점순',
  discount: '할인율순',
} as const;

export type SortType = keyof typeof SORT_OPTIONS;
