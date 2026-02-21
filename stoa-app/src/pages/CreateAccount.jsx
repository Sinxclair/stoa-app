import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'

export default function CreateAccount() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.password) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password)
      await updateProfile(cred.user, { displayName: form.name })
      // Create Firestore user document
      await setDoc(doc(db, 'users', cred.user.uid), {
        display_name: form.name,
        email: form.email,
        is_premium: false,
        points: 0,
        punch_cards: {},
        created_at: serverTimestamp(),
      })
      navigate('/home', { replace: true })
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.')
      } else if (err.code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen bg-cream">
      {/* Back button */}
      <div className="flex items-center p-4 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="flex size-12 items-center justify-center rounded-full hover:bg-black/5 transition-colors"
        >
          <span className="material-symbols-outlined text-primary text-[24px]">arrow_back</span>
        </button>
      </div>

      {/* Icon */}
      <div className="px-6 pb-2 pt-2">
        <div className="size-16 rounded-full bg-primary/5 flex items-center justify-center text-primary mb-2">
          <span className="material-symbols-outlined text-[32px]">local_cafe</span>
        </div>
      </div>

      {/* Headline */}
      <div className="px-6 pt-2 pb-6">
        <h1 className="text-primary font-display text-[40px] font-medium italic leading-none mb-3">
          Create your Nook
        </h1>
        <p className="text-primary/70 text-lg leading-snug">
          Join the workspace for remote thinkers.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 pb-8 flex-1">
        <label className="flex flex-col w-full">
          <span className="text-primary text-base font-medium pb-2 ml-1">Full Name</span>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Virginia Woolf"
            className="h-14 rounded-2xl border border-gray-200 bg-white px-4 text-lg text-primary placeholder:text-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </label>

        <label className="flex flex-col w-full">
          <span className="text-primary text-base font-medium pb-2 ml-1">Work Email</span>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="name@company.com"
            className="h-14 rounded-2xl border border-gray-200 bg-white px-4 text-lg text-primary placeholder:text-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </label>

        <label className="flex flex-col w-full">
          <span className="text-primary text-base font-medium pb-2 ml-1">Password</span>
          <div className="relative flex items-center">
            <input
              type={showPw ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Create a password"
              className="w-full h-14 rounded-2xl border border-gray-200 bg-white px-4 pr-12 text-lg text-primary placeholder:text-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="button"
              onClick={() => setShowPw(p => !p)}
              className="absolute right-4 text-primary/40 hover:text-primary/70"
            >
              <span className="material-symbols-outlined text-[20px]">
                {showPw ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </label>

        {error && (
          <p className="text-red-500 text-sm px-1">{error}</p>
        )}

        <div className="h-2" />

        <button
          type="submit"
          disabled={loading}
          className="w-full h-14 rounded-full bg-primary text-cream font-bold text-lg shadow-lg active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        <div className="text-center pt-2">
          <p className="text-primary/60 text-base">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-primary font-bold hover:underline"
            >
              Log in
            </button>
          </p>
        </div>
      </form>
    </div>
  )
}
