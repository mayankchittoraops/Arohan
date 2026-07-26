import { startSession } from '@/storage/repo'
import { buildSession, type BuildSessionInput } from '@/storage/session'

/** Creates a fresh session and makes it the active one, replacing any other. */
export async function beginSession(input: BuildSessionInput) {
  const session = buildSession(input)
  await startSession(session)
  return session
}
