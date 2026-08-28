import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || '',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || '',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || '',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID|| '',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '',
}

let app, db, auth
try {
  if (firebaseConfig.apiKey) {
    app  = initializeApp(firebaseConfig)
    db   = getFirestore(app)
    auth = getAuth(app)
  }
} catch(e) { console.warn('Firebase init skipped:', e.message) }

export async function signInAnon() {
  if (!auth) return null
  try { return (await signInAnonymously(auth)).user } catch(e) { console.warn('Auth failed:', e.message); return null }
}

export function onAuthChange(cb) {
  if (!auth) return ()=>{}
  return onAuthStateChanged(auth, cb)
}

export async function saveUserProfile(uid, data) {
  if (!db) return
  try { await setDoc(doc(db,'users',uid), data, {merge:true}) } catch(e) {}
}

export async function loadUserProfile(uid) {
  if (!db) return null
  try { const s=await getDoc(doc(db,'users',uid)); return s.exists()?s.data():null } catch(e) { return null }
}

export async function submitScore(uid, username, wpm, accuracy, lang, snippetLabel) {
  if (!db) return
  try { await setDoc(doc(db,'leaderboard',`${uid}_${Date.now()}`), {uid,username,wpm,accuracy,lang,snippetLabel,timestamp:Date.now()}) } catch(e) {}
}

export function subscribeLeaderboard(n=20, cb) {
  if (!db) return ()=>{}
  try {
    const q=query(collection(db,'leaderboard'),orderBy('wpm','desc'),limit(n))
    return onSnapshot(q, snap=>cb(snap.docs.map(d=>({id:d.id,...d.data()}))))
  } catch(e) { return ()=>{} }
}

export async function saveCustomSnippet(uid, snippet) {
  if (!db) return
  try { await setDoc(doc(db,'snippets',`${uid}_${snippet.id}`), {...snippet,uid,createdAt:Date.now()}) } catch(e) {}
}

export async function getCommunitySnippets(n=30) {
  if (!db) return []
  try {
    const q=query(collection(db,'snippets'),orderBy('createdAt','desc'),limit(n))
    const snap=await getDocs(q)
    return snap.docs.map(d=>({...d.data(),firebaseId:d.id}))
  } catch(e) { return [] }
}
