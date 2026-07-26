# Arohan

Mayank's health and exercise tracker — an offline-first PWA for one person, built to run
on an iPad for a year.

*Ārohaṇa* (आरोहण) means the ascent.

## What it does

A twelve-month programme built around four goals: exercise consistently, calm the lower
back, build strength, and be able to see the progress.

- **Home** — today's session, a progress ring, the habit checklist, current streak, and a
  daily check-in for sleep, steps, energy and back pain.
- **Workout** — a guided runner with per-set logging, rest timers, timed holds, form
  instructions and cues. The session autosaves on every tap.
- **Mobility** — eight routines by symptom or time of day, including a Lower Back routine
  meant for bad days.
- **Progress** — charts for sessions, pain, sleep and energy; weight, waist, push-up max
  and plank records; weekly photos; full session history; and the journey timeline with
  eighteen achievements.
- **Settings** — theme, equipment, reminder times, and JSON export/import.

## Design decisions worth knowing

**Everything is local.** All data lives in IndexedDB via Dexie. There is no server, no
account, and no analytics. The only way data moves between devices is the JSON backup in
Settings — export regularly, because clearing site data takes everything with it.

**The programme adapts to your equipment.** You start with a mat and bands. Tick
"Adjustable dumbbells" or "Pull-up bar" in Settings when they arrive and the sessions
substitute the right movements automatically, falling back down the chain
(dumbbell → band → bodyweight) when something is missing.

**Progression is automatic, phases are not.** Within a phase, volume climbs over a
three-weeks-on / one-week-deload cycle. Moving from one phase to the next always asks
first — the calendar unlocks the option, you decide.

**The core work is built for a sore back.** There are no loaded sit-ups or weighted spinal
flexion anywhere in the library. Trunk training is bracing work — planks, side planks,
bird dogs, dead bugs, curl-ups and Pallof presses — and the hip hinge is drilled from day
one.

**Illustrations are placeholders by design.** Each movement gets a generated stick-figure
glyph rather than a photo, so the whole app installs and works offline with no image
assets to fetch.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173/arohan/
npm run build      # type-check, lint-clean build into dist/
npm run preview
npx tsc -b         # type check on its own
npx oxlint src     # lint
```

## Deploying

Pushing to `main` runs `.github/workflows/deploy.yml`, which type-checks, lints, builds
and publishes `dist/` to GitHub Pages. Enable Pages for the repository with
**Settings → Pages → Source: GitHub Actions** once, and it deploys on every push.

The app is served from `/arohan/`; change `base` in `vite.config.ts` if the repository is
renamed. The workflow copies `index.html` to `404.html` because GitHub Pages has no SPA
rewrite — that is what makes a deep link work on a cold load.

## Installing on the iPad

Open the deployed URL in Safari, then **Share → Add to Home Screen**. After that first
load it runs offline: the service worker precaches the app, and every screen reads from
IndexedDB.

## Project layout

```
src/
  components/   UI kit — buttons, cards, sheets, charts, rings, glyphs
  features/
    home/       dashboard, habits, daily check-in, onboarding
    workout/    session runner, set logging, rest timers, plan view
    mobility/   routine list and detail
    progress/   overview, body, history and journey tabs
    settings/   preferences, equipment, reminders, backup
  storage/      Dexie schema, repositories, session model, stats, backup
  hooks/        settings, theme, timers, stats, reminders, wake lock
  data/         exercise library, twelve-month programme, routines, quotes
  lib/          dates, formatting, image handling
scripts/        procedural PWA icon generator
```

## Notes

- `npm audit` reports two advisories that do not apply here: a React Router RSC-mode CSRF
  issue (this is a client-only SPA with no server actions) and a DoS in a transitive
  build-time dependency of `vite-plugin-pwa`. Both fixes require breaking major bumps.
- Reminders are local notifications scheduled while the app is open. There is no push
  server. iPadOS only delivers them once the app is installed to the Home Screen.
- Run `node scripts/generate-icons.mjs` after changing the app mark.
