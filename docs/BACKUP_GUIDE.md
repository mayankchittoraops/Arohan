# Arohan — Backup Guide

Arohan stores everything on your device and nowhere else. That is the design, and it is
also the one thing that can lose you a year of data. This page is short on purpose — read
all of it.

---

## The short version

**Settings → Backup → Export.** Once a month, and before anything risky. Keep the file
somewhere that is itself backed up: iCloud Drive, Files, an email to yourself.

---

## Why this matters more than it sounds

There is no server. Nothing is synced. If the data on this device goes, it is gone —
there is no "log in again and it comes back", because there is nothing to log in to.

Four things delete it, and none of them warn you first:

| What | How likely |
| --- | --- |
| Clearing website data in Safari settings | Easy to do by accident while clearing something else |
| Deleting the app from the Home Screen | Removes the data with it |
| Browser eviction under storage pressure | Silent, and the reason Arohan asks for a persistence grant |
| Replacing or resetting the iPad | Certain, eventually |

Arohan requests `navigator.storage.persist()` at every launch, which asks the browser not
to evict it. Safari grants that based on how much you use the app — Settings shows the
current state. A grant makes eviction very unlikely. It does not protect you from the other
three.

---

## Exporting

1. Open **Settings**.
2. Scroll to **Backup**.
3. Tap **Export backup**.
4. The file downloads as `arohan-backup-YYYY-MM-DD.json`.
5. **Move it somewhere durable.** On iPadOS, Save to Files → iCloud Drive. A copy sitting
   in Downloads on the same device that holds the original is not a backup.

Keep the last three. They are small and dated, and a corrupted or mistaken export is easier
to survive when there is an older one behind it.

### What is in the file

Everything, as plain JSON:

- Settings — name, height, units, theme, equipment, phase, reminders
- Daily check-ins — sleep, steps, energy, back pain, notes
- Workout history — every session, set by set, with RPE and before/after pain
- The in-progress session, if one is open
- Measurements — all sixteen metrics, every day you logged any of them
- Habit ticks
- Unlocked achievements
- Progress photos, base64-encoded inline

It is readable text. You can open it in any editor and see your own data, which is a
reasonable thing to want from something that claims to keep everything local.

### On file size

Everything except photos is tiny — a full year of daily check-ins, workouts and
measurements is on the order of a few hundred kilobytes.

Photos dominate. They are stored efficiently on the device but base64 in the export, which
inflates them by about a third. Weekly photos for a year will produce an export in the tens
of megabytes. That is normal. If it becomes unwieldy, delete older photos from the Body tab
before exporting — the numbers, which are what the trends run on, cost almost nothing.

---

## Restoring

1. **Settings → Backup → Import backup.**
2. Choose the `.json` file.
3. Confirm.

**Import replaces everything.** It is a restore, not a merge: every table is cleared and
refilled from the file, in a single transaction. Anything logged since that export is gone.

If the current device has data you want to keep, **export it first** — then you have both
files and can decide which one to keep.

The import will refuse a file that is not an Arohan backup, and refuse one written by a
newer version of the app than you are running. If it succeeds, it tells you what it
restored: daily entries, workouts, measurements, habits, photos.

### Moving to a new device

1. Old device: **Export**, and put the file in iCloud Drive.
2. New device: open the app link in Safari → **Share → Add to Home Screen**.
3. Launch it, get through onboarding (anything you type is about to be overwritten).
4. **Settings → Backup → Import**, choose the file.

Everything comes across: history, streak, phase, measurements, achievements and photos.

---

## A schedule that works

| When | Do |
| --- | --- |
| First of the month | Export, save to iCloud Drive |
| Before updating iPadOS | Export |
| Before clearing any website data | Export |
| Before a factory reset or a new device | Export, and verify the file is in iCloud, not just on the device |
| After a big milestone — a phase change, a personal best | Export, and keep that one |

Put the monthly one in a calendar reminder. The app's own reminders only fire while it is
open, which makes them the wrong tool for the one job you must not miss.

---

## If something has gone wrong

**The app opens empty and you have a backup** — import it. Nothing else to do.

**The app opens empty and you do not** — check whether you are opening it from the Home
Screen icon or from a browser tab, and in the same browser as before. Data is scoped per
browser and per origin. There is no recovery beyond that.

**An import fails.** The message says why: not JSON, not an Arohan file, or from a newer
version. A truncated download is the most common cause — re-export or re-download and try
again.

**You imported the wrong file.** If you exported before importing, import the other file.
If you did not, the data is gone. This is the reason for the "export first" step above.

---

## What Arohan will never do

- Upload your data anywhere
- Sync between devices
- Back up to a cloud on your behalf
- Ask you to create an account

All of those would need a server, which the app deliberately does not have. The trade is
straightforward: complete privacy, in exchange for you owning the backup. Ten seconds a
month.

---

Related: [User Guide](USER_GUIDE.md) · [Database Schema](DATABASE_SCHEMA.md)
