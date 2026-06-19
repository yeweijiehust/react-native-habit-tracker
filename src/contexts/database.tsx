import { type ReactNode } from 'react';
import { SQLiteProvider } from 'expo-sqlite';

import { initDatabase } from '@/db/schema';

export function DatabaseProvider({ children }: { children: ReactNode }) {
  return (
    <SQLiteProvider databaseName="habits.db" onInit={initDatabase}>
      {children}
    </SQLiteProvider>
  );
}
