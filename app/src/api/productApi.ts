/**
 * 상품(Product) 관련 API 함수
 */
import { supabase } from '../lib/supabase';
import type { Product } from '../types';

// 상품 생성
export async function createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();

  if (error) throw error;
  return data as Product;
}

// 상품 수정
export async function updateProduct(productId: string, updates: Partial<Product>) {
  const { data, error } = await supabase
    .from('products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', productId)
    .select()
    .single();

  if (error) throw error;
  return data as Product;
}

// 상품 삭제 (soft delete - is_active를 false로)
export async function deleteProduct(productId: string) {
  const { error } = await supabase
    .from('products')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', productId);

  if (error) throw error;
}

// 상품 상태 토글
export async function toggleProductStatus(productId: string) {
  const { data, error } = await supabase.rpc('toggle_product_status', {
    p_product_id: productId,
  });

  if (error) throw error;
  return data as boolean;
}

// 상품 재고 업데이트
export async function updateProductStock(productId: string, stockQuantity: number) {
  const { error } = await supabase
    .from('products')
    .update({
      stock_quantity: stockQuantity,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId);

  if (error) throw error;
}
