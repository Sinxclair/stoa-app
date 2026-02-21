import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { MOCK_SHOPS, OCCUPANCY_CONFIG } from '../data/mockShops'

const OPTIONS = [
  { level: 'low',      emoji: '🟢', label: 'Plenty of Space',  desc: 'Lots of open seats' },
  { level: 'moderate', emoji: '🟡', label: 'Getting Busy',     desc: 'Some seats available' },
  { level: 'busy',     emoji: '🟠', label: 'Busy',             desc: 'Limited seating' },
  { level: 'packed',   emoji: '🔴', label: 'Packed',           desc: 'No seats available' },
]

export default function CheckIn() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const shop = MOCK_SHOPS.find(s => s.id === id) ?? MOCK_SHOPS[0]

  const [selected, setSelected] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit() {
    if (!selected) return
    setSubmitting(true)
    try {
      if (import.meta.env.VITE_FIREBASE_PROJECT_ID) {
        // Write report to Firestore
        await addDoc(collection(db, 'reports'), {
          shop_id: id,
          user_id: user?.uid ?? 'anonymous',
          occupancy: selected,
          created_at: serverTimestamp(),
        })
        // Update shop's current occupancy
        await updateDoc(doc(db, 'shops', id), {
          current_occupancy: selected,
          last_report_at: serverTimestamp(),
          report_count_24h: increment(1),
        })
      }
      setSubmitted(true)
      // Navigate back after brief celebration
      setTimeout(() => navigate(`/shop/${id}`), 1800)
    } catch (err) {
      console.error('Report failed:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="screen bg-cream flex flex-col items-center justify-center gap-6 px-8">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-4xl animate-bounce">
          ✅
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-display font-bold text-primary">Thanks for reporting!</h2>
          <p className="text-primary/60 mt-2">You just helped the community find their next spot.</p>
        </div>
        <div className="bg-primary text-cream rounded-2xl px-6 py-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-accent text-[20px]">stars</span>
          <span className="font-bold">+10 STOA Points</span>
        </div>
      </div>
    )
  }

  return (
    <div className="screen bg-cream">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-12">
        <button onClick={() => navigate(-1)} className="flex size-11 items-center justify-center rounded-full bg-white shadow-sm">
          <span className="material-symbols-outlined text-primary text-[24px]">arrow_back</span>
        </button>
        <h1 className="text-primary font-display font-bold text-lg">Report Occupancy</h1>
        <div className="w-11" />
      </div>

      {/* Shop name */}
      <div className="px-6 pb-6">
        <div className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-primary/5 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-cream text-2xl">local_cafe</span>
          </div>
          <div>
            <h2 className="font-display font-bold text-primary">{shop.name}</h2>
            <p className="text-primary/60 text-sm">{shop.address}</p>
          </div>
        </div>
      </div>

      {/* Prompt */}
      <div className="px-6 mb-6">
        <h3 className="text-2xl font-display font-bold text-primary mb-1">How busy is it right now?</h3>
        <p className="text-primary/60 text-sm">One tap — takes 2 seconds.</p>
      </div>

      {/* Occupancy options */}
      <div className="flex flex-col gap-3 px-6 flex-1">
        {OPTIONS.map(opt => {
          const isSelected = selected === opt.level
          const config = OCCUPANCY_CONFIG[opt.level]
          return (
            <button
              key={opt.level}
              onClick={() => setSelected(opt.level)}
              className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                isSelected
                  ? 'border-primary bg-primary text-white shadow-lg'
                  : 'border-primary/10 bg-white text-primary'
              }`}
            >
              <span className="text-3xl">{opt.emoji}</span>
              <div className="text-left">
                <p className={`font-display font-bold text-lg ${isSelected ? 'text-white' : 'text-primary'}`}>
                  {opt.label}
                </p>
                <p className={`text-sm ${isSelected ? 'text-white/70' : 'text-primary/60'}`}>
                  {opt.desc}
                </p>
              </div>
              {isSelected && (
                <div className="ml-auto">
                  <span className="material-symbols-outlined text-white text-[24px]">check_circle</span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Submit */}
      <div className="px-6 py-6 mt-4">
        <button
          onClick={handleSubmit}
          disabled={!selected || submitting}
          className="w-full h-14 rounded-full bg-primary text-cream font-bold text-lg shadow-lg disabled:opacity-40 active:scale-[0.98] transition-all"
        >
          {submitting ? 'Submitting...' : 'Submit Report'}
        </button>
        <p className="text-center text-xs text-primary/40 mt-3">
          Reports refresh automatically every 30 minutes
        </p>
      </div>
    </div>
  )
}
