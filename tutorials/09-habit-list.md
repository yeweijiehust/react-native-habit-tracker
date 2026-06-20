# 09: Building the Habit List Screen

The home screen is the heart of our app. It displays all habits, shows today's check-in status, and provides actions to add new habits or toggle check-ins.

## Prerequisites

- Tutorial 03: React Native Basics (FlatList, Pressable, StyleSheet)
- Tutorial 04: Expo Router (useFocusEffect, router.push)
- Tutorial 06: SQLite (queries for loadHabitsWithStatus)
- Tutorial 07: Custom Hooks (useHabits, useCheckIns)

## What You'll Learn

- Screen composition — combining hooks and components
- The useFocusEffect pattern for data loading
- The FlatList with pull-to-refresh
- FAB (Floating Action Button) pattern
- State management for lists

---

## 1. The Screen Architecture

Let's trace the complete data flow for the habits list screen (`src/app/(tabs)/index.tsx`):

```
Screen Focused (user navigates here / switches tabs / comes back)
        │
        ▼
useFocusEffect fires
        │
        ▼
refresh() calls loadHabitsWithStatus()
        │
        ▼
SQLite executes: SELECT h.*, CASE WHEN c.id IS NOT NULL THEN 1 ELSE 0 END as checked_today
                 FROM habits h LEFT JOIN check_ins c ON ...
                 ORDER BY checked_today ASC, h.created_at DESC
        │
        ▼
Returns HabitWithStatus[]  (e.g., [{id:1, name:"Drink water", checked_today:0}, ...])
        │
        ▼
setHabits(data) triggers re-render
        │
        ▼
FlatList renders HabitCard for each item
```

## 2. The Complete Component

```tsx
export default function HabitsScreen() {
  // Hooks
  const theme = useTheme();
  const { t } = useI18n();
  const { loadHabitsWithStatus } = useHabits();
  const { toggleCheckIn } = useCheckIns();

  // State
  const [habits, setHabits] = useState<HabitWithStatus[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Data loading
  const refresh = useCallback(async () => {
    const data = await loadHabitsWithStatus();
    setHabits(data);
  }, [loadHabitsWithStatus]);

  // Reload when screen is focused
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  // Pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Toggle check-in
  const handleToggle = useCallback(
    async (habitId: number) => {
      await toggleCheckIn(habitId);
      await refresh();  // Reload list after toggling
    },
    [toggleCheckIn, refresh]
  );

  // Navigate to detail
  const handlePress = useCallback((habit: HabitWithStatus) => {
    router.push(`/habit/${habit.id}`);
  }, []);

  // Render
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <FlatList ... />
        <Pressable style={styles.fab} onPress={() => router.push('/habit/new')}>
          <SymbolView ... />
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}
```

### Deconstructing the Pattern

**Hook inversion**: The screen doesn't call hooks inside the render function or effects directly. Instead, it:

1. Creates callbacks (`refresh`, `handleToggle`, `handlePress`) with `useCallback`
2. Passes them to effects (`useFocusEffect`) and child components (`HabitCard`)
3. The callbacks orchestrate multiple hooks together (e.g., `handleToggle` calls both `toggleCheckIn` AND `refresh`)

This pattern keeps the component tree clean and makes data flow explicit.

## 3. The FlatList Component

```tsx
<FlatList
  data={habits}
  keyExtractor={(item) => String(item.id)}
  refreshing={refreshing}
  onRefresh={handleRefresh}
  contentContainerStyle={[styles.list, { paddingBottom: BottomTabInset + Spacing.three }]}
  ListEmptyComponent={
    <ThemedView style={styles.empty}>
      <ThemedText themeColor="textSecondary">{t.noHabitsYet}</ThemedText>
    </ThemedView>
  }
  renderItem={({ item }) => (
    <HabitCard
      habit={item}
      onToggle={handleToggle}
      onPress={handlePress}
    />
  )}
/>
```

### What Each Prop Does

| Prop | Purpose |
|------|---------|
| `data` | The array of habits to display |
| `keyExtractor` | Returns a unique identifier for each item (habit.id as string) — this lets React track which items changed, added, or removed |
| `refreshing` | Shows/hides the pull-to-refresh spinner |
| `onRefresh` | Called when the user pulls down — triggers handleRefresh |
| `contentContainerStyle` | Styles applied to the inner scroll container (not the FlatList itself) |
| `ListEmptyComponent` | Rendered when `data` is an empty array |
| `renderItem` | Called for each item in `data`, returns a React element |

### Why keyExtractor Matters

When you add, remove, or reorder items in a list, React needs to know which items are which. Without `keyExtractor`:

```tsx
// Initial list: [HabitA, HabitB]
// After insert: [HabitA, HabitC, HabitB]  ← HabitC inserted at index 1

// Without keys: React re-renders ALL items because it only tracks by index
// With keys (id): React only inserts HabitC, HabitA and HabitB are untouched
```

This is critical for performance with large lists and for maintaining scroll position.

## 4. The FAB (Floating Action Button)

```tsx
<Pressable
  style={({ pressed }) => [
    styles.fab,
    { backgroundColor: theme.text, opacity: pressed ? 0.7 : 1 },
  ]}
  onPress={() => router.push('/habit/new')}
>
  <SymbolView
    tintColor={theme.background}
    name={{ ios: 'plus', android: 'add', web: 'add' }}
    size={24}
  />
</Pressable>
```

The FAB is **absolutely positioned**:

```tsx
fab: {
  position: 'absolute',
  right: Spacing.four,           // 24px from right edge
  bottom: Spacing.four + BottomTabInset,  // Above the tab bar
  width: 56,
  height: 56,
  borderRadius: 28,              // Perfect circle
  elevation: 4,                  // Android shadow
  shadowColor: '#000',           // iOS shadow
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
}
```

It sits above the FlatList (positioned in the safe area). The `BottomTabInset` ensures it doesn't overlap with the tab bar.

## 5. The Sorting Logic

The key behavior is "unchecked habits first." This is handled entirely in SQL:

```sql
ORDER BY checked_today ASC, h.created_at DESC
```

- `checked_today ASC` — 0 (unchecked) comes before 1 (checked)
- `h.created_at DESC` — among unchecked habits, newest first

### What if There are 50 Habits?

FlatList handles this efficiently. It only renders ~10 items (whatever fits on screen). As the user scrolls down, it recycles off-screen items and renders new ones. The SQL query with ORDER BY is fast even with thousands of habits because SQLite uses indexes.

## 6. The Empty State

When there are no habits, the user sees:

```tsx
ListEmptyComponent={
  <ThemedView style={styles.empty}>
    <ThemedText themeColor="textSecondary">
      {t.noHabitsYet}  // "No habits yet. Tap + to add one."
    </ThemedText>
  </ThemedView>
}
```

This is a built-in FlatList feature — when `data.length === 0`, render this component instead of nothing.

## Complete File Structure

```
src/app/(tabs)/index.tsx
├── Imports
│   ├── React hooks (useCallback, useState)
│   ├── RN components (FlatList, Pressable)
│   ├── Expo Router (router, useFocusEffect)
│   ├── Our components (ThemedText, ThemedView, HabitCard)
│   ├── Constants (BottomTabInset, MaxContentWidth, Spacing)
│   └── Hooks (useTheme, useHabits, useCheckIns, useI18n)
├── HabitsScreen component
│   ├── Hooks setup
│   ├── State initialization
│   ├── Callbacks (refresh, handleRefresh, handleToggle, handlePress)
│   ├── Effects (useFocusEffect)
│   └── JSX (FlatList + FAB)
└── Styles (StyleSheet.create)
```

## Practice

1. What happens if `loadHabitsWithStatus()` throws an error?
2. Why is `handleRefresh` wrapped in `useCallback`?
3. What would happen if we removed the `useCallback` from `refresh`?

**Answers**:
1. Currently, nothing graceful — the error would bubble up to the nearest error boundary. In a production app, you'd add try/catch and show an error message
2. To maintain a stable reference — without it, `useFocusEffect` and `onRefresh` would get new function instances on every render
3. `useFocusEffect` depends on `[refresh]`, and `handleToggle` depends on `[toggleCheckIn, refresh]`. Without `useCallback`, these would trigger on every render, potentially causing an infinite loop

## Next Tutorial

Proceed to **Tutorial 10: Building the Detail Screen** — statistics, charts, and deleting habits.
