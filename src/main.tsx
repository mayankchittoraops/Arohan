import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import { App } from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './hooks/useToast'
import { ensureSeeded } from './storage/db'
import './index.css'

void ensureSeeded()

// Ask the browser not to evict this origin. Everything lives in IndexedDB with
// no server copy, and iOS clears storage for origins it thinks are idle — this
// is the difference between an inconvenience and losing a year of history.
// Safari only grants it for installed or frequently-used sites, so it is asked
// every launch rather than once.
void navigator.storage?.persist?.().catch(() => undefined)

// Takes the newest build on the next visit; nothing is interrupted mid-session.
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ToastProvider>
          <App />
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
