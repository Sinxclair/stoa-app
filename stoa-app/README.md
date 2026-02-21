# STOA ☕

Real-time coffee shop occupancy app for remote workers in Brooklyn (and eventually NYC).

## Tech Stack
- **React** (Vite) — frontend
- **Firebase** — auth + Firestore real-time database
- **Google Maps API** — map + location
- **Tailwind CSS v3** — styling
- **React Router v7** — navigation
- **Vercel** — deployment

## Setup

### 1. Clone & install
```bash
npm install
```

### 2. Create your Firebase project
1. Go to https://console.firebase.google.com
2. Create a project called "stoa"
3. Enable **Authentication** → Email/Password + Google
4. Enable **Firestore Database** (start in test mode)
5. Copy your Firebase config

### 3. Get a Google Maps API Key
1. Go to https://console.cloud.google.com
2. Enable **Maps JavaScript API**
3. Create an API Key (restrict to your domain in production)

### 4. Add your credentials
```bash
cp .env.example .env
# Fill in your Firebase + Google Maps keys
```

### 5. Run locally
```bash
npm run dev
```

### 6. Deploy to Vercel
```bash
npm install -g vercel
vercel
# Add your env variables in the Vercel dashboard
```

## App Screens
| Route | Screen |
|-------|--------|
| `/` | Splash / Loading |
| `/auth` | Sign Up / Log In |
| `/create-account` | Create Account |
| `/login` | Log In |
| `/home` | Map Home (main screen) |
| `/shop/:id` | Shop Detail |
| `/checkin/:id` | Report Occupancy |
| `/rewards` | Punch Cards + Rewards |

## Firestore Collections
See `src/firebase.js` for the full data schema.

- **shops** — coffee shop data + live occupancy
- **reports** — user-submitted occupancy reports
- **users** — user profiles + punch cards + points

## Next Steps
- [ ] Add list view screen
- [ ] Build upgrade/paywall screen
- [ ] Set up Firebase Security Rules
- [ ] Seed Firestore with Brooklyn coffee shops via Google Places API
- [ ] Add push notifications for favorite shops
