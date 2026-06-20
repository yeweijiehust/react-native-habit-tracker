# 05: Theming — Light & Dark Mode

Modern mobile apps support light and dark mode. Expo makes this straightforward with the device color scheme API.

## Prerequisites

- Tutorial 02: React Foundations (components, hooks)
- Tutorial 03: React Native Basics (StyleSheet)
- Understanding of what dark mode is (system-wide setting on Android/iOS)

## What You'll Learn

- Detecting the device color scheme
- Designing a color token system
- Creating theme-aware components (ThemedText, ThemedView)
- Platform-specific fonts and spacing
- Safe area and content width constraints

---

## 1. The Theme Architecture

Our theming system has three layers:

```
System Preference (Light/Dark)
        │
        ▼
useColorScheme() hook
        │
        ▼
Colors object (light or dark palette)
        │
        ▼
Components consume Colors via useTheme() or ThemedText/ThemedView
```

## 2. Detecting the Color Scheme

React Native provides `useColorScheme()`:

```tsx
import { useColorScheme } from 'react-native';

function MyComponent() {
  const scheme = useColorScheme();
  // scheme is 'light', 'dark', or null (on web SSR)
}
```

Our project wraps this in `src/hooks/use-theme.ts`:

```tsx
// src/hooks/use-theme.ts
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  const scheme = useColorScheme();
  const theme = scheme === 'unspecified' ? 'light' : scheme;
  return Colors[theme];
}
```

### The Web Variant

On web, static rendering can cause a flash of wrong theme. The web variant (`use-color-scheme.web.ts`) handles this by defaulting to 'light' during server-side rendering:

```tsx
// src/hooks/use-color-scheme.web.ts
export function useColorScheme() {
  const [scheme, setScheme] = useState<ColorSchemeName>('light'); // SSR safe
  useEffect(() => {
    // After hydration, read the real color scheme
    setScheme(getColorScheme());
  }, []);
  return scheme;
}
```

> **Why a separate web file?** Metro resolves platform-specific files: `file.web.ts` is used on web, `file.ts` is used on native. This is a built-in feature of the bundler.

## 3. The Color Token System

All colors are defined in `src/constants/theme.ts`:

```tsx
export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;
```

### Why "Design Tokens"?

Hard-coding colors like `#34C759` (the green checkmark) is fine for specific cases. But for general UI colors (text, background), we use **design tokens** — semantic names that abstract the actual color value.

Instead of:
```tsx
// What does #F0F0F3 mean? Is it a background? A border?
<View style={{ backgroundColor: '#F0F0F3' }} />
```

We write:
```tsx
// "backgroundElement" is a card/ surface background
<ThemedView type="backgroundElement" />
```

Benefits:
1. **Consistency** — one color for all card backgrounds
2. **Theming** — light and dark automatically switch
3. **Maintainability** — change one value, update everywhere

### The ThemeColor Type

```tsx
export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
// Resolves to: 'text' | 'background' | 'backgroundElement' | 'backgroundSelected' | 'textSecondary'
```

This ensures both light and dark palettes have the same keys — TypeScript catches it at compile time if they don't match.

## 4. ThemedText and ThemedView

These two components bridge the gap between tokens and actual UI elements.

### ThemedText

```tsx
// src/components/themed-text.tsx
export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] }, // Dynamic color from theme
        type === 'title' && styles.title,        // Predefined typography
        type === 'default' && styles.default,
        type === 'small' && styles.small,
        type === 'code' && styles.code,
        style,                                    // Allow overriding
      ]}
      {...rest}
    />
  );
}
```

Usage patterns:

```tsx
// Default text (uses 'text' color)
<ThemedText>Hello</ThemedText>

// Secondary text color
<ThemedText themeColor="textSecondary">Note: pull to refresh</ThemedText>

// Typography variant
<ThemedText type="title">Habit Tracker</ThemedText>
<ThemedText type="small">Detail text</ThemedText>
<ThemedText type="code">npx expo start</ThemedText>
```

### ThemedView

```tsx
// src/components/themed-view.tsx
export function ThemedView({ style, type, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();
  return (
    <View
      style={[{ backgroundColor: theme[type ?? 'background'] }, style]}
      {...otherProps}
    />
  );
}
```

Usage:

```tsx
// Default (background)
<ThemedView>...</ThemedView>

// Card/ surface element
<ThemedView type="backgroundElement" style={styles.card}>
  <ThemedText>Card content</ThemedText>
</ThemedView>

// Selected state
<ThemedView type="backgroundSelected">
  <ThemedText>Selected item</ThemedText>
</ThemedView>
```

## 5. Spacing and Layout Constants

The theme file also defines consistent spacing:

```tsx
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;
```

This replaces magic numbers:

```tsx
// ❌ Magic numbers — hard to maintain
const styles = StyleSheet.create({
  card: { padding: 16, gap: 8, borderRadius: 12 },
});

// ✅ Semantic tokens — consistent and customizable
const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,   // 16
    gap: Spacing.two,          // 8
    borderRadius: Spacing.three, // 16
  },
});
```

### Platform-Specific Values

```tsx
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
```

- `BottomTabInset` — accounts for different tab bar heights on iOS vs Android
- `MaxContentWidth` — constrains content to 800px on wide screens (like tablets or web)

## 6. Platform-Specific Fonts

Different platforms have different system fonts:

```tsx
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {      // Android
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});
```

On iOS, the system provides beautiful SF Pro fonts. On Android, we use standard typefaces. On web, we use CSS custom properties defined in `src/global.css`:

```css
:root {
  --font-display: "Spline Sans", Inter, system-ui, sans-serif;
  --font-mono: "Spline Sans Mono", monospace;
  --font-rounded: "SF Pro Rounded", "Hiragino Maru Gothic ProN", system-ui, sans-serif;
  --font-serif: Georgia, "Noto Serif CJK SC", serif;
}
```

This is why TypeScript's `Platform.select()` is so useful — it lets you provide platform-specific values with a clean syntax.

## 7. How the Theme Flows Through the App

```
System: User selects Dark Mode
        │
        ▼
useColorScheme() returns 'dark'
        │
        ▼
useTheme() returns Colors['dark']
        │
        ▼
  ┌─── ThemedText uses Colors['dark'].text (#ffffff)
  ├─── ThemedView uses Colors['dark'].background (#000000)
  └─── HabitCard uses Colors['dark'].backgroundElement (#212225)
        │
        ▼
All screens automatically update when the system theme changes
```

Every component that uses `useTheme()`, `ThemedText`, or `ThemedView` will **automatically re-render** when the user switches between light and dark mode. No manual toggling needed.

## Practice

Look at `src/constants/theme.ts`. Answer these questions:

1. How many color tokens are in each palette?
2. What is the value of `Spacing.four`?
3. Why does `BottomTabInset` differ between iOS and Android?
4. What happens if you add a new key to `Colors.light` but forget to add it to `Colors.dark`?

**Answers**:
1. Five: `text`, `background`, `backgroundElement`, `backgroundSelected`, `textSecondary`
2. 24
3. The bottom tab bar has different heights on each platform — iOS is ~50px, Android is ~80px
4. TypeScript will give a compile error because `ThemeColor` is the intersection of both keys, and the intersection must be non-empty

## Next Tutorial

Proceed to **Tutorial 06: SQLite** — storing habits and check-ins in a local database.
