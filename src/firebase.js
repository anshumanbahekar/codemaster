// ─────────────────────────────────────────────────────────────────────────────
//  Firebase config — replace with your own project values
//  https://console.firebase.google.com → Project Settings → Your apps
// ─────────────────────────────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || "YOUR_API_KEY",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || "YOUR_AUTH_DOMAIN",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || "YOUR_PROJECT_ID",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || "YOUR_STORAGE_BUCKET",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID|| "YOUR_SENDER_ID",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || "YOUR_APP_ID",
}

const app  = initializeApp(firebaseConfig)
export const db   = getFirestore(app)
export const auth = getAuth(app)

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function signInAnon() {
  try {
    const cred = await signInAnonymously(auth)
    return cred.user
  } catch (e) {
    console.warn('Firebase auth failed (offline mode):', e.message)
    return null
  }
}

export function onAuthChange(cb) {
  return onAuthStateChanged(auth, cb)
}

// ── User profile ──────────────────────────────────────────────────────────────
export async function saveUserProfile(uid, data) {
  try {
    await setDoc(doc(db, 'users', uid), data, { merge: true })
  } catch (e) {
    console.warn('saveUserProfile failed:', e.message)
  }
}

export async function loadUserProfile(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    return snap.exists() ? snap.data() : null
  } catch (e) {
    console.warn('loadUserProfile failed:', e.message)
    return null
  }
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
export async function submitScore(uid, username, wpm, accuracy, lang, snippetLabel) {
  try {
    const id = `${uid}_${Date.now()}`
    await setDoc(doc(db, 'leaderboard', id), {
      uid, username, wpm, accuracy, lang, snippetLabel,
      timestamp: Date.now(),
    })
  } catch (e) {
    console.warn('submitScore failed:', e.message)
  }
}

export async function getTopScores(n = 20) {
  try {
    const q = query(collection(db, 'leaderboard'), orderBy('wpm', 'desc'), limit(n))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.warn('getTopScores failed:', e.message)
    return []
  }
}

export function subscribeLeaderboard(n = 20, cb) {
  try {
    const q = query(collection(db, 'leaderboard'), orderBy('wpm', 'desc'), limit(n))
    return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  } catch (e) {
    console.warn('subscribeLeaderboard failed:', e.message)
    return () => {}
  }
}

// ── Custom snippets (shared) ──────────────────────────────────────────────────
export async function saveCustomSnippet(uid, snippet) {
  try {
    const id = `${uid}_${snippet.id}`
    await setDoc(doc(db, 'snippets', id), { ...snippet, uid, createdAt: Date.now() })
  } catch (e) {
    console.warn('saveCustomSnippet failed:', e.message)
  }
}

export async function getCommunitySnippets(n = 30) {
  try {
    const q = query(collection(db, 'snippets'), orderBy('createdAt', 'desc'), limit(n))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ ...d.data(), firebaseId: d.id }))
  } catch (e) {
    console.warn('getCommunitySnippets failed:', e.message)
    return []
  }
}
