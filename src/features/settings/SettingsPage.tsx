import { useRef, useState } from 'react'
import { Bell, Check, Download, RotateCcw, Upload } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card, SectionTitle } from '@/components/Card'
import { ConfirmDialog } from '@/components/Feedback'
import { Field, NumberInput, Segmented, TextInput, Toggle } from '@/components/Fields'
import { Page, PageHeader, PageSkeleton } from '@/components/Page'
import { EQUIPMENT_LABELS, OPTIONAL_EQUIPMENT, PHASES } from '@/data/program'
import { useJourney } from '@/hooks/useJourney'
import {
  notificationSupport,
  requestNotificationPermission,
  useReminders,
} from '@/hooks/useReminders'
import { useSettings, useUpdateSettings } from '@/hooks/useSettings'
import { useToast } from '@/hooks/useToast'
import { useToday } from '@/hooks/useToday'
import { cn } from '@/lib/cn'
import { formatShort } from '@/lib/date'
import { fromDisplayLength, roundTo, toDisplayLength } from '@/lib/format'
import { BackupError, downloadBackup, exportBackup, importBackup } from '@/storage/backup'
import { resetDatabase } from '@/storage/db'
import type { Equipment } from '@/data/types'
import type { PhaseNumber } from '@/data/types'
import type { ThemeMode, Units } from '@/storage/types'

const REMINDER_LABELS = {
  workout: 'Workout',
  mobility: 'Mobility',
  review: 'Evening check-in',
} as const

export function SettingsPage() {
  const today = useToday()
  const settings = useSettings()
  const updateSettings = useUpdateSettings()
  const journey = useJourney(settings, today)
  const { show } = useToast()

  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmImport, setConfirmImport] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useReminders(settings)

  if (!settings || !journey) return <PageSkeleton />

  const toggleEquipment = (item: Equipment) => {
    const owned = settings.equipment.includes(item)
    void updateSettings({
      equipment: owned
        ? settings.equipment.filter((e) => e !== item)
        : [...settings.equipment, item],
    })
  }

  const enableReminders = async (enabled: boolean) => {
    if (!enabled) return void updateSettings({ remindersEnabled: false })

    const permission = await requestNotificationPermission()
    if (permission === 'granted') {
      void updateSettings({ remindersEnabled: true })
    } else if (permission === 'unsupported') {
      show('This browser has no notification support', 'warning')
    } else {
      show('Notifications are blocked in your browser settings', 'warning')
    }
  }

  const doExport = async () => {
    setBusy(true)
    try {
      downloadBackup(await exportBackup())
      show('Backup downloaded', 'success')
    } finally {
      setBusy(false)
    }
  }

  const doImport = async (raw: string) => {
    setBusy(true)
    try {
      const result = await importBackup(raw)
      const summary = Object.entries(result.counts)
        .filter(([, count]) => count > 0)
        .map(([label, count]) => `${count} ${label}`)
        .join(', ')
      show(summary ? `Restored ${summary}` : 'Backup restored', 'success')
    } catch (error) {
      show(error instanceof BackupError ? error.message : 'That backup could not be read', 'warning')
    } finally {
      setBusy(false)
      setConfirmImport(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <Page>
      <PageHeader title="Settings" />

      {/* --------------------------------------------------------- you */}
      <SectionTitle>You</SectionTitle>
      <Card className="mb-6 space-y-5">
        <Field label="Name">
          <TextInput
            value={settings.name}
            onChange={(event) => void updateSettings({ name: event.target.value })}
            placeholder="Your name"
          />
        </Field>

        <Field label="Units">
          <Segmented
            value={settings.units}
            onChange={(units: Units) => void updateSettings({ units })}
            ariaLabel="Units"
            options={[
              { value: 'metric', label: 'kg · cm' },
              { value: 'imperial', label: 'lb · in' },
            ]}
          />
        </Field>

        <Field
          label={`Height (${settings.units === 'metric' ? 'cm' : 'in'})`}
          hint="Only used to work out BMI from your weight."
        >
          <NumberInput
            value={
              settings.heightCm == null
                ? null
                : roundTo(toDisplayLength(settings.heightCm, settings.units), 1)
            }
            min={0}
            max={260}
            step={settings.units === 'metric' ? 1 : 0.5}
            decimals={1}
            onChange={(value) =>
              void updateSettings({
                heightCm: value == null ? null : fromDisplayLength(value, settings.units),
              })
            }
          />
        </Field>
      </Card>

      {/* ------------------------------------------------------- theme */}
      <SectionTitle>Appearance</SectionTitle>
      <Card className="mb-6">
        <Segmented
          value={settings.theme}
          onChange={(theme: ThemeMode) => void updateSettings({ theme })}
          ariaLabel="Theme"
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'System' },
          ]}
        />
      </Card>

      {/* --------------------------------------------------- equipment */}
      <SectionTitle>Equipment</SectionTitle>
      <Card className="mb-6">
        <p className="mb-4 text-sm leading-relaxed text-muted">
          A mat, a wall and a sturdy chair are always assumed. Tick the rest as it arrives and the
          sessions adapt on their own.
        </p>
        <div className="space-y-2">
          {OPTIONAL_EQUIPMENT.map((item) => {
            const owned = settings.equipment.includes(item)
            return (
              <button
                key={item}
                type="button"
                role="checkbox"
                aria-checked={owned}
                onClick={() => toggleEquipment(item)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-colors',
                  owned ? 'border-accent bg-accent-soft' : 'border-line bg-sunken',
                )}
              >
                <span className={cn('flex-1 font-medium', owned ? 'text-accent' : 'text-ink')}>
                  {EQUIPMENT_LABELS[item]}
                </span>
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full border-2',
                    owned
                      ? 'border-accent bg-accent text-accent-ink'
                      : 'border-line-strong text-transparent',
                  )}
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* ------------------------------------------------------- phase */}
      <SectionTitle>Programme</SectionTitle>
      <Card className="mb-6">
        <p className="text-sm leading-relaxed text-muted">
          Day {journey.day}, started {formatShort(settings.startDate)}. You are on phase{' '}
          {settings.phase} of 4.
        </p>
        <div className="mt-4 space-y-2">
          {PHASES.map((phase) => {
            const active = settings.phase === phase.number
            const available = phase.number <= journey.calendarPhase
            return (
              <button
                key={phase.number}
                type="button"
                disabled={!available}
                onClick={() =>
                  void updateSettings({
                    phase: phase.number as PhaseNumber,
                    phasePromptDismissedFor: null,
                  })
                }
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left',
                  active ? 'border-accent bg-accent-soft' : 'border-line bg-sunken',
                  !available && 'opacity-45',
                )}
              >
                <span className="flex-1">
                  <span className={cn('block font-medium', active ? 'text-accent' : 'text-ink')}>
                    {phase.number}. {phase.name}
                  </span>
                  <span className="block text-xs text-faint">
                    Days {phase.startDay}–{phase.endDay}
                  </span>
                </span>
                {active ? <Check className="h-5 w-5 text-accent" /> : null}
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-faint">
          Later phases open up as the calendar reaches them. Move on only when the current sessions
          feel comfortable — there is no prize for rushing.
        </p>
      </Card>

      {/* --------------------------------------------------- reminders */}
      <SectionTitle>Reminders</SectionTitle>
      <Card className="mb-6">
        <Toggle
          checked={settings.remindersEnabled}
          onChange={(enabled) => void enableReminders(enabled)}
          label="Local reminders"
          description="Gentle nudges at the times below. Nothing is sent anywhere — they fire from this device while Arohan is open."
        />

        {settings.remindersEnabled ? (
          <div className="mt-4 space-y-3 border-t border-line pt-4">
            {(Object.keys(REMINDER_LABELS) as Array<keyof typeof REMINDER_LABELS>).map((key) => (
              <label key={key} className="flex items-center gap-3">
                <span className="flex-1 text-[15px] text-ink">{REMINDER_LABELS[key]}</span>
                <input
                  type="time"
                  value={settings.reminders[key] ?? ''}
                  onChange={(event) =>
                    void updateSettings({
                      reminders: { ...settings.reminders, [key]: event.target.value || null },
                    })
                  }
                  className="h-11 rounded-xl border border-line bg-sunken px-3 tabular focus:border-accent focus:outline-none"
                />
              </label>
            ))}
          </div>
        ) : null}

        {notificationSupport() === 'denied' ? (
          <p className="mt-4 flex gap-2 rounded-2xl bg-amber/10 px-4 py-3 text-sm leading-relaxed text-amber">
            <Bell className="mt-0.5 h-4 w-4 shrink-0" />
            Notifications are blocked for this site. Allow them in your browser settings to turn
            reminders back on.
          </p>
        ) : null}
      </Card>

      {/* ------------------------------------------------ session feel */}
      <SectionTitle>During a session</SectionTitle>
      <Card className="mb-6 divide-y divide-line">
        <Toggle
          checked={settings.soundEnabled}
          onChange={(soundEnabled) => void updateSettings({ soundEnabled })}
          label="Timer sounds"
          description="A soft tone when a set is ticked and when rest ends."
        />
        <Toggle
          checked={settings.hapticsEnabled}
          onChange={(hapticsEnabled) => void updateSettings({ hapticsEnabled })}
          label="Vibration"
          description="Where the device supports it. iPadOS does not."
        />
      </Card>

      {/* ---------------------------------------------------- your data */}
      <SectionTitle>Your data</SectionTitle>
      <Card className="mb-6 space-y-3">
        <p className="text-sm leading-relaxed text-muted">
          Everything lives in this browser and never leaves it. Export regularly — clearing site
          data would take it all with it.
        </p>

        <Button
          variant="secondary"
          full
          disabled={busy}
          icon={<Download className="h-4 w-4" />}
          onClick={() => void doExport()}
        >
          Export backup
        </Button>

        <Button
          variant="secondary"
          full
          disabled={busy}
          icon={<Upload className="h-4 w-4" />}
          onClick={() => fileRef.current?.click()}
        >
          Import backup
        </Button>

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (!file) return
            void file.text().then(setConfirmImport)
          }}
        />

        <Button
          variant="danger"
          full
          disabled={busy}
          icon={<RotateCcw className="h-4 w-4" />}
          onClick={() => setConfirmReset(true)}
        >
          Reset all data
        </Button>
      </Card>

      <p className="px-1 pb-4 text-center text-xs leading-relaxed text-faint">
        Arohan · offline, on this device only.
        <br />
        No account, no cloud, no analytics.
      </p>

      <ConfirmDialog
        open={confirmReset}
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          void resetDatabase().then(() => {
            setConfirmReset(false)
            show('Everything has been reset', 'success')
          })
        }}
        title="Reset everything?"
        description="Every workout, measurement, habit and photo will be deleted from this device. Export a backup first if there is any chance you will want it back."
        confirmLabel="Delete everything"
        destructive
      />

      <ConfirmDialog
        open={confirmImport != null}
        onCancel={() => {
          setConfirmImport(null)
          if (fileRef.current) fileRef.current.value = ''
        }}
        onConfirm={() => {
          if (confirmImport) void doImport(confirmImport)
        }}
        title="Restore this backup?"
        description="Everything currently on this device will be replaced by the contents of the file."
        confirmLabel="Restore"
        destructive
      />
    </Page>
  )
}
