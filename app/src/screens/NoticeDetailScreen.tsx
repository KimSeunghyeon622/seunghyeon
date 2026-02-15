import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

interface NoticeDetailScreenProps {
  noticeId: string;
  onBack: () => void;
}

interface NoticeDetail {
  id: string;
  title: string;
  content?: string | null;
  created_at?: string | null;
  published_at?: string | null;
}

export default function NoticeDetailScreen({ noticeId, onBack }: NoticeDetailScreenProps) {
  const [notice, setNotice] = useState<NoticeDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchNotice = async () => {
      const { data, error } = await supabase
        .from('notices')
        .select('id, title, content, created_at, published_at')
        .eq('id', noticeId)
        .single();

      if (!mounted) return;

      if (error) {
        console.warn('공지사항 상세 불러오기 실패:', error.message);
        setNotice(null);
      } else {
        setNotice(data ?? null);
      }
    };

    setLoading(true);
    fetchNotice()
      .catch(() => {
        if (mounted) {
          setNotice(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [noticeId]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>공지사항</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#00D563" />
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {notice ? (
            <View style={styles.noticeBox}>
              <Text style={styles.noticeTitle}>{notice.title}</Text>
              <Text style={styles.noticeDate}>
                {formatDate(notice.published_at ?? notice.created_at)}
              </Text>
              <View style={styles.divider} />
              <Text style={styles.noticeContent}>
                {notice.content?.trim() || '내용 준비중입니다.'}
              </Text>
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>공지사항을 찾을 수 없습니다.</Text>
              <Text style={styles.emptySub}>잠시 후 다시 확인해주세요.</Text>
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  noticeBox: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  noticeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    lineHeight: 28,
  },
  noticeDate: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
  },
  divider: {
    marginTop: 16,
    marginBottom: 16,
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  noticeContent: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#999',
  },
});
