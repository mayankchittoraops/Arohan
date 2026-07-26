import { useEffect, useState } from 'react'

/**
 * Reads design tokens out of CSS so charts can be drawn in the current theme.
 * Re-reads whenever the `dark` class on the root element changes.
 */
export function useCssVars<T extends string>(names: readonly T[]): Record<T, string> {
  const read = () => {
    const styles = getComputedStyle(document.documentElement)
    return Object.fromEntries(
      names.map((name) => [name, styles.getPropertyValue(`--${name}`).trim()]),
    ) as Record<T, string>
  }

  const [values, setValues] = useState(read)

  useEffect(() => {
    const update = () => setValues(read())
    update()

    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
    // `names` is a static tuple at every call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return values
}
