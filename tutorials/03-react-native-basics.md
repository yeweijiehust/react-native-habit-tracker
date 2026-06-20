# 03: React Native Basics

Now that you understand React components, it's time to learn React Native — the library that turns those components into real mobile UI.

## Prerequisites

- Tutorial 02: React Foundations (components, JSX, state, hooks)
- Basic CSS knowledge (helpful but not required)

## What You'll Learn

- Core React Native components: View, Text, Pressable, ScrollView, FlatList
- The StyleSheet API
- Flexbox layout in React Native
- Platform-specific code
- SafeAreaView for device notches

---

## 1. No HTML, No DOM

In React for the web, you write `<div>`, `<span>`, `<p>`, `<h1>`, etc. — these are **DOM elements**.

In React Native, there is no DOM. Instead, you use **React Native components** that map to native Android/iOS UI widgets:

| React Native | Web Equivalent | Android Native | iOS Native |
|-------------|---------------|----------------|------------|
| `<View>` | `<div>` | `android.view.View` | `UIView` |
| `<Text>` | `<span>` / `<p>` | `android.widget.TextView` | `UITextView` |
| `<Pressable>` | `<button>` | `android.widget.Button` | `UIButton` |
| `<ScrollView>` | `<div style="overflow:scroll">` | `ScrollView` | `UIScrollView` |
| `<FlatList>` | Complex | `RecyclerView` | `UICollectionView` |
| `<Image>` | `<img>` | `ImageView` | `UIImageView` |
| `<TextInput>` | `<input>` | `EditText` | `UITextField` |

**Key rule**: In React Native, every text must be inside a `<Text>` component. You cannot put text directly inside a `<View>`.

```tsx
// ❌ Wrong — text without Text component
<View>Hello</View>

// ✅ Correct
<View>
  <Text>Hello</Text>
</View>
```

## 2. View — The Building Block

`View` is the most fundamental layout component. It's a container that supports flexbox layout, styling, and touch handling.

In our project, `ThemedView` wraps it:

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

Usage in the app:

```tsx
<ThemedView type="backgroundElement" style={styles.card}>
  {/* card content */}
</ThemedView>
```

## 3. Text — All Text Must Be Inside Text

`Text` is the only component that renders text. It supports nesting for styling:

```tsx
<ThemedText type="small">
  Press <ThemedText type="code">cmd+d</ThemedText> to open dev menu
</ThemedText>
```

Our `ThemedText` component adds theme support:

```tsx
// src/components/themed-text.tsx
export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'title' && styles.title,    // fontSize: 48
        type === 'default' && styles.default,  // fontSize: 16
        type === 'small' && styles.small,      // fontSize: 14
        style,
      ]}
      {...rest}
    />
  );
}
```

## 4. StyleSheet — Defining Styles

React Native uses JavaScript objects for styling (not CSS files). The `StyleSheet.create()` function creates optimized style objects:

```tsx
import { StyleSheet, View, Text } from 'react-native';

export function MyComponent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
```

### Key Differences from CSS

| CSS | React Native |
|-----|-------------|
| `background-color` | `backgroundColor` (camelCase) |
| `font-size` | `fontSize` (camelCase) |
| `padding: 10px 20px` | `paddingHorizontal: 20, paddingVertical: 10` |
| `border: 1px solid black` | `borderWidth: 1, borderColor: 'black'` |
| Text is center by default | No default centering |
| `display: flex` is opt-in | Flexbox is default |
| `flex-direction: row` by default | `flex-direction: column` by default |

Wait — **flex-direction is column by default** in React Native. This is one of the biggest surprises for web developers.

## 5. Flexbox Layout

React Native uses **Flexbox** for layout (just like CSS, but with `column` as the default direction).

### flex: 1 — Fill Available Space

```tsx
// This View fills the entire screen
<View style={{ flex: 1 }}>
  <View style={{ flex: 1, backgroundColor: 'red' }} />  {/* Takes half */}
  <View style={{ flex: 1, backgroundColor: 'blue' }} />  {/* Takes half */}
</View>
```

Let's see how our home screen uses layout:

```tsx
// src/app/(tabs)/index.tsx
<ThemedView style={styles.container}>      {/* flex: 1 — fills screen */}
  <SafeAreaView style={styles.safeArea}>    {/* flex: 1 — fills safe area */}
    <FlatList ... />                        {/* Takes all space */}
    <Pressable style={styles.fab}>          {/* Absolute positioned FAB */}
      +
    </Pressable>
  </SafeAreaView>
</ThemedView>
```

### Flex Direction

```tsx
// Row layout (horizontal)
<View style={{ flexDirection: 'row', gap: 8 }}>
  <Text>Left</Text>
  <Text>Right</Text>
</View>

// Column layout (vertical) — default in RN
<View style={{ flexDirection: 'column', gap: 8 }}>
  <Text>Top</Text>
  <Text>Bottom</Text>
</View>
```

Our HabitCard uses `flexDirection: 'row'`:

```tsx
// src/components/habit-card.tsx
const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',     // Items side by side
    alignItems: 'center',     // Vertically centered
    padding: Spacing.three,   // 16px padding
    gap: Spacing.two,         // 8px gap between children
  },
});
```

### Common Flexbox Patterns

| Pattern | Code |
|---------|------|
| Center content | `justifyContent: 'center', alignItems: 'center'` |
| Space between | `justifyContent: 'space-between'` |
| Fill remaining space | `flex: 1` |
| Wrap to next line | `flexWrap: 'wrap'` |
| Push to bottom | `marginTop: 'auto'` |

## 6. Pressable — Handling Touch

`Pressable` is the recommended way to handle taps in React Native. It provides feedback based on press state:

```tsx
<Pressable
  onPress={() => console.log('tapped')}
  style={({ pressed }) => [
    styles.button,
    { opacity: pressed ? 0.7 : 1 },  // Visual feedback
  ]}
>
  <Text>Tap me</Text>
</Pressable>
```

Our FAB button uses this pattern:

```tsx
<Pressable
  style={({ pressed }) => [
    styles.fab,
    { backgroundColor: theme.text, opacity: pressed ? 0.7 : 1 },
  ]}
  onPress={() => router.push('/habit/new')}
>
  <SymbolView ... />
</Pressable>
```

## 7. ScrollView — Scrollable Content

`ScrollView` wraps content that needs to scroll. All content is rendered upfront (unlike FlatList which is virtualized).

```tsx
<ScrollView contentContainerStyle={styles.scrollContent}>
  <ThemedView style={styles.header}>...</ThemedView>
  <ThemedView style={styles.statCard}>...</ThemedView>
  <StatsChart data={checkIns} />
</ScrollView>
```

Use `ScrollView` when:
- You have a fixed amount of content (like a detail page)
- Content is small enough that performance isn't a concern

## 8. FlatList — Virtualized List

`FlatList` renders a scrollable list of items, but only renders the visible ones. This is crucial for performance with large lists.

```tsx
<FlatList
  data={habits}  // Array of data
  keyExtractor={(item) => String(item.id)}  // Unique key for each item
  renderItem={({ item }) => (
    <HabitCard habit={item} onToggle={handleToggle} onPress={handlePress} />
  )}
  refreshing={refreshing}
  onRefresh={handleRefresh}
  ListEmptyComponent={
    <ThemedView style={styles.empty}>
      <ThemedText>{t.noHabitsYet}</ThemedText>
    </ThemedView>
  }
/>
```

**Key props explained**:

| Prop | Purpose |
|------|---------|
| `data` | Array of items to render |
| `keyExtractor` | Tells React which item is which (for efficient re-rendering) |
| `renderItem` | Function that returns a component for each item |
| `ListEmptyComponent` | What to show when data is empty |
| `refreshing` / `onRefresh` | Pull-to-refresh support |

### Why FlatList Over map()?

```tsx
// ❌ Bad — renders ALL items, terrible for 1000 items
{habits.map(habit => <HabitCard key={habit.id} habit={habit} />)}

// ✅ Good — FlatList only renders visible items
<FlatList data={habits} renderItem={...} />
```

FlatList uses **windowed rendering** — it only renders items that fit on screen plus a small buffer. As you scroll, it recycles off-screen items and renders new ones. This keeps memory usage low and scrolling smooth even with thousands of items.

## 9. SafeAreaView — Avoiding Notches and Status Bars

Modern phones have notches, status bars, and rounded corners. `SafeAreaView` adds padding to keep your content visible:

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

<SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
  {/* Content will avoid the bottom navigation bar */}
</SafeAreaView>
```

Our screens use `SafeAreaView` to handle the bottom tab bar area:

```tsx
<SafeAreaView style={styles.safeArea} edges={['bottom']}>
```

## 10. Platform-Specific Code

React Native provides the `Platform` API for platform-specific behavior:

```tsx
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  button: {
    ...Platform.select({
      ios: { shadowColor: '#000' },
      android: { elevation: 4 },
    }),
  },
});
```

### Platform-Specific Files

Metro (the bundler) supports platform-specific file extensions:

| File | Used for |
|------|----------|
| `component.tsx` | All platforms |
| `component.ios.tsx` | iOS only |
| `component.android.tsx` | Android only |
| `component.web.tsx` | Web only |

Our project uses this for two files:

- `src/hooks/use-color-scheme.ts` (native) vs `use-color-scheme.web.ts` (web — handles SSR hydration)
- `src/components/animated-icon.tsx` (native) vs `animated-icon.web.tsx` (web)

## Practice Reading Our Components

Look at `src/components/stats-chart.tsx`. Can you identify:

1. Which RN components are used?
2. How does it handle the empty state?
3. What style prop makes the bars align to the bottom?

```tsx
export function StatsChart({ data }: Props) {
  if (data.length === 0) {
    return <ThemedText>No check-ins yet</ThemedText>;
  }
  return (
    <ThemedView style={styles.container}>
      {data.map((item) => {
        const height = (item.count / maxCount) * 100;
        return (
          <View key={item.date} style={styles.barWrapper}>
            <ThemedText>{item.count}</ThemedText>
            <View style={[styles.bar, { height, backgroundColor: theme.text }]} />
            <ThemedText>{item.date.slice(5)}</ThemedText>
          </View>
        );
      })}
    </ThemedView>
  );
}
```

**Answers**:
1. `ThemedView`, `View`, `ThemedText` (wrapping RN's `View` and `Text`)
2. Returns early with a "No check-ins yet" message when `data.length === 0`
3. `alignItems: 'center'` on `barWrapper` centers the bars, and `flex-end` alignment isn't needed because bars start from 0 height

## Next Tutorial

Proceed to **Tutorial 04: Expo Router** — understanding file-based navigation in our app.
