import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CheckButton } from '@/components/check-button';
import { Spacing } from '@/constants/theme';
import type { HabitWithStatus } from '@/hooks/use-habits';

type Props = {
  habit: HabitWithStatus;
  onToggle: (habitId: number) => void;
  onPress: (habit: HabitWithStatus) => void;
};

export function HabitCard({ habit, onToggle, onPress }: Props) {
  return (
    <Pressable onPress={() => onPress(habit)}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText style={styles.emoji}>{habit.emoji || '📋'}</ThemedText>
        <ThemedText style={styles.name}>{habit.name}</ThemedText>
        <CheckButton checked={!!habit.checked_today} onPress={() => onToggle(habit.id)} />
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  emoji: {
    fontSize: 28,
  },
  name: {
    flex: 1,
    fontSize: 18,
    fontWeight: 600,
  },
});
