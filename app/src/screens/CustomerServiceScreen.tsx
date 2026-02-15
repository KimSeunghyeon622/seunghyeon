import React from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface CustomerServiceScreenProps {
  onBack: () => void;
  onGoToFAQ: () => void;
}

export default function CustomerServiceScreen({
  onBack,
  onGoToFAQ,
}: CustomerServiceScreenProps) {
  const handleCall = () => {
    const phoneNumber = 'tel:02-1234-5678';
    Linking.canOpenURL(phoneNumber)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneNumber);
        } else {
          Alert.alert('알림', '전화 기능을 사용할 수 없습니다.');
        }
      })
      .catch((error) => {
        console.error('전화 연결 오류:', error);
        Alert.alert('오류', '전화 연결에 실패했습니다. 기기의 전화 앱 설정을 확인해주세요.');
      });
  };

  const handleEmail = async () => {
    const to = 'support@saveit.co.kr';
    const subject = encodeURIComponent('[문의] ');
    const body = encodeURIComponent('');
    const gmailUrl = `googlegmail://co?to=${to}&subject=${subject}&body=${body}`;
    const mailtoUrl = `mailto:${to}?subject=${subject}&body=${body}`;

    try {
      const canOpenGmail = await Linking.canOpenURL(gmailUrl);
      if (canOpenGmail) {
        await Linking.openURL(gmailUrl);
        return;
      }
      const canOpenMail = await Linking.canOpenURL(mailtoUrl);
      if (canOpenMail) {
        await Linking.openURL(mailtoUrl);
        return;
      }
      Alert.alert('알림', '이메일 앱을 찾을 수 없습니다.');
    } catch (error) {
      console.error('이메일 연결 오류:', error);
      Alert.alert('오류', '이메일 앱 연결에 실패했습니다. 이메일 앱이 설치되어 있는지 확인해주세요.');
    }
  };

  const handleKakao = () => {
    // 카카오톡 채널 연결 (실제 채널 URL로 변경 필요)
    const kakaoUrl = 'https://pf.kakao.com/_xxxxxb';
    Linking.openURL(kakaoUrl).catch(() => {
      Alert.alert('오류', '카카오톡 연결에 실패했습니다. 카카오톡이 설치되어 있는지 확인해주세요.');
    });
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>고객센터</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* 운영 시간 안내 */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💚 Save It 고객센터</Text>
          <Text style={styles.infoSubtitle}>
            궁금한 점이 있으시면 언제든 문의해주세요
          </Text>
          <View style={styles.hoursBox}>
            <Text style={styles.hoursLabel}>운영시간</Text>
            <Text style={styles.hoursText}>평일 09:00 - 18:00</Text>
            <Text style={styles.hoursNote}>(점심시간 12:00 - 13:00 / 주말·공휴일 휴무)</Text>
          </View>
        </View>

        {/* 문의 방법 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>문의 방법</Text>

          <TouchableOpacity style={styles.contactItem} onPress={handleCall}>
            <View style={styles.contactIcon}>
              <Text style={styles.iconText}>📞</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>전화 문의</Text>
              <Text style={styles.contactValue}>02-1234-5678</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactItem} onPress={handleEmail}>
            <View style={styles.contactIcon}>
              <Text style={styles.iconText}>✉️</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>이메일 문의</Text>
              <Text style={styles.contactValue}>support@saveit.co.kr</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactItem} onPress={handleKakao}>
            <View style={styles.contactIcon}>
              <Text style={styles.iconText}>💬</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>카카오톡 문의</Text>
              <Text style={styles.contactValue}>@saveit</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 자주 묻는 질문 바로가기 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>도움말</Text>

          <TouchableOpacity style={styles.contactItem} onPress={onGoToFAQ}>
            <View style={styles.contactIcon}>
              <Text style={styles.iconText}>❓</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>자주 묻는 질문</Text>
              <Text style={styles.contactValue}>빠르게 답변을 찾아보세요</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 사업자 정보 */}
        <View style={styles.businessInfo}>
          <Text style={styles.businessTitle}>사업자 정보</Text>
          <Text style={styles.businessText}>상호: (주)세이브잇</Text>
          <Text style={styles.businessText}>대표: 홍길동</Text>
          <Text style={styles.businessText}>사업자등록번호: 123-45-67890</Text>
          <Text style={styles.businessText}>통신판매업신고: 2024-서울강남-0000</Text>
          <Text style={styles.businessText}>
            주소: 서울특별시 강남구 테헤란로 123, 4층
          </Text>
        </View>

        {/* 정책 링크 */}
        <View style={styles.policyLinks}>
          <TouchableOpacity style={styles.policyLink}>
            <Text style={styles.policyText}>이용약관</Text>
          </TouchableOpacity>
          <Text style={styles.policyDivider}>|</Text>
          <TouchableOpacity style={styles.policyLink}>
            <Text style={styles.policyText}>개인정보처리방침</Text>
          </TouchableOpacity>
          <Text style={styles.policyDivider}>|</Text>
          <TouchableOpacity style={styles.policyLink}>
            <Text style={styles.policyText}>위치기반서비스</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFF',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 5,
  },
  backText: {
    fontSize: 24,
    color: '#333',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#E8F5E9',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 14,
    color: '#2E7D32',
    marginBottom: 16,
  },
  hoursBox: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
  },
  hoursLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  hoursText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  hoursNote: {
    fontSize: 12,
    color: '#999',
  },
  section: {
    backgroundColor: '#FFF',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 13,
    color: '#666',
  },
  arrow: {
    fontSize: 20,
    color: '#CCC',
  },
  businessInfo: {
    padding: 20,
  },
  businessTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  businessText: {
    fontSize: 12,
    color: '#999',
    lineHeight: 20,
  },
  policyLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  policyLink: {
    paddingHorizontal: 8,
  },
  policyText: {
    fontSize: 12,
    color: '#666',
  },
  policyDivider: {
    fontSize: 12,
    color: '#DDD',
  },
});
