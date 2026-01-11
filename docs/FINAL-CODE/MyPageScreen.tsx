import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

interface MyPageScreenProps {
  onViewReservations: () => void;
  onViewStoreManagement: () => void;
  onBack: () => void;
}

export default function MyPageScreen({ onViewReservations, onViewStoreManagement, onBack }: MyPageScreenProps) {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isStoreOwner, setIsStoreOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 소비자 정보 확인
      const { data: consumer } = await supabase
        .from('consumers')
        .select('nickname, phone, total_savings')
        .eq('user_id', user.id)
        .single();

      // 업주 정보 확인
      const { data: store } = await supabase
        .from('stores')
        .select('name, owner_name')
        .eq('user_id', user.id)
        .single();

      if (consumer) {
        setUserInfo({
          type: 'consumer',
          nickname: consumer.nickname,
          phone: consumer.phone,
          email: user.email,
          total_savings: consumer.total_savings || 0,
        });
      }

      if (store) {
        setIsStoreOwner(true);
        if (!consumer) {
          // 업주만 있는 경우
          setUserInfo({
            type: 'store',
            nickname: store.owner_name,
            storeName: store.name,
            email: user.email,
          });
        }
      }
    } catch (error: any) {
      console.error('사용자 정보 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            onBack();
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
        <Text style={styles.title}>내정보</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* 프로필 섹션 */}
        <View style={styles.profileSection}>
          <View style={styles.profileIcon}>
            <Text style={styles.profileEmoji}>👤</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userInfo?.nickname || '사용자'}</Text>
            <Text style={styles.profileEmail}>{userInfo?.email}</Text>
          </View>
        </View>

        {/* 업주라면 사장님 페이지 버튼 */}
        {isStoreOwner && (
          <TouchableOpacity style={styles.storeOwnerButton} onPress={onViewStoreManagement}>
            <View style={styles.storeOwnerContent}>
              <View>
                <Text style={styles.storeOwnerTitle}>🏪 사장님 페이지</Text>
                <Text style={styles.storeOwnerSubtitle}>상품 관리, 예약 관리, 캐시 관리</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* 통계 섹션 (소비자인 경우만) */}
        {userInfo?.type === 'consumer' && (
          <View style={styles.statsSection}>
            <Text style={styles.statsTitle}>지금까지 아낀 금액</Text>
            <Text style={styles.statsAmount}>{userInfo.total_savings?.toLocaleString() || 0}원</Text>
          </View>
        )}

        {/* 메뉴 리스트 */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={onViewReservations}>
            <Text style={styles.menuIcon}>📋</Text>
            <Text style={styles.menuText}>예약 내역</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>⭐</Text>
            <Text style={styles.menuText}>작성한 리뷰</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>❤️</Text>
            <Text style={styles.menuText}>관심 업체</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>🔔</Text>
            <Text style={styles.menuText}>알림 설정</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>❓</Text>
            <Text style={styles.menuText}>자주 묻는 질문</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>💬</Text>
            <Text style={styles.menuText}>고객센터</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 로그아웃 버튼 */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>로그아웃</Text>
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  profileIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileEmoji: {
    fontSize: 36,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
  },
  storeOwnerButton: {
    margin: 20,
    marginBottom: 10,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF9500',
    overflow: 'hidden',
  },
  storeOwnerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  storeOwnerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9500',
    marginBottom: 5,
  },
  storeOwnerSubtitle: {
    fontSize: 13,
    color: '#F57C00',
  },
  arrow: {
    fontSize: 30,
    color: '#FF9500',
    fontWeight: 'bold',
  },
  statsSection: {
    margin: 20,
    marginTop: 10,
    padding: 20,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
  },
  statsTitle: {
    fontSize: 14,
    color: '#2E7D32',
    marginBottom: 8,
  },
  statsAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingVertical: 18,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 15,
    width: 30,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  menuArrow: {
    fontSize: 20,
    color: '#CCC',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 65,
  },
  logoutButton: {
    margin: 20,
    marginTop: 30,
    padding: 18,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
