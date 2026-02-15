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

// 移댁뭅?ㅻ㏊ REST API ??(?섏쨷???ㅼ젣 ?ㅻ줈 援먯껜 ?덉젙)
const KAKAO_REST_API_KEY =
  process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY ?? '';

// 移댁뭅??Static Map API 理쒕? ?대?吏 ?ш린
const MAX_IMAGE_SIZE = 800;

// 移댁뭅??吏???덈꺼蹂?誘명꽣/?쎌? 鍮꾩쑉 (洹쇱궗媛?
// level 1 = 媛???뺣?, level 14 = 媛??異뺤냼
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
  initialZoomLevel?: number; // 移댁뭅???덈꺼 1-14 (?묒쓣?섎줉 ?뺣?)
}

/**
 * ?꾨룄/寃쎈룄瑜?誘명꽣 ?⑥쐞濡?蹂?섑븯???좏떥由ы떚 ?⑥닔
 * (吏援???먯껜 洹쇱궗)
 */
const latLngToMeters = (lat: number, lng: number) => {
  const earthRadius = 6378137; // 誘명꽣
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const x = earthRadius * lngRad * Math.cos(latRad);
  const y = earthRadius * latRad;
  return { x, y };
};

/**
 * 移댁뭅??Static Map URL ?앹꽦 ?⑥닔
 */
const getStaticMapUrl = (
  centerLat: number,
  centerLng: number,
  level: number,
  width: number,
  height: number
): string => {
  // 移댁뭅??API??center瑜?"lng,lat" ?쒖꽌濡?諛쏆쓬
  const safeWidth = Math.min(Math.max(Math.round(width), 1), MAX_IMAGE_SIZE);
  const safeHeight = Math.min(Math.max(Math.round(height), 1), MAX_IMAGE_SIZE);
  const safeLevel = Math.min(Math.max(Math.round(level), 1), 14);

  return `https://dapi.kakao.com/v2/maps/staticmap?appkey=${KAKAO_REST_API_KEY}&center=${centerLng},${centerLat}&level=${safeLevel}&size=${safeWidth}x${safeHeight}`;
};

/**
 * 移댁뭅??Static Map API瑜??ъ슜?섏뿬 吏???대?吏瑜??쒖떆?섎뒗 而댄룷?뚰듃
 * - WebView ?놁씠 ?⑥닚 Image 而댄룷?뚰듃 ?ъ슜
 * - 留덉빱???ㅻ쾭?덉씠濡??쒖떆
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

  // ?덉씠?꾩썐 蹂寃??몃뱾??
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setLayout({ width, height });
  }, []);

  // 留덉빱 以묒떖??怨꾩궛
  const center = useMemo(() => {
    if (markers.length === 0) {
      // 湲곕낯 ?꾩튂: ?쒖슱 ?쒖껌
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

  // Static Map URL ?앹꽦
  const staticMapUrl = useMemo(() => {
    if (layout.width === 0 || layout.height === 0) {
      return null;
    }
    return getStaticMapUrl(center.lat, center.lng, zoomLevel, layout.width, layout.height);
  }, [center, zoomLevel, layout]);

  // 留덉빱 ?쎌? ?꾩튂 怨꾩궛
  const getMarkerPosition = useCallback(
    (lat: number, lng: number): { left: number; top: number } => {
      if (layout.width === 0 || layout.height === 0) {
        return { left: 0, top: 0 };
      }

      const metersPerPixel = METERS_PER_PIXEL_BY_LEVEL[zoomLevel] || 8;

      // 以묒떖?먭낵 留덉빱??誘명꽣 ?⑥쐞 醫뚰몴 怨꾩궛
      const centerMeters = latLngToMeters(center.lat, center.lng);
      const markerMeters = latLngToMeters(lat, lng);

      // 以묒떖?먯쑝濡쒕??곗쓽 誘명꽣 ?⑥쐞 ?ㅽ봽??
      const dxMeters = markerMeters.x - centerMeters.x;
      const dyMeters = markerMeters.y - centerMeters.y;

      // ?쎌? ?ㅽ봽??怨꾩궛
      const dxPixels = dxMeters / metersPerPixel;
      const dyPixels = dyMeters / metersPerPixel;

      // ?대?吏 以묒떖 湲곗? 醫뚰몴
      // y異뺤? ?꾨룄媛 ?믪쓣?섎줉 ?꾨줈 媛誘濡?dy瑜?鍮쇱쨲
      const left = layout.width / 2 + dxPixels;
      const top = layout.height / 2 - dyPixels;

      return { left, top };
    },
    [center, zoomLevel, layout]
  );

  // 以????몃뱾??
  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.max(1, prev - 1));
  }, []);

  // 以??꾩썐 ?몃뱾??
  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.min(14, prev + 1));
  }, []);

  // ?대?吏 濡쒕뱶 ?먮윭 ?몃뱾??
  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  // 諛곌꼍 ?곗튂 ?몃뱾??
  const handleBackgroundPress = useCallback(() => {
    onBackgroundPress?.();
  }, [onBackgroundPress]);

  return (
    <View style={[styles.container, style]} onLayout={handleLayout}>
      {/* Static Map 諛곌꼍 ?대?吏 */}
      {staticMapUrl && !imageError && (
        <Image
          source={{ uri: staticMapUrl }}
          style={styles.mapImage}
          resizeMode="cover"
          onError={handleImageError}
        />
      )}

      {/* ?대?吏 濡쒕뱶 ?ㅽ뙣 ?먮뒗 濡쒕뵫 以??뚮젅?댁뒪???*/}
      {(!staticMapUrl || imageError) && (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            {imageError ? '吏?꾨? 遺덈윭?????놁뒿?덈떎' : '吏??濡쒕뵫 以?..'}
          </Text>
        </View>
      )}

      {/* 諛곌꼍 ?곗튂 ?곸뿭 */}
      <Pressable style={styles.touchArea} onPress={handleBackgroundPress} />

      {/* 留덉빱 ?ㅻ쾭?덉씠 */}
      {markers.map((marker) => {
        const pos = getMarkerPosition(marker.latitude, marker.longitude);
        const isSelected = selectedId === marker.id;

        // ?붾㈃ 諛뽰쓽 留덉빱???뚮뜑留곹븯吏 ?딆쓬
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
            <Text style={[styles.markerDot, isSelected && styles.markerDotSelected]}>??/Text>
          </TouchableOpacity>
        );
      })}

      {/* 以?而⑦듃濡?*/}
      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn}>
          <Text style={styles.zoomButtonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
          <Text style={styles.zoomButtonText}>-</Text>
        </TouchableOpacity>
      </View>

      {/* ?꾩옱 以??덈꺼 ?쒖떆 (?붾쾭洹몄슜, ?꾩슂???쒓굅) */}
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

