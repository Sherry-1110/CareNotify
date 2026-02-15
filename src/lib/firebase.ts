import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  updateProfile,
  type Auth,
  type User,
} from 'firebase/auth'
import { getFirestore, doc, setDoc, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

let app: FirebaseApp
let auth: Auth | undefined
let db: Firestore | undefined

export function initFirebase() {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
    return { app, auth, db }
  }
  return null
}

export function getFirebaseAuth(): Auth | null {
  return auth ?? null
}

export function getFirebaseDb(): Firestore | null {
  return db ?? null
}

export async function signInAsGuest() {
  if (!auth) return null
  const { user } = await signInAnonymously(auth)
  return user
}

export async function signInWithEmail(email: string, password: string) {
  if (!auth) return null
  const { user } = await signInWithEmailAndPassword(auth, email, password)
  return user
}

export async function signUpWithEmail(email: string, password: string) {
  if (!auth) return null
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  return user
}

export async function signUpWithProfile(
  email: string,
  password: string,
  displayName?: string,
  phone?: string
): Promise<User | null> {
  if (!auth) return null
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  if (displayName) {
    await updateProfile(user, { displayName })
  }
  if (db && (phone || displayName)) {
    try {
      await setDoc(doc(db, 'users', user.uid), {
        displayName: displayName ?? '',
        phone: phone ?? '',
        email: user.email ?? email,
        createdAt: new Date().toISOString(),
      })
    } catch {
      // Firestore may not be set up or rules may deny; auth still succeeds
    }
  }
  return user
}

export async function signInWithGoogle() {
  if (!auth) return null
  const provider = new GoogleAuthProvider()
  const { user } = await signInWithPopup(auth, provider)
  return user
}

export async function signInWithApple() {
  if (!auth) return null
  const provider = new OAuthProvider('apple.com')
  const { user } = await signInWithPopup(auth, provider)
  return user
}

export { app, auth, db }
