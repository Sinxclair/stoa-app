import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SplashScreen() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    // Auto-advance after 2.2s
    const timer = setTimeout(() => {
      if (user) {
        navigate('/home', { replace: true })
      } else {
        navigate('/auth', { replace: true })
      }
    }, 2200)
    return () => clearTimeout(timer)
  }, [user, loading, navigate])

  return (
    <div className="screen bg-cream pattern-bg">
      {/* Scattered background icons */}
      <div className="absolute inset-0 z-0 opacity-[0.07] pointer-events-none overflow-hidden">
        <span className="material-symbols-outlined absolute top-[15%] left-[10%] text-6xl" style={{ transform: 'rotate(-15deg)' }}>coffee</span>
        <span className="material-symbols-outlined absolute top-[20%] right-[15%] text-5xl" style={{ transform: 'rotate(10deg)' }}>laptop_mac</span>
        <span className="material-symbols-outlined absolute bottom-[30%] left-[15%] text-5xl" style={{ transform: 'rotate(25deg)' }}>wifi</span>
        <span className="material-symbols-outlined absolute bottom-[25%] right-[10%] text-6xl" style={{ transform: 'rotate(-5deg)' }}>local_cafe</span>
        <span className="material-symbols-outlined absolute top-[45%] left-[80%] text-4xl" style={{ transform: 'rotate(45deg)' }}>menu_book</span>
        <span className="material-symbols-outlined absolute top-[55%] left-[15%] text-4xl" style={{ transform: 'rotate(-45deg)' }}>grain</span>
      </div>

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1">
        <h1 className="text-primary font-display text-[64px] font-bold leading-none tracking-tight">STOA</h1>
        <p className="text-primary/60 text-sm italic mt-2 tracking-wide">Workspace Finder</p>
      </div>

      {/* Loading bar */}
      <div className="relative z-10 w-full max-w-xs px-8 pb-16 flex flex-col items-center gap-4">
        <p className="text-primary text-lg font-medium text-center italic">Brewing real-time updates...</p>
        <div className="relative w-full h-3 rounded-full bg-[#e3dcd2] overflow-hidden border border-[#d7cec7]">
          <div
            className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-[2000ms] ease-out"
            style={{ width: '85%' }}
          >
            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 rounded-t-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
