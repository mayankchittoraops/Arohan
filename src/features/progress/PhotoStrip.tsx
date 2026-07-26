import { useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Camera, Trash2 } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card, SectionTitle } from '@/components/Card'
import { ConfirmDialog } from '@/components/Feedback'
import { useToast } from '@/hooks/useToast'
import { formatShort, type DateKey } from '@/lib/date'
import { prepareImage } from '@/lib/image'
import { addPhoto, allPhotos, deletePhoto } from '@/storage/repo'
import type { ProgressPhoto } from '@/storage/types'

/** Keeps object URLs alive for exactly as long as the photos are on screen. */
function usePhotoUrls(photos: ProgressPhoto[]): Map<string, string> {
  const [urls, setUrls] = useState<Map<string, string>>(new Map())
  const key = useMemo(() => photos.map((p) => p.id).join(','), [photos])

  useEffect(() => {
    const next = new Map(photos.map((photo) => [photo.id, URL.createObjectURL(photo.blob)]))
    setUrls(next)
    return () => {
      for (const url of next.values()) URL.revokeObjectURL(url)
    }
    // Rebuilds only when the set of photos actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return urls
}

export function PhotoStrip({ today }: { today: DateKey }) {
  const { show } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const photos = useLiveQuery(() => allPhotos(), []) ?? []
  const urls = usePhotoUrls(photos)

  const onPick = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    try {
      const prepared = await prepareImage(file)
      await addPhoto(today, prepared.blob, prepared.width, prepared.height)
      show('Photo saved', 'success')
    } catch {
      show('That image could not be read', 'warning')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <SectionTitle
        action={
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="text-sm font-semibold text-accent disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Add photo'}
          </button>
        }
      >
        Weekly photos
      </SectionTitle>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => void onPick(event.target.files?.[0])}
      />

      {photos.length === 0 ? (
        <Card className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sunken text-faint">
            <Camera className="h-6 w-6" />
          </div>
          <p className="text-sm leading-relaxed text-muted">
            Same spot, same light, same time of week. Photos show what the scale misses.
          </p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => inputRef.current?.click()}
            icon={<Camera className="h-4 w-4" />}
          >
            Add the first one
          </Button>
        </Card>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-2">
          <ul className="flex gap-3">
            {photos.map((photo) => (
              <li key={photo.id} className="relative shrink-0">
                <img
                  src={urls.get(photo.id)}
                  width={photo.width}
                  height={photo.height}
                  alt={`Progress photo from ${formatShort(photo.date)}`}
                  className="h-52 w-auto rounded-2xl border border-line object-cover"
                />
                <span className="absolute bottom-2 left-2 rounded-lg bg-black/60 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
                  {formatShort(photo.date)}
                </span>
                <button
                  type="button"
                  aria-label={`Delete photo from ${formatShort(photo.date)}`}
                  onClick={() => setPendingDelete(photo.id)}
                  className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-xl bg-black/55 text-white backdrop-blur active:scale-95"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete != null}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) void deletePhoto(pendingDelete)
          setPendingDelete(null)
        }}
        title="Delete this photo?"
        description="It will be removed from this device. This cannot be undone."
        confirmLabel="Delete"
        destructive
      />
    </div>
  )
}
