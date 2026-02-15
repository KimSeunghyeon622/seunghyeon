/**
 * Selection Store 테스트
 * - 업체, 상품, 예약 선택 로직 검증
 */
import { useSelectionStore } from '../../stores/selectionStore';

// 테스트용 Mock 데이터
const mockProduct = {
  id: 'product-001',
  name: '테스트 크로와상',
  original_price: 5000,
  discounted_price: 3000,
  stock_quantity: 10,
  store_id: 'store-001',
  category: '빵',
};

const mockReservation = {
  id: 'reservation-001',
  reservation_number: 'R20260120000001',
  status: 'pending',
  total_amount: 6000,
  pickup_time: '18:00',
  store_id: 'store-001',
  product_id: 'product-001',
  quantity: 2,
};

describe('SelectionStore', () => {
  // 각 테스트 전 스토어 초기화
  beforeEach(() => {
    useSelectionStore.getState().clearAll();
  });

  describe('초기 상태', () => {
    it('초기 selectedStoreId는 빈 문자열이어야 한다', () => {
      const { selectedStoreId } = useSelectionStore.getState();
      expect(selectedStoreId).toBe('');
    });

    it('초기 selectedProduct는 null이어야 한다', () => {
      const { selectedProduct } = useSelectionStore.getState();
      expect(selectedProduct).toBeNull();
    });

    it('초기 selectedReservation은 null이어야 한다', () => {
      const { selectedReservation } = useSelectionStore.getState();
      expect(selectedReservation).toBeNull();
    });
  });

  describe('업체 선택', () => {
    it('selectStore로 업체를 선택할 수 있다', () => {
      useSelectionStore.getState().selectStore('store-001');
      expect(useSelectionStore.getState().selectedStoreId).toBe('store-001');
    });

    it('다른 업체를 선택하면 이전 선택이 대체된다', () => {
      useSelectionStore.getState().selectStore('store-001');
      useSelectionStore.getState().selectStore('store-002');
      expect(useSelectionStore.getState().selectedStoreId).toBe('store-002');
    });

    it('clearStore로 업체 선택을 초기화할 수 있다', () => {
      useSelectionStore.getState().selectStore('store-001');
      useSelectionStore.getState().clearStore();
      expect(useSelectionStore.getState().selectedStoreId).toBe('');
    });
  });

  describe('상품 선택', () => {
    it('selectProduct로 상품을 선택할 수 있다', () => {
      useSelectionStore.getState().selectProduct(mockProduct);
      const { selectedProduct } = useSelectionStore.getState();

      expect(selectedProduct).not.toBeNull();
      expect(selectedProduct?.id).toBe('product-001');
      expect(selectedProduct?.name).toBe('테스트 크로와상');
      expect(selectedProduct?.discounted_price).toBe(3000);
    });

    it('상품 할인율이 올바르게 계산될 수 있다', () => {
      useSelectionStore.getState().selectProduct(mockProduct);
      const { selectedProduct } = useSelectionStore.getState();

      if (selectedProduct) {
        const discountRate = Math.round(
          ((selectedProduct.original_price - selectedProduct.discounted_price) /
            selectedProduct.original_price) * 100
        );
        expect(discountRate).toBe(40); // (5000-3000)/5000 * 100 = 40%
      }
    });

    it('clearProduct로 상품 선택을 초기화할 수 있다', () => {
      useSelectionStore.getState().selectProduct(mockProduct);
      useSelectionStore.getState().clearProduct();
      expect(useSelectionStore.getState().selectedProduct).toBeNull();
    });

    it('selectProduct(null)로 상품 선택을 해제할 수 있다', () => {
      useSelectionStore.getState().selectProduct(mockProduct);
      useSelectionStore.getState().selectProduct(null);
      expect(useSelectionStore.getState().selectedProduct).toBeNull();
    });
  });

  describe('예약 선택', () => {
    it('selectReservation으로 예약을 선택할 수 있다', () => {
      useSelectionStore.getState().selectReservation(mockReservation);
      const { selectedReservation } = useSelectionStore.getState();

      expect(selectedReservation).not.toBeNull();
      expect(selectedReservation?.id).toBe('reservation-001');
      expect(selectedReservation?.reservation_number).toBe('R20260120000001');
      expect(selectedReservation?.status).toBe('pending');
    });

    it('예약 번호 형식이 올바른지 확인할 수 있다', () => {
      useSelectionStore.getState().selectReservation(mockReservation);
      const { selectedReservation } = useSelectionStore.getState();

      if (selectedReservation) {
        // 예약 번호 형식: R + YYYYMMDD + 6자리 일련번호
        const pattern = /^R\d{8}\d{6}$/;
        expect(selectedReservation.reservation_number).toMatch(pattern);
      }
    });

    it('clearReservation으로 예약 선택을 초기화할 수 있다', () => {
      useSelectionStore.getState().selectReservation(mockReservation);
      useSelectionStore.getState().clearReservation();
      expect(useSelectionStore.getState().selectedReservation).toBeNull();
    });
  });

  describe('전체 초기화', () => {
    it('clearAll로 모든 선택을 초기화할 수 있다', () => {
      // 모든 항목 선택
      useSelectionStore.getState().selectStore('store-001');
      useSelectionStore.getState().selectProduct(mockProduct);
      useSelectionStore.getState().selectReservation(mockReservation);

      // 전체 초기화
      useSelectionStore.getState().clearAll();
      const state = useSelectionStore.getState();

      expect(state.selectedStoreId).toBe('');
      expect(state.selectedProduct).toBeNull();
      expect(state.selectedReservation).toBeNull();
    });
  });

  describe('사용자 플로우 시나리오', () => {
    it('업체 탐색 → 상품 선택 → 예약 플로우', () => {
      // 1. 업체 선택
      useSelectionStore.getState().selectStore('store-001');
      expect(useSelectionStore.getState().selectedStoreId).toBe('store-001');

      // 2. 상품 선택
      useSelectionStore.getState().selectProduct(mockProduct);
      expect(useSelectionStore.getState().selectedProduct?.id).toBe('product-001');

      // 3. 예약 완료 후 예약 정보 저장
      useSelectionStore.getState().selectReservation(mockReservation);
      expect(useSelectionStore.getState().selectedReservation?.status).toBe('pending');
    });

    it('예약 확인 후 리뷰 작성 플로우', () => {
      // 완료된 예약 선택
      const completedReservation = {
        ...mockReservation,
        status: 'completed',
      };

      useSelectionStore.getState().selectReservation(completedReservation);
      const { selectedReservation } = useSelectionStore.getState();

      // 완료된 예약만 리뷰 작성 가능
      expect(selectedReservation?.status).toBe('completed');

      // 리뷰 작성 후 예약 선택 해제
      useSelectionStore.getState().clearReservation();
      expect(useSelectionStore.getState().selectedReservation).toBeNull();
    });
  });
});
