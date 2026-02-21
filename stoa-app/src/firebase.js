// Firebase configuration for STOA
// Replace with your own Firebase project credentials in .env
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

// ─── Firestore Data Shape Reference ──────────────────────────────────────────
//
// Collection: shops
//   doc id: google_place_id (string)
//   fields:
//     name: string
//     address: string
//     lat: number
//     lng: number
//     borough: string           // "Brooklyn", "Manhattan", etc.
//     is_partner: boolean       // shows punch card
//     amenities: string[]       // ["wifi", "outlets", "dog_friendly", ...]
//     current_occupancy: string // "low" | "moderate" | "busy" | "packed"
//     last_report_at: timestamp
//     report_count_24h: number
//
// Collection: reports
//   doc id: auto-generated
//   fields:
//     shop_id: string           // ref to shops doc
//     user_id: string           // ref to users
//     occupancy: string         // "low" | "moderate" | "busy" | "packed"
//     created_at: timestamp
//
// Collection: users
//   doc id: firebase auth uid
//   fields:
//     display_name: string
//     email: string
//     is_premium: boolean
//     punch_cards: map          // { shop_id: stamp_count }
//     points: number
//     created_at: timestamp
