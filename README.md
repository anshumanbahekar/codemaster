# codemaster ⌨️

> **Production-grade developer typing race** — type real code snippets, race AI peers, level up your muscle memory. Now with Firebase, themes, sound, custom snippets, timed mode, and more.

![codemaster](https://img.shields.io/badge/codemaster-v2.0-58a6ff?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646cff?style=for-the-badge&logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Zero CSS Files](https://img.shields.io/badge/CSS%20files-0-f85149?style=for-the-badge)

---

## ✨ What's New in v2.0

| Feature | Details |
|---------|---------|
| 🔥 **Firebase** | Real-time global leaderboard, anonymous auth, profile sync, community snippets |
| 💾 **LocalStorage** | XP, badges, streak, settings, custom snippets — survive refresh |
| 🎨 **5 Themes** | Dark (GitHub), Light, Dracula, Monokai, Nord |
| 🔊 **Sound Effects** | Web Audio API — key clicks, combos, completions, boss hits |
| ✏️ **Custom Snippets** | Create your own, saved to localStorage + Firebase |
| ⏱ **Timed Mode** | 60-second blitz — type as many snippets as possible |
| 📊 **Lang Chart** | Per-language WPM + accuracy breakdown bar chart |
| 🃏 **Score Card** | Copy your result as formatted text to share |
| ⚙️ **Settings Panel** | Username, theme, sound, font size, ghost toggle, keybind reference |
| 50+ Snippets | JS, TS, Python, SQL, Rust, Go, Bash, CSS across easy/medium/hard |

---

## 🚀 Features

### 🏎️ Race Mode
- **50+ real code snippets** across 8 languages
- **Live ghost race** — 5 AI peers (28–130 wpm) racing you in real time
- **Per-character color coding** — green = correct, red = wrong
- **Language + difficulty filters** — combine any lang with Easy / Medium / Hard
- **Combo multiplier** — scale animation + sound every 10× streak
- **Custom snippet creator** — add your own code, syncs to Firebase

### 💀 Boss Mode
- 120 second gauntlet, hard + medium snippets
- **No backspace** — every keystroke is final
- **3 lives** — one wrong key costs a life
- Live timer ring, WPM graph streaming at the bottom

### ⏱ Timed Mode
- 60 second sprint, type as many snippets as possible
- Backspace allowed, accuracy still tracked
- Records your personal best

### 🤖 AI Lesson (Claude API)
After finishing any snippet, hit **AI lesson** — Claude explains:
- Core concept name
- What the code does
- Why developers use it
- How it works
- A common gotcha
- A related code example

### 📊 Stats (4 sub-tabs)
- **Overview** — WPM history sparkline + 6 stat boxes
- **Rhythm** — keystroke timeline bar chart (fast/slow/error/backspace)
- **Prediction** — linear regression predicting WPM in 5/10/20 sessions
- **Langs** — per-language WPM + accuracy bar chart

### 🏅 Badges (15 achievements)
| Badge | Condition |
|-------|-----------|
| ⚡ First blood | Complete your first snippet |
| 🚀 30 wpm | Hit 30 WPM |
| 💎 60 wpm | Hit 60 WPM |
| 👑 90 wpm | Hit 90 WPM |
| 🔱 120 wpm | Hit 120 WPM |
| 🎯 Perfectionist | 100% accuracy |
| 💥 On fire | 30× combo |
| 💰 XP grinder | 1000 total XP |
| 🏦 XP millionaire | 5000 total XP |
| 🌐 Polyglot | 6 different languages |
| 🔥 Streak master | 5 sessions in a row |
| 💀 Boss slayer | Survive boss mode |
| 🦾 Hard carry | 10 hard snippets |
| ✏️ Snippet author | Create a custom snippet |
| ⚡ Speed runner | Timed mode above 60 wpm |

### 🏆 Firebase Leaderboard
- **Real-time** — updates live as other players finish
- Anonymous auth — no sign-up required
- Score submitted automatically after each race
- Shows: username, language, accuracy, WPM

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Install & Run

```bash
git clone https://github.com/anshumanbahekar/codemaster.git
cd codemaster
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🔥 Firebase Setup

### 1. Create a Firebase project
Go to [console.firebase.google.com](https://console.firebase.google.com) → New project

### 2. Enable services
- **Authentication** → Anonymous sign-in → Enable
- **Firestore Database** → Create database → Start in test mode

### 3. Get your config
Project Settings → Your apps → Add web app → Copy config

### 4. Create `.env` file

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 5. Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /leaderboard/{doc} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    match /snippets/{doc} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 🤖 AI Lesson Setup

The AI lesson calls the Anthropic Claude API.

> ⚠️ For production, proxy through your own backend to protect your key.

For local dev, update the fetch call in `src/App.jsx` to add your key:

```js
headers: {
  'Content-Type': 'application/json',
  'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true',
},
```

And add to `.env`:
```env
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

---

## 📁 Project Structure

```
codemaster/
├── index.html              # Entry point
├── vite.config.js          # Vite 5 config
├── package.json            # React 18 + Firebase + Vite
├── .env                    # Firebase + Anthropic keys (not committed)
├── .gitignore
├── README.md
└── src/
    ├── main.jsx            # ReactDOM.createRoot
    ├── App.jsx             # Full app — 1100+ lines, zero CSS files
    ├── firebase.js         # Firebase auth, Firestore, leaderboard, snippets
    ├── sounds.js           # Web Audio API sound engine
    └── themes.js           # Dark, Light, Dracula, Monokai, Nord
```

---

## 🎨 Adding Snippets

Add to the `BUILTIN_SNIPS` array in `src/App.jsx`:

```js
{
  id: 50,              // unique number
  lang: 'TS',          // JS | TS | PY | SQL | RUST | GO | BASH | CSS
  diff: 'hard',        // easy | medium | hard
  xp: 200,             // base XP reward
  label: 'My snippet', // display label
  code: `your code here`,
}
```

Or use the **+ custom** button in the app UI — no code editing needed.

---

## 🚀 Deploy

### Vercel (recommended)
```bash
npm run build
# drag dist/ to vercel.com/new or use CLI:
npx vercel --prod
```

### Netlify
```bash
npm run build
# drag dist/ to app.netlify.com/drop
```

### GitHub Pages
```bash
npm run build
npx gh-pages -d dist
```

---

## 🤝 Contributing

PRs welcome!

```bash
git checkout -b feature/kotlin-snippets
git commit -m "feat: add Kotlin snippets"
git push origin feature/kotlin-snippets
# Open a PR
```

Ideas:
- [ ] More languages (Kotlin, Swift, C++, Elixir, Haskell)
- [ ] Multiplayer rooms with WebSockets
- [ ] Export score card as PNG
- [ ] Daily challenge (same snippet for everyone)
- [ ] Mobile touch keyboard support

---

## 📜 License

MIT — use it, fork it, ship it.

---

<div align="center">
  <strong>codemaster</strong> · v2.0 · zero CSS files · pure JS rendering
  <br/>
  <sub>Built with React 18 + Vite + Firebase + Anthropic Claude API</sub>
  <br/><br/>
  <sub>Made for developers who want their fingers to match their ambitions</sub>
</div>
