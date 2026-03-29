// Unified database adapter interface
// Both native (expo-sqlite) and web (in-memory + localStorage) implementations
// must satisfy this contract. Consumers import only this type.

export interface DatabaseAdapter {
  runAsync(sql: string, params?: any[]): Promise<{ changes: number }>;
  getAllAsync<T = Record<string, unknown>>(sql: string, params?: any[]): Promise<T[]>;
  getFirstAsync<T = Record<string, unknown>>(sql: string, params?: any[]): Promise<T | null>;
  execAsync(sql: string): Promise<void>;
}
