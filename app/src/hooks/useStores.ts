/**
 * 업체 목록 관련 커스텀 훅
 * UI와 데이터 로직 분리
 */
import { useCallback, useEffect, useState } from 'react';
import { fetchStores } from '../api';
import type { Store } from '../types';
import type { StoreCategory, SortType } from '../constants';

interface UseStoresOptions {
  autoFetch?: boolean;
}

interface UseStoresReturn {
  stores: Store[];
  filteredStores: Store[];
  loading: boolean;
  error: Error | null;
  // 필터 상태
  selectedCategory: StoreCategory;
  selectedRating: number | null;
  sortType: SortType;
  // 필터 액션
  setCategory: (category: StoreCategory) => void;
  setRating: (rating: number | null) => void;
  setSortType: (sort: SortType) => void;
  // 데이터 액션
  refresh: () => Promise<void>;
}

export function useStores(options: UseStoresOptions = {}): UseStoresReturn {
  const { autoFetch = true } = options;

  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 필터 상태
  const [selectedCategory, setSelectedCategory] = useState<StoreCategory>('전체');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sortType, setSortType] = useState<SortType>('recommended');

  // 데이터 로드
  const loadStores = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchStores();
      setStores(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('업체 목록 로딩 실패'));
    } finally {
      setLoading(false);
    }
  }, []);

  // 필터링 로직
  const filteredStores = useCallback(() => {
    let result = [...stores];

    // 카테고리 필터
    if (selectedCategory !== '전체') {
      result = result.filter((store) => store.category === selectedCategory);
    }

    // 평점 필터
    if (selectedRating !== null) {
      result = result.filter((store) => store.average_rating >= selectedRating);
    }

    // 정렬
    switch (sortType) {
      case 'rating':
        result.sort((a, b) => b.average_rating - a.average_rating);
        break;
      case 'recommended':
      default:
        // 기본 정렬 유지 (최신순)
        break;
    }

    return result;
  }, [stores, selectedCategory, selectedRating, sortType])();

  // 자동 fetch
  useEffect(() => {
    if (autoFetch) {
      loadStores();
    }
  }, [autoFetch, loadStores]);

  return {
    stores,
    filteredStores,
    loading,
    error,
    selectedCategory,
    selectedRating,
    sortType,
    setCategory: setSelectedCategory,
    setRating: setSelectedRating,
    setSortType,
    refresh: loadStores,
  };
}
