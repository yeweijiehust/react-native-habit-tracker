# 07: Custom Hooks — Encapsulating Data Logic

Our database queries are spread across multiple screens. Instead of duplicating SQL in every component, we extract the logic into **custom hooks**.

## Prerequisites

- Tutorial 02: React Foundations (useState, useCallback)
- Tutorial 06: SQLite (database queries)

## What You'll Learn

- What custom hooks are and why they matter
- The useHabits and useCheckIns hooks
- Encapsulating database access with useCallback
- Composing hooks in screens
- Reactive data loading with useFocusEffect

---

## 1. What is a Custom Hook?

A **custom hook** is a JavaScript function whose name starts with `use` and that calls other hooks. It's a way to **extract component logic into reusable functions**.

Think of it like this:

- **Without custom hooks**: SQL code lives inside components, duplicated across screens
- **With custom hooks**: SQL code lives in hooks, components just call `loadHabits()`

### The Problem We're Solving

Without custom hooks, our home screen would look like this:

```tsx
// ❌ Duplicated SQL everywhere
export default function HabitsScreen() {
  const db = useSQLiteContext();
  const [habits, setHabits] = useState([]);

  const load = async () => {
    const data = await db.getAllAsync(`
      SELECT h.*, CASE WHEN c.id IS NOT NULL THEN 1 ELSE 0 END as checked_today
      FROM habits h
      LEFT JOIN check_ins c ON c.habit_id = h.id AND c.date = ?
      ORDER BY checked_today ASC, h.created_at DESC
    `, today());
    setHabits(data);
  };

  // ...
}
```

Now imagine the detail screen also needs to query habits — you'd copy the SQL there too. If the query changes, you'd have to update it in multiple places.

### The Solution

```tsx
// ✅ Logic is in the hook, components just call it
export default function HabitsScreen() {
  const { loadHabitsWithStatus } = useHabits();
  const [habits, setHabits] = useState([]);

  const refresh = useCallback(async () => {
    const data = await loadHabitsWithStatus();
    setHabits(data);
  }, [loadHabitsWithStatus]);
  // ...
}
```

## 2. The useHabits Hook

Located at `src/hooks/use-habits.ts`:

```tsx
import { useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { today } from '@/lib/date';

export type Habit = {
  id: number;
  name: string;
  emoji: string;
  created_at: string;
};

export type HabitWithStatus = Habit & {
  checked_today: number;
};

export function useHabits() {
  const db = useSQLiteContext();               // Access the database

  const loadHabits = useCallback(async () => {
    return db.getAllAsync<Habit>(
      'SELECT * FROM habits ORDER BY created_at DESC'
    );
  }, [db]);

  const loadHabitsWithStatus = useCallback(async () => {
    const todayStr = today();
    return db.getAllAsync<HabitWithStatus>(`
      SELECT h.*,
        CASE WHEN c.id IS NOT NULL THEN 1 ELSE 0 END as checked_today
      FROM habits h
      LEFT JOIN check_ins c ON c.habit_id = h.id AND c.date = ?
      ORDER BY checked_today ASC, h.created_at DESC
    `, todayStr);
  }, [db]);

  const createHabit = useCallback(async (name: string, emoji: string) => {
    const result = await db.runAsync(
      'INSERT INTO habits (name, emoji) VALUES (?, ?)',
      name,
      emoji
    );
    return result.lastInsertRowId;
  }, [db]);

  const deleteHabit = useCallback(async (id: number) => {
    await db.runAsync('DELETE FROM check_ins WHERE habit_id = ?', id);
    await db.runAsync('DELETE FROM habits WHERE id = ?', id);
  }, [db]);

  return { loadHabits, loadHabitsWithStatus, createHabit, deleteHabit };
}
```

### Why useCallback?

Every function is wrapped in `useCallback(deps: [db])`. This is crucial because:

1. **Stable references** — without `useCallback`, every render creates new function instances
2. **Effect dependencies** — if another hook's `useEffect`/`useCallback` depends on `loadHabits`, without `useCallback` it would infinitely re-run
3. **Performance** — child components that receive these functions as props won't re-render unnecessarily

```tsx
// Without useCallback:
// Every time HabitsScreen renders, a NEW loadHabits function is created
const loadHabits = async () => { ... };

// With useCallback:
// The SAME loadHabits function is used, unless [db] changes
const loadHabits = useCallback(async () => { ... }, [db]);
```

### Why Return Functions Instead of Data?

The hook returns **functions**, not data. Each screen calls these functions in `useFocusEffect` or event handlers and stores the results in local state.

```tsx
// The hook provides the tools
const { loadHabitsWithStatus, createHabit } = useHabits();

// The screen manages the data
const [habits, setHabits] = useState<HabitWithStatus[]>([]);

useFocusEffect(useCallback(() => {
  loadHabitsWithStatus().then(setHabits);
}, [loadHabitsWithStatus]));
```

This separation of concerns (hook = data access, screen = data management) makes both easier to test and reason about.

## 3. The useCheckIns Hook

Located at `src/hooks/use-check-ins.ts`:

```tsx
export function useCheckIns() {
  const db = useSQLiteContext();

  const toggleCheckIn = useCallback(
    async (habitId: number): Promise<boolean> => {
      const todayStr = today();
      const existing = await db.getFirstAsync<CheckIn>(
        'SELECT * FROM check_ins WHERE habit_id = ? AND date = ?',
        habitId,
        todayStr
      );
      if (existing) {
        await db.runAsync('DELETE FROM check_ins WHERE id = ?', existing.id);
        return false;  // Now unchecked
      }
      await db.runAsync(
        'INSERT INTO check_ins (habit_id, date) VALUES (?, ?)',
        habitId,
        todayStr
      );
      return true;  // Now checked
    },
    [db]
  );

  const getCheckInCount = useCallback(async (habitId: number) => {
    const row = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM check_ins WHERE habit_id = ?',
      habitId
    );
    return row?.count ?? 0;
  }, [db]);

  const getCheckInsGrouped = useCallback(async (habitId: number) => {
    return db.getAllAsync<CheckInCount>(
      `SELECT date, COUNT(*) as count
       FROM check_ins
       WHERE habit_id = ?
       GROUP BY date
       ORDER BY date DESC`,
      habitId
    );
  }, [db]);

  return { toggleCheckIn, getCheckInCount, getCheckInsGrouped };
}
```

### The Return Type Pattern

`toggleCheckIn` returns `Promise<boolean>` — it tells the caller whether the habit is now checked or unchecked. This is useful for the UI:

```tsx
const handleToggle = async (habitId: number) => {
  const isChecked = await toggleCheckIn(habitId);
  console.log(isChecked ? 'Checked!' : 'Unchecked!');
  await refresh(); // Reload the list
};
```

## 4. Separating Hook from State

Look at how the habits screen **composes** both hooks:

```tsx
export default function HabitsScreen() {
  const { loadHabitsWithStatus } = useHabits();        // Data operations
  const { toggleCheckIn } = useCheckIns();              // Data operations
  const [habits, setHabits] = useState<HabitWithStatus[]>([]);  // Local state
  const [refreshing, setRefreshing] = useState(false);          // UI state

  const refresh = useCallback(async () => {
    const data = await loadHabitsWithStatus();
    setHabits(data);
  }, [loadHabitsWithStatus]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleToggle = useCallback(async (habitId: number) => {
    await toggleCheckIn(habitId);
    await refresh();
  }, [toggleCheckIn, refresh]);

  // ...
}
```

**What each piece does**:

| Piece | Role | Type |
|-------|------|------|
| `useHabits()` | Provides habits data access | Custom hook |
| `useCheckIns()` | Provides check-in data access | Custom hook |
| `useState<HabitWithStatus[]>([])` | Holds the loaded data in memory | Built-in hook |
| `useFocusEffect` | Triggers reload on screen focus | Expo Router hook |
| `refresh` | Orchestrates loading and setting state | Composed callback |
| `handleToggle` | Orchestrates toggle and reload | Event handler |

This **composition** is React's primary code organization pattern. Small, focused hooks are combined in screens to create complex behaviors.

## 5. The useTheme Hook — A Simpler Pattern

Not all custom hooks need database access. `useTheme` is a simpler example:

```tsx
// src/hooks/use-theme.ts
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  const scheme = useColorScheme();
  const theme = scheme === 'unspecified' ? 'light' : scheme;
  return Colors[theme];  // Returns the Colors object directly
}
```

Usage:

```tsx
function MyComponent() {
  const theme = useTheme();
  return (
    <View style={{ backgroundColor: theme.background }}>
      <Text style={{ color: theme.text }}>Hello</Text>
    </View>
  );
}
```

This is even simpler — no callbacks, no async — it just returns data. The hook **encapsulates the logic** of resolving theme based on color scheme.

## 6. Custom Hook Rules

1. **Name starts with `use`** — Required by React's hooks convention
2. **Calls other hooks** — If it doesn't call any hooks, it's just a regular function
3. **Same rules as built-in hooks** — Can't be called conditionally or in loops

### What Goes in a Custom Hook

✅ Database operations
✅ Theme/configuration access
✅ Event subscriptions
✅ Form logic
✅ Animation helpers

❌ Plain utility functions (use a regular function, e.g., `formatDate()` in `src/lib/date.ts`)
❌ JSX (that's a component, not a hook)

## Practice

Look at the `useCheckIns` hook and trace the flow when a user taps the check button on a habit card:

1. What hook is called on the habits screen?
2. What does `toggleCheckIn` return?
3. What happens after `toggleCheckIn` completes?

**Answers**:
1. `handleToggle` in `(tabs)/index.tsx` calls `toggleCheckIn(habitId)`
2. `toggleCheckIn` returns `true` (now checked) or `false` (now unchecked)
3. `refresh()` is called, which calls `loadHabitsWithStatus()` again, fetching updated data from the database

## Next Tutorial

Proceed to **Tutorial 08: Internationalization** — adding Chinese/English language support with React Context.
