import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

interface KakaoMapMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface KakaoMapWebViewProps {
  markers: KakaoMapMarker[];
  selectedId?: string | null;
  userLocation?: { latitude: number; longitude: number } | null;
  onSelect?: (id: string) => void;
  onBackgroundPress?: () => void;
  onError?: (message: string) => void;
  style?: StyleProp<ViewStyle>;
}

export interface MapMarker {
  id: string;
  name: string;
  latitude?: number | null;
  longitude?: number | null;
  category?: string;
  distanceKm?: number;
}

interface MapPoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface MapPlaceholderProps {
  markers: MapMarker[];
  height?: number;
  selectedId?: string | null;
  userLocation?: { latitude: number; longitude: number } | null;
  onSelect?: (id: string) => void;
  title?: string;
  onBackgroundPress?: () => void;
  showZoomControls?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  useNativeMap?: boolean;
}

const MIN_ZOOM = 0.8;
const MAX_ZOOM = 2.2;

type KakaoMapWebViewComponent = React.ComponentType<KakaoMapWebViewProps>;

export default function MapPlaceholder({
  markers,
  height,
  selectedId,
  userLocation,
  onSelect,
  title = '지도',
  onBackgroundPress,
  showZoomControls = false,
  containerStyle,
  useNativeMap = false,
}: MapPlaceholderProps) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [overlayZoom, setOverlayZoom] = useState(1);
  const pinchStateRef = useRef<{ startDistance: number; startZoom: number } | null>(null);
  const isPinchingRef = useRef(false);

  const [KakaoMapComponent, setKakaoMapComponent] = useState<KakaoMapWebViewComponent | null>(null);
  const [componentLoadError, setComponentLoadError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const points = useMemo<MapPoint[]>(() => {
    return markers
      .filter(
        (m): m is MapMarker & { latitude: number; longitude: number } =>
          typeof m.latitude === 'number' && typeof m.longitude === 'number'
      )
      .map((m) => ({
        id: m.id,
        name: m.name,
        latitude: m.latitude,
        longitude: m.longitude,
      }));
  }, [markers]);

  const kakaoMapMarkers = useMemo<KakaoMapMarker[]>(() => {
    return points.map((p) => ({
      id: p.id,
      name: p.name,
      latitude: p.latitude,
      longitude: p.longitude,
    }));
  }, [points]);

  useEffect(() => {
    if (!useNativeMap || KakaoMapComponent) {
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const LoadedComponent = require('./KakaoMapWebView').default as KakaoMapWebViewComponent;
      setKakaoMapComponent(() => LoadedComponent);
      setComponentLoadError(null);
    } catch (error) {
      setComponentLoadError(
        error instanceof Error ? error.message : 'KakaoMapWebView module is not available.'
      );
    }
  }, [useNativeMap, KakaoMapComponent]);

  const bounds = useMemo(() => {
    if (points.length === 0) {
      return null;
    }

    const lats = points.map((p) => p.latitude);
    const lngs = points.map((p) => p.longitude);
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    };
  }, [points]);

  const clampZoom = (zoom: number) => {
    return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number(zoom.toFixed(2))));
  };

  const getPinchDistance = (touches: readonly { pageX: number; pageY: number }[]) => {
    if (touches.length < 2) {
      return null;
    }
    const [first, second] = touches;
    const dx = first.pageX - second.pageX;
    const dy = first.pageY - second.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getPosition = (lat: number, lng: number) => {
    if (!bounds || layout.width === 0 || layout.height === 0) {
      return { left: layout.width / 2, top: layout.height / 2 };
    }

    const latRange = bounds.maxLat - bounds.minLat || 0.001;
    const lngRange = bounds.maxLng - bounds.minLng || 0.001;
    const x = (lng - bounds.minLng) / lngRange;
    const y = 1 - (lat - bounds.minLat) / latRange;
    const paddingRatio = 0.12;
    const paddedX = paddingRatio + x * (1 - paddingRatio * 2);
    const paddedY = paddingRatio + y * (1 - paddingRatio * 2);
    const baseLeft = Math.min(Math.max(paddedX * layout.width, 0), layout.width);
    const baseTop = Math.min(Math.max(paddedY * layout.height, 0), layout.height);
    const zoomedLeft = (baseLeft - layout.width / 2) * overlayZoom + layout.width / 2;
    const zoomedTop = (baseTop - layout.height / 2) * overlayZoom + layout.height / 2;

    return {
      left: Math.min(Math.max(zoomedLeft, 0), layout.width),
      top: Math.min(Math.max(zoomedTop, 0), layout.height),
    };
  };

  const retryNativeMap = useCallback(() => {
    setMapError(null);
    setComponentLoadError(null);
    setKakaoMapComponent(null);
    setReloadTick((prev) => prev + 1);
  }, []);

  if (useNativeMap) {
    const errorText = mapError ?? componentLoadError;
    return (
      <View style={[styles.container, typeof height === 'number' ? { height } : null, containerStyle]}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        <View style={styles.mapSurface}>
          {points.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>표시할 매장 좌표가 없습니다.</Text>
            </View>
          ) : KakaoMapComponent && !errorText ? (
            <KakaoMapComponent
              key={`kakao-webview-${reloadTick}`}
              markers={kakaoMapMarkers}
              selectedId={selectedId}
              userLocation={userLocation}
              onSelect={onSelect}
              onBackgroundPress={onBackgroundPress}
              onError={(message) => setMapError(message)}
              style={StyleSheet.absoluteFillObject}
            />
          ) : (
            <View style={styles.nativeErrorCard}>
              <Text style={styles.nativeErrorTitle}>지도를 로드하지 못했습니다</Text>
              <Text style={styles.nativeErrorText}>
                {errorText ?? 'KakaoMapWebView를 준비하는 중입니다...'}
              </Text>
              <Text style={styles.nativeErrorHint}>확인: JavaScript 키, Web 플랫폼 도메인, 지도 서비스 활성화</Text>
              <TouchableOpacity style={styles.retryButton} onPress={retryNativeMap}>
                <Text style={styles.retryButtonText}>다시 시도</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, typeof height === 'number' ? { height } : null, containerStyle]}
      onLayout={(e) => {
        const { width, height: layoutHeight } = e.nativeEvent.layout;
        setLayout({ width, height: layoutHeight });
      }}
    >
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.mapSurface}>
        <Pressable
          style={styles.mapBackgroundPress}
          onPress={() => {
            if (isPinchingRef.current) {
              isPinchingRef.current = false;
              return;
            }
            onBackgroundPress?.();
          }}
          onTouchStart={(e) => {
            const distance = getPinchDistance(e.nativeEvent.touches);
            if (distance === null) {
              return;
            }
            pinchStateRef.current = {
              startDistance: distance,
              startZoom: overlayZoom,
            };
            isPinchingRef.current = true;
          }}
          onTouchMove={(e) => {
            const distance = getPinchDistance(e.nativeEvent.touches);
            const pinchState = pinchStateRef.current;
            if (distance === null || !pinchState) {
              return;
            }
            const scale = distance / pinchState.startDistance;
            const nextOverlayZoom = clampZoom(pinchState.startZoom * scale);
            setOverlayZoom(nextOverlayZoom);
          }}
          onTouchEnd={(e) => {
            if (e.nativeEvent.touches.length < 2) {
              pinchStateRef.current = null;
            }
            if (e.nativeEvent.touches.length === 0) {
              setTimeout(() => {
                isPinchingRef.current = false;
              }, 0);
            }
          }}
        />
        <View style={styles.mapGrid} />

        {points.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>지도 데이터가 준비 중입니다</Text>
          </View>
        ) : (
          points.map((point) => {
            const pos = getPosition(point.latitude, point.longitude);
            const isSelected = selectedId === point.id;
            return (
              <TouchableOpacity
                key={point.id}
                style={[
                  styles.marker,
                  isSelected && styles.markerSelected,
                  { left: pos.left - 13, top: pos.top - 13 },
                ]}
                onPress={() => onSelect?.(point.id)}
                activeOpacity={0.85}
              >
                <Text style={[styles.markerDot, isSelected && styles.markerDotSelected]}>●</Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {showZoomControls && (
        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.zoomButton} onPress={() => setOverlayZoom((prev) => clampZoom(prev + 0.2))}>
            <Text style={styles.zoomButtonText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomButton} onPress={() => setOverlayZoom((prev) => clampZoom(prev - 0.2))}>
            <Text style={styles.zoomButtonText}>-</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f7fa',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e1e6ed',
    padding: 12,
    overflow: 'hidden',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  mapSurface: {
    flex: 1,
    backgroundColor: '#e9edf3',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  mapBackgroundPress: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
    borderWidth: 1,
    borderColor: '#dae1ea',
    zIndex: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  emptyText: {
    color: '#7a8699',
    fontSize: 13,
  },
  marker: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00d563',
    zIndex: 5,
  },
  markerSelected: {
    backgroundColor: '#00d563',
    borderColor: '#00a84d',
  },
  markerDot: {
    color: '#00d563',
    fontSize: 12,
    fontWeight: '700',
  },
  markerDotSelected: {
    color: '#ffffff',
  },
  zoomControls: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    gap: 8,
  },
  zoomButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d8dfe8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomButtonText: {
    fontSize: 18,
    lineHeight: 21,
    color: '#27303a',
    fontWeight: '600',
  },
  nativeErrorCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
    backgroundColor: '#e9edf3',
  },
  nativeErrorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#27303a',
  },
  nativeErrorText: {
    fontSize: 12,
    color: '#566273',
    textAlign: 'center',
  },
  nativeErrorHint: {
    fontSize: 11,
    color: '#6b7788',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#ffffff',
    borderColor: '#d8dfe8',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  retryButtonText: {
    color: '#27303a',
    fontSize: 12,
    fontWeight: '600',
  },
});
