import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useHabits } from '@/hooks/use-habits';
import { useI18n } from '@/contexts/i18n';

export default function NewHabitScreen() {
  const theme = useTheme();
  const { t } = useI18n();
  const { createHabit } = useHabits();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    await createHabit(name.trim(), emoji.trim());
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ThemedView style={styles.form}>
          <ThemedText type="subtitle">{t.newHabit}</ThemedText>

          <ThemedView type="backgroundElement" style={styles.inputGroup}>
            <ThemedText>{t.habitName}</ThemedText>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Drink water"
              placeholderTextColor={theme.textSecondary}
              autoFocus
            />
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.inputGroup}>
            <ThemedText>{t.habitEmoji}</ThemedText>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
              value={emoji}
              onChangeText={setEmoji}
              placeholder="e.g. 💧"
              placeholderTextColor={theme.textSecondary}
            />
          </ThemedView>

          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveButton,
              { backgroundColor: theme.text, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <ThemedText style={[styles.saveText, { color: theme.background }]}>
              {t.save}
            </ThemedText>
          </Pressable>
        </ThemedView>
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
  form: {
    flex: 1,
    padding: Spacing.three,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  inputGroup: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.two,
    fontSize: 16,
  },
  saveButton: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  saveText: {
    fontSize: 18,
    fontWeight: 600,
  },
});
