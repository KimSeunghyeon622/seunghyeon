import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { supabase } from '../lib/supabase';

interface StoreRegularCustomersProps {
  onBack: () => void;
}

export default function StoreRegularCustomers({ onBack }: StoreRegularCustomersProps) {
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filterModal, setFilterModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('전체');
  const [productFilters, setProductFilters] = useState<string[]>([]);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: store } = await supabase.from('stores').select('id').eq('user_id', user.id).single();
      if (!store) return;

      const { data, error } = await supabase
        .from('favorites')
        .select('*, consumers(nickname)')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
      setTotalCount(data?.length || 0);

      // 제품 필터 목록 생성
      const products = new Set<string>();
      data?.forEach((f: any) => {
        if (f.product_names && f.product_names.length > 0) {
          f.product_names.forEach((p: string) => products.add(p));
        }
      });
      setProductFilters(['전체', '알림 전체', ...Array.from(products)]);
    } catch (error) {
      console.error('단골 고객 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFavorites = favorites.filter((f) => {
    if (selectedFilter === '전체') return true;
    if (selectedFilter === '알림 전체') return f.notification_type === 'all';
    return f.product_names && f.product_names.includes(selectedFilter);
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D563" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>단골 고객 관리</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 전체 단골 수 */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>우리 가게 팬</Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalCount}>전체 단골 {totalCount.toLocaleString()}명</Text>
            <Text style={styles.heartIcon}>💚</Text>
          </View>
        </View>

        {/* 알림 설정 고객 목록 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>알림 설정 고객 목록</Text>
          <TouchableOpacity style={styles.filterButton} onPress={() => setFilterModal(true)}>
            <Text style={styles.filterButtonText}>🔽 {selectedFilter}</Text>
          </TouchableOpacity>
        </View>

        {filteredFavorites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>단골 고객이 없습니다.</Text>
          </View>
        ) : (
          filteredFavorites.map((favorite) => (
            <View key={favorite.id} style={styles.customerCard}>
              <View style={styles.customerAvatar}>
                <Text style={styles.customerAvatarText}>👤</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.customerHeader}>
                  <Text style={styles.customerName}>{favorite.consumers?.nickname || '익명'}</Text>
                  <Text
                    style={[
                      styles.notificationBadge,
                      favorite.notification_type === 'all' ? styles.badgeAll : styles.badgeSpecific,
                    ]}
                  >
                    {favorite.notification_type === 'all' ? '전체 알림' : '특정 상품 알림'}
                  </Text>
                </View>
                {favorite.notification_type === 'specific' && favorite.product_names && (
                  <Text style={styles.productNames}>
                    • {favorite.product_names.join(', ')}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}

        {/* 단골 알림 안내 */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>🔔</Text>
          <Text style={styles.infoText}>
            단골 알림 안내{'\n'}
            새로운 마감 할인 상품이 등록되면 단골 고객에게 푸시 알림이 발송되어 빠른 판매를 도와줍니다.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 필터 모달 */}
      <Modal visible={filterModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>필터 선택</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {productFilters.map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={styles.filterOption}
                  onPress={() => {
                    setSelectedFilter(filter);
                    setFilterModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedFilter === filter && styles.filterOptionTextActive,
                    ]}
                  >
                    {filter}
                  </Text>
                  {selectedFilter === filter && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setFilterModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  backButton: { fontSize: 28, color: '#333' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  scrollView: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  totalCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, marginBottom: 20, borderWidth: 2, borderColor: '#E8F5E9' },
  totalLabel: { fontSize: 14, color: '#666', marginBottom: 8 },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalCount: { fontSize: 24, fontWeight: 'bold', color: '#00D563' },
  heartIcon: { fontSize: 40 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  filterButton: { backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#00D563' },
  filterButtonText: { fontSize: 13, fontWeight: '600', color: '#00A84D' },
  emptyContainer: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#999' },
  customerCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  customerAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  customerAvatarText: { fontSize: 24 },
  customerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  customerName: { fontSize: 16, fontWeight: '600', color: '#333' },
  notificationBadge: { fontSize: 12, fontWeight: '600', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeAll: { backgroundColor: '#E8F5E9', color: '#00A84D' },
  badgeSpecific: { backgroundColor: '#FFF4E5', color: '#FF9800' },
  productNames: { fontSize: 13, color: '#666', lineHeight: 18 },
  infoBox: { backgroundColor: '#F9F9F9', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 20 },
  infoIcon: { fontSize: 24 },
  infoText: { flex: 1, fontSize: 13, color: '#666', lineHeight: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  filterOption: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterOptionText: { fontSize: 15, color: '#333' },
  filterOptionTextActive: { fontWeight: '600', color: '#00D563' },
  checkmark: { fontSize: 18, color: '#00D563', fontWeight: 'bold' },
  modalCloseButton: { backgroundColor: '#F5F5F5', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 15 },
  modalCloseButtonText: { fontSize: 15, fontWeight: '600', color: '#666' },
});
