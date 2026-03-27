# DayFlow Testing Guide

## Setup
```bash
cd mobile
npm install
```

## Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- --testPathPattern="authStore"

# Run in watch mode
npm test -- --watch
```

## Test Structure
```
src/__tests__/
├── lib/           # Database, sync, notifications tests
├── store/         # Zustand store tests
├── screens/       # Screen component tests
└── integration/   # End-to-end flow tests
```

## Writing Tests for New Features

When adding a new feature, create tests covering:

1. **Unit tests** for any new utility functions or DB queries
2. **Store tests** for new Zustand actions/state
3. **Screen tests** for new screens:
   - Renders correctly
   - User interactions work (button presses, input changes)
   - Error states display properly
   - Loading states display properly
4. **Integration tests** for multi-step flows

### Test Template
```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

describe('FeatureName', () => {
  beforeEach(() => {
    // Reset state
  });

  test('renders correctly', () => {
    // Assert initial render
  });

  test('handles user interaction', async () => {
    // Simulate and assert
  });

  test('handles error state', () => {
    // Set error, assert display
  });
});
```

## Mocking Guidelines

- **Supabase**: Always mock `../../lib/supabase`
- **Navigation**: Pass mock navigation prop
- **SQLite**: Mock `../../lib/db/db` for unit tests
- **AsyncStorage**: Auto-mocked by jest-expo
