import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { CheckInCount } from '@/hooks/use-check-ins';

type Props = {
  data: CheckInCount[];
};

export function StatsChart({ data }: Props) {
  const theme = useTheme();
  if (data.length === 0) {
    return (
      <ThemedView style={styles.empty}>
        <ThemedText themeColor="textSecondary">No check-ins yet</ThemedText>
      </ThemedView>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <ThemedView style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.chartInner, { minWidth: data.length * 44 }]}>
          {data.map((item) => {
            const height = (item.count / maxCount) * 100;
            return (
              <View key={item.date} style={styles.barWrapper}>
                <ThemedText style={styles.count}>{item.count}</ThemedText>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(height, 4),
                      backgroundColor: theme.text,
                    },
                  ]}
                />
                <ThemedText style={styles.date}>
                  {item.date.slice(5)}
                </ThemedText>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.three,
    minHeight: 160,
  },
  chartInner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  barWrapper: {
    alignItems: 'center',
    gap: Spacing.half,
    minWidth: 36,
  },
  bar: {
    width: 20,
    borderRadius: 4,
  },
  count: {
    fontSize: 10,
    fontWeight: 600,
  },
  date: {
    fontSize: 9,
  },
  empty: {
    padding: Spacing.four,
    alignItems: 'center',
  },
});
