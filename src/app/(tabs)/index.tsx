import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { HabitCard } from '@/components/habit-card';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useHabits, type HabitWithStatus } from '@/hooks/use-habits';
import { useCheckIns } from '@/hooks/use-check-ins';
import { useI18n } from '@/contexts/i18n';

export default function HabitsScreen() {
  const theme = useTheme();
  const { t } = useI18n();
  const { loadHabitsWithStatus } = useHabits();
  const { toggleCheckIn } = useCheckIns();
  const [habits, setHabits] = useState<HabitWithStatus[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    const data = await loadHabitsWithStatus();
    setHabits(data);
  }, [loadHabitsWithStatus]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleToggle = useCallback(
    async (habitId: number) => {
      await toggleCheckIn(habitId);
      await refresh();
    },
    [toggleCheckIn, refresh]
  );

  const handlePress = useCallback((habit: HabitWithStatus) => {
    router.push(`/habit/${habit.id}`);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <FlatList
          data={habits}
          keyExtractor={(item) => String(item.id)}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: BottomTabInset + Spacing.three },
          ]}
          ListEmptyComponent={
            <ThemedView style={styles.empty}>
              <ThemedText themeColor="textSecondary">{t.noHabitsYet}</ThemedText>
            </ThemedView>
          }
          renderItem={({ item }) => (
            <HabitCard habit={item} onToggle={handleToggle} onPress={handlePress} />
          )}
        />

        <Pressable
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: theme.text, opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={() => router.push('/habit/new')}
        >
          <SymbolView
            tintColor={theme.background}
            name={{ ios: 'plus', android: 'add', web: 'add' }}
            size={24}
          />
        </Pressable>
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
  list: {
    padding: Spacing.three,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  empty: {
    padding: Spacing.six,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: Spacing.four,
    bottom: Spacing.four + BottomTabInset,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
