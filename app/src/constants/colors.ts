/**
 * 앱 전역 색상 상수
 * 디자인 일관성을 위해 하드코딩된 색상 대신 이 상수를 사용하세요.
 */

export const COLORS = {
  // 주요 색상 (브랜드)
  primary: '#00D563',        // 메인 그린
  primaryDark: '#00A84D',    // 진한 그린
  primaryLight: '#E8F5E9',   // 연한 그린 배경

  // 보조 색상
  secondary: '#1B5E20',      // 다크 그린
  accent: '#FF6B6B',         // 강조 (경고/삭제)

  // 상태 색상
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  // 배경 색상
  background: '#F5F5F5',
  surface: '#FFFFFF',

  // 텍스트 색상
  textPrimary: '#333333',
  textSecondary: '#666666',
  textDisabled: '#999999',
  textWhite: '#FFFFFF',

  // 테두리 색상
  border: '#E0E0E0',
  borderLight: '#EEEEEE',
  borderDark: '#DDDDDD',

  // 그림자/오버레이
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: '#000000',

  // 별점
  star: '#FFD700',
} as const;

// 타입 추출
export type ColorKey = keyof typeof COLORS;
