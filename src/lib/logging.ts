import { getFirebaseDb } from './firebase'
import { doc, setDoc } from 'firebase/firestore'

export type ProgressEvent = 
  | 'step_1_landing'
  | 'step_1_guest'
  | 'step_1_signin'
  | 'step_2_start'
  | 'step_2_template_selected'
  | 'step_3_start'
  | 'step_3_sponsor_toggle'
  | 'step_4_start'
  | 'step_4_complete'
  | 'step_5_complete'
  | 'step_5_copy'
  | 'step_5_share'

export async function logProgress(
  userId: string | null,
  event: ProgressEvent,
  payload?: Record<string, unknown>
) {
  const db = getFirebaseDb()
  if (!db || !userId) return
  try {
    const ref = doc(db, 'progress', userId)
    await setDoc(ref, {
      lastEvent: event,
      payload: payload ?? {},
      updatedAt: new Date().toISOString(),
    }, { merge: true })
  } catch {
    // Fail silently for analytics
  }
}
