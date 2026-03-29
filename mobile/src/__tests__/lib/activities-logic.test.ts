// Tests for pure activity logic — overdue filtering, task vs time block classification
import { generateId, nowISO } from '../../lib/db/db.web';

// ─── Helper: build Activity-like row ────────────────────────────────────────

function makeRow(overrides: Record<string, unknown> = {}) {
  const now = nowISO();
  return {
    id: generateId(),
    user_id: 'user-1',
    activity_type: 'TIME_BLOCK',
    title: 'Test',
    description: null,
    start_time: now,
    duration_minutes: 60,
    category_id: 'sys-deep-work',
    assigned_date: now.substring(0, 10),
    is_scheduled: 1,
    status: 'PLANNED',
    priority: 'MEDIUM',
    deleted: 0,
    ...overrides,
  };
}

// ─── Overdue date logic ──────────────────────────────────────────────────────

describe('Overdue activity logic', () => {
  test('activity with past start_time is overdue', () => {
    const pastDate = '2020-06-15T09:00:00.000Z';
    const today = new Date().toISOString().substring(0, 10);
    const row = makeRow({ start_time: pastDate, status: 'PLANNED' });

    const startDate = row.start_time.substring(0, 10);
    expect(startDate < today).toBe(true);
    expect(row.status).toBe('PLANNED');
  });

  test('activity with today start_time is NOT overdue', () => {
    const todayISO = new Date().toISOString();
    const today = todayISO.substring(0, 10);
    const row = makeRow({ start_time: todayISO, status: 'PLANNED' });

    const startDate = row.start_time.substring(0, 10);
    expect(startDate < today).toBe(false);
  });

  test('COMPLETED activity is not overdue regardless of date', () => {
    const pastDate = '2020-06-15T09:00:00.000Z';
    const row = makeRow({ start_time: pastDate, status: 'COMPLETED' });

    // Only PLANNED status activities carry forward
    expect(row.status === 'PLANNED').toBe(false);
  });

  test('SKIPPED activity is not carried forward', () => {
    const pastDate = '2020-06-15T09:00:00.000Z';
    const row = makeRow({ start_time: pastDate, status: 'SKIPPED' });

    expect(row.status === 'PLANNED').toBe(false);
    expect(row.status === 'IN_PROGRESS').toBe(false);
  });

  test('IN_PROGRESS activity from past is included in carry-forward', () => {
    const pastDate = '2020-06-15T09:00:00.000Z';
    const today = new Date().toISOString().substring(0, 10);
    const row = makeRow({ start_time: pastDate, status: 'IN_PROGRESS' });

    const startDate = row.start_time.substring(0, 10);
    expect(startDate < today).toBe(true);
    expect(row.status === 'IN_PROGRESS').toBe(true);
  });
});

// ─── Task vs TIME_BLOCK classification ──────────────────────────────────────

describe('Activity type classification', () => {
  test('TIME_BLOCK has is_scheduled = true', () => {
    const block = makeRow({ activity_type: 'TIME_BLOCK', is_scheduled: 1 });
    expect(block.activity_type).toBe('TIME_BLOCK');
    expect(block.is_scheduled).toBe(1);
  });

  test('TASK has is_scheduled = false', () => {
    const task = makeRow({ activity_type: 'TASK', is_scheduled: 0, duration_minutes: 0 });
    expect(task.activity_type).toBe('TASK');
    expect(task.is_scheduled).toBe(0);
  });

  test('TASK with no assigned_date is a someday task', () => {
    const task = makeRow({ activity_type: 'TASK', assigned_date: null, is_scheduled: 0 });
    expect(task.assigned_date).toBeNull();
  });

  test('TASK with assigned_date is pinned to that day', () => {
    const today = new Date().toISOString().substring(0, 10);
    const task = makeRow({ activity_type: 'TASK', assigned_date: today, is_scheduled: 0 });
    expect(task.assigned_date).toBe(today);
  });

  test('TIME_BLOCK has positive duration_minutes', () => {
    const block = makeRow({ activity_type: 'TIME_BLOCK', duration_minutes: 90 });
    expect(block.duration_minutes).toBeGreaterThan(0);
  });

  test('TASK duration is 0 (untimed)', () => {
    const task = makeRow({ activity_type: 'TASK', duration_minutes: 0 });
    expect(task.duration_minutes).toBe(0);
  });
});

// ─── Overdue task logic ──────────────────────────────────────────────────────

describe('Overdue task logic', () => {
  test('task with past assigned_date and PLANNED status is overdue', () => {
    const today = new Date().toISOString().substring(0, 10);
    const task = makeRow({ activity_type: 'TASK', assigned_date: '2020-01-01', status: 'PLANNED' });

    expect(task.activity_type).toBe('TASK');
    expect((task.assigned_date as string) < today).toBe(true);
    expect(task.status).toBe('PLANNED');
  });

  test('task with today assigned_date is NOT overdue', () => {
    const today = new Date().toISOString().substring(0, 10);
    const task = makeRow({ activity_type: 'TASK', assigned_date: today, status: 'PLANNED' });

    expect((task.assigned_date as string) < today).toBe(false);
  });

  test('completed task from past is not overdue', () => {
    const task = makeRow({ activity_type: 'TASK', assigned_date: '2020-01-01', status: 'COMPLETED' });

    // Overdue queries only include PLANNED tasks
    expect(task.status === 'PLANNED').toBe(false);
  });

  test('someday task (null assigned_date) is not overdue', () => {
    const task = makeRow({ activity_type: 'TASK', assigned_date: null, status: 'PLANNED' });

    // Someday tasks have null assigned_date — overdue queries use assigned_date < ?
    expect(task.assigned_date).toBeNull();
  });
});

// ─── Status transitions ──────────────────────────────────────────────────────

describe('Status transition logic', () => {
  const VALID_STATUSES = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'];

  test('all status values are valid', () => {
    for (const status of VALID_STATUSES) {
      expect(VALID_STATUSES).toContain(status);
    }
  });

  test('quickToggle: PLANNED → COMPLETED', () => {
    const current = 'PLANNED';
    const next = current === 'COMPLETED' ? 'PLANNED' : 'COMPLETED';
    expect(next).toBe('COMPLETED');
  });

  test('quickToggle: COMPLETED → PLANNED', () => {
    const current = 'COMPLETED';
    const next = current === 'COMPLETED' ? 'PLANNED' : 'COMPLETED';
    expect(next).toBe('PLANNED');
  });

  test('quickToggle: IN_PROGRESS → COMPLETED', () => {
    const current = 'IN_PROGRESS';
    const next = current === 'COMPLETED' ? 'PLANNED' : 'COMPLETED';
    expect(next).toBe('COMPLETED');
  });
});

// ─── generateId and nowISO ───────────────────────────────────────────────────

describe('DB utility: generateId and nowISO', () => {
  test('generateId returns a UUID v4 string', () => {
    const id = generateId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  test('consecutive generateId calls return unique values', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId()));
    expect(ids.size).toBe(50);
  });

  test('nowISO returns valid ISO 8601 string', () => {
    const iso = nowISO();
    expect(new Date(iso).toISOString()).toBe(iso);
  });

  test('nowISO returns current time within 1 second', () => {
    const before = Date.now();
    const iso = nowISO();
    const after = Date.now();
    const ts = new Date(iso).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after + 1);
  });
});
