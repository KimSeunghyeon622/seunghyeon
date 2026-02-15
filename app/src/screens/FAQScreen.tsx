import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface FAQScreenProps {
  onBack: () => void;
  onViewCustomerService?: () => void;
}

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    category: '이용 방법',
    question: '예약은 어떻게 하나요?',
    answer:
      '원하는 업체를 선택하고 상품을 고른 뒤, 수량과 픽업 시간을 선택하여 예약하시면 됩니다. 예약이 완료되면 예약번호가 발급되며, 해당 번호로 픽업 시 확인합니다.',
  },
  {
    id: '2',
    category: '이용 방법',
    question: '결제는 어떻게 하나요?',
    answer:
      '결제는 픽업 시 현장에서 진행됩니다. 현금, 카드, 계좌이체 등 업체와 협의하여 자유롭게 결제하실 수 있습니다.',
  },
  {
    id: '3',
    category: '예약/취소',
    question: '예약 취소는 어떻게 하나요?',
    answer:
      '예약 후 60분 이내에는 마이페이지 > 예약 내역에서 취소가 가능합니다. 60분이 지나면 예약 취소가 불가능하오니 유의해주세요.',
  },
  {
    id: '4',
    category: '예약/취소',
    question: '노쇼(No-show) 시 어떻게 되나요?',
    answer:
      '픽업 시간에 방문하지 않으실 경우 노쇼로 처리됩니다. 잦은 노쇼는 서비스 이용에 제한이 있을 수 있으니, 불가피한 경우 미리 취소해주세요.',
  },
  {
    id: '5',
    category: '리뷰',
    question: '리뷰는 언제 작성할 수 있나요?',
    answer:
      '픽업이 완료된 예약건에 한해 리뷰를 작성하실 수 있습니다. 마이페이지 > 예약 내역에서 "리뷰 쓰기" 버튼을 눌러 작성해주세요.',
  },
  {
    id: '6',
    category: '리뷰',
    question: '리뷰를 수정하거나 삭제할 수 있나요?',
    answer:
      '한 번 작성한 리뷰는 수정이나 삭제가 어렵습니다. 부정확한 정보가 포함된 경우 고객센터로 문의해주세요.',
  },
  {
    id: '7',
    category: '계정',
    question: '회원 탈퇴는 어떻게 하나요?',
    answer:
      '회원 탈퇴는 고객센터(support@saveit.co.kr)로 문의해주세요. 진행 중인 예약이 있는 경우 탈퇴가 제한될 수 있습니다.',
  },
  {
    id: '8',
    category: '계정',
    question: '비밀번호를 잊어버렸어요.',
    answer:
      '로그인 화면에서 "비밀번호 찾기"를 선택하시면, 가입하신 이메일로 비밀번호 재설정 링크가 발송됩니다.',
  },
  {
    id: '9',
    category: '업체',
    question: '업체로 입점하고 싶어요.',
    answer:
      '회원가입 시 "업체로 가입하기"를 선택하시고, 업체 정보와 사업자등록번호를 입력해주세요. 관리자 승인 후 서비스 이용이 가능합니다.',
  },
  {
    id: '10',
    category: '기타',
    question: '서비스 이용 가능 지역은 어디인가요?',
    answer:
      '현재는 서울 및 수도권 일부 지역에서 서비스 중입니다. 점차 전국으로 확대할 예정이니 많은 관심 부탁드립니다.',
  },
];

export default function FAQScreen({ onBack, onViewCustomerService }: FAQScreenProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');

  const categories = ['전체', ...new Set(FAQ_DATA.map((item) => item.category))];

  const filteredFAQ =
    selectedCategory === '전체'
      ? FAQ_DATA
      : FAQ_DATA.filter((item) => item.category === selectedCategory);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>자주 묻는 질문</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 카테고리 필터 */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* FAQ 목록 */}
      <ScrollView style={styles.content}>
        {filteredFAQ.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.faqItem}
            onPress={() => toggleExpand(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.questionRow}>
              <Text style={styles.questionMark}>Q</Text>
              <Text style={styles.questionText}>{item.question}</Text>
              <Text style={styles.expandIcon}>
                {expandedId === item.id ? '−' : '+'}
              </Text>
            </View>

            {expandedId === item.id && (
              <View style={styles.answerBox}>
                <Text style={styles.answerMark}>A</Text>
                <Text style={styles.answerText}>{item.answer}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* 추가 문의 안내 */}
        <TouchableOpacity
          style={styles.moreHelpBox}
          onPress={onViewCustomerService}
          activeOpacity={0.7}
        >
          <Text style={styles.moreHelpText}>
            원하는 답변을 찾지 못하셨나요?
          </Text>
          <Text style={styles.moreHelpSubText}>
            고객센터로 문의해주세요 →
          </Text>
        </TouchableOpacity>

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
  categoryContainer: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#00D563',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  categoryTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  faqItem: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  questionMark: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00D563',
    marginRight: 12,
    width: 20,
  },
  questionText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  expandIcon: {
    fontSize: 20,
    color: '#999',
    marginLeft: 8,
  },
  answerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#F8F9FA',
  },
  answerMark: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
    marginRight: 12,
    width: 20,
  },
  answerText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  moreHelpBox: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  moreHelpText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  moreHelpSubText: {
    fontSize: 14,
    color: '#00D563',
    fontWeight: '600',
  },
});
