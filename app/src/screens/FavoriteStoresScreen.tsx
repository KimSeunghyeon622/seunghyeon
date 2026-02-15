import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import type { Store } from '../types';

interface FavoriteStoresScreenProps {
  onBack: () => void;
  onSelectStore: (storeId: string) => void;
}

interface FavoriteStore extends Store {
  favorite_id: string;
}

export default function FavoriteStoresScreen({
  onBack,
  onSelectStore,
}: FavoriteStoresScreenProps) {
  const [favorites, setFavorites] = useState<FavoriteStore[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 소비자 ID 조회
      const { data: consumer } = await supabase
        .from('consumers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!consumer) return;

      // 즐겨찾기한 업체 목록 조회
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          store_id,
          stores (
            id,
            name,
            category,
            description,
            address,
            cover_image_url,
            average_rating,
            review_count,
            is_open
          )
        `)
        .eq('consumer_id', consumer.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = (data || [])
        .filter((item: any) => item.stores)
        .map((item: any) => ({
          ...item.stores,
          favorite_id: item.id,
        }));

      setFavorites(formattedData);
    } catch (error) {
      console.error('즐겨찾기 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const removeFavorite = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      setFavorites((prev) => prev.filter((item) => item.favorite_id !== favoriteId));
    } catch (error) {
      console.error('즐겨찾기 삭제 오류:', error);
    }
  };

  const renderItem = ({ item }: { item: FavoriteStore }) => (
    <TouchableOpacity
      style={styles.storeCard}
      onPress={() => onSelectStore(item.id)}
    >
      <View style={styles.storeImage}>
        <Text style={styles.storeImageText}>🏪</Text>
      </View>
      <View style={styles.storeInfo}>
        <View style={styles.storeHeader}>
          <Text style={styles.storeName}>{item.name}</Text>
          <View style={[styles.statusBadge, !item.is_open && styles.closedBadge]}>
            <Text style={[styles.statusText, !item.is_open && styles.closedText]}>
              {item.is_open ? '영업중' : '영업종료'}
            </Text>
          </View>
        </View>
        <Text style={styles.storeCategory}>{item.category}</Text>
        <Text style={styles.storeAddress} numberOfLines={1}>{item.address}</Text>
        <View style={styles.ratingRow}>
          <Text style={styles.ratingStar}>⭐</Text>
          <Text style={styles.ratingText}>
            {item.average_rating?.toFixed(1) || '0.0'} ({item.review_count || 0})
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.heartButton}
        onPress={() => removeFavorite(item.favorite_id)}
      >
        <Text style={styles.heartIcon}>❤️</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>관심업체</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 컨텐츠 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00D563" />
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💚</Text>
          <Text style={styles.emptyText}>관심 업체가 없습니다</Text>
          <Text style={styles.emptySubText}>
            마음에 드는 업체의 하트를 눌러{'\n'}관심업체로 등록해보세요
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderItem}
          keyExtractor={(item) => item.favorite_id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFF',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 5,
  },
  backText: {
    fontSize: 24,
    color: '#333',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 34,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContainer: {
    padding: 16,
  },
  storeCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  storeImageText: {
    fontSize: 28,
  },
  storeInfo: {
    flex: 1,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  closedBadge: {
    backgroundColor: '#F5F5F5',
  },
  statusText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '600',
  },
  closedText: {
    color: '#999',
  },
  storeCategory: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  storeAddress: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingStar: {
    fontSize: 12,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
  },
  heartButton: {
    padding: 8,
  },
  heartIcon: {
    fontSize: 20,
  },
});
