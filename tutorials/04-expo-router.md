# 04: Expo Router — File-Based Navigation

Navigation is fundamental to any multi-screen app. Expo Router handles it with a simple idea: **the file system is your route map**.

## Prerequisites

- Tutorial 02: React Foundations
- Tutorial 03: React Native Basics
- Understanding of screens/pages in a mobile app

## What You'll Learn

- How file-based routing works
- Layouts and nested layouts
- The Stack navigator
- The Tab navigator
- Dynamic routes with `[param]` syntax
- Navigation hooks: `router`, `useLocalSearchParams`, `useFocusEffect`

---

## 1. The Core Idea

In Expo Router, every file inside `src/app/` automatically becomes a screen.

```
src/app/
├── _layout.tsx          ← Root layout (runs for every screen)
├── (tabs)/
│   ├── _layout.tsx      ← Tab layout
│   ├── index.tsx        →  / (Habits tab)
│   └── settings.tsx     →  /settings (Settings tab)
└── habit/
    ├── new.tsx           →  /habit/new  (Add habit modal)
    └── [id].tsx          →  /habit/1, /habit/2, etc. (Detail page)
```

This maps to:

| URL | File | Screen |
|-----|------|--------|
| `/` | `(tabs)/index.tsx` | Habits list |
| `/settings` | `(tabs)/settings.tsx` | Settings |
| `/habit/new` | `habit/new.tsx` | New habit form |
| `/habit/5` | `habit/[id].tsx` | Detail for habit #5 |

## 2. The _layout.tsx — Layout Components

A **layout** file wraps child routes. It defines the navigation structure (Stack, Tabs) and shared UI (headers, providers).

### Root Layout (`src/app/_layout.tsx`)

```tsx
import { Stack } from 'expo-router';
import { DatabaseProvider } from '@/contexts/database';
import { I18nProvider } from '@/contexts/i18n';

export default function RootLayout() {
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <DatabaseProvider>
        <I18nProvider>
          <AnimatedSplashOverlay />
          <Stack>                             {/* Stack navigator — push/pop screens */}
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
```

**What's happening**:

1. **Providers** wrap everything — every screen has access to the database and i18n
2. **`<Stack>`** — creates a native stack navigator. Screens are pushed on top of each other (like a deck of cards). The user navigates forward (push) and backward (pop).
3. **`Stack.Screen`** — registers each route with the stack
4. **`headerShown: false`** — hides the stack header for the tabs (because tabs have their own header)
5. **`presentation: 'modal'`** — the new habit screen slides up from the bottom like a modal

### Why Layouts Matter

Layouts allow **provider nesting** — the database and i18n contexts are available on every screen without importing them individually. This is the React pattern of "lifting state up" applied to navigation.

## 3. The Tab Navigator (`(tabs)/_layout.tsx`)

The `(tabs)` directory is a **route group** — the parentheses mean it doesn't add a segment to the URL. It just creates a layout.

```tsx
import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';

export default function TabLayout() {
  const { t } = useI18n();

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: colors.text,
      tabBarStyle: { backgroundColor: colors.background },
    }}>
      <Tabs.Screen
        name="index"               // Matches (tabs)/index.tsx
        options={{
          title: t.habits,          // Localized title
          tabBarIcon: ({ color, size }) => (
            <SymbolView tintColor={color} name={{ ios: 'checklist', android: 'checklist' }} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"            // Matches (tabs)/settings.tsx
        options={{
          title: t.settings,
          tabBarIcon: ({ color, size }) => (
            <SymbolView tintColor={color} name={{ ios: 'gearshape', android: 'settings' }} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
```

**Key points**:
- `name="index"` matches the file `(tabs)/index.tsx`
- `tabBarIcon` uses `SymbolView` from `expo-symbols` for platform-native icons
- The title is dynamic — it changes when the user switches language

## 4. Dynamic Routes — `[id].tsx`

The file `habit/[id].tsx` creates a **dynamic route**. The brackets `[id]` capture the URL segment as a parameter.

```tsx
// src/app/habit/[id].tsx
import { useLocalSearchParams } from 'expo-router';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const habitId = Number(id);
  // ...
}
```

Navigation to a dynamic route:

```tsx
// From habits list screen
router.push(`/habit/${habit.id}`);
// If habit.id is 5, this navigates to /habit/5
```

### Why Dynamic Routes Matter

Without dynamic routes, you'd need a separate file for each habit:
- `habit/1.tsx`
- `habit/2.tsx`
- `habit/3.tsx`

That's impossible for user-generated data. Dynamic routes solve this by making the habit ID part of the URL.

## 5. Navigation with router

The `router` object provides programmatic navigation:

```tsx
import { router } from 'expo-router';

// Navigate to a screen (pushes onto stack)
router.push('/habit/new');

// Navigate back
router.back();

// Replace current screen (no back button to previous)
router.replace('/settings');
```

### Types of Navigation

| Method | Behavior | Analogy |
|--------|----------|---------|
| `push` | Adds screen to stack, back button available | Opening a new tab in a browser |
| `back` | Pops current screen, returns to previous | Browser back button |
| `replace` | Replaces current screen, no back | Redirect in browser |
| `dismissAll` | Goes back to first screen | Closing all tabs to root |

## 6. useFocusEffect — Run Code on Screen Focus

This is crucial for our app. `useFocusEffect` runs a callback every time the screen gains focus (not just on mount):

```tsx
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

useFocusEffect(
  useCallback(() => {
    // This runs:
    // 1. When the screen first loads
    // 2. When navigating back to this screen
    // 3. When switching tabs back to this screen
    loadData();
  }, [loadData])
);
```

### Why Not useEffect?

| Hook | When it runs | Problem for our app |
|------|-------------|-------------------|
| `useEffect` | On mount only | User adds a habit → navigates back → screen is still mounted → `useEffect` doesn't re-run |
| `useFocusEffect` | On focus (every time) | Screen runs `refresh()` every time it's focused → list stays up-to-date |

That's why we use `useFocusEffect` in our habits list:

```tsx
// src/app/(tabs)/index.tsx
useFocusEffect(
  useCallback(() => {
    refresh(); // Reload habits from database every time
  }, [refresh])
);
```

## 7. Typed Routes

Our `app.json` enables `"typedRoutes": true`. This generates TypeScript types for every route, making `router.push()` type-safe:

```tsx
// With typed routes, this is type-checked:
router.push('/habit/new');    // ✅ Valid route
router.push('/nonexistent');  // ❌ TypeScript error — route doesn't exist

// Dynamic route params are checked too:
router.push(`/habit/${id}`);  // ✅ id must be a number (or string)
```

If you look at `.expo/types/router.d.ts`, you'll see the generated types:

```ts
href: ... | `/habit/new${...}` | `/habit/${number}${...}` | ...
```

This catches navigation errors at compile time instead of runtime.

## Visualizing the Navigation Flow

```
Home (/)                           ← Tab 1
  │
  ├── Tap "＋" → /habit/new       ← Modal (push)
  │     └── Save → router.back()
  │
  └── Tap habit → /habit/5        ← Detail (push)
        ├── View statistics
        └── Delete → router.back()

Settings (/settings)               ← Tab 2
  └── Switch language
```

The Stack navigator gives every screen a native back button (except tabs). The Tab navigator provides bottom tab switching. They compose together seamlessly.

## Practice

Look at `src/app/_layout.tsx` and `src/app/(tabs)/_layout.tsx`:

1. How many Stack screens are registered?
2. Which screen uses `presentation: 'modal'` and why?
3. What does `headerShown: false` do for the tabs?

**Answers**:
1. Three: `(tabs)`, `habit/new`, `habit/[id]`
2. `habit/new` — it's a form that should slide up from the bottom like a modal
3. It hides the stack's header bar because the Tab navigator has its own header

## Next Tutorial

Proceed to **Tutorial 05: Theming** — implementing light/dark mode in our app.
