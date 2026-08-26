// ─────────────────────────────────────────────────────────────────────────────
//  codemaster v2.0 — Developer Typing Race
//  Features: Firebase, LocalStorage, Themes, Sound, Custom Snippets,
//            Timed Mode, Lang Charts, Score Card, Settings, 50+ snippets
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { THEMES } from './themes'
import { SFX } from './sounds'
import {
  signInAnon, onAuthChange, saveUserProfile, loadUserProfile,
  submitScore, subscribeLeaderboard, saveCustomSnippet, getCommunitySnippets,
} from './firebase'

// ── SNIPPET LIBRARY (50+) ─────────────────────────────────────────────────────
const BUILTIN_SNIPS = [
  // JavaScript
  { id:0,  lang:'JS',  diff:'easy',  xp:80,  label:'Arrow fn',       code:`const add = (a, b) => a + b;` },
  { id:1,  lang:'JS',  diff:'easy',  xp:85,  label:'Filter even',    code:`const evens = arr.filter(n => n % 2 === 0);` },
  { id:2,  lang:'JS',  diff:'easy',  xp:90,  label:'Array map',      code:`const doubled = arr.map(x => x * 2);` },
  { id:3,  lang:'JS',  diff:'easy',  xp:85,  label:'Spread merge',   code:`const merged = { ...defaults, ...overrides };` },
  { id:4,  lang:'JS',  diff:'medium',xp:140, label:'Destructure',    code:`const { name, age = 0, ...rest } = person;` },
  { id:5,  lang:'JS',  diff:'medium',xp:150, label:'Promise chain',  code:`fetch(url).then(r => r.json()).then(data => render(data));` },
  { id:6,  lang:'JS',  diff:'medium',xp:145, label:'Optional chain', code:`const city = user?.address?.city ?? 'Unknown';` },
  { id:7,  lang:'JS',  diff:'medium',xp:155, label:'Async await',    code:`const data = await fetch(url).then(r => r.json());` },
  { id:8,  lang:'JS',  diff:'hard',  xp:240, label:'Debounce',       code:`const debounce=(fn,ms)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms);}};` },
  { id:9,  lang:'JS',  diff:'hard',  xp:220, label:'Curry fn',       code:`const curry=fn=>(...a)=>a.length>=fn.length?fn(...a):curry(fn.bind(null,...a));` },
  { id:10, lang:'JS',  diff:'hard',  xp:230, label:'Memoize',        code:`const memo=fn=>{const c=new Map();return(...a)=>{const k=JSON.stringify(a);return c.has(k)?c.get(k):(c.set(k,fn(...a)),c.get(k))};};` },
  // TypeScript
  { id:11, lang:'TS',  diff:'easy',  xp:90,  label:'Type alias',     code:`type Point = { x: number; y: number };` },
  { id:12, lang:'TS',  diff:'easy',  xp:95,  label:'Interface',      code:`interface User { id: number; name: string; email?: string; }` },
  { id:13, lang:'TS',  diff:'medium',xp:150, label:'Generic fn',     code:`function identity<T>(value: T): T { return value; }` },
  { id:14, lang:'TS',  diff:'medium',xp:160, label:'Union type',     code:`type Result<T> = { data: T; error: null } | { data: null; error: Error };` },
  { id:15, lang:'TS',  diff:'hard',  xp:240, label:'Mapped type',    code:`type Readonly<T> = { readonly [K in keyof T]: T[K] };` },
  { id:16, lang:'TS',  diff:'hard',  xp:235, label:'Conditional',    code:`type NonNullable<T>=T extends null|undefined?never:T;` },
  { id:17, lang:'TS',  diff:'hard',  xp:250, label:'Infer',          code:`type ReturnType<T>=T extends(...args:any[])=>infer R?R:never;` },
  // Python
  { id:18, lang:'PY',  diff:'easy',  xp:80,  label:'List comp',      code:`squares = [x ** 2 for x in range(10)]` },
  { id:19, lang:'PY',  diff:'easy',  xp:85,  label:'Dict comp',      code:`word_len = {w: len(w) for w in words}` },
  { id:20, lang:'PY',  diff:'easy',  xp:80,  label:'F-string',       code:`greeting = f"Hello, {name}! You are {age} years old."` },
  { id:21, lang:'PY',  diff:'medium',xp:140, label:'Lambda sort',    code:`people.sort(key=lambda p: (p['age'], p['name']))` },
  { id:22, lang:'PY',  diff:'medium',xp:150, label:'Context mgr',    code:`with open("data.txt", "r") as f:\n    content = f.read()` },
  { id:23, lang:'PY',  diff:'hard',  xp:260, label:'Decorator',      code:`def memo(fn):\n    cache={}\n    def w(*a):\n        if a not in cache:cache[a]=fn(*a)\n        return cache[a]\n    return w` },
  { id:24, lang:'PY',  diff:'hard',  xp:250, label:'Generator',      code:`def fibonacci():\n    a,b=0,1\n    while True:\n        yield a\n        a,b=b,a+b` },
  // SQL
  { id:25, lang:'SQL', diff:'easy',  xp:85,  label:'Select where',   code:`SELECT name, email FROM users WHERE active = 1;` },
  { id:26, lang:'SQL', diff:'easy',  xp:90,  label:'Insert',         code:`INSERT INTO users (name, email) VALUES ('Alice', 'alice@dev.io');` },
  { id:27, lang:'SQL', diff:'medium',xp:170, label:'Group join',     code:`SELECT u.name,COUNT(o.id) FROM users u LEFT JOIN orders o ON u.id=o.user_id GROUP BY u.id;` },
  { id:28, lang:'SQL', diff:'medium',xp:165, label:'Subquery',       code:`SELECT * FROM products WHERE price > (SELECT AVG(price) FROM products);` },
  { id:29, lang:'SQL', diff:'hard',  xp:210, label:'Window fn',      code:`SELECT name,salary,RANK() OVER(PARTITION BY dept ORDER BY salary DESC) rnk FROM emp;` },
  { id:30, lang:'SQL', diff:'hard',  xp:220, label:'CTE',            code:`WITH ranked AS (SELECT *, ROW_NUMBER() OVER(ORDER BY score DESC) rn FROM scores) SELECT * FROM ranked WHERE rn <= 10;` },
  // Rust
  { id:31, lang:'RUST',diff:'medium',xp:190, label:'Lifetime',       code:`fn longest<'a>(x:&'a str,y:&'a str)->&'a str{if x.len()>y.len(){x}else{y}}` },
  { id:32, lang:'RUST',diff:'medium',xp:185, label:'Option map',     code:`let upper = name.as_ref().map(|s| s.to_uppercase());` },
  { id:33, lang:'RUST',diff:'hard',  xp:280, label:'Trait impl',     code:`impl fmt::Display for Point{fn fmt(&self,f:&mut fmt::Formatter)->fmt::Result{write!(f,"({},{})",self.x,self.y)}}` },
  { id:34, lang:'RUST',diff:'hard',  xp:270, label:'Enum match',     code:`match result { Ok(v) => println!("Got: {}", v), Err(e) => eprintln!("Error: {}", e), }` },
  // Go
  { id:35, lang:'GO',  diff:'easy',  xp:90,  label:'Goroutine',      code:`go func() { fmt.Println("running in goroutine") }()` },
  { id:36, lang:'GO',  diff:'easy',  xp:88,  label:'Err check',      code:`if err != nil { log.Fatalf("failed: %v", err) }` },
  { id:37, lang:'GO',  diff:'medium',xp:150, label:'Channel',        code:`ch:=make(chan int)\ngo func(){ch<-42}()\nval:=<-ch` },
  { id:38, lang:'GO',  diff:'medium',xp:155, label:'Defer',          code:`defer func() { if r := recover(); r != nil { log.Println(r) } }()` },
  { id:39, lang:'GO',  diff:'hard',  xp:220, label:'Interface',      code:`type Stringer interface{String() string}\nfunc Print(s Stringer){fmt.Println(s.String())}` },
  // Bash
  { id:40, lang:'BASH',diff:'easy',  xp:80,  label:'Find logs',      code:`find . -name "*.log" -mtime +7 -delete` },
  { id:41, lang:'BASH',diff:'easy',  xp:85,  label:'For loop',       code:`for f in *.js; do echo "Processing $f"; done` },
  { id:42, lang:'BASH',diff:'medium',xp:175, label:'Pipe chain',     code:`cat access.log|grep "404"|awk '{print $7}'|sort|uniq -c|sort -rn|head -20` },
  { id:43, lang:'BASH',diff:'medium',xp:170, label:'If check',       code:`if [ -f "$FILE" ]; then echo "exists"; else echo "missing"; fi` },
  { id:44, lang:'BASH',diff:'hard',  xp:210, label:'Parallel',       code:`for url in "${urls[@]}"; do curl -s "$url" & done; wait` },
  // CSS
  { id:45, lang:'CSS', diff:'easy',  xp:75,  label:'Flex center',    code:`display: flex; align-items: center; justify-content: center;` },
  { id:46, lang:'CSS', diff:'easy',  xp:78,  label:'Custom prop',    code:`:root { --primary: #58a6ff; --gap: 1rem; --radius: 8px; }` },
  { id:47, lang:'CSS', diff:'medium',xp:130, label:'Grid layout',    code:`display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;` },
  { id:48, lang:'CSS', diff:'medium',xp:135, label:'Animation',      code:`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; } }` },
  { id:49, lang:'CSS', diff:'hard',  xp:185, label:'Container query',code:`@container sidebar (min-width: 300px) { .card { display: grid; grid-template-columns: 1fr 2fr; } }` },
]

const LM = {
  JS:    {c:'#f7df1e',bg:'#2a2700',b:'#5a4f00'},
  TS:    {c:'#3178c6',bg:'#001a35',b:'#0a3d70'},
  PY:    {c:'#4fc3f7',bg:'#00202e',b:'#005070'},
  SQL:   {c:'#ff9800',bg:'#2b1a00',b:'#5a3800'},
  RUST:  {c:'#f0643b',bg:'#2b0d00',b:'#5a2010'},
  GO:    {c:'#00acd7',bg:'#00202e',b:'#004860'},
  BASH:  {c:'#85e89d',bg:'#002010',b:'#005020'},
  CSS:   {c:'#a855f7',bg:'#1a0030',b:'#380060'},
  CUSTOM:{c:'#e6edf3',bg:'#1c2128',b:'#30363d'},
}
const DC = {easy:'#3fb950', medium:'#d29922', hard:'#f85149'}

const RANKS = [
  {min:0,  l:'Novice',    c:'#8b949e'},
  {min:25, l:'Apprentice',c:'#3fb950'},
  {min:45, l:'Developer', c:'#58a6ff'},
  {min:65, l:'Senior',    c:'#d29922'},
  {min:85, l:'Architect', c:'#f0883e'},
  {min:110,l:'10x Eng',   c:'#f85149'},
  {min:140,l:'Legend',    c:'#bc8cff'},
]
const getRank = w => [...RANKS].reverse().find(r => w >= r.min) || RANKS[0]

const KROWS = [
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l',';'],
  ['z','x','c','v','b','n','m',',','.','/'],
]
const ALLK = KROWS.flat()

const AI_PEERS = [
  {name:'junior_dev', wpm:28, color:'#3fb950'},
  {name:'mid_eng',    wpm:52, color:'#58a6ff'},
  {name:'senior_dev', wpm:74, color:'#d29922'},
  {name:'tech_lead',  wpm:95, color:'#f0883e'},
  {name:'10x_legend', wpm:130,color:'#f85149'},
]

const ACHIEVEMENTS = [
  {id:'first',  icon:'⚡',label:'First blood',   desc:'Complete your first snippet',   cond:s=>s.sessions>=1},
  {id:'s30',    icon:'🚀',label:'30 wpm',         desc:'Hit 30 WPM',                    cond:s=>s.best>=30},
  {id:'s60',    icon:'💎',label:'60 wpm',         desc:'Hit 60 WPM',                    cond:s=>s.best>=60},
  {id:'s90',    icon:'👑',label:'90 wpm',         desc:'Hit 90 WPM',                    cond:s=>s.best>=90},
  {id:'s120',   icon:'🔱',label:'120 wpm',        desc:'Hit 120 WPM',                   cond:s=>s.best>=120},
  {id:'acc100', icon:'🎯',label:'Perfectionist',  desc:'100% accuracy on any snippet',  cond:s=>s.perfect>=1},
  {id:'combo30',icon:'💥',label:'On fire',         desc:'30× combo',                     cond:s=>s.maxCombo>=30},
  {id:'xp1k',  icon:'💰',label:'XP grinder',      desc:'Earn 1000 total XP',            cond:s=>s.xp>=1000},
  {id:'xp5k',  icon:'🏦',label:'XP millionaire',  desc:'Earn 5000 total XP',            cond:s=>s.xp>=5000},
  {id:'poly',  icon:'🌐',label:'Polyglot',         desc:'Type in 6 different languages', cond:s=>s.langs>=6},
  {id:'streak5',icon:'🔥',label:'Streak master',  desc:'5 sessions in a row',           cond:s=>s.streak>=5},
  {id:'boss',  icon:'💀',label:'Boss slayer',      desc:'Survive boss mode',             cond:s=>s.bossWins>=1},
  {id:'hard10',icon:'🦾',label:'Hard carry',       desc:'Complete 10 hard snippets',     cond:s=>s.hardDone>=10},
  {id:'custom',icon:'✏️',label:'Snippet author',  desc:'Create a custom snippet',       cond:s=>s.customCreated>=1},
  {id:'speed',  icon:'⚡',label:'Speed runner',    desc:'Finish timed mode above 60wpm', cond:s=>s.timedBest>=60},
]

// ── localStorage helpers ──────────────────────────────────────────────────────
const LS = {
  get: (k, fallback) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback } catch { return fallback } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} },
}

// ─────────────────────────────────────────────────────────────────────────────
//  PRIMITIVE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function Kbd({c,C}) {
  return <span style={{padding:'1px 6px',borderRadius:4,fontSize:10,border:`1px solid ${C.b2}`,background:C.bg3,color:C.t2}}>{c}</span>
}

function Tag({label,color}) {
  return <span style={{padding:'1px 7px',borderRadius:4,fontSize:10,fontWeight:600,color,background:color+'1a',border:`1px solid ${color}44`}}>{label}</span>
}

function ProgressRing({pct,size=40,stroke=3,color,label}) {
  const r=(size-stroke)/2,circ=2*Math.PI*r,off=circ-(Math.min(100,pct)/100)*circ
  return (
    <div style={{position:'relative',width:size,height:size,display:'inline-flex',alignItems:'center',justifyContent:'center'}}>
      <svg width={size} height={size} style={{position:'absolute',transform:'rotate(-90deg)'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#30363d" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
          style={{transition:'stroke-dashoffset 0.5s ease'}}/>
      </svg>
      <span style={{fontSize:9,color,fontWeight:700,zIndex:1}}>{label}</span>
    </div>
  )
}

function SparkLine({data,color,width=120,height=32}) {
  if(data.length<2) return <svg width={width} height={height}><text x={width/2} y={height/2+4} textAnchor="middle" fill="#484f58" fontSize="10">—</text></svg>
  const max=Math.max(...data,1)
  const pts=data.map((v,i)=>`${((i/(data.length-1))*(width-6)+3).toFixed(1)},${(height-3-((v/max)*(height-8))).toFixed(1)}`).join(' ')
  const lp=pts.split(' ').pop().split(',')
  return (
    <svg width={width} height={height}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx={lp[0]} cy={lp[1]} r="2.5" fill={color}/>
    </svg>
  )
}

function Toast({msg,color,onDone}) {
  useEffect(()=>{const t=setTimeout(onDone,2400);return()=>clearTimeout(t)},[])
  return <div style={{position:'absolute',top:14,left:'50%',transform:'translateX(-50%)',background:'#1c2128',border:`1px solid ${color||'#30363d'}`,padding:'6px 18px',borderRadius:8,fontSize:11,color:color||'#e6edf3',zIndex:100,pointerEvents:'none',whiteSpace:'nowrap',boxShadow:'0 4px 24px rgba(0,0,0,0.6)'}}>{msg}</div>
}

function HeatKey({ch,heat,maxHeat,errHeat,maxErr,C}) {
  const hp=maxHeat>0?heat/maxHeat:0,ep=maxErr>0?errHeat/maxErr:0,hasErr=ep>0.25
  const bg=hasErr?`rgba(248,81,73,${0.12+ep*0.55})`:hp===0?C.bg3:`rgba(88,166,255,${0.1+hp*0.72})`
  return <div title={`${ch}: ${heat||0} hits · ${errHeat||0} errors`} style={{width:26,height:26,borderRadius:4,background:bg,border:`1px solid ${hasErr?'#f8514440':hp>0.3?'#58a6ff40':C.b}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:hp>0.55||hasErr?C.t:C.t3,fontWeight:500,transition:'background 0.35s',cursor:'default'}}>{ch}</div>
}

// ── Lang accuracy bar chart ───────────────────────────────────────────────────
function LangChart({langStats,C}) {
  const entries=Object.entries(langStats)
  if(!entries.length) return <div style={{color:C.t3,fontSize:11,padding:'10px 0'}}>No language data yet — complete some snippets!</div>
  const maxWpm=Math.max(...entries.map(([,v])=>v.wpm),1)
  return (
    <div style={{display:'flex',flexDirection:'column',gap:7}}>
      {entries.sort((a,b)=>b[1].wpm-a[1].wpm).map(([lang,{wpm,acc,count}])=>{
        const lm=LM[lang]||LM.JS,pct=Math.round((wpm/maxWpm)*100)
        return (
          <div key={lang} style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:9,fontWeight:700,color:lm.c,width:32,textAlign:'center'}}>{lang}</span>
            <div style={{flex:1,height:18,background:C.bg3,borderRadius:3,overflow:'hidden',position:'relative'}}>
              <div style={{width:`${pct}%`,height:'100%',background:lm.c+'44',borderRadius:3,transition:'width 0.5s'}}/>
              <span style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',fontSize:9,color:lm.c}}>
                {Math.round(wpm)} wpm · {Math.round(acc)}% acc · {count} sessions
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── WPM Prediction ────────────────────────────────────────────────────────────
function WpmPredict({history,C}) {
  if(history.length<4) return <div style={{color:C.t3,fontSize:11}}>Need 4+ sessions for prediction</div>
  const n=history.length,sx=history.reduce((a,_,i)=>a+i,0),sy=history.reduce((a,b)=>a+b,0)
  const sxy=history.reduce((a,v,i)=>a+i*v,0),sxx=history.reduce((a,_,i)=>a+i*i,0)
  const m=(n*sxy-sx*sy)/(n*sxx-sx*sx||1),b=(sy-m*sx)/n
  const pred=o=>Math.max(0,Math.round(m*(n+o-1)+b))
  const trend=m>0.8?'improving fast':m>0.2?'improving':m>-0.2?'plateau':'declining'
  const trendColor=m>0.2?C.gr:m>-0.2?C.yl:C.rd
  const W=520,H=70,max=Math.max(...history,pred(20),1),min=Math.min(...history,0),range=max-min||1
  const toY=v=>H-4-((v-min)/range)*(H-10)
  const histPts=history.map((v,i)=>`${((i/(n-1))*0.72*(W-8)+4).toFixed(1)},${toY(v).toFixed(1)}`).join(' ')
  const predX0=((n-1)/(n-1))*0.72*(W-8)+4,predX1=W-4
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
        <Tag label={trend} color={trendColor}/>
        <span style={{color:C.t3,fontSize:9}}>slope: {m>0?'+':''}{m.toFixed(2)} wpm/session</span>
      </div>
      <svg width={W} height={H} style={{display:'block',marginBottom:10}}>
        <polyline points={histPts} fill="none" stroke={C.bl} strokeWidth="1.5" strokeLinejoin="round"/>
        <line x1={predX0} y1={toY(m*(n-1)+b)} x2={predX1} y2={toY(m*(n+19)+b)} stroke={C.pu} strokeWidth="1.5" strokeDasharray="5,4"/>
        {history.map((v,i)=><circle key={i} cx={((i/(n-1))*0.72*(W-8)+4)} cy={toY(v)} r="2.5" fill={C.bl}/>)}
      </svg>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        {[5,10,20].map(o=>(
          <div key={o} style={{padding:'6px 12px',background:C.bg3,borderRadius:5,border:`1px solid ${C.b}`,textAlign:'center'}}>
            <div style={{color:C.t3,fontSize:8}}>+{o} sessions</div>
            <div style={{color:C.pu,fontSize:15,fontWeight:700}}>{pred(o)} wpm</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Rhythm visualizer ─────────────────────────────────────────────────────────
function RhythmViz({events,C}) {
  if(!events.length) return <div style={{color:C.t3,fontSize:11,padding:'10px 0'}}>Complete a snippet to see your rhythm</div>
  const W=560,H=58
  const times=events.map(e=>e.t-events[0].t),maxT=Math.max(...times,1)
  const gaps=times.slice(1).map((t,i)=>t-times[i]),avgGap=gaps.length?gaps.reduce((a,b)=>a+b,0)/gaps.length:0
  return (
    <div>
      <div style={{display:'flex',gap:16,marginBottom:8}}>
        {[{l:'avg gap',v:Math.round(avgGap)+'ms',c:C.bl},{l:'keystrokes',v:events.length,c:C.gr},{l:'duration',v:(maxT/1000).toFixed(1)+'s',c:C.yl},{l:'errors',v:events.filter(e=>e.type==='error').length,c:C.rd}].map(s=>(
          <div key={s.l}><div style={{color:C.t3,fontSize:8}}>{s.l}</div><div style={{color:s.c,fontSize:13,fontWeight:600}}>{s.v}</div></div>
        ))}
      </div>
      <svg width={W} height={H} style={{display:'block',background:C.bg3,borderRadius:6,border:`1px solid ${C.b}`,marginBottom:8}}>
        <line x1={4} y1={H*0.5} x2={W-4} y2={H*0.5} stroke={C.b2} strokeWidth={0.5} strokeDasharray="4,4"/>
        {events.map((ev,i)=>{
          const x=(times[i]/maxT)*(W-8)+4
          const gap=i>0?times[i]-times[i-1]:0,slow=Math.min(1,gap/(avgGap*2||1))
          const col=ev.type==='error'?C.rd:ev.type==='backspace'?C.or:slow>0.65?C.yl:C.gr
          const h=ev.type==='error'?H*0.78:ev.type==='backspace'?H*0.45:H*0.28+slow*H*0.38
          return <rect key={i} x={x-1} y={H-h} width={2} height={h} fill={col} opacity={0.85} rx={1}/>
        })}
      </svg>
      <div style={{display:'flex',gap:14}}>
        {[{c:C.gr,l:'fast'},{c:C.yl,l:'slow'},{c:C.rd,l:'error'},{c:C.or,l:'backspace'}].map(s=>(
          <span key={s.l} style={{display:'flex',alignItems:'center',gap:4,fontSize:9,color:C.t3}}>
            <span style={{width:8,height:8,background:s.c,borderRadius:2,display:'inline-block'}}/>{s.l}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Score Card (export) ───────────────────────────────────────────────────────
function ScoreCard({snippet,wpm,accuracy,rank,xp,combo,username,theme,C,onClose}) {
  const lm=LM[snippet.lang]||LM.CUSTOM
  const cardRef=useRef(null)
  function copyCard() {
    const el=cardRef.current
    if(!el) return
    const text=`🏆 ${username||'dev'} typed "${snippet.label}" in ${snippet.lang}\n⚡ ${wpm} wpm · ${accuracy}% accuracy · ${combo}× combo\n🎖 Rank: ${rank.l} · ${xp} XP\n\ncodemaster — codemaster.dev`
    navigator.clipboard.writeText(text).then(()=>alert('Score copied to clipboard!')).catch(()=>{})
  }
  return (
    <div style={{borderTop:`1px solid ${C.b}`,padding:'14px 18px',background:C.bg}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
        <span style={{color:C.pi,fontSize:12,fontWeight:600}}>score card</span>
        <button onClick={onClose} style={{marginLeft:'auto',padding:'2px 9px',borderRadius:4,fontSize:10,border:`1px solid ${C.b2}`,background:C.bg3,color:C.t2,cursor:'pointer'}}>✕</button>
      </div>
      <div ref={cardRef} style={{background:C.bg2,borderRadius:10,border:`1px solid ${lm.b}`,padding:'18px 20px',maxWidth:440}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
          <Tag label={snippet.lang} color={lm.c}/>
          <span style={{color:C.t,fontSize:13,fontWeight:600}}>{snippet.label}</span>
          <span style={{marginLeft:'auto',color:C.t3,fontSize:9}}>codemaster</span>
        </div>
        <div style={{display:'flex',gap:16,marginBottom:12}}>
          {[{l:'wpm',v:wpm,c:C.bl},{l:'accuracy',v:accuracy+'%',c:C.gr},{l:'combo',v:combo+'×',c:C.pu},{l:'xp',v:'+'+xp,c:C.yl}].map(s=>(
            <div key={s.l} style={{textAlign:'center'}}>
              <div style={{color:C.t3,fontSize:8}}>{s.l}</div>
              <div style={{color:s.c,fontSize:16,fontWeight:700}}>{s.v}</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:11,fontFamily:'monospace',color:C.t3,background:C.bg3,borderRadius:4,padding:'8px 10px',whiteSpace:'pre-wrap',wordBreak:'break-all',lineHeight:1.7}}>
          {snippet.code.slice(0,72)}{snippet.code.length>72?'…':''}
        </div>
        <div style={{marginTop:10,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{padding:'2px 8px',borderRadius:4,background:rank.c+'22',border:`1px solid ${rank.c}44`,color:rank.c,fontSize:10,fontWeight:700}}>{rank.l}</div>
          <span style={{color:C.t3,fontSize:9}}>@{username||'dev'}</span>
        </div>
      </div>
      <div style={{display:'flex',gap:8,marginTop:10}}>
        <button onClick={copyCard} style={{padding:'5px 14px',borderRadius:5,fontSize:11,border:`1px solid ${C.bl}88`,background:C.bl+'14',color:C.bl,cursor:'pointer'}}>📋 copy text</button>
      </div>
    </div>
  )
}

// ── Custom Snippet Creator ────────────────────────────────────────────────────
function CustomCreator({onAdd,onClose,uid,C}) {
  const [code,setCode]=useState(''),[lang,setLang]=useState('CUSTOM'),[label,setLabel]=useState(''),[diff,setDiff]=useState('medium'),[err,setErr]=useState(''),[saving,setSaving]=useState(false)
  async function submit() {
    if(!code.trim()){setErr('code is required');return}
    if(!label.trim()){setErr('label is required');return}
    setSaving(true)
    const snip={id:Date.now(),lang,diff,xp:120,label:label.trim(),code:code.trim(),custom:true}
    onAdd(snip)
    if(uid) await saveCustomSnippet(uid,snip)
    setSaving(false);onClose()
  }
  return (
    <div style={{borderTop:`1px solid ${C.b}`,padding:'14px 18px',background:C.bg}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
        <span style={{color:C.or,fontSize:12,fontWeight:600}}>✏️ create snippet</span>
        <button onClick={onClose} style={{marginLeft:'auto',padding:'1px 7px',borderRadius:3,fontSize:9,border:`1px solid ${C.b2}`,background:C.bg3,color:C.t2,cursor:'pointer'}}>cancel</button>
      </div>
      <div style={{display:'flex',gap:8,marginBottom:8}}>
        <input value={label} onChange={e=>{setLabel(e.target.value);setErr('')}} placeholder="snippet label" style={{flex:1,background:C.bg3,border:`1px solid ${err&&!label.trim()?C.rd:C.b2}`,borderRadius:5,padding:'6px 10px',color:C.t,fontSize:12,fontFamily:'monospace',outline:'none'}}/>
        <select value={lang} onChange={e=>setLang(e.target.value)} style={{background:C.bg3,border:`1px solid ${C.b2}`,borderRadius:5,padding:'6px 8px',color:C.t,fontSize:11,fontFamily:'monospace',outline:'none'}}>
          {Object.keys(LM).map(l=><option key={l} value={l}>{l}</option>)}
        </select>
        <select value={diff} onChange={e=>setDiff(e.target.value)} style={{background:C.bg3,border:`1px solid ${C.b2}`,borderRadius:5,padding:'6px 8px',color:DC[diff]||C.t,fontSize:11,fontFamily:'monospace',outline:'none'}}>
          {['easy','medium','hard'].map(d=><option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <textarea value={code} onChange={e=>{setCode(e.target.value);setErr('')}} placeholder="paste or type your code snippet here…" rows={4}
        style={{width:'100%',boxSizing:'border-box',background:C.bg3,border:`1px solid ${err&&!code.trim()?C.rd:C.b2}`,borderRadius:5,padding:'8px 10px',color:C.t,fontSize:13,fontFamily:'monospace',outline:'none',resize:'vertical',lineHeight:1.8}}/>
      {err&&<div style={{color:C.rd,fontSize:10,marginTop:4}}>{err}</div>}
      <div style={{display:'flex',gap:8,marginTop:8,alignItems:'center'}}>
        <span style={{color:C.t3,fontSize:10}}>{code.length} chars</span>
        <button onClick={submit} disabled={saving} style={{marginLeft:'auto',padding:'5px 16px',borderRadius:5,fontSize:11,border:`1px solid ${C.or}88`,background:C.or+'18',color:C.or,cursor:'pointer'}}>
          {saving?'saving…':'add snippet'}
        </button>
      </div>
    </div>
  )
}

// ── Settings Panel ────────────────────────────────────────────────────────────
function SettingsPanel({settings,onChange,C}) {
  return (
    <div style={{padding:'14px 18px'}}>
      <div style={{color:C.t3,fontSize:9,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.07em'}}>settings</div>
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{color:C.t2,fontSize:11,width:110}}>username</span>
          <input value={settings.username||''} onChange={e=>onChange({...settings,username:e.target.value})} placeholder="anonymous" maxLength={20}
            style={{flex:1,background:C.bg3,border:`1px solid ${C.b2}`,borderRadius:5,padding:'5px 10px',color:C.t,fontSize:11,fontFamily:'monospace',outline:'none'}}/>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{color:C.t2,fontSize:11,width:110}}>theme</span>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {Object.entries(THEMES).map(([k,v])=>(
              <button key={k} onClick={()=>onChange({...settings,theme:k})} style={{padding:'3px 10px',borderRadius:4,fontSize:10,border:`1px solid ${settings.theme===k?C.bl+'88':C.b}`,background:settings.theme===k?C.bl+'18':'transparent',color:settings.theme===k?C.bl:C.t2,cursor:'pointer'}}>{v.name}</button>
            ))}
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{color:C.t2,fontSize:11,width:110}}>sound effects</span>
          <button onClick={()=>onChange({...settings,sound:!settings.sound})} style={{padding:'3px 12px',borderRadius:4,fontSize:10,border:`1px solid ${settings.sound?C.gr+'88':C.b}`,background:settings.sound?C.gr+'18':'transparent',color:settings.sound?C.gr:C.t2,cursor:'pointer'}}>
            {settings.sound?'🔊 on':'🔇 off'}
          </button>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{color:C.t2,fontSize:11,width:110}}>font size</span>
          <div style={{display:'flex',gap:6}}>
            {[12,14,16,18].map(sz=>(
              <button key={sz} onClick={()=>onChange({...settings,fontSize:sz})} style={{padding:'3px 10px',borderRadius:4,fontSize:10,border:`1px solid ${settings.fontSize===sz?C.yl+'88':C.b}`,background:settings.fontSize===sz?C.yl+'18':'transparent',color:settings.fontSize===sz?C.yl:C.t2,cursor:'pointer'}}>{sz}px</button>
            ))}
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{color:C.t2,fontSize:11,width:110}}>show ghost race</span>
          <button onClick={()=>onChange({...settings,showGhost:!settings.showGhost})} style={{padding:'3px 12px',borderRadius:4,fontSize:10,border:`1px solid ${settings.showGhost?C.bl+'88':C.b}`,background:settings.showGhost?C.bl+'18':'transparent',color:settings.showGhost?C.bl:C.t2,cursor:'pointer'}}>
            {settings.showGhost?'on':'off'}
          </button>
        </div>
        <div style={{padding:'10px 12px',background:C.bg3,borderRadius:6,border:`1px solid ${C.b}`}}>
          <div style={{color:C.t3,fontSize:9,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>⌨️ keyboard shortcuts</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
            {[['Tab','skip snippet'],['↩','next after done'],['⌫','backspace'],['Esc','cancel/close']].map(([k,v])=>(
              <div key={k} style={{display:'flex',alignItems:'center',gap:6,fontSize:10}}>
                <span style={{padding:'1px 5px',borderRadius:3,border:`1px solid ${C.b2}`,background:C.bg4,color:C.t2,fontSize:9}}>{k}</span>
                <span style={{color:C.t3}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Timed Challenge Mode ──────────────────────────────────────────────────────
function TimedMode({snippets,duration,onDone,C,sfx}) {
  const [phase,setPhase]=useState('lobby')
  const [si,setSi]=useState(0),[typed,setTyped]=useState('')
  const [timeLeft,setTimeLeft]=useState(duration),[done,setDone]=useState(0),[errs,setErrs]=useState(0)
  const [wpmH,setWpmH]=useState([]),[liveWpm,setLiveWpm]=useState(0)
  const ref=useRef(null),tRef=useRef(''),stRef=useRef(null),timerRef=useRef(null),wpmRef=useRef(null),totalRef=useRef(0),errRef=useRef(0)
  useEffect(()=>{ref.current?.focus()},[])
  useEffect(()=>()=>{clearInterval(timerRef.current);clearInterval(wpmRef.current)},[])
  const pool=useMemo(()=>[...snippets].sort(()=>Math.random()-0.5),[])
  const snip=pool[si%pool.length],target=snip?.code||''
  const lm=LM[snip?.lang]||LM.JS
  function start() {
    setPhase('playing');stRef.current=Date.now()
    timerRef.current=setInterval(()=>{setTimeLeft(t=>{if(t<=1){clearInterval(timerRef.current);clearInterval(wpmRef.current);setPhase('done');return 0}return t-1})},1000)
    wpmRef.current=setInterval(()=>{if(!stRef.current)return;const w=Math.round((totalRef.current/5)/((Date.now()-stRef.current)/60000));setLiveWpm(w);setWpmH(h=>[...h.slice(-60),w])},700)
  }
  const handleKey=useCallback(e=>{
    if(phase!=='playing')return
    if(e.key.length!==1&&e.key!=='Backspace')return
    e.preventDefault()
    if(e.key==='Backspace'){if(tRef.current.length>0){tRef.current=tRef.current.slice(0,-1);setTyped(tRef.current)};return}
    const correct=e.key===target[tRef.current.length]
    if(correct){
      tRef.current+=e.key;totalRef.current++;setTyped(tRef.current)
      if(sfx) SFX.keyCorrect()
      if(tRef.current.length===target.length){if(sfx)SFX.snippetDone();setDone(d=>d+1);setSi(s=>s+1);tRef.current='';setTyped('')}
    } else {errRef.current++;setErrs(errRef.current);if(sfx)SFX.keyError()}
  },[phase,target,sfx])
  useEffect(()=>{const el=ref.current;el?.addEventListener('keydown',handleKey);return()=>el?.removeEventListener('keydown',handleKey)},[handleKey])
  const acc=totalRef.current+errRef.current===0?100:Math.round((totalRef.current/(totalRef.current+errRef.current))*100)
  const timePct=(timeLeft/duration)*100,timeColor=timePct>50?C.gr:timePct>25?C.yl:C.rd
  if(phase==='done') return (
    <div style={{padding:'24px',textAlign:'center'}}>
      <div style={{color:C.gr,fontSize:16,fontWeight:700,marginBottom:4}}>time's up!</div>
      <div style={{color:C.bl,fontSize:28,fontWeight:700,marginBottom:4}}>{wpmH.length?Math.max(...wpmH):liveWpm} wpm peak</div>
      <div style={{color:C.t2,fontSize:12,marginBottom:14}}>{acc}% accuracy · {done} snippets · {errs} errors</div>
      <SparkLine data={wpmH} color={C.bl} width={300} height={50}/>
      <button onClick={()=>onDone({wpm:wpmH.length?Math.max(...wpmH):liveWpm,acc,done,errs})} style={{marginTop:16,padding:'8px 20px',borderRadius:7,fontSize:12,border:`1px solid ${C.bl}88`,background:C.bl+'14',color:C.bl,cursor:'pointer'}}>save & exit</button>
    </div>
  )
  if(phase==='lobby') return (
    <div style={{padding:'24px',textAlign:'center'}}>
      <div style={{color:C.yl,fontSize:16,fontWeight:700,marginBottom:4}}>⏱ timed challenge</div>
      <div style={{color:C.t2,fontSize:12,marginBottom:20}}>type as many snippets as possible in {duration} seconds</div>
      <button onClick={start} style={{padding:'9px 24px',borderRadius:7,fontSize:13,border:`1px solid ${C.yl}88`,background:C.yl+'18',color:C.yl,cursor:'pointer'}}>start {duration}s challenge</button>
    </div>
  )
  return (
    <div ref={ref} tabIndex={0} style={{outline:'none'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px 18px',borderBottom:`1px solid ${C.b}`,background:C.bg2}}>
        <ProgressRing pct={timePct} size={42} stroke={4} color={timeColor} label={timeLeft}/>
        <div style={{flex:1}}>
          <div style={{display:'flex',gap:14,marginBottom:5}}>
            {[{l:'wpm',v:liveWpm,c:C.bl},{l:'done',v:done,c:C.gr},{l:'errors',v:errs,c:C.rd},{l:'acc',v:acc+'%',c:C.yl}].map(s=>(
              <div key={s.l} style={{textAlign:'center'}}><div style={{color:C.t3,fontSize:8}}>{s.l}</div><div style={{color:s.c,fontSize:15,fontWeight:700}}>{s.v}</div></div>
            ))}
          </div>
          <div style={{height:4,background:C.bg3,borderRadius:2,overflow:'hidden'}}>
            <div style={{width:`${timePct}%`,height:'100%',background:timeColor,borderRadius:2,transition:'width 1s linear,background 0.3s'}}/>
          </div>
        </div>
      </div>
      <div style={{padding:'8px 18px',borderBottom:`1px solid ${C.b}`,background:lm.bg+'33',display:'flex',alignItems:'center',gap:8}}>
        <Tag label={snip.lang} color={lm.c}/><span style={{color:C.t,fontSize:12,fontWeight:500}}>{snip.label}</span>
        <span style={{marginLeft:'auto',color:C.t3,fontSize:10}}>{typed.length}/{target.length}</span>
      </div>
      <div style={{padding:'14px 20px',minHeight:72}}>
        <div style={{fontSize:14,lineHeight:2.1,whiteSpace:'pre-wrap',wordBreak:'break-all'}}>
          {target.split('').map((ch,i)=>{
            let color,bg='transparent'
            if(i<typed.length){color=typed[i]===ch?C.gr:C.rd;if(typed[i]!==ch)bg='#f8514914'}
            else if(i===typed.length){color=C.t;bg='#58a6ff28'}
            else color=C.t3
            return <span key={i} style={{color,background:bg,borderRadius:2}}>{ch==='\n'?'↵\n':ch}</span>
          })}
        </div>
      </div>
    </div>
  )
}

// ── Boss Mode ─────────────────────────────────────────────────────────────────
function BossMode({snips,onDone,C,sfx}) {
  const [phase,setPhase]=useState('intro'),[si,setSi]=useState(0),[typed,setTyped]=useState('')
  const [timeLeft,setTimeLeft]=useState(120),[done,setDone]=useState(0),[errs,setErrs]=useState(0)
  const [lives,setLives]=useState(3),[wpmH,setWpmH]=useState([]),[shake,setShake]=useState(false)
  const ref=useRef(null),tRef=useRef(''),stRef=useRef(null),timerRef=useRef(null),wpmRef=useRef(null),totalRef=useRef(0),errRef=useRef(0)
  useEffect(()=>{ref.current?.focus()},[])
  useEffect(()=>()=>{clearInterval(timerRef.current);clearInterval(wpmRef.current)},[])
  const pool=useMemo(()=>[...snips].sort(()=>Math.random()-0.5),[])
  const snip=pool[si%pool.length],target=snip?.code||''
  const lm=LM[snip?.lang]||LM.JS
  function start(){
    setPhase('playing');stRef.current=Date.now()
    timerRef.current=setInterval(()=>{setTimeLeft(t=>{if(t<=1){clearInterval(timerRef.current);clearInterval(wpmRef.current);setPhase('done');return 0}return t-1})},1000)
    wpmRef.current=setInterval(()=>{if(!stRef.current)return;const w=Math.round((totalRef.current/5)/((Date.now()-stRef.current)/60000));setWpmH(h=>[...h.slice(-60),w])},700)
  }
  const handleKey=useCallback(e=>{
    if(phase!=='playing')return
    if(e.key.length!==1)return
    e.preventDefault()
    const correct=e.key===target[tRef.current.length]
    if(correct){
      tRef.current+=e.key;totalRef.current++;setTyped(tRef.current)
      if(sfx)SFX.keyCorrect()
      if(tRef.current.length===target.length){if(sfx)SFX.snippetDone();setDone(d=>d+1);setSi(s=>s+1);tRef.current='';setTyped('')}
    } else {
      errRef.current++;setErrs(errRef.current);setShake(true);setTimeout(()=>setShake(false),300)
      if(sfx)SFX.bossLife()
      setLives(l=>{const nl=l-1;if(nl<=0){clearInterval(timerRef.current);clearInterval(wpmRef.current);setPhase('done')};return nl})
    }
  },[phase,target,sfx])
  useEffect(()=>{const el=ref.current;el?.addEventListener('keydown',handleKey);return()=>el?.removeEventListener('keydown',handleKey)},[handleKey])
  const wpm=stRef.current&&totalRef.current>0?Math.round((totalRef.current/5)/((Date.now()-stRef.current)/60000)):0
  const acc=totalRef.current+errRef.current===0?100:Math.round((totalRef.current/(totalRef.current+errRef.current))*100)
  const timePct=(timeLeft/120)*100,timeColor=timePct>50?C.gr:timePct>25?C.yl:C.rd
  if(phase==='intro') return (
    <div style={{padding:'36px 24px',textAlign:'center'}}>
      <div style={{fontSize:40,marginBottom:10}}>💀</div>
      <div style={{color:C.rd,fontSize:18,fontWeight:700,marginBottom:6}}>Boss Mode</div>
      <div style={{color:C.t2,fontSize:12,lineHeight:1.9,marginBottom:6}}>120 seconds · hard + medium snippets<br/>no backspace · 3 lives · one wrong key costs a life</div>
      <div style={{display:'flex',justifyContent:'center',gap:6,marginBottom:20}}>{[1,2,3].map(i=><span key={i} style={{fontSize:24}}>❤️</span>)}</div>
      <button onClick={start} style={{padding:'10px 28px',borderRadius:8,fontSize:13,border:`1px solid ${C.rd}88`,background:C.rd+'18',color:C.rd,cursor:'pointer'}}>enter boss mode</button>
    </div>
  )
  if(phase==='done') return (
    <div style={{padding:'28px 24px',textAlign:'center'}}>
      <div style={{fontSize:32,marginBottom:8}}>{lives<=0?'💀':'🏆'}</div>
      <div style={{color:lives<=0?C.rd:C.gr,fontSize:16,fontWeight:700,marginBottom:4}}>{lives<=0?'game over':"time's up!"}</div>
      <div style={{color:C.bl,fontSize:28,fontWeight:700,marginBottom:4}}>{wpmH.length?Math.max(...wpmH):wpm} wpm peak</div>
      <div style={{color:C.t2,fontSize:12,marginBottom:14}}>{acc}% accuracy · {done} snippets · {errs} errors</div>
      <SparkLine data={wpmH} color={C.bl} width={300} height={50}/>
      <button onClick={()=>onDone({wpm:wpmH.length?Math.max(...wpmH):wpm,acc,done,errs,survived:lives>0})} style={{marginTop:16,padding:'8px 20px',borderRadius:7,fontSize:12,border:`1px solid ${C.bl}88`,background:C.bl+'14',color:C.bl,cursor:'pointer'}}>save & exit</button>
    </div>
  )
  return (
    <div ref={ref} tabIndex={0} style={{outline:'none'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px 18px',borderBottom:`1px solid ${C.b}`,background:C.bg2}}>
        <ProgressRing pct={timePct} size={42} stroke={4} color={timeColor} label={timeLeft}/>
        <div style={{flex:1}}>
          <div style={{display:'flex',gap:14,marginBottom:5}}>
            {[{l:'wpm',v:wpm,c:C.bl},{l:'done',v:done,c:C.gr},{l:'errors',v:errs,c:C.rd},{l:'acc',v:acc+'%',c:C.yl}].map(s=>(
              <div key={s.l} style={{textAlign:'center'}}><div style={{color:C.t3,fontSize:8}}>{s.l}</div><div style={{color:s.c,fontSize:15,fontWeight:700}}>{s.v}</div></div>
            ))}
            <div style={{marginLeft:'auto',display:'flex',gap:4,alignItems:'center'}}>
              {[1,2,3].map(i=><span key={i} style={{fontSize:16,opacity:i<=lives?1:0.15,transition:'opacity 0.3s'}}>❤️</span>)}
            </div>
          </div>
          <div style={{height:4,background:C.bg3,borderRadius:2,overflow:'hidden'}}>
            <div style={{width:`${timePct}%`,height:'100%',background:timeColor,borderRadius:2,transition:'width 1s linear,background 0.3s'}}/>
          </div>
        </div>
      </div>
      <div style={{padding:'8px 18px',borderBottom:`1px solid ${C.b}`,background:lm.bg+'33',display:'flex',alignItems:'center',gap:8}}>
        <Tag label={snip.lang} color={lm.c}/><span style={{color:C.t,fontSize:12,fontWeight:500}}>{snip.label}</span>
        <span style={{marginLeft:'auto',color:C.t3,fontSize:10}}>{typed.length}/{target.length}</span>
      </div>
      <div style={{padding:'14px 20px',minHeight:72,background:shake?'#1f0000':C.bg,transition:'background 0.1s'}}>
        <div style={{fontSize:14,lineHeight:2.1,whiteSpace:'pre-wrap',wordBreak:'break-all'}}>
          {target.split('').map((ch,i)=>{
            let color,bg='transparent'
            if(i<typed.length){color=typed[i]===ch?C.gr:C.rd;if(typed[i]!==ch)bg='#f8514914'}
            else if(i===typed.length){color=C.t;bg='#58a6ff28'}
            else color=C.t3
            return <span key={i} style={{color,background:bg,borderRadius:2}}>{ch==='\n'?'↵\n':ch}</span>
          })}
        </div>
      </div>
      <div style={{padding:'4px 18px',borderTop:`1px solid ${C.b}`,background:C.bg2}}>
        <SparkLine data={wpmH} color={C.bl} width={560} height={20}/>
      </div>
    </div>
  )
}

// ── AI Lesson ─────────────────────────────────────────────────────────────────
function AILesson({snippet,onClose,C}) {
  const [resp,setResp]=useState(null),[loading,setLoading]=useState(true),[err,setErr]=useState(null)
  useEffect(()=>{
    ;(async()=>{
      try {
        const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:1000,messages:[{role:'user',content:`You are a concise coding teacher. Teach me about this code snippet. Reply in JSON only — no markdown fences.\n\nLanguage: ${snippet.lang}\nCode: ${snippet.code}\n\nJSON: {"concept":"name (2-4 words)","what":"one sentence","why":"one sentence","how":"2-3 sentences","gotcha":"one common mistake","example":"short related code example","level":"beginner|intermediate|advanced"}`}]})})
        const d=await res.json()
        setResp(JSON.parse((d.content?.[0]?.text||'{}').trim()))
      } catch(e){setErr('AI lesson unavailable.')}
      setLoading(false)
    })()
  },[snippet.id])
  const lc={beginner:C.gr,intermediate:C.yl,advanced:C.rd}
  return (
    <div style={{borderTop:`1px solid ${C.b}`,padding:'14px 18px',background:C.bg}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
        <div style={{width:7,height:7,borderRadius:'50%',background:loading?C.yl:err?C.rd:C.cy}}/>
        <span style={{color:C.cy,fontSize:12,fontWeight:600}}>AI lesson</span>
        {resp&&<Tag label={resp.level} color={lc[resp.level]||C.t2}/>}
        <button onClick={onClose} style={{marginLeft:'auto',padding:'2px 9px',borderRadius:4,fontSize:10,border:`1px solid ${C.b2}`,background:C.bg3,color:C.t2,cursor:'pointer'}}>✕ close</button>
      </div>
      {loading&&<div style={{color:C.t3,fontSize:11}}>Generating lesson…</div>}
      {err&&<div style={{color:C.rd,fontSize:11}}>{err}</div>}
      {resp&&(
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <div style={{padding:'12px 14px',background:C.cy+'12',borderRadius:7,border:`1px solid ${C.cy}30`}}>
            <div style={{color:C.cy,fontSize:12,fontWeight:700,marginBottom:4}}>{resp.concept}</div>
            <div style={{color:C.t,fontSize:12,lineHeight:1.7}}>{resp.what}</div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <div style={{padding:'10px 12px',background:C.bg3,borderRadius:6,border:`1px solid ${C.b}`}}>
              <div style={{color:C.t3,fontSize:8,marginBottom:4,textTransform:'uppercase',letterSpacing:'0.06em'}}>why use it</div>
              <div style={{color:C.t2,fontSize:11,lineHeight:1.6}}>{resp.why}</div>
            </div>
            <div style={{padding:'10px 12px',background:C.bg3,borderRadius:6,border:`1px solid ${C.b}`}}>
              <div style={{color:C.t3,fontSize:8,marginBottom:4,textTransform:'uppercase',letterSpacing:'0.06em'}}>watch out ⚠️</div>
              <div style={{color:C.or,fontSize:11,lineHeight:1.6}}>{resp.gotcha}</div>
            </div>
          </div>
          <div style={{padding:'10px 12px',background:C.bg2,borderRadius:6,border:`1px solid ${C.b}`}}>
            <div style={{color:C.t3,fontSize:8,marginBottom:4,textTransform:'uppercase',letterSpacing:'0.06em'}}>how it works</div>
            <div style={{color:C.t2,fontSize:11,lineHeight:1.7}}>{resp.how}</div>
          </div>
          {resp.example&&<div style={{padding:'10px 12px',background:C.bg3,borderRadius:6,border:`1px solid ${C.b}`}}>
            <div style={{color:C.t3,fontSize:8,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>related example</div>
            <pre style={{margin:0,fontSize:12,color:C.gr,lineHeight:1.8,whiteSpace:'pre-wrap',wordBreak:'break-all',fontFamily:'inherit'}}>{resp.example}</pre>
          </div>}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  // ── settings (persisted) ─────────────────────────────────────────────────
  const [settings,setSettings]=useState(()=>LS.get('cm_settings',{username:'dev',theme:'dark',sound:true,fontSize:15,showGhost:true}))
  const C=THEMES[settings.theme]||THEMES.dark

  // ── firebase ─────────────────────────────────────────────────────────────
  const [uid,setUid]=useState(null)
  const [fbLeaderboard,setFbLeaderboard]=useState([])
  const [communitySnips,setCommunitySnips]=useState([])

  useEffect(()=>{
    signInAnon().then(u=>{ if(u){ setUid(u.uid); loadUserProfile(u.uid).then(profile=>{ if(profile){ setXp(profile.xp||0); setBest(profile.bestWpm||0); setStreak(profile.streak||0); setUnlocked(profile.achievements||[]); setLangStats(profile.langStats||{}); setWpmH(profile.wpmHistory||[])} }) }})
    const unsub=subscribeLeaderboard(20,rows=>setFbLeaderboard(rows))
    getCommunitySnippets().then(snips=>setCommunitySnips(snips.map((s,i)=>({...s,id:10000+i}))))
    return()=>unsub()
  },[])

  // ── snippets ──────────────────────────────────────────────────────────────
  const [customSnips,setCustomSnips]=useState(()=>LS.get('cm_custom_snips',[]))
  const allSnips=useMemo(()=>[...BUILTIN_SNIPS,...customSnips,...communitySnips],[customSnips,communitySnips])

  // ── game state ────────────────────────────────────────────────────────────
  const [tab,setTab]=useState('race')
  const [si,setSi]=useState(0)
  const [typed,setTyped]=useState('')
  const [gs,setGs]=useState('ready')
  const [errs,setErrs]=useState(0)
  const [wpmH,setWpmH]=useState(()=>LS.get('cm_wpmH',[]))
  const [liveWpm,setLiveWpm]=useState(0)
  const [combo,setCombo]=useState(0),[maxC,setMaxC]=useState(0)
  const [kHeat,setKHeat]=useState({}),[kErr,setKErr]=useState({})
  const [sessions,setSessions]=useState(()=>LS.get('cm_sessions',0))
  const [best,setBest]=useState(()=>LS.get('cm_best',0))
  const [xp,setXp]=useState(()=>LS.get('cm_xp',0))
  const [streak,setStreak]=useState(()=>LS.get('cm_streak',0))
  const [bossWins,setBossWins]=useState(()=>LS.get('cm_bossWins',0))
  const [hardDone,setHardDone]=useState(()=>LS.get('cm_hardDone',0))
  const [perfect,setPerfect]=useState(()=>LS.get('cm_perfect',0))
  const [customCreated,setCustomCreated]=useState(()=>LS.get('cm_customCreated',0))
  const [timedBest,setTimedBest]=useState(()=>LS.get('cm_timedBest',0))
  const [maxComboEver,setMaxComboEver]=useState(()=>LS.get('cm_maxCombo',0))
  const [langsUsed,setLangsUsed]=useState(()=>new Set(LS.get('cm_langs',[])))
  const [langStats,setLangStats]=useState(()=>LS.get('cm_langStats',{}))
  const [unlocked,setUnlocked]=useState(()=>LS.get('cm_unlocked',[]))
  const [newAch,setNewAch]=useState(null)
  const [lf,setLf]=useState('ALL'),[df,setDf]=useState('ALL')
  const [bgFlash,setBgFlash]=useState('idle')
  const [comboAnim,setComboAnim]=useState(false)
  const [toast,setToast]=useState(null)
  const [showLesson,setShowLesson]=useState(false)
  const [showCard,setShowCard]=useState(false)
  const [showCustom,setShowCustom]=useState(false)
  const [rhythmEvents,setRhythmEvents]=useState([])
  const [bossActive,setBossActive]=useState(false)
  const [timedActive,setTimedActive]=useState(false)
  const [statsTab,setStatsTab]=useState('overview')
  const [finalWpm,setFinalWpm]=useState(0),[finalAcc,setFinalAcc]=useState(100),[finalCombo,setFinalCombo]=useState(0)
  const [aiPeerProgs,setAiPeerProgs]=useState(AI_PEERS.map(()=>0))

  const ref=useRef(null),wRef=useRef(null),stRef=useRef(null),tRef=useRef(''),evRef=useRef([]),peerRef=useRef(null)

  const snip=allSnips[si]||BUILTIN_SNIPS[0],target=snip.code,lm=LM[snip.lang]||LM.CUSTOM
  const filtered=useMemo(()=>allSnips.filter(s=>(lf==='ALL'||s.lang===lf)&&(df==='ALL'||s.diff===df)),[allSnips,lf,df])

  // ── persist to localStorage ───────────────────────────────────────────────
  useEffect(()=>{LS.set('cm_settings',settings)},[settings])
  useEffect(()=>{LS.set('cm_wpmH',wpmH.slice(-100))},[wpmH])
  useEffect(()=>{LS.set('cm_sessions',sessions);LS.set('cm_best',best);LS.set('cm_xp',xp);LS.set('cm_streak',streak);LS.set('cm_bossWins',bossWins);LS.set('cm_hardDone',hardDone);LS.set('cm_perfect',perfect);LS.set('cm_maxCombo',maxComboEver);LS.set('cm_langs',[...langsUsed]);LS.set('cm_unlocked',unlocked);LS.set('cm_langStats',langStats);LS.set('cm_customCreated',customCreated);LS.set('cm_timedBest',timedBest)},[sessions,best,xp,streak,bossWins,hardDone,perfect,maxComboEver,langsUsed,unlocked,langStats,customCreated,timedBest])
  useEffect(()=>{LS.set('cm_custom_snips',customSnips)},[customSnips])

  // ── sync to firebase ──────────────────────────────────────────────────────
  useEffect(()=>{
    if(!uid||!sessions) return
    saveUserProfile(uid,{xp,bestWpm:best,streak,achievements:unlocked,langStats,wpmHistory:wpmH.slice(-50)})
  },[sessions])

  // ── helpers ───────────────────────────────────────────────────────────────
  function pick(pool){const arr=pool||filtered;if(!arr.length)return;setSi(allSnips.indexOf(arr[Math.floor(Math.random()*arr.length)]));reset()}
  function reset(){setTyped('');tRef.current='';evRef.current=[];setGs('ready');stRef.current=null;setLiveWpm(0);setCombo(0);setErrs(0);setShowLesson(false);setShowCard(false);setShowCustom(false);setAiPeerProgs(AI_PEERS.map(()=>0));clearInterval(wRef.current);clearInterval(peerRef.current)}
  function flashBg(t){setBgFlash(t);setTimeout(()=>setBgFlash('idle'),160)}
  function showToast(m,c){setToast({m,c})}

  function checkAchievements(stats){
    const toUnlock=ACHIEVEMENTS.filter(a=>!unlocked.includes(a.id)&&a.cond(stats))
    if(!toUnlock.length) return
    setUnlocked(u=>[...u,...toUnlock.map(a=>a.id)])
    setNewAch(toUnlock[0])
    if(settings.sound) SFX.achieve()
    showToast(`🏅 ${toUnlock[0].label} unlocked!`,C.pu)
    setTimeout(()=>setNewAch(null),3000)
  }

  // ── keyboard ──────────────────────────────────────────────────────────────
  const handleKey=useCallback(e=>{
    if(bossActive||timedActive||tab==='settings'||tab==='timed') return
    if(tab!=='race') return
    if(gs==='done'&&(e.key==='Tab'||e.key==='Enter')){e.preventDefault();pick();return}
    if(e.key==='Tab'){e.preventDefault();pick();return}
    if(e.key.length!==1&&e.key!=='Backspace') return
    e.preventDefault()
    if(e.key==='Backspace'){
      if(tRef.current.length>0){evRef.current.push({type:'backspace',t:Date.now()});tRef.current=tRef.current.slice(0,-1);setTyped(tRef.current);setCombo(0)}
      return
    }
    const now=Date.now()
    if(gs==='ready'){
      stRef.current=now;setGs('playing')
      wRef.current=setInterval(()=>{if(!stRef.current)return;const w=Math.round((tRef.current.length/5)/((Date.now()-stRef.current)/60000));setLiveWpm(w);setWpmH(h=>[...h.slice(-80),w])},700)
      if(settings.showGhost) peerRef.current=setInterval(()=>{if(!stRef.current)return;const el=(Date.now()-stRef.current)/1000;setAiPeerProgs(AI_PEERS.map(p=>Math.min(1,(p.wpm*5/60*el)/Math.max(target.length,1))))},100)
    }
    const correct=e.key===target[tRef.current.length],k=e.key.toLowerCase()
    evRef.current.push({type:correct?'keystroke':'error',char:e.key,t:now})
    if(correct){
      tRef.current+=e.key;setTyped(tRef.current)
      if(settings.sound) SFX.keyCorrect()
      setCombo(c=>{const nc=c+1;setMaxC(m=>{if(nc>m){setMaxComboEver(me=>Math.max(me,nc));return nc}return m});if(nc%10===0&&nc>0){setComboAnim(true);setTimeout(()=>setComboAnim(false),500);if(settings.sound)SFX.combo10()};return nc})
      if(ALLK.includes(k)) setKHeat(h=>({...h,[k]:(h[k]||0)+1}))
      flashBg('good')
      if(tRef.current.length===target.length){
        clearInterval(wRef.current);clearInterval(peerRef.current)
        const fw=Math.round((tRef.current.length/5)/((Date.now()-stRef.current)/60000))
        const fa=Math.round((tRef.current.length/(tRef.current.length+errs))*100)
        setLiveWpm(fw);setFinalWpm(fw);setFinalAcc(fa);setFinalCombo(maxC)
        setWpmH(h=>[...h,fw]);setBest(b=>Math.max(b,fw))
        const ns=sessions+1;setSessions(ns);setStreak(s=>s+1)
        const mul=snip.diff==='hard'?1.5:snip.diff==='medium'?1.2:1
        const earned=Math.round(snip.xp*(fa/100)*mul*Math.max(1,fw/40))
        const nx=xp+earned;setXp(nx)
        if(fa===100)setPerfect(p=>p+1)
        if(snip.diff==='hard')setHardDone(h=>h+1)
        const nl=new Set([...langsUsed,snip.lang]);setLangsUsed(nl)
        setLangStats(ls=>{const prev=ls[snip.lang]||{wpm:0,acc:0,count:0};return{...ls,[snip.lang]:{wpm:Math.round((prev.wpm*prev.count+fw)/(prev.count+1)),acc:Math.round((prev.acc*prev.count+fa)/(prev.count+1)),count:prev.count+1}}})
        setRhythmEvents([...evRef.current])
        setGs('done')
        if(settings.sound) SFX.snippetDone()
        showToast(`+${earned} xp  ·  ${fw} wpm`,C.yl)
        if(uid) submitScore(uid,settings.username||'dev',fw,fa,snip.lang,snip.label)
        checkAchievements({sessions:ns,best:Math.max(best,fw),perfect:fa===100?perfect+1:perfect,maxCombo:Math.max(maxComboEver,maxC),xp:nx,langs:nl.size,streak:streak+1,bossWins,hardDone:snip.diff==='hard'?hardDone+1:hardDone,customCreated,timedBest})
      }
    } else {
      setErrs(m=>m+1);setCombo(0)
      if(ALLK.includes(k)) setKErr(h=>({...h,[k]:(h[k]||0)+1}))
      if(settings.sound) SFX.keyError()
      flashBg('bad')
    }
  },[tab,gs,target,errs,sessions,snip,bossActive,timedActive,filtered,allSnips,best,xp,perfect,langsUsed,maxComboEver,maxC,streak,bossWins,hardDone,unlocked,settings,uid,communitySnips,customCreated,timedBest])

  useEffect(()=>{const el=ref.current;el?.addEventListener('keydown',handleKey);return()=>el?.removeEventListener('keydown',handleKey)},[handleKey])
  useEffect(()=>{ref.current?.focus()},[])
  useEffect(()=>()=>{clearInterval(wRef.current);clearInterval(peerRef.current)},[])

  // ── derived ───────────────────────────────────────────────────────────────
  const acc=tRef.current.length===0&&errs===0?100:Math.round((typed.length/(typed.length+errs))*100)
  const rank=getRank(liveWpm)
  const mh=Math.max(...Object.values(kHeat),1),me=Math.max(...Object.values(kErr),1)
  const xpLv=Math.floor(xp/300)+1,xpPct=((xp%300)/300)*100
  const codeBg=bgFlash==='good'?C.codeBgGood||'#001a0a':bgFlash==='bad'?C.codeBgBad||'#1f0000':C.bg
  const langs2=['ALL',...new Set(BUILTIN_SNIPS.map(s=>s.lang))]
  const diffs2=['ALL','easy','medium','hard']
  const TABS=['race','boss','timed','stats','board','badges','settings']

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div ref={ref} tabIndex={0} style={{outline:'none',background:C.bg,borderRadius:16,overflow:'hidden',border:`1px solid ${C.b}`,fontFamily:"'SF Mono','Fira Code','Cascadia Code',monospace",userSelect:'none',position:'relative'}}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}@keyframes popIn{0%{transform:scale(0.8);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}*{box-sizing:border-box}button:hover{opacity:0.82}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:${C.bg}}::-webkit-scrollbar-thumb{background:${C.b2};border-radius:2px}`}</style>
      {toast&&<Toast msg={toast.m} color={toast.c} onDone={()=>setToast(null)}/>}

      {/* ── TOP BAR ── */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 20px',borderBottom:`1px solid ${C.b}`,background:C.bg2}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:gs==='playing'?C.gr:gs==='done'?C.bl:C.t3,transition:'background 0.3s'}}/>
          <span style={{color:C.t,fontWeight:700,fontSize:15,letterSpacing:'-0.03em'}}>code<span style={{color:C.bl}}>master</span></span>
          {streak>0&&<span style={{fontSize:10,color:C.or,background:C.or+'18',border:`1px solid ${C.or}44`,padding:'1px 8px',borderRadius:4}}>🔥 {streak} streak</span>}
          {uid&&<span style={{fontSize:9,color:C.te,background:C.te+'14',padding:'1px 6px',borderRadius:3,border:`1px solid ${C.te}33`}}>● live</span>}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{color:C.t3,fontSize:10}}>@{settings.username||'dev'}</span>
          <ProgressRing pct={xpPct} size={40} stroke={3} color={C.bl} label={`lv${xpLv}`}/>
          <div style={{padding:'3px 10px',borderRadius:5,background:rank.c+'22',border:`1px solid ${rank.c}44`,color:rank.c,fontSize:10,fontWeight:700}}>{rank.l}</div>
          <span style={{color:C.t3,fontSize:10}}>{xp} xp</span>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{display:'flex',borderBottom:`1px solid ${C.b}`,background:C.bg,overflowX:'auto'}}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>{setTab(t);if(t==='race')reset()}}
            style={{flex:'0 0 auto',padding:'8px 14px',fontSize:10,background:'transparent',border:'none',cursor:'pointer',transition:'color 0.15s',fontFamily:'inherit',color:tab===t?(t==='boss'?C.rd:t==='timed'?C.yl:C.bl):C.t3,borderBottom:`2px solid ${tab===t?(t==='boss'?C.rd:t==='timed'?C.yl:C.bl):'transparent'}`,whiteSpace:'nowrap'}}>
            {t==='boss'?'💀 boss':t==='timed'?'⏱ timed':t==='badges'?'🏅 badges':t==='board'?'🏆 scores':t==='settings'?'⚙️ settings':t}
          </button>
        ))}
      </div>

      {/* ══ RACE ══ */}
      {tab==='race'&&!bossActive&&!timedActive&&<>
        {/* filters */}
        <div style={{display:'flex',alignItems:'center',gap:5,padding:'7px 18px',borderBottom:`1px solid ${C.b}`,flexWrap:'wrap'}}>
          {langs2.map(l=>{const ac=lf===l,lm2=LM[l];return<button key={l} onClick={()=>{setLf(l);pick(allSnips.filter(s=>(l==='ALL'||s.lang===l)&&(df==='ALL'||s.diff===df)))}} style={{padding:'2px 8px',borderRadius:4,fontSize:9,cursor:'pointer',border:`1px solid ${ac?(lm2?.c||C.bl)+'88':C.b}`,background:ac?(lm2?.c||C.bl)+'18':'transparent',color:ac?(lm2?.c||C.bl):C.t2}}>{l}</button>})}
          <span style={{color:C.b2,margin:'0 4px'}}>│</span>
          {diffs2.map(d=>{const ac=df===d;return<button key={d} onClick={()=>{setDf(d);pick(allSnips.filter(s=>(lf==='ALL'||s.lang===lf)&&(d==='ALL'||s.diff===d)))}} style={{padding:'2px 8px',borderRadius:4,fontSize:9,cursor:'pointer',border:`1px solid ${ac?(DC[d]||C.t2)+'88':C.b}`,background:ac?(DC[d]||C.t2)+'18':'transparent',color:ac?(DC[d]||C.t2):C.t2}}>{d}</button>})}
          <div style={{marginLeft:'auto',display:'flex',gap:5}}>
            <button onClick={()=>setShowCustom(s=>!s)} style={{padding:'2px 8px',borderRadius:4,fontSize:9,border:`1px solid ${C.or}66`,background:showCustom?C.or+'18':'transparent',color:C.or,cursor:'pointer'}}>+ custom</button>
            <button onClick={()=>pick()} style={{padding:'2px 8px',borderRadius:4,fontSize:9,border:`1px solid ${C.b2}`,background:C.bg3,color:C.t2,cursor:'pointer'}}>↺ skip</button>
          </div>
        </div>
        {showCustom&&<CustomCreator onAdd={s=>{setCustomSnips(c=>[...c,s]);setSi(allSnips.length);setCustomCreated(n=>n+1);LS.set('cm_customCreated',customCreated+1);reset();setShowCustom(false)}} onClose={()=>setShowCustom(false)} uid={uid} C={C}/>}

        {/* snippet label */}
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 18px',borderBottom:`1px solid ${C.b}`,background:lm.bg+'55'}}>
          <Tag label={snip.lang} color={lm.c}/>
          <span style={{color:C.t,fontSize:13,fontWeight:600}}>{snip.label}</span>
          {snip.custom&&<span style={{fontSize:8,color:C.or,background:C.or+'14',padding:'0 4px',borderRadius:2,border:`1px solid ${C.or}44`}}>custom</span>}
          <span style={{color:C.t3}}>·</span>
          <Tag label={snip.diff} color={DC[snip.diff]||C.t2}/>
          <span style={{marginLeft:'auto',color:C.t3,fontSize:10}}>{snip.xp} xp · {typed.length}/{target.length}</span>
        </div>

        {/* ghost race */}
        {settings.showGhost&&<div style={{padding:'8px 18px',borderBottom:`1px solid ${C.b}`,background:C.bg2}}>
          <div style={{color:C.t3,fontSize:9,marginBottom:7,textTransform:'uppercase',letterSpacing:'0.07em'}}>live race</div>
          {[{name:'you',color:C.bl,prog:typed.length/Math.max(target.length,1),wpm:liveWpm,isYou:true},...AI_PEERS.map((p,i)=>({name:p.name,color:p.color,prog:aiPeerProgs[i],wpm:p.wpm,isYou:false}))].map(r=>(
            <div key={r.name} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
              <div style={{width:24,height:24,borderRadius:'50%',background:r.color+'22',border:`1.5px solid ${r.color}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:r.color,fontWeight:700}}>{r.name[0].toUpperCase()}</div>
              <span style={{fontSize:9,color:r.isYou?r.color:C.t2,fontWeight:r.isYou?700:400,width:84,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{r.name}</span>
              <div style={{flex:1,height:5,background:C.bg3,borderRadius:2,overflow:'hidden'}}>
                <div style={{width:`${Math.min(100,r.prog*100)}%`,height:'100%',background:r.prog>=1?C.gr:r.color,borderRadius:2,transition:r.isYou?'none':'width 0.2s'}}/>
              </div>
              <span style={{fontSize:9,color:r.prog>=1?C.gr:C.t3,width:44,textAlign:'right'}}>{r.prog>=1?'✓ done':Math.round(r.prog*100)+'%'}</span>
            </div>
          ))}
        </div>}

        {/* code area */}
        <div style={{padding:'18px 22px',minHeight:96,position:'relative',background:codeBg,transition:'background 0.15s'}}>
          {gs==='ready'&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}>
            <div style={{textAlign:'center'}}>
              <div style={{color:C.bl,fontSize:13,marginBottom:6}}>start typing to begin</div>
              <div style={{color:C.t3,fontSize:10,display:'flex',gap:8,alignItems:'center',justifyContent:'center'}}><Kbd c="Tab" C={C}/> skip · <Kbd c="↩" C={C}/> next after done</div>
            </div>
          </div>}
          <div style={{fontSize:settings.fontSize||15,lineHeight:2.15,letterSpacing:'0.02em',whiteSpace:'pre-wrap',wordBreak:'break-all'}}>
            {target.split('').map((ch,i)=>{
              let color,bg='transparent'
              if(i<typed.length){color=typed[i]===ch?C.gr:C.rd;if(typed[i]!==ch)bg='#f8514912'}
              else if(i===typed.length&&gs==='playing'){color=C.t;bg='#58a6ff28'}
              else color=C.t3
              return <span key={i} style={{color,background:bg,borderRadius:2}}>{ch==='\n'?'↵\n':ch}</span>
            })}
          </div>
        </div>

        {/* live stats */}
        <div style={{display:'flex',alignItems:'stretch',borderTop:`1px solid ${C.b}`,borderBottom:`1px solid ${C.b}`,background:C.bg2}}>
          {[{l:'wpm',v:gs==='ready'?'—':liveWpm,c:C.bl},{l:'acc',v:gs==='ready'?'—':acc+'%',c:acc>=95?C.gr:acc>=80?C.yl:C.rd},{l:'combo',v:combo+'×',c:combo>=20?C.pu:combo>=10?C.yl:C.t2},{l:'best ×',v:maxC+'×',c:C.t2},{l:'errors',v:errs,c:errs>0?C.rd:C.gr}].map((s,i)=>(
            <div key={i} style={{flex:1,padding:'9px 6px',textAlign:'center',borderRight:i<4?`1px solid ${C.b}`:'none'}}>
              <div style={{color:C.t3,fontSize:9,marginBottom:3}}>{s.l}</div>
              <div style={{color:s.c,fontSize:17,fontWeight:600,transition:'all 0.2s',transform:s.l==='combo'&&comboAnim?'scale(1.5)':'scale(1)'}}>{s.v}</div>
            </div>
          ))}
          <div style={{flex:'0 0 120px',padding:'7px 12px',borderLeft:`1px solid ${C.b}`,display:'flex',flexDirection:'column',justifyContent:'center'}}>
            <div style={{color:C.t3,fontSize:9,marginBottom:4}}>wpm</div>
            <SparkLine data={wpmH} color={C.bl} width={96} height={26}/>
          </div>
        </div>

        {/* done panel */}
        {gs==='done'&&<div style={{padding:'14px 20px',background:C.bg,borderBottom:`1px solid ${C.b}`}}>
          <div style={{display:'flex',gap:18,flexWrap:'wrap',alignItems:'flex-start'}}>
            <div style={{flex:1,minWidth:160}}>
              <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:4}}>
                <span style={{color:rank.c,fontSize:28,fontWeight:700}}>{finalWpm}</span>
                <span style={{color:C.t2,fontSize:13}}>wpm</span>
                <span style={{color:C.t2,fontSize:11}}>{finalAcc}% · {errs} err · {maxC}× combo</span>
              </div>
              <div style={{color:C.t3,fontSize:10,marginBottom:10}}>rank: <span style={{color:rank.c,fontWeight:600}}>{rank.l}</span></div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                <button onClick={()=>pick()} style={{padding:'5px 14px',borderRadius:5,fontSize:11,border:`1px solid ${C.bl}88`,background:C.bl+'14',color:C.bl,cursor:'pointer'}}>↺ next</button>
                <button onClick={reset} style={{padding:'5px 14px',borderRadius:5,fontSize:11,border:`1px solid ${C.b2}`,background:'transparent',color:C.t2,cursor:'pointer'}}>retry</button>
                <button onClick={()=>setShowLesson(l=>!l)} style={{padding:'5px 14px',borderRadius:5,fontSize:11,cursor:'pointer',border:`1px solid ${showLesson?C.cy:C.b2}`,background:showLesson?C.cy+'18':'transparent',color:showLesson?C.cy:C.t2}}>AI lesson</button>
                <button onClick={()=>setShowCard(s=>!s)} style={{padding:'5px 14px',borderRadius:5,fontSize:11,cursor:'pointer',border:`1px solid ${showCard?C.pi:C.b2}`,background:showCard?C.pi+'18':'transparent',color:showCard?C.pi:C.t2}}>share</button>
              </div>
            </div>
            <div style={{display:'flex',gap:12}}>
              {[{l:'sessions',v:sessions,c:C.t},{l:'best',v:best,c:C.yl},{l:'xp',v:xp,c:C.pu},{l:'streak',v:streak,c:C.or}].map(s=>(
                <div key={s.l} style={{textAlign:'center'}}><div style={{color:C.t3,fontSize:9}}>{s.l}</div><div style={{color:s.c,fontSize:19,fontWeight:700}}>{s.v}</div></div>
              ))}
            </div>
            <div><div style={{color:C.t3,fontSize:9,marginBottom:4}}>session wpm</div><SparkLine data={wpmH} color={C.bl} width={140} height={46}/></div>
          </div>
        </div>}
        {showLesson&&gs==='done'&&<AILesson snippet={snip} onClose={()=>setShowLesson(false)} C={C}/>}
        {showCard&&gs==='done'&&<ScoreCard snippet={snip} wpm={finalWpm} accuracy={finalAcc} rank={rank} xp={xp} combo={finalCombo} username={settings.username} theme={settings.theme} C={C} onClose={()=>setShowCard(false)}/>}

        {/* heatmap */}
        <div style={{padding:'10px 18px',background:C.bg,borderTop:`1px solid ${C.b}`}}>
          <div style={{display:'flex',alignItems:'center',marginBottom:8}}>
            <span style={{color:C.t3,fontSize:9,textTransform:'uppercase',letterSpacing:'0.07em'}}>keyboard heatmap</span>
            <div style={{marginLeft:'auto',display:'flex',gap:10}}>
              {[{c:'#58a6ff55',l:'hits'},{c:'#f8514444',l:'errors'}].map(s=>(
                <span key={s.l} style={{display:'flex',alignItems:'center',gap:4,fontSize:9,color:C.t3}}>
                  <span style={{width:8,height:8,borderRadius:2,background:s.c,display:'inline-block'}}/>{s.l}
                </span>
              ))}
            </div>
          </div>
          {KROWS.map((row,ri)=>(
            <div key={ri} style={{display:'flex',gap:3,marginBottom:3,paddingLeft:ri*10}}>
              {row.map(ch=><HeatKey key={ch} ch={ch} heat={kHeat[ch]||0} maxHeat={mh} errHeat={kErr[ch]||0} maxErr={me} C={C}/>)}
            </div>
          ))}
          <div style={{display:'flex',gap:3,marginTop:4}}>
            <div style={{width:44,height:26,borderRadius:4,background:C.bg3,border:`1px solid ${C.b}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:C.t3}}>⌫</div>
            <div style={{width:118,height:26,borderRadius:4,background:C.bg3,border:`1px solid ${C.b}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:C.t3}}>space</div>
          </div>
        </div>

        {/* snippet library */}
        <div style={{borderTop:`1px solid ${C.b}`,background:C.bg2,padding:'10px 16px'}}>
          <div style={{color:C.t3,fontSize:9,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.07em'}}>library — {filtered.length} snippets {customSnips.length>0?`(${customSnips.length} custom)`:''}</div>
          <div style={{display:'flex',flexDirection:'column',gap:3,maxHeight:134,overflowY:'auto'}}>
            {filtered.map(s=>{const slm=LM[s.lang]||LM.JS,active=allSnips.indexOf(s)===si;return(
              <div key={s.id} onClick={()=>{setSi(allSnips.indexOf(s));reset()}} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 8px',borderRadius:5,cursor:'pointer',transition:'all 0.1s',background:active?C.bg3:'transparent',border:`1px solid ${active?C.b2:'transparent'}`}}>
                <span style={{fontSize:9,fontWeight:700,color:slm.c,width:26,textAlign:'center'}}>{s.lang}</span>
                <span style={{flex:1,color:active?C.t:C.t2,fontSize:11}}>{s.label}</span>
                {s.custom&&<span style={{fontSize:7,color:C.or,background:C.or+'18',padding:'0 3px',borderRadius:2}}>custom</span>}
                <span style={{fontSize:9,color:DC[s.diff]||C.t2}}>{s.diff}</span>
                <span style={{fontSize:9,color:C.yl}}>{s.xp}xp</span>
                <span style={{fontSize:9,color:C.t3,maxWidth:170,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{s.code.replace(/\n/g,' ').slice(0,30)}…</span>
                {active&&<span style={{fontSize:9,color:C.bl}}>●</span>}
              </div>
            )})}
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 18px',borderTop:`1px solid ${C.b}`,background:C.bg}}>
          <div style={{display:'flex',gap:10,fontSize:10,color:C.t3}}><span><Kbd c="Tab" C={C}/> skip</span><span><Kbd c="⌫" C={C}/> back</span><span><Kbd c="↩" C={C}/> next after done</span></div>
          <span style={{color:C.b3,fontSize:9}}>codemaster · v2.0</span>
        </div>
      </>}

      {/* ══ BOSS ══ */}
      {tab==='boss'&&(bossActive
        ?<BossMode snips={allSnips.filter(s=>s.diff!=='easy')} onDone={r=>{setBossActive(false);setBest(b=>Math.max(b,r.wpm));setSessions(s=>s+1);if(r.survived)setBossWins(w=>w+1);if(settings.sound)SFX.bossDone();showToast(`boss: ${r.wpm} wpm · ${r.done} snippets`,C.rd)}} C={C} sfx={settings.sound}/>
        :<div style={{padding:'36px 24px',textAlign:'center'}}>
          <div style={{fontSize:40,marginBottom:10}}>💀</div>
          <div style={{color:C.rd,fontSize:18,fontWeight:700,marginBottom:6}}>Boss Mode</div>
          <div style={{color:C.t2,fontSize:12,lineHeight:1.9,marginBottom:20}}>120 seconds · hard + medium snippets<br/>no backspace · 3 lives · one wrong key costs a life</div>
          <button onClick={()=>setBossActive(true)} style={{padding:'10px 28px',borderRadius:8,fontSize:13,border:`1px solid ${C.rd}88`,background:C.rd+'18',color:C.rd,cursor:'pointer'}}>enter boss mode</button>
        </div>
      )}

      {/* ══ TIMED ══ */}
      {tab==='timed'&&(timedActive
        ?<TimedMode snippets={filtered.length?filtered:allSnips} duration={60} onDone={r=>{setTimedActive(false);setBest(b=>Math.max(b,r.wpm));setSessions(s=>s+1);setTimedBest(b=>Math.max(b,r.wpm));showToast(`timed: ${r.wpm} wpm peak · ${r.done} snippets`,C.yl)}} C={C} sfx={settings.sound}/>
        :<div style={{padding:'36px 24px',textAlign:'center'}}>
          <div style={{fontSize:40,marginBottom:10}}>⏱</div>
          <div style={{color:C.yl,fontSize:18,fontWeight:700,marginBottom:6}}>Timed Challenge</div>
          <div style={{color:C.t2,fontSize:12,lineHeight:1.9,marginBottom:20}}>60 seconds · type as many snippets as possible<br/>backspace allowed · accuracy still counts</div>
          {timedBest>0&&<div style={{color:C.t3,fontSize:11,marginBottom:12}}>your best: <span style={{color:C.yl,fontWeight:600}}>{timedBest} wpm</span></div>}
          <button onClick={()=>setTimedActive(true)} style={{padding:'10px 28px',borderRadius:8,fontSize:13,border:`1px solid ${C.yl}88`,background:C.yl+'18',color:C.yl,cursor:'pointer'}}>start 60s challenge</button>
        </div>
      )}

      {/* ══ STATS ══ */}
      {tab==='stats'&&<div style={{padding:'14px 18px'}}>
        <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
          {[{l:'sessions',v:sessions,c:C.t},{l:'best wpm',v:best,c:C.yl},{l:'total xp',v:xp,c:C.pu},{l:'streak',v:streak,c:C.or}].map(s=>(
            <div key={s.l} style={{background:C.bg3,borderRadius:8,padding:'12px 14px',border:`1px solid ${C.b}`,flex:1,minWidth:80}}>
              <div style={{color:C.t3,fontSize:9,marginBottom:4,textTransform:'uppercase',letterSpacing:'0.07em'}}>{s.l}</div>
              <div style={{color:s.c,fontSize:22,fontWeight:700,lineHeight:1}}>{s.v}</div>
            </div>
          ))}
        </div>
        <div style={{display:'flex',gap:6,marginBottom:12,flexWrap:'wrap'}}>
          {['overview','rhythm','prediction','langs'].map(t=>(
            <button key={t} onClick={()=>setStatsTab(t)} style={{padding:'4px 12px',borderRadius:4,fontSize:10,cursor:'pointer',border:`1px solid ${statsTab===t?C.bl+'88':C.b}`,background:statsTab===t?C.bl+'14':'transparent',color:statsTab===t?C.bl:C.t2}}>{t}</button>
          ))}
        </div>
        <div style={{background:C.bg2,border:`1px solid ${C.b}`,borderRadius:8,padding:'14px 16px'}}>
          {statsTab==='overview'&&<>
            <div style={{color:C.t3,fontSize:9,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.07em'}}>wpm history</div>
            <SparkLine data={wpmH} color={C.bl} width={580} height={80}/>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:14}}>
              {[{l:'boss wins',v:bossWins,c:C.rd},{l:'max combo',v:maxComboEver+'×',c:C.pu},{l:'langs used',v:langsUsed.size,c:C.or},{l:'perfect runs',v:perfect,c:C.te},{l:'hard done',v:hardDone,c:C.rd},{l:'timed best',v:timedBest,c:C.yl}].map(s=>(
                <div key={s.l} style={{textAlign:'center',padding:'8px 10px',background:C.bg3,borderRadius:6,border:`1px solid ${C.b}`}}>
                  <div style={{color:C.t3,fontSize:9}}>{s.l}</div>
                  <div style={{color:s.c,fontSize:18,fontWeight:700}}>{s.v}</div>
                </div>
              ))}
            </div>
          </>}
          {statsTab==='rhythm'&&<><div style={{color:C.t3,fontSize:9,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.07em'}}>typing rhythm</div><RhythmViz events={rhythmEvents} C={C}/></>}
          {statsTab==='prediction'&&<><div style={{color:C.t3,fontSize:9,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.07em'}}>wpm prediction</div><WpmPredict history={wpmH} C={C}/></>}
          {statsTab==='langs'&&<><div style={{color:C.t3,fontSize:9,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.07em'}}>per-language breakdown</div><LangChart langStats={langStats} C={C}/></>}
        </div>
      </div>}

      {/* ══ LEADERBOARD ══ */}
      {tab==='board'&&<div style={{padding:'14px 18px'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
          <div style={{color:C.t3,fontSize:9,textTransform:'uppercase',letterSpacing:'0.07em'}}>global leaderboard</div>
          {uid&&<span style={{fontSize:9,color:C.te,background:C.te+'14',padding:'1px 5px',borderRadius:3,border:`1px solid ${C.te}33`}}>● live firebase</span>}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          {(fbLeaderboard.length?fbLeaderboard:[{username:'DevGuru',wpm:112,accuracy:97,lang:'RUST'},{username:'Carol',wpm:78,accuracy:94,lang:'GO'},{username:'Alice',wpm:54,accuracy:91,lang:'TS'}]).map((e,i)=>{
            const isYou=e.username===settings.username||e.n===settings.username,medals=['🥇','🥈','🥉']
            const name=e.username||e.n,w=e.wpm||e.w,a=e.accuracy||e.a,l=e.lang||e.l
            return (
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderRadius:7,background:isYou?C.bl+'14':i===0?C.yl+'0d':C.bg3,border:`1px solid ${isYou?C.bl+'55':i===0?C.yl+'33':C.b}`}}>
                <span style={{fontSize:14,width:22,textAlign:'center'}}>{i<3?medals[i]:<span style={{color:C.t3,fontSize:11}}>#{i+1}</span>}</span>
                <div style={{width:26,height:26,borderRadius:'50%',background:isYou?C.bl+'33':C.bg4,border:`1px solid ${isYou?C.bl:C.b2}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:isYou?C.bl:C.t2,fontWeight:700}}>{(name||'?')[0].toUpperCase()}</div>
                <span style={{flex:1,color:isYou?C.bl:i<3?C.t:C.t2,fontWeight:isYou?700:400,fontSize:12}}>{name}</span>
                <span style={{color:C.t3,fontSize:9,marginRight:6}}>{l}</span>
                <span style={{color:C.t2,fontSize:10,marginRight:8}}>{a}%</span>
                <span style={{color:i===0?C.yl:isYou?C.bl:C.t,fontSize:18,fontWeight:700}}>{w}</span>
                <span style={{color:C.t3,fontSize:9}}>wpm</span>
              </div>
            )
          })}
        </div>
      </div>}

      {/* ══ BADGES ══ */}
      {tab==='badges'&&<div style={{padding:'14px 18px'}}>
        <div style={{display:'flex',gap:10,marginBottom:14}}>
          <div style={{background:C.bg3,borderRadius:7,padding:'10px 16px',border:`1px solid ${C.b}`,textAlign:'center'}}>
            <div style={{color:C.t3,fontSize:9}}>unlocked</div>
            <div style={{color:C.pu,fontSize:22,fontWeight:700}}>{unlocked.length}/{ACHIEVEMENTS.length}</div>
          </div>
          <div style={{flex:1,background:C.bg2,borderRadius:7,padding:'10px 14px',border:`1px solid ${C.b}`,display:'flex',flexDirection:'column',justifyContent:'center'}}>
            <div style={{height:6,background:C.bg3,borderRadius:3,overflow:'hidden',marginBottom:6}}>
              <div style={{width:`${Math.round((unlocked.length/ACHIEVEMENTS.length)*100)}%`,height:'100%',background:C.pu,borderRadius:3,transition:'width 0.5s'}}/>
            </div>
            <div style={{color:C.t2,fontSize:11}}>{Math.round((unlocked.length/ACHIEVEMENTS.length)*100)}% complete · {xp} total xp</div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:6}}>
          {ACHIEVEMENTS.map(a=>{const done=unlocked.includes(a.id);return(
            <div key={a.id} title={`${a.label}: ${a.desc}`} style={{padding:'10px 6px',borderRadius:7,textAlign:'center',cursor:'default',transition:'all 0.3s',background:done?C.bg3:'transparent',border:`1px solid ${done?C.b2:C.b}`,opacity:done?1:0.28,animation:newAch?.id===a.id?'popIn 0.5s ease forwards':''}}>
              <div style={{fontSize:20,marginBottom:5}}>{a.icon}</div>
              <div style={{fontSize:9,color:done?C.t:C.t3,lineHeight:1.3}}>{a.label}</div>
            </div>
          )})}
        </div>
        {newAch&&<div style={{marginTop:14,padding:'12px 16px',background:C.pu+'18',border:`1px solid ${C.pu}44`,borderRadius:8,display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:28}}>{newAch.icon}</span>
          <div><div style={{color:C.pu,fontSize:13,fontWeight:600}}>{newAch.label}</div><div style={{color:C.t2,fontSize:11}}>{newAch.desc}</div></div>
        </div>}
      </div>}

      {/* ══ SETTINGS ══ */}
      {tab==='settings'&&<SettingsPanel settings={settings} onChange={s=>{setSettings(s);LS.set('cm_settings',s)}} C={C}/>}
    </div>
  )
}
