// Unit tests for activitiesStore — carry-forward, task creation, activity type switching
import { useActivitiesStore } from '../../store/activitiesStore';
import { Activity } from '../../types';
import { DEV_USER } from '../fixtures/users';
import { makeActivity, makeTask, resetSeq } from '../fixtures/activities';

// ─── Mock DB layer ──────────────────────────────────────────────────────────

const mockGetActivitiesForDay = jest.fn().mockResolvedValue([]);
const mockGetOverdueActivities = jest.fn().mockResolvedValue([]);
const mockGetInProgressActivities = jest.fn().mockResolvedValue([]);
const mockGetUntimedTasksForDay = jest.fn().mockResolvedValue([]);
const mockGetOverdueTasks = jest.fn().mockResolvedValue([]);
const mockGetInProgressTasks = jest.fn().mockResolvedValue([]);
const mockGetSomedayTasks = jest.fn().mockResolvedValue([]);
const mockGetBacklogActivities = jest.fn().mockResolvedValue([]);
const mockCreateActivity = jest.fn();
const mockCreateTask = jest.fn();
const mockUpdateActivity = jest.fn().mockResolvedValue(undefined);
const mockDeleteActivity = jest.fn().mockResolvedValue(undefined);

jest.mock('../../lib/db/activities', () => ({
  getActivitiesForDay: (...a: unknown[]) => mockGetActivitiesForDay(...a),
  getOverdueActivities: (...a: unknown[]) => mockGetOverdueActivities(...a),
  getInProgressActivities: (...a: unknown[]) => mockGetInProgressActivities(...a),
  getUntimedTasksForDay: (...a: unknown[]) => mockGetUntimedTasksForDay(...a),
  getOverdueTasks: (...a: unknown[]) => mockGetOverdueTasks(...a),
  getInProgressTasks: (...a: unknown[]) => mockGetInProgressTasks(...a),
  getSomedayTasks: (...a: unknown[]) => mockGetSomedayTasks(...a),
  getBacklogActivities: (...a: unknown[]) => mockGetBacklogActivities(...a),
  createActivity: (...a: unknown[]) => mockCreateActivity(...a),
  createTask: (...a: unknown[]) => mockCreateTask(...a),
  updateActivity: (...a: unknown[]) => mockUpdateActivity(...a),
  deleteActivity: (...a: unknown[]) => mockDeleteActivity(...a),
  generateRecurringInstances: jest.fn().mockResolvedValue(undefined),
  getActivity: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../lib/db/logs', () => ({
  getLogForActivity: jest.fn().mockResolvedValue(null),
  createLog: jest.fn().mockResolvedValue({ id: 'log-1' }),
}));

jest.mock('../../lib/notifications', () => ({
  scheduleLogNudge: jest.fn().mockResolvedValue(undefined),
  cancelLogNudge: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../lib/ai', () => ({
  generateMindsetPrompt: jest.fn().mockResolvedValue(''),
  categorizeActivity: jest.fn().mockResolvedValue(null),
}));

// sync is a no-op in unit tests — push/pull tested separately in sync tests
jest.mock('../../lib/sync', () => ({
  pushChanges: jest.fn().mockResolvedValue(undefined),
  isDevUser: jest.fn().mockReturnValue(true),
}));

// makeActivity, makeTask, resetSeq imported from fixtures

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('activitiesStore', () => {
  beforeEach(() => {
    resetSeq();
    useActivitiesStore.setState({
      activities: [],
      untimedTasks: [],
      backlog: [],
      logs: {},
      selectedDate: new Date(),
      loading: false,
      error: null,
      currentUserId: DEV_USER.id,
      planActivities: [],
      planTasks: [],
      carryForward: [],
      somedayTasks: [],
      planLoading: false,
    });
    jest.clearAllMocks();
  });

  // ─── loadDay: carry-forward ─────────────────────────────────────────────

  describe('loadDay — carry-forward', () => {
    test('merges today activities and overdue activities into state', async () => {
      const todayAct = makeActivity({ id: 'today-1', title: 'Today activity' });
      const overdueAct = makeActivity({ id: 'overdue-1', title: 'Overdue activity', status: 'PLANNED' });
      mockGetActivitiesForDay.mockResolvedValueOnce([todayAct]);
      mockGetOverdueActivities.mockResolvedValueOnce([overdueAct]);
      mockGetUntimedTasksForDay.mockResolvedValueOnce([]);
      mockGetOverdueTasks.mockResolvedValueOnce([]);

      await useActivitiesStore.getState().loadDay(DEV_USER.id, new Date());

      const { activities } = useActivitiesStore.getState();
      expect(activities).toHaveLength(2);
      expect(activities.map(a => a.id)).toContain('today-1');
      expect(activities.map(a => a.id)).toContain('overdue-1');
    });

    test('overdue activities appear before today activities (sorted by start_time)', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const overdueAct = makeActivity({ id: 'overdue-1', start_time: yesterday.toISOString() });
      const todayAct = makeActivity({ id: 'today-1', start_time: new Date().toISOString() });

      mockGetActivitiesForDay.mockResolvedValueOnce([todayAct]);
      mockGetOverdueActivities.mockResolvedValueOnce([overdueAct]);
      mockGetUntimedTasksForDay.mockResolvedValueOnce([]);
      mockGetOverdueTasks.mockResolvedValueOnce([]);

      await useActivitiesStore.getState().loadDay(DEV_USER.id, new Date());

      const { activities } = useActivitiesStore.getState();
      expect(activities[0].id).toBe('overdue-1');
      expect(activities[1].id).toBe('today-1');
    });

    test('merges overdue tasks into untimedTasks', async () => {
      const overdueTask = makeTask({ id: 'overdue-task-1', assigned_date: '2020-01-01' });
      mockGetActivitiesForDay.mockResolvedValueOnce([]);
      mockGetOverdueActivities.mockResolvedValueOnce([]);
      mockGetInProgressActivities.mockResolvedValueOnce([]);
      mockGetUntimedTasksForDay.mockResolvedValueOnce([]);
      mockGetOverdueTasks.mockResolvedValueOnce([overdueTask]);
      mockGetInProgressTasks.mockResolvedValueOnce([]);

      await useActivitiesStore.getState().loadDay(DEV_USER.id, new Date());

      const { untimedTasks } = useActivitiesStore.getState();
      expect(untimedTasks).toHaveLength(1);
      expect(untimedTasks[0].id).toBe('overdue-task-1');
    });

    test('today in-progress activities are included via getActivitiesForDay', async () => {
      // IN_PROGRESS activities for today come from getActivitiesForDay (not carry-forward)
      const inProgressAct = makeActivity({ id: 'inprogress-1', status: 'IN_PROGRESS' });
      mockGetActivitiesForDay.mockResolvedValueOnce([inProgressAct]);
      mockGetOverdueActivities.mockResolvedValueOnce([]);
      mockGetUntimedTasksForDay.mockResolvedValueOnce([]);
      mockGetOverdueTasks.mockResolvedValueOnce([]);

      await useActivitiesStore.getState().loadDay(DEV_USER.id, new Date());

      const { activities } = useActivitiesStore.getState();
      expect(activities.some(a => a.id === 'inprogress-1')).toBe(true);
    });

    test('loading flag is set during loadDay and cleared on completion', async () => {
      mockGetActivitiesForDay.mockResolvedValueOnce([]);
      mockGetOverdueActivities.mockResolvedValueOnce([]);
      mockGetInProgressActivities.mockResolvedValueOnce([]);
      mockGetUntimedTasksForDay.mockResolvedValueOnce([]);
      mockGetOverdueTasks.mockResolvedValueOnce([]);
      mockGetInProgressTasks.mockResolvedValueOnce([]);

      const promise = useActivitiesStore.getState().loadDay(DEV_USER.id, new Date());
      expect(useActivitiesStore.getState().loading).toBe(true);
      await promise;
      expect(useActivitiesStore.getState().loading).toBe(false);
    });
  });

  // ─── Task creation ──────────────────────────────────────────────────────

  describe('addTask — task creation', () => {
    test('creates a TASK type activity and adds it to untimedTasks', async () => {
      const createdTask = makeTask({ id: 'new-task', title: 'My new task' });
      mockCreateTask.mockResolvedValueOnce(createdTask);

      const result = await useActivitiesStore.getState().addTask({
        user_id: DEV_USER.id,
        title: 'My new task',
        category_id: 'sys-personal',
      });

      expect(result.activity_type).toBe('TASK');
      expect(result.title).toBe('My new task');
      expect(mockCreateTask).toHaveBeenCalledWith(expect.objectContaining({
        user_id: DEV_USER.id,
        title: 'My new task',
      }));
      const { untimedTasks } = useActivitiesStore.getState();
      expect(untimedTasks.some(t => t.id === 'new-task')).toBe(true);
    });

    test('task with assigned_date appears in untimedTasks list', async () => {
      const today = new Date().toISOString().substring(0, 10);
      const createdTask = makeTask({ id: 'dated-task', assigned_date: today });
      mockCreateTask.mockResolvedValueOnce(createdTask);

      await useActivitiesStore.getState().addTask({
        user_id: DEV_USER.id,
        title: 'Dated task',
        assigned_date: today,
      });

      const { untimedTasks } = useActivitiesStore.getState();
      expect(untimedTasks.some(t => t.id === 'dated-task')).toBe(true);
    });
  });

  // ─── Activity type switching ────────────────────────────────────────────

  describe('addActivity — activity type', () => {
    test('creates TIME_BLOCK by default', async () => {
      const created = makeActivity({ id: 'block-1', activity_type: 'TIME_BLOCK' });
      mockCreateActivity.mockResolvedValueOnce(created);

      const result = await useActivitiesStore.getState().addActivity({
        user_id: DEV_USER.id,
        title: 'Deep work',
        start_time: new Date().toISOString(),
        duration_minutes: 90,
        category_id: 'sys-deep-work',
      });

      expect(result.activity_type).toBe('TIME_BLOCK');
    });

    test('can create TASK type activity via addActivity', async () => {
      const created = makeActivity({ id: 'task-via-add', activity_type: 'TASK', duration_minutes: 0, is_scheduled: false });
      mockCreateActivity.mockResolvedValueOnce(created);

      const result = await useActivitiesStore.getState().addActivity({
        user_id: DEV_USER.id,
        title: 'Task',
        start_time: new Date().toISOString(),
        duration_minutes: 0,
        category_id: 'sys-personal',
        activity_type: 'TASK',
      });

      expect(result.activity_type).toBe('TASK');
    });

    test('TIME_BLOCK activity has is_scheduled = true', async () => {
      const created = makeActivity({ is_scheduled: true });
      mockCreateActivity.mockResolvedValueOnce(created);

      const result = await useActivitiesStore.getState().addActivity({
        user_id: DEV_USER.id,
        title: 'Scheduled',
        start_time: new Date().toISOString(),
        duration_minutes: 60,
        category_id: 'sys-deep-work',
      });

      expect(result.is_scheduled).toBe(true);
    });

    test('TASK activity has is_scheduled = false', async () => {
      const created = makeTask({ is_scheduled: false });
      mockCreateActivity.mockResolvedValueOnce(created);

      const result = await useActivitiesStore.getState().addActivity({
        user_id: DEV_USER.id,
        title: 'Unscheduled task',
        start_time: new Date().toISOString(),
        duration_minutes: 0,
        category_id: 'sys-personal',
        activity_type: 'TASK',
        is_scheduled: false,
      });

      expect(result.is_scheduled).toBe(false);
    });
  });

  // ─── Overdue logic ──────────────────────────────────────────────────────

  describe('overdue logic', () => {
    test('activities with past dates are fetched as overdue', async () => {
      const pastDate = '2020-06-15';
      const overdueAct = makeActivity({ id: 'past-1', start_time: `${pastDate}T09:00:00.000Z`, status: 'PLANNED' });
      mockGetActivitiesForDay.mockResolvedValueOnce([]);
      mockGetOverdueActivities.mockResolvedValueOnce([overdueAct]);
      mockGetInProgressActivities.mockResolvedValueOnce([]);
      mockGetUntimedTasksForDay.mockResolvedValueOnce([]);
      mockGetOverdueTasks.mockResolvedValueOnce([]);
      mockGetInProgressTasks.mockResolvedValueOnce([]);

      await useActivitiesStore.getState().loadDay(DEV_USER.id, new Date());

      expect(mockGetOverdueActivities).toHaveBeenCalled();
      const { activities } = useActivitiesStore.getState();
      expect(activities.some(a => a.id === 'past-1')).toBe(true);
    });

    test('completed activities are NOT included in carry-forward', async () => {
      const completedAct = makeActivity({ id: 'done-1', status: 'COMPLETED' });
      // Completed activities don't come back from getOverdueActivities (WHERE status = PLANNED)
      mockGetActivitiesForDay.mockResolvedValueOnce([]);
      mockGetOverdueActivities.mockResolvedValueOnce([]); // Not returned for completed
      mockGetInProgressActivities.mockResolvedValueOnce([]);
      mockGetUntimedTasksForDay.mockResolvedValueOnce([]);
      mockGetOverdueTasks.mockResolvedValueOnce([]);
      mockGetInProgressTasks.mockResolvedValueOnce([]);

      await useActivitiesStore.getState().loadDay(DEV_USER.id, new Date());

      const { activities } = useActivitiesStore.getState();
      expect(activities.some(a => a.id === 'done-1')).toBe(false);
    });

    test('quickToggleComplete changes PLANNED → COMPLETED', async () => {
      const activity = makeActivity({ id: 'act-toggle', status: 'PLANNED' });
      useActivitiesStore.setState({ activities: [activity], untimedTasks: [] });

      await useActivitiesStore.getState().quickToggleComplete('act-toggle');

      expect(mockUpdateActivity).toHaveBeenCalledWith('act-toggle', expect.objectContaining({ status: 'COMPLETED' }));
    });

    test('quickToggleComplete changes COMPLETED → PLANNED', async () => {
      const activity = makeActivity({ id: 'act-toggle', status: 'COMPLETED' });
      useActivitiesStore.setState({ activities: [activity], untimedTasks: [] });

      await useActivitiesStore.getState().quickToggleComplete('act-toggle');

      expect(mockUpdateActivity).toHaveBeenCalledWith('act-toggle', expect.objectContaining({ status: 'PLANNED' }));
    });

    test('setActivityStatus updates status in store state', async () => {
      const activity = makeActivity({ id: 'act-1', status: 'PLANNED' });
      useActivitiesStore.setState({ activities: [activity] });

      await useActivitiesStore.getState().setActivityStatus('act-1', 'IN_PROGRESS');

      expect(mockUpdateActivity).toHaveBeenCalledWith('act-1', expect.objectContaining({ status: 'IN_PROGRESS' }));
      const updated = useActivitiesStore.getState().activities.find(a => a.id === 'act-1');
      expect(updated?.status).toBe('IN_PROGRESS');
    });
  });

  // ─── Error handling ─────────────────────────────────────────────────────

  describe('error handling', () => {
    test('clearError resets error to null', () => {
      useActivitiesStore.setState({ error: 'Something went wrong' });
      useActivitiesStore.getState().clearError();
      expect(useActivitiesStore.getState().error).toBeNull();
    });

    test('setSelectedDate updates the date', () => {
      const newDate = new Date('2026-01-15');
      useActivitiesStore.getState().setSelectedDate(newDate);
      expect(useActivitiesStore.getState().selectedDate).toEqual(newDate);
    });
  });
});
