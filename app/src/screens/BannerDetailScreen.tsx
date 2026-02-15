/**
 * 배너 상세 화면
 * 배너 클릭 시 표시되는 상세 내용 페이지
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Banner } from '../types';

interface BannerDetailScreenProps {
  bannerId: string;
  onBack: () => void;
  onNavigateToStore?: (storeId: string) => void;
}

export default function BannerDetailScreen({
  bannerId,
  onBack,
  onNavigateToStore,
}: BannerDetailScreenProps) {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);

  // 배너 상세 조회
  const fetchBanner = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('id', bannerId)
        .single();

      if (error) {
        console.error('배너 조회 오류:', error);
        return;
      }

      setBanner(data);
    } catch (error) {
      console.error('배너 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  }, [bannerId]);

  useEffect(() => {
    fetchBanner();
  }, [fetchBanner]);

  // 날짜 포맷팅
  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  // 액션 버튼 처리
  const handleActionPress = async () => {
    if (!banner) return;

    switch (banner.link_type) {
      case 'external':
        if (banner.external_url) {
          const canOpen = await Linking.canOpenURL(banner.external_url);
          if (canOpen) {
            await Linking.openURL(banner.external_url);
          }
        }
        break;
      case 'store':
        if (banner.store_id && onNavigateToStore) {
          onNavigateToStore(banner.store_id);
        }
        break;
      default:
        // detail 타입은 이미 상세 페이지에 있으므로 별도 동작 없음
        break;
    }
  };

  // 액션 버튼 텍스트
  const getActionButtonText = (): string | null => {
    if (!banner) return null;

    switch (banner.link_type) {
      case 'external':
        return '자세히 보기';
      case 'store':
        return '업체 보러가기';
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D563" />
      </View>
    );
  }

  if (!banner) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backIcon}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>배너 상세</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>배너를 찾을 수 없습니다.</Text>
        </View>
      </View>
    );
  }

  const actionButtonText = getActionButtonText();
  const hasDateRange = banner.start_date || banner.end_date;

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>배너 상세</Text>
        <TouchableOpacity onPress={onBack} style={styles.closeButton}>
          <Text style={styles.closeIcon}>X</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 배너 이미지 */}
        {banner.image_url ? (
          <Image
            source={{ uri: banner.image_url }}
            style={styles.detailImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>{banner.title}</Text>
          </View>
        )}

        {/* 내용 */}
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{banner.title}</Text>

          {/* 기간 표시 */}
          {hasDateRange && (
            <View style={styles.dateRow}>
              <Text style={styles.dateIcon}>📅</Text>
              <Text style={styles.dateText}>
                {formatDate(banner.start_date)} ~ {formatDate(banner.end_date)}
              </Text>
            </View>
          )}

          {/* 부제목 */}
          {banner.subtitle && (
            <Text style={styles.subtitle}>{banner.subtitle}</Text>
          )}

          {/* 상세 설명 */}
          {banner.description && (
            <Text style={styles.description}>{banner.description}</Text>
          )}
        </View>
      </ScrollView>

      {/* 액션 버튼 */}
      {actionButtonText && (
        <TouchableOpacity style={styles.actionButton} onPress={handleActionPress}>
          <Text style={styles.actionButtonText}>{actionButtonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#999999',
  },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#333333',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  headerRight: {
    width: 40,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 18,
    color: '#333333',
    fontWeight: '600',
  },

  // 스크롤뷰
  scrollView: {
    flex: 1,
  },

  // 이미지
  detailImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F5F5F5',
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#00D563',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // 내용
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#666666',
  },
  subtitle: {
    fontSize: 16,
    color: '#00D563',
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 26,
  },

  // 액션 버튼
  actionButton: {
    backgroundColor: '#00D563',
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
