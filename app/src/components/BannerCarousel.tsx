/**
 * 배너 캐러셀 컴포넌트
 * 메인 홈 화면 상단에 표시되는 배너 슬라이더
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { Banner } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_HEIGHT = 160;
const AUTO_PLAY_INTERVAL = 4000; // 4초
const PAUSE_AFTER_SWIPE = 5000; // 스와이프 후 5초간 자동 슬라이드 일시 정지

interface BannerCarouselProps {
  onBannerPress: (banner: Banner) => void;
}

export default function BannerCarousel({ onBannerPress }: BannerCarouselProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const autoPlayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPausedRef = useRef(false);

  // 활성 배너 조회
  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('배너 조회 오류:', error);
        return;
      }

      setBanners(data || []);
    } catch (error) {
      console.error('배너 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // 자동 슬라이드
  const startAutoPlay = useCallback(() => {
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
    }

    autoPlayTimerRef.current = setInterval(() => {
      if (isPausedRef.current || banners.length <= 1) return;

      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % banners.length;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * SCREEN_WIDTH,
          animated: true,
        });
        return nextIndex;
      });
    }, AUTO_PLAY_INTERVAL);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length > 1) {
      startAutoPlay();
    }

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }
    };
  }, [banners.length, startAutoPlay]);

  // 스와이프 시 자동 슬라이드 일시 정지
  const handleScrollBeginDrag = () => {
    isPausedRef.current = true;

    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
    }
  };

  const handleScrollEndDrag = () => {
    // 5초 후 자동 슬라이드 재개
    pauseTimerRef.current = setTimeout(() => {
      isPausedRef.current = false;
    }, PAUSE_AFTER_SWIPE);
  };

  // 스크롤 위치에 따른 현재 인덱스 업데이트
  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  // 배너가 없으면 영역을 표시하지 않음
  if (loading || banners.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        decelerationRate="fast"
        bounces={false}
      >
        {banners.map((banner) => (
          <TouchableOpacity
            key={banner.id}
            activeOpacity={0.9}
            onPress={() => onBannerPress(banner)}
            accessibilityLabel={`배너: ${banner.title}`}
            accessibilityHint="탭하여 자세히 보기"
            accessibilityRole="button"
          >
            <View style={styles.bannerSlide}>
              {banner.image_url ? (
                <Image
                  source={{ uri: banner.image_url }}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Text style={styles.placeholderText}>{banner.title}</Text>
                </View>
              )}

              {/* 그라데이션 오버레이 + 텍스트 */}
              <LinearGradient
                colors={['transparent', 'rgba(0, 0, 0, 0.6)']}
                style={styles.bannerOverlay}
              >
                <Text style={styles.bannerTitle} numberOfLines={1}>
                  {banner.title}
                </Text>
                {banner.subtitle && (
                  <Text style={styles.bannerSubtitle} numberOfLines={1}>
                    {banner.subtitle}
                  </Text>
                )}
              </LinearGradient>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 인디케이터 */}
      {banners.length > 1 && (
        <View
          style={styles.indicatorContainer}
          accessibilityLabel={`${currentIndex + 1}번째 배너, 총 ${banners.length}개`}
          accessibilityRole="text"
        >
          {banners.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentIndex && styles.indicatorActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: BANNER_HEIGHT,
    backgroundColor: '#F5F5F5',
  },
  bannerSlide: {
    width: SCREEN_WIDTH,
    height: BANNER_HEIGHT,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#00D563',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    paddingHorizontal: 20,
    paddingBottom: 32,
    justifyContent: 'flex-end',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  indicatorActive: {
    backgroundColor: '#FFFFFF',
    width: 16,
  },
});
