import React, { useMemo, useState, useCallback } from 'react';
import {
  Image,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  LayoutChangeEvent,
} from 'react-native';

// 카카오맵 REST API 키 (나중에 실제 키로 교체 예정)
const KAKAO_REST_API_KEY =
  process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY ?? '48e00df541befd01450bb442c0c9bdca';

// 카카오 Static Map API 최대 이미지 크기
const MAX_IMAGE_SIZE = 800;

// 카카오 지도 레벨별 미터/픽셀 비율 (근사값)
// level 1 = 가장 확대, level 14 = 가장 축소
const METERS_PER_PIXEL_BY_LEVEL: Record<number, number> = {
  1: 0.5,
  2: 1,
  3: 2,
  4: 4,
  5: 8,
  6: 16,
  7: 32,
  8: 64,
  9: 128,
  10: 256,
  11: 512,
  12: 1024,
  13: 2048,
  14: 4096,
};

export interface KakaoStaticMapMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface KakaoStaticMapProps {
  markers: KakaoStaticMapMarker[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onBackgroundPress?: () => void;
  style?: StyleProp<ViewStyle>;
  initialZoomLevel?: number; // 카카오 레벨 1-14 (작을수록 확대)
}

/**
 * 위도/경도를 미터 단위로 변환하는 유틸리티 함수
 * (지구 타원체 근사)
 */
const latLngToMeters = (lat: number, lng: number) => {
  const earthRadius = 6378137; // 미터
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const x = earthRadius * lngRad * Math.cos(latRad);
  const y = earthRadius * latRad;
  return { x, y };
};

/**
 * 카카오 Static Map URL 생성 함수
 */
const getStaticMapUrl = (
  centerLat: number,
  centerLng: number,
  level: number,
  width: number,
  height: number
): string => {
  // 카카오 API는 center를 "lng,lat" 순서로 받음
  const safeWidth = Math.min(Math.max(Math.round(width), 1), MAX_IMAGE_SIZE);
  const safeHeight = Math.min(Math.max(Math.round(height), 1), MAX_IMAGE_SIZE);
  const safeLevel = Math.min(Math.max(Math.round(level), 1), 14);

  return `https://dapi.kakao.com/v2/maps/staticmap?appkey=${KAKAO_REST_API_KEY}&center=${centerLng},${centerLat}&level=${safeLevel}&size=${safeWidth}x${safeHeight}`;
};

/**
 * 카카오 Static Map API를 사용하여 지도 이미지를 표시하는 컴포넌트
 * - WebView 없이 단순 Image 컴포넌트 사용
 * - 마커는 오버레이로 표시
 */
export default function KakaoStaticMap({
  markers,
  selectedId,
  onSelect,
  onBackgroundPress,
  style,
  initialZoomLevel = 5,
}: KakaoStaticMapProps) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [zoomLevel, setZoomLevel] = useState(initialZoomLevel);
  const [imageError, setImageError] = useState(false);

  // 레이아웃 변경 핸들러
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setLayout({ width, height });
  }, []);

  // 마커 중심점 계산
  const center = useMemo(() => {
    if (markers.length === 0) {
      // 기본 위치: 서울 시청
      return { lat: 37.5665, lng: 126.978 };
    }

    if (selectedId) {
      const selectedMarker = markers.find((m) => m.id === selectedId);
      if (selectedMarker) {
        return { lat: selectedMarker.latitude, lng: selectedMarker.longitude };
      }
    }

    const sumLat = markers.reduce((acc, m) => acc + m.latitude, 0);
    const sumLng = markers.reduce((acc, m) => acc + m.longitude, 0);
    return {
      lat: sumLat / markers.length,
      lng: sumLng / markers.length,
    };
  }, [markers, selectedId]);

  // Static Map URL 생성
  const staticMapUrl = useMemo(() => {
    if (layout.width === 0 || layout.height === 0) {
      return null;
    }
    return getStaticMapUrl(center.lat, center.lng, zoomLevel, layout.width, layout.height);
  }, [center, zoomLevel, layout]);

  // 마커 픽셀 위치 계산
  const getMarkerPosition = useCallback(
    (lat: number, lng: number): { left: number; top: number } => {
      if (layout.width === 0 || layout.height === 0) {
        return { left: 0, top: 0 };
      }

      const metersPerPixel = METERS_PER_PIXEL_BY_LEVEL[zoomLevel] || 8;

      // 중심점과 마커의 미터 단위 좌표 계산
      const centerMeters = latLngToMeters(center.lat, center.lng);
      const markerMeters = latLngToMeters(lat, lng);

      // 중심점으로부터의 미터 단위 오프셋
      const dxMeters = markerMeters.x - centerMeters.x;
      const dyMeters = markerMeters.y - centerMeters.y;

      // 픽셀 오프셋 계산
      const dxPixels = dxMeters / metersPerPixel;
      const dyPixels = dyMeters / metersPerPixel;

      // 이미지 중심 기준 좌표
      // y축은 위도가 높을수록 위로 가므로 dy를 빼줌
      const left = layout.width / 2 + dxPixels;
      const top = layout.height / 2 - dyPixels;

      return { left, top };
    },
    [center, zoomLevel, layout]
  );

  // 줌 인 핸들러
  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.max(1, prev - 1));
  }, []);

  // 줌 아웃 핸들러
  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.min(14, prev + 1));
  }, []);

  // 이미지 로드 에러 핸들러
  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  // 배경 터치 핸들러
  const handleBackgroundPress = useCallback(() => {
    onBackgroundPress?.();
  }, [onBackgroundPress]);

  return (
    <View style={[styles.container, style]} onLayout={handleLayout}>
      {/* Static Map 배경 이미지 */}
      {staticMapUrl && !imageError && (
        <Image
          source={{ uri: staticMapUrl }}
          style={styles.mapImage}
          resizeMode="cover"
          onError={handleImageError}
        />
      )}

      {/* 이미지 로드 실패 또는 로딩 중 플레이스홀더 */}
      {(!staticMapUrl || imageError) && (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            {imageError ? '지도를 불러올 수 없습니다' : '지도 로딩 중...'}
          </Text>
        </View>
      )}

      {/* 배경 터치 영역 */}
      <Pressable style={styles.touchArea} onPress={handleBackgroundPress} />

      {/* 마커 오버레이 */}
      {markers.map((marker) => {
        const pos = getMarkerPosition(marker.latitude, marker.longitude);
        const isSelected = selectedId === marker.id;

        // 화면 밖의 마커는 렌더링하지 않음
        if (
          pos.left < -13 ||
          pos.left > layout.width + 13 ||
          pos.top < -13 ||
          pos.top > layout.height + 13
        ) {
          return null;
        }

        return (
          <TouchableOpacity
            key={marker.id}
            style={[
              styles.marker,
              isSelected && styles.markerSelected,
              { left: pos.left - 13, top: pos.top - 13 },
            ]}
            onPress={() => onSelect?.(marker.id)}
            activeOpacity={0.85}
          >
            <Text style={[styles.markerDot, isSelected && styles.markerDotSelected]}>●</Text>
          </TouchableOpacity>
        );
      })}

      {/* 줌 컨트롤 */}
      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn}>
          <Text style={styles.zoomButtonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
          <Text style={styles.zoomButtonText}>-</Text>
        </TouchableOpacity>
      </View>

      {/* 현재 줌 레벨 표시 (디버그용, 필요시 제거) */}
      {__DEV__ && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>Level: {zoomLevel}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9EDF3',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  mapImage: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9EDF3',
    zIndex: 1,
  },
  placeholderText: {
    color: '#7A8699',
    fontSize: 13,
  },
  touchArea: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  marker: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00D563',
    zIndex: 5,
  },
  markerSelected: {
    backgroundColor: '#00D563',
    borderColor: '#00A84D',
  },
  markerDot: {
    color: '#00D563',
    fontSize: 12,
    fontWeight: '700',
  },
  markerDotSelected: {
    color: '#FFFFFF',
  },
  zoomControls: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    gap: 8,
    zIndex: 10,
  },
  zoomButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8DFE8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  zoomButtonText: {
    fontSize: 18,
    lineHeight: 21,
    color: '#27303A',
    fontWeight: '600',
  },
  debugInfo: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 10,
  },
});
