import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  signInWithPopup,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase'

export default function AuthScreen() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGoogleSignIn() {
    setLoading(true)
    setError('')
    try {
      await signInWithPopup(auth, googleProvider)
      navigate('/home', { replace: true })
    } catch (err) {
      setError('Google sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen bg-cream flex flex-col items-center justify-between pb-10 pt-12 px-6 overflow-hidden">

      {/* Hero image */}
      <div className="w-full aspect-[4/3] rounded-[2.5rem] overflow-hidden mb-8 shadow-sm relative">
        <img
          src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80"
          alt="Cozy cafe with laptop"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/5" />
      </div>

      {/* Brand */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-primary font-display text-[40px] font-black tracking-tight leading-none uppercase">STOA</h1>
        <p className="text-primary/70 text-lg font-medium">Your workspace, anywhere.</p>
      </div>

      {/* Buttons */}
      <div className="flex flex-col w-full gap-4">
        <button
          onClick={() => navigate('/create-account')}
          className="w-full h-14 bg-primary text-cream rounded-full font-bold text-lg tracking-wide shadow-lg active:scale-[0.98] transition-all"
        >
          Join the Community
        </button>

        <button
          onClick={() => navigate('/login')}
          className="w-full h-14 border-2 border-primary text-primary rounded-full font-bold text-lg tracking-wide active:scale-[0.98] transition-all"
        >
          Log In
        </button>

        {/* Divider */}
        <div className="flex items-center py-1">
          <div className="flex-grow border-t border-primary/20" />
          <span className="mx-4 text-primary/50 text-sm font-medium">Or continue with</span>
          <div className="flex-grow border-t border-primary/20" />
        </div>

        {/* Social */}
        <div className="flex justify-center gap-6">
          {/* Google */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            aria-label="Sign in with Google"
            className="w-14 h-14 rounded-full bg-white border border-primary/10 flex items-center justify-center shadow-sm hover:shadow-md hover:scale-105 transition-all"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </button>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button
          onClick={() => navigate('/home')}
          className="text-primary/50 hover:text-primary text-sm font-semibold text-center mt-1 transition-colors"
        >
          Explore as Guest
        </button>
      </div>
    </div>
  )
}
