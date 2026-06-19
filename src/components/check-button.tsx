import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

type Props = {
  checked: boolean;
  onPress: () => void;
};

export function CheckButton({ checked, onPress }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: checked ? '#34C759' : theme.backgroundSelected,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <ThemedText style={[styles.label, checked && styles.checkedLabel]}>
        {checked ? '✓' : '○'}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 20,
  },
  checkedLabel: {
    color: '#fff',
  },
});
