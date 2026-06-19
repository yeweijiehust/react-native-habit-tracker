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
  const db = useSQLiteContext();

  const loadHabits = useCallback(async () => {
    return db.getAllAsync<Habit>(
      'SELECT * FROM habits ORDER BY created_at DESC'
    );
  }, [db]);

  const loadHabitsWithStatus = useCallback(async () => {
    const todayStr = today();
    return db.getAllAsync<HabitWithStatus>(
      `SELECT h.*,
        CASE WHEN c.id IS NOT NULL THEN 1 ELSE 0 END as checked_today
      FROM habits h
      LEFT JOIN check_ins c ON c.habit_id = h.id AND c.date = ?
      ORDER BY checked_today ASC, h.created_at DESC`,
      todayStr
    );
  }, [db]);

  const createHabit = useCallback(
    async (name: string, emoji: string) => {
      const result = await db.runAsync(
        'INSERT INTO habits (name, emoji) VALUES (?, ?)',
        name,
        emoji
      );
      return result.lastInsertRowId;
    },
    [db]
  );

  const deleteHabit = useCallback(
    async (id: number) => {
      await db.runAsync('DELETE FROM check_ins WHERE habit_id = ?', id);
      await db.runAsync('DELETE FROM habits WHERE id = ?', id);
    },
    [db]
  );

  return { loadHabits, loadHabitsWithStatus, createHabit, deleteHabit };
}
