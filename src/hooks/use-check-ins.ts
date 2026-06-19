import { useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { today } from '@/lib/date';

export type CheckIn = {
  id: number;
  habit_id: number;
  date: string;
  created_at: string;
};

export type CheckInCount = {
  date: string;
  count: number;
};

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
        return false;
      }
      await db.runAsync(
        'INSERT INTO check_ins (habit_id, date) VALUES (?, ?)',
        habitId,
        todayStr
      );
      return true;
    },
    [db]
  );

  const getCheckInCount = useCallback(
    async (habitId: number): Promise<number> => {
      const row = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM check_ins WHERE habit_id = ?',
        habitId
      );
      return row?.count ?? 0;
    },
    [db]
  );

  const getCheckInsGrouped = useCallback(
    async (habitId: number): Promise<CheckInCount[]> => {
      return db.getAllAsync<CheckInCount>(
        `SELECT date, COUNT(*) as count
        FROM check_ins
        WHERE habit_id = ?
        GROUP BY date
        ORDER BY date DESC`,
        habitId
      );
    },
    [db]
  );

  return { toggleCheckIn, getCheckInCount, getCheckInsGrouped };
}
