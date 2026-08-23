// ─────────────────────────────────────────────────────────────────────────────
//  codemaster — Developer Typing Race
//  Production build · Zero CSS · Pure JS rendering
//  Stack: React 18 + Vite · AI via Anthropic API
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const C = {
  bg:  '#0d1117', bg2: '#161b22', bg3: '#1c2128', bg4: '#21262d',
  b:   '#21262d', b2:  '#30363d', b3:  '#484f58',
  t:   '#e6edf3', t2:  '#8b949e', t3:  '#484f58',
  gr:  '#3fb950', bl:  '#58a6ff', yl:  '#d29922', rd:  '#f85149',
  pu:  '#bc8cff', or:  '#f0883e', te:  '#39d353', cy:  '#56d9e9', pi: '#f778ba',
}

const LM = {
  JS:    { c: '#f7df1e', bg: '#2a2700', b: '#5a4f00' },
  TS:    { c: '#3178c6', bg: '#001a35', b: '#0a3d70' },
  PY:    { c: '#4fc3f7', bg: '#00202e', b: '#005070' },
  SQL:   { c: '#ff9800', bg: '#2b1a00', b: '#5a3800' },
  RUST:  { c: '#f0643b', bg: '#2b0d00', b: '#5a2010' },
  GO:    { c: '#00acd7', bg: '#00202e', b: '#004860' },
  BASH:  { c: '#85e89d', bg: '#002010', b: '#005020' },
  CSS:   { c: '#a855f7', bg: '#1a0030', b: '#380060' },
  CUSTOM:{ c: '#e6edf3', bg: '#1c2128', b: '#30363d' },
}
const DC = { easy: C.gr, medium: C.yl, hard: C.rd }

// ── SNIPPET LIBRARY ───────────────────────────────────────────────────────────
const SNIPS = [
  { id: 0,  lang: 'JS',   diff: 'easy',   xp: 80,  label: 'Arrow fn',       code: `const add = (a, b) => a + b;` },
  { id: 1,  lang: 'JS',   diff: 'easy',   xp: 90,  label: 'Filter even',    code: `const evens = arr.filter(n => n % 2 === 0);` },
  { id: 2,  lang: 'JS',   diff: 'medium', xp: 140, label: 'Destructure',    code: `const { name, age = 0, ...rest } = person;` },
  { id: 3,  lang: 'JS',   diff: 'medium', xp: 160, label: 'Promise chain',  code: `fetch(url).then(r => r.json()).then(data => render(data));` },
  { id: 4,  lang: 'JS',   diff: 'hard',   xp: 240, label: 'Debounce',       code: `const debounce=(fn,ms)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms);}};` },
  { id: 5,  lang: 'JS',   diff: 'hard',   xp: 220, label: 'Curry fn',       code: `const curry=fn=>(...a)=>a.length>=fn.length?fn(...a):curry(fn.bind(null,...a));` },
  { id: 6,  lang: 'JS',   diff: 'hard',   xp: 230, label: 'Deep clone',     code: `const deepClone = obj => JSON.parse(JSON.stringify(obj));` },
  { id: 7,  lang: 'TS',   diff: 'easy',   xp: 90,  label: 'Type alias',     code: `type Point = { x: number; y: number };` },
  { id: 8,  lang: 'TS',   diff: 'medium', xp: 150, label: 'Generic fn',     code: `function identity<T>(value: T): T { return value; }` },
  { id: 9,  lang: 'TS',   diff: 'hard',   xp: 240, label: 'Mapped type',    code: `type Readonly<T> = { readonly [K in keyof T]: T[K] };` },
  { id: 10, lang: 'TS',   diff: 'hard',   xp: 230, label: 'Conditional',    code: `type NonNullable<T>=T extends null|undefined?never:T;` },
  { id: 11, lang: 'PY',   diff: 'easy',   xp: 80,  label: 'List comp',      code: `squares = [x ** 2 for x in range(10)]` },
  { id: 12, lang: 'PY',   diff: 'medium', xp: 140, label: 'Lambda sort',    code: `people.sort(key=lambda p: (p['age'], p['name']))` },
  { id: 13, lang: 'PY',   diff: 'hard',   xp: 260, label: 'Decorator',      code: `def memo(fn):\n    cache={}\n    def w(*a):\n        if a not in cache:cache[a]=fn(*a)\n        return cache[a]\n    return w` },
  { id: 14, lang: 'SQL',  diff: 'easy',   xp: 85,  label: 'Select where',   code: `SELECT name, email FROM users WHERE active = 1;` },
  { id: 15, lang: 'SQL',  diff: 'medium', xp: 170, label: 'Group join',     code: `SELECT u.name,COUNT(o.id) FROM users u LEFT JOIN orders o ON u.id=o.user_id GROUP BY u.id;` },
  { id: 16, lang: 'SQL',  diff: 'hard',   xp: 200, label: 'Window fn',      code: `SELECT name, salary, RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS rnk FROM employees;` },
  { id: 17, lang: 'RUST', diff: 'medium', xp: 190, label: 'Lifetime',       code: `fn longest<'a>(x:&'a str,y:&'a str)->&'a str{if x.len()>y.len(){x}else{y}}` },
  { id: 18, lang: 'RUST', diff: 'hard',   xp: 280, label: 'Trait impl',     code: `impl fmt::Display for Point{fn fmt(&self,f:&mut fmt::Formatter)->fmt::Result{write!(f,"({},{})",self.x,self.y)}}` },
  { id: 19, lang: 'GO',   diff: 'easy',   xp: 90,  label: 'Goroutine',      code: `go func() { fmt.Println("running in goroutine") }()` },
  { id: 20, lang: 'GO',   diff: 'medium', xp: 150, label: 'Channel',        code: `ch:=make(chan int)\ngo func(){ch<-42}()\nval:=<-ch` },
  { id: 21, lang: 'GO',   diff: 'hard',   xp: 210, label: 'Defer recover',  code: `defer func(){if r:=recover();r!=nil{fmt.Println("recovered:",r)}}()` },
  { id: 22, lang: 'BASH', diff: 'easy',   xp: 80,  label: 'Find logs',      code: `find . -name "*.log" -mtime +7 -delete` },
  { id: 23, lang: 'BASH', diff: 'medium', xp: 175, label: 'Pipe chain',     code: `cat access.log|grep "404"|awk '{print $7}'|sort|uniq -c|sort -rn|head -20` },
  { id: 24, lang: 'CSS',  diff: 'easy',   xp: 75,  label: 'Flex center',    code: `display: flex; align-items: center; justify-content: center;` },
  { id: 25, lang: 'CSS',  diff: 'medium', xp: 130, label: 'Grid layout',    code: `display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;` },
]

// ── RANKS ─────────────────────────────────────────────────────────────────────
const RANKS = [
  { min: 0,   l: 'Novice',     c: '#8b949e' },
  { min: 25,  l: 'Apprentice', c: '#3fb950' },
  { min: 45,  l: 'Developer',  c: '#58a6ff' },
  { min: 65,  l: 'Senior',     c: '#d29922' },
  { min: 85,  l: 'Architect',  c: '#f0883e' },
  { min: 110, l: '10x Eng',    c: '#f85149' },
  { min: 140, l: 'Legend',     c: '#bc8cff' },
]
const getRank = wpm => [...RANKS].reverse().find(r => wpm >= r.min) || RANKS[0]

// ── KEYBOARD ──────────────────────────────────────────────────────────────────
const KROWS = [
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l',';'],
  ['z','x','c','v','b','n','m',',','.','/'],
]
const ALLK = KROWS.flat()

// ── AI PEERS ──────────────────────────────────────────────────────────────────
const AI_PEERS = [
  { name: 'junior_dev',  wpm: 28,  color: C.gr },
  { name: 'mid_eng',     wpm: 52,  color: C.bl },
  { name: 'senior_dev',  wpm: 74,  color: C.yl },
  { name: 'tech_lead',   wpm: 95,  color: C.or },
  { name: '10x_legend',  wpm: 130, color: C.rd },
]

// ── ACHIEVEMENTS ──────────────────────────────────────────────────────────────
const ACHIEVEMENTS = [
  { id: 'first',   icon: '⚡', label: 'First blood',    desc: 'Complete your first snippet',          cond: s => s.sessions >= 1 },
  { id: 's30',     icon: '🚀', label: '30 wpm',          desc: 'Hit 30 WPM',                           cond: s => s.best >= 30 },
  { id: 's60',     icon: '💎', label: '60 wpm',          desc: 'Hit 60 WPM',                           cond: s => s.best >= 60 },
  { id: 's90',     icon: '👑', label: '90 wpm',          desc: 'Hit 90 WPM',                           cond: s => s.best >= 90 },
  { id: 's120',    icon: '🔱', label: '120 wpm',         desc: 'Hit 120 WPM',                          cond: s => s.best >= 120 },
  { id: 'acc100',  icon: '🎯', label: 'Perfectionist',   desc: '100% accuracy on any snippet',         cond: s => s.perfect >= 1 },
  { id: 'combo30', icon: '💥', label: 'On fire',          desc: '30× combo in one run',                 cond: s => s.maxCombo >= 30 },
  { id: 'xp1k',   icon: '💰', label: 'XP grinder',       desc: 'Earn 1000 total XP',                   cond: s => s.xp >= 1000 },
  { id: 'poly',   icon: '🌐', label: 'Polyglot',          desc: 'Type in 5 different languages',        cond: s => s.langs >= 5 },
  { id: 'streak5',icon: '🔥', label: 'Streak master',    desc: 'Complete 5 sessions in a row',         cond: s => s.streak >= 5 },
  { id: 'boss',   icon: '💀', label: 'Boss slayer',       desc: 'Finish boss mode with lives remaining',cond: s => s.bossWins >= 1 },
  { id: 'hard10', icon: '🦾', label: 'Hard carry',        desc: 'Complete 10 hard snippets',            cond: s => s.hardDone >= 10 },
]

// ─────────────────────────────────────────────────────────────────────────────
//  PRIMITIVE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function Kbd({ c }) {
  return (
    <span style={{
      padding: '1px 6px', borderRadius: 4, fontSize: 10,
      border: `1px solid ${C.b2}`, background: C.bg3, color: C.t2,
    }}>{c}</span>
  )
}

function Tag({ label, color }) {
  return (
    <span style={{
      padding: '1px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600,
      color, background: color + '1a', border: `1px solid ${color}44`,
    }}>{label}</span>
  )
}

function ProgressRing({ pct, size = 40, stroke = 3, color, label }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const off = circ - (Math.min(100, pct) / 100) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.b2} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
      </svg>
      <span style={{ fontSize: 9, color, fontWeight: 700, zIndex: 1 }}>{label}</span>
    </div>
  )
}

function SparkLine({ data, color, width = 120, height = 32 }) {
  if (data.length < 2) return (
    <svg width={width} height={height}>
      <text x={width/2} y={height/2+4} textAnchor="middle" fill={C.t3} fontSize="10">—</text>
    </svg>
  )
  const max = Math.max(...data, 1)
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - 6) + 3
    const y = height - 3 - ((v / max) * (height - 8))
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  const lp = pts.split(' ').pop().split(',')
  return (
    <svg width={width} height={height}>
      <polyline points={pts} fill="none" stroke={color}
        strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lp[0]} cy={lp[1]} r="2.5" fill={color} />
    </svg>
  )
}

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{ background: C.bg3, borderRadius: 8, padding: '12px 14px',
      border: `1px solid ${C.b}`, flex: 1, minWidth: 80 }}>
      <div style={{ color: C.t3, fontSize: 9, marginBottom: 4,
        textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
      <div style={{ color, fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ color: C.t3, fontSize: 9, marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

function Toast({ msg, color, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400)
    return () => clearTimeout(t)
  }, [])
  return (
    <div style={{
      position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
      background: C.bg3, border: `1px solid ${color || C.b2}`,
      padding: '6px 18px', borderRadius: 8, fontSize: 11, color: color || C.t,
      zIndex: 100, pointerEvents: 'none', whiteSpace: 'nowrap',
      boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
    }}>{msg}</div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  HEATMAP KEY
// ─────────────────────────────────────────────────────────────────────────────
function HeatKey({ ch, heat, maxHeat, errHeat, maxErr }) {
  const hp = maxHeat > 0 ? heat / maxHeat : 0
  const ep = maxErr  > 0 ? errHeat / maxErr : 0
  const hasErr = ep > 0.25
  const bg = hasErr
    ? `rgba(248,81,73,${0.12 + ep * 0.55})`
    : hp === 0 ? C.bg3 : `rgba(88,166,255,${0.1 + hp * 0.72})`
  return (
    <div title={`${ch}: ${heat || 0} hits · ${errHeat || 0} errors`}
      style={{
        width: 26, height: 26, borderRadius: 4, background: bg, cursor: 'default',
        border: `1px solid ${hasErr ? '#f8514440' : hp > 0.3 ? '#58a6ff40' : C.b}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, color: hp > 0.55 || hasErr ? C.t : C.t3, fontWeight: 500,
        transition: 'background 0.35s',
      }}>{ch}</div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  RHYTHM VISUALIZER
// ─────────────────────────────────────────────────────────────────────────────
function RhythmViz({ events }) {
  if (!events.length) return (
    <div style={{ color: C.t3, fontSize: 11, padding: '10px 0' }}>
      Complete a snippet to see your typing rhythm
    </div>
  )
  const W = 560, H = 58
  const times = events.map(e => e.t - events[0].t)
  const maxT = Math.max(...times, 1)
  const gaps = times.slice(1).map((t, i) => t - times[i])
  const avgGap = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0
  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
        {[
          { l: 'avg gap',   v: Math.round(avgGap) + 'ms', c: C.bl },
          { l: 'keystrokes',v: events.length,              c: C.gr },
          { l: 'duration',  v: (maxT/1000).toFixed(1)+'s', c: C.yl },
          { l: 'errors',    v: events.filter(e=>e.type==='error').length, c: C.rd },
        ].map(s => (
          <div key={s.l}>
            <div style={{ color: C.t3, fontSize: 8 }}>{s.l}</div>
            <div style={{ color: s.c, fontSize: 13, fontWeight: 600 }}>{s.v}</div>
          </div>
        ))}
      </div>
      <svg width={W} height={H} style={{ display: 'block', background: C.bg3,
        borderRadius: 6, border: `1px solid ${C.b}`, marginBottom: 8 }}>
        <line x1={4} y1={H*0.5} x2={W-4} y2={H*0.5}
          stroke={C.b2} strokeWidth={0.5} strokeDasharray="4,4" />
        {events.map((ev, i) => {
          const x = (times[i] / maxT) * (W - 8) + 4
          const gap = i > 0 ? times[i] - times[i-1] : 0
          const slow = Math.min(1, gap / (avgGap * 2 || 1))
          const col = ev.type === 'error' ? C.rd
            : ev.type === 'backspace' ? C.or
            : slow > 0.65 ? C.yl : C.gr
          const h = ev.type === 'error' ? H*0.78
            : ev.type === 'backspace' ? H*0.45
            : H*0.28 + slow*H*0.38
          return <rect key={i} x={x-1} y={H-h} width={2} height={h}
            fill={col} opacity={0.85} rx={1} />
        })}
      </svg>
      <div style={{ display: 'flex', gap: 14 }}>
        {[{c:C.gr,l:'fast'},{c:C.yl,l:'slow'},{c:C.rd,l:'error'},{c:C.or,l:'backspace'}].map(s => (
          <span key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 9, color: C.t3 }}>
            <span style={{ width: 8, height: 8, background: s.c,
              borderRadius: 2, display: 'inline-block' }} />
            {s.l}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  WPM PREDICTION (linear regression)
// ─────────────────────────────────────────────────────────────────────────────
function WpmPredict({ history }) {
  if (history.length < 4) return (
    <div style={{ color: C.t3, fontSize: 11 }}>Need 4+ sessions for prediction</div>
  )
  const n = history.length
  const xs = history.map((_, i) => i)
  const sy = history.reduce((a, b) => a + b, 0)
  const sx = xs.reduce((a, b) => a + b, 0)
  const sxy = xs.reduce((a, x, i) => a + x * history[i], 0)
  const sxx = xs.reduce((a, x) => a + x * x, 0)
  const m = (n * sxy - sx * sy) / (n * sxx - sx * sx || 1)
  const b = (sy - m * sx) / n
  const predict = offset => Math.max(0, Math.round(m * (n + offset - 1) + b))
  const trend = m > 0.8 ? 'improving fast' : m > 0.2 ? 'improving' : m > -0.2 ? 'plateau' : 'declining'
  const trendColor = m > 0.2 ? C.gr : m > -0.2 ? C.yl : C.rd
  const W = 540, H = 72
  const max = Math.max(...history, predict(20), 1)
  const min = Math.min(...history, 0)
  const range = max - min || 1
  const toY = v => H - 4 - ((v - min) / range) * (H - 10)
  const histPts = history.map((v, i) =>
    `${((i / (n - 1)) * 0.72 * (W - 8) + 4).toFixed(1)},${toY(v).toFixed(1)}`
  ).join(' ')
  const predX0 = ((n-1)/(n-1))*0.72*(W-8)+4
  const predX1 = W - 4
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Tag label={trend} color={trendColor} />
        <span style={{ color: C.t3, fontSize: 9 }}>
          slope: {m > 0 ? '+' : ''}{m.toFixed(2)} wpm/session
        </span>
      </div>
      <svg width={W} height={H} style={{ display: 'block', marginBottom: 10 }}>
        <polyline points={histPts} fill="none" stroke={C.bl}
          strokeWidth="1.5" strokeLinejoin="round" />
        <line x1={predX0} y1={toY(m*(n-1)+b)} x2={predX1} y2={toY(m*(n+19)+b)}
          stroke={C.pu} strokeWidth="1.5" strokeDasharray="5,4" />
        {history.map((v, i) => {
          const x = (i / (n-1)) * 0.72 * (W-8) + 4
          return <circle key={i} cx={x} cy={toY(v)} r="2.5" fill={C.bl} />
        })}
      </svg>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[5, 10, 20].map(offset => (
          <div key={offset} style={{ padding: '6px 12px', background: C.bg3,
            borderRadius: 5, border: `1px solid ${C.b}`, textAlign: 'center' }}>
            <div style={{ color: C.t3, fontSize: 8 }}>+{offset} sessions</div>
            <div style={{ color: C.pu, fontSize: 15, fontWeight: 700 }}>{predict(offset)} wpm</div>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10,
          marginLeft: 'auto', fontSize: 9, color: C.t3 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 14, height: 2, background: C.bl, display: 'inline-block' }} />
            actual
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 14, height: 0,
              borderTop: `2px dashed ${C.pu}`, display: 'inline-block' }} />
            predicted
          </span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  AI LESSON  (calls Anthropic API)
// ─────────────────────────────────────────────────────────────────────────────
function AILesson({ snippet, onClose }) {
  const [resp, setResp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 1000,
            messages: [{
              role: 'user',
              content: `You are a concise coding teacher. Teach me about this code snippet.
Reply in JSON only — no markdown fences, no extra text.

Language: ${snippet.lang}
Code: ${snippet.code}

JSON structure:
{
  "concept": "name of the core concept (2-4 words)",
  "what": "one sentence: what this code does",
  "why": "one sentence: why a developer would use this",
  "how": "2-3 sentences: how it works mechanically",
  "gotcha": "one common mistake or edge case",
  "example": "a short related code example in the same language (just code, no explanation)",
  "level": "beginner|intermediate|advanced"
}`,
            }],
          }),
        })
        const d = await res.json()
        const text = d.content?.[0]?.text || '{}'
        setResp(JSON.parse(text.trim()))
      } catch (e) {
        setErr('AI lesson unavailable — check your network or API key.')
      }
      setLoading(false)
    })()
  }, [snippet.id])

  const levelColor = { beginner: C.gr, intermediate: C.yl, advanced: C.rd }

  return (
    <div style={{ borderTop: `1px solid ${C.b}`, padding: '14px 18px', background: C.bg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%',
          background: loading ? C.yl : err ? C.rd : C.cy }} />
        <span style={{ color: C.cy, fontSize: 12, fontWeight: 600 }}>AI lesson</span>
        {resp && <Tag label={resp.level} color={levelColor[resp.level] || C.t2} />}
        <button onClick={onClose} style={{ marginLeft: 'auto', padding: '2px 9px',
          borderRadius: 4, fontSize: 10, border: `1px solid ${C.b2}`,
          background: C.bg3, color: C.t2, cursor: 'pointer' }}>✕ close</button>
      </div>
      {loading && <div style={{ color: C.t3, fontSize: 11 }}>Generating lesson…</div>}
      {err     && <div style={{ color: C.rd,  fontSize: 11 }}>{err}</div>}
      {resp && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ padding: '12px 14px', background: C.cy + '12',
            borderRadius: 7, border: `1px solid ${C.cy}30` }}>
            <div style={{ color: C.cy, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
              {resp.concept}
            </div>
            <div style={{ color: C.t, fontSize: 12, lineHeight: 1.7 }}>{resp.what}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ padding: '10px 12px', background: C.bg3,
              borderRadius: 6, border: `1px solid ${C.b}` }}>
              <div style={{ color: C.t3, fontSize: 8, marginBottom: 4,
                textTransform: 'uppercase', letterSpacing: '0.06em' }}>why use it</div>
              <div style={{ color: C.t2, fontSize: 11, lineHeight: 1.6 }}>{resp.why}</div>
            </div>
            <div style={{ padding: '10px 12px', background: C.bg3,
              borderRadius: 6, border: `1px solid ${C.b}` }}>
              <div style={{ color: C.t3, fontSize: 8, marginBottom: 4,
                textTransform: 'uppercase', letterSpacing: '0.06em' }}>watch out ⚠️</div>
              <div style={{ color: C.or, fontSize: 11, lineHeight: 1.6 }}>{resp.gotcha}</div>
            </div>
          </div>
          <div style={{ padding: '10px 12px', background: C.bg2,
            borderRadius: 6, border: `1px solid ${C.b}` }}>
            <div style={{ color: C.t3, fontSize: 8, marginBottom: 4,
              textTransform: 'uppercase', letterSpacing: '0.06em' }}>how it works</div>
            <div style={{ color: C.t2, fontSize: 11, lineHeight: 1.7 }}>{resp.how}</div>
          </div>
          {resp.example && (
            <div style={{ padding: '10px 12px', background: C.bg3,
              borderRadius: 6, border: `1px solid ${C.b}` }}>
              <div style={{ color: C.t3, fontSize: 8, marginBottom: 6,
                textTransform: 'uppercase', letterSpacing: '0.06em' }}>related example</div>
              <pre style={{ margin: 0, fontSize: 12, color: C.gr,
                lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                fontFamily: 'inherit' }}>{resp.example}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  BOSS MODE
// ─────────────────────────────────────────────────────────────────────────────
function BossMode({ snips, onDone }) {
  const [phase,    setPhase]    = useState('intro')
  const [si,       setSi]       = useState(0)
  const [typed,    setTyped]    = useState('')
  const [timeLeft, setTimeLeft] = useState(120)
  const [done,     setDone]     = useState(0)
  const [errs,     setErrs]     = useState(0)
  const [lives,    setLives]    = useState(3)
  const [wpmH,     setWpmH]     = useState([])
  const [shake,    setShake]    = useState(false)
  const ref      = useRef(null)
  const tRef     = useRef('')
  const stRef    = useRef(null)
  const timerRef = useRef(null)
  const wpmRef   = useRef(null)
  const totalRef = useRef(0)
  const errRef   = useRef(0)

  useEffect(() => { ref.current?.focus() }, [])
  useEffect(() => () => {
    clearInterval(timerRef.current)
    clearInterval(wpmRef.current)
  }, [])

  const pool = useMemo(() => [...snips].sort(() => Math.random() - 0.5), [])
  const snip  = pool[si % pool.length]
  const target = snip?.code || ''
  const lm    = LM[snip?.lang] || LM.JS

  function start() {
    setPhase('playing')
    stRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          clearInterval(wpmRef.current)
          setPhase('done')
          return 0
        }
        return t - 1
      })
    }, 1000)
    wpmRef.current = setInterval(() => {
      if (!stRef.current) return
      const w = Math.round((totalRef.current / 5) / ((Date.now() - stRef.current) / 60000))
      setWpmH(h => [...h.slice(-60), w])
    }, 700)
  }

  const handleKey = useCallback(e => {
    if (phase !== 'playing') return
    if (e.key.length !== 1) return
    e.preventDefault()
    const correct = e.key === target[tRef.current.length]
    if (correct) {
      tRef.current += e.key
      totalRef.current++
      setTyped(tRef.current)
      if (tRef.current.length === target.length) {
        setDone(d => d + 1)
        setSi(s => s + 1)
        tRef.current = ''
        setTyped('')
      }
    } else {
      errRef.current++
      setErrs(errRef.current)
      setShake(true)
      setTimeout(() => setShake(false), 300)
      setLives(l => {
        const nl = l - 1
        if (nl <= 0) {
          clearInterval(timerRef.current)
          clearInterval(wpmRef.current)
          setPhase('done')
        }
        return nl
      })
    }
  }, [phase, target])

  useEffect(() => {
    const el = ref.current
    el?.addEventListener('keydown', handleKey)
    return () => el?.removeEventListener('keydown', handleKey)
  }, [handleKey])

  const wpm = stRef.current && totalRef.current > 0
    ? Math.round((totalRef.current / 5) / ((Date.now() - stRef.current) / 60000)) : 0
  const acc = totalRef.current + errRef.current === 0 ? 100
    : Math.round((totalRef.current / (totalRef.current + errRef.current)) * 100)
  const timePct  = (timeLeft / 120) * 100
  const timeColor = timePct > 50 ? C.gr : timePct > 25 ? C.yl : C.rd

  return (
    <div ref={ref} tabIndex={0} style={{ outline: 'none' }}>

      {/* ── Intro ── */}
      {phase === 'intro' && (
        <div style={{ padding: '36px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>💀</div>
          <div style={{ color: C.rd, fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
            Boss Mode
          </div>
          <div style={{ color: C.t2, fontSize: 12, lineHeight: 1.8, marginBottom: 6 }}>
            120 seconds · hard + medium snippets · no backspace · 3 lives
          </div>
          <div style={{ color: C.t3, fontSize: 11, marginBottom: 20 }}>
            Every wrong keystroke costs a life. Lose all 3 and it's over.
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 22 }}>
            {[1,2,3].map(i => <span key={i} style={{ fontSize: 24 }}>❤️</span>)}
          </div>
          <button onClick={start} style={{
            padding: '10px 28px', borderRadius: 8, fontSize: 13,
            border: `1px solid ${C.rd}88`, background: C.rd + '18',
            color: C.rd, cursor: 'pointer',
          }}>enter boss mode</button>
        </div>
      )}

      {/* ── Playing ── */}
      {phase === 'playing' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 18px', borderBottom: `1px solid ${C.b}`, background: C.bg2 }}>
            <ProgressRing pct={timePct} size={42} stroke={4} color={timeColor} label={timeLeft} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 14, marginBottom: 5 }}>
                {[
                  { l: 'wpm',    v: wpm,       c: C.bl },
                  { l: 'done',   v: done,       c: C.gr },
                  { l: 'errors', v: errs,       c: C.rd },
                  { l: 'acc',    v: acc + '%',  c: C.yl },
                ].map(s => (
                  <div key={s.l} style={{ textAlign: 'center' }}>
                    <div style={{ color: C.t3, fontSize: 8 }}>{s.l}</div>
                    <div style={{ color: s.c, fontSize: 15, fontWeight: 700 }}>{s.v}</div>
                  </div>
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[1,2,3].map(i => (
                    <span key={i} style={{ fontSize: 16,
                      opacity: i <= lives ? 1 : 0.15, transition: 'opacity 0.3s' }}>❤️</span>
                  ))}
                </div>
              </div>
              <div style={{ height: 4, background: C.bg3, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${timePct}%`, height: '100%', background: timeColor,
                  borderRadius: 2, transition: 'width 1s linear, background 0.3s' }} />
              </div>
            </div>
          </div>
          <div style={{ padding: '8px 18px', borderBottom: `1px solid ${C.b}`,
            background: lm.bg + '33', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag label={snip.lang} color={lm.c} />
            <span style={{ color: C.t, fontSize: 12, fontWeight: 500 }}>{snip.label}</span>
            <span style={{ marginLeft: 'auto', color: C.t3, fontSize: 10 }}>
              {typed.length}/{target.length}
            </span>
          </div>
          <div style={{ padding: '14px 20px', minHeight: 72,
            background: shake ? '#1f0000' : C.bg, transition: 'background 0.1s' }}>
            <div style={{ fontSize: 14, lineHeight: 2.1,
              whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {target.split('').map((ch, i) => {
                let color, bg = 'transparent'
                if (i < typed.length) {
                  color = typed[i] === ch ? C.gr : C.rd
                  if (typed[i] !== ch) bg = '#f8514914'
                } else if (i === typed.length) { color = C.t; bg = '#58a6ff28' }
                else color = C.t3
                return <span key={i} style={{ color, background: bg, borderRadius: 2 }}>
                  {ch === '\n' ? '↵\n' : ch}
                </span>
              })}
            </div>
          </div>
          <div style={{ padding: '4px 18px', borderTop: `1px solid ${C.b}`, background: C.bg2 }}>
            <SparkLine data={wpmH} color={C.bl} width={560} height={20} />
          </div>
        </>
      )}

      {/* ── Done ── */}
      {phase === 'done' && (
        <div style={{ padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>{lives <= 0 ? '💀' : '🏆'}</div>
          <div style={{ color: lives <= 0 ? C.rd : C.gr, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
            {lives <= 0 ? "game over" : "time's up!"}
          </div>
          <div style={{ color: C.bl, fontSize: 30, fontWeight: 700, marginBottom: 4 }}>
            {wpmH.length ? Math.max(...wpmH) : wpm} wpm peak
          </div>
          <div style={{ color: C.t2, fontSize: 12, marginBottom: 16 }}>
            {acc}% accuracy · {done} snippets · {errs} errors
          </div>
          <SparkLine data={wpmH} color={C.bl} width={320} height={52} />
          <button onClick={() => onDone({ wpm: wpmH.length ? Math.max(...wpmH) : wpm, acc, done, errs, survived: lives > 0 })}
            style={{ marginTop: 16, padding: '8px 20px', borderRadius: 7, fontSize: 12,
              border: `1px solid ${C.bl}88`, background: C.bl + '14',
              color: C.bl, cursor: 'pointer' }}>
            save & exit
          </button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,         setTab]         = useState('race')
  const [si,          setSi]          = useState(0)
  const [typed,       setTyped]       = useState('')
  const [gs,          setGs]          = useState('ready')   // ready | playing | done
  const [errs,        setErrs]        = useState(0)
  const [wpmH,        setWpmH]        = useState([])
  const [liveWpm,     setLiveWpm]     = useState(0)
  const [combo,       setCombo]       = useState(0)
  const [maxC,        setMaxC]        = useState(0)
  const [kHeat,       setKHeat]       = useState({})
  const [kErr,        setKErr]        = useState({})
  const [sessions,    setSessions]    = useState(0)
  const [best,        setBest]        = useState(0)
  const [xp,          setXp]          = useState(0)
  const [streak,      setStreak]      = useState(0)
  const [bossWins,    setBossWins]    = useState(0)
  const [hardDone,    setHardDone]    = useState(0)
  const [perfect,     setPerfect]     = useState(0)
  const [maxComboEver,setMaxComboEver]= useState(0)
  const [langsUsed,   setLangsUsed]   = useState(new Set())
  const [unlocked,    setUnlocked]    = useState([])
  const [newAch,      setNewAch]      = useState(null)
  const [lf,          setLf]          = useState('ALL')
  const [df,          setDf]          = useState('ALL')
  const [bgFlash,     setBgFlash]     = useState('idle')
  const [comboAnim,   setComboAnim]   = useState(false)
  const [toast,       setToast]       = useState(null)
  const [showLesson,  setShowLesson]  = useState(false)
  const [rhythmEvents,setRhythmEvents]= useState([])
  const [bossActive,  setBossActive]  = useState(false)
  const [statsTab,    setStatsTab]    = useState('overview')
  const [finalWpm,    setFinalWpm]    = useState(0)
  const [finalAcc,    setFinalAcc]    = useState(100)
  const [aiPeerProgs, setAiPeerProgs] = useState(AI_PEERS.map(() => 0))
  const [leaderboard, setLeaderboard] = useState([
    { n: 'DevGuru', w: 112, a: 97, l: 'RUST' },
    { n: 'Carol',   w: 78,  a: 94, l: 'GO'   },
    { n: 'Alice',   w: 54,  a: 91, l: 'TS'   },
  ])

  const ref     = useRef(null)
  const wRef    = useRef(null)
  const stRef   = useRef(null)
  const tRef    = useRef('')
  const evRef   = useRef([])
  const peerRef = useRef(null)

  const snip     = SNIPS[si]
  const target   = snip.code
  const lm       = LM[snip.lang] || LM.CUSTOM
  const filtered = useMemo(() =>
    SNIPS.filter(s => (lf === 'ALL' || s.lang === lf) && (df === 'ALL' || s.diff === df)),
    [lf, df]
  )

  // ── helpers ────────────────────────────────────────────────────────────────
  function pick(pool) {
    const arr = pool || filtered
    if (!arr.length) return
    setSi(SNIPS.indexOf(arr[Math.floor(Math.random() * arr.length)]))
    reset()
  }

  function reset() {
    setTyped(''); tRef.current = ''; evRef.current = []
    setGs('ready'); stRef.current = null
    setLiveWpm(0); setCombo(0); setErrs(0)
    setShowLesson(false); setAiPeerProgs(AI_PEERS.map(() => 0))
    clearInterval(wRef.current); clearInterval(peerRef.current)
  }

  function flashBg(t) { setBgFlash(t); setTimeout(() => setBgFlash('idle'), 160) }
  function showToast(m, c) { setToast({ m, c }) }

  function checkAchievements(stats) {
    const toUnlock = ACHIEVEMENTS.filter(a => !unlocked.includes(a.id) && a.cond(stats))
    if (!toUnlock.length) return
    setUnlocked(u => [...u, ...toUnlock.map(a => a.id)])
    setNewAch(toUnlock[0])
    showToast(`🏅 ${toUnlock[0].label} unlocked!`, C.pu)
    setTimeout(() => setNewAch(null), 3000)
  }

  // ── keyboard handler ───────────────────────────────────────────────────────
  const handleKey = useCallback(e => {
    if (bossActive || tab !== 'race') return
    if (gs === 'done' && (e.key === 'Tab' || e.key === 'Enter')) {
      e.preventDefault(); pick(); return
    }
    if (e.key === 'Tab') { e.preventDefault(); pick(); return }
    if (e.key.length !== 1 && e.key !== 'Backspace') return
    e.preventDefault()

    if (e.key === 'Backspace') {
      if (tRef.current.length > 0) {
        evRef.current.push({ type: 'backspace', t: Date.now() })
        tRef.current = tRef.current.slice(0, -1)
        setTyped(tRef.current)
        setCombo(0)
      }
      return
    }

    const now = Date.now()
    if (gs === 'ready') {
      stRef.current = now
      setGs('playing')
      wRef.current = setInterval(() => {
        if (!stRef.current) return
        const w = Math.round((tRef.current.length / 5) / ((Date.now() - stRef.current) / 60000))
        setLiveWpm(w)
        setWpmH(h => [...h.slice(-80), w])
      }, 700)
      peerRef.current = setInterval(() => {
        if (!stRef.current) return
        const el = (Date.now() - stRef.current) / 1000
        setAiPeerProgs(AI_PEERS.map(p =>
          Math.min(1, (p.wpm * 5 / 60 * el) / Math.max(target.length, 1))
        ))
      }, 100)
    }

    const correct = e.key === target[tRef.current.length]
    const k = e.key.toLowerCase()
    evRef.current.push({ type: correct ? 'keystroke' : 'error', char: e.key, t: now })

    if (correct) {
      tRef.current += e.key
      setTyped(tRef.current)
      setCombo(c => {
        const nc = c + 1
        setMaxC(m => { if (nc > m) { setMaxComboEver(me => Math.max(me, nc)); return nc } return m })
        if (nc % 10 === 0 && nc > 0) { setComboAnim(true); setTimeout(() => setComboAnim(false), 500) }
        return nc
      })
      if (ALLK.includes(k)) setKHeat(h => ({ ...h, [k]: (h[k] || 0) + 1 }))
      flashBg('good')

      if (tRef.current.length === target.length) {
        clearInterval(wRef.current)
        clearInterval(peerRef.current)
        const fw = Math.round((tRef.current.length / 5) / ((Date.now() - stRef.current) / 60000))
        const fa = Math.round((tRef.current.length / (tRef.current.length + errs)) * 100)
        setLiveWpm(fw); setFinalWpm(fw); setFinalAcc(fa)
        setWpmH(h => [...h, fw])
        setBest(b => Math.max(b, fw))
        const ns = sessions + 1; setSessions(ns)
        setStreak(s => s + 1)
        const mul = snip.diff === 'hard' ? 1.5 : snip.diff === 'medium' ? 1.2 : 1
        const earned = Math.round(snip.xp * (fa / 100) * mul * Math.max(1, fw / 40))
        const nx = xp + earned; setXp(nx)
        if (fa === 100) setPerfect(p => p + 1)
        if (snip.diff === 'hard') setHardDone(h => h + 1)
        const nl = new Set([...langsUsed, snip.lang]); setLangsUsed(nl)
        setRhythmEvents([...evRef.current])
        setLeaderboard(prev =>
          [...prev, { n: 'You', w: fw, a: fa, l: snip.lang }]
            .sort((a, b) => b.w - a.w).slice(0, 8)
        )
        setGs('done')
        showToast(`+${earned} xp  ·  ${fw} wpm`, C.yl)
        checkAchievements({
          sessions: ns, best: Math.max(best, fw), perfect: fa === 100 ? perfect + 1 : perfect,
          maxCombo: Math.max(maxComboEver, maxC), xp: nx, langs: nl.size,
          streak: streak + 1, bossWins, hardDone: snip.diff === 'hard' ? hardDone + 1 : hardDone,
        })
      }
    } else {
      setErrs(m => m + 1); setCombo(0)
      if (ALLK.includes(k)) setKErr(h => ({ ...h, [k]: (h[k] || 0) + 1 }))
      flashBg('bad')
    }
  }, [tab, gs, target, errs, sessions, snip, bossActive, filtered,
      best, xp, perfect, langsUsed, maxComboEver, maxC, streak, bossWins, hardDone, unlocked])

  useEffect(() => {
    const el = ref.current
    el?.addEventListener('keydown', handleKey)
    return () => el?.removeEventListener('keydown', handleKey)
  }, [handleKey])
  useEffect(() => { ref.current?.focus() }, [])
  useEffect(() => () => { clearInterval(wRef.current); clearInterval(peerRef.current) }, [])

  // ── derived ────────────────────────────────────────────────────────────────
  const acc   = tRef.current.length === 0 && errs === 0 ? 100
    : Math.round((typed.length / (typed.length + errs)) * 100)
  const rank  = getRank(liveWpm)
  const mh    = Math.max(...Object.values(kHeat), 1)
  const me    = Math.max(...Object.values(kErr), 1)
  const xpLv  = Math.floor(xp / 300) + 1
  const xpPct = ((xp % 300) / 300) * 100
  const codeBg= bgFlash === 'good' ? '#001a0a' : bgFlash === 'bad' ? '#1f0000' : C.bg
  const langs2 = ['ALL', ...new Set(SNIPS.map(s => s.lang))]
  const diffs2 = ['ALL', 'easy', 'medium', 'hard']
  const TABS   = ['race', 'boss', 'stats', 'board', 'badges']

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div ref={ref} tabIndex={0} style={{
      outline: 'none', background: C.bg, borderRadius: 16,
      overflow: 'hidden', border: `1px solid ${C.b}`,
      fontFamily: "'SF Mono','Fira Code','Cascadia Code',monospace",
      userSelect: 'none', position: 'relative',
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes popIn { 0%{transform:scale(0.8);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        * { box-sizing: border-box; }
      `}</style>

      {toast && <Toast msg={toast.m} color={toast.c} onDone={() => setToast(null)} />}

      {/* ── TOP BAR ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 20px', borderBottom: `1px solid ${C.b}`, background: C.bg2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%',
            background: gs === 'playing' ? C.gr : gs === 'done' ? C.bl : C.t3,
            transition: 'background 0.3s' }} />
          <span style={{ color: C.t, fontWeight: 700, fontSize: 15, letterSpacing: '-0.03em' }}>
            codemaster<span style={{ color: C.bl }}>.</span>pro
          </span>
          {streak > 0 && (
            <span style={{ fontSize: 10, color: C.or, background: C.or + '18',
              border: `1px solid ${C.or}44`, padding: '1px 8px', borderRadius: 4 }}>
              🔥 {streak} streak
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ProgressRing pct={xpPct} size={40} stroke={3} color={C.bl} label={`lv${xpLv}`} />
          <div style={{ padding: '3px 10px', borderRadius: 5,
            background: rank.c + '22', border: `1px solid ${rank.c}44`,
            color: rank.c, fontSize: 10, fontWeight: 700 }}>{rank.l}</div>
          <span style={{ color: C.t3, fontSize: 10 }}>{xp} xp</span>
        </div>
      </div>

      {/* ── TAB NAV ── */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.b}`, background: C.bg }}>
        {TABS.map(t => (
          <button key={t} onClick={() => { setTab(t); if (t === 'race') reset() }}
            style={{
              flex: 1, padding: '8px 0', fontSize: 11, background: 'transparent',
              border: 'none', cursor: 'pointer', transition: 'color 0.15s', fontFamily: 'inherit',
              color: tab === t ? (t === 'boss' ? C.rd : C.bl) : C.t3,
              borderBottom: `2px solid ${tab === t ? (t === 'boss' ? C.rd : C.bl) : 'transparent'}`,
            }}>
            {t === 'boss' ? '💀 boss' : t === 'badges' ? '🏅 badges' : t === 'board' ? 'scores' : t}
          </button>
        ))}
      </div>

      {/* ══════════════════════ RACE TAB ══════════════════════ */}
      {tab === 'race' && !bossActive && <>

        {/* filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5,
          padding: '7px 18px', borderBottom: `1px solid ${C.b}`, flexWrap: 'wrap' }}>
          {langs2.map(l => {
            const ac = lf === l, lm2 = LM[l]
            return (
              <button key={l}
                onClick={() => { setLf(l); pick(SNIPS.filter(s => (l === 'ALL' || s.lang === l) && (df === 'ALL' || s.diff === df))) }}
                style={{ padding: '2px 8px', borderRadius: 4, fontSize: 9, cursor: 'pointer',
                  border: `1px solid ${ac ? (lm2?.c || C.bl) + '88' : C.b}`,
                  background: ac ? (lm2?.c || C.bl) + '18' : 'transparent',
                  color: ac ? (lm2?.c || C.bl) : C.t2 }}>
                {l}
              </button>
            )
          })}
          <span style={{ color: C.b2, margin: '0 4px' }}>│</span>
          {diffs2.map(d => {
            const ac = df === d
            return (
              <button key={d}
                onClick={() => { setDf(d); pick(SNIPS.filter(s => (lf === 'ALL' || s.lang === lf) && (d === 'ALL' || s.diff === d))) }}
                style={{ padding: '2px 8px', borderRadius: 4, fontSize: 9, cursor: 'pointer',
                  border: `1px solid ${ac ? (DC[d] || C.t2) + '88' : C.b}`,
                  background: ac ? (DC[d] || C.t2) + '18' : 'transparent',
                  color: ac ? (DC[d] || C.t2) : C.t2 }}>
                {d}
              </button>
            )
          })}
          <button onClick={() => pick()}
            style={{ marginLeft: 'auto', padding: '2px 10px', borderRadius: 4, fontSize: 9,
              border: `1px solid ${C.b2}`, background: C.bg3, color: C.t2, cursor: 'pointer' }}>
            ↺ skip
          </button>
        </div>

        {/* snippet label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 18px', borderBottom: `1px solid ${C.b}`, background: lm.bg + '55' }}>
          <Tag label={snip.lang} color={lm.c} />
          <span style={{ color: C.t, fontSize: 13, fontWeight: 600 }}>{snip.label}</span>
          <span style={{ color: C.t3 }}>·</span>
          <Tag label={snip.diff} color={DC[snip.diff] || C.t2} />
          <span style={{ marginLeft: 'auto', color: C.t3, fontSize: 10 }}>
            {snip.xp} xp  ·  {typed.length}/{target.length}
          </span>
        </div>

        {/* ghost race bars */}
        <div style={{ padding: '8px 18px', borderBottom: `1px solid ${C.b}`, background: C.bg2 }}>
          <div style={{ color: C.t3, fontSize: 9, marginBottom: 7,
            textTransform: 'uppercase', letterSpacing: '0.07em' }}>live race</div>
          {[
            { name: 'you', color: C.bl, prog: typed.length / Math.max(target.length, 1), wpm: liveWpm, isYou: true },
            ...AI_PEERS.map((p, i) => ({ name: p.name, color: p.color, prog: aiPeerProgs[i], wpm: p.wpm, isYou: false })),
          ].map(r => (
            <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%',
                background: r.color + '22', border: `1.5px solid ${r.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: r.color, fontWeight: 700 }}>
                {r.name[0].toUpperCase()}
              </div>
              <span style={{ fontSize: 10, color: r.isYou ? r.color : C.t2, fontWeight: r.isYou ? 700 : 400,
                width: 88, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {r.name}
              </span>
              <div style={{ flex: 1, height: 6, background: C.bg3, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, r.prog * 100)}%`, height: '100%',
                  background: r.prog >= 1 ? C.gr : r.color, borderRadius: 3,
                  transition: r.isYou ? 'none' : 'width 0.2s' }} />
              </div>
              <span style={{ fontSize: 10, color: r.prog >= 1 ? C.gr : C.t3, width: 44, textAlign: 'right' }}>
                {r.prog >= 1 ? '✓ done' : Math.round(r.prog * 100) + '%'}
              </span>
            </div>
          ))}
        </div>

        {/* code area */}
        <div style={{ padding: '18px 22px', minHeight: 96, position: 'relative',
          background: codeBg, transition: 'background 0.15s' }}>
          {gs === 'ready' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: C.bl, fontSize: 13, marginBottom: 6 }}>
                  start typing to begin the race
                </div>
                <div style={{ color: C.t3, fontSize: 10, display: 'flex', gap: 8,
                  alignItems: 'center', justifyContent: 'center' }}>
                  <Kbd c="Tab" /> skip  ·  <Kbd c="↩" /> next after done
                </div>
              </div>
            </div>
          )}
          <div style={{ fontSize: 15, lineHeight: 2.15, letterSpacing: '0.02em',
            whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {target.split('').map((ch, i) => {
              let color, bg = 'transparent'
              if (i < typed.length) {
                color = typed[i] === ch ? C.gr : C.rd
                if (typed[i] !== ch) bg = '#f8514912'
              } else if (i === typed.length && gs === 'playing') {
                color = C.t; bg = '#58a6ff28'
              } else color = C.t3
              return <span key={i} style={{ color, background: bg, borderRadius: 2 }}>
                {ch === '\n' ? '↵\n' : ch}
              </span>
            })}
          </div>
        </div>

        {/* live stats bar */}
        <div style={{ display: 'flex', alignItems: 'stretch',
          borderTop: `1px solid ${C.b}`, borderBottom: `1px solid ${C.b}`, background: C.bg2 }}>
          {[
            { l: 'wpm',    v: gs === 'ready' ? '—' : liveWpm,   c: C.bl },
            { l: 'acc',    v: gs === 'ready' ? '—' : acc + '%', c: acc >= 95 ? C.gr : acc >= 80 ? C.yl : C.rd },
            { l: 'combo',  v: combo + '×',                       c: combo >= 20 ? C.pu : combo >= 10 ? C.yl : C.t2 },
            { l: 'best ×', v: maxC + '×',                        c: C.t2 },
            { l: 'errors', v: errs,                              c: errs > 0 ? C.rd : C.gr },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: '9px 6px', textAlign: 'center',
              borderRight: i < 4 ? `1px solid ${C.b}` : 'none' }}>
              <div style={{ color: C.t3, fontSize: 9, marginBottom: 3 }}>{s.l}</div>
              <div style={{ color: s.c, fontSize: 17, fontWeight: 600, transition: 'all 0.2s',
                transform: s.l === 'combo' && comboAnim ? 'scale(1.5)' : 'scale(1)' }}>{s.v}</div>
            </div>
          ))}
          <div style={{ flex: '0 0 120px', padding: '7px 12px',
            borderLeft: `1px solid ${C.b}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ color: C.t3, fontSize: 9, marginBottom: 4 }}>wpm</div>
            <SparkLine data={wpmH} color={C.bl} width={96} height={26} />
          </div>
        </div>

        {/* done panel */}
        {gs === 'done' && (
          <div style={{ padding: '14px 20px', background: C.bg, borderBottom: `1px solid ${C.b}` }}>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <span style={{ color: rank.c, fontSize: 28, fontWeight: 700 }}>{finalWpm}</span>
                  <span style={{ color: C.t2, fontSize: 13 }}>wpm</span>
                  <span style={{ color: C.t2, fontSize: 11 }}>{finalAcc}% · {errs} err · {maxC}× combo</span>
                </div>
                <div style={{ color: C.t3, fontSize: 10, marginBottom: 10 }}>
                  rank: <span style={{ color: rank.c, fontWeight: 600 }}>{rank.l}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button onClick={() => pick()}
                    style={{ padding: '5px 14px', borderRadius: 5, fontSize: 11,
                      border: `1px solid ${C.bl}88`, background: C.bl + '14', color: C.bl, cursor: 'pointer' }}>
                    ↺ next
                  </button>
                  <button onClick={reset}
                    style={{ padding: '5px 14px', borderRadius: 5, fontSize: 11,
                      border: `1px solid ${C.b2}`, background: 'transparent', color: C.t2, cursor: 'pointer' }}>
                    retry
                  </button>
                  <button onClick={() => setShowLesson(l => !l)}
                    style={{ padding: '5px 14px', borderRadius: 5, fontSize: 11, cursor: 'pointer',
                      border: `1px solid ${showLesson ? C.cy : C.b2}`,
                      background: showLesson ? C.cy + '18' : 'transparent',
                      color: showLesson ? C.cy : C.t2 }}>
                    AI lesson
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { l: 'sessions', v: sessions, c: C.t },
                  { l: 'best',     v: best,     c: C.yl },
                  { l: 'xp',       v: xp,       c: C.pu },
                  { l: 'streak',   v: streak,   c: C.or },
                ].map(s => (
                  <div key={s.l} style={{ textAlign: 'center' }}>
                    <div style={{ color: C.t3, fontSize: 9 }}>{s.l}</div>
                    <div style={{ color: s.c, fontSize: 19, fontWeight: 700 }}>{s.v}</div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ color: C.t3, fontSize: 9, marginBottom: 4 }}>session wpm</div>
                <SparkLine data={wpmH} color={C.bl} width={140} height={46} />
              </div>
            </div>
          </div>
        )}

        {/* AI lesson */}
        {showLesson && gs === 'done' && (
          <AILesson snippet={snip} onClose={() => setShowLesson(false)} />
        )}

        {/* keyboard heatmap */}
        <div style={{ padding: '10px 18px', background: C.bg, borderTop: `1px solid ${C.b}` }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ color: C.t3, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              keyboard heatmap
            </span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
              {[{ c: '#58a6ff55', l: 'hits' }, { c: '#f8514444', l: 'errors' }].map(s => (
                <span key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 9, color: C.t3 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2,
                    background: s.c, display: 'inline-block' }} />
                  {s.l}
                </span>
              ))}
            </div>
          </div>
          {KROWS.map((row, ri) => (
            <div key={ri} style={{ display: 'flex', gap: 3, marginBottom: 3, paddingLeft: ri * 10 }}>
              {row.map(ch => (
                <HeatKey key={ch} ch={ch}
                  heat={kHeat[ch] || 0} maxHeat={mh}
                  errHeat={kErr[ch] || 0} maxErr={me} />
              ))}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
            <div style={{ width: 44, height: 26, borderRadius: 4, background: C.bg3,
              border: `1px solid ${C.b}`, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 9, color: C.t3 }}>⌫</div>
            <div style={{ width: 118, height: 26, borderRadius: 4, background: C.bg3,
              border: `1px solid ${C.b}`, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 9, color: C.t3 }}>space</div>
          </div>
        </div>

        {/* snippet library */}
        <div style={{ borderTop: `1px solid ${C.b}`, background: C.bg2, padding: '10px 16px' }}>
          <div style={{ color: C.t3, fontSize: 9, marginBottom: 8,
            textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            library — {filtered.length} snippets
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3,
            maxHeight: 134, overflowY: 'auto' }}>
            {filtered.map(s => {
              const slm = LM[s.lang] || LM.JS
              const active = SNIPS.indexOf(s) === si
              return (
                <div key={s.id} onClick={() => { setSi(SNIPS.indexOf(s)); reset() }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8,
                    padding: '5px 8px', borderRadius: 5, cursor: 'pointer', transition: 'all 0.1s',
                    background: active ? C.bg3 : 'transparent',
                    border: `1px solid ${active ? C.b2 : 'transparent'}` }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: slm.c,
                    width: 26, textAlign: 'center' }}>{s.lang}</span>
                  <span style={{ flex: 1, color: active ? C.t : C.t2, fontSize: 11 }}>{s.label}</span>
                  <span style={{ fontSize: 9, color: DC[s.diff] || C.t2 }}>{s.diff}</span>
                  <span style={{ fontSize: 9, color: C.yl }}>{s.xp}xp</span>
                  <span style={{ fontSize: 9, color: C.t3, maxWidth: 170,
                    overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {s.code.replace(/\n/g, ' ').slice(0, 30)}…
                  </span>
                  {active && <span style={{ fontSize: 9, color: C.bl }}>●</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 18px', borderTop: `1px solid ${C.b}`, background: C.bg }}>
          <div style={{ display: 'flex', gap: 10, fontSize: 10, color: C.t3 }}>
            <span><Kbd c="Tab" /> skip</span>
            <span><Kbd c="⌫" /> backspace</span>
            <span><Kbd c="↩" /> next after done</span>
          </div>
          <span style={{ color: C.b3, fontSize: 9 }}>codemaster · zero css · pure js</span>
        </div>
      </>}

      {/* ══════════════════════ BOSS TAB ══════════════════════ */}
      {tab === 'boss' && (
        bossActive
          ? <BossMode
              snips={SNIPS.filter(s => s.diff !== 'easy')}
              onDone={r => {
                setBossActive(false)
                setBest(b => Math.max(b, r.wpm))
                setSessions(s => s + 1)
                if (r.survived) setBossWins(w => w + 1)
                showToast(`boss done: ${r.wpm} wpm · ${r.done} snippets`, C.rd)
              }} />
          : <div style={{ padding: '36px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>💀</div>
              <div style={{ color: C.rd, fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Boss Mode</div>
              <div style={{ color: C.t2, fontSize: 12, lineHeight: 1.9, marginBottom: 20 }}>
                120 seconds · hard + medium snippets<br />
                no backspace · 3 lives · one wrong key costs a life
              </div>
              <button onClick={() => setBossActive(true)}
                style={{ padding: '10px 30px', borderRadius: 8, fontSize: 13,
                  border: `1px solid ${C.rd}88`, background: C.rd + '18',
                  color: C.rd, cursor: 'pointer' }}>
                enter boss mode
              </button>
            </div>
      )}

      {/* ══════════════════════ STATS TAB ══════════════════════ */}
      {tab === 'stats' && (
        <div style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <StatCard label="sessions" value={sessions} color={C.t} />
            <StatCard label="best wpm"  value={best}     color={C.yl} />
            <StatCard label="total xp"  value={xp}       color={C.pu} />
            <StatCard label="streak"    value={streak}   color={C.or} sub={streak > 0 ? 'sessions' : 'keep going!'} />
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {['overview', 'rhythm', 'prediction'].map(t => (
              <button key={t} onClick={() => setStatsTab(t)}
                style={{ padding: '4px 12px', borderRadius: 4, fontSize: 10, cursor: 'pointer',
                  border: `1px solid ${statsTab === t ? C.bl + '88' : C.b}`,
                  background: statsTab === t ? C.bl + '14' : 'transparent',
                  color: statsTab === t ? C.bl : C.t2 }}>
                {t}
              </button>
            ))}
          </div>
          <div style={{ background: C.bg2, border: `1px solid ${C.b}`, borderRadius: 8, padding: '14px 16px' }}>
            {statsTab === 'overview' && (
              <>
                <div style={{ color: C.t3, fontSize: 9, marginBottom: 10,
                  textTransform: 'uppercase', letterSpacing: '0.07em' }}>wpm history</div>
                <SparkLine data={wpmH} color={C.bl} width={580} height={80} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 14 }}>
                  {[
                    { l: 'boss wins',   v: bossWins,       c: C.rd },
                    { l: 'max combo',   v: maxComboEver+'×',c: C.pu },
                    { l: 'langs used',  v: langsUsed.size, c: C.or },
                    { l: 'perfect runs',v: perfect,        c: C.te },
                    { l: 'hard done',   v: hardDone,       c: C.rd },
                    { l: 'level',       v: xpLv,           c: C.bl },
                  ].map(s => (
                    <div key={s.l} style={{ textAlign: 'center', padding: '8px 10px',
                      background: C.bg3, borderRadius: 6, border: `1px solid ${C.b}` }}>
                      <div style={{ color: C.t3, fontSize: 9 }}>{s.l}</div>
                      <div style={{ color: s.c, fontSize: 18, fontWeight: 700 }}>{s.v}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {statsTab === 'rhythm' && (
              <>
                <div style={{ color: C.t3, fontSize: 9, marginBottom: 10,
                  textTransform: 'uppercase', letterSpacing: '0.07em' }}>typing rhythm</div>
                <RhythmViz events={rhythmEvents} />
              </>
            )}
            {statsTab === 'prediction' && (
              <>
                <div style={{ color: C.t3, fontSize: 9, marginBottom: 10,
                  textTransform: 'uppercase', letterSpacing: '0.07em' }}>wpm prediction (linear regression)</div>
                <WpmPredict history={wpmH} />
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════ LEADERBOARD TAB ══════════════════════ */}
      {tab === 'board' && (
        <div style={{ padding: '14px 18px' }}>
          <div style={{ color: C.t3, fontSize: 9, marginBottom: 10,
            textTransform: 'uppercase', letterSpacing: '0.07em' }}>top scores</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {leaderboard.map((e, i) => {
              const isYou = e.n === 'You'
              const medals = ['🥇','🥈','🥉']
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 7,
                  background: isYou ? C.bl + '14' : i === 0 ? C.yl + '0d' : C.bg3,
                  border: `1px solid ${isYou ? C.bl + '55' : i === 0 ? C.yl + '33' : C.b}` }}>
                  <span style={{ fontSize: 14, width: 22, textAlign: 'center' }}>
                    {i < 3 ? medals[i] : <span style={{ color: C.t3, fontSize: 11 }}>#{i+1}</span>}
                  </span>
                  <div style={{ width: 26, height: 26, borderRadius: '50%',
                    background: isYou ? C.bl + '33' : C.bg4, border: `1px solid ${isYou ? C.bl : C.b2}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: isYou ? C.bl : C.t2, fontWeight: 700 }}>
                    {e.n[0].toUpperCase()}
                  </div>
                  <span style={{ flex: 1, color: isYou ? C.bl : i < 3 ? C.t : C.t2,
                    fontWeight: isYou ? 700 : 400, fontSize: 12 }}>{e.n}</span>
                  <span style={{ color: C.t3, fontSize: 9, marginRight: 6 }}>{e.l}</span>
                  <span style={{ color: C.t2, fontSize: 10, marginRight: 8 }}>{e.a}%</span>
                  <span style={{ color: i === 0 ? C.yl : isYou ? C.bl : C.t,
                    fontSize: 18, fontWeight: 700 }}>{e.w}</span>
                  <span style={{ color: C.t3, fontSize: 9 }}>wpm</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════ BADGES TAB ══════════════════════ */}
      {tab === 'badges' && (
        <div style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ background: C.bg3, borderRadius: 7, padding: '10px 16px',
              border: `1px solid ${C.b}`, textAlign: 'center' }}>
              <div style={{ color: C.t3, fontSize: 9 }}>unlocked</div>
              <div style={{ color: C.pu, fontSize: 22, fontWeight: 700 }}>
                {unlocked.length}/{ACHIEVEMENTS.length}
              </div>
            </div>
            <div style={{ flex: 1, background: C.bg2, borderRadius: 7,
              padding: '10px 14px', border: `1px solid ${C.b}`,
              display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ height: 6, background: C.bg3, borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ width: `${Math.round((unlocked.length/ACHIEVEMENTS.length)*100)}%`,
                  height: '100%', background: C.pu, borderRadius: 3, transition: 'width 0.5s' }} />
              </div>
              <div style={{ color: C.t2, fontSize: 11 }}>
                {Math.round((unlocked.length/ACHIEVEMENTS.length)*100)}% complete
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {ACHIEVEMENTS.map(a => {
              const done = unlocked.includes(a.id)
              return (
                <div key={a.id} title={`${a.label}: ${a.desc}`}
                  style={{ padding: '12px 8px', borderRadius: 8, textAlign: 'center',
                    cursor: 'default', transition: 'all 0.3s',
                    background: done ? C.bg3 : 'transparent',
                    border: `1px solid ${done ? C.b2 : C.b}`,
                    opacity: done ? 1 : 0.28,
                    animation: newAch?.id === a.id ? 'popIn 0.5s ease forwards' : '' }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{a.icon}</div>
                  <div style={{ fontSize: 9, color: done ? C.t : C.t3, lineHeight: 1.4 }}>{a.label}</div>
                  <div style={{ fontSize: 8, color: C.t3, marginTop: 3, lineHeight: 1.3 }}>{a.desc}</div>
                </div>
              )
            })}
          </div>
          {newAch && (
            <div style={{ marginTop: 14, padding: '12px 16px',
              background: C.pu + '18', border: `1px solid ${C.pu}44`,
              borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 28 }}>{newAch.icon}</span>
              <div>
                <div style={{ color: C.pu, fontSize: 13, fontWeight: 600 }}>{newAch.label}</div>
                <div style={{ color: C.t2, fontSize: 11 }}>{newAch.desc}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
