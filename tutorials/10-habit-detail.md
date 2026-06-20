# 10: Building the Detail Screen

The detail screen shows a habit's statistics — total check-in count, daily breakdown, and a bar chart visualization. It also provides the delete action.

## Prerequisites

- Tutorial 04: Expo Router (dynamic routes, useLocalSearchParams)
- Tutorial 06: SQLite (GROUP BY queries)
- Tutorial 09: Building the Habit List Screen

## What You'll Learn

- Dynamic route parameters with useLocalSearchParams
- Loading data for a specific item
- Building a custom bar chart component
- The delete and navigate back pattern

---

## 1. The Dynamic Route

The file `src/app/habit/[id].tsx` creates a dynamic route. The `[id]` in the filename captures the URL segment.

```
/habit/3  →  id = "3"
/habit/42 →  id = "42"
```

We access the parameter with:

```tsx
import { useLocalSearchParams } from 'expo-router';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const habitId = Number(id);
  // ...
}
```

### Type Safety

The generic `useLocalSearchParams<{ id: string }>()` tells TypeScript the shape of the params object. Without it, `id` would be typed as `string | string[]`.

### Navigation to This Screen

From the habits list, tapping a card calls:

```tsx
router.push(`/habit/${habit.id}`);
```

The `habit.id` is a number (from SQLite's autoincrement). When inserted into the URL, it becomes a string, and `useLocalSearchParams` returns it as a string. We convert with `Number(id)`.

## 2. Loading Data

```tsx
const load = useCallback(async () => {
  const habits = await loadHabits();
  const h = habits.find((h: Habit) => h.id === habitId);
  setHabit(h ?? null);

  const count = await getCheckInCount(habitId);
  setTotalCount(count);

  const grouped = await getCheckInsGrouped(habitId);
  setCheckIns(grouped);
}, [habitId, loadHabits, getCheckInCount, getCheckInsGrouped]);

useEffect(() => {
  load();
}, [load]);
```

### Why useEffect Instead of useFocusEffect?

The detail screen uses `useEffect` (not `useFocusEffect`) because:

- The user navigates to `/habit/5` — the screen mounts and loads data
- The user navigates back to the list — the detail screen unmounts
- There's no "coming back to detail" scenario that requires a reload (unlike the habits list, where coming back from new-habit must refresh)

For master-detail flows, `useEffect` on mount is usually sufficient.

### Loading from an Array vs Direct Query

```tsx
// Current: load ALL habits, then find one
const habits = await loadHabits();
const h = habits.find((h: Habit) => h.id === habitId);

// Alternative: query by ID directly
const h = await db.getFirstAsync<Habit>(
  'SELECT * FROM habits WHERE id = ?', habitId
);
```

The current approach is simpler but loads all habits. For a production app with many habits, a direct query would be more efficient. For this learning project, loading all habits is fine.

## 3. The Header Section

```tsx
<ThemedView style={styles.header}>
  <ThemedText style={styles.emoji}>{habit.emoji || '📋'}</ThemedText>
  <ThemedText type="title" style={styles.name}>
    {habit.name}
  </ThemedText>
</ThemedView>
```

The header centers the emoji (64px) and habit name (title typography). This gives the user a clear visual of which habit they're viewing.

## 4. The Statistics Card

```tsx
<ThemedView type="backgroundElement" style={styles.statCard}>
  <ThemedText style={styles.statNumber}>{totalCount}</ThemedText>
  <ThemedText themeColor="textSecondary">{t.totalCheckIns}</ThemedText>
</ThemedView>
```

A simple card showing:
- Large number (48px, bold) — the total check-in count
- Label below — "Total Check-ins" (or "总打卡次数")

The card uses `backgroundElement` for subtle visual separation from the main background.

## 5. The Bar Chart Component

`StatsChart` receives `CheckInCount[]` and renders a simple bar chart:

```tsx
export function StatsChart({ data }: Props) {
  if (data.length === 0) {
    return <ThemedView style={styles.empty}>
      <ThemedText themeColor="textSecondary">{t.noCheckInsYet}</ThemedText>
    </ThemedView>;
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <ThemedView style={styles.container}>
      {data.map((item) => {
        const height = (item.count / maxCount) * 100;
        return (
          <View key={item.date} style={styles.barWrapper}>
            <ThemedText style={styles.count}>{item.count}</ThemedText>
            <View style={[styles.bar, {
              height: Math.max(height, 4),
              backgroundColor: theme.text,
            }]} />
            <ThemedText style={styles.date}>{item.date.slice(5)}</ThemedText>
          </View>
        );
      })}
    </ThemedView>
  );
}
```

### How the Bar Chart Works

| Step | Calculation | Example |
|------|------------|---------|
| 1. Find max count | `Math.max(...data.map(d => d.count))` | If data has counts [3, 5, 2], max is 5 |
| 2. Calculate relative height | `item.count / maxCount * 100` | For count=3: `3/5 * 100 = 60px` |
| 3. Ensure minimum height | `Math.max(height, 4)` | Ensures even count=1 is visible |
| 4. Apply color | `theme.text` | Bars use the text color, matching the theme |

The chart is horizontally scrollable (if many dates exist). Each bar shows:
- The count number above
- The colored bar
- The date (MM-DD format) below

This is a **minimalist chart** — no libraries, no canvas, just views. It's enough for our use case and demonstrates how custom visualizations can be built with basic components.

### The Wait, Why scroll?

```tsx
container: {
  overflow: 'scroll',  // Allows horizontal scrolling if bars overflow
  flexDirection: 'row', // Bars arranged horizontally
}
```

This container is NOT using `overflow: 'scroll'` — actually, for React Native, you'd need to wrap it in a `ScrollView` with horizontal scrolling. Our current code just uses `overflow: 'scroll'` which in React Native is only supported on iOS. For a production solution, the chart should use a `ScrollView horizontal`.

## 6. The Delete Button

```tsx
const handleDelete = async () => {
  await deleteHabit(habitId);
  router.back();
};

// ...
<Pressable
  onPress={handleDelete}
  style={({ pressed }) => [styles.deleteButton, { opacity: pressed ? 0.7 : 1 }]}
>
  <ThemedText style={styles.deleteText}>{t.delete}</ThemedText>
</Pressable>
```

The delete button:
1. Calls `deleteHabit(habitId)` which deletes the habit and its check-ins from SQLite
2. Calls `router.back()` to return to the habits list
3. The habits list's `useFocusEffect` fires, reloading the data — the deleted habit is gone

### Why No Confirmation Dialog?

In a production app, you'd typically add an `Alert.alert()` confirmation:

```tsx
import { Alert } from 'react-native';

const handleDelete = () => {
  Alert.alert(
    t.confirmDelete,          // "Delete this habit?"
    undefined,
    [
      { text: t.cancel, style: 'cancel' },
      { text: t.delete, style: 'destructive', onPress: async () => {
        await deleteHabit(habitId);
        router.back();
      }},
    ]
  );
};
```

We could add this as an enhancement.

## 7. The Null Guard

```tsx
if (!habit) return null;
```

This is a **loading guard** — the habit data hasn't loaded yet (from the async `load()` call), so we return `null` (render nothing) instead of crashing with a "cannot access property of null" error.

When the async query completes, `setHabit(h)` triggers a re-render, and this time `habit` is an object, so the full UI renders.

## 8. Complete Screen Flow

```
User taps habit card on home screen
        │
        ▼
router.push('/habit/5')
        │
        ▼
HabitDetailScreen mounts
        │
        ├── habitId = 5 (from URL)
        ├── useEffect fires → load()
        │
        ▼
UI renders (null guard)     ───┐
        │                       │ useEffect completes
        ▼                       ▼
setHabit(h), setTotalCount(), setCheckIns()
        │
        ▼
UI re-renders with data
  ├── Emoji + Name header
  ├── Total count card
  ├── Bar chart
  └── Delete button
```

## Practice

Look at `src/app/habit/[id].tsx` and `src/components/stats-chart.tsx`:

1. What type does `useLocalSearchParams` return?
2. Why does the screen use `useEffect` instead of `useFocusEffect`?
3. How does the bar chart determine the height of each bar?
4. What happens after the user presses delete?

**Answers**:
1. `{ id: string }` — the route parameter typed as a string
2. Because the detail screen is a push-navigation screen — when the user leaves, it unmounts. There's no "come back to detail" scenario that needs a refetch
3. `(item.count / maxCount) * 100` — proportional to the maximum count, with a minimum of 4px
4. `deleteHabit(habitId)` removes the habit and check-ins from SQLite, then `router.back()` navigates to the habits list, which refetches via `useFocusEffect`

## Next Tutorial

Proceed to **Tutorial 11: Production Builds & Android Studio** — generating APKs and using native tools.
