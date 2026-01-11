import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { supabase } from '../lib/supabase';

interface Store {
  id: string;
  name: string;
  address: string;
  average_rating: number;
}

export default function StoreListScreen({ onSelectStore }: { onSelectStore: (id: string) => void }) {
  const [stores, setStores] = useState<Store[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const filterStores = useCallback(async () => {
    if (!searchQuery.trim()) {
      setFilteredStores(stores);
      return;
    }

    const query = searchQuery.toLowerCase().trim();

    try {
      // 1. 가게명 또는 주소로 매칭되는 업체
      const storeMatches = stores.filter(
        (store) =>
          store.name.toLowerCase().includes(query) ||
          store.address.toLowerCase().includes(query)
      );

      // 2. 상품명으로 매칭되는 업체
      const { data: productsData, error } = await supabase
        .from('products')
        .select('store_id')
        .ilike('name', `%${query}%`)
        .eq('is_active', true);

      if (error) throw error;

      // 상품명으로 매칭된 store_id 목록
      const productStoreIds = new Set(
        productsData?.map((p: any) => p.store_id) || []
      );

      // 상품명으로 매칭된 업체 추가
      const productMatches = stores.filter((store) =>
        productStoreIds.has(store.id)
      );

      // 중복 제거하고 합치기
      const allMatches = [...storeMatches];
      productMatches.forEach((store) => {
        if (!allMatches.find((s) => s.id === store.id)) {
          allMatches.push(store);
        }
      });

      setFilteredStores(allMatches);
    } catch (error) {
      console.error('검색 오류:', error);
      // 오류 발생 시 기본 검색(가게명/주소만)
      const storeMatches = stores.filter(
        (store) =>
          store.name.toLowerCase().includes(query) ||
          store.address.toLowerCase().includes(query)
      );
      setFilteredStores(storeMatches);
    }
  }, [searchQuery, stores]);

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    filterStores();
  }, [filterStores]);

  const loadStores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stores')
        .select('id, name, address, average_rating')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setStores(data);
        setFilteredStores(data);
      }
    } catch (error: any) {
      console.error('업체 목록 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const renderStore = ({ item }: { item: Store }) => (
    <TouchableOpacity style={styles.storeCard} onPress={() => onSelectStore(item.id)}>
      <View style={styles.storeHeader}>
        <Text style={styles.storeName}>{item.name}</Text>
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingStar}>⭐</Text>
          <Text style={styles.ratingText}>{item.average_rating.toFixed(1)}</Text>
        </View>
      </View>
      <Text style={styles.address}>{item.address}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>업체 목록</Text>
      </View>

      {/* 검색창 */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="가게명, 주소, 상품명으로 검색..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 검색 결과 안내 */}
      {searchQuery.length > 0 && (
        <View style={styles.resultInfo}>
          <Text style={styles.resultText}>
            {filteredStores.length}개의 업체가 검색되었습니다
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <Text>로딩 중...</Text>
        </View>
      ) : filteredStores.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            {searchQuery.length > 0 ? '검색 결과가 없습니다' : '등록된 업체가 없습니다'}
          </Text>
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.resetButton} onPress={clearSearch}>
              <Text style={styles.resetButtonText}>검색 초기화</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredStores}
          renderItem={renderStore}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  clearButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  resultInfo: {
    padding: 10,
    backgroundColor: '#E3F2FD',
    borderBottomWidth: 1,
    borderBottomColor: '#BBDEFB',
  },
  resultText: {
    fontSize: 14,
    color: '#1976D2',
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 15,
  },
  resetButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 15,
  },
  storeCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  ratingStar: {
    fontSize: 14,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F57C00',
  },
  address: {
    fontSize: 14,
    color: '#666',
  },
});
