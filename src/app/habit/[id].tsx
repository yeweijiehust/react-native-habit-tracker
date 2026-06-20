import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StatsChart } from '@/components/stats-chart';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useHabits, type Habit } from '@/hooks/use-habits';
import { useCheckIns, type CheckInCount } from '@/hooks/use-check-ins';
import { useI18n } from '@/contexts/i18n';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const habitId = Number(id);
  const { t } = useI18n();
  const { loadHabits, deleteHabit } = useHabits();
  const { getCheckInCount, getCheckInsGrouped } = useCheckIns();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [checkIns, setCheckIns] = useState<CheckInCount[]>([]);

  const load = useCallback(async () => {
    const habits = await loadHabits();
    const h = habits.find((h: Habit) => h.id === habitId);
    setHabit(h ?? null);
    const count = await getCheckInCount(habitId);
    setTotalCount(count);
    const grouped = await getCheckInsGrouped(habitId);
    setCheckIns(grouped);
  }, [habitId, loadHabits, getCheckInCount, getCheckInsGrouped]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = () => {
    Alert.alert(t.delete, t.deleteConfirm, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          await deleteHabit(habitId);
          router.back();
        },
      },
    ]);
  };

  if (!habit) return null;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedView style={styles.header}>
            <ThemedText style={styles.emoji}>{habit.emoji || '📋'}</ThemedText>
            <ThemedText type="title" style={styles.name}>
              {habit.name}
            </ThemedText>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.statCard}>
            <ThemedText style={styles.statNumber}>{totalCount}</ThemedText>
            <ThemedText themeColor="textSecondary">{t.totalCheckIns}</ThemedText>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {t.checkInsByDate}
            </ThemedText>
            <StatsChart data={checkIns} />
          </ThemedView>

          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [styles.deleteButton, { opacity: pressed ? 0.7 : 1 }]}
          >
            <ThemedText style={styles.deleteText}>{t.delete}</ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.three,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: BottomTabInset + Spacing.three,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
  emoji: {
    fontSize: 64,
  },
  name: {
    textAlign: 'center',
  },
  statCard: {
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  statNumber: {
    fontSize: 48,
    fontWeight: 700,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    marginTop: Spacing.two,
  },
  deleteButton: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.four,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  deleteText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 600,
  },
});
