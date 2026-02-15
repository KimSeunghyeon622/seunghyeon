import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface NoticeListScreenProps {
  onBack: () => void;
  onSelectNotice: (noticeId: string) => void;
}

interface NoticeSummary {
  id: string;
  title: string;
  content?: string | null;
  created_at?: string | null;
  published_at?: string | null;
}

const PAGE_SIZE = 50;

export default function NoticeListScreen({ onBack, onSelectNotice }: NoticeListScreenProps) {
  const [notices, setNotices] = useState<NoticeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotices = useCallback(async () => {
    const { data, error } = await supabase
      .from('notices')
      .select('id, title, content, created_at, published_at')
      .order('published_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (error) {
      console.warn('공지사항 불러오기 실패:', error.message);
      setNotices([]);
      return;
    }

    const sanitized = (data ?? []).filter((item) => item?.id && item?.title);
    setNotices(sanitized);
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchNotices()
      .catch(() => {
        if (mounted) {
          setNotices([]);
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
  }, [fetchNotices]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotices();
    setRefreshing(false);
  };

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
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {notices.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>등록된 공지사항이 없습니다.</Text>
              <Text style={styles.emptySub}>운영자가 등록하면 이곳에서 확인할 수 있어요.</Text>
            </View>
          ) : (
            notices.map((notice) => {
              const dateText = formatDate(notice.published_at ?? notice.created_at);
              return (
                <TouchableOpacity
                  key={notice.id}
                  style={styles.noticeItem}
                  onPress={() => onSelectNotice(notice.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.noticeHeaderRow}>
                    <Text style={styles.noticeTitle} numberOfLines={2}>
                      {notice.title}
                    </Text>
                    <Text style={styles.noticeArrow}>›</Text>
                  </View>
                  {dateText ? <Text style={styles.noticeDate}>{dateText}</Text> : null}
                </TouchableOpacity>
              );
            })
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
  noticeItem: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  noticeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noticeTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    lineHeight: 22,
  },
  noticeArrow: {
    fontSize: 20,
    color: '#CCC',
  },
  noticeDate: {
    marginTop: 6,
    fontSize: 12,
    color: '#999',
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
