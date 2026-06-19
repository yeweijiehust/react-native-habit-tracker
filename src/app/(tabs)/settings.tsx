import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useI18n } from '@/contexts/i18n';

export default function SettingsScreen() {
  const { t, lang, setLang } = useI18n();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ThemedView style={styles.content}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            {t.language}
          </ThemedText>
          <ThemedView type="backgroundElement" style={styles.card}>
            <LangOption
              label={t.english}
              selected={lang === 'en'}
              onPress={() => setLang('en')}
            />
            <ThemedView style={styles.divider} />
            <LangOption
              label={t.chinese}
              selected={lang === 'zh'}
              onPress={() => setLang('zh')}
            />
          </ThemedView>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            {t.about}
          </ThemedText>
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText style={styles.aboutText}>
              {t.habitTracker} v1.0.0
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

function LangOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.langRow}>
      <ThemedText style={styles.langLabel}>{label}</ThemedText>
      <ThemedView
        style={[styles.radio, selected && styles.radioSelected]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.three,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: BottomTabInset,
  },
  sectionTitle: {
    marginTop: Spacing.two,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(128,128,128,0.2)',
    marginVertical: Spacing.two,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
  langLabel: {
    fontSize: 16,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#8E8E93',
  },
  radioSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  aboutText: {
    fontSize: 14,
  },
});
