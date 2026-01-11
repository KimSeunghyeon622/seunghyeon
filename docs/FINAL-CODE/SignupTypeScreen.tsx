import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface SignupTypeScreenProps {
  onSelectConsumer: () => void;
  onSelectStore: () => void;
  onBack: () => void;
}

export default function SignupTypeScreen({ onSelectConsumer, onSelectStore, onBack }: SignupTypeScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>회원가입</Text>
      <Text style={styles.subtitle}>가입 유형을 선택해주세요</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.typeButton, styles.consumerButton]}
          onPress={onSelectConsumer}
        >
          <Text style={styles.typeIcon}>👤</Text>
          <Text style={styles.typeTitle}>일반고객</Text>
          <Text style={styles.typeDescription}>할인 상품을 검색하고{'\n'}예약할 수 있어요</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeButton, styles.storeButton]}
          onPress={onSelectStore}
        >
          <Text style={styles.typeIcon}>🏪</Text>
          <Text style={styles.typeTitle}>사업자고객</Text>
          <Text style={styles.typeDescription}>상품을 등록하고{'\n'}예약을 관리할 수 있어요</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>뒤로 가기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  buttonContainer: {
    gap: 20,
    marginBottom: 30,
  },
  typeButton: {
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  consumerButton: {
    backgroundColor: '#F0F8FF',
    borderColor: '#007AFF',
  },
  storeButton: {
    backgroundColor: '#FFF5F0',
    borderColor: '#FF9500',
  },
  typeIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  typeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  typeDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  backButton: {
    padding: 15,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
});
