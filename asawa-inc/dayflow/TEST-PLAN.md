# DayFlow Test Plan

> Generated 2026-04-02. Covers unit tests, integration tests, rendering rule tests, and design token compliance.

## Test Infrastructure

- **Framework**: Jest 29.7 + ts-jest (already in devDependencies)
- **React Native**: jest-expo + @testing-library/react-native (already installed)
- **Run**: `npm test` from `mobile/`
- **Convention**: `src/__tests__/lib/` for pure function tests, `src/__tests__/screens/` for component tests, `src/__tests__/store/` for store tests

---

## 1. Unit Tests: parseActivity.ts

**File under test**: `src/lib/parseActivity.ts`
**Function**: `parseActivityText(text, categories, today)`

### 1.1 Time Extraction

| ID | Description | Input | Expected Output | Priority |
|----|-------------|-------|-----------------|----------|
| PA-T001 | "at" + hour + am | `"gym at 7am"` | `time: "07:00"` | P0 |
| PA-T002 | "at" + hour + pm | `"meeting at 3pm"` | `time: "15:00"` | P0 |
| PA-T003 | "at" + hour:min + pm | `"lunch at 2:45 pm"` | `time: "14:45"` | P0 |
| PA-T004 | "at" + hour:min + am | `"run at 6:30 am"` | `time: "06:30"` | P0 |
| PA-T005 | 12pm edge case | `"lunch at 12pm"` | `time: "12:00"` | P0 |
| PA-T006 | 12am edge case | `"snack at 12am"` | `time: "00:00"` | P0 |
| PA-T007 | Bare hour + meridian | `"yoga 7am"` | `time: "07:00"` | P0 |
| PA-T008 | Bare hour:min + meridian | `"call 2:30pm"` | `time: "14:30"` | P0 |
| PA-T009 | 24-hour "at 15:00" | `"meeting at 15:00"` | `time: "15:00"` | P1 |
| PA-T010 | "morning" keyword | `"gym morning"` | `time: "07:00"` | P0 |
| PA-T011 | "afternoon" keyword | `"nap afternoon"` | `time: "13:00"` | P1 |
| PA-T012 | "evening" keyword | `"walk evening"` | `time: "18:00"` | P0 |
| PA-T013 | "night" keyword | `"read night"` | `time: "21:00"` | P1 |
| PA-T014 | No time specified | `"buy groceries"` | `time: null` | P0 |
| PA-T015 | "for" prefix with time | `"lunch for 2:45 pm"` | `time: "14:45"` | P1 |
| PA-T016 | 11pm | `"study at 11pm"` | `time: "23:00"` | P1 |
| PA-T017 | 1am | `"sleep at 1am"` | `time: "01:00"` | P1 |
| PA-T018 | Time takes priority over keyword | `"morning run at 6am"` | `time: "06:00"` | P1 |

### 1.2 Duration Extraction

| ID | Description | Input | Expected Output | Priority |
|----|-------------|-------|-----------------|----------|
| PA-D001 | "for N min" | `"read for 30 min"` | `duration: 30` | P0 |
| PA-D002 | "for N minutes" | `"read for 30 minutes"` | `duration: 30` | P0 |
| PA-D003 | "for N hour" | `"study for 1 hour"` | `duration: 60` | P0 |
| PA-D004 | "for N hours" | `"study for 2 hours"` | `duration: 120` | P0 |
| PA-D005 | "for N.5 hours" | `"code for 1.5 hours"` | `duration: 90` | P1 |
| PA-D006 | Shorthand "30m" | `"gym 30m"` | `duration: 30` | P0 |
| PA-D007 | Shorthand "1h" | `"meeting 1h"` | `duration: 60` | P0 |
| PA-D008 | Shorthand "1.5h" | `"deep work 1.5h"` | `duration: 90` | P1 |
| PA-D009 | No duration | `"buy groceries"` | `duration: null` | P0 |
| PA-D010 | Duration + time combined | `"gym at 7am for 45 min"` | `time: "07:00", duration: 45` | P0 |
| PA-D011 | "for 0 min" edge | `"test for 0 min"` | `duration: 0` | P2 |
| PA-D012 | Large duration "for 180 min" | `"marathon for 180 min"` | `duration: 180` | P2 |

### 1.3 Date Extraction

| ID | Description | Input | Expected Output (today=2026-04-02) | Priority |
|----|-------------|-------|-------------------------------------|----------|
| PA-DA001 | "today" keyword | `"gym today"` | `date: "2026-04-02"` | P0 |
| PA-DA002 | "tomorrow" keyword | `"lunch tomorrow at 2:45 pm"` | `date: "2026-04-03"` | P0 |
| PA-DA003 | "next Monday" | `"meeting next Monday"` | `date: "2026-04-06"` (next Mon)` | P0 |
| PA-DA004 | "next Tuesday" | `"dentist next Tuesday"` | correct next Tue date | P0 |
| PA-DA005 | "next Friday" | `"party next Friday"` | correct next Fri date | P1 |
| PA-DA006 | "next Sunday" | `"brunch next Sunday"` | correct next Sun date | P1 |
| PA-DA007 | "next week" | `"plan next week"` | `date: "2026-04-09"` (today + 7) | P1 |
| PA-DA008 | Short day name "next mon" | `"gym next mon"` | same as "next Monday" | P1 |
| PA-DA009 | Short day name "next wed" | `"call next wed"` | correct next Wed date | P1 |
| PA-DA010 | No date specified | `"buy groceries"` | `date: null` | P0 |
| PA-DA011 | "next sat" (Saturday) | `"hike next sat"` | correct next Sat date | P2 |
| PA-DA012 | "next thurs" variant | `"review next thurs"` | correct next Thu date | P2 |

### 1.4 Recurrence Extraction

| ID | Description | Input | Expected Output | Priority |
|----|-------------|-------|-----------------|----------|
| PA-R001 | "every morning" | `"run every morning"` | `recurrence: "DAILY", time: "07:00"` | P0 |
| PA-R002 | "every evening" | `"call mom every evening"` | `recurrence: "DAILY", time: "18:00"` | P0 |
| PA-R003 | "every day" | `"meditate every day"` | `recurrence: "DAILY"` | P0 |
| PA-R004 | "daily" | `"journal daily"` | `recurrence: "DAILY"` | P0 |
| PA-R005 | "regularly" | `"exercise regularly"` | `recurrence: "DAILY"` | P1 |
| PA-R006 | "every week" | `"review every week"` | `recurrence: "WEEKLY"` | P0 |
| PA-R007 | "weekly" | `"standup weekly"` | `recurrence: "WEEKLY"` | P0 |
| PA-R008 | "every month" | `"rent every month"` | `recurrence: "MONTHLY"` | P1 |
| PA-R009 | "monthly" | `"bills monthly"` | `recurrence: "MONTHLY"` | P1 |
| PA-R010 | "every 3 hours" | `"drink water every 3 hours"` | `recurrence: "DAILY", time: null` | P0 |
| PA-R011 | "every 30 minutes" | `"stretch every 30 minutes"` | `recurrence: "DAILY", time: null` | P1 |
| PA-R012 | No recurrence | `"gym at 7am"` | `recurrence: null` | P0 |
| PA-R013 | "every 1 hr" shorthand | `"water every 1 hr"` | `recurrence: "DAILY", time: null` | P2 |
| PA-R014 | Recurrence + time: "every morning" overrides | `"walk every morning"` | `recurrence: "DAILY", time: "07:00"` | P1 |

### 1.5 Category Matching

| ID | Description | Input | Expected Output | Priority |
|----|-------------|-------|-----------------|----------|
| PA-C001 | Health alias "gym" | `"gym at 7am"` | `categoryId` matches health category | P0 |
| PA-C002 | Health alias "run" | `"run for 30 min"` | `categoryId` matches health category | P0 |
| PA-C003 | Learning alias "read" | `"read for 30 min"` | `categoryId` matches learning category | P0 |
| PA-C004 | Social alias "call" | `"call mom"` | `categoryId` matches social category | P0 |
| PA-C005 | Work alias "meeting" | `"meeting at 3pm"` | `categoryId` matches work category | P0 |
| PA-C006 | Personal alias "meditate" | `"meditate daily"` | `categoryId` matches personal category | P1 |
| PA-C007 | Work alias "code" | `"code for 2 hours"` | `categoryId` matches work category | P1 |
| PA-C008 | No matching category | `"buy groceries"` | `categoryId: null` | P0 |
| PA-C009 | Social alias "lunch" | `"lunch at noon"` | `categoryId` matches social category | P1 |
| PA-C010 | Health alias "swim" | `"swim at 6am"` | `categoryId` matches health category | P2 |
| PA-C011 | Fallback word match | `"fin class"` with category "Finance" | `categoryId` matches finance category | P2 |

### 1.6 Mindset Prompt

| ID | Description | Input | Expected Output | Priority |
|----|-------------|-------|-----------------|----------|
| PA-M001 | Health mindset | `"gym at 7am"` | `mindsetPrompt: "Show up. The hardest part is starting."` | P0 |
| PA-M002 | Learning mindset | `"read for 30 min"` | `mindsetPrompt: "Stay curious. Every page compounds."` | P0 |
| PA-M003 | Social mindset | `"call mom"` | `mindsetPrompt: "Be present. Listen more than you speak."` | P1 |
| PA-M004 | Work mindset | `"meeting at 3pm"` | `mindsetPrompt: "Deep focus. One thing at a time."` | P1 |
| PA-M005 | No category = no mindset | `"buy groceries"` | `mindsetPrompt: null` | P0 |

### 1.7 Title Extraction

| ID | Description | Input | Expected Output | Priority |
|----|-------------|-------|-----------------|----------|
| PA-TI001 | Basic title | `"gym at 7am"` | `title` starts with uppercase, time stripped | P0 |
| PA-TI002 | Title from duration input | `"read for 30 min"` | `title` contains "Read", duration stripped | P0 |
| PA-TI003 | Title from recurrence | `"call mom every evening"` | `title` contains "Call mom" or similar | P0 |
| PA-TI004 | Command prefix "add" stripped | `"add groceries"` | `title: "Groceries"` | P0 |
| PA-TI005 | Command prefix "create" stripped | `"create meeting"` | `title: "Meeting"` | P1 |
| PA-TI006 | Command prefix "schedule" stripped | `"schedule lunch"` | `title: "Lunch"` | P1 |
| PA-TI007 | First letter capitalized | `"gym"` | `title: "Gym"` | P0 |
| PA-TI008 | Article "a" stripped | `"add a meeting"` | `title: "Meeting"` | P2 |

### 1.8 Edge Cases

| ID | Description | Input | Expected Output | Priority |
|----|-------------|-------|-----------------|----------|
| PA-E001 | Empty string | `""` | `title: ""`, all fields null | P0 |
| PA-E002 | Single word | `"gym"` | `title: "Gym"`, time/date/duration null | P0 |
| PA-E003 | Very long text (200 chars) | 200-char string | Does not crash, returns valid ParsedActivity | P1 |
| PA-E004 | Special characters | `"call @john #urgent"` | Does not crash, valid title | P1 |
| PA-E005 | Numbers only | `"123"` | `title: "123"` | P2 |
| PA-E006 | All whitespace | `"   "` | `title` is empty or whitespace-trimmed | P1 |
| PA-E007 | Multiple times (first wins) | `"gym at 7am at 8am"` | `time: "07:00"` | P1 |
| PA-E008 | Duration + no title words | `"for 30 min"` | `title` is non-empty (fallback to original) | P2 |
| PA-E009 | Unicode text | `"yoga 🧘 at 6am"` | `time: "06:00"`, does not crash | P2 |
| PA-E010 | Case insensitivity | `"GYM AT 7AM"` | `time: "07:00"`, category matched | P0 |

### 1.9 Combined Parsing

| ID | Description | Input | Expected Output | Priority |
|----|-------------|-------|-----------------|----------|
| PA-CO001 | Time + duration + date | `"gym at 7am for 45 min tomorrow"` | `time: "07:00", duration: 45, date: tomorrow` | P0 |
| PA-CO002 | Recurrence + time keyword | `"meditate every morning"` | `recurrence: "DAILY", time: "07:00"` | P0 |
| PA-CO003 | Date + time + category | `"meeting next Monday at 3pm"` | `date: next Mon, time: "15:00", categoryId: work` | P0 |
| PA-CO004 | Everything combined | `"call mom tomorrow at 2:45 pm for 30 min"` | all fields populated correctly | P0 |

---

## 2. Unit Tests: actionEngine.ts

**File under test**: `src/lib/actionEngine.ts`
**Functions**: `processText()`, `detectIntent()` (internal), `findMatchingActivity()` (internal), `checkConflicts()` (internal)

### 2.1 Intent Detection via processText

| ID | Description | Input text | Expected `type` | Priority |
|----|-------------|------------|-----------------|----------|
| AE-I001 | "done with gym" | `"done with gym"` | `"complete"` | P0 |
| AE-I002 | "finished reading" | `"finished reading"` | `"complete"` | P0 |
| AE-I003 | "completed workout" | `"completed workout"` | `"complete"` | P1 |
| AE-I004 | "did yoga" | `"did yoga"` | `"complete"` | P1 |
| AE-I005 | "mark gym as done" | `"mark gym as done"` | `"complete"` | P1 |
| AE-I006 | Checkmark "checkmark gym" | `"✓ gym"` | `"complete"` | P2 |
| AE-I007 | "cancel lunch" | `"cancel lunch"` | `"cancel"` | P0 |
| AE-I008 | "delete meeting" | `"delete meeting"` | `"cancel"` | P0 |
| AE-I009 | "remove lunch" | `"remove lunch"` | `"cancel"` | P1 |
| AE-I010 | "skip gym" | `"skip gym"` | `"cancel"` | P1 |
| AE-I011 | "move meeting to 3pm" | `"move meeting to 3pm"` | `"move"` | P0 |
| AE-I012 | "shift gym to 8am" | `"shift gym to 8am"` | `"move"` | P1 |
| AE-I013 | "push lunch to 2pm" | `"push lunch to 2pm"` | `"move"` | P1 |
| AE-I014 | "reschedule meeting to tomorrow" | `"reschedule meeting to tomorrow"` | `"move"` | P1 |
| AE-I015 | "add groceries" (create) | `"add groceries"` | `"add_task"` (no time) | P0 |
| AE-I016 | "gym at 7am" (create) | `"gym at 7am"` | `"create"` | P0 |
| AE-I017 | "set intention for gym: push through" | `"set intention for gym: push through"` | `"set_mindset"` | P2 |
| AE-I018 | "don't need meeting" | `"don't need meeting"` | `"cancel"` | P2 |
| AE-I019 | Ambiguous text defaults to create | `"buy milk"` | `"add_task"` (no time) | P0 |
| AE-I020 | "delay lunch by 1 hour" | `"delay lunch by 1 hour"` | `"move"` | P1 |

### 2.2 Activity Matching

| ID | Description | Input | Activities | Expected | Priority |
|----|-------------|-------|------------|----------|----------|
| AE-M001 | Exact match "gym" | `"done with gym"` | `[{title:"Gym", ...}]` | `targetActivity.title === "Gym"` | P0 |
| AE-M002 | Contains match "meet" | `"cancel meeting"` | `[{title:"Team Meeting", ...}]` | matches "Team Meeting" | P0 |
| AE-M003 | Reverse contains | `"done with morning gym session"` | `[{title:"Gym", ...}]` | matches "Gym" | P1 |
| AE-M004 | First-word fuzzy | `"cancel lun"` | `[{title:"Lunch with team", ...}]` | matches "Lunch with team" | P2 |
| AE-M005 | No match found | `"done with swimming"` | `[{title:"Gym"}]` | `targetActivity: null, confidence: 0.3` | P0 |
| AE-M006 | Filters to today only | `"done with gym"` | gym on different date | `targetActivity: null` | P1 |
| AE-M007 | Case insensitive match | `"DONE WITH GYM"` | `[{title:"gym", ...}]` | matches "gym" | P1 |

### 2.3 Conflict Detection

| ID | Description | Scenario | Expected | Priority |
|----|-------------|----------|----------|----------|
| AE-C001 | No conflict at empty time | Create at 3pm, nothing at 3pm | `conflict.exists: false` | P0 |
| AE-C002 | Conflict with existing | Create 30min at 3pm, existing 2:45-3:15pm | `conflict.exists: true` | P0 |
| AE-C003 | Conflict suggestion shows free slot | Create at 3pm, existing 3-4pm | `conflict.suggestion` contains alternative time | P1 |
| AE-C004 | Same-activity duplicate | Create "Lunch" at 3pm, "Lunch" exists at 1pm | `type: "move"`, suggestion to move existing | P0 |
| AE-C005 | No conflict for untimed | Create with no time | `conflict.exists: false` | P0 |
| AE-C006 | Completed activities ignored | Create at 3pm, completed activity at 3pm | `conflict.exists: false` | P1 |
| AE-C007 | Skipped activities ignored | Create at 3pm, skipped activity at 3pm | `conflict.exists: false` | P1 |
| AE-C008 | Adjacent non-overlapping | Create at 3pm 30min, existing 3:30-4pm | `conflict.exists: false` | P1 |

### 2.4 Create Flow

| ID | Description | Input | Expected | Priority |
|----|-------------|-------|----------|----------|
| AE-CR001 | Create with time | `"gym at 7am"` | `type: "create", shouldCreate: true` | P0 |
| AE-CR002 | Create without time = task | `"buy groceries"` | `type: "add_task", shouldCreate: true` | P0 |
| AE-CR003 | Duplicate prevention | `"gym at 8am"` with existing Gym | `type: "move"` (not create) | P0 |
| AE-CR004 | Message includes title | `"gym at 7am"` | `message` contains "Gym" | P1 |
| AE-CR005 | Message includes time | `"gym at 7am"` | `message` contains "07:00" | P1 |
| AE-CR006 | Confidence for create | `"gym at 7am"` | `confidence: 0.8` | P1 |
| AE-CR007 | Low confidence for empty | `""` | `confidence: 0.3` | P2 |

### 2.5 Complete Flow

| ID | Description | Input | Activities | Expected | Priority |
|----|-------------|-------|------------|----------|----------|
| AE-CMP001 | Complete found | `"done with gym"` | Gym exists today | `type: "complete", confidence: 0.9` | P0 |
| AE-CMP002 | Complete not found | `"done with swimming"` | No swimming | `type: "complete", confidence: 0.3` | P0 |
| AE-CMP003 | Complete message found | `"done with gym"` | Gym exists | `message` contains "Mark" and "Gym" and "done" | P1 |
| AE-CMP004 | Complete message not found | `"done with x"` | No x | `message` contains "Couldn't find" | P1 |

### 2.6 Cancel Flow

| ID | Description | Input | Activities | Expected | Priority |
|----|-------------|-------|------------|----------|----------|
| AE-CAN001 | Cancel found | `"cancel lunch"` | Lunch exists | `type: "cancel", confidence: 0.9` | P0 |
| AE-CAN002 | Cancel not found | `"cancel dinner"` | No dinner | `type: "cancel", confidence: 0.3` | P0 |
| AE-CAN003 | Cancel message | `"cancel lunch"` | Lunch exists | `message` contains "Cancel" and "Lunch" | P1 |

### 2.7 Move Flow

| ID | Description | Input | Activities | Expected | Priority |
|----|-------------|-------|------------|----------|----------|
| AE-MV001 | Move found with time | `"move meeting to 3pm"` | Meeting exists | `type: "move", parsed.time: "15:00"` | P0 |
| AE-MV002 | Move not found | `"move yoga to 3pm"` | No yoga | `type: "move", confidence: 0.3` | P0 |
| AE-MV003 | Move message found | `"move gym to 8am"` | Gym exists | `message` contains "Move" and "Gym" | P1 |

---

## 3. Unit Tests: commandLayer.ts

**File under test**: `src/lib/ai/commandLayer.ts`
**Functions**: `classifyScope()`, `buildContext()`, `buildPrompt()`, `localFallback()`

### 3.1 classifyScope

| ID | Description | Input | Expected | Priority |
|----|-------------|-------|----------|----------|
| CL-S001 | Simple create = light | `"gym at 7am"` | `"light"` | P0 |
| CL-S002 | "this week" = heavy | `"this week"` | `"heavy"` | P0 |
| CL-S003 | "this month" = heavy | `"this month summary"` | `"heavy"` | P0 |
| CL-S004 | "how many" = heavy | `"how many workouts"` | `"heavy"` | P1 |
| CL-S005 | "total" = heavy | `"total hours exercised"` | `"heavy"` | P1 |
| CL-S006 | "pattern" = heavy | `"any pattern in my schedule"` | `"heavy"` | P1 |
| CL-S007 | "summary" = heavy | `"summary"` | `"heavy"` | P1 |
| CL-S008 | "stats" = heavy | `"stats"` | `"heavy"` | P1 |
| CL-S009 | "tomorrow" = medium | `"what's tomorrow"` | `"medium"` | P0 |
| CL-S010 | "yesterday" = medium | `"yesterday"` | `"medium"` | P0 |
| CL-S011 | "next Monday" = medium | `"next Monday"` | `"medium"` | P0 |
| CL-S012 | "move to" = medium | `"move gym to tomorrow"` | `"medium"` | P1 |
| CL-S013 | "reschedule" = medium | `"reschedule meeting"` | `"medium"` | P1 |
| CL-S014 | Today-only = light | `"add gym"` | `"light"` | P0 |
| CL-S015 | "last week" = medium | `"last week"` | `"medium"` | P1 |
| CL-S016 | "report" = heavy | `"give me a report"` | `"heavy"` | P2 |
| CL-S017 | "history" = heavy | `"my history"` | `"heavy"` | P2 |
| CL-S018 | "all my" = heavy | `"all my activities"` | `"heavy"` | P2 |
| CL-S019 | "trend" = heavy | `"any trends"` | `"heavy"` | P2 |
| CL-S020 | "last 7" = heavy | `"last 7 days"` | `"heavy"` | P1 |
| CL-S021 | Case insensitive "THIS WEEK" | `"THIS WEEK"` | `"heavy"` | P1 |

### 3.2 buildContext

| ID | Description | Input | Expected | Priority |
|----|-------------|-------|----------|----------|
| CL-C001 | Contains current time | light scope, time=10:00 AM | output contains "10:00 AM" | P0 |
| CL-C002 | Contains today date | light scope, date=2026-04-02 | output contains "2026-04-02" | P0 |
| CL-C003 | Lists categories | 2 categories | output contains both category names | P0 |
| CL-C004 | Lists category icons | cat with icon "🏋️" | output contains "🏋️" | P1 |
| CL-C005 | Lists activities with status | 1 activity PLANNED | output contains "[PLANNED]" | P0 |
| CL-C006 | Shows activity time | activity at 3pm | output contains "3:00 PM" | P0 |
| CL-C007 | Shows activity duration | activity 45min | output contains "45m" | P1 |
| CL-C008 | Shows recurrence | DAILY activity | output contains "repeats: DAILY" | P1 |
| CL-C009 | Shows mindset | activity with mindset | output contains mindset text (truncated at 50 chars) | P1 |
| CL-C010 | Empty activities = "(none)" | no activities | output contains "(none)" | P0 |
| CL-C011 | Untimed activity shows "no time" | activity with null start_time | output contains "no time" | P1 |
| CL-C012 | Multiple activities listed | 3 activities | output contains all 3 titles | P1 |

### 3.3 buildPrompt

| ID | Description | Input | Expected | Priority |
|----|-------------|-------|----------|----------|
| CL-P001 | System contains APP_SCHEMA | any input | `system` includes "DATA SCHEMA" | P0 |
| CL-P002 | System contains context | context string | `system` includes the context | P0 |
| CL-P003 | System contains JSON instruction | any | `system` includes "Respond with JSON only" | P0 |
| CL-P004 | User field = user text | `"gym at 7am"` | `user === "gym at 7am"` | P0 |
| CL-P005 | System contains CREATE params | any | `system` includes "For CREATE: params" | P1 |
| CL-P006 | System contains UPDATE params | any | `system` includes "For UPDATE: params" | P1 |
| CL-P007 | System contains Activity schema | any | `system` includes "Activity {" | P0 |
| CL-P008 | System contains ExperienceLog | any | `system` includes "ExperienceLog" | P1 |
| CL-P009 | System contains UI VIEWS | any | `system` includes "UI VIEWS" | P1 |
| CL-P010 | System contains RULES | any | `system` includes "RULES" | P1 |

### 3.4 localFallback

| ID | Description | Input | Activities | Expected | Priority |
|----|-------------|-------|------------|----------|----------|
| CL-F001 | Delete match | `"delete gym"` | Gym exists | `action: "delete", confidence: 0.8` | P0 |
| CL-F002 | Delete no match | `"delete swimming"` | No swimming | `action: "clarify"` | P0 |
| CL-F003 | Cancel match | `"cancel lunch"` | Lunch exists | `action: "delete"` (cancel maps to delete) | P1 |
| CL-F004 | Done match | `"done gym"` | Gym exists | `action: "update", params.updates.status: "COMPLETED"` | P0 |
| CL-F005 | Done no match | `"done swimming"` | No swimming | `action: "create"` (fallback) | P1 |
| CL-F006 | Finish match | `"finish reading"` | Reading exists | `action: "update"` | P1 |
| CL-F007 | Default = create | `"buy milk"` | any | `action: "create", confidence: 0.5` | P0 |
| CL-F008 | "remove the meeting" | `"remove the meeting"` | Meeting exists | `action: "delete"` | P1 |
| CL-F009 | "skip gym" | `"skip gym"` | Gym exists | `action: "delete"` | P1 |
| CL-F010 | "done with gym" (with prefix) | `"done with gym"` | Gym exists | `action: "update"` | P0 |

---

## 4. Unit Tests: recurrence.ts

**File under test**: `src/lib/recurrence.ts`
**Functions**: `shouldRecurOnDate()`, `generateRecurringInstances()`

### 4.1 shouldRecurOnDate

| ID | Description | Activity recurrence | Target date | Expected | Priority |
|----|-------------|---------------------|-------------|----------|----------|
| RE-S001 | NONE does not recur | NONE | any future date | `false` | P0 |
| RE-S002 | DAILY recurs next day | DAILY, start 2026-04-01 | 2026-04-02 | `true` | P0 |
| RE-S003 | DAILY recurs 30 days later | DAILY, start 2026-04-01 | 2026-05-01 | `true` | P0 |
| RE-S004 | DAILY does not recur before start | DAILY, start 2026-04-05 | 2026-04-02 | `false` | P0 |
| RE-S005 | DAILY same day = false (real handles) | DAILY, start 2026-04-01 | 2026-04-01 | `false` | P0 |
| RE-S006 | WEEKLY same weekday | WEEKLY, start Mon 2026-04-06 | Mon 2026-04-13 | `true` | P0 |
| RE-S007 | WEEKLY different weekday | WEEKLY, start Mon 2026-04-06 | Tue 2026-04-14 | `false` | P0 |
| RE-S008 | WEEKLY with recurrence_days | WEEKLY, days=["Mon","Wed"] | Wed | `true` | P0 |
| RE-S009 | WEEKLY with recurrence_days miss | WEEKLY, days=["Mon","Wed"] | Thu | `false` | P0 |
| RE-S010 | WEEKDAYS Mon-Fri | WEEKDAYS, start Mon | Wed | `true` | P1 |
| RE-S011 | WEEKDAYS not Sat | WEEKDAYS, start Mon | Sat | `false` | P1 |
| RE-S012 | WEEKDAYS not Sun | WEEKDAYS, start Mon | Sun | `false` | P1 |
| RE-S013 | MONTHLY same day-of-month | MONTHLY, start 15th | 15th next month | `true` | P0 |
| RE-S014 | MONTHLY different day-of-month | MONTHLY, start 15th | 16th next month | `false` | P0 |
| RE-S015 | BIWEEKLY correct week | BIWEEKLY, start 2026-04-01 | 2 weeks later same day | `true` | P1 |
| RE-S016 | BIWEEKLY wrong week | BIWEEKLY, start 2026-04-01 | 1 week later same day | `false` | P1 |
| RE-S017 | QUARTERLY correct | QUARTERLY, start Jan 15 | Apr 15 | `true` | P2 |
| RE-S018 | QUARTERLY wrong month | QUARTERLY, start Jan 15 | Feb 15 | `false` | P2 |
| RE-S019 | YEARLY correct | YEARLY, start 2025-04-02 | 2026-04-02 | `true` | P1 |
| RE-S020 | YEARLY wrong date | YEARLY, start 2025-04-02 | 2026-04-03 | `false` | P1 |
| RE-S021 | BIMONTHLY correct | BIMONTHLY, start Jan 10 | Mar 10 | `true` | P2 |
| RE-S022 | BIMONTHLY wrong | BIMONTHLY, start Jan 10 | Feb 10 | `false` | P2 |

### 4.2 generateRecurringInstances

| ID | Description | Input | Expected | Priority |
|----|-------------|-------|----------|----------|
| RE-G001 | Generates instance for DAILY | DAILY activity, target = day after start | 1 instance returned | P0 |
| RE-G002 | Instance has correct date in ID | DAILY, target 2026-04-05 | `id` ends with `_2026-04-05` | P0 |
| RE-G003 | Instance preserves time-of-day | Activity at 07:00, target new date | `start_time` has same hours/minutes on new date | P0 |
| RE-G004 | Instance status is PLANNED | any recurring | `status === "PLANNED"` | P0 |
| RE-G005 | Instance assigned_date is target | target 2026-04-05 | `assigned_date === "2026-04-05"` | P0 |
| RE-G006 | Skips non-matching days | WEEKLY Mon, target is Tue | 0 instances | P0 |
| RE-G007 | Multiple recurring activities | 3 DAILY activities, target = future day | 3 instances | P1 |
| RE-G008 | Empty input = empty output | `[]`, any target | `[]` | P0 |
| RE-G009 | Instance actual_start is null | any | `actual_start === null` | P1 |
| RE-G010 | Instance actual_end is null | any | `actual_end === null` | P1 |
| RE-G011 | Preserves duration | 45min activity | instance `duration_minutes === 45` | P1 |
| RE-G012 | Preserves category | activity with cat-id | instance `category_id` matches | P1 |
| RE-G013 | Preserves title | activity "Gym" | instance `title === "Gym"` | P1 |
| RE-G014 | Untimed recurring: start_time preserved | activity with start_time but generates on new date | `start_time` is non-empty on target date | P1 |

---

## 5. Unit Tests: calendar.ts

**File under test**: `src/lib/calendar.ts`
**Functions**: `formatHour()`, `getActivityPosition()`, `getCurrentTimeOffset()`
**Constants**: `HOUR_HEIGHT`, `START_HOUR`, `END_HOUR`, `HOUR_LABEL_WIDTH`, `MIN_BLOCK_HEIGHT`, `TOTAL_CANVAS_HEIGHT`

### 5.1 Constants

| ID | Description | Expected | Priority |
|----|-------------|----------|----------|
| CA-K001 | HOUR_HEIGHT is 88 | `88` | P0 |
| CA-K002 | START_HOUR is 0 | `0` | P0 |
| CA-K003 | END_HOUR is 25 | `25` | P1 |
| CA-K004 | HOUR_LABEL_WIDTH is 60 | `60` | P1 |
| CA-K005 | MIN_BLOCK_HEIGHT is 44 | `44` | P0 |
| CA-K006 | TOTAL_CANVAS_HEIGHT is 24*88 = 2112 | `2112` | P1 |

### 5.2 formatHour

| ID | Description | Input | Expected | Priority |
|----|-------------|-------|----------|----------|
| CA-F001 | Midnight | `0` | `"12 AM"` | P0 |
| CA-F002 | 1 AM | `1` | `"1 AM"` | P0 |
| CA-F003 | 6 AM | `6` | `"6 AM"` | P1 |
| CA-F004 | 11 AM | `11` | `"11 AM"` | P1 |
| CA-F005 | Noon | `12` | `"12 PM"` | P0 |
| CA-F006 | 1 PM | `13` | `"1 PM"` | P0 |
| CA-F007 | 6 PM | `18` | `"6 PM"` | P1 |
| CA-F008 | 11 PM | `23` | `"11 PM"` | P1 |
| CA-F009 | 24 (end-of-day) | `24` | `"12 AM"` | P0 |
| CA-F010 | 2 AM | `2` | `"2 AM"` | P2 |
| CA-F011 | 3 PM | `15` | `"3 PM"` | P2 |

### 5.3 getActivityPosition

| ID | Description | Input startTime, duration | Expected top, height | Priority |
|----|-------------|---------------------------|---------------------|----------|
| CA-P001 | Midnight, 60min | `"2026-04-02T00:00:00"`, 60 | `top: 0, height: 88` | P0 |
| CA-P002 | 7am, 30min | `"2026-04-02T07:00:00"`, 30 | `top: 616, height: 44` | P0 |
| CA-P003 | 7:30am, 60min | `"2026-04-02T07:30:00"`, 60 | `top: 660, height: 88` | P0 |
| CA-P004 | 12pm, 90min | `"2026-04-02T12:00:00"`, 90 | `top: 1056, height: 132` | P1 |
| CA-P005 | MIN_BLOCK_HEIGHT enforced (15min) | `"2026-04-02T09:00:00"`, 15 | `height: 44` (not 22) | P0 |
| CA-P006 | MIN_BLOCK_HEIGHT enforced (0min) | `"2026-04-02T09:00:00"`, 0 | `height: 44` (min) | P0 |
| CA-P007 | 11pm, 120min | `"2026-04-02T23:00:00"`, 120 | `top: 2024, height: 176` | P1 |
| CA-P008 | 6:15am, 45min | `"2026-04-02T06:15:00"`, 45 | `top: 550, height: 66` | P1 |
| CA-P009 | 2:45pm, 30min | `"2026-04-02T14:45:00"`, 30 | `top: 1298, height: 44` | P1 |
| CA-P010 | 5min block uses MIN_BLOCK_HEIGHT | `"2026-04-02T10:00:00"`, 5 | `height: 44` | P0 |

---

## 6. Unit Tests: glassTintBackground (ActivityCard)

**File under test**: `src/features/canvas/components/ActivityCard.tsx`
**Function**: `glassTintBackground(catHex)`

> Note: This function is not exported. Either export it for testing, or extract to a utility file.

### 6.1 Color Blending

| ID | Description | Input hex | Expected | Priority |
|----|-------------|-----------|----------|----------|
| GL-001 | White category = pure white glass | `"#FFFFFF"` | `"rgba(255,255,255,0.65)"` | P0 |
| GL-002 | Black category = slight darken | `"#000000"` | `"rgba(224,224,224,0.65)"` (255*(1-0.12) = 224.4 ~ 224) | P0 |
| GL-003 | Red category | `"#FF0000"` | R blended = round(255*0.88 + 255*0.12) = 255, G/B = 224 | P0 |
| GL-004 | Forest green (#2D5A3E) | `"#2D5A3E"` | Computed R,G,B with 12% tint at 0.65 opacity | P1 |
| GL-005 | Terra (#B5634A) | `"#B5634A"` | Valid rgba string | P1 |
| GL-006 | Output format is valid rgba | any hex | matches `rgba(\d+,\d+,\d+,0.65)` | P0 |
| GL-007 | All RGB values 0-255 | `"#000000"` | all channel values between 0 and 255 | P1 |
| GL-008 | Opacity is always 0.65 | any hex | ends with `,0.65)` | P0 |
| GL-009 | Sage (#5A8C6A) | `"#5A8C6A"` | Valid rgba, channels computed correctly | P2 |
| GL-010 | Slate (#3D5F80) | `"#3D5F80"` | Valid rgba | P2 |

---

## 7. Integration Tests

These test multi-module flows end-to-end (mocking only external deps like DB/network).

### 7.1 Activity Creation Flow

| ID | Description | Flow | Expected | Priority |
|----|-------------|------|----------|----------|
| INT-001 | QuickAdd parse to ActionResult | text -> parseActivityText -> processText | ActionResult with correct create fields | P0 |
| INT-002 | Create flow avoids duplicates | processText with existing activity | type: "move" instead of "create" | P0 |
| INT-003 | Create flow detects conflict | processText with occupied time slot | conflict.exists: true, suggestion present | P1 |
| INT-004 | Recurrence parse to create | "gym every morning" -> processText | type: "create", parsed.recurrence: "DAILY" | P1 |
| INT-005 | Task creation (no time) | "buy groceries" -> processText | type: "add_task", shouldCreate: true | P0 |

### 7.2 Search via localFallback

| ID | Description | Flow | Expected | Priority |
|----|-------------|------|----------|----------|
| INT-006 | Delete via fallback finds activity | "delete gym" with activities | action: "delete", matched_id present | P1 |
| INT-007 | Complete via fallback finds activity | "done gym" with activities | action: "update", status: "COMPLETED" | P1 |
| INT-008 | Fallback with no match = clarify | "delete xyz" no match | action: "clarify" | P1 |

### 7.3 Recurrence + Calendar

| ID | Description | Flow | Expected | Priority |
|----|-------------|------|----------|----------|
| INT-009 | Recurring generates correct position | generateRecurringInstances -> getActivityPosition | top/height match the recurring time | P1 |
| INT-010 | WEEKLY skips wrong day | generateRecurringInstances for wrong weekday | 0 instances, no position | P1 |

### 7.4 Command Layer Pipeline

| ID | Description | Flow | Expected | Priority |
|----|-------------|------|----------|----------|
| INT-011 | classifyScope -> buildContext -> buildPrompt | "gym at 7am" | light scope, context has activities, prompt has APP_SCHEMA | P0 |
| INT-012 | Heavy scope includes analytics keywords | "this week summary" | heavy scope, context built, prompt complete | P1 |
| INT-013 | buildPrompt user field matches input | "hello" through pipeline | user === "hello" | P1 |

---

## 8. Rendering Rule Tests

These verify that the data-to-UI mapping rules are correct. Test the logic that decides how an activity renders.

| ID | Description | Activity fields | Expected rendering | Priority |
|----|-------------|----------------|-------------------|----------|
| RR-001 | Timed + duration > 0 = pill | `start_time: "..T07:00", duration: 30` | Renders as pill on canvas | P0 |
| RR-002 | Timed + duration 0 = watermark at time | `start_time: "..T07:00", duration: 0` | Watermark at 7am position | P0 |
| RR-003 | Untimed + recurring = watermark distributed | `start_time: null, recurrence: "DAILY"` | Watermark chip (right-aligned) | P0 |
| RR-004 | Untimed + not recurring = task | `start_time: null, recurrence: "NONE"` | Shows in bottom bar | P0 |
| RR-005 | Completed = 0.6 opacity | `status: "COMPLETED"` | opacity 0.6 | P0 |
| RR-006 | Completed = strikethrough | `status: "COMPLETED"` | textDecorationLine: "line-through" | P0 |
| RR-007 | Skipped = 0.4 opacity | `status: "SKIPPED"` | opacity 0.4 | P0 |
| RR-008 | PLANNED = full opacity | `status: "PLANNED"` | opacity 1.0 | P1 |
| RR-009 | Pill height proportional to duration | 60min activity | height = HOUR_HEIGHT (88px) | P0 |
| RR-010 | Pill min height enforced | 5min activity | height = MIN_BLOCK_HEIGHT (44px) | P0 |
| RR-011 | Overdue activity has badge | past assigned_date, status PLANNED | Shows "Overdue" indicator | P1 |
| RR-012 | Recurring instance ID format | generated instance | `id` = `${originalId}_${date}` | P1 |
| RR-013 | Virtual instance status = PLANNED | generated instance | `status === "PLANNED"` | P1 |
| RR-014 | Timed task on canvas | `activity_type: "TASK", start_time: set` | Shows in hour slot on canvas | P1 |
| RR-015 | Untimed task in top section | `activity_type: "TASK", start_time: null` | Shows in collapsible task section | P1 |

---

## 9. Design Token Tests (Automated Grep)

These are automated lint-style checks to enforce the design system.

### 9.1 No Hardcoded Hex Colors in TSX

| ID | Description | Grep pattern | Expected | Priority |
|----|-------------|-------------|----------|----------|
| DT-001 | No hardcoded hex in .tsx (excluding theme.ts) | `/#[0-9A-Fa-f]{6}\b/` in `*.tsx` files | 0 matches outside theme imports | P0 |
| DT-002 | No hardcoded hex in .tsx (3-digit) | `/#[0-9A-Fa-f]{3}\b/` in `*.tsx` | 0 matches outside theme | P1 |
| DT-003 | No hardcoded rgba in .tsx | `/rgba?\(\d+,\s*\d+/` in `*.tsx` | 0 matches outside theme/utilities | P1 |
| DT-004 | No inline color strings | `/color:\s*['"][^']*#/` in `*.tsx` | 0 matches | P1 |
| DT-005 | No "backgroundColor: '#" | `/backgroundColor:\s*'#/` in `*.tsx` | 0 matches | P0 |

### 9.2 Glass Values Use colors.glass.*

| ID | Description | Check | Expected | Priority |
|----|-------------|-------|----------|----------|
| DT-006 | All "rgba(255,255,255" use colors.glass | grep for `rgba(255,255,255` in `.tsx` | Only in theme.ts or imported from theme | P0 |
| DT-007 | Backdrop blur uses colors.glass.blur | grep for `backdropFilter` or blur values | References colors.glass.blur | P1 |
| DT-008 | Sheet backgrounds use glass.sheet | grep for sheet-like rgba | Uses colors.glass.sheet | P1 |

### 9.3 Shadows Use shadows.*

| ID | Description | Check | Expected | Priority |
|----|-------------|-------|----------|----------|
| DT-009 | No inline shadowColor | `/shadowColor:\s*'#/` in `*.tsx` | 0 matches outside theme.ts | P0 |
| DT-010 | No inline shadowOffset | `/shadowOffset:\s*\{/ not from shadows.*` | All shadow usage imports from theme | P1 |
| DT-011 | No inline shadowOpacity | `/shadowOpacity:\s*\d/` in `*.tsx` | 0 matches outside theme.ts | P1 |
| DT-012 | No inline shadowRadius | `/shadowRadius:\s*\d/` in `*.tsx` | 0 matches outside theme.ts | P1 |
| DT-013 | No inline elevation | `/elevation:\s*\d/` in `*.tsx` | 0 matches outside theme.ts | P1 |

### 9.4 Typography Matches DESIGN.md Scale

| ID | Description | Check | Expected | Priority |
|----|-------------|-------|----------|----------|
| DT-014 | No inline fontSize | `/fontSize:\s*\d+/` in `*.tsx` | 0 matches outside theme.ts | P0 |
| DT-015 | No inline fontWeight | `/fontWeight:\s*'/` in `*.tsx` | 0 matches outside theme.ts | P1 |
| DT-016 | No inline letterSpacing | `/letterSpacing:\s*-?\d/` in `*.tsx` | 0 matches outside theme.ts | P2 |
| DT-017 | No inline lineHeight | `/lineHeight:\s*\d/` in `*.tsx` | 0 matches outside theme.ts | P2 |
| DT-018 | Font family is Instrument Sans only | grep for fontFamily | Only "Instrument Sans" or theme reference | P1 |

### 9.5 Spacing Uses spacing.*

| ID | Description | Check | Expected | Priority |
|----|-------------|-------|----------|----------|
| DT-019 | No magic number padding | `/padding:\s*\d+/` in `*.tsx` | Only multiples of 4 (from spacing tokens) | P2 |
| DT-020 | No magic number margin | `/margin:\s*\d+/` in `*.tsx` | Only multiples of 4 (from spacing tokens) | P2 |
| DT-021 | No hardcoded borderRadius | `/borderRadius:\s*\d+/` in `*.tsx` | Uses radii.* from theme | P2 |

### 9.6 Theme Import Consistency

| ID | Description | Check | Expected | Priority |
|----|-------------|-------|----------|----------|
| DT-022 | All .tsx files import from theme | Check each .tsx with visual styling | Imports colors/spacing/etc from theme | P1 |
| DT-023 | No duplicate color definitions | Colors defined only in theme.ts | No re-definitions | P1 |
| DT-024 | categoryColors map complete | All sys-* and cust-* IDs have entries | No missing category color | P1 |

---

## 10. Additional Edge Case and Robustness Tests

### 10.1 parseActivity Robustness

| ID | Description | Input | Expected | Priority |
|----|-------------|-------|----------|----------|
| ROB-001 | Multiple spaces between words | `"gym   at   7am"` | `time: "07:00"` | P1 |
| ROB-002 | Trailing whitespace | `"gym at 7am   "` | Valid parse, trimmed title | P1 |
| ROB-003 | Leading whitespace | `"  gym at 7am"` | Valid parse | P1 |
| ROB-004 | Tab characters | `"gym\tat\t7am"` | Does not crash | P2 |
| ROB-005 | Newline in input | `"gym\nat 7am"` | Does not crash | P2 |
| ROB-006 | Empty categories array | `"gym at 7am"`, `[]` | `categoryId: null`, no crash | P1 |
| ROB-007 | Null-like date (epoch) | today = new Date(0) | Valid date string output | P2 |

### 10.2 actionEngine Robustness

| ID | Description | Input | Expected | Priority |
|----|-------------|-------|----------|----------|
| ROB-008 | Empty activities array | `"done with gym"`, `[]` | `targetActivity: null` | P1 |
| ROB-009 | Empty text | `""` | Does not crash, valid ActionResult | P1 |
| ROB-010 | Very long input (500 chars) | 500-char string | Does not crash | P2 |
| ROB-011 | Activities with null start_time | mixed activities | No crash in conflict check | P1 |
| ROB-012 | Activity with 0 duration | Create at time with 0-duration existing | Handles gracefully | P2 |

### 10.3 recurrence Robustness

| ID | Description | Input | Expected | Priority |
|----|-------------|-------|----------|----------|
| ROB-013 | Activity without start_time | DAILY, start_time null | `shouldRecurOnDate: false` | P0 |
| ROB-014 | Empty recurrence_days | WEEKLY, no days specified | Falls back to same weekday | P1 |
| ROB-015 | Far future date | DAILY, target 2030-01-01 | `true` (still recurs) | P2 |
| ROB-016 | Date boundary midnight | target at exactly midnight | Correct behavior | P2 |

### 10.4 calendar Robustness

| ID | Description | Input | Expected | Priority |
|----|-------------|-------|----------|----------|
| ROB-017 | Negative hour to formatHour | `-1` | Does not crash (or returns reasonable) | P2 |
| ROB-018 | Hour > 24 to formatHour | `25` | Returns something reasonable | P2 |
| ROB-019 | Invalid date string to getActivityPosition | `"not-a-date"` | Handles gracefully (NaN or default) | P2 |
| ROB-020 | Negative duration | `"2026-04-02T07:00:00"`, -30 | MIN_BLOCK_HEIGHT enforced | P2 |

---

## Summary

| Section | Test Count | P0 | P1 | P2 |
|---------|-----------|----|----|-----|
| parseActivity.ts (time) | 18 | 9 | 8 | 1 |
| parseActivity.ts (duration) | 12 | 7 | 3 | 2 |
| parseActivity.ts (date) | 12 | 5 | 4 | 3 |
| parseActivity.ts (recurrence) | 14 | 6 | 5 | 3 |
| parseActivity.ts (category) | 11 | 5 | 3 | 3 |
| parseActivity.ts (mindset) | 5 | 3 | 2 | 0 |
| parseActivity.ts (title) | 8 | 4 | 2 | 2 |
| parseActivity.ts (edge cases) | 10 | 3 | 4 | 3 |
| parseActivity.ts (combined) | 4 | 4 | 0 | 0 |
| actionEngine.ts (intent) | 20 | 6 | 9 | 5 |
| actionEngine.ts (matching) | 7 | 3 | 3 | 1 |
| actionEngine.ts (conflict) | 8 | 3 | 4 | 1 |
| actionEngine.ts (create) | 7 | 3 | 3 | 1 |
| actionEngine.ts (complete) | 4 | 2 | 2 | 0 |
| actionEngine.ts (cancel) | 3 | 2 | 1 | 0 |
| actionEngine.ts (move) | 3 | 2 | 1 | 0 |
| commandLayer.ts (scope) | 21 | 5 | 10 | 6 |
| commandLayer.ts (context) | 12 | 4 | 7 | 1 |
| commandLayer.ts (prompt) | 10 | 4 | 6 | 0 |
| commandLayer.ts (fallback) | 10 | 4 | 4 | 2 |
| recurrence.ts (shouldRecur) | 22 | 8 | 7 | 7 |
| recurrence.ts (generate) | 14 | 5 | 8 | 1 |
| calendar.ts (constants) | 6 | 3 | 3 | 0 |
| calendar.ts (formatHour) | 11 | 5 | 4 | 2 |
| calendar.ts (position) | 10 | 5 | 4 | 1 |
| glassTintBackground | 10 | 4 | 3 | 3 |
| Integration tests | 13 | 4 | 9 | 0 |
| Rendering rules | 15 | 7 | 6 | 2 |
| Design token tests | 24 | 5 | 12 | 7 |
| Robustness tests | 20 | 2 | 9 | 9 |
| **TOTAL** | **338** | **135** | **160** | **63** |

## Implementation Priority

1. **Phase 1 (P0, 135 tests)**: All pure function unit tests for parseActivity, actionEngine, recurrence, calendar, and glassTintBackground. These are the foundation.
2. **Phase 2 (P1, 160 tests)**: Extended cases, integration tests, rendering rules, design tokens.
3. **Phase 3 (P2, 63 tests)**: Edge cases, robustness, rare recurrence types, design lint niceties.

## Prerequisites

1. Export `glassTintBackground` from ActivityCard.tsx (or extract to `src/lib/glassTint.ts`)
2. Ensure `jest.config.js` / `jest` config in package.json handles TypeScript via `ts-jest`
3. Mock `date-fns` where needed, or use fixed `today` parameter (already supported by most functions)
4. Existing mocks in `src/__tests__/__mocks__/` cover Expo modules -- no changes needed for pure function tests
