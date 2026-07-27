import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Page, PageHeader, PageSkeleton } from '@/components/Page'
import { Segmented } from '@/components/Fields'
import { useJourney } from '@/hooks/useJourney'
import { useSettings } from '@/hooks/useSettings'
import { useStats } from '@/hooks/useStats'
import { useToday } from '@/hooks/useToday'
import { BodyTab } from './BodyTab'
import { HistoryTab } from './HistoryTab'
import { JourneyTab } from './JourneyTab'
import { OverviewTab } from './OverviewTab'

type Tab = 'overview' | 'body' | 'history' | 'journey'

const TABS: Array<{ value: Tab; label: string }> = [
  { value: 'overview', label: 'Overview' },
  { value: 'body', label: 'Body' },
  { value: 'history', label: 'History' },
  { value: 'journey', label: 'Journey' },
]

export function ProgressPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('overview')
  const today = useToday()
  const settings = useSettings()
  const stats = useStats(settings, today)
  const journey = useJourney(settings, today)

  if (!settings || !journey) return <PageSkeleton wide />

  return (
    <Page wide>
      <PageHeader title="Progress" subtitle={`Day ${journey.day} of your year`} />

      <Segmented
        value={tab}
        onChange={setTab}
        options={TABS}
        ariaLabel="Progress section"
        className="mb-6"
      />

      {tab === 'overview' ? <OverviewTab stats={stats} today={today} /> : null}
      {tab === 'body' ? (
        <BodyTab
          today={today}
          units={settings.units}
          heightCm={settings.heightCm}
          onOpenSettings={() => navigate('/settings')}
        />
      ) : null}
      {tab === 'history' ? <HistoryTab today={today} /> : null}
      {tab === 'journey' ? (
        <JourneyTab stats={stats} settings={settings} journeyDay={journey.day} />
      ) : null}
    </Page>
  )
}
