# 02: React Foundations

Before diving into React Native, you need to understand React. This tutorial covers the essential React concepts used throughout our Habit Tracker app.

## Prerequisites

- Tutorial 01: Understanding what Expo is
- Basic JavaScript knowledge (variables, functions, arrow functions, objects, arrays)

## What You'll Learn

- Components and JSX
- Props (passing data to components)
- State with `useState`
- Side effects with `useEffect`
- Memoization with `useCallback`
- Why React is used for UI development

---

## 1. What is React?

React is a **UI library** — it helps you build user interfaces by composing small, reusable pieces called **components**.

Think of it like building with LEGO bricks. Each brick (component) is small and focused. You combine bricks to build bigger structures (screens), and ultimately the whole app.

### The Core Idea

```jsx
// Instead of writing:
document.getElementById('root').innerHTML = '<h1>Hello</h1>';

// React lets you write:
function Greeting() {
  return <h1>Hello</h1>;
}
```

Components are **declarative** — you describe what the UI should look like given the current data, and React figures out how to update the DOM efficiently.

## 2. JSX — JavaScript + XML

JSX looks like HTML but is actually JavaScript. It's a syntax extension that gets compiled into `React.createElement()` calls.

```jsx
// JSX (what you write):
const element = <Text style={{ color: 'red' }}>Hello</Text>;

// Compiled JavaScript (what runs):
const element = React.createElement(Text, { style: { color: 'red' } }, 'Hello');
```

### JSX Rules

1. **Single root element** — every component must return one parent element
   ```jsx
   // ❌ Wrong
   return (
     <Text>One</Text>
     <Text>Two</Text>
   );

   // ✅ Correct (wrapped in a View)
   return (
     <View>
       <Text>One</Text>
       <Text>Two</Text>
     </View>
   );
   ```

2. **JavaScript expressions in `{}`** — use curly braces to embed JavaScript
   ```jsx
   const name = 'Alice';
   return <Text>Hello, {name.toUpperCase()}</Text>;
   ```

3. **Props use camelCase** — `backgroundColor` not `background-color`
   ```jsx
   <View style={{ backgroundColor: '#fff' }}>
   ```

## 3. Components

A **component** is a function that returns UI elements. In our project, every `.tsx` file exports a component.

### Our First Component

```tsx
// components/greeting.tsx
import { Text, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';

type GreetingProps = {
  name: string;
};

export function Greeting({ name }: GreetingProps) {
  return (
    <View>
      <ThemedText>Hello, {name}!</ThemedText>
    </View>
  );
}
```

Look at this in our actual project — `src/components/habit-card.tsx`:

```tsx
type Props = {
  habit: HabitWithStatus;
  onToggle: (habitId: number) => void;
  onPress: (habit: HabitWithStatus) => void;
};

export function HabitCard({ habit, onToggle, onPress }: Props) {
  return (
    <Pressable onPress={() => onPress(habit)}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText style={styles.emoji}>{habit.emoji || '📋'}</ThemedText>
        <ThemedText style={styles.name}>{habit.name}</ThemedText>
        <CheckButton checked={!!habit.checked_today} onPress={() => onToggle(habit.id)} />
      </ThemedView>
    </Pressable>
  );
}
```

**Key points**:
- The component receives `Props` via destructuring
- It returns JSX that describes the UI
- It uses other components (`Pressable`, `ThemedView`, `ThemedText`, `CheckButton`) — this is **composition**
- The component is **pure** — given the same props, it always renders the same output

## 4. Props

**Props** are the inputs to a component — like function arguments. They're passed from parent to child.

```tsx
// Parent passes props
<HabitCard
  habit={myHabit}
  onToggle={handleToggle}
  onPress={handlePress}
/>

// Child receives props
export function HabitCard({ habit, onToggle, onPress }: Props) {
  // Use props here
}
```

Props are **read-only** — a component should never modify its props.

## 5. State with useState

**State** is data that changes over time. When state changes, React re-renders the component to reflect the new data.

```tsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <View>
      <ThemedText>Count: {count}</ThemedText>
      <Pressable onPress={() => setCount(count + 1)}>
        <ThemedText>Increment</ThemedText>
      </Pressable>
    </View>
  );
}
```

Let's see how state is used in our Habits screen (`src/app/(tabs)/index.tsx`):

```tsx
export default function HabitsScreen() {
  const [habits, setHabits] = useState<HabitWithStatus[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  // ...
}
```

The `habits` state starts as an empty array `[]`. When `loadHabitsWithStatus()` returns data, we call `setHabits(data)`, which triggers a re-render with the new list.

### Why useState Instead of a Variable?

```tsx
// ❌ This won't work — changing a variable doesn't trigger re-render
let habits = [];
habits = await loadData();

// ✅ This works — setState triggers re-render
const [habits, setHabits] = useState([]);
setHabits(await loadData());
```

React doesn't "watch" regular variables. Only `useState` tells React, "hey, this component needs to update because its data changed."

## 6. Effects with useEffect

**useEffect** lets you perform side effects — things that happen outside the normal rendering flow, like fetching data from a database.

```tsx
import { useEffect, useState } from 'react';

function MyComponent() {
  const [data, setData] = useState([]);

  useEffect(() => {
    // This runs after the component first renders
    fetchData().then(setData);
  }, []); // Empty array = run once on mount
}
```

**The dependency array** `[]` controls when the effect runs:

| Dependency | Behavior |
|-----------|----------|
| `[]` | Runs once after the first render (on mount) |
| `[count]` | Runs on mount AND whenever `count` changes |
| no array | Runs after EVERY render |

### The Problem with useEffect for Navigation

In our app, we originally used `useEffect` to load habits:

```tsx
// src/app/(tabs)/index.tsx (original code)
useEffect(() => {
  refresh();
}, [refresh]); // Runs once on mount
```

But this only runs when the component **mounts** (first appears). When the user navigates to `habit/new`, creates a habit, and navigates back, the Habits screen component is **already mounted** — so `useEffect` doesn't run again.

The fix was to use `useFocusEffect` instead (from Tutorial 04), which runs every time the screen gains focus:

```tsx
import { useFocusEffect } from 'expo-router';

useFocusEffect(
  useCallback(() => {
    refresh(); // Runs every time this screen is focused
  }, [refresh])
);
```

## 7. Memoization with useCallback

**useCallback** prevents functions from being recreated on every render. This is important for performance and for preventing infinite loops in effects.

```tsx
// Without useCallback — new function every time
const handlePress = () => {
  doSomething();
};

// With useCallback — same function reference until deps change
const handlePress = useCallback(() => {
  doSomething();
}, [doSomething]); // Only recreates if doSomething changes
```

In our hooks, every function is wrapped in `useCallback`:

```tsx
// src/hooks/use-habits.ts
const loadHabits = useCallback(async () => {
  return db.getAllAsync<Habit>(
    'SELECT * FROM habits ORDER BY created_at DESC'
  );
}, [db]); // Only changes if 'db' reference changes
```

### Why Bother?

Without `useCallback`:
1. Every render creates new function instances
2. Child components that receive these functions as props will re-render unnecessarily
3. If the function is in a `useEffect` dependency array, it causes infinite loops

## 8. TypeScript in Our Components

Our project uses **TypeScript** for type safety. The key patterns you'll see:

### Type Annotations for Props

```tsx
type HabitCardProps = {
  habit: HabitWithStatus;
  onToggle: (habitId: number) => void;
  onPress: (habit: HabitWithStatus) => void;
};

export function HabitCard({ habit, onToggle, onPress }: HabitCardProps) {
```

### Type Annotations for State

```tsx
const [habits, setHabits] = useState<HabitWithStatus[]>([]);
// habits is typed as HabitWithStatus[]
// setHabits only accepts HabitWithStatus[]
```

### Generic SQL Queries

```tsx
const row = await db.getFirstAsync<{ count: number }>(
  'SELECT COUNT(*) as count FROM check_ins WHERE habit_id = ?',
  habitId
);
// row is typed as { count: number } | null
```

TypeScript helps catch errors at compile time rather than runtime — for example, you can't accidentally pass a string where a number is expected.

## Practice: Reading Our Code

Look at `src/components/check-button.tsx` — can you identify:

1. The component's **props**?
2. Which **hook** does it use?
3. Where does **state** live? (Is there any?)

```tsx
export function CheckButton({ checked, onPress }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: checked ? '#34C759' : theme.backgroundSelected,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <ThemedText style={[styles.label, checked && styles.checkedLabel]}>
        {checked ? '✓' : '○'}
      </ThemedText>
    </Pressable>
  );
}
```

**Answers**:
1. Props: `checked: boolean`, `onPress: () => void`
2. Hook: `useTheme()` — gets current theme colors
3. No state — this is a **pure** component that only depends on props

## Next Tutorial

Proceed to **Tutorial 03: React Native Basics** — learning the mobile-specific components and layout system.
