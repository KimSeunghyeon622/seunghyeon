/**
 * 비즈니스 로직에서 사용하는 Enum 상수
 * 하드코딩된 문자열 대신 이 상수들을 사용
 */

// 예약 상태
export const ReservationStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const;

export type ReservationStatusType = typeof ReservationStatus[keyof typeof ReservationStatus];

// 예약 상태 한글 라벨
export const ReservationStatusLabel: Record<ReservationStatusType, string> = {
  [ReservationStatus.PENDING]: '대기중',
  [ReservationStatus.CONFIRMED]: '확정',
  [ReservationStatus.COMPLETED]: '완료',
  [ReservationStatus.CANCELLED]: '취소됨',
  [ReservationStatus.NO_SHOW]: '노쇼',
};

// 예약 상태별 색상
export const ReservationStatusColor: Record<ReservationStatusType, string> = {
  [ReservationStatus.PENDING]: '#FFA500',
  [ReservationStatus.CONFIRMED]: '#007AFF',
  [ReservationStatus.COMPLETED]: '#00C853',
  [ReservationStatus.CANCELLED]: '#FF3B30',
  [ReservationStatus.NO_SHOW]: '#8E8E93',
};

// 캐시 거래 유형
export const CashTransactionType = {
  CHARGE: 'charge',
  SUBSCRIPTION: 'subscription',
  REFUND: 'refund',
  WITHDRAWAL: 'withdrawal',
} as const;

export type CashTransactionTypeValue = typeof CashTransactionType[keyof typeof CashTransactionType];

// 캐시 거래 유형 한글 라벨
export const CashTransactionTypeLabel: Record<CashTransactionTypeValue, string> = {
  [CashTransactionType.CHARGE]: '충전',
  [CashTransactionType.SUBSCRIPTION]: '구독료',
  [CashTransactionType.REFUND]: '환불',
  [CashTransactionType.WITHDRAWAL]: '출금',
};

// 요일
export const DayOfWeek = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
} as const;

export const DayOfWeekLabel = ['일', '월', '화', '수', '목', '금', '토'] as const;

// 업체 승인 상태
export const StoreApprovalStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;
