// Demo seed data — 210 tasks from the user's Any.do export
// Account: demo@dayflow.app / demo1234

import { generateId, nowISO } from './db';
import { SYSTEM_CATEGORIES } from '../../features/categories/systemCategories';

export const DEMO_USER_ID = 'demo-user-001';
const SEED_VERSION = '1';

const CUSTOM_CATEGORIES = [
  { id: 'cust-social', name: 'Social', color: '#14B8A6', icon: '👥', sort_order: 8 },
  { id: 'cust-family', name: 'Family', color: '#F97316', icon: '🏠', sort_order: 9 },
  { id: 'cust-finance', name: 'Finance', color: '#10B981', icon: '💰', sort_order: 10 },
  { id: 'cust-wedding', name: 'Wedding', color: '#EC4899', icon: '💍', sort_order: 11 },
  { id: 'cust-chores', name: 'Chores', color: '#78716C', icon: '🧹', sort_order: 12 },
  { id: 'cust-explore', name: 'Explore', color: '#8B5CF6', icon: '🧭', sort_order: 13 },
  { id: 'cust-mumbai', name: 'Mumbai', color: '#EF4444', icon: '🏙️', sort_order: 14 },
  { id: 'cust-fashion', name: 'Fashion', color: '#D946EF', icon: '👔', sort_order: 15 },
  { id: 'cust-duniyadari', name: 'Duniyadari', color: '#0EA5E9', icon: '🌍', sort_order: 16 },
  { id: 'cust-professional', name: 'Professional', color: '#6366F1', icon: '💼', sort_order: 17 },
];

function uuid() { return generateId(); }
function dayOffset(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}
function isoAt(dayOff: number, hour: number, min = 0): string {
  const d = dayOffset(dayOff);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}
function dateStr(dayOff: number): string {
  return dayOffset(dayOff).toISOString().split('T')[0];
}

function task(title: string, catId: string, opts: {
  assigned?: number; // day offset; null = backlog
  status?: string;
  priority?: string;
  description?: string;
  subtasks?: Array<{ title: string; done: boolean }>;
} = {}) {
  const now = nowISO();
  const assignedDate = opts.assigned !== undefined ? dateStr(opts.assigned) : null;
  return {
    id: uuid(),
    activity_type: 'TASK',
    title,
    description: opts.description ?? null,
    start_time: now,
    duration_minutes: 0,
    category_id: catId,
    assigned_date: assignedDate,
    is_scheduled: false,
    status: opts.status ?? 'PLANNED',
    priority: opts.priority ?? 'MEDIUM',
    recurrence_type: 'NONE',
    recurrence_days: null,
    subtasks: opts.subtasks ? JSON.stringify(opts.subtasks.map(s => ({ id: uuid(), title: s.title, done: s.done }))) : null,
    mindset_prompt: null,
    actual_start: null,
    actual_end: opts.status === 'COMPLETED' ? now : null,
  };
}

function block(title: string, catId: string, dayOff: number, hour: number, durationMin: number, opts: {
  status?: string;
  priority?: string;
  recurrence?: string;
  mindset?: string;
} = {}) {
  const start = isoAt(dayOff, hour);
  const end = opts.status === 'COMPLETED' ? isoAt(dayOff, hour, durationMin) : null;
  return {
    id: uuid(),
    activity_type: 'TIME_BLOCK',
    title,
    description: null,
    start_time: start,
    duration_minutes: durationMin,
    category_id: catId,
    assigned_date: dateStr(dayOff),
    is_scheduled: true,
    status: opts.status ?? 'PLANNED',
    priority: opts.priority ?? 'MEDIUM',
    recurrence_type: opts.recurrence ?? 'NONE',
    recurrence_days: null,
    subtasks: null,
    mindset_prompt: opts.mindset ?? null,
    actual_start: opts.status === 'COMPLETED' ? start : null,
    actual_end: end,
  };
}

function buildDemoData() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activities: any[] = [];

  // ─── 7 days ago ───
  activities.push(
    block('Morning water', 'sys-personal', -7, 7, 10, { status: 'COMPLETED', recurrence: 'WEEKLY' }),
    block('Breakfast', 'sys-personal', -7, 8, 30, { status: 'COMPLETED', recurrence: 'WEEKLY' }),
    block('Sunlight', 'sys-health', -7, 9, 15, { status: 'COMPLETED', recurrence: 'WEEKLY' }),
    block('routine', 'sys-personal', -7, 9, 30, { status: 'COMPLETED', recurrence: 'WEEKLY' }),
    block('Leisure activities', 'sys-rest', -7, 15, 60, { status: 'COMPLETED', recurrence: 'DAILY' }),
    block('Celebrating Journal', 'sys-personal', -7, 20, 20, { status: 'COMPLETED', recurrence: 'WEEKLY' }),
    block('Bed time water', 'sys-health', -7, 22, 5, { status: 'COMPLETED', recurrence: 'WEEKLY' }),
    block('Check routine before sleep', 'sys-personal', -7, 21, 15, { status: 'COMPLETED', recurrence: 'BIWEEKLY' }),
  );

  // ─── 6 days ago ───
  activities.push(
    block('Morning water', 'sys-personal', -6, 7, 10, { status: 'COMPLETED', recurrence: 'WEEKLY' }),
    block('Self love', 'sys-personal', -6, 9, 30, { status: 'COMPLETED', recurrence: 'WEEKLY' }),
    block('Love/care with bhabhi', 'cust-family', -6, 10, 30, { status: 'COMPLETED', recurrence: 'WEEKLY' }),
    block('Sankalp work', 'sys-deep-work', -6, 11, 150, { status: 'COMPLETED', recurrence: 'WEEKLY', mindset: 'Serious about intent, playful execution.' }),
    block('Create happy memories', 'sys-personal', -6, 16, 60, { status: 'COMPLETED', recurrence: 'WEEKLY' }),
    block('Message Saurabh', 'cust-family', -6, 20, 15, { status: 'COMPLETED', recurrence: 'BIWEEKLY' }),
    block('Bed time water', 'sys-health', -6, 22, 5, { status: 'COMPLETED', recurrence: 'WEEKLY' }),
  );

  // ─── 5 days ago ───
  activities.push(
    block('Waking up practise', 'sys-personal', -5, 9, 20, { status: 'COMPLETED', recurrence: 'WEEKLY' }),
    block('Bhaiya meet', 'cust-family', -5, 15, 60, { status: 'COMPLETED', recurrence: 'BIWEEKLY' }),
    block('Humour Writing', 'sys-creative', -5, 17, 45, { status: 'COMPLETED', recurrence: 'WEEKLY' }),
    block('Movement games', 'sys-health', -5, 18, 60, { status: 'COMPLETED', recurrence: 'BIWEEKLY' }),
    block('Structuring as a skill', 'cust-duniyadari', -5, 19, 45, { status: 'COMPLETED', recurrence: 'BIWEEKLY' }),
    block('Observe breath!', 'sys-personal', -5, 21, 15, { status: 'COMPLETED', mindset: 'Just observe. No judgement.' }),
  );

  // ─── 4 days ago ───
  activities.push(
    block('Enjoy the feeling', 'sys-personal', -4, 16, 30, { status: 'COMPLETED', recurrence: 'WEEKLY' }),
    block('Sankalp work', 'sys-deep-work', -4, 10, 180, { status: 'COMPLETED', recurrence: 'WEEKLY', priority: 'HIGH' }),
    block('Anand meeting follow up', 'sys-personal', -4, 13, 30, { status: 'COMPLETED' }),
    block('Investing in equities', 'cust-finance', -4, 17, 45, { status: 'COMPLETED' }),
    block('Monthly expenses analysis', 'cust-finance', -4, 18, 45, { status: 'COMPLETED', recurrence: 'MONTHLY' }),
  );

  // ─── 3 days ago ───
  activities.push(
    block('Call mummy', 'cust-family', -3, 8, 30, { status: 'COMPLETED', recurrence: 'WEEKLY', priority: 'HIGH' }),
    block('Laundry', 'cust-chores', -3, 10, 45, { status: 'COMPLETED', recurrence: 'WEEKLY' }),
    block('Dhruv bhai', 'cust-social', -3, 11, 60, { status: 'COMPLETED', recurrence: 'WEEKLY' }),
    block('stabalise current things', 'cust-chores', -3, 14, 60, { status: 'COMPLETED', recurrence: 'WEEKLY' }),
    block('Massage', 'sys-health', -3, 16, 60, { status: 'COMPLETED', recurrence: 'BIWEEKLY' }),
    block('Detan', 'sys-health', -3, 17, 30, { status: 'COMPLETED', recurrence: 'BIWEEKLY' }),
    block('Kaka', 'cust-social', -3, 18, 45, { status: 'COMPLETED', recurrence: 'MONTHLY' }),
    block('Check routine before sleep', 'sys-personal', -3, 21, 15, { status: 'COMPLETED', recurrence: 'BIWEEKLY' }),
  );

  // ─── 2 days ago ───
  activities.push(
    block('Celebrating Journal', 'sys-personal', -2, 9, 20, { status: 'COMPLETED', recurrence: 'WEEKLY' }),
    block('Meet people of all age group(eld)', 'cust-social', -2, 13, 90, { status: 'COMPLETED', recurrence: 'BIWEEKLY' }),
    block('Board of mentors', 'sys-personal', -2, 15, 60, { status: 'COMPLETED', recurrence: 'MONTHLY' }),
    block('Pick something from chakra', 'sys-personal', -2, 16, 30, { status: 'COMPLETED', recurrence: 'MONTHLY' }),
    block('Leisure activities', 'sys-rest', -2, 18, 60, { status: 'COMPLETED', recurrence: 'DAILY' }),
    block('Bency', 'cust-social', -2, 12, 44, { status: 'COMPLETED', recurrence: 'BIMONTHLY' }),
  );

  // ─── Yesterday ───
  activities.push(
    block('Morning water', 'sys-personal', -1, 7, 10, { status: 'COMPLETED', recurrence: 'WEEKLY' }),
    block('Sankalp work', 'sys-deep-work', -1, 10, 120, { status: 'COMPLETED', recurrence: 'WEEKLY', priority: 'HIGH' }),
    block('Review each category', 'sys-admin', -1, 14, 45, { status: 'COMPLETED', recurrence: 'MONTHLY' }),
    block('Structuring as a skill', 'cust-duniyadari', -1, 15, 45, { status: 'COMPLETED', recurrence: 'BIWEEKLY' }),
    block('Decentralising decision making', 'sys-personal', -1, 16, 45, { status: 'COMPLETED', recurrence: 'MONTHLY' }),
    block('Review with papa and bhaiya', 'cust-family', -1, 19, 60, { status: 'COMPLETED', priority: 'HIGH' }),
    block('Letter to future self', 'sys-personal', -1, 21, 30, { status: 'COMPLETED' }),
  );

  // ─── Today ───
  activities.push(
    block('Morning water', 'sys-personal', 0, 7, 10, { status: 'COMPLETED', recurrence: 'WEEKLY' }),
    block('Sunlight', 'sys-health', 0, 9, 15, { status: 'COMPLETED', recurrence: 'WEEKLY', priority: 'HIGH' }),
    block('routine', 'sys-personal', 0, 9, 30, { status: 'COMPLETED', recurrence: 'WEEKLY' }),
    block('Sankalp work', 'sys-deep-work', 0, 10, 150, { status: 'IN_PROGRESS', recurrence: 'WEEKLY', priority: 'HIGH', mindset: 'Serious about intent, playful execution.' }),
    block('Leisure activities', 'sys-rest', 0, 15, 60, { status: 'PLANNED', recurrence: 'DAILY' }),
    block('Find fixed mindset personas!', 'sys-personal', 0, 16, 30, { status: 'PLANNED', recurrence: 'MONTHLY' }),
    block('Love/care with bhabhi', 'cust-family', 0, 17, 30, { status: 'PLANNED', recurrence: 'WEEKLY', priority: 'HIGH' }),
    block('Celebrating Journal', 'sys-personal', 0, 20, 20, { status: 'PLANNED', recurrence: 'WEEKLY' }),
    block('Call mummy', 'cust-family', 0, 20, 30, { status: 'PLANNED', recurrence: 'WEEKLY', priority: 'HIGH' }),
    block('Check routine before sleep', 'sys-personal', 0, 21, 15, { status: 'PLANNED', recurrence: 'WEEKLY' }),
  );

  // ─── Tomorrow (+1) ───
  activities.push(
    block('Morning water', 'sys-personal', 1, 7, 10, { status: 'PLANNED', recurrence: 'WEEKLY' }),
    block('Self love', 'sys-personal', 1, 9, 30, { status: 'PLANNED', recurrence: 'WEEKLY' }),
    block('Sunlight', 'sys-health', 1, 9, 15, { status: 'PLANNED', recurrence: 'WEEKLY' }),
    block('Love/care with bhabhi', 'cust-family', 1, 10, 30, { status: 'PLANNED', recurrence: 'WEEKLY' }),
    block('Sankalp work', 'sys-deep-work', 1, 11, 150, { status: 'PLANNED', recurrence: 'WEEKLY', priority: 'HIGH' }),
    block('Create happy memories', 'sys-personal', 1, 16, 60, { status: 'PLANNED', recurrence: 'WEEKLY' }),
    block('Message Saurabh', 'cust-family', 1, 19, 15, { status: 'PLANNED', recurrence: 'BIWEEKLY' }),
    block('Bed time water', 'sys-health', 1, 22, 5, { status: 'PLANNED', recurrence: 'WEEKLY' }),
  );

  // ─── Day +2 ───
  activities.push(
    block('Waking up practise', 'sys-personal', 2, 9, 20, { status: 'PLANNED', recurrence: 'WEEKLY' }),
    block('Bhaiya meet', 'cust-family', 2, 15, 60, { status: 'PLANNED', recurrence: 'BIWEEKLY' }),
    block('Movement games', 'sys-health', 2, 18, 60, { status: 'PLANNED', recurrence: 'BIWEEKLY' }),
    block('Practice being vulnerable', 'sys-personal', 2, 20, 30, { status: 'PLANNED' }),
  );

  // ─── Day +3 ───
  activities.push(
    block('Humour Writing', 'sys-creative', 3, 17, 45, { status: 'PLANNED', recurrence: 'WEEKLY' }),
    block('Structuring as a skill', 'cust-duniyadari', 3, 18, 45, { status: 'PLANNED', recurrence: 'BIWEEKLY' }),
    block('Story telling', 'sys-personal', 3, 19, 45, { status: 'PLANNED', recurrence: 'MONTHLY' }),
    block('Sankalp work', 'sys-deep-work', 3, 10, 180, { status: 'PLANNED', recurrence: 'WEEKLY', priority: 'HIGH' }),
  );

  // ─── Day +4 ───
  activities.push(
    block('Enjoy the feeling', 'sys-personal', 4, 16, 30, { status: 'PLANNED', recurrence: 'WEEKLY' }),
    block('Sankalp work', 'sys-deep-work', 4, 10, 120, { status: 'PLANNED', recurrence: 'WEEKLY', priority: 'HIGH' }),
    block('Investing in equities', 'cust-finance', 4, 17, 45, { status: 'PLANNED', recurrence: 'MONTHLY' }),
    block('Solve maths/coding problems to build rationality', 'cust-duniyadari', 4, 19, 60, { status: 'PLANNED', recurrence: 'MONTHLY' }),
  );

  // ─── Day +5 ───
  activities.push(
    block('Call mummy', 'cust-family', 5, 8, 30, { status: 'PLANNED', recurrence: 'WEEKLY', priority: 'HIGH' }),
    block('Laundry', 'cust-chores', 5, 10, 45, { status: 'PLANNED', recurrence: 'WEEKLY' }),
    block('Dhruv bhai', 'cust-social', 5, 11, 60, { status: 'PLANNED', recurrence: 'WEEKLY' }),
    block('Skin care: checkin & implement', 'sys-health', 5, 14, 30, { status: 'PLANNED', recurrence: 'MONTHLY' }),
    block('Diet', 'sys-health', 5, 15, 30, { status: 'PLANNED', recurrence: 'MONTHLY', priority: 'HIGH' }),
    block('Kaka', 'cust-social', 5, 16, 45, { status: 'PLANNED', recurrence: 'MONTHLY' }),
    block('Check routine before sleep', 'sys-personal', 5, 21, 15, { status: 'PLANNED', recurrence: 'WEEKLY' }),
  );

  // ─── Day +6 ───
  activities.push(
    block('Celebrating Journal', 'sys-personal', 6, 9, 20, { status: 'PLANNED', recurrence: 'WEEKLY' }),
    block('Meet people of all age group(eld)', 'cust-social', 6, 13, 90, { status: 'PLANNED', recurrence: 'BIWEEKLY' }),
    block('Tor', 'cust-social', 6, 17, 45, { status: 'PLANNED', recurrence: 'MONTHLY' }),
    block('Observe breath!', 'sys-personal', 6, 20, 15, { status: 'PLANNED', mindset: 'Just observe. No judgement.' }),
  );

  // ─── Day +7 ───
  activities.push(
    block('Morning water', 'sys-personal', 7, 7, 10, { status: 'PLANNED', recurrence: 'WEEKLY' }),
    block('Sunlight', 'sys-health', 7, 9, 15, { status: 'PLANNED', recurrence: 'WEEKLY' }),
    block('Sankalp work', 'sys-deep-work', 7, 10, 180, { status: 'PLANNED', recurrence: 'WEEKLY', priority: 'HIGH' }),
    block('B12 injections', 'sys-health', 7, 14, 30, { status: 'PLANNED', priority: 'HIGH' }),
    block('stabalise current things', 'cust-chores', 7, 15, 60, { status: 'PLANNED', recurrence: 'WEEKLY' }),
    block('Self 2.0 clarity', 'sys-personal', 7, 19, 45, { status: 'PLANNED', recurrence: 'BIWEEKLY', mindset: 'Focus on needs/desires. What matters most?' }),
    block('Speak with Rishil', 'cust-family', 7, 18, 30, { status: 'PLANNED', recurrence: 'MONTHLY' }),
  );

  // ─── Day-assigned tasks for today ───
  activities.push(
    task('Credit card', 'sys-personal', { assigned: 0, priority: 'HIGH' }),
    task('Shriraj wallet', 'sys-personal', { assigned: 0, priority: 'MEDIUM' }),
    task('Sunscreen', 'sys-personal', { assigned: 0 }),
    task('Barber', 'sys-personal', { assigned: 0 }),
    task('Priyanka', 'sys-personal', { assigned: 0 }),
    task('Nikhil Jain', 'sys-personal', { assigned: 0 }),
    task('Photo on ig about shreyaa', 'sys-personal', { assigned: 0 }),
    task('Shopping list', 'sys-personal', { assigned: 0 }),
    task('Ring', 'sys-personal', { assigned: 0, priority: 'HIGH' }),
    task('Underwear', 'sys-personal', { assigned: 0 }),
    task('Pre wedding things', 'cust-wedding', {
      assigned: 0, priority: 'HIGH',
      description: 'Ring, dress, engagement photos, invite friends, books for wedding',
      subtasks: [
        { title: 'Ring', done: false },
        { title: 'Dress', done: false },
        { title: 'Engagement photos', done: true },
        { title: 'Invite friends', done: false },
        { title: 'Books for wedding', done: false },
        { title: 'Edit friends list', done: false },
      ],
    }),
    task('Order things', 'cust-chores', {
      assigned: 0,
      description: 'Shopping list, travel bottles, cleaning kit, sunscreen, slip ons',
      subtasks: [
        { title: 'Travel bottles', done: false },
        { title: 'Cleaning kit', done: true },
        { title: 'Sunscreen', done: true },
        { title: 'Slip ons', done: false },
        { title: 'Meditation cushion', done: false },
      ],
    }),
  );

  // ─── Overdue tasks from yesterday ───
  activities.push(
    task('Shriraj bachelors', 'sys-personal', { assigned: -1 }),
    task('Rent', 'sys-personal', { assigned: -1, priority: 'HIGH' }),
    task('Various roles in a company for an idea', 'sys-personal', { assigned: -1 }),
    task('think about intelligence, ways of working', 'sys-personal', { assigned: -1 }),
    task('Read innovation', 'cust-wedding', { assigned: -1 }),
    task('password for google doc', 'sys-personal', { assigned: -1, status: 'COMPLETED' }),
  );

  // ─── Backlog — all one-time undated tasks ───
  activities.push(
    // Read category
    task('Find out books to reads for self awareness', 'sys-learning'),
    task('www.youtube.com - Otto Scharmer Deep Listening video', 'sys-learning'),
    task('Read about war', 'sys-learning'),
    task('Read: philosophy', 'sys-learning'),
    task('Franz kafka', 'sys-learning'),
    task('Constitution', 'sys-learning'),
    task('Guns, germs and steel', 'sys-learning'),
    task('King lear', 'sys-learning'),
    task('Moby dick', 'sys-learning'),
    task('Radical acceptance', 'sys-learning'),
    task('Read books on diplomacy', 'sys-learning'),
    task('Hindi literature', 'sys-learning'),
    task('Read hindi books', 'sys-learning'),
    task('Natural products', 'sys-learning'),
    task('Side effects', 'sys-learning'),
    task('Serum and eye cream', 'sys-learning'),
    task('goodreads.com/book/show/8718', 'sys-learning'),
    task('goodreads.com/book/show/34536488', 'sys-learning'),
    task('goodreads.com/book/show/59696349', 'sys-learning'),
    task('ceoworld.biz - What I learned about investing from Darwin', 'sys-learning'),
    task('collabfund.com - Expectations and Reality', 'sys-learning'),
    task('nesslabs.com/how-to-think-better', 'sys-learning'),
    task('refind.com/links/135517210', 'sys-learning'),
    task('twitter.com/RomeenSheth/status/1630615549934813189', 'sys-learning'),
    task('quantamagazine.org - Inside the proton', 'sys-learning'),
    task('books.google.co.in - The Practice of Adaptive Leadership', 'sys-learning'),
    task('amazon.in - A Piece of the Action', 'sys-learning'),
    task('amazon.in - What Every Body Is Saying', 'sys-learning'),
    task('Book of economics', 'sys-learning'),
    task('HDFC bank 2.0', 'sys-learning'),
    task('Read on economics', 'sys-learning'),
    task('Good strategy bad strategy', 'sys-learning'),
    task('Use of lateral thinking', 'sys-learning'),
    task('Cryptography', 'sys-learning'),
    task('Irrervisible events on mental health, how much volatility is okay', 'sys-learning'),
    task('x.com/RayDalio/status/2022788750388998543', 'sys-personal'),

    // Emo/spir growth
    task('India as a society what are strenght and weakeness', 'sys-personal'),
    task('Read on endorphins/oxytocin', 'sys-personal'),
    task('Use deactivating strategy with work', 'sys-personal'),
    task('Books on evolution and adaptation', 'sys-personal'),
    task('Find courses in anthropology and sociology for India', 'sys-personal'),
    task('Upanishads and veda volumes', 'sys-personal'),
    task('Barrier to entry less in histor', 'sys-personal'),
    task('Regret mininsing', 'sys-personal'),
    task('Ethnography', 'sys-personal'),
    task('Read on attachment', 'sys-personal'),
    task('Fantastic fungi', 'sys-personal'),
    task('Indian sociology & middle class', 'sys-personal'),
    task('Meditation cushion', 'sys-personal'),
    task('Chakra courses', 'sys-personal'),
    task('apps.apple.com - Insight Timer app', 'sys-personal'),
    task('Growth mindset book', 'sys-learning', { priority: 'MEDIUM' }),

    // Fun
    task("Restaurant's kitchen", 'sys-rest'),
    task('Golf diners', 'sys-rest'),
    task('How to create a mafia', 'sys-rest'),
    task('Visit a farm', 'cust-explore'),
    task('Language', 'sys-rest'),
    task('Play lego', 'sys-rest'),
    task('Play vice city', 'sys-rest'),
    task('Manjuman boys', 'sys-rest'),
    task('Origami', 'sys-rest'),
    task('Paper mache', 'sys-rest'),

    // Social
    task('Meet type of artists', 'cust-social'),
    task('Presitge, brigade, sobha', 'cust-social'),
    task('Meet people from chitrakala parishad', 'cust-social'),
    task('Parks', 'cust-social'),
    task('Voice course', 'cust-social'),
    task('Chai kidu', 'cust-social'),
    task('Gaur gift', 'cust-social'),

    // Mumbai
    task('Rue da liban', 'cust-mumbai'),
    task('Aswad restayrent', 'cust-mumbai'),
    task('Wall decision', 'cust-mumbai'),
    task('Bhau daji lad', 'cust-mumbai'),
    task('Tiles', 'cust-mumbai'),
    task('Visit school', 'cust-mumbai'),
    task('Harish Roorkee senior', 'cust-mumbai'),
    task('Mumbai trip', 'cust-mumbai', {
      description: 'Rue da Liban, Aswad, Bhau Daji Lad, Living Room Bandra, Visit school',
      subtasks: [
        { title: 'Rue da Liban', done: false },
        { title: 'Aswad restaurant', done: false },
        { title: 'Bhau Daji Lad museum', done: false },
        { title: 'Living Room Bandra', done: false },
        { title: 'Visit school', done: false },
      ],
    }),

    // Duniyadari
    task('Essentials harvard', 'cust-duniyadari'),
    task('Logic gates', 'cust-duniyadari'),
    task('Understanding numbers and data', 'cust-duniyadari'),
    task('Calculus', 'cust-duniyadari'),
    task('Micro businesses', 'cust-duniyadari'),
    task('How spotify got built', 'cust-duniyadari', { description: 'https://m.youtube.com/watch?v=jTM7ZCKEUGM' }),

    // Health
    task('Power naps', 'sys-health'),
    task('Neck', 'sys-health'),
    task('Gel', 'sys-health'),
    task('hotstar.com - Limitless with Chris Hemsworth', 'sys-health'),

    // Root / personal misc
    task('Four agreements', 'sys-personal'),
    task('Painting', 'sys-creative'),
    task('Upskill for freedom', 'sys-personal', { priority: 'HIGH' }),
    task('Dad gift', 'sys-personal'),
    task('Find a starting point', 'sys-personal', { priority: 'HIGH' }),
    task('Travel bottels', 'sys-personal'),
    task('Hdhdhd', 'sys-personal'),
    task('Mirror work day 9', 'cust-chores'),
    task('Flat', 'cust-family'),
    task('Personal website', 'sys-creative'),
    task('Travel to Mumbai', 'sys-personal'),
    task('Game theory veritasian', 'sys-personal'),

    // Wedding
    task('Gita doctor', 'cust-wedding', { priority: 'HIGH' }),
    task('Invite friends', 'cust-wedding', { priority: 'HIGH' }),
    task('Dad relatives', 'cust-wedding'),
    task('Mom relatives', 'cust-wedding'),

    // Finance
    task('Do financial planning(doc)', 'cust-finance', { priority: 'HIGH' }),

    // Fashion
    task('Slip ons', 'cust-fashion'),

    // Explore
    task('Pune weather institute', 'cust-explore'),
    task('Find liberal arts in Bangalore', 'cust-explore'),

    // Professional
    task('California burrito', 'cust-professional'),

    // Misc with scheduled future dates (as tasks)
    task('Shriraj', 'sys-personal', { assigned: 20 }),
    task('Abhijeet', 'cust-social', { assigned: 18 }),
    task('Speak with Rishil', 'cust-family', { assigned: 12 }),
    task('Teal sweal self love book', 'sys-personal', { assigned: 24 }),
    task('Yearly test medical', 'sys-health', { assigned: 107, priority: 'HIGH' }),
    task('Message Surender', 'sys-personal', { assigned: 150 }),
  );

  return activities;
}

export async function seedDemoData(): Promise<void> {
  if (typeof localStorage === 'undefined') return;
  if (localStorage.getItem('dayflow_demo_seed_version') === SEED_VERSION) return;

  const activities = buildDemoData();
  const seedNow = nowISO();

  const categoryRows = [
    ...SYSTEM_CATEGORIES.map(c => ({
      id: c.id, user_id: c.user_id, name: c.name, color: c.color,
      icon: c.icon, is_system: 1, sort_order: c.sort_order, synced: 1,
    })),
    ...CUSTOM_CATEGORIES.map(c => ({
      id: c.id, user_id: DEMO_USER_ID, name: c.name, color: c.color,
      icon: c.icon, is_system: 0, sort_order: c.sort_order, synced: 1,
    })),
  ];

  const activityRows = activities.map(a => ({
    ...a,
    user_id: DEMO_USER_ID,
    created_at: seedNow,
    updated_at: seedNow,
    synced: 0,
    deleted: 0,
  }));

  // Merge with existing DB (may already have Sankalp's data)
  const existing = localStorage.getItem('dayflow_db');
  const db = existing ? JSON.parse(existing) : { categories: [], activities: [], experience_logs: [] };

  // Remove old demo activities, keep Sankalp's
  const filteredActs = (db.activities || []).filter((a: { user_id: string }) => a.user_id !== DEMO_USER_ID);
  const filteredCats = (db.categories || []).filter((c: { user_id: string; is_system: number }) => c.user_id !== DEMO_USER_ID || c.is_system);

  db.categories = [...filteredCats, ...CUSTOM_CATEGORIES.map(c => ({
    id: c.id, user_id: DEMO_USER_ID, name: c.name, color: c.color,
    icon: c.icon, is_system: 0, sort_order: c.sort_order, synced: 1,
  }))];
  // Also ensure system categories exist
  for (const sc of categoryRows.filter(c => c.is_system)) {
    if (!db.categories.find((c: { id: string }) => c.id === sc.id)) {
      db.categories.push(sc);
    }
  }
  db.activities = [...filteredActs, ...activityRows];

  localStorage.setItem('dayflow_db', JSON.stringify(db));
  localStorage.setItem('dayflow_demo_seed_version', SEED_VERSION);
  localStorage.setItem('dayflow_onboarded', 'true');

  console.log(`[DayFlow] Demo seeded: ${activityRows.length} activities for demo@dayflow.app`);
}
