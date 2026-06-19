import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Platform, useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { useI18n } from '@/contexts/i18n';

export default function TabLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.backgroundElement },
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.habits,
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              tintColor={color}
              name={{ ios: 'checklist', android: 'checklist', web: 'checklist' }}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.settings,
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              tintColor={color}
              name={{ ios: 'gearshape', android: 'settings', web: 'settings' }}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
