# codemaster ⌨️

> **Production-grade developer typing race** — type real code snippets, race AI peers, level up your muscle memory.

![codemaster](https://img.shields.io/badge/codemaster-58a6ff?style=for-the-badge&logoColor=white)
![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646cff?style=for-the-badge&logo=vite&logoColor=white)
![Zero CSS](https://img.shields.io/badge/CSS-zero-f85149?style=for-the-badge)

---

## ✨ Features

### 🏎️ Race Mode
- **26 real code snippets** across JS, TS, Python, SQL, Rust, Go, Bash, CSS
- **Live ghost race** — 5 AI peers (28–130 wpm) racing you in real time with animated progress bars
- **Per-character color coding** — green for correct, red for wrong, cursor highlights the next char
- **Language + difficulty filters** — Easy / Medium / Hard · pick your language
- **Combo multiplier** — scale animation every 10× streak
- **WPM sparkline** — live graph streams as you type

### 💀 Boss Mode
- **120 second gauntlet** cycling through hard + medium snippets
- **No backspace** — every keystroke counts
- **3 lives** — one wrong key costs a life, lose all 3 and it ends early
- Live progress ring timer · WPM graph streaming at the bottom

### 🤖 AI Lesson (Anthropic API)
After completing any snippet, hit **AI lesson** and Claude generates:
- What the concept is called
- Why developers use it
- How it works mechanically
- A common gotcha / edge case
- A related code example

### 📊 Stats
- **WPM history** sparkline across all sessions
- **Typing rhythm visualizer** — plots every keystroke as a bar (fast=green, slow=yellow, error=red, backspace=orange)
- **WPM prediction** — linear regression on your history, predicts your WPM in 5 / 10 / 20 sessions
- Session stats: best WPM, total XP, streak, combos, perfect runs, hard snippets done

### 🏅 Badges (12 achievements)
| Badge | Condition |
|-------|-----------|
| ⚡ First blood | Complete your first snippet |
| 🚀 30 wpm | Hit 30 WPM |
| 💎 60 wpm | Hit 60 WPM |
| 👑 90 wpm | Hit 90 WPM |
| 🔱 120 wpm | Hit 120 WPM |
| 🎯 Perfectionist | 100% accuracy on any snippet |
| 💥 On fire | 30× combo in one run |
| 💰 XP grinder | Earn 1000 total XP |
| 🌐 Polyglot | Type in 5 different languages |
| 🔥 Streak master | 5 sessions in a row |
| 💀 Boss slayer | Finish boss mode with lives remaining |
| 🦾 Hard carry | Complete 10 hard snippets |

### 🏆 Leaderboard
- Tracks your scores against built-in AI players
- Sorts by WPM, shows language and accuracy
- Your entry appears automatically after each session

### ⌨️ Keyboard Heatmap
- Blue overlay = keys you hit most
- Red overlay = keys you make errors on
- Hover any key for exact hit/error counts

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Install & Run

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/codemaster.git
cd codemaster

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Build for Production

```bash
npm run build
npm run preview
```

Output goes to `dist/` — deploy anywhere (Vercel, Netlify, GitHub Pages).

---

## 🤖 AI Lesson Setup

The AI lesson feature calls the **Anthropic Claude API** directly from the browser.

> ⚠️ For production, proxy the API through your own backend to protect your API key.

For local development, add your key to a `.env` file:

```env
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

Then update the fetch call in `src/App.jsx`:

```js
headers: {
  'Content-Type': 'application/json',
  'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true',
},
```

---

## 📁 Project Structure

```
codemaster/
├── index.html          # Entry HTML — minimal, just mounts React
├── vite.config.js      # Vite config
├── package.json
├── .gitignore
└── src/
    ├── main.jsx        # ReactDOM.createRoot
    └── App.jsx         # Entire app — ~900 lines of pure JS rendering
```

Zero external UI libraries. Zero CSS files. Every pixel drawn with inline JS style objects.

---

## 🎨 Design System

All design tokens live in the `C` constant at the top of `App.jsx`:

```js
const C = {
  bg:  '#0d1117',  // GitHub dark background
  bg2: '#161b22',  // Card background
  bg3: '#1c2128',  // Input / hover background
  b:   '#21262d',  // Default border
  t:   '#e6edf3',  // Primary text
  t2:  '#8b949e',  // Secondary text
  t3:  '#484f58',  // Muted text
  gr:  '#3fb950',  // Green (correct / success)
  bl:  '#58a6ff',  // Blue (primary / you)
  yl:  '#d29922',  // Yellow (warning / medium)
  rd:  '#f85149',  // Red (error / hard)
  pu:  '#bc8cff',  // Purple (XP / achievements)
  or:  '#f0883e',  // Orange (streak / boss)
  cy:  '#56d9e9',  // Cyan (AI lesson)
}
```

Language tags use `LM` (language meta), difficulty uses `DC` (difficulty colors).

---

## ⚙️ Customising Snippets

Add to the `SNIPS` array in `src/App.jsx`:

```js
{
  id: 26,              // unique id
  lang: 'JS',          // JS | TS | PY | SQL | RUST | GO | BASH | CSS
  diff: 'medium',      // easy | medium | hard
  xp: 150,             // base XP reward
  label: 'My snippet', // display name
  code: `your code here`,
}
```

Multiline snippets use `\n`:
```js
code: `function greet(name) {\n    return \`Hello, \${name}!\`;\n}`
```

---

## 🤝 Contributing

PRs welcome! Ideas for contribution:

- [ ] More snippets (Kotlin, Swift, C++, Haskell, Elixir)
- [ ] LocalStorage persistence for XP / achievements
- [ ] Custom snippet creator UI
- [ ] Export score card as image
- [ ] Timed mode (type as many snippets as possible in 60s)
- [ ] Per-language accuracy breakdown chart
- [ ] Sound feedback toggle

```bash
# Fork, then:
git checkout -b feature/my-feature
git commit -m "feat: add Kotlin snippets"
git push origin feature/my-feature
# Open a PR
```

---

## 📜 License

MIT — use it, fork it, ship it.

---

<div align="center">
  <strong>codemaster</strong> · zero css · pure js · built with React + Vite
  <br/>
  <sub>Made for developers who want their fingers to match their ambitions</sub>
</div>
