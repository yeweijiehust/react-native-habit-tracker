# 06: Local Storage with expo-sqlite

All data in our Habit Tracker (habits, check-ins, language preference) is stored locally using SQLite — a lightweight, embedded database that runs directly on the device.

## Prerequisites

- Tutorial 03: React Native Basics
- Tutorial 04: Expo Router (understanding context providers)
- Basic SQL knowledge: `SELECT`, `INSERT`, `CREATE TABLE`, `WHERE`

## What You'll Learn

- What SQLite is and why it's used for local storage
- Setting up expo-sqlite in an Expo app
- Designing a database schema
- CRUD operations with async SQL
- Using useSQLiteContext for database access
- Foreign keys and JOINs in our queries

---

## 1. What is SQLite?

**SQLite** is a C library that provides a full SQL database engine — but instead of running as a separate server (like PostgreSQL or MySQL), it reads and writes directly to a file on disk.

```
┌─────────────────────────────────────┐
│          PostgreSQL / MySQL          │
│                                     │
│  App ──network──► Server ──► Disk   │  ← Needs a server process
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│              SQLite                  │
│                                     │
│  App ────────────────► File on Disk │  ← No server, no network
└─────────────────────────────────────┘
```

### Why SQLite for Mobile

| Approach | Pros | Cons |
|----------|------|------|
| **SQLite** | Fast, ACID-compliant, supports complex queries, no server | Requires SQL knowledge |
| **AsyncStorage** | Simple key-value API | Slow for large data, no queries |
| **FileSystem (JSON)** | Simple to implement | Must load/parse whole file, no queries |

For a Habit Tracker, we need:
- **Queries**: "Which habits are NOT checked today?" — this requires a JOIN
- **Aggregation**: "How many check-ins per day?" — this requires GROUP BY
- **Relationships**: habits ↔ check_ins — this is a foreign key relationship

SQLite handles all of this natively. AsyncStorage or JSON files would require us to implement querying logic ourselves.

## 2. Setting Up expo-sqlite

### Installation

```bash
bun add expo-sqlite
```

### The SQLiteProvider

In `src/contexts/database.tsx`, we wrap our app in Expo's `SQLiteProvider`:

```tsx
import { SQLiteProvider } from 'expo-sqlite';
import { initDatabase } from '@/db/schema';

export function DatabaseProvider({ children }: { children: ReactNode }) {
  return (
    <SQLiteProvider databaseName="habits.db" onInit={initDatabase}>
      {children}
    </SQLiteProvider>
  );
}
```

**What this does**:
1. Creates/opens a database file called `habits.db` on the device
2. Calls `initDatabase()` the first time the database is opened (or if it doesn't exist)
3. Makes the database accessible to all child components via `useSQLiteContext()`

The file `habits.db` lives in the app's internal storage — the user never sees it, and it persists across app restarts.

## 3. Database Schema

Our schema is defined in `src/db/schema.ts`:

```tsx
import type { SQLiteDatabase } from 'expo-sqlite';

export async function initDatabase(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      emoji TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS check_ins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}
```

### Why These Tables?

Let's analyze each one:

**habits table**
```sql
id         INTEGER PRIMARY KEY AUTOINCREMENT  -- Unique ID, auto-generated
name       TEXT NOT NULL                       -- "Drink water", "Exercise", etc.
emoji      TEXT DEFAULT ''                     -- Emoji icon like '💧'
created_at TEXT DEFAULT (datetime('now'))      -- When the habit was created
```

- `PRIMARY KEY AUTOINCREMENT` — each habit gets a unique number (1, 2, 3...)
- `NOT NULL` — a habit must have a name
- `DEFAULT ''` — emoji is optional, defaults to empty string
- `DEFAULT (datetime('now'))` — automatically sets creation timestamp

**check_ins table**
```sql
id         INTEGER PRIMARY KEY AUTOINCREMENT
habit_id   INTEGER NOT NULL                    -- Which habit was checked in?
date       TEXT NOT NULL                       -- "2026-06-20"
created_at TEXT DEFAULT (datetime('now'))
FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
```

- `habit_id` links each check-in to a habit (foreign key)
- `date` stores just the date (YYYY-MM-DD), not a full timestamp — we only care about daily check-ins
- `ON DELETE CASCADE` — when a habit is deleted, all its check-ins are automatically deleted too

**settings table**
```sql
key    TEXT PRIMARY KEY   -- Setting name, like 'language'
value  TEXT NOT NULL      -- Setting value, like 'zh'
```

This is a simple key-value store. We use it to persist the language preference.

### Entity Relationship Diagram

```
┌─────────────┐          ┌───────────────┐
│   habits    │          │   check_ins   │
├─────────────┤          ├───────────────┤
│ id (PK)     │◄─────────│ habit_id (FK) │
│ name        │    1:N   │ date          │
│ emoji       │          │ created_at    │
│ created_at  │          └───────────────┘
└─────────────┘
```

One habit has many check-ins (one per day). A check-in belongs to exactly one habit.

## 4. Accessing the Database

The `useSQLiteContext()` hook gives any component access to the database:

```tsx
import { useSQLiteContext } from 'expo-sqlite';

function MyComponent() {
  const db = useSQLiteContext();

  useEffect(() => {
    const loadData = async () => {
      const rows = await db.getAllAsync('SELECT * FROM habits');
      console.log(rows);
    };
    loadData();
  }, [db]);
}
```

### The Three Main Methods

| Method | Returns | Use Case |
|--------|---------|----------|
| `db.getAllAsync(sql, params)` | `T[]` (array) | Fetch multiple rows |
| `db.getFirstAsync(sql, params)` | `T \| null` | Fetch one row (or null) |
| `db.runAsync(sql, params)` | `{ lastInsertRowId, changes }` | INSERT, UPDATE, DELETE |

### Parameterized Queries

Never concatenate strings into SQL queries — that's a SQL injection risk. Use **parameterized queries**:

```tsx
// ❌ Bad — SQL injection vulnerability
db.getAllAsync(`SELECT * FROM habits WHERE id = ${userId}`);

// ✅ Good — parameters are safely escaped
db.getAllAsync('SELECT * FROM habits WHERE id = ?', userId);
```

The `?` placeholder is replaced with the actual value, and SQLite handles escaping. This works for any type — strings, numbers, booleans.

### TypeScript Generics

The methods are **generic**, meaning you provide the return type:

```tsx
type Habit = {
  id: number;
  name: string;
  emoji: string;
  created_at: string;
};

// rows is typed as Habit[]
const rows = await db.getAllAsync<Habit>('SELECT * FROM habits');

// row is typed as { count: number } | null
const row = await db.getFirstAsync<{ count: number }>(
  'SELECT COUNT(*) as count FROM check_ins WHERE habit_id = ?',
  habitId
);
```

> **Why generics?** Without them, all database results would be typed as `any[]`. Generics let TypeScript check that you're using the data correctly — e.g., you can't access `row.nonExistentProperty` without a compile error.

## 5. Key Query Patterns

### INSERT and Get the ID

```tsx
const result = await db.runAsync(
  'INSERT INTO habits (name, emoji) VALUES (?, ?)',
  name,
  emoji
);
// result.lastInsertRowId is the new habit's ID
```

### Toggle (Upsert Pattern)

```tsx
const toggleCheckIn = async (habitId: number) => {
  const existing = await db.getFirstAsync<CheckIn>(
    'SELECT * FROM check_ins WHERE habit_id = ? AND date = ?',
    habitId,
    today
  );

  if (existing) {
    // Uncheck: delete the existing check-in
    await db.runAsync('DELETE FROM check_ins WHERE id = ?', existing.id);
    return false;  // Now unchecked
  } else {
    // Check: insert a new check-in
    await db.runAsync('INSERT INTO check_ins (habit_id, date) VALUES (?, ?)', habitId, today);
    return true;   // Now checked
  }
};
```

### JOIN with Status

This is our most important query — it fetches habits with today's check-in status in one call:

```tsx
const today = new Date().toISOString().split('T')[0]; // "2026-06-20"

const habits = await db.getAllAsync(`
  SELECT h.*,
    CASE WHEN c.id IS NOT NULL THEN 1 ELSE 0 END as checked_today
  FROM habits h
  LEFT JOIN check_ins c ON c.habit_id = h.id AND c.date = ?
  ORDER BY checked_today ASC, h.created_at DESC
`, today);
```

**What this does**:
1. `FROM habits h` — start with all habits
2. `LEFT JOIN check_ins c ON c.habit_id = h.id AND c.date = ?` — for each habit, find today's check-in (or null if none)
3. `CASE WHEN c.id IS NOT NULL THEN 1 ELSE 0 END as checked_today` — create a computed column `checked_today` (0 = unchecked, 1 = checked)
4. `ORDER BY checked_today ASC` — unchecked habits first (0 before 1)
5. `... h.created_at DESC` — then newest habits first

Without SQL, you'd need:
1. Fetch all habits
2. For each habit, query check-ins for today
3. Sort in JavaScript

One SQL query replaces N+1 round trips. This is why SQLite is so valuable.

### GROUP BY for Statistics

```tsx
const stats = await db.getAllAsync(`
  SELECT date, COUNT(*) as count
  FROM check_ins
  WHERE habit_id = ?
  GROUP BY date
  ORDER BY date DESC
`, habitId);
```

This returns data like:
```
date        | count
2026-06-20  | 1
2026-06-19  | 1
2026-06-18  | 0  (no row — missing from results)
2026-06-17  | 1
```

The bar chart component receives this data directly.

## 6. Transaction Safety

expo-sqlite runs each query in auto-commit mode by default (each query is its own transaction). For operations that must be atomic (like our `deleteHabit`), we should use explicit transactions:

```tsx
const deleteHabit = async (id: number) => {
  // These two operations should happen together
  await db.runAsync('DELETE FROM check_ins WHERE habit_id = ?', id);
  await db.runAsync('DELETE FROM habits WHERE id = ?', id);
};
```

Actually, since we have `ON DELETE CASCADE` on the foreign key, the first DELETE already handles both. But the principle stands — for unrelated but grouped operations, use transactions.

## Practice

Look at `src/hooks/use-check-ins.ts`. Can you trace:

1. What query checks if today's check-in exists?
2. What happens if the user taps the check button twice?
3. How does `getCheckInsGrouped` return data to the StatsChart component?

**Answers**:
1. `SELECT * FROM check_ins WHERE habit_id = ? AND date = ?` — if a row exists, the habit is checked today
2. First tap inserts (checked), second tap deletes (unchecked) — it's a toggle
3. It returns `CheckInCount[]` with `{ date, count }` objects, which StatsChart renders as bars

## Next Tutorial

Proceed to **Tutorial 07: Custom Hooks** — encapsulating database logic in reusable hooks.
