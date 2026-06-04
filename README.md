# 🎵 Day 12: VibeStream - Spotify Playlist Builder & Player

VibeStream is a premium, glassmorphism-themed React application that enables users to search for songs, listen to audio previews, construct custom playlists, and export them directly to their Spotify accounts.

It features a **Dual-Mode Architecture**:
1. **Sandbox Mode (Default/Offline)**: Runs out-of-the-box using a high-quality local database of royalty-free tracks (genres like Lofi, Synthwave, Acoustic, and Pop) with fully functional audio playbacks, progress seekers, volume sliders, and local storage persistence.
2. **Spotify API Connected Mode**: Logs into Spotify using secure PKCE Authorization Flow to query the entire 100M+ track database, listen to preview streams, and export curated playlists directly to the user's Spotify account.

---

## 🚀 Key Features

* **Sleek Spotify-Like Dark UI**: A glassmorphic design featuring custom gradients, layout grids, animated audio visualizer bars, and glowing interactive hover effects.
* **Dual Sandbox & Online Search**: Instantly switch from offline testing with local curated MP3 files to Spotify's global catalog.
* **Interactive Audio Player**: Built-in player at the bottom supporting:
  * Full audio control (Play, Pause, Volume Slider, Mute toggle, Track Progress Seeker).
  * Smooth looping/repeating option.
  * Real-time CSS-animated visualizer bars that bounce during active playback.
  * Auto-advance playback (automatically plays the next song on the active search list or playlist).
* **Playlist Curator**: Create, rename, delete custom collections, and rearrange songs dynamically using "Move Up" and "Move Down" controls.
* **Spotify Export**: Save your customized playlist straight to your personal Spotify account with a single click.

---

## 🛠️ Tech Stack & Design

* **Core Framework**: React 19 (Vite-based boilerplate)
* **Styling**: Vanilla CSS with custom glassmorphism panels, CSS variables, keyframe animations, and custom scrollbars/input sliders.
* **Icons**: `lucide-react`
* **API Integration**: Spotify Web API (PKCE OAuth Flow, Users Profile, Search, and Playlists creation APIs).
* **State Management**: React State with synchronization to `localStorage` (for preserving user playlists, volume, and Client ID settings).

---

## 📚 What I Learned

1. **Proof Key for Code Exchange (PKCE) on SPAs**: Implemented Spotify's recommended PKCE Auth Flow entirely client-side. Used the browser's native Web Crypto API (`window.crypto.subtle`) to generate code challenges (SHA-256) and verifiers without installing large external third-party cryptographic libraries.
2. **Encapsulating HTML5 Audio in React**: Managed HTML5 audio elements dynamically using React refs, syncing complex states (playback triggers, seeking adjustments, volume changes, auto-advances, and metadata durations) between parent dashboards and the player component.
3. **Resilient API Design & Fallbacks**: Designed a Sandbox fallback mode that is active when the user does not have or enter a Spotify Client ID, ensuring the app is immediately interactive and functional without API keys. Handles missing Spotify audio previews gracefully inside the UI when restricted tracks are returned from Spotify.

---

## 🔧 Installation & Local Setup

### 1. Clone the repository and navigate to the project directory:
```bash
cd "DAY12 -- MUSIC PLAYLIST"
```

### 2. Install dependencies:
```bash
npm install
```

### 3. Run the development server:
```bash
npm run dev
```

The app will start at `http://localhost:5173/`. Open it in your web browser.

---

## 🎧 Connecting to Spotify API

To unlock full search and playlist exports, you need a Spotify Client ID:

1. Visit the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and log in.
2. Click **Create app**.
3. Set your App Name and Description.
4. Under **Redirect URIs**, add exactly: `http://localhost:5173/` (make sure to include the trailing slash).
5. Tick the Developer Agreement and click **Save**.
6. Copy the **Client ID** from your App Settings.
7. Open VibeStream, go to the **Spotify Setup** tab, paste your Client ID, and click **Connect Spotify Account**.
# VibeStream
