export interface PreparedImage {
  blob: Blob
  width: number
  height: number
}

/**
 * Downscales and re-encodes a picked photo before it goes into IndexedDB. A
 * modern phone photo is several megabytes; at 1280px it is a couple of hundred
 * kilobytes, which keeps the JSON backup a sane size.
 */
export async function prepareImage(file: File, maxDimension = 1280, quality = 0.82): Promise<PreparedImage> {
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas is unavailable')
    context.drawImage(bitmap, 0, 0, width, height)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    )
    if (!blob) throw new Error('Could not encode the image')

    return { blob, width, height }
  } finally {
    bitmap.close()
  }
}
