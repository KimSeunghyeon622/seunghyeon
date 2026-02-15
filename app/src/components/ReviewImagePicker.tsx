/**
 * 리뷰 이미지 선택 컴포넌트
 * - 최대 2장까지 이미지 선택 가능
 * - 카메라 촬영 또는 갤러리에서 선택
 * - 이미지 미리보기 및 삭제 기능
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { uploadReviewImage } from '../api/reviewApi';

interface ReviewImagePickerProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export default function ReviewImagePicker({
  images,
  onImagesChange,
  maxImages = 2,
  disabled = false,
}: ReviewImagePickerProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // 이미지 선택 옵션 표시
  const showImageOptions = () => {
    if (disabled || images.length >= maxImages) return;

    Alert.alert(
      '사진 추가',
      '사진을 어떻게 추가하시겠습니까?',
      [
        {
          text: '카메라로 촬영',
          onPress: pickFromCamera,
        },
        {
          text: '앨범에서 선택',
          onPress: pickFromGallery,
        },
        {
          text: '취소',
          style: 'cancel',
        },
      ]
    );
  };

  // 카메라 권한 요청 및 촬영
  const pickFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          '권한 필요',
          '카메라 접근 권한이 필요합니다. 설정에서 권한을 허용해주세요.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handleImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('카메라 오류:', error);
      Alert.alert('오류', '카메라를 실행할 수 없습니다.');
    }
  };

  // 갤러리에서 선택
  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          '권한 필요',
          '사진 접근 권한이 필요합니다. 설정에서 권한을 허용해주세요.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handleImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('갤러리 오류:', error);
      Alert.alert('오류', '갤러리를 열 수 없습니다.');
    }
  };

  // 이미지 선택 후 업로드
  const handleImageSelected = async (uri: string) => {
    try {
      setUploadingIndex(images.length);

      // 사용자 ID 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      // 이미지 업로드
      const imageUrl = await uploadReviewImage(uri, user.id);

      // 이미지 목록에 추가
      onImagesChange([...images, imageUrl]);
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      Alert.alert('업로드 실패', '사진 업로드에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setUploadingIndex(null);
    }
  };

  // 이미지 삭제
  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onImagesChange(newImages);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>사진 (최대 {maxImages}장)</Text>

      <View style={styles.imageRow}>
        {/* 기존 이미지들 */}
        {images.map((uri, index) => (
          <View key={uri} style={styles.imageWrapper}>
            <Image source={{ uri }} style={styles.imagePreview} />
            {!disabled && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveImage(index)}
                accessibilityLabel={`사진 ${index + 1} 삭제`}
              >
                <Text style={styles.removeButtonText}>X</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* 업로드 중 표시 */}
        {uploadingIndex !== null && (
          <View style={[styles.imageWrapper, styles.uploadingWrapper]}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.uploadingText}>업로드 중...</Text>
          </View>
        )}

        {/* 추가 버튼 */}
        {images.length < maxImages && uploadingIndex === null && !disabled && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={showImageOptions}
            accessibilityLabel={`사진 추가 (현재 ${images.length}장)`}
          >
            <Text style={styles.addButtonIcon}>+</Text>
            <Text style={styles.addButtonText}>사진 추가</Text>
            <Text style={styles.addButtonCounter}>({images.length}/{maxImages})</Text>
          </TouchableOpacity>
        )}
      </View>

      {images.length >= maxImages && (
        <Text style={styles.maxLimitText}>
          최대 {maxImages}장까지 추가할 수 있습니다
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  imageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageWrapper: {
    width: 80,
    height: 80,
    position: 'relative',
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  uploadingWrapper: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#FFFFFF',
    fontSize: 10,
    marginTop: 4,
  },
  addButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonIcon: {
    fontSize: 24,
    color: '#999999',
    marginBottom: 2,
  },
  addButtonText: {
    fontSize: 11,
    color: '#666666',
  },
  addButtonCounter: {
    fontSize: 10,
    color: '#999999',
    marginTop: 2,
  },
  maxLimitText: {
    fontSize: 12,
    color: '#999999',
    marginTop: 8,
  },
});
