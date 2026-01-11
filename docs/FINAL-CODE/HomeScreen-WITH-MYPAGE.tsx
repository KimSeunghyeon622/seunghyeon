import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface HomeScreenProps {
  onViewStores: () => void;
  onViewReservations: () => void;
  onViewMyPage: () => void;
}

export default function HomeScreen({ onViewStores, onViewReservations, onViewMyPage }: HomeScreenProps) {
  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>투굿투고</Text>
        <TouchableOpacity style={styles.myPageButton} onPress={onViewMyPage}>
          <Text style={styles.myPageIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* 메인 컨텐츠 */}
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>🌍</Text>
          <Text style={styles.heroSubtitle}>음식물 낭비를 줄이고</Text>
          <Text style={styles.heroSubtitle}>지구를 지키는 중</Text>
        </View>

        {/* 메인 버튼들 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.mainButton, styles.primaryButton]} onPress={onViewStores}>
            <Text style={styles.buttonIcon}>🏪</Text>
            <Text style={styles.buttonTitle}>업체 보기</Text>
            <Text style={styles.buttonSubtitle}>할인 상품 둘러보기</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.mainButton, styles.secondaryButton]} onPress={onViewReservations}>
            <Text style={styles.buttonIcon}>📋</Text>
            <Text style={styles.buttonTitle}>예약 내역</Text>
            <Text style={styles.buttonSubtitle}>나의 예약 확인하기</Text>
          </TouchableOpacity>
        </View>

        {/* 하단 메뉴 */}
        <View style={styles.bottomMenu}>
          <TouchableOpacity style={styles.bottomMenuItem} onPress={onViewMyPage}>
            <Text style={styles.bottomMenuIcon}>⚙️</Text>
            <Text style={styles.bottomMenuText}>내정보</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    paddingTop: 50,
    backgroundColor: '#007AFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  myPageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  myPageIcon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  heroTitle: {
    fontSize: 80,
    marginBottom: 20,
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
  },
  buttonContainer: {
    gap: 15,
    marginBottom: 30,
  },
  mainButton: {
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  buttonIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  buttonTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  bottomMenu: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  bottomMenuItem: {
    alignItems: 'center',
    padding: 15,
  },
  bottomMenuIcon: {
    fontSize: 28,
    marginBottom: 5,
  },
  bottomMenuText: {
    fontSize: 14,
    color: '#666',
  },
});
