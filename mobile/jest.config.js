module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/__tests__'],
  testMatch: ['**/*.(test|spec).(ts|tsx|js)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^expo-sqlite$': '<rootDir>/src/__tests__/__mocks__/expo-sqlite.ts',
    '^expo-sqlite/(.*)$': '<rootDir>/src/__tests__/__mocks__/expo-sqlite.ts',
    '^expo-notifications$': '<rootDir>/src/__tests__/__mocks__/expo-notifications.ts',
    '^expo-device$': '<rootDir>/src/__tests__/__mocks__/expo-device.ts',
    '^expo-secure-store$': '<rootDir>/src/__tests__/__mocks__/expo-secure-store.ts',
    '^expo-status-bar$': '<rootDir>/src/__tests__/__mocks__/expo-status-bar.ts',
    '^@react-native-async-storage/async-storage$': '<rootDir>/src/__tests__/__mocks__/async-storage.ts',
    '^@react-native-community/netinfo$': '<rootDir>/src/__tests__/__mocks__/netinfo.ts',
    '^react-native$': '<rootDir>/src/__tests__/__mocks__/react-native.ts',
    '^@supabase/supabase-js$': '<rootDir>/src/__tests__/__mocks__/supabase-js.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      diagnostics: false,
    }],
  },
};
