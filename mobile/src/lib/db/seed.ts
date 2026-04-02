// Seed data from Sankalp's Any.do export (173 tasks)
// Maps real tasks to DayFlow categories and creates a realistic 14-day canvas

import { generateId, nowISO, getDb } from './db';
import { SYSTEM_CATEGORIES } from '../../features/categories/systemCategories';

const USER_ID = 'dev-user-001';

// Custom categories mapped from Any.do categories not covered by system ones
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

// Any.do category -> DayFlow category_id mapping
const CATEGORY_MAP: Record<string, string> = {
  'Root': 'sys-personal',
  'Read': 'sys-learning',
  'Health': 'sys-health',
  'Fun': 'sys-rest',
  'Finance': 'cust-finance',
  'Family': 'cust-family',
  'Emo/spir growth': 'sys-personal',
  'Social': 'cust-social',
  'Mumbai': 'cust-mumbai',
  'Wedding': 'cust-wedding',
  'Chores': 'cust-chores',
  'Explore': 'cust-explore',
  'Duniyadari': 'cust-duniyadari',
  'Professional': 'cust-professional',
  'Professional ': 'cust-professional',
  'Fashion': 'cust-fashion',
};

function mapFrequency(freq: string): string {
  if (!freq || freq === 'None' || freq === 'N/A') return 'NONE';
  const f = freq.toLowerCase();
  if (f === 'daily') return 'DAILY';
  if (f === 'weekly') return 'WEEKLY';
  if (f === 'monthly') return 'MONTHLY';
  if (f === 'yearly') return 'YEARLY';
  return 'NONE';
}

function mapPriority(pri: string): string {
  if (!pri) return 'MEDIUM';
  const p = pri.toLowerCase().trim();
  if (p === 'high') return 'HIGH';
  if (p === 'low') return 'LOW';
  return 'MEDIUM';
}

function uuid() { return generateId(); }
function dayOffset(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}
function isoAt(dayOff: number, hour: number, min = 0): string {
  const d = dayOffset(dayOff);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

// Parse "16 May 2026" or "02 Apr 2026" style dates
function parseAnyDoDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '' || dateStr === 'N/A') return null;
  const months: Record<string, number> = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sept': 8, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11,
  };
  const parts = dateStr.trim().split(' ');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = months[parts[1]];
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || month === undefined || isNaN(year)) return null;
  return new Date(year, month, day);
}

// Parse "12:00 PM" style times
function parseTime(timeStr: string): { hour: number; min: number } | null {
  if (!timeStr || timeStr.trim() === '' || timeStr === 'N/A') return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const min = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && hour !== 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  return { hour, min };
}

// Parse CSV line handling quoted fields with commas
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

// Parse subtasks from semicolon-separated string
function parseSubtasks(subtasksStr: string): Array<{ id: string; title: string; done: boolean }> | undefined {
  if (!subtasksStr || subtasksStr.trim() === 'None' || subtasksStr.trim() === '' || subtasksStr.trim() === 'N/A') return undefined;
  const parts = subtasksStr.split(';').map(s => s.trim()).filter(s => s.length > 0);
  if (parts.length === 0) return undefined;
  return parts.map(title => ({ id: uuid(), title, done: false }));
}

interface SeedActivity {
  id: string;
  activity_type: string;
  title: string;
  description?: string | null;
  start_time: string;
  duration_minutes: number;
  category_id: string;
  assigned_date: string | null;
  is_scheduled: boolean;
  status: string;
  priority: string;
  recurrence_type: string;
  recurrence_days?: string[];
  subtasks?: Array<{ id: string; title: string; done: boolean }>;
  mindset_prompt: string | null;
  actual_start: string | null;
  actual_end: string | null;
}

interface SeedLog {
  activity_id: string;
  mood: number;
  energy: number;
  completion_pct: number;
  reflection: string | null;
  would_repeat: string | null;
  log_phase: string;
  logged_at: string;
}

// Mindset prompts for Emo/spir growth and Root categories
const MINDSET_PROMPTS: Record<string, string> = {
  'Observe breath!': 'Just observe. No judgement. Be present with the breath.',
  'Sunlight': '15 minutes of warmth. Let the light reset your body.',
  'Morning water': 'Hydrate before anything. Start the day clean.',
  'Breakfast': 'Be grateful for the food. Eat slowly.',
  'routine': 'Structure over motivation. Show up consistently.',
  'Celebrating Journal': 'Grateful for the small wins this week.',
  'Create happy memories': 'Make someone smile today. Be present in the joy.',
  'Enjoy the feeling': 'Savour this moment. You deserve to feel good.',
  'Focus on needs/desires': 'What matters most to me right now? Listen within.',
  'Find a starting point': 'Every journey begins with one step. Just begin.',
  'Serious about intent, playful execution': 'Hold the vision, dance with the process.',
  'Proactive choice & action @ life': 'I choose how I respond. I am the author of my life.',
  'Humour Writing': 'Make situations lighter. Find the absurd, and play with it.',
  'Waking up practise': 'Feel the energy. Affirmations of loving self.',
  'Check routine before sleep': 'Review the day. What went well? Release what did not.',
  'Leisure activities': 'This is one of my first callings. Just enjoy it.',
  'Letter to future self': 'Write with honesty. Your future self will thank you.',
  'Board of mentors': 'Seek wisdom from those who have walked before you.',
  'Review each category': 'Step back. See the whole picture. Adjust with intention.',
  'Liesure write': 'Write freely. Let the words flow without judgement.',
  'Love/care with bhabhi': 'Be present. Listen. Don\'t give advice.',
  'Change bedsheet': 'Small acts of care for your space are acts of self-love.',
  'Painting': 'Express what words cannot. Let colour speak.',
  'Direction': 'Clarity comes from action, not just thinking.',
  'Credit card': 'Financial discipline is self-respect.',
  'Upskill for freedom': 'Skills are tools of liberation. Invest in yourself.',
  'Check anger trap': 'Notice the anger. Don\'t suppress, don\'t react. Observe.',
  'Recap you are here': 'Be here now. The present is the only moment that exists.',
  'Find fixed mindset personas!': 'Recognise patterns. Choose growth over comfort.',
  'Check ahamform': 'Who am I becoming? Align identity with intention.',
  'Personality type of unjust hold on it': 'Notice the pattern. Release attachment to being right.',
  'Read about Vata': 'Knowledge of the body is knowledge of the self.',
  'Teal sweal self love book': 'Self-love is the foundation. Everything grows from here.',
  'Story telling': 'Every life is a story. Learn to tell yours with heart.',
  'Structuring': 'Structure creates freedom. Build systems that serve you.',
  'Pick something from chakra': 'Energy awareness. Listen to what your body needs.',
  'Reread shame book': 'Shame loses power when spoken. Keep understanding it.',
  'Read about trauma bond': 'Understanding patterns breaks cycles. Stay curious.',
  'India as a society what are strenght and weakeness': 'Understand the collective to understand yourself.',
  'Use deactivating strategy with work': 'Detach from outcome. Engage with process.',
  'Read on endorphins/oxytocin': 'Understand your chemistry. Leverage it for wellbeing.',
  'Regret mininsing': 'Make peace with past choices. They led you here.',
  'Find Group celebrations': 'Joy shared is joy multiplied.',
  'Growth mindset book': 'Every challenge is a classroom. Stay open.',
  'Fantastic fungi': 'Nature holds profound lessons. Stay curious.',
  'Boundaries recap': 'Healthy boundaries are acts of self-love.',
  'Ethnography': 'Understanding people is understanding yourself.',
  'Find sociologists in India': 'Seek teachers. The world is full of them.',
  'Read 5 aesop': 'Ancient wisdom, modern application.',
  'Barua sir': 'Mentors shape us. Honor those connections.',
  'Massage': 'The body holds stories. Let them be released.',
  'Nookala': 'Maintain meaningful connections across distance.',
  'Message Surender': 'Reach out. Connection is a practice.',
  'Shriraj': 'Brotherhood is built one conversation at a time.',
  'Call mummy': 'She carries you in her heart. Return the love.',
  'Bed time water': 'End the day as you began — with care for the body.',
  'Night hygiene': 'Small rituals of care. Honor the body that carries you.',
  'B12 injections': 'Health maintenance is an act of self-respect.',
  'Yearly test medical': 'Prevention is wisdom in action.',
  'Detan': 'Care for the body is care for the spirit.',
  'Diet': 'Food is medicine. Choose with intention.',
  'Ring': 'A symbol of commitment. Choose it with love.',
  'Dad gift': 'Express love through action.',
};

function getMindsetPrompt(title: string, category: string): string | null {
  // Direct match
  if (MINDSET_PROMPTS[title]) return MINDSET_PROMPTS[title];

  // Emo/spir growth category — give prompts to meaningful titles
  if (category === 'Emo/spir growth') {
    // Skip very short/simple titles or URLs
    if (title.length < 8 || title.startsWith('http')) return null;
    return 'Presence and self-awareness. What is this teaching you about yourself?';
  }

  // Root category — only for meaningful titles
  if (category === 'Root') {
    if (title.length < 8 || title.startsWith('http')) return null;
    // Already checked direct match above, skip URLs and short titles
    return null;
  }

  return null;
}

// Deterministic hash to distribute tasks across days
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

// CSV data from Any.do export (173 tasks)
const CSV_DATA = `Read about Vata,Root,16 May 2026,12:00 PM,Monthly,2 Month,Day of month,N/A,16 Jul 2025,Yes,None,None,Normal,16 Jul 2025
Find out books to reads for self awareness,Read,,,None,1 None,Day of month,Sun,25 Jun 2022,Yes,Four agreements ,None,Normal,18 Jun 2022
https://www.youtube.com/watch?v=eLfXpRkVZaI Sharing a video talk by Otto Scharmer that expands what we covered on Deep Listening. Happy listening!,Read,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,17 Sept 2022
Power naps,Health,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,01 Oct 2022
Restaurant's kitchen,Fun,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,22 Oct 2022
routine,Root,02 Apr 2026,09:00 PM,Daily,1 Dai,Day of month,Mon,28 Dec 2025,Yes,None,None,Normal,12 Dec 2025
https://x.com/RayDalio/status/2022788750388998543,Root,16 Feb 2026,11:44 AM,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,16 Feb 2026
Leisure activities,Root,02 Apr 2026,03:00 PM,Daily,1 Dai,Day of month,N/A,02 Apr 2025,Yes,None,None,Normal,02 Apr 2025
Detan,Health,22 Feb 2026,11:00 AM,Weekly,2 Week,Day of month,Mon,30 Jun 2025,Yes,None,None,Normal,27 Oct 2022
Monthly expenses analysis,Finance,03 Jan 2026,11:10 AM,Monthly,1 Month,Day of week,Tue,02 Apr 2023,Yes,None,None,Normal,17 Oct 2022
Celebrating Journal,Root,02 Apr 2026,03:00 PM,Weekly,1 Week,Day of month,"Mon, Fri",02 Apr 2025,Yes,None,None,Normal,02 Apr 2025
Call mummy,Family,01 Apr 2026,08:30 PM,Daily,1 Dai,Day of month,Sun,23 Oct 2023,Yes,None,None,Normal,15 Oct 2022
Golf diners,Fun,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,15 Oct 2022
Read about war,Read,,,None,1 None,Day of month,Mon,,Yes,None,None,Normal,25 Sept 2022
India as a society what are strenght and weakeness ,Emo/spir growth,,,None,1 None,Day of month,Sat,09 Feb 2024,Yes,None,None,Normal,09 Feb 2024
Create happy memories ,Root,02 Apr 2026,04:04 AM,Daily,1 Dai,Day of month,Wed,04 Mar 2025,Yes,None,None,Normal,04 Mar 2025
How to create a mafia,Fun,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,31 Dec 2022
Rue da liban ,Mumbai,,,None,1 None,Day of month,Fri,23 May 2024,Yes,None,None,Normal,23 May 2024
Check anger trap,Root,23 Jun 2026,04:44 PM,Monthly,3 Month,Day of month,Tue,23 Dec 2024,Yes,None,None,Normal,23 Dec 2024
Recap you are here,Root,18 Jun 2026,07:00 PM,Monthly,3 Month,Day of month,Tue,18 Nov 2024,Yes,None,None,Normal,18 Nov 2024
Franz kafka,Read,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,02 Jan 2023
Constitution,Read,,,None,1 None,Day of month,Fri,08 Jun 2023,Yes,None,None,Normal,30 Apr 2023
Barua sir,Root,04 Sept 2026,06:57 PM,Monthly,6 Month,Day of month,Tue,04 May 2023,Yes,None,None,Normal,01 May 2023
Morning water,Root,02 Apr 2026,07:57 AM,Daily,1 Dai,Day of month,Wed,06 Apr 2023,Yes,None,None,Normal,06 Apr 2023
Read on endorphins/oxytocin,Emo/spir growth,,,None,1 None,Day of month,Tue,15 Jan 2024,Yes,None,None,Normal,25 Dec 2023
Massage,Root,14 Feb 2026,12:00 PM,Monthly,1 Month,Day of month,Sun,14 Jun 2025,Yes,None,None,Normal,24 May 2025
Observe breath! ,Root,02 Apr 2026,08:55 PM,Daily,1 Dai,Day of month,Wed,17 Sept 2024,Yes,None,None,Normal,17 Sept 2024
"Serious about intent, playful execution ",Root,02 Apr 2026,10:00 AM,Daily,1 Dai,Day of month,Thu,23 Apr 2025,Yes,None,None,Normal,23 Apr 2025
Aswad restayrent ,Mumbai,,,None,1 None,Day of month,Sun,07 Dec 2024,Yes,None,None,Normal,07 Dec 2024
Bency,Social,11 Apr 2026,12:44 PM,Weekly,2 Week,Day of month,Sun,29 Mar 2025,Yes,None,None,Normal,29 Mar 2025
Painting ,Root,09 Apr 2026,12:18 AM,Monthly,1 Month,Day of month,Sun,09 Mar 2024,Yes,None,None,Normal,09 Mar 2024
Upskill for freedom,Root,18 Apr 2026,09:00 AM,Monthly,1 Month,Day of month,Wed,18 Jun 2024,Yes,None,None,Normal,08 Mar 2024
Dad gift ,Root,01 Apr 2026,11:34 AM,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,16 Mar 2026
https://www.goodreads.com/book/show/8718,Read,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,29 Oct 2022
Book of economics,Duniyadari,,,None,1 None,Day of month,Sun,20 Jan 2024,Yes,None,None,Normal,23 Dec 2023
Rent,Chores,17 Mar 2026,10:00 AM,Monthly,1 Month,Day of month,Thu,17 Sept 2025,Yes,None,None,Normal,17 Sept 2025
Find a starting point ,Root,02 Apr 2026,09:04 AM,Daily,1 Dai,Day of month,Sun,07 Dec 2024,Yes,None,None,Normal,07 Dec 2024
Use deactivating strategy with work,Emo/spir growth,,,None,1 None,Day of month,Mon,04 Feb 2024,Yes,None,None,Normal,04 Feb 2024
Meet type of artists,Social,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,09 Apr 2023
Growth mindset book,Emo/spir growth,30 Aug 2025,09:33 PM,Monthly,3 Month,Day of month,Thu,30 Mar 2024,Yes,None,None,Normal,14 Mar 2024
Find Group celebrations ,Emo/spir growth,23 Feb 2026,01:26 PM,Weekly,2 Week,Day of month,Tue,17 Mar 2025,Yes,None,None,Normal,19 Mar 2025
Shriraj,Root,18 Apr 2026,10:49 AM,Weekly,3 Week,Day of month,Sun,07 Apr 2024,Yes,None,None,Normal,19 Aug 2023
Diet,Health,24 Jan 2026,10:00 AM,Monthly,1 Month,Day of month,Wed,24 Apr 2025,Yes,None,None,Normal,07 Apr 2023
Upanishads and veda volumes ,Emo/spir growth,,,None,1 None,Day of month,Mon,15 Dec 2024,Yes,None,None,Normal,15 Dec 2024
Essentials harvard,Duniyadari,,,None,1 None,Day of month,Sun,07 Dec 2024,Yes,None,None,Normal,07 Dec 2024
Find fixed mindset personas! ,Root,18 Apr 2026,09:00 AM,Monthly,1 Month,Day of month,Wed,18 Jun 2024,Yes,None,None,Normal,12 Mar 2024
Invite friends ,Wedding,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,17 Mar 2026
Ring,Root,25 Mar 2026,08:37 PM,None,1 None,Day of month,Thu,25 Mar 2026,Yes,None,None,Normal,25 Mar 2026
Visit a farm,Fun,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,20 Mar 2023
Wall decision,Mumbai,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,12 Aug 2025
Liesure write,Root,07 Apr 2026,01:11 PM,Monthly,1 Month,Day of month,Sun,07 Jun 2025,Yes,None,None,Normal,07 Jun 2025
Voice course,Social,,,None,1 None,Day of month,Wed,02 Jul 2024,Yes,None,None,Normal,08 May 2024
Hindi literature ,Read,,,None,1 None,Day of month,Sat,03 May 2024,Yes,None,None,Normal,03 May 2024
Change bedsheet,Root,06 Apr 2026,09:52 PM,Weekly,1 Week,Day of month,Tue,16 Dec 2024,Yes,None,None,Normal,16 Dec 2024
Dad relatives,Wedding,06 Mar 2026,07:52 PM,None,1 None,Day of month,Sat,06 Mar 2026,Yes,None,None,Normal,06 Mar 2026
Meet people of all age group(eld),Social,12 Apr 2026,01:00 PM,Weekly,2 Week,Day of month,Mon,02 Apr 2023,Yes,"Presitge, brigade, sobha ; Parks",None,Normal,02 Apr 2023
Barrier to entry less in histor,Emo/spir growth,,,None,1 None,Day of month,Sat,09 Feb 2024,Yes,None,None,Normal,09 Feb 2024
Credit card,Root,29 Mar 2026,02:57 AM,None,1 None,Day of month,Mon,29 Mar 2026,Yes,None,None,Normal,29 Mar 2026
Books on evolution and adaptation ,Emo/spir growth,,,None,1 None,Day of month,Sat,19 Jan 2024,Yes,None,None,Normal,23 Dec 2023
Find courses in anthropology and sociology for India,Emo/spir growth,,,None,1 None,Day of month,Sat,19 Jan 2024,Yes,None,None,Normal,19 Jan 2024
https://nesslabs.com/how-to-think-better,Read,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,30 Oct 2022
Speak with Rishil,Family,10 Apr 2026,06:53 PM,Monthly,1 Month,Day of month,Tue,10 Apr 2023,Yes,None,None,Normal,10 Apr 2023
Read 5 aesop,Emo/spir growth,30 Dec 2025,11:00 AM,Monthly,2 Month,Day of month,N/A,30 Jun 2025,Yes,None,https://read.gov/aesop/080.html,Normal,15 Dec 2024
Mom relatives ,Wedding,06 Mar 2026,07:52 PM,None,1 None,Day of month,Sat,06 Mar 2026,Yes,None,None,Normal,06 Mar 2026
Indian sociology & middle class,Emo/spir growth,,,None,1 None,Day of month,Sat,09 Feb 2024,Yes,None,None,Normal,09 Feb 2024
Board of mentors,Root,02 Apr 2026,01:00 PM,Monthly,1 Month,Day of month,N/A,02 Sept 2023,Yes,None,None,Normal,27 Aug 2023
Travel bottels,Root,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,28 Jul 2024
https://twitter.com/RomeenSheth/status/1630615549934813189?s=20,Read,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,01 Mar 2023
Review with papa and bhaiya,Root,28 May 2026,10:05 PM,Monthly,2 Month,Day of month,Thu,28 Feb 2024,Yes,None,None,Normal,18 Jan 2024
Bhau daji lad,Mumbai,,,None,1 None,Day of month,Fri,23 May 2024,Yes,None,None,Normal,23 May 2024
Abhishek shah,Mumbai,24 Mar 2026,07:37 PM,Monthly,6 Month,Day of month,Sat,24 Nov 2023,Yes,None,None,Normal,17 Nov 2023
Do financial planning(doc),Root,26 Jun 2026,03:00 AM,Monthly,3 Month,Day of month,Sun,26 Aug 2023,Yes,None,None,Normal,26 Aug 2023
Trends,Root,31 Jul 2026,10:00 AM,Monthly,3 Month,Day of month,Tue,31 Mar 2025,Yes,None,None,Normal,16 Dec 2024
Focus on needs/desires,Root,02 Apr 2026,06:47 AM,Daily,1 Dai,Day of month,Sun,24 May 2025,Yes,None,None,Normal,24 May 2025
https://refind.com/links/135517210,Read,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,30 Oct 2022
Slip ons,Fashion,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,09 Apr 2025
Pick something from chakra,Emo/spir growth,07 Dec 2025,10:56 PM,Monthly,1 Month,Day of month,Mon,07 Jan 2024,Yes,None,None,Normal,07 Jan 2024
Engagement photos,Root,14 Mar 2026,12:38 AM,None,1 None,Day of month,Sun,14 Mar 2026,Yes,None,None,Normal,14 Mar 2026
Gaurav sen(code?,Duniyadari,,,None,1 None,Day of month,Sat,24 Mar 2023,Yes,None,None,Normal,23 Mar 2023
Velvet boars,Mumbai,,,None,1 None,Day of month,Sat,03 May 2024,Yes,None,None,Normal,03 May 2024
https://www.goodreads.com/book/show/34536488,Read,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,29 Oct 2022
Tirupati,Root,01 Mar 2026,10:53 AM,None,1 None,Day of month,Mon,01 Mar 2026,Yes,None,None,Normal,01 Mar 2026
https://www.goodreads.com/book/show/59696349,Read,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,21 Mar 2023
Invest 75 in groww,Finance,30 Apr 2026,10:01 PM,Monthly,1 Month,Day of month,Fri,30 Jan 2024,Yes,None,None,Normal,18 Jan 2024
Night hygiene ,Health,07 Dec 2025,10:00 PM,Daily,1 Dai,Day of month,Wed,13 Apr 2023,Yes,Neck; Toothbrush; Eye; Gel,None,Normal,13 Apr 2023
Check routine before sleep,Root,18 Apr 2026,09:00 PM,Weekly,2 Week,Day of month,Sun,22 Jun 2024,Yes,None,None,Normal,06 Jan 2024
Language ,Fun,,,None,1 None,Day of month,Mon,29 Dec 2024,Yes,None,None,Normal,29 Dec 2024
Bed time water,Health,29 Dec 2025,10:58 PM,Daily,1 Dai,Day of month,Wed,06 Apr 2023,Yes,None,None,Normal,06 Apr 2023
Wallet,Root,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,01 Apr 2026
Humour Writing ,Root,02 Apr 2026,11:10 AM,Daily,1 Dai,Day of month,Fri,25 Dec 2025,Yes,None,None,Normal,25 Dec 2025
Tiles,Mumbai,,,None,1 None,Day of month,Tue,07 Apr 2025,Yes,None,None,Normal,21 Jan 2025
Pre wedding things,Root,25 Mar 2026,04:05 PM,None,1 None,Day of month,Thu,25 Mar 2026,Yes,None,None,Normal,25 Mar 2026
Personality type of unjust hold on it,Root,30 Mar 2026,04:18 PM,None,1 None,Day of month,Tue,30 Mar 2026,Yes,None,None,Normal,30 Mar 2026
Flat,Family,,,None,1 None,Day of month,Sun,22 Jun 2024,Yes,None,None,Normal,18 Jun 2024
Breakfast ,Root,02 Apr 2026,08:31 AM,Daily,1 Dai,Day of month,Wed,06 Apr 2023,Yes,None,None,Normal,06 Apr 2023
Movement games,Root,16 Apr 2026,09:17 PM,Weekly,2 Week,Day of month,Fri,06 Feb 2025,Yes,None,None,Normal,06 Feb 2025
Calculus,Duniyadari,,,None,1 None,Day of month,Thu,24 Jan 2024,Yes,None,None,Normal,25 Dec 2023
Nikhil Jain,Root,25 Mar 2026,07:26 PM,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,25 Mar 2026
Edit friends list!,Wedding,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,25 Mar 2026
stabalise current things,Chores,16 Feb 2026,03:00 PM,Daily,1 Dai,Day of month,Tue,31 Mar 2025,Yes,None,None,Normal,31 Mar 2025
Recap you are here,Read,18 Jan 2026,01:00 PM,Monthly,2 Month,Day of month,N/A,18 Jul 2025,Yes,None,None,Normal,18 Jul 2025
Read hindi books,Read,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,21 Oct 2022
Check ahamform,Root,06 Jun 2026,12:00 PM,Monthly,3 Month,Day of month,Sun,06 Dec 2025,Yes,None,None,Normal,01 Jan 2025
Mirror work day 9,Chores,,,None,1 None,Day of month,Sun,29 Mar 2025,Yes,None,None,Normal,29 Mar 2025
Meet people from chitrakala parishad,Social,,,None,1 None,Day of month,Sun,06 May 2023,Yes,None,None,Normal,10 Apr 2023
Ethnography,Emo/spir growth,,,None,1 None,Day of month,Mon,07 Apr 2024,Yes,None,None,Normal,07 Apr 2024
Read about pride,Read,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,24 Dec 2022
Nookala,Root,24 Nov 2026,12:00 PM,Yearly,1 Year,Day of month,Tue,24 Nov 2025,Yes,None,None,Normal,01 Jan 2024
https://www.hotstar.com/in/tv/limitless-with-chris-hemsworth/1260115280,Health,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,12 Dec 2022
Proactive choice & action @ life,Root,02 Apr 2026,11:55 AM,Daily,1 Dai,Day of month,Thu,22 Jan 2025,Yes,None,None,Normal,22 Jan 2025
Chakra courses,Emo/spir growth,,,None,1 None,Day of month,Sun,14 Dec 2024,Yes,None,None,Normal,14 Dec 2024
Play lego,Fun,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,22 Jun 2024
Radical acceptance ,Read,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,30 Mar 2024
https://ceoworld.biz/2023/04/07/what-i-learned-about-investing-from-darwin/,Read,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,16 Apr 2023
Play vice city,Fun,,,None,1 None,Day of month,Sun,22 Jun 2024,Yes,None,None,Normal,02 May 2024
Reread shame book,Emo/spir growth,16 Nov 2025,09:31 PM,Monthly,3 Month,Day of month,Thu,16 Mar 2024,Yes,None,None,Normal,14 Mar 2024
Moby dick,Read,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,30 Jul 2023
Cryptography ,Read,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,06 Apr 2023
Abhijeet,Social,16 Apr 2026,10:00 AM,Monthly,3 Month,Day of month,Sat,16 Aug 2024,Yes,None,None,Normal,01 Apr 2023
Read books on diplomacy ,Read,,,None,1 None,Day of month,Mon,,Yes,None,None,Normal,25 Dec 2022
Photo on ig about shreyaa,Root,25 Mar 2026,04:29 PM,None,1 None,Day of month,Thu,25 Mar 2026,Yes,None,None,Normal,25 Mar 2026
Enjoy the feeling,Root,02 Apr 2026,06:25 PM,Daily,1 Dai,Day of month,Sat,23 Aug 2024,Yes,None,None,Normal,23 Aug 2024
Story telling ,Emo/spir growth,17 Feb 2026,11:10 AM,Monthly,1 Month,Day of month,Mon,17 Dec 2023,Yes,None,None,Normal,17 Dec 2023
Review each category,Root,25 Apr 2026,01:18 PM,Weekly,3 Week,Day of month,Sun,14 Dec 2024,Yes,None,None,Normal,14 Dec 2024
Message Surender,Root,26 Aug 2026,12:00 AM,Monthly,6 Month,Day of month,Sat,26 Aug 2023,Yes,None,None,Normal,25 Aug 2023
Read innovation,Wedding,01 Apr 2026,02:15 PM,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,26 Mar 2026
Pune weather institute ,Explore,,,None,1 None,Day of month,Sat,13 Dec 2024,Yes,None,None,Normal,13 Dec 2024
"Guns, germs and steel",Read,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,16 Jan 2023
Structuring as a skill,Duniyadari,27 Mar 2026,10:09 AM,Weekly,2 Week,Day of month,Sat,15 Nov 2024,Yes,None,None,Normal,15 Nov 2024
King lear,Read,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,30 Jul 2023
Read about trauma bond,Emo/spir growth,,,None,1 None,Day of month,Sun,10 Jun 2023,Yes,None,None,Normal,28 May 2023
Sunlight ,Emo/spir growth,02 Apr 2026,09:00 AM,Daily,1 Dai,Day of month,Wed,06 Apr 2023,Yes,None,None,Normal,06 Apr 2023
Game theory veritasian,Explore,19 Mar 2026,12:44 PM,None,1 None,Day of month,Fri,19 Mar 2026,Yes,None,None,Normal,19 Mar 2026
Regret mininsing,Emo/spir growth,,,None,1 None,Day of month,Wed,19 Mar 2023,Yes,None,None,Normal,14 Feb 2023
Laundry,Chores,14 Mar 2026,10:20 AM,Weekly,1 Week,Day of month,Sun,19 Jul 2025,Yes,None,None,Normal,15 Jul 2025
Direction,Root,30 Mar 2026,05:02 PM,None,1 None,Day of month,Tue,30 Mar 2026,Yes,None,None,Normal,30 Mar 2026
Find liberal arts in Bangalore ,Explore,,,None,1 None,Day of month,Sat,05 Jan 2024,Yes,None,None,Normal,27 Dec 2023
Fantastic fungi,Emo/spir growth,,,None,1 None,Day of month,Sat,22 Mar 2024,Yes,None,None,Normal,22 Mar 2024
"Irrervisible events on mental health, how much volatility is okay",Read,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,05 Mar 2023
Yearly test medical,Root,15 Jul 2026,09:56 AM,Yearly,1 Year,Day of month,Wed,15 Jul 2025,Yes,None,None,Normal,15 Jul 2025
https://www.quantamagazine.org/inside-the-proton-the-most-complicated-thing-imaginable-20221019/,Read,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,30 Oct 2022
https://collabfund.com/blog/expectations-and-reality/,Read,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,30 Oct 2022
Read on economics,Read,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,29 Jul 2023
Visit school,Mumbai,,,None,1 None,Day of month,Thu,03 Jan 2024,Yes,None,None,Normal,21 Dec 2023
Teal sweal self love book,Emo/spir growth,22 Apr 2026,09:20 AM,Monthly,3 Month,Day of month,Tue,22 May 2025,Yes,None,None,Normal,22 Mar 2025
Manjuman boys,Fun,,,None,1 None,Day of month,Mon,29 Dec 2024,Yes,None,None,Normal,29 Dec 2024
Love/care with bhabhi,Root,07 Apr 2026,08:38 AM,Weekly,1 Week,Day of month,Wed,01 Apr 2025,Yes,None,None,Normal,01 Apr 2025
California burrito,Professional ,,,None,1 None,Day of month,Thu,03 Jul 2024,Yes,None,None,Normal,05 May 2024
Harshita,Social,23 May 2026,09:00 AM,Monthly,2 Month,Day of month,Sun,23 Apr 2023,Yes,None,None,Normal,01 Apr 2023
Harish Roorkee senior,Mumbai,,,None,1 None,Day of month,Sat,30 May 2025,Yes,None,None,Normal,26 Mar 2025
Find coherent people,Social,,,None,1 None,Day of month,Mon,07 Jan 2024,Yes,None,None,Normal,27 Dec 2023
Find sociologists in India,Emo/spir growth,,,None,1 None,Day of month,Mon,07 Jan 2024,Yes,None,None,Normal,25 Dec 2023
Boundaries recap,Emo/spir growth,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,14 Mar 2024
Letter to future self,Root,29 May 2026,01:37 AM,Monthly,2 Month,Day of month,Mon,29 Dec 2024,Yes,None,One psychological exercise you might like to try is writing a letter to your future self. Can you imagine who you'll be then and what you would like to say to that person now? Write about who you are now and what's important to you. Writing will help you articulate what matters most to you.,Normal,29 Dec 2024
Solve maths/coding problems to build rationality ,Duniyadari,02 Apr 2026,05:37 PM,Monthly,1 Month,Day of month,Tue,02 Dec 2024,Yes,None,None,Normal,02 Dec 2024
B12 injections ,Root,21 Apr 2026,12:59 AM,Weekly,2 Week,Day of month,Wed,16 Jul 2025,Yes,None,None,Normal,16 Jul 2025
Message Saurabh,Family,06 May 2026,06:41 PM,Monthly,1 Month,Day of week,Tue,25 Feb 2024,Yes,None,None,Normal,26 Feb 2024
Tor,Social,10 Feb 2026,07:51 PM,Monthly,2 Month,Day of month,Thu,10 Jan 2024,Yes,None,None,Normal,03 Jan 2024
AI video,Root,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,02 Apr 2026
https://books.google.co.in/books/about/The_Practice_of_Adaptive_Leadership.html?id=DxnqsuXlKbEC&printsec=frontcover&source=kp_read_button&hl=en&newbks=1&newbks_redir=0&gboemv=1&redir_esc=y#v=onepage&q&f=false,Read,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,30 Oct 2022
Structuring,Emo/spir growth,17 Feb 2026,11:09 AM,Monthly,1 Month,Day of month,Mon,17 Dec 2023,Yes,None,None,Normal,17 Dec 2023
Clean badminton racket,Root,27 Mar 2026,08:57 PM,None,1 None,Day of month,Sat,27 Mar 2026,Yes,None,None,Normal,27 Mar 2026
Use of lateral thinking,Read,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,22 Jul 2025
Skin care: checkin & implement,Read,27 Mar 2026,09:03 PM,Monthly,2 Month,Day of month,Fri,27 Oct 2022,Yes,Natural products ; Side effects ; Serum and eye cream,None,Normal,14 Oct 2022
https://www.amazon.in/Piece-Action-Middle-Class-Joined/dp/1476744890,Read,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,28 Aug 2022
How spotify got built,Duniyadari,,,None,N/A,N/A,N/A,N/A,N/A,None,https://m.youtube.com/watch?v=jTM7ZCKEUGM,Normal,31 Oct 2022
Waking up practise,Root,28 Apr 2026,01:00 PM,Monthly,1 Month,Day of month,N/A,28 Mar 2025,Yes,None,None,Normal,24 Mar 2025
Good strategy bad strategy,Read,,,None,1 None,Day of month,Sun,,Yes,None,None,Normal,10 Sept 2022
Gaur gift,Social,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,28 Aug 2022
HDFC bank 2.0,Read,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,28 Aug 2022
Personal website,Root,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,03 Jun 2025
password for google doc,Root,06 Apr 2026,01:43 PM,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,27 Mar 2026
Shriraj bachelors,Root,26 Mar 2026,02:41 PM,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,26 Mar 2026
https://www.amazon.in/What-Every-Body-Saying-Navarro/dp/0061438294,Read,,,None,N/A,N/A,N/A,N/A,N/A,None,None,Normal,30 Sept 2022`;

function buildActivities(): { activities: SeedActivity[]; logs: SeedLog[] } {
  const activities: SeedActivity[] = [];
  const logs: SeedLog[] = [];
  const now = nowISO();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lines = CSV_DATA.split('\n');

  // Parse all CSV tasks
  interface ParsedTask {
    title: string;
    category: string;
    dueDate: string;
    dueTime: string;
    repeatFreq: string;
    subtasksStr: string;
    notes: string;
    priority: string;
  }

  const tasks: ParsedTask[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const fields = parseCSVLine(line);
    if (fields.length < 14) continue;

    tasks.push({
      title: fields[0].trim(),
      category: fields[1].trim(),
      dueDate: fields[2].trim(),
      dueTime: fields[3].trim(),
      repeatFreq: fields[4].trim(),
      subtasksStr: fields[10].trim(),
      notes: fields[11].trim(),
      priority: fields[12].trim(),
    });
  }

  // Separate tasks into scheduled (have due date+time) and unscheduled
  const scheduledTasks: Array<ParsedTask & { parsedDate: Date; parsedTime: { hour: number; min: number } }> = [];
  const unscheduledTasks: ParsedTask[] = [];

  for (const task of tasks) {
    const parsedDate = parseAnyDoDate(task.dueDate);
    const parsedTime = parseTime(task.dueTime);

    if (parsedDate && parsedTime) {
      scheduledTasks.push({ ...task, parsedDate, parsedTime });
    } else {
      unscheduledTasks.push(task);
    }
  }

  // --- SCHEDULED TASKS: distribute across 7 days past + 7 days future ---

  // Completed activities: days -7 to -1
  // Today: some completed, some in-progress, some planned
  // Future: days +1 to +7

  // Sort scheduled tasks by due date
  scheduledTasks.sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

  // Group: past due dates -> today (carry forward), future -> distribute across next 7 days
  const pastDueTasks: typeof scheduledTasks = [];
  const futureDueTasks: typeof scheduledTasks = [];
  const todayTasks: typeof scheduledTasks = [];

  for (const task of scheduledTasks) {
    const dueDate = new Date(task.parsedDate);
    dueDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      pastDueTasks.push(task);
    } else if (diffDays === 0) {
      todayTasks.push(task);
    } else {
      futureDueTasks.push(task);
    }
  }

  // Helper to add a scheduled activity
  function addScheduledActivity(
    task: ParsedTask & { parsedTime: { hour: number; min: number } },
    dayOff: number,
    status: string,
    isCompleted: boolean,
  ): SeedActivity {
    const categoryId = CATEGORY_MAP[task.category] || 'sys-personal';
    const recurrence = mapFrequency(task.repeatFreq);
    const priority = mapPriority(task.priority);
    const subtasks = parseSubtasks(task.subtasksStr);
    const mindset = getMindsetPrompt(task.title, task.category);
    const duration = estimateDuration(task.title, task.category);

    const startTime = isoAt(dayOff, task.parsedTime.hour, task.parsedTime.min);
    const act: SeedActivity = {
      id: uuid(),
      activity_type: 'TIME_BLOCK',
      title: task.title,
      description: (task.notes && task.notes !== 'None') ? task.notes : null,
      start_time: startTime,
      duration_minutes: duration,
      category_id: categoryId,
      assigned_date: null,
      is_scheduled: true,
      status,
      priority,
      recurrence_type: recurrence,
      mindset_prompt: mindset,
      actual_start: isCompleted ? startTime : null,
      actual_end: isCompleted ? isoAt(dayOff, task.parsedTime.hour, task.parsedTime.min + duration) : null,
    };
    if (subtasks) act.subtasks = subtasks;
    return act;
  }

  function estimateDuration(title: string, _category: string): number {
    const t = title.toLowerCase();
    if (t.includes('water') || t.includes('credit card') || t.includes('ring') || t.includes('wallet')) return 10;
    if (t.includes('breakfast') || t.includes('breath') || t.includes('sunlight') || t.includes('hygiene')) return 15;
    if (t.includes('journal') || t.includes('routine') || t.includes('bedsheet')) return 20;
    if (t.includes('call') || t.includes('message') || t.includes('bency') || t.includes('nookala')) return 30;
    if (t.includes('laundry') || t.includes('massage') || t.includes('detan') || t.includes('diet')) return 45;
    if (t.includes('leisure') || t.includes('movement') || t.includes('meet people') || t.includes('board of mentors')) return 60;
    if (t.includes('planning') || t.includes('financial') || t.includes('review')) return 45;
    if (t.includes('writing') || t.includes('write')) return 30;
    if (t.includes('injection') || t.includes('b12')) return 15;
    return 30; // default
  }

  // --- RECURRING ACTIVITIES: ONE row each (recurrence engine generates other days) ---
  // --- NON-RECURRING PAST: distributed across days -7 to -1 as COMPLETED ---
  // --- NON-RECURRING TODAY: some completed, some in-progress, rest planned ---
  // --- NON-RECURRING FUTURE: distributed across days +1 to +7 ---

  // Separate recurring from non-recurring among past-due tasks
  const recurringPastTasks = pastDueTasks.filter(t => mapFrequency(t.repeatFreq) !== 'NONE');
  const nonRecurringPastTasks = pastDueTasks.filter(t => mapFrequency(t.repeatFreq) === 'NONE');

  // Separate recurring from non-recurring among today tasks
  const recurringTodayTasks = todayTasks.filter(t => mapFrequency(t.repeatFreq) !== 'NONE');
  const nonRecurringTodayTasks = todayTasks.filter(t => mapFrequency(t.repeatFreq) === 'NONE');

  // Separate recurring from non-recurring among future tasks
  const recurringFutureTasks = futureDueTasks.filter(t => mapFrequency(t.repeatFreq) !== 'NONE');
  const nonRecurringFutureTasks = futureDueTasks.filter(t => mapFrequency(t.repeatFreq) === 'NONE');

  // --- RECURRING: Create exactly ONE row per recurring activity ---
  // Place it on the earliest sensible day so the recurrence engine covers other days.
  const allRecurringTasks = [...recurringPastTasks, ...recurringTodayTasks, ...recurringFutureTasks];
  const seenRecurringTitles = new Set<string>();

  for (const task of allRecurringTasks) {
    const titleKey = task.title.trim().toLowerCase();
    if (seenRecurringTitles.has(titleKey)) continue;
    seenRecurringTitles.add(titleKey);

    const freq = mapFrequency(task.repeatFreq);
    let dayOff: number;

    if (freq === 'DAILY' || freq === 'WEEKDAYS') {
      // Place original instance on day -7 so recurrence generates days -6 through today+
      dayOff = -7;
    } else if (freq === 'WEEKLY' || freq === 'BIWEEKLY') {
      // Place on day -7 (one week ago) so recurrence can generate this week's instance
      dayOff = -7;
    } else {
      // MONTHLY, BIMONTHLY, QUARTERLY, YEARLY — place on day -7
      dayOff = -7;
    }

    const act = addScheduledActivity(task, dayOff, 'COMPLETED', true);
    activities.push(act);
  }

  // --- NON-RECURRING PAST: distribute across days -7 to -1 as COMPLETED ---
  nonRecurringPastTasks.forEach((task, idx) => {
    const day = -7 + (idx % 7);
    const act = addScheduledActivity(task, day, 'COMPLETED', true);
    activities.push(act);
  });

  // --- NON-RECURRING TODAY: some completed, some in-progress, rest planned ---
  nonRecurringTodayTasks.forEach((task, idx) => {
    let status = 'PLANNED';
    let completed = false;
    if (idx < 2) { status = 'COMPLETED'; completed = true; }
    else if (idx < 3) { status = 'IN_PROGRESS'; completed = false; }
    const act = addScheduledActivity(task, 0, status, completed);
    activities.push(act);
  });

  // Carry forward: some past-due non-recurring tasks also appear on today as planned
  const carryForward = nonRecurringPastTasks.slice(0, 5);
  for (const task of carryForward) {
    const act = addScheduledActivity(task, 0, 'PLANNED', false);
    activities.push(act);
  }

  // --- NON-RECURRING FUTURE: distribute across days +1 to +7 ---
  nonRecurringFutureTasks.forEach((task, idx) => {
    const day = 1 + (simpleHash(task.title + idx) % 7);
    const act = addScheduledActivity(task, day, 'PLANNED', false);
    activities.push(act);
  });

  // --- UNSCHEDULED TASKS: appear as TASK type, no time ---
  for (const task of unscheduledTasks) {
    const categoryId = CATEGORY_MAP[task.category] || 'sys-personal';
    const recurrence = mapFrequency(task.repeatFreq);
    const priority = mapPriority(task.priority);
    const subtasks = parseSubtasks(task.subtasksStr);
    const mindset = getMindsetPrompt(task.title, task.category);
    const description = (task.notes && task.notes !== 'None') ? task.notes : null;

    const act: SeedActivity = {
      id: uuid(),
      activity_type: 'TASK',
      title: task.title,
      description,
      start_time: '',
      duration_minutes: estimateDuration(task.title, task.category),
      category_id: categoryId,
      assigned_date: null,
      is_scheduled: false,
      status: 'PLANNED',
      priority,
      recurrence_type: recurrence,
      mindset_prompt: mindset,
      actual_start: null,
      actual_end: null,
    };
    if (subtasks) act.subtasks = subtasks;
    activities.push(act);
  }

  // --- WATERMARK TEST DATA: untimed recurring activities (no start_time) ---
  // These appear as watermark chips (recurrence_type !== 'NONE' && start_time === '')
  const watermarkActivities: SeedActivity[] = [
    {
      id: uuid(),
      activity_type: 'TASK',
      title: 'Drink water',
      description: null,
      start_time: '',
      duration_minutes: 0,
      category_id: 'sys-health',
      assigned_date: null,
      is_scheduled: false,
      status: 'PLANNED',
      priority: 'MEDIUM',
      recurrence_type: 'DAILY',
      mindset_prompt: 'Stay hydrated',
      actual_start: null,
      actual_end: null,
    },
    {
      id: uuid(),
      activity_type: 'TASK',
      title: 'Stand and stretch',
      description: null,
      start_time: '',
      duration_minutes: 0,
      category_id: 'sys-health',
      assigned_date: null,
      is_scheduled: false,
      status: 'PLANNED',
      priority: 'MEDIUM',
      recurrence_type: 'DAILY',
      mindset_prompt: 'Movement is medicine',
      actual_start: null,
      actual_end: null,
    },
    {
      id: uuid(),
      activity_type: 'TASK',
      title: 'Gratitude moment',
      description: null,
      start_time: '',
      duration_minutes: 0,
      category_id: 'sys-personal',
      assigned_date: null,
      is_scheduled: false,
      status: 'PLANNED',
      priority: 'MEDIUM',
      recurrence_type: 'DAILY',
      mindset_prompt: 'Notice what\'s good',
      actual_start: null,
      actual_end: null,
    },
  ];
  activities.push(...watermarkActivities);

  // --- EXPERIENCE LOGS for completed activities ---
  const reflections = [
    'Good session. Felt present throughout.',
    'Productive morning. Energy was high.',
    'Solid routine. Building consistency.',
    'Felt calm and centered after this.',
    'Better than yesterday. Progress is progress.',
    'Struggled a bit but showed up. That counts.',
    'Really enjoyed this. Want to do more.',
    'Body feels good after this. Self-care matters.',
    'Important conversation. Grateful for the connection.',
    'Deep focus hit midway. Best part of the day.',
    'Completed with intention. Quality over speed.',
    'Felt grounded. Structure creates freedom.',
    'Simple but meaningful. Small wins compound.',
    'Needed this break. Rest is productive too.',
    'Great momentum. Carried energy into next task.',
  ];

  const completedActivities = activities.filter(a => a.status === 'COMPLETED');
  // Generate logs for ~60% of completed activities
  completedActivities.forEach((act, idx) => {
    if (idx % 5 < 3) { // roughly 60%
      const mood = 3 + (simpleHash(act.title + 'mood') % 3); // 3-5
      const energy = 3 + (simpleHash(act.title + 'energy') % 3); // 3-5
      const reflectionIdx = simpleHash(act.title + 'ref') % reflections.length;

      logs.push({
        activity_id: act.id,
        mood,
        energy,
        completion_pct: 100,
        reflection: reflections[reflectionIdx],
        would_repeat: 'YES',
        log_phase: 'AFTER',
        logged_at: act.actual_end || act.start_time,
      });
    }
  });

  return { activities, logs };
}

interface SeedGoal {
  id: string;
  user_id: string;
  title: string;
  metric_type: string;
  target_value: number;
  frequency: string;
  category_id: string;
  specific_days: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

function buildGoals(): SeedGoal[] {
  const ts = nowISO();
  return [
    { id: uuid(), user_id: USER_ID, title: 'Read every day', metric_type: 'TIME', target_value: 30, frequency: 'DAILY', category_id: 'sys-learning', specific_days: null, is_active: 1, created_at: ts, updated_at: ts },
    { id: uuid(), user_id: USER_ID, title: 'Exercise regularly', metric_type: 'SESSIONS', target_value: 4, frequency: 'WEEKLY', category_id: 'sys-health', specific_days: null, is_active: 1, created_at: ts, updated_at: ts },
    { id: uuid(), user_id: USER_ID, title: 'Deep work focus', metric_type: 'TIME', target_value: 180, frequency: 'DAILY', category_id: 'sys-deep-work', specific_days: null, is_active: 1, created_at: ts, updated_at: ts },
    { id: uuid(), user_id: USER_ID, title: 'Connect with family', metric_type: 'SESSIONS', target_value: 3, frequency: 'WEEKLY', category_id: 'cust-family', specific_days: null, is_active: 1, created_at: ts, updated_at: ts },
    { id: uuid(), user_id: USER_ID, title: 'Creative time', metric_type: 'TIME', target_value: 60, frequency: 'WEEKLY', category_id: 'sys-creative', specific_days: null, is_active: 1, created_at: ts, updated_at: ts },
  ];
}

export async function seedDummyData(): Promise<void> {
  const SEED_VERSION = '16';
  const isWeb = typeof localStorage !== 'undefined';

  // Check if already seeded
  if (isWeb) {
    if (localStorage.getItem('dayflow_seed_version') === SEED_VERSION) return;
  } else {
    // On native, check via a flag in the DB itself (AsyncStorage may not be ready)
    try {
      const db = await getDb();
      // Use a simple table to track seed version
      await db.execAsync('CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT)');
      const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', ['seed_version']);
      if (row?.value === SEED_VERSION) {
        console.log('[DayFlow] Seed already at version', SEED_VERSION);
        return;
      }
    } catch (err) {
      console.log('[DayFlow] Seed version check failed, will re-seed:', err);
    }
  }

  const { activities, logs } = buildActivities();
  const seedNow = nowISO();

  const categoryRows = [
    ...SYSTEM_CATEGORIES.map(c => ({
      id: c.id, user_id: c.user_id, name: c.name, color: c.color,
      icon: c.icon, is_system: 1, sort_order: c.sort_order, synced: 1,
    })),
    ...CUSTOM_CATEGORIES.map(c => ({
      id: c.id, user_id: USER_ID, name: c.name, color: c.color,
      icon: c.icon, is_system: 0, sort_order: c.sort_order, synced: 1,
    })),
  ];

  const activityRows = activities.map(a => ({
    id: a.id, user_id: USER_ID,
    activity_type: a.activity_type ?? 'TIME_BLOCK',
    title: a.title,
    description: a.description ?? null,
    start_time: a.start_time,
    duration_minutes: a.duration_minutes, category_id: a.category_id,
    assigned_date: a.assigned_date ?? (a.is_scheduled ? a.start_time.substring(0, 10) : null),
    is_scheduled: a.is_scheduled ? 1 : 0,
    mindset_prompt: a.mindset_prompt, mindset_overridden: 0,
    recurrence_type: a.recurrence_type,
    recurrence_days: a.recurrence_days ? JSON.stringify(a.recurrence_days) : null,
    subtasks: a.subtasks ? JSON.stringify(a.subtasks) : null,
    status: a.status, priority: a.priority,
    actual_start: a.actual_start, actual_end: a.actual_end,
    created_at: seedNow, updated_at: seedNow, synced: 0, deleted: 0,
  }));

  const logRows = logs.map(l => ({
    id: uuid(), activity_id: l.activity_id, user_id: USER_ID,
    mood: l.mood, energy: l.energy, completion_pct: l.completion_pct,
    reflection: l.reflection, would_repeat: l.would_repeat,
    log_phase: l.log_phase, logged_at: l.logged_at, synced: 0, deleted: 0,
  }));

  const goalRows = buildGoals();

  if (isWeb) {
    // Web: write directly to localStorage
    const dbState = { categories: categoryRows, activities: activityRows, experience_logs: logRows, goals: goalRows };
    localStorage.setItem('dayflow_db', JSON.stringify(dbState));
    localStorage.setItem('dayflow_seed_version', SEED_VERSION);
    localStorage.setItem('dayflow_onboarded', 'true');
  } else {
    // Native: use SQLite via getDb
    try {
      const db = await getDb();
      // Delete existing seed data before re-inserting (FK order: logs -> activities -> goals -> categories)
      await db.runAsync('DELETE FROM experience_logs WHERE user_id = ?', [USER_ID]);
      await db.runAsync('DELETE FROM activities WHERE user_id = ?', [USER_ID]);
      await db.runAsync('DELETE FROM goals WHERE user_id = ?', [USER_ID]);
      await db.runAsync('DELETE FROM categories WHERE user_id = ? OR user_id IS NULL', [USER_ID]);
      for (const c of categoryRows) {
        await db.runAsync(
          `INSERT OR IGNORE INTO categories (id, user_id, name, color, icon, is_system, sort_order, synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [c.id, c.user_id, c.name, c.color, c.icon, c.is_system, c.sort_order, c.synced]
        );
      }
      for (const a of activityRows) {
        await db.runAsync(
          `INSERT OR IGNORE INTO activities (id, user_id, activity_type, title, description, assigned_date, start_time, duration_minutes, category_id, is_scheduled, mindset_prompt, mindset_overridden, recurrence_type, recurrence_days, subtasks, status, priority, actual_start, actual_end, created_at, updated_at, synced, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [a.id, a.user_id, a.activity_type, a.title, a.description, a.assigned_date, a.start_time, a.duration_minutes, a.category_id, a.is_scheduled, a.mindset_prompt, a.mindset_overridden, a.recurrence_type, a.recurrence_days, a.subtasks, a.status, a.priority, a.actual_start, a.actual_end, a.created_at, a.updated_at, a.synced, a.deleted]
        );
      }
      for (const l of logRows) {
        await db.runAsync(
          `INSERT OR IGNORE INTO experience_logs (id, activity_id, user_id, mood, energy, completion_pct, reflection, would_repeat, log_phase, logged_at, synced, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [l.id, l.activity_id, l.user_id, l.mood, l.energy, l.completion_pct, l.reflection, l.would_repeat, l.log_phase, l.logged_at, l.synced, l.deleted]
        );
      }
      for (const g of goalRows) {
        await db.runAsync(
          `INSERT OR IGNORE INTO goals (id, user_id, title, metric_type, target_value, frequency, category_id, specific_days, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [g.id, g.user_id, g.title, g.metric_type, g.target_value, g.frequency, g.category_id, g.specific_days, g.is_active, g.created_at, g.updated_at]
        );
      }
      // Store seed version in DB (reliable, no AsyncStorage dependency)
      await db.runAsync('INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)', ['seed_version', SEED_VERSION]);
      await db.runAsync('INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)', ['onboarded', 'true']);
    } catch (err) {
      console.error('[DayFlow] Native seed failed:', err);
    }
  }

  console.log(`[DayFlow] Seeded ${activityRows.length} activities, ${logRows.length} logs, and ${goalRows.length} goals for Sankalp`);
}

export const DEV_USER_ID = USER_ID;
