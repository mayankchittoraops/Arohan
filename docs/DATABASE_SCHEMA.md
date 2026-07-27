# Arohan — Database Schema

**Database:** `arohan` · **Schema version:** 2 · **Engine:** IndexedDB via Dexie 4.4

Every field Arohan stores is documented here. If a field exists in
`src/storage/types.ts` and is not on this page, one of the two is wrong.

Source of truth: [`src/storage/db.ts`](../src/storage/db.ts) (versions and migration) and
[`src/storage/types.ts`](../src/storage/types.ts) (record shapes).

---

## Where data lives

| Store | Purpose | What it holds |
| --- | --- | --- |
| IndexedDB `arohan` | Everything | 8 object stores, described below |
| `localStorage` | One key | `arohan.theme` — read by the inline script in `index.html` so the dark class is applied before first paint. The `settings` table is the source of truth; this is a cache to prevent a flash. |
| Cache Storage | App shell | Workbox precache, 17 entries. Rebuilt on deploy, contains no user data. |

Nothing else is written anywhere. There is no server, no cookie, and no analytics.

---

## Conventions

**Date keys** are local `YYYY-MM-DD` strings assembled from calendar parts
(`getFullYear`/`getMonth`/`getDate`), never `toISOString()` — which would shift the day for
anyone east or west of UTC. See `src/lib/date.ts`.

**Timestamps** (`updatedAt`, `startedAt`, `unlockedAt`, …) are epoch milliseconds.

**Units are always metric in storage** — kilograms and centimetres — regardless of the
display setting. Switching to imperial changes the presentation layer only, so history is
never rewritten and never loses precision to a round trip.

**Optional means null, not missing.** Numeric fields that have not been recorded are
explicitly `null` rather than `undefined`, so a partially filled row is a normal row and
`??=` in a migration can fill gaps without ambiguity.

**Derived values are never stored.** Streaks, personal bests, weekly summaries, trends and
BMI are all recomputed from history on read. A stored derived value is a value that can
disagree with its inputs.

---

## Object stores

### `settings` — primary key `id`

Exactly one row, always `id: 1`.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `1` | Literal. The store is a singleton. |
| `name` | `string` | Used in the greeting. Empty string is allowed. |
| `theme` | `'light' \| 'dark' \| 'system'` | Mirrored into `localStorage.arohan.theme`. |
| `units` | `'metric' \| 'imperial'` | Display only — see conventions above. |
| `equipment` | `Equipment[]` | Subset of `'band' \| 'dumbbell' \| 'pullupBar'`. Drives exercise substitution. |
| `heightCm` | `number \| null` | **Added in v2.** Only used to derive BMI. |
| `startDate` | `DateKey` | Day one of the twelve-month journey. Set at first seed. |
| `phase` | `1 \| 2 \| 3 \| 4` | Furthest phase unlocked. Never advances without asking. |
| `phasePromptDismissedFor` | `PhaseNumber \| null` | Set when the calendar has passed `phase` and the prompt was dismissed, so it is not asked twice a day. |
| `reminders` | `{ workout, mobility, review }` | Each `'HH:MM'` or `null`. |
| `remindersEnabled` | `boolean` | Master switch. Local notifications only. |
| `soundEnabled` | `boolean` | Timer chimes. |
| `hapticsEnabled` | `boolean` | Vibration on set completion, where supported. |
| `onboarded` | `boolean` | False shows the onboarding sheet. |

Indexes: primary key only.

### `daily_health` — primary key `date`

One row per day. Written by the Home check-in.

| Field | Type | Notes |
| --- | --- | --- |
| `date` | `DateKey` | Primary key. |
| `sleepHours` | `number \| null` | Hours, one decimal. |
| `steps` | `number \| null` | Manually entered — there is no HealthKit integration. |
| `energy` | `number \| null` | 1 (empty) to 5 (excellent). |
| `pain` | `number \| null` | 0 (none) to 10 (severe). Lower back unless the note says otherwise. |
| `notes` | `string` | Free text. |
| `updatedAt` | `number` | Epoch ms. |

Read by the coaching engine (`sleepHours`, `energy`, `pain`) and by the pain trend on
Progress.

### `workouts` — primary key `id`

The autosaved, in-progress session. **At most one row exists at a time**; finishing or
discarding removes it. This is what makes closing the app mid-set safe.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `string` | `uid()`. |
| `date` | `DateKey` | Indexed. |
| `source` | `'program' \| 'mobility'` | Indexed. Mobility routines run through the same engine. |
| `templateId` | `string` | Programme template or mobility routine id. |
| `templateName`, `templateSubtitle` | `string` | Denormalised so history reads without the content module. |
| `kind` | `WorkoutKind \| 'mobility'` | |
| `startedAt` | `number` | Epoch ms. |
| `updatedAt` | `number` | Epoch ms. Bumped on every autosave. |
| `currentIndex` | `number` | Index into `logs` of the exercise on screen. |
| `elapsedSeconds` | `number` | Accumulated work time, excluding paused periods. |
| `runningSince` | `number \| null` | Timestamp the clock last resumed, `null` while paused. |
| `logs` | `ExerciseLog[]` | See below. |
| `painBefore` | `number \| null` | Captured at start, compared against `painAfter`. |

Indexes: `id` (primary), `date`, `source`.

### `workout_history` — primary key `id`

One row per finished session. Append-only in practice; the only deletion is the explicit
"Delete" in History.

Carries every field of `ActiveWorkout` except `currentIndex`, `elapsedSeconds` and
`runningSince`, plus:

| Field | Type | Notes |
| --- | --- | --- |
| `finishedAt` | `number` | Epoch ms. |
| `durationSeconds` | `number` | Working time, not wall clock. |
| `completedSets` / `plannedSets` | `number` | The completion ratio shown in History. |
| `totalReps` | `number` | Sum across completed sets. |
| `volumeKg` | `number` | Σ reps × weight. Zero for bodyweight-only sessions. |
| `rpe` | `number \| null` | Perceived effort 1–10, asked at finish. Feeds the coach. |
| `painBefore` / `painAfter` | `number \| null` | The pair that makes "did this session help?" answerable. |
| `note` | `string` | Free text at finish. |

Indexes: `id` (primary), `date`, `templateId`, `kind`, `source`.

#### `ExerciseLog` (embedded in both session stores)

| Field | Type | Notes |
| --- | --- | --- |
| `exerciseId` | `string` | Into the static library. Resolved after equipment substitution, so history records what was actually done. |
| `section` | `Section` | Warm-up / main / accessory / cool-down. |
| `plannedSets` | `number` | |
| `plannedReps` / `plannedSeconds` | `number?` | One or the other. |
| `restSeconds` | `number` | Seeds the rest timer. |
| `sets` | `SetLog[]` | `{ done, reps?, seconds?, weightKg? }` per set. |
| `coachNote` | `string?` | From the programme. Not editable. |
| `note` | `string?` | Typed during the session. |
| `skipped` | `boolean` | Skipped movements stay in the log rather than vanishing. |

### `measurements` — primary key `date`

One row per day, sixteen optional metrics. Every field is nullable on purpose: a weigh-in
day and a tape-measure day are usually different days, and requiring both would mean
neither happens.

| Field | Group | Unit | Added |
| --- | --- | --- | --- |
| `date` | — | `DateKey` (primary key) | v1 |
| `weightKg` | Composition | kg | v1 |
| `bodyFatPct` | Composition | % | **v2** |
| `skeletalMusclePct` | Composition | % | **v2** |
| `visceralFat` | Composition | rating, ~1–59 | **v2** |
| `neckCm` | Girths | cm | **v2** |
| `chestCm` | Girths | cm | **v2** |
| `waistCm` | Girths | cm | v1 |
| `hipsCm` | Girths | cm | **v2** |
| `armLeftCm` / `armRightCm` | Girths | cm | **v2** |
| `thighLeftCm` / `thighRightCm` | Girths | cm | **v2** |
| `calfLeftCm` / `calfRightCm` | Girths | cm | **v2** |
| `pushupMax` | Performance | reps | v1 |
| `plankSeconds` | Performance | seconds | v1 |
| `note` | — | `string` | v1 |
| `updatedAt` | — | epoch ms | v1 |

Left and right are separate columns rather than one averaged number, because asymmetry is
the thing worth seeing. The Body screen flags a left/right gap of 3% or more.

**BMI is deliberately not a column.** It is `weightKg / (heightCm/100)²`, computed at
display time from the latest weight and `settings.heightCm`. Storing it would let it
disagree with the weight sitting next to it.

`MeasurementField` in `types.ts` is `Exclude<keyof Measurement, 'date' | 'note' |
'updatedAt'>` — the metric table in `src/data/metrics.ts` is typed against it, so adding a
column without describing it fails the type check.

Indexes: primary key only. The table is small (≤365 rows/year) and always read whole.

### `habits` — primary key `id`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `string` | `` `${date}:${habitId}` `` — composite, so a toggle is an idempotent `put` with no read-then-write race. |
| `date` | `DateKey` | Indexed. |
| `habitId` | `string` | Indexed. One of `workout`, `mobility`, `walk`, `hydration`, `sleep`, `stretch`. |
| `done` | `boolean` | |
| `updatedAt` | `number` | |

Indexes: `id` (primary), `date`, `habitId`. The `[date+habitId]` compound index from v1 was
**dropped in v2** — it was never queried, because the primary key already encodes the pair.

### `achievements` — primary key `id`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `string` | Into the static list of 18 achievements. |
| `unlockedAt` | `number` | Indexed. Epoch ms. |

Presence in the table *is* the unlock. The v1 `seen` flag was **removed in v2** — it was
written on unlock and never read.

### `photos` — primary key `id`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `string` | `uid()`. |
| `date` | `DateKey` | Indexed. |
| `blob` | `Blob` | JPEG, downscaled to 1280px on the long edge before storing. |
| `width`, `height` | `number` | Post-downscale dimensions. |
| `note` | `string` | |
| `createdAt` | `number` | |

Photos are the only large records. They are stored as native `Blob`s (efficient in
IndexedDB) and base64-encoded only when exported — see [Backup Guide](BACKUP_GUIDE.md).

---

## Version history and migrations

Dexie replays versions in order when it opens an existing database, so an install that has
been sitting on v1 for months upgrades through the same code path as a fresh one.

### v1 — Phase 1

```ts
this.version(1).stores({
  settings:        'id',
  daily_health:    'date',
  workouts:        'id, date, source',
  workout_history: 'id, date, templateId, kind, source',
  measurements:    'date',
  habits:          'id, date, habitId, [date+habitId]',
  achievements:    'id, unlockedAt',
  quotes:          'id, favourite',
  photos:          'id, date',
})
```

### v2 — full body composition

```ts
this.version(2)
  .stores({
    quotes: null,                    // dropped
    habits: 'id, date, habitId',     // [date+habitId] removed
  })
  .upgrade(async (tx) => {
    // 12 new measurement columns → null on every existing row
    // settings.heightCm            → null
    // achievements.seen            → deleted
  })
```

| Change | Reason |
| --- | --- |
| 12 new `measurements` columns | The sprint brief asked for full body composition, girths and left/right limbs. |
| `settings.heightCm` | Needed to derive BMI. Null until set, and the Body screen offers a shortcut to Settings when it is. |
| `quotes` store dropped | It was seeded, backed up and restored, but the daily quote has always been read from the static module. Nothing read the table. |
| `[date+habitId]` index dropped | Never queried — the primary key is already that pair. |
| `achievements.seen` deleted | Written on unlock, never read; the "new unlock" indicator it was meant for was never built. |

The upgrade uses `??=`, so it is idempotent and safe to replay. Dropping a store and an
index is metadata-only; no user record is destroyed by the v2 migration.

### Verifying a migration

[`src/storage/migration.test.ts`](../src/storage/migration.test.ts) seeds a database in the
**v1 shape** with `fake-indexeddb`, closes it, reopens it through the real schema and
asserts the v2 result: the new columns exist and are null, `heightCm` is null, `seen` is
gone, `quotes` is gone, and every pre-existing value — settings, workout history,
measurements — survives untouched. It also asserts that a fresh database lands on v2
directly.

The same path was exercised in a real browser before release: a v1 database was built in
Safari's engine, the v2 build was loaded over it, and the data was checked on screen.

### Adding v3

1. **Never edit an existing `version(n).stores()` block.** Dexie replays history; changing
   history changes what installed clients upgrade *from*.
2. Add `this.version(3)`, declaring every store whose indexes changed and `null` for any
   store being dropped.
3. Put data backfill in `.upgrade()`. Prefer `??=` so it is replay-safe.
4. Bump `SCHEMA_VERSION` in `db.ts`.
5. Add a case to `migration.test.ts` that seeds the **v2** shape and asserts the v3 result.
6. If the record shape changed in a way an old export cannot satisfy, bump
   `BACKUP_VERSION` in `backup.ts` and handle the older number on import.

Step 5 is what stands between a schema change and a broken install. Do not skip it.

> Note: Dexie stores the IndexedDB version as its own version × 10. Reading the raw
> IDB version for schema 2 gives **20**, not 2. This trips up anyone inspecting the
> database in devtools.

---

## Backup format

The JSON export in Settings is a straight dump of all eight stores, versioned independently
of the schema:

```jsonc
{
  "app": "arohan",
  "version": 2,                       // BACKUP_VERSION
  "exportedAt": "2026-07-27T05:20:00.000Z",
  "data": {
    "settings": [...], "daily_health": [...], "workouts": [...],
    "workout_history": [...], "measurements": [...], "habits": [...],
    "achievements": [...], "photos": [...]   // blob as a data: URL
  }
}
```

Import validates `app` and refuses a `version` higher than it knows, then **replaces**
everything in one transaction — clear all tables, bulk-put the file, reseed settings if the
file had none. It is a restore, not a merge. Full detail in the
[Backup Guide](BACKUP_GUIDE.md).

---

## Storage durability

`navigator.storage.persist()` is requested once at launch. When granted, the browser will
not evict the database under storage pressure. Safari grants it based on engagement
heuristics and can refuse — Settings shows the current state and the estimated usage, and
that is precisely why the JSON export exists.

A year of daily use without photos is on the order of a few hundred kilobytes. Weekly
photos dominate everything else.
