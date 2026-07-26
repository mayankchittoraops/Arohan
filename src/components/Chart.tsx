import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartOptions,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import { useMemo } from 'react'
import { useCssVars } from '@/hooks/useCssVars'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Filler,
)

const TOKENS = ['ink', 'muted', 'faint', 'line', 'accent', 'teal', 'rose', 'sky'] as const

export interface Series {
  label: string
  points: Array<number | null>
  token?: (typeof TOKENS)[number]
  fill?: boolean
}

function useBaseOptions(): { options: ChartOptions<'line' | 'bar'>; colours: Record<string, string> } {
  const colours = useCssVars(TOKENS)

  const options = useMemo(
    () =>
      ({
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index' as const, intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: colours.ink,
            titleColor: colours.line,
            bodyColor: colours.line,
            padding: 10,
            cornerRadius: 10,
            displayColors: false,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: colours.faint, font: { size: 11 }, maxRotation: 0, autoSkipPadding: 16 },
          },
          y: {
            grid: { color: colours.line },
            border: { display: false },
            ticks: { color: colours.faint, font: { size: 11 }, maxTicksLimit: 5 },
          },
        },
      }) satisfies ChartOptions<'line' | 'bar'>,
    [colours],
  )

  return { options, colours }
}

export function LineChart({
  labels,
  series,
  height = 200,
  beginAtZero = false,
}: {
  labels: string[]
  series: Series[]
  height?: number
  beginAtZero?: boolean
}) {
  const { options, colours } = useBaseOptions()

  const data = {
    labels,
    datasets: series.map((s) => {
      const colour = colours[s.token ?? 'accent']
      return {
        label: s.label,
        data: s.points,
        borderColor: colour,
        backgroundColor: s.fill ? `color-mix(in srgb, ${colour} 18%, transparent)` : colour,
        fill: s.fill ?? false,
        tension: 0.35,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointBackgroundColor: colour,
        spanGaps: true,
      }
    }),
  }

  return (
    <div style={{ height }}>
      <Line
        data={data}
        options={
          {
            ...options,
            scales: { ...options.scales, y: { ...options.scales?.y, beginAtZero } },
          } as ChartOptions<'line'>
        }
      />
    </div>
  )
}

export function BarChart({
  labels,
  series,
  height = 200,
}: {
  labels: string[]
  series: Series[]
  height?: number
}) {
  const { options, colours } = useBaseOptions()

  const data = {
    labels,
    datasets: series.map((s) => ({
      label: s.label,
      data: s.points,
      backgroundColor: colours[s.token ?? 'accent'],
      borderRadius: 6,
      maxBarThickness: 28,
    })),
  }

  return (
    <div style={{ height }}>
      <Bar
        data={data}
        options={
          {
            ...options,
            scales: { ...options.scales, y: { ...options.scales?.y, beginAtZero: true } },
          } as ChartOptions<'bar'>
        }
      />
    </div>
  )
}
