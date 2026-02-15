/**
 * 리뷰 이미지 표시 컴포넌트
 * - 리뷰에 첨부된 사진들을 표시
 * - 클릭 시 확대 보기 모달 (선택사항)
 */
import React, { useState } from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface ReviewImagesProps {
  images: string[];
  size?: 'small' | 'medium' | 'large';
}

export default function ReviewImages({ images, size = 'medium' }: ReviewImagesProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const imageSize = size === 'small' ? 60 : size === 'medium' ? 80 : 100;

  const handleImagePress = (index: number) => {
    setSelectedImageIndex(index);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageRow}>
        {images.map((uri, index) => (
          <TouchableOpacity
            key={uri}
            onPress={() => handleImagePress(index)}
            activeOpacity={0.8}
            accessibilityLabel={`리뷰 사진 ${index + 1}`}
          >
            <Image
              source={{ uri }}
              style={[
                styles.image,
                { width: imageSize, height: imageSize }
              ]}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* 확대 보기 모달 */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackground}
            onPress={() => setModalVisible(false)}
            activeOpacity={1}
          >
            <View style={styles.modalContent}>
              <Image
                source={{ uri: images[selectedImageIndex] }}
                style={styles.modalImage}
                resizeMode="contain"
              />

              {/* 이미지 인디케이터 (2장인 경우) */}
              {images.length > 1 && (
                <View style={styles.indicatorRow}>
                  {images.map((_, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.indicator,
                        index === selectedImageIndex && styles.indicatorActive,
                      ]}
                      onPress={() => setSelectedImageIndex(index)}
                    />
                  ))}
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* 닫기 버튼 */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
            accessibilityLabel="닫기"
          >
            <Text style={styles.closeButtonText}>X</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  imageRow: {
    flexDirection: 'row',
    gap: 8,
  },
  image: {
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    alignItems: 'center',
  },
  modalImage: {
    width: '90%',
    height: '70%',
  },
  indicatorRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  indicatorActive: {
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
