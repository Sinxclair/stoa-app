import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const PUNCH_CARDS = [
  { id: 'bean-leaf', name: 'Bean & Leaf', stamped: 4, total: 10, reward: 'Free pastry after 10 stamps' },
  { id: 'urban-grind', name: 'Urban Grind', stamped: 8, total: 10, reward: 'Free Latte on your next visit!' },
]

const REWARDS = [
  { id: 'espresso', title: 'Free Espresso', pts: 500, location: 'Redeem at The Grind', available: true },
  { id: 'meeting', title: '1h Meeting Room', pts: 1000, location: 'Valid at all STOA hubs', available: true },
  { id: 'lunch', title: 'Free Lunch Combo', pts: 2000, location: 'Any sandwich + drink', available: false, ptsNeeded: 750 },
  { id: 'premium', title: '1 Month Premium', pts: 5000, location: 'Unlock all features', available: false, premiumOnly: true },
]

export default function RewardsScreen() {
  const navigate = useNavigate()
  const { user, userProfile, isPremium } = useAuth()
  const points = userProfile?.points ?? 1250

  return (
    <div className="screen bg-cream overflow-y-auto pb-20" style={{ scrollbarWidth: 'none' }}>

      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center bg-cream/95 backdrop-blur-sm p-4 pb-2 justify-between border-b border-primary/5">
        <button onClick={() => navigate(-1)} className="flex size-10 items-center justify-center rounded-full hover:bg-black/5">
          <span className="material-symbols-outlined text-primary text-[24px]">arrow_back</span>
        </button>
        <h2 className="text-primary text-2xl font-display font-bold tracking-tight">STOA</h2>
        <div className="w-10" />
      </div>

      {/* Points hero */}
      <div className="flex flex-col items-center justify-center pt-8 pb-8 px-4 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full -z-10" style={{ background: '#C2A06E22', filter: 'blur(40px)' }} />
        <span className="bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm mb-2">
          {isPremium ? 'Platinum Member' : 'Gold Member'}
        </span>
        <h1 className="text-primary font-display text-[56px] font-bold leading-none tracking-tight">{points.toLocaleString()}</h1>
        <p className="text-primary/60 text-sm font-medium italic mb-6">STOA Points Balance</p>

        <div className="w-full max-w-xs flex flex-col gap-2">
          <div className="flex justify-between items-end px-2">
            <span className="text-primary text-xs font-bold uppercase tracking-wider">Digital Nomad</span>
            <span className="text-primary/50 text-xs italic">250 pts to Platinum</span>
          </div>
          {/* Progress dots */}
          <div className="flex w-full justify-between items-center px-1">
            {[...Array(4)].map((_, i) => (
              <span key={i} className="material-symbols-outlined text-accent text-xl">grain</span>
            ))}
            {[...Array(2)].map((_, i) => (
              <span key={i} className="material-symbols-outlined text-primary/10 text-xl">grain</span>
            ))}
          </div>
        </div>
      </div>

      {/* Premium upsell */}
      {!isPremium && (
        <div className="px-4 pb-6">
          <div className="relative overflow-hidden rounded-2xl bg-primary p-5 shadow-lg">
            <div className="absolute -left-4 -top-4 w-16 h-16 bg-accent/20 rounded-full blur-xl" />
            <div className="relative z-10 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-accent text-lg">workspace_premium</span>
                <span className="text-accent text-xs font-bold uppercase tracking-widest">Premium Only</span>
              </div>
              <div>
                <h3 className="text-white font-display text-xl font-bold mb-1 italic">Double Points at Quiet Zones</h3>
                <p className="text-white/80 text-xs leading-relaxed max-w-[80%]">Upgrade to Premium and earn 2x points on all verified quiet cafes.</p>
              </div>
              <button
                onClick={() => navigate('/upgrade')}
                className="self-start mt-1 bg-accent text-white text-xs font-bold py-2 px-5 rounded-lg"
              >
                Upgrade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Punch Cards */}
      <div className="flex flex-col pb-6 border-b border-primary/5">
        <div className="flex items-center justify-between px-4 pb-4">
          <h3 className="text-primary font-display text-xl font-bold italic">Your Punch Cards</h3>
          <button className="text-primary/60 text-xs font-bold uppercase tracking-wide">View All</button>
        </div>
        <div className="flex w-full overflow-x-auto px-4 pb-4 gap-4 snap-x" style={{ scrollbarWidth: 'none' }}>
          {PUNCH_CARDS.map(card => (
            <div key={card.id} className="snap-center shrink-0 w-72 bg-white rounded-xl p-5 border border-primary/10 flex flex-col gap-4 relative shadow-sm">
              <div className="flex items-center gap-4 border-b border-primary/5 pb-3">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-2xl">local_cafe</span>
                </div>
                <div>
                  <span className="text-primary font-display font-bold text-lg">{card.name}</span>
                  <p className="text-primary/50 text-xs italic">{card.stamped}/{card.total} Coffees</p>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-y-3 gap-x-2 justify-items-center">
                {Array.from({ length: card.total }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-center size-8 ${
                      i < card.stamped ? '' : 'rounded-full border border-dashed border-primary/30 text-primary/10'
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-2xl"
                      style={i < card.stamped
                        ? { color: '#3E2723', transform: i % 2 === 0 ? 'rotate(-5deg)' : 'rotate(8deg)' }
                        : {}
                      }
                    >
                      {i === card.total - 1 ? 'card_giftcard' : 'local_cafe'}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-primary/50 text-[10px] text-center font-medium uppercase tracking-wider">{card.reward}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Rewards */}
      <div className="flex flex-col gap-4 p-4 pb-8">
        <h3 className="text-primary font-display text-xl font-bold italic">Available Rewards</h3>
        {REWARDS.map(reward => {
          const canRedeem = reward.available && points >= reward.pts
          return (
            <div
              key={reward.id}
              className={`flex flex-col bg-white rounded-xl overflow-hidden border ${
                reward.available ? 'border-accent/20 shadow-sm' : 'border-dashed border-primary/20 opacity-75'
              }`}
            >
              <div className="flex p-4 gap-4 items-start">
                <div className="w-20 h-20 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-3xl">
                    {reward.id === 'espresso' ? 'local_cafe' : reward.id === 'meeting' ? 'meeting_room' : reward.id === 'lunch' ? 'lunch_dining' : 'crown'}
                  </span>
                </div>
                <div className="flex flex-col flex-1 justify-between h-full min-h-[5rem]">
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="text-primary font-display font-bold text-lg leading-tight">{reward.title}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        reward.available ? 'bg-accent/10 text-accent border-accent/20' : 'bg-gray-100 text-gray-400 border-gray-200'
                      }`}>
                        {reward.pts.toLocaleString()} pts
                      </span>
                    </div>
                    <p className="text-primary/60 text-xs mt-1 italic">{reward.location}</p>
                  </div>
                  <div className="mt-3">
                    {canRedeem ? (
                      <button className="bg-primary hover:bg-primary/90 text-white text-xs font-bold py-1.5 px-4 rounded-full">
                        Redeem
                      </button>
                    ) : reward.ptsNeeded ? (
                      <div className="flex items-center gap-1 text-primary/40">
                        <span className="material-symbols-outlined text-[14px]">local_cafe</span>
                        <span className="text-[10px] font-medium">{reward.ptsNeeded} pts to go</span>
                      </div>
                    ) : (
                      <button className="flex items-center gap-1 text-accent text-[11px] font-bold uppercase tracking-widest border border-accent/30 px-2 py-1 rounded">
                        <span className="material-symbols-outlined text-sm">lock</span>
                        Premium Only
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
