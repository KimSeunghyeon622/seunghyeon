/**
 * 수량 선택 컴포넌트
 * - 증가/감소 버튼으로 수량 조절
 * - 재고 범위 내에서만 선택 가능
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface QuantitySelectorProps {
  quantity: number;
  min?: number;
  max: number;
  onQuantityChange: (quantity: number) => void;
  disabled?: boolean;
}

export default function QuantitySelector({
  quantity,
  min = 1,
  max,
  onQuantityChange,
  disabled = false,
}: QuantitySelectorProps) {
  const handleDecrease = () => {
    if (quantity > min && !disabled) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < max && !disabled) {
      onQuantityChange(quantity + 1);
    }
  };

  const canDecrease = quantity > min && !disabled;
  const canIncrease = quantity < max && !disabled;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          !canDecrease && styles.buttonDisabled,
        ]}
        onPress={handleDecrease}
        disabled={!canDecrease}
        accessibilityLabel="수량 감소"
        accessibilityRole="button"
      >
        <Text
          style={[
            styles.buttonText,
            !canDecrease && styles.buttonTextDisabled,
          ]}
        >
          −
        </Text>
      </TouchableOpacity>

      <Text style={styles.quantityText}>{quantity}</Text>

      <TouchableOpacity
        style={[
          styles.button,
          styles.buttonIncrease,
          !canIncrease && styles.buttonDisabled,
        ]}
        onPress={handleIncrease}
        disabled={!canIncrease}
        accessibilityLabel="수량 증가"
        accessibilityRole="button"
      >
        <Text
          style={[
            styles.buttonText,
            styles.buttonTextIncrease,
            !canIncrease && styles.buttonTextDisabled,
          ]}
        >
          +
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  buttonIncrease: {
    backgroundColor: '#00D563',
    borderColor: '#00D563',
  },
  buttonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666666',
  },
  buttonTextIncrease: {
    color: '#FFFFFF',
  },
  buttonTextDisabled: {
    color: '#CCCCCC',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: 'center',
  },
});
