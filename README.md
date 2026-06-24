# Dev Finder

**Dev Finder** is a mobile app that helps developers find peers in a geographic area, fostering new projects, knowledge sharing and professional growth.

Because physical proximity between users is important for such collaboration, you are encouraged to fork this project for your own local area, add your own branding, maybe translate it, and release it to the app stores.

---

## Screens

| Screen | Description |
|---|---|
| **SignUp** | Full-screen map background, GitHub username input, GPS capture, registration |
| **Map** | Live map showing all registered developers as circular avatar pins |
| **Profile** | WebView loading the tapped developer's GitHub profile |

---

## Setup

### Prerequisites

- Node.js 18+
- Expo Go installed on your device or an Android/iOS emulator

### Install

```bash
git clone https://github.com/hulusisaglar12/dev-finder.git
cd dev-finder
npm install
```

### Run the backend

```bash
npm run backend
# Starts json-server on http://localhost:3000
```

### Run the app

```bash
npm start
# Then press 'a' for Android emulator or scan QR code with Expo Go
```

### Android emulator note

The emulator cannot reach `localhost` on your PC directly. `src/config.ts` is already set to `http://10.0.2.2:3000` which is the Android emulator's alias for the host machine. Run this once before starting:

```bash
adb reverse tcp:3000 tcp:3000
```

### Physical device note

Replace `API_URL` in `src/config.ts` with your PC's local IP address:

```ts
export const API_URL = 'http://192.168.x.x:3000';
```

### Online backend (no local server needed)

To use the public read-only demo data instead of running json-server locally, change `src/config.ts` to:

```ts
export const API_URL = 'https://my-json-server.typicode.com/bvc-mobile-dev/dev-finder';
```

---

## Data Flow Analysis

### Signup flow

```
┌─────────────────────────────────────────────────────────────────┐
│  User types GitHub username → taps Sign Up                      │
│         │                                                        │
│         ▼                                                        │
│  GET https://api.github.com/users/{username}                    │
│  • 404 → Alert "There is no such username on GitHub"            │
│  • 200 → extract name, bio, avatar_url                          │
│         │                                                        │
│         ▼                                                        │
│  expo-location: requestForegroundPermissionsAsync()             │
│  • Denied → Alert, stop                                         │
│  • Granted → getCurrentPositionAsync() → lat/lng                │
│         │                                                        │
│         ▼                                                        │
│  POST http://localhost:3000/users                               │
│  { username, name, bio, avatarUrl, latitude, longitude }        │
│         │                                                        │
│         ▼                                                        │
│  AsyncStorage.setItem('@username', username)                     │
│         │                                                        │
│         ▼                                                        │
│  navigation.replace('Map')                                      │
└─────────────────────────────────────────────────────────────────┘
```

### App relaunch flow

```
┌──────────────────────────────────────────────────────┐
│  App opens                                           │
│       │                                              │
│       ▼                                              │
│  AsyncStorage.getItem('@username')                   │
│  • Found  → go directly to Map (skip SignUp)         │
│  • Missing → go to SignUp                            │
└──────────────────────────────────────────────────────┘
```

### Map data flow

```
┌──────────────────────────────────────────────────────┐
│  MapScreen mounts                                    │
│       │                                              │
│       ├──▶ expo-location: get GPS → set map region   │
│       │                                              │
│       └──▶ GET /users → setDevs([...])               │
│                 │                                    │
│                 ▼                                    │
│  onMapReady → fitToCoordinates(all dev locations)    │
│  → avatar pins rendered at real GPS coordinates      │
│  → tap pin → Callout (name, bio, "View Profile →")  │
│  → tap callout → ProfileScreen                       │
└──────────────────────────────────────────────────────┘
```

### Profile flow

```
┌──────────────────────────────────────────────────────┐
│  Callout pressed → navigate('Profile', { username }) │
│       │                                              │
│       ▼                                              │
│  WebView loads https://github.com/{username}         │
│  Header: "Github Profile" + back arrow               │
└──────────────────────────────────────────────────────┘
```

---

## Identified Improvements

### 1. Duplicate user registration

**Current behaviour:** If the same GitHub username signs up twice, two records are created in the backend with different IDs. The map then shows two pins for the same person.

**Recommended fix:** Before POST, query `GET /users?username={username}`. If a record already exists, update the coordinates with `PATCH /users/{id}` instead of creating a new one. This is more realistic — a returning user's location may have changed.

---

### 2. No real-time map updates

**Current behaviour:** The map fetches users once on mount (`useEffect` with `[]`). New users who sign up while you are on the map screen never appear until you log out and back in.

**Recommended fix:** Either poll the backend every 30 seconds:

```ts
useEffect(() => {
  const interval = setInterval(fetchDevs, 30000);
  return () => clearInterval(interval);
}, []);
```

Or migrate to WebSockets so the server pushes updates to all connected clients instantly — a better solution at scale.

---

### 3. Silent failure when backend is unreachable

**Current behaviour:** If `json-server` is not running, the `catch` block does nothing and the map renders empty with no explanation to the user.

**Recommended fix:** Show a user-facing error state:

```ts
.catch(() => setError('Could not load developers. Is the server running?'));
```

And render an error banner on the map so the user knows the data is missing rather than assuming no developers are registered.

---

### 4. json-server is not a production backend

**Current behaviour:** `json-server` reads and writes directly to `db.json`, a flat file with no authentication, no validation, and no access control. Anyone who knows the URL can POST, PATCH, or DELETE any record.

**Recommended fix:** Replace with a proper backend stack:
- **API:** Node.js + Express with input validation (e.g. `zod`)
- **Database:** PostgreSQL with a `users` table indexed on `username`
- **Auth:** GitHub OAuth so only verified GitHub accounts can register
- **Hosting:** Deploy to Railway, Render, or Fly.io so the server is always online and the mobile app does not depend on someone's laptop

---

### 5. Avatar images are not cached locally

**Current behaviour:** Every time the map renders, each avatar `Image` makes a fresh network request to `avatars.githubusercontent.com`. On slow connections this causes pins to appear blank until the image loads.

**Recommended fix:** Use `expo-image` instead of React Native's built-in `Image`. It has built-in disk caching and a `placeholder` prop so a fallback is shown while the real avatar loads:

```tsx
import { Image } from 'expo-image';
<Image source={{ uri: dev.avatarUrl }} placeholder={blurhash} style={styles.avatar} />
```

---

## Tech Stack

| Package | Purpose |
|---|---|
| `expo` (~47) | Managed React Native runtime |
| `react-native-maps` | Map rendering + markers + callouts |
| `expo-location` | GPS coordinates |
| `@react-native-async-storage/async-storage` | Persist login session |
| `react-native-webview` | GitHub profile screen |
| `@react-navigation/native-stack` | Screen navigation |
| `json-server` | Local mock REST API |
