import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput, Modal } from 'react-native';
import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  name: string;
  original_price: number;
  discounted_price: number;
  stock_quantity: number;
  is_active: boolean;
}

export default function StoreProductManagement({ onBack }: { onBack: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [storeId, setStoreId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // 폼 상태
  const [name, setName] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 현재 사용자의 업체 정보 가져오기
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!store) {
        Alert.alert('오류', '업체 정보를 찾을 수 없습니다');
        return;
      }

      setStoreId(store.id);

      // 업체의 상품 목록 가져오기
      const { data: productsData, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (productsData) setProducts(productsData);
    } catch (err: any) {
      console.error('데이터 로드 오류:', err);
      Alert.alert('오류', '데이터를 불러오는 중 문제가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setOriginalPrice('');
    setDiscountedPrice('');
    setStockQuantity('');
    setModalVisible(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setOriginalPrice(product.original_price.toString());
    setDiscountedPrice(product.discounted_price.toString());
    setStockQuantity(product.stock_quantity.toString());
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !originalPrice || !discountedPrice || !stockQuantity) {
      Alert.alert('오류', '모든 필드를 입력해주세요');
      return;
    }

    try {
      const productData = {
        name: name.trim(),
        original_price: parseFloat(originalPrice),
        discounted_price: parseFloat(discountedPrice),
        stock_quantity: parseInt(stockQuantity),
        store_id: storeId,
      };

      if (editingProduct) {
        // 수정
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        Alert.alert('완료', '상품이 수정되었습니다');
      } else {
        // 등록
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;
        Alert.alert('완료', '상품이 등록되었습니다');
      }

      setModalVisible(false);
      loadData();
    } catch (err: any) {
      console.error('저장 오류:', err);
      Alert.alert('오류', '저장 중 문제가 발생했습니다');
    }
  };

  const toggleActive = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id);

      if (error) throw error;
      loadData();
    } catch (err: any) {
      console.error('상태 변경 오류:', err);
      Alert.alert('오류', '상태 변경 중 문제가 발생했습니다');
    }
  };

  const handleDelete = async (productId: string) => {
    Alert.alert(
      '삭제 확인',
      '정말 이 상품을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);

              if (error) throw error;
              Alert.alert('완료', '상품이 삭제되었습니다');
              loadData();
            } catch (err: any) {
              console.error('삭제 오류:', err);
              Alert.alert('오류', '삭제 중 문제가 발생했습니다');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>로딩 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.title}>상품 관리</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ 상품 등록</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {products.length === 0 ? (
          <Text style={styles.emptyText}>등록된 상품이 없습니다</Text>
        ) : (
          products.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productHeader}>
                <Text style={styles.productName}>{product.name}</Text>
                <View style={styles.statusBadge}>
                  <Text style={[styles.statusText, !product.is_active && styles.inactiveText]}>
                    {product.is_active ? '판매중' : '판매중지'}
                  </Text>
                </View>
              </View>

              <View style={styles.productInfo}>
                <Text style={styles.priceLabel}>정가: {product.original_price.toLocaleString()}원</Text>
                <Text style={styles.priceLabel}>할인가: {product.discounted_price.toLocaleString()}원</Text>
                <Text style={styles.priceLabel}>재고: {product.stock_quantity}개</Text>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => openEditModal(product)}
                >
                  <Text style={styles.buttonText}>수정</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.toggleButton]}
                  onPress={() => toggleActive(product)}
                >
                  <Text style={styles.buttonText}>
                    {product.is_active ? '판매중지' : '판매시작'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(product.id)}
                >
                  <Text style={styles.buttonText}>삭제</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* 상품 등록/수정 모달 */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingProduct ? '상품 수정' : '상품 등록'}
            </Text>

            <Text style={styles.label}>상품명</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="예: 샌드위치 세트"
            />

            <Text style={styles.label}>정가 (원)</Text>
            <TextInput
              style={styles.input}
              value={originalPrice}
              onChangeText={setOriginalPrice}
              placeholder="예: 15000"
              keyboardType="numeric"
            />

            <Text style={styles.label}>할인가 (원)</Text>
            <TextInput
              style={styles.input}
              value={discountedPrice}
              onChangeText={setDiscountedPrice}
              placeholder="예: 9000"
              keyboardType="numeric"
            />

            <Text style={styles.label}>재고 수량</Text>
            <TextInput
              style={styles.input}
              value={stockQuantity}
              onChangeText={setStockQuantity}
              placeholder="예: 10"
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>취소</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.buttonText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backText: { fontSize: 16, color: '#007AFF' },
  title: { fontSize: 20, fontWeight: 'bold' },
  addButton: { backgroundColor: '#007AFF', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 5 },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  content: { flex: 1, padding: 15 },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#999' },
  productCard: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 15 },
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  productName: { fontSize: 18, fontWeight: 'bold', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5, backgroundColor: '#34C759' },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  inactiveText: { color: '#999' },
  productInfo: { marginBottom: 15 },
  priceLabel: { fontSize: 14, color: '#333', marginBottom: 5 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: { flex: 1, padding: 10, borderRadius: 5, marginHorizontal: 3, alignItems: 'center' },
  editButton: { backgroundColor: '#007AFF' },
  toggleButton: { backgroundColor: '#FF9500' },
  deleteButton: { backgroundColor: '#FF3B30' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 5,
    fontSize: 16,
    marginBottom: 10,
  },
  modalButtons: { flexDirection: 'row', marginTop: 20, justifyContent: 'space-between' },
  modalButton: { flex: 1, padding: 15, borderRadius: 5, marginHorizontal: 5, alignItems: 'center' },
  cancelButton: { backgroundColor: '#999' },
  saveButton: { backgroundColor: '#007AFF' },
});
