import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { DatabaseProvider } from '@/contexts/database';
import { I18nProvider } from '@/contexts/i18n';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <DatabaseProvider>
        <I18nProvider>
          <AnimatedSplashOverlay />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="habit/new"
              options={{ presentation: 'modal', title: 'New Habit' }}
            />
            <Stack.Screen name="habit/[id]" options={{ title: 'Habit' }} />
          </Stack>
        </I18nProvider>
      </DatabaseProvider>
    </ThemeProvider>
  );
}
