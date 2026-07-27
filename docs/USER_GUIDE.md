# Arohan — User Guide

Everything the app does, and how to get the most out of it.

**Open it:** https://mayankchittoraops.github.io/Arohan/

---

## Install it properly

Arohan works in a browser tab, but it is meant to be installed. Installed, it runs
full-screen, launches instantly, works with the network off, and is allowed to schedule
reminders.

**iPad / iPhone (Safari)**
1. Open the link above in **Safari** — not Chrome, not the in-app browser inside another app.
2. Tap the **Share** button.
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add**.

Launch it from the Home Screen icon from then on. The tab version and the installed
version share the same data on iOS, but the installed one is the one that behaves.

**Mac / Windows (Chrome or Edge)** — click the install icon in the address bar.

### First launch

You will be asked for your name, your equipment, and your start date. All three are
changeable later in Settings. Everything is stored on the device — there is no account and
nothing to sign up for.

---

## Home

The screen you should be opening every day.

**Today's Focus** tells you what today is for — Workout, Mobility, Recovery or Rest —
with the coach's read on it underneath and a single button that starts it. From a cold
launch, starting the scheduled session is **one tap**.

**The check-in** takes about fifteen seconds: hours slept, steps, energy 1–5, back pain
0–10. It is the most valuable fifteen seconds in the app, because those four numbers are
what the coaching reads. Skip them and the advice falls back to the calendar.

**Habits** — six daily ticks: workout, mobility, walk, hydration, sleep, stretch. Tap to
toggle. They feed the streak.

**Consistency** shows the last fourteen days against the fortnight before it, so you can
see a slide before it becomes a gap.

### What the coach is actually doing

Ten rules, checked in order, first match wins. It is a plain function — no AI, no
randomness, no network. The same inputs always produce the same advice, because advice that
changes when you reload is not advice.

Two things are baked into the rule order:

- **Pain outranks the plan.** Log back pain at 6 or above and it swaps the session for the
  Lower Back routine, whatever the calendar said.
- **It never guilts you.** Come back after four days off and it says so kindly. There is no
  scolding anywhere in the app.

It will also tell you to ease off when sleep is under 6 hours, when energy is at 1 or 2, or
when yesterday's session came in at RPE 9 or 10.

---

## Workout

Tap the session on Home, or open the Workout tab to see the full plan first — every
movement, sets, reps, and the week number within the phase.

### During a session

- **Tick each set** as you finish it. The counter at the top tracks the whole session.
- **Rest timer** starts on its own when a set needs one. It draws down as a ring, tells you
  what is next, and offers **+15s** and **Skip**. It chimes at zero if sound is on.
- **Timed holds** count down instead of counting reps and mark the set done at zero.
- **Weight and reps** are editable per set — log what you actually lifted, not what was
  planned.
- **Instructions, cues, and easier/harder variations** are on every movement. If today's
  version is wrong for you, the variation is right there.
- **Skip** removes a movement from the flow without deleting it from the record.
- **Notes** per exercise, for anything you want to remember next week.
- The screen stays awake while a session is running.

### Closing the app mid-session is safe

The session autosaves on every single tap. Lock the iPad, take a call, close the tab
entirely — reopen Arohan and it comes back on the same set, with the elapsed clock intact
and the rest timer where you left it. This is tested, not hoped for.

### Finishing

You are asked for RPE (how hard it felt, 1–10) and your back pain afterwards. Both are
worth answering: RPE feeds tomorrow's advice, and the before/after pain pair is what makes
"did that session help my back?" an answerable question rather than a feeling.

Then you get the celebration, and the streak ticks over.

---

## Mobility

Eight routines in four groups.

| Group | Routines | For |
| --- | --- | --- |
| **Morning** | Morning | Undoing the night |
| **Office** | Office, Shoulders, Neck | Between meetings, at a desk |
| **Evening** | Evening | Winding down before sleep |
| **Recovery** | Lower Back, Hips, Hamstrings | The parts that complain |

Each routine shows its real duration — derived from the actual holds and reps, not a
number somebody typed — and how many stretches it contains. Every stretch shows its
duration and target muscles.

**On a bad back day, start with Lower Back.** Everything in it is gentle and doing it twice
is better than pushing through a workout. It opens with breathing, mobilises before it
stretches, and ends on child's pose.

Routines respect your equipment: if you do not own bands, the band pass-through in
Shoulders is replaced or dropped, and the routine tells you it did that.

Mobility runs through the same session engine as a workout, so it autosaves and lands in
your history the same way.

---

## Progress

Four tabs.

### Overview
This week against last: sessions, sets, working time. Two personal bests. Sessions-per-week
bars. A back-pain trend that leads with a sentence in English — which direction it is
going, not just a line to interpret.

### Body

Sixteen metrics, in three groups.

| Group | Metrics |
| --- | --- |
| **Composition** | Weight, Body fat %, Muscle %, Visceral fat |
| **Girths** | Neck, Chest, Waist, Hips, Left/Right arm, Left/Right thigh, Left/Right calf |
| **Performance** | Push-up max, Plank hold |

Tap **Log measurements** and fill in *only what you measured*. Blanks stay blank — nothing
is required, and a weigh-in day does not have to be a tape-measure day.

**About the Muscle field.** Enter your scale's **Muscle Rate** reading exactly as it shows
it — around 70–85% is normal, and a Dr Trust reporting 78% is right. That figure counts all
lean tissue: muscle, organs and their water, everything except fat and bone. It is not the
same as *skeletal muscle mass percentage*, which runs 33–45% and is what some fitness
articles mean by "muscle %". Log whichever your scale gives you, but log the same one every
time — the trend is only meaningful against itself.

Each metric shows its latest value, how it moved since the reading before, and a small
sparkline. Small movements are not reported as trends — the app knows that 0.1 kg is noise.
There are no axes and no legends here on purpose: you want a direction, not a chart to
study.

**BMI** appears once you have logged a weight and set your height in Settings. It is shown
as a band ("In the healthy range") rather than a bare number, because the number on its own
tells you very little.

**Left/right differences** of 3% or more are called out. Some difference is entirely
normal; single-sided work evens it out over time. That is why left and right are separate
fields rather than one averaged number.

**Suggested cadence:** weigh in weekly, take the tape measure out monthly. Often enough to
see a trend, rare enough to ignore the noise.

**Photos** — one a week, same light, same spot, same time of day. They are stored on the
device, downscaled, and never uploaded anywhere. Over twelve months they will show you
things the numbers will not.

### History
Every finished session, expandable to the set-by-set detail. Sessions can be deleted from
here if something was logged by accident.

### Journey
The year as a ring, the four phases as a timeline, and eighteen achievements. This is the
"look how far" screen — worth opening on a bad week.

---

## Settings

- **Name, height, units** — height is only used for BMI. Units are display-only; switching
  between metric and imperial never rewrites your history.
- **Theme** — light, dark, or follow the system.
- **Equipment** — tick Adjustable dumbbells or Pull-up bar when you get them and the
  programme starts prescribing the better movement immediately, falling back down the chain
  (dumbbell → band → bodyweight) for anything you do not have.
- **Phase** — the programme unlocks phases as the calendar advances but always asks before
  moving you.
- **Reminders** — workout, mobility and evening review times. Honest caveat: these are
  local notifications scheduled while the app is open. There is no push server, and iPadOS
  only delivers them once the app is installed to the Home Screen.
- **Sound and vibration** — timer chimes and haptic feedback on set completion.
- **Storage** — whether the browser has agreed to protect your data from eviction, and how
  much space Arohan is using. See below.
- **Backup** — export and import JSON. See the [Backup Guide](BACKUP_GUIDE.md).
- **Reset** — wipes everything and starts over. It asks twice.

---

## Your data

**All of it is on this device.** IndexedDB, in the browser. There is no server, no account,
no sync and no analytics. Nothing you log leaves the iPad unless you export it yourself.

That is the point of the app, and it is also the risk. Two things follow from it:

1. **Check the storage state in Settings.** Arohan asks the browser to protect its data at
   every launch. Safari decides based on how much you use the app, so it may say "not
   protected yet" early on and change its mind later. Installing to the Home Screen and
   opening it daily is what convinces it.
2. **Export a backup regularly.** Clearing website data, deleting the app, or a browser
   eviction takes everything with it, silently. A monthly export takes ten seconds — see
   the [Backup Guide](BACKUP_GUIDE.md).

---

## Habits that make the app work

- **Check in every morning.** Fifteen seconds; it is what the coaching runs on.
- **Weigh in weekly, measure monthly, photograph weekly.**
- **Log the honest RPE**, not the flattering one.
- **Use the swap when it offers one.** A Lower Back routine on a bad day is not a lost day
  — it is the reason next week is not a lost week.
- **Export on the first of the month.**

---

## Troubleshooting

**Reminders never arrive.** They only fire while the app is running, and only if it is
installed to the Home Screen. This is a limitation of PWAs without a push server, not a
bug. Treat them as in-app nudges.

**A session vanished.** Only two things remove an in-progress session: finishing it, and
discarding it explicitly. If the app was cleared or the data evicted, the backup is the only
route back.

**The app looks stale after an update.** New versions install on the next launch. Close it
fully and reopen.

**Numbers look wrong after switching units.** They should not — storage is always metric and
conversion happens at display time. If a value looks wrong, check the entry rather than the
conversion.

**Nothing loads / a blank screen.** The app catches render errors and offers a reload. If
it persists, an export before anything else is the safe first move.

---

Related: [Backup Guide](BACKUP_GUIDE.md) · [Release Notes](RELEASE_NOTES.md) ·
[Known Issues](KNOWN_ISSUES.md)
