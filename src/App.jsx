// ─────────────────────────────────────────────────────────────────────────────
//  codemaster v2.0 — Developer Typing Race
//  6 AI Agents · Firebase · LocalStorage · 5 Themes · Sound · 50+ Snippets
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { THEMES } from './themes'
import { SFX } from './sounds'
import {
  signInAnon, saveUserProfile, loadUserProfile,
  submitScore, subscribeLeaderboard, saveCustomSnippet, getCommunitySnippets,
} from './firebase'
import {
  runLessonAgent, runSnippetGeneratorAgent, runCoachAgent,
  runAdaptiveBattleAgent, runErrorExplainerAgent, runSessionReviewAgent,
} from './agents'

// ── SNIPPETS ──────────────────────────────────────────────────────────────────
const BUILTIN_SNIPS = [
  {id:0, lang:'JS',  diff:'easy',  xp:80,  label:'Arrow fn',      code:`const add = (a, b) => a + b;`},
  {id:1, lang:'JS',  diff:'easy',  xp:85,  label:'Filter even',   code:`const evens = arr.filter(n => n % 2 === 0);`},
  {id:2, lang:'JS',  diff:'easy',  xp:88,  label:'Array map',     code:`const doubled = arr.map(x => x * 2);`},
  {id:3, lang:'JS',  diff:'easy',  xp:85,  label:'Spread merge',  code:`const merged = { ...defaults, ...overrides };`},
  {id:4, lang:'JS',  diff:'medium',xp:140, label:'Destructure',   code:`const { name, age = 0, ...rest } = person;`},
  {id:5, lang:'JS',  diff:'medium',xp:150, label:'Promise chain', code:`fetch(url).then(r => r.json()).then(data => render(data));`},
  {id:6, lang:'JS',  diff:'medium',xp:145, label:'Optional chain',code:`const city = user?.address?.city ?? 'Unknown';`},
  {id:7, lang:'JS',  diff:'medium',xp:155, label:'Async await',   code:`const data = await fetch(url).then(r => r.json());`},
  {id:8, lang:'JS',  diff:'hard',  xp:240, label:'Debounce',      code:`const debounce=(fn,ms)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms);}};`},
  {id:9, lang:'JS',  diff:'hard',  xp:220, label:'Curry fn',      code:`const curry=fn=>(...a)=>a.length>=fn.length?fn(...a):curry(fn.bind(null,...a));`},
  {id:10,lang:'JS',  diff:'hard',  xp:230, label:'Memoize',       code:`const memo=fn=>{const c=new Map();return(...a)=>{const k=JSON.stringify(a);return c.has(k)?c.get(k):(c.set(k,fn(...a)),c.get(k))};};`},
  {id:11,lang:'TS',  diff:'easy',  xp:90,  label:'Type alias',    code:`type Point = { x: number; y: number };`},
  {id:12,lang:'TS',  diff:'easy',  xp:95,  label:'Interface',     code:`interface User { id: number; name: string; email?: string; }`},
  {id:13,lang:'TS',  diff:'medium',xp:150, label:'Generic fn',    code:`function identity<T>(value: T): T { return value; }`},
  {id:14,lang:'TS',  diff:'medium',xp:160, label:'Union type',    code:`type Result<T> = { data: T; error: null } | { data: null; error: Error };`},
  {id:15,lang:'TS',  diff:'hard',  xp:240, label:'Mapped type',   code:`type Readonly<T> = { readonly [K in keyof T]: T[K] };`},
  {id:16,lang:'TS',  diff:'hard',  xp:235, label:'Conditional',   code:`type NonNullable<T>=T extends null|undefined?never:T;`},
  {id:17,lang:'TS',  diff:'hard',  xp:250, label:'Infer',         code:`type ReturnType<T>=T extends(...args:any[])=>infer R?R:never;`},
  {id:18,lang:'PY',  diff:'easy',  xp:80,  label:'List comp',     code:`squares = [x ** 2 for x in range(10)]`},
  {id:19,lang:'PY',  diff:'easy',  xp:85,  label:'Dict comp',     code:'word_len = {w: len(w) for w in words}'},
  {id:20,lang:'PY',  diff:'easy',  xp:80,  label:'F-string',      code:'greeting = f"Hello, {name}! You are {age} years old."'},
  {id:21,lang:'PY',  diff:'medium',xp:140, label:'Lambda sort',   code:`people.sort(key=lambda p: (p['age'], p['name']))`},
  {id:22,lang:'PY',  diff:'medium',xp:150, label:'Context mgr',   code:`with open("data.txt", "r") as f:\n    content = f.read()`},
  {id:23,lang:'PY',  diff:'hard',  xp:260, label:'Decorator',     code:`def memo(fn):\n    cache={}\n    def w(*a):\n        if a not in cache:cache[a]=fn(*a)\n        return cache[a]\n    return w`},
  {id:24,lang:'PY',  diff:'hard',  xp:250, label:'Generator',     code:`def fibonacci():\n    a,b=0,1\n    while True:\n        yield a\n        a,b=b,a+b`},
  {id:25,lang:'SQL', diff:'easy',  xp:85,  label:'Select where',  code:`SELECT name, email FROM users WHERE active = 1;`},
  {id:26,lang:'SQL', diff:'easy',  xp:90,  label:'Insert',        code:`INSERT INTO users (name, email) VALUES ('Alice', 'alice@dev.io');`},
  {id:27,lang:'SQL', diff:'medium',xp:170, label:'Group join',    code:`SELECT u.name,COUNT(o.id) FROM users u LEFT JOIN orders o ON u.id=o.user_id GROUP BY u.id;`},
  {id:28,lang:'SQL', diff:'medium',xp:165, label:'Subquery',      code:`SELECT * FROM products WHERE price > (SELECT AVG(price) FROM products);`},
  {id:29,lang:'SQL', diff:'hard',  xp:210, label:'Window fn',     code:`SELECT name,salary,RANK() OVER(PARTITION BY dept ORDER BY salary DESC) rnk FROM emp;`},
  {id:30,lang:'SQL', diff:'hard',  xp:220, label:'CTE',           code:`WITH ranked AS (SELECT *,ROW_NUMBER() OVER(ORDER BY score DESC) rn FROM scores) SELECT * FROM ranked WHERE rn<=10;`},
  {id:31,lang:'RUST',diff:'medium',xp:190, label:'Lifetime',      code:`fn longest<'a>(x:&'a str,y:&'a str)->&'a str{if x.len()>y.len(){x}else{y}}`},
  {id:32,lang:'RUST',diff:'medium',xp:185, label:'Option map',    code:`let upper = name.as_ref().map(|s| s.to_uppercase());`},
  {id:33,lang:'RUST',diff:'hard',  xp:280, label:'Trait impl',    code:`impl fmt::Display for Point{fn fmt(&self,f:&mut fmt::Formatter)->fmt::Result{write!(f,"({},{})",self.x,self.y)}}`},
  {id:34,lang:'RUST',diff:'hard',  xp:270, label:'Enum match',    code:'match result { Ok(v) => println!("Got: {}", v), Err(e) => eprintln!("Error: {}", e), }'},
  {id:35,lang:'GO',  diff:'easy',  xp:90,  label:'Goroutine',     code:`go func() { fmt.Println("running in goroutine") }()`},
  {id:36,lang:'GO',  diff:'easy',  xp:88,  label:'Err check',     code:`if err != nil { log.Fatalf("failed: %v", err) }`},
  {id:37,lang:'GO',  diff:'medium',xp:150, label:'Channel',       code:`ch:=make(chan int)\ngo func(){ch<-42}()\nval:=<-ch`},
  {id:38,lang:'GO',  diff:'medium',xp:155, label:'Defer',         code:`defer func() { if r := recover(); r != nil { log.Println(r) } }()`},
  {id:39,lang:'GO',  diff:'hard',  xp:220, label:'Interface',     code:`type Stringer interface{String() string}\nfunc Print(s Stringer){fmt.Println(s.String())}`},
  {id:40,lang:'BASH',diff:'easy',  xp:80,  label:'Find logs',     code:'find . -name "*.log" -mtime +7 -delete'},
  {id:41,lang:'BASH',diff:'easy',  xp:85,  label:'For loop',      code:'for f in *.js; do echo "Processing $f"; done'},
  {id:42,lang:'BASH',diff:'medium',xp:175, label:'Pipe chain',    code:"cat access.log|grep '404'|awk '{print $7}'|sort|uniq -c|sort -rn|head -20"},
  {id:43,lang:'BASH',diff:'medium',xp:170, label:'If check',      code:'if [ -f "$FILE" ]; then echo "exists"; else echo "missing"; fi'},
  {id:44,lang:'BASH',diff:'hard',  xp:210, label:'Parallel',      code:'for url in "${urls[@]}"; do curl -s "$url" & done; wait'},
  {id:45,lang:'CSS', diff:'easy',  xp:75,  label:'Flex center',   code:`display: flex; align-items: center; justify-content: center;`},
  {id:46,lang:'CSS', diff:'easy',  xp:78,  label:'Custom prop',   code:`:root { --primary: #58a6ff; --gap: 1rem; --radius: 8px; }`},
  {id:47,lang:'CSS', diff:'medium',xp:130, label:'Grid layout',   code:`display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;`},
  {id:48,lang:'CSS', diff:'medium',xp:135, label:'Animation',     code:`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; } }`},
  {id:49,lang:'CSS', diff:'hard',  xp:185, label:'Container q',   code:`@container sidebar (min-width: 300px) { .card { display: grid; grid-template-columns: 1fr 2fr; } }`},
]

const LM = {
  JS:    {c:'#f7df1e',bg:'#2a2700',b:'#5a4f00'},TS:{c:'#3178c6',bg:'#001a35',b:'#0a3d70'},
  PY:    {c:'#4fc3f7',bg:'#00202e',b:'#005070'},SQL:{c:'#ff9800',bg:'#2b1a00',b:'#5a3800'},
  RUST:  {c:'#f0643b',bg:'#2b0d00',b:'#5a2010'},GO:{c:'#00acd7',bg:'#00202e',b:'#004860'},
  BASH:  {c:'#85e89d',bg:'#002010',b:'#005020'},CSS:{c:'#a855f7',bg:'#1a0030',b:'#380060'},
  CUSTOM:{c:'#e6edf3',bg:'#1c2128',b:'#30363d'},
}
const DC = {easy:'#3fb950',medium:'#d29922',hard:'#f85149'}
const RANKS = [
  {min:0,  l:'Novice',    c:'#8b949e'},{min:25, l:'Apprentice',c:'#3fb950'},
  {min:45, l:'Developer', c:'#58a6ff'},{min:65, l:'Senior',    c:'#d29922'},
  {min:85, l:'Architect', c:'#f0883e'},{min:110,l:'10x Eng',   c:'#f85149'},
  {min:140,l:'Legend',    c:'#bc8cff'},
]
const getRank = w => [...RANKS].reverse().find(r => w >= r.min) || RANKS[0]
const KROWS = [['q','w','e','r','t','y','u','i','o','p'],['a','s','d','f','g','h','j','k','l',';'],['z','x','c','v','b','n','m',',','.','/'],]
const ALLK = KROWS.flat()
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
  {id:'speed', icon:'⚡',label:'Speed runner',     desc:'Timed mode above 60 wpm',       cond:s=>s.timedBest>=60},
  {id:'ai_fan',icon:'🤖',label:'AI enthusiast',   desc:'Use all 6 AI agents',           cond:s=>s.agentsUsed>=6},
]

const LS = {
  get:(k,fb)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb}catch{return fb}},
  set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}},
}

// ── TINY UI COMPONENTS ────────────────────────────────────────────────────────
function Kbd({c,C}){return <span style={{padding:'1px 6px',borderRadius:4,fontSize:10,border:`1px solid ${C.b2}`,background:C.bg3,color:C.t2}}>{c}</span>}
function Tag({label,color}){return <span style={{padding:'1px 7px',borderRadius:4,fontSize:10,fontWeight:600,color,background:color+'1a',border:`1px solid ${color}44`}}>{label}</span>}
function ProgressRing({pct,size=40,stroke=3,color,label}){
  const r=(size-stroke)/2,circ=2*Math.PI*r,off=circ-(Math.min(100,pct)/100)*circ
  return <div style={{position:'relative',width:size,height:size,display:'inline-flex',alignItems:'center',justifyContent:'center'}}>
    <svg width={size} height={size} style={{position:'absolute',transform:'rotate(-90deg)'}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#30363d" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" style={{transition:'stroke-dashoffset 0.5s ease'}}/>
    </svg>
    <span style={{fontSize:9,color,fontWeight:700,zIndex:1}}>{label}</span>
  </div>
}
function SparkLine({data,color,width=120,height=32}){
  if(data.length<2)return <svg width={width} height={height}><text x={width/2} y={height/2+4} textAnchor="middle" fill="#484f58" fontSize="10">—</text></svg>
  const max=Math.max(...data,1),pts=data.map((v,i)=>`${((i/(data.length-1))*(width-6)+3).toFixed(1)},${(height-3-((v/max)*(height-8))).toFixed(1)}`).join(' '),lp=pts.split(' ').pop().split(',')
  return <svg width={width} height={height}><polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/><circle cx={lp[0]} cy={lp[1]} r="2.5" fill={color}/></svg>
}
function Toast({msg,color,onDone}){useEffect(()=>{const t=setTimeout(onDone,2600);return()=>clearTimeout(t)},[]);return <div style={{position:'absolute',top:14,left:'50%',transform:'translateX(-50%)',background:'#1c2128',border:`1px solid ${color||'#30363d'}`,padding:'6px 18px',borderRadius:8,fontSize:11,color:color||'#e6edf3',zIndex:100,pointerEvents:'none',whiteSpace:'nowrap',boxShadow:'0 4px 24px rgba(0,0,0,0.6)'}}>{msg}</div>}
function HeatKey({ch,heat,maxHeat,errHeat,maxErr,C}){
  const hp=maxHeat>0?heat/maxHeat:0,ep=maxErr>0?errHeat/maxErr:0,hasErr=ep>0.25
  const bg=hasErr?`rgba(248,81,73,${0.12+ep*0.55})`:hp===0?C.bg3:`rgba(88,166,255,${0.1+hp*0.72})`
  return <div title={`${ch}: ${heat||0} hits · ${errHeat||0} errors`} style={{width:26,height:26,borderRadius:4,background:bg,border:`1px solid ${hasErr?'#f8514440':hp>0.3?'#58a6ff40':C.b}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:hp>0.55||hasErr?C.t:C.t3,fontWeight:500,transition:'background 0.35s',cursor:'default'}}>{ch}</div>
}
function Spinner({color}){return <span style={{display:'inline-block',width:10,height:10,borderRadius:'50%',border:`2px solid ${color}33`,borderTopColor:color,animation:'spin 0.7s linear infinite'}}/>}

// ── AI AGENT PANEL (shared wrapper) ──────────────────────────────────────────
function AgentPanel({title,icon,color,loading,err,children,onClose,C}){
  return (
    <div style={{borderTop:`1px solid ${C.b}`,padding:'14px 18px',background:C.bg}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
        <span style={{fontSize:13}}>{icon}</span>
        {loading?<Spinner color={color}/>:<div style={{width:7,height:7,borderRadius:'50%',background:err?C.rd:color}}/>}
        <span style={{color,fontSize:12,fontWeight:600}}>{title}</span>
        {loading&&<span style={{color:C.t3,fontSize:10}}>AI thinking…</span>}
        <button onClick={onClose} style={{marginLeft:'auto',padding:'2px 9px',borderRadius:4,fontSize:10,border:`1px solid ${C.b2}`,background:C.bg3,color:C.t2,cursor:'pointer'}}>✕</button>
      </div>
      {err&&<div style={{color:C.rd,fontSize:11,padding:'8px 12px',background:C.rd+'10',borderRadius:5,border:`1px solid ${C.rd}33`}}>⚠️ {err}</div>}
      {!loading&&!err&&children}
    </div>
  )
}

// ── AGENT 1: LESSON ───────────────────────────────────────────────────────────
function LessonPanel({snippet,C,onClose,onAgentUsed}){
  const [data,setData]=useState(null),[loading,setLoading]=useState(true),[err,setErr]=useState(null)
  useEffect(()=>{
    onAgentUsed('lesson')
    runLessonAgent({snippet}).then(r=>{if(r)setData(r);else setErr('AI unavailable');setLoading(false)})
  },[snippet.id])
  const lc={beginner:C.gr,intermediate:C.yl,advanced:C.rd}
  return (
    <AgentPanel title="Lesson Agent" icon="🎓" color={C.cy} loading={loading} err={err} onClose={onClose} C={C}>
      {data&&<div style={{display:'flex',flexDirection:'column',gap:8}}>
        <div style={{padding:'12px 14px',background:C.cy+'12',borderRadius:7,border:`1px solid ${C.cy}30`}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
            <span style={{color:C.cy,fontSize:12,fontWeight:700}}>{data.concept}</span>
            {data.level&&<Tag label={data.level} color={lc[data.level]||C.t2}/>}
          </div>
          <div style={{color:C.t,fontSize:12,lineHeight:1.7}}>{data.what}</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <div style={{padding:'10px 12px',background:C.bg3,borderRadius:6,border:`1px solid ${C.b}`}}>
            <div style={{color:C.t3,fontSize:8,marginBottom:4,textTransform:'uppercase',letterSpacing:'0.06em'}}>why use it</div>
            <div style={{color:C.t2,fontSize:11,lineHeight:1.6}}>{data.why}</div>
          </div>
          <div style={{padding:'10px 12px',background:C.bg3,borderRadius:6,border:`1px solid ${C.b}`}}>
            <div style={{color:C.t3,fontSize:8,marginBottom:4,textTransform:'uppercase',letterSpacing:'0.06em'}}>⚠️ watch out</div>
            <div style={{color:C.or,fontSize:11,lineHeight:1.6}}>{data.gotcha}</div>
          </div>
        </div>
        <div style={{padding:'10px 12px',background:C.bg2,borderRadius:6,border:`1px solid ${C.b}`}}>
          <div style={{color:C.t3,fontSize:8,marginBottom:4,textTransform:'uppercase',letterSpacing:'0.06em'}}>how it works</div>
          <div style={{color:C.t2,fontSize:11,lineHeight:1.7}}>{data.how}</div>
        </div>
        {data.example&&<div style={{padding:'10px 12px',background:C.bg3,borderRadius:6,border:`1px solid ${C.b}`}}>
          <div style={{color:C.t3,fontSize:8,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>related example</div>
          <pre style={{margin:0,fontSize:12,color:C.gr,lineHeight:1.8,whiteSpace:'pre-wrap',wordBreak:'break-all',fontFamily:'inherit'}}>{data.example}</pre>
        </div>}
      </div>}
    </AgentPanel>
  )
}

// ── AGENT 2: SNIPPET GENERATOR ───────────────────────────────────────────────
function SnippetGenPanel({onAdd,onClose,C,onAgentUsed}){
  const [lang,setLang]=useState('JS'),[diff,setDiff]=useState('medium'),[topic,setTopic]=useState('')
  const [loading,setLoading]=useState(false),[err,setErr]=useState(null),[preview,setPreview]=useState(null)
  async function generate(){
    setLoading(true);setErr(null);setPreview(null)
    onAgentUsed('snippetGen')
    const result=await runSnippetGeneratorAgent({lang,difficulty:diff,topic})
    if(result){setPreview(result)}else{setErr('Generation failed — try again')}
    setLoading(false)
  }
  return (
    <AgentPanel title="Snippet Generator" icon="✨" color={C.pu} loading={false} err={null} onClose={onClose} C={C}>
      <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap'}}>
        <select value={lang} onChange={e=>setLang(e.target.value)} style={{background:C.bg3,border:`1px solid ${C.b2}`,borderRadius:5,padding:'5px 8px',color:C.t,fontSize:11,fontFamily:'monospace',outline:'none'}}>
          {Object.keys(LM).filter(l=>l!=='CUSTOM').map(l=><option key={l} value={l}>{l}</option>)}
        </select>
        <select value={diff} onChange={e=>setDiff(e.target.value)} style={{background:C.bg3,border:`1px solid ${C.b2}`,borderRadius:5,padding:'5px 8px',color:DC[diff]||C.t,fontSize:11,fontFamily:'monospace',outline:'none'}}>
          {['easy','medium','hard'].map(d=><option key={d} value={d}>{d}</option>)}
        </select>
        <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="topic hint (optional)" style={{flex:1,background:C.bg3,border:`1px solid ${C.b2}`,borderRadius:5,padding:'5px 10px',color:C.t,fontSize:11,fontFamily:'monospace',outline:'none',minWidth:100}}/>
        <button onClick={generate} disabled={loading} style={{padding:'5px 16px',borderRadius:5,fontSize:11,border:`1px solid ${C.pu}88`,background:C.pu+'18',color:C.pu,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
          {loading?<><Spinner color={C.pu}/> generating…</>:'✨ generate'}
        </button>
      </div>
      {err&&<div style={{color:C.rd,fontSize:11,marginBottom:8}}>{err}</div>}
      {preview&&<div style={{padding:'12px 14px',background:C.bg2,borderRadius:7,border:`1px solid ${C.b}`,marginBottom:10}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
          <Tag label={preview.lang} color={(LM[preview.lang]||LM.CUSTOM).c}/>
          <span style={{color:C.t,fontSize:12,fontWeight:600}}>{preview.label}</span>
          <Tag label={preview.diff} color={DC[preview.diff]||C.t2}/>
          <span style={{color:C.yl,fontSize:10,marginLeft:'auto'}}>{preview.xp} xp</span>
        </div>
        <pre style={{margin:'0 0 8px 0',fontSize:13,color:C.gr,lineHeight:1.8,whiteSpace:'pre-wrap',wordBreak:'break-all',fontFamily:'inherit',padding:'8px 10px',background:C.bg3,borderRadius:5}}>{preview.code}</pre>
        {preview.explanation&&<div style={{color:C.t3,fontSize:10,fontStyle:'italic'}}>{preview.explanation}</div>}
        <button onClick={()=>{onAdd(preview);setPreview(null)}} style={{marginTop:10,padding:'5px 14px',borderRadius:5,fontSize:11,border:`1px solid ${C.gr}88`,background:C.gr+'14',color:C.gr,cursor:'pointer'}}>+ add to library</button>
      </div>}
    </AgentPanel>
  )
}

// ── AGENT 3: COACH ───────────────────────────────────────────────────────────
function CoachPanel({kHeat,kErr,wpmHistory,langStats,sessions,C,onClose,onAgentUsed}){
  const [data,setData]=useState(null),[loading,setLoading]=useState(true),[err,setErr]=useState(null)
  useEffect(()=>{
    onAgentUsed('coach')
    runCoachAgent({kHeat,kErr,wpmHistory,langStats,sessions}).then(r=>{if(r)setData(r);else setErr('Coach unavailable');setLoading(false)})
  },[])
  const gradeColor={A:C.gr,'A+':C.gr,B:C.bl,'B+':C.bl,C:C.yl,'C+':C.yl,D:C.or,F:C.rd}
  return (
    <AgentPanel title="Coach Agent" icon="🎯" color={C.or} loading={loading} err={err} onClose={onClose} C={C}>
      {data&&<div style={{display:'flex',flexDirection:'column',gap:8}}>
        <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:C.bg2,borderRadius:7,border:`1px solid ${C.b}`}}>
          <div style={{textAlign:'center',minWidth:52}}>
            <div style={{fontSize:28,fontWeight:700,color:gradeColor[data.grade]||C.or}}>{data.grade}</div>
            <div style={{color:C.t3,fontSize:8}}>grade</div>
          </div>
          <div style={{flex:1}}>
            <div style={{color:C.t,fontSize:12,lineHeight:1.6,marginBottom:4}}>{data.summary}</div>
            <div style={{color:C.t2,fontSize:11,fontStyle:'italic'}}>{data.encouragement}</div>
          </div>
        </div>
        <div style={{padding:'10px 12px',background:C.rd+'10',borderRadius:6,border:`1px solid ${C.rd}33`}}>
          <div style={{color:C.t3,fontSize:8,marginBottom:3,textTransform:'uppercase',letterSpacing:'0.06em'}}>🔴 top weakness</div>
          <div style={{color:C.rd,fontSize:11}}>{data.top_weakness}</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {[{l:'drill 1',v:data.drill1,c:C.bl},{l:'drill 2',v:data.drill2,c:C.pu}].map(d=>(
            <div key={d.l} style={{padding:'10px 12px',background:C.bg3,borderRadius:6,border:`1px solid ${C.b}`}}>
              <div style={{color:C.t3,fontSize:8,marginBottom:3,textTransform:'uppercase',letterSpacing:'0.06em'}}>{d.l}</div>
              <div style={{color:d.c,fontSize:11,lineHeight:1.5}}>{d.v}</div>
            </div>
          ))}
        </div>
        {data.focus_lang&&<div style={{padding:'10px 12px',background:C.yl+'10',borderRadius:6,border:`1px solid ${C.yl}33`}}>
          <div style={{color:C.t3,fontSize:8,marginBottom:3,textTransform:'uppercase',letterSpacing:'0.06em'}}>📚 focus language</div>
          <div style={{color:C.yl,fontSize:11}}>{data.focus_lang}</div>
        </div>}
      </div>}
    </AgentPanel>
  )
}

// ── AGENT 4: ADAPTIVE BATTLE ─────────────────────────────────────────────────
function AdaptiveBattlePanel({liveWpm,accuracy,sessions,lastResult,onStartBattle,onClose,C,onAgentUsed}){
  const [data,setData]=useState(null),[loading,setLoading]=useState(true),[err,setErr]=useState(null)
  useEffect(()=>{
    onAgentUsed('adaptiveBattle')
    runAdaptiveBattleAgent({playerWpm:liveWpm||40,playerAcc:accuracy||90,sessions,lastResult}).then(r=>{if(r)setData(r);else setErr('Battle AI unavailable');setLoading(false)})
  },[])
  return (
    <AgentPanel title="Adaptive Battle AI" icon="⚔️" color={C.rd} loading={loading} err={err} onClose={onClose} C={C}>
      {data&&<div style={{display:'flex',flexDirection:'column',gap:8}}>
        <div style={{padding:'14px',background:C.rd+'0d',borderRadius:7,border:`1px solid ${C.rd}33`,display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:44,height:44,borderRadius:'50%',background:C.rd+'22',border:`2px solid ${C.rd}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>🤖</div>
          <div style={{flex:1}}>
            <div style={{color:C.rd,fontSize:13,fontWeight:700}}>{data.opponent_name}</div>
            <div style={{color:C.t2,fontSize:11,marginTop:2}}>{data.personality}</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{color:C.rd,fontSize:22,fontWeight:700}}>{data.opponent_wpm}</div>
            <div style={{color:C.t3,fontSize:9}}>wpm target</div>
          </div>
        </div>
        <div style={{padding:'10px 12px',background:C.bg3,borderRadius:6,border:`1px solid ${C.b}`,fontStyle:'italic'}}>
          <span style={{color:C.t3,fontSize:9}}>💬 taunt: </span>
          <span style={{color:C.t2,fontSize:11}}>"{data.taunt}"</span>
        </div>
        <div style={{padding:'10px 12px',background:C.gr+'10',borderRadius:6,border:`1px solid ${C.gr}33`}}>
          <div style={{color:C.t3,fontSize:8,marginBottom:3,textTransform:'uppercase',letterSpacing:'0.06em'}}>💡 how to beat them</div>
          <div style={{color:C.gr,fontSize:11}}>{data.tip}</div>
        </div>
        <button onClick={()=>onStartBattle(data)} style={{padding:'8px',borderRadius:6,fontSize:12,border:`1px solid ${C.rd}88`,background:C.rd+'18',color:C.rd,cursor:'pointer',fontWeight:600}}>
          ⚔️ start battle vs {data.opponent_name}
        </button>
      </div>}
    </AgentPanel>
  )
}

// ── AGENT 5: ERROR EXPLAINER ─────────────────────────────────────────────────
function ErrorExplainerPanel({expected,typed,context,lang,onClose,C,onAgentUsed}){
  const [data,setData]=useState(null),[loading,setLoading]=useState(true),[err,setErr]=useState(null)
  useEffect(()=>{
    onAgentUsed('errorExplainer')
    runErrorExplainerAgent({expected,typed,context,lang}).then(r=>{if(r)setData(r);else setErr('Explainer unavailable');setLoading(false)})
  },[expected,typed])
  return (
    <AgentPanel title="Error Explainer" icon="🔴" color={C.rd} loading={loading} err={err} onClose={onClose} C={C}>
      {data&&<div style={{display:'flex',flexDirection:'column',gap:8}}>
        <div style={{display:'flex',gap:12,alignItems:'center',padding:'10px 12px',background:C.bg2,borderRadius:6,border:`1px solid ${C.b}`}}>
          <div style={{textAlign:'center'}}>
            <div style={{color:C.rd,fontSize:22,fontFamily:'monospace',fontWeight:700}}>'{typed}'</div>
            <div style={{color:C.t3,fontSize:8}}>you typed</div>
          </div>
          <div style={{color:C.t3,fontSize:16}}>→</div>
          <div style={{textAlign:'center'}}>
            <div style={{color:C.gr,fontSize:22,fontFamily:'monospace',fontWeight:700}}>'{expected}'</div>
            <div style={{color:C.t3,fontSize:8}}>expected</div>
          </div>
        </div>
        {[{l:'why it appears here',v:data.why,c:C.t},{l:'common confusion',v:data.common_mistake,c:C.yl},{l:'memory trick',v:data.memory_trick,c:C.cy},{...(data.keyboard_tip?{l:'keyboard tip',v:data.keyboard_tip,c:C.bl}:null)}].filter(Boolean).map(d=>(
          d.v&&<div key={d.l} style={{padding:'10px 12px',background:C.bg3,borderRadius:6,border:`1px solid ${C.b}`}}>
            <div style={{color:C.t3,fontSize:8,marginBottom:3,textTransform:'uppercase',letterSpacing:'0.06em'}}>{d.l}</div>
            <div style={{color:d.c,fontSize:11,lineHeight:1.6}}>{d.v}</div>
          </div>
        ))}
      </div>}
    </AgentPanel>
  )
}

// ── AGENT 6: SESSION REVIEW ───────────────────────────────────────────────────
function SessionReviewPanel({wpm,accuracy,errors,combo,snippet,duration,wpmHistory,onClose,C,onAgentUsed}){
  const [data,setData]=useState(null),[loading,setLoading]=useState(true),[err,setErr]=useState(null)
  useEffect(()=>{
    onAgentUsed('sessionReview')
    runSessionReviewAgent({wpm,accuracy,errors,combo,snippet,duration,wpmHistory}).then(r=>{if(r)setData(r);else setErr('Review unavailable');setLoading(false)})
  },[])
  const gc={'A+':C.gr,A:C.gr,'B+':C.bl,B:C.bl,'C+':C.yl,C:C.yl,D:C.or,F:C.rd}
  return (
    <AgentPanel title="Session Review" icon="📊" color={C.pu} loading={loading} err={err} onClose={onClose} C={C}>
      {data&&<div style={{display:'flex',flexDirection:'column',gap:8}}>
        <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px',background:C.pu+'0d',borderRadius:7,border:`1px solid ${C.pu}33`}}>
          <div style={{textAlign:'center',minWidth:56}}>
            <div style={{fontSize:30,fontWeight:700,color:gc[data.grade]||C.pu}}>{data.grade}</div>
            <div style={{color:C.t3,fontSize:8}}>score: {data.score}/100</div>
          </div>
          <div style={{flex:1}}>
            <div style={{color:C.t,fontSize:13,fontWeight:600,marginBottom:4}}>{data.headline}</div>
            <div style={{color:C.t2,fontSize:11,fontStyle:'italic'}}>{data.encouragement}</div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {[{l:'speed',v:data.wpm_comment,c:C.bl},{l:'accuracy',v:data.accuracy_comment,c:C.gr}].map(d=>(
            <div key={d.l} style={{padding:'10px 12px',background:C.bg3,borderRadius:6,border:`1px solid ${C.b}`}}>
              <div style={{color:C.t3,fontSize:8,marginBottom:3,textTransform:'uppercase',letterSpacing:'0.06em'}}>{d.l}</div>
              <div style={{color:d.c,fontSize:11,lineHeight:1.5}}>{d.v}</div>
            </div>
          ))}
        </div>
        {data.combo_comment&&<div style={{padding:'10px 12px',background:C.pu+'10',borderRadius:6,border:`1px solid ${C.pu}33`}}>
          <div style={{color:C.t3,fontSize:8,marginBottom:3,textTransform:'uppercase',letterSpacing:'0.06em'}}>combo</div>
          <div style={{color:C.pu,fontSize:11}}>{data.combo_comment}</div>
        </div>}
        {data.code_insight&&<div style={{padding:'10px 12px',background:C.bg2,borderRadius:6,border:`1px solid ${C.b}`}}>
          <div style={{color:C.t3,fontSize:8,marginBottom:3,textTransform:'uppercase',letterSpacing:'0.06em'}}>💡 real-world context</div>
          <div style={{color:C.t2,fontSize:11,lineHeight:1.5}}>{data.code_insight}</div>
        </div>}
        {data.next_challenge&&<div style={{padding:'10px 12px',background:C.te+'10',borderRadius:6,border:`1px solid ${C.te}33`}}>
          <div style={{color:C.t3,fontSize:8,marginBottom:3,textTransform:'uppercase',letterSpacing:'0.06em'}}>🎯 next challenge</div>
          <div style={{color:C.te,fontSize:11}}>{data.next_challenge}</div>
        </div>}
      </div>}
    </AgentPanel>
  )
}

// ── LANG CHART ────────────────────────────────────────────────────────────────
function LangChart({langStats,C}){
  const entries=Object.entries(langStats)
  if(!entries.length)return <div style={{color:C.t3,fontSize:11}}>Complete snippets to see per-language stats</div>
  const maxWpm=Math.max(...entries.map(([,v])=>v.wpm),1)
  return <div style={{display:'flex',flexDirection:'column',gap:7}}>
    {entries.sort((a,b)=>b[1].wpm-a[1].wpm).map(([lang,{wpm,acc,count}])=>{
      const lm=LM[lang]||LM.JS,pct=Math.round((wpm/maxWpm)*100)
      return <div key={lang} style={{display:'flex',alignItems:'center',gap:8}}>
        <span style={{fontSize:9,fontWeight:700,color:lm.c,width:32,textAlign:'center'}}>{lang}</span>
        <div style={{flex:1,height:18,background:C.bg3,borderRadius:3,overflow:'hidden',position:'relative'}}>
          <div style={{width:`${pct}%`,height:'100%',background:lm.c+'44',borderRadius:3,transition:'width 0.5s'}}/>
          <span style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',fontSize:9,color:lm.c}}>{Math.round(wpm)} wpm · {Math.round(acc)}% acc · {count} sessions</span>
        </div>
      </div>
    })}
  </div>
}

// ── RHYTHM VIZ ────────────────────────────────────────────────────────────────
function RhythmViz({events,C}){
  if(!events.length)return <div style={{color:C.t3,fontSize:11}}>Complete a snippet to see your rhythm</div>
  const W=560,H=58,times=events.map(e=>e.t-events[0].t),maxT=Math.max(...times,1)
  const gaps=times.slice(1).map((t,i)=>t-times[i]),avgGap=gaps.length?gaps.reduce((a,b)=>a+b,0)/gaps.length:0
  return <div>
    <div style={{display:'flex',gap:16,marginBottom:8}}>
      {[{l:'avg gap',v:Math.round(avgGap)+'ms',c:C.bl},{l:'keystrokes',v:events.length,c:C.gr},{l:'duration',v:(maxT/1000).toFixed(1)+'s',c:C.yl},{l:'errors',v:events.filter(e=>e.type==='error').length,c:C.rd}].map(s=>(
        <div key={s.l}><div style={{color:C.t3,fontSize:8}}>{s.l}</div><div style={{color:s.c,fontSize:13,fontWeight:600}}>{s.v}</div></div>
      ))}
    </div>
    <svg width={W} height={H} style={{display:'block',background:C.bg3,borderRadius:6,border:`1px solid ${C.b}`,marginBottom:8}}>
      <line x1={4} y1={H*0.5} x2={W-4} y2={H*0.5} stroke={C.b2} strokeWidth={0.5} strokeDasharray="4,4"/>
      {events.map((ev,i)=>{
        const x=(times[i]/maxT)*(W-8)+4,gap=i>0?times[i]-times[i-1]:0,slow=Math.min(1,gap/(avgGap*2||1))
        const col=ev.type==='error'?C.rd:ev.type==='backspace'?C.or:slow>0.65?C.yl:C.gr
        const h=ev.type==='error'?H*0.78:ev.type==='backspace'?H*0.45:H*0.28+slow*H*0.38
        return <rect key={i} x={x-1} y={H-h} width={2} height={h} fill={col} opacity={0.85} rx={1}/>
      })}
    </svg>
    <div style={{display:'flex',gap:14}}>{[{c:C.gr,l:'fast'},{c:C.yl,l:'slow'},{c:C.rd,l:'error'},{c:C.or,l:'backspace'}].map(s=>(<span key={s.l} style={{display:'flex',alignItems:'center',gap:4,fontSize:9,color:C.t3}}><span style={{width:8,height:8,background:s.c,borderRadius:2,display:'inline-block'}}/>{s.l}</span>))}</div>
  </div>
}

// ── CUSTOM SNIPPET CREATOR ─────────────────────────────────────────────────────
function CustomCreator({onAdd,onClose,uid,C}){
  const [code,setCode]=useState(''),[lang,setLang]=useState('CUSTOM'),[label,setLabel]=useState(''),[diff,setDiff]=useState('medium'),[err,setErr]=useState('')
  async function submit(){
    if(!code.trim()||!label.trim()){setErr('label and code required');return}
    const snip={id:Date.now(),lang,diff,xp:120,label:label.trim(),code:code.trim(),custom:true}
    onAdd(snip);if(uid)saveCustomSnippet(uid,snip);onClose()
  }
  return <div style={{borderTop:`1px solid ${C.b}`,padding:'14px 18px',background:C.bg}}>
    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
      <span style={{color:C.or,fontSize:12,fontWeight:600}}>✏️ create snippet</span>
      <button onClick={onClose} style={{marginLeft:'auto',padding:'1px 7px',borderRadius:3,fontSize:9,border:`1px solid ${C.b2}`,background:C.bg3,color:C.t2,cursor:'pointer'}}>cancel</button>
    </div>
    <div style={{display:'flex',gap:8,marginBottom:8}}>
      <input value={label} onChange={e=>{setLabel(e.target.value);setErr('')}} placeholder="snippet label" style={{flex:1,background:C.bg3,border:`1px solid ${C.b2}`,borderRadius:5,padding:'6px 10px',color:C.t,fontSize:12,fontFamily:'monospace',outline:'none'}}/>
      <select value={lang} onChange={e=>setLang(e.target.value)} style={{background:C.bg3,border:`1px solid ${C.b2}`,borderRadius:5,padding:'6px 8px',color:C.t,fontSize:11,fontFamily:'monospace',outline:'none'}}>
        {Object.keys(LM).map(l=><option key={l} value={l}>{l}</option>)}
      </select>
      <select value={diff} onChange={e=>setDiff(e.target.value)} style={{background:C.bg3,border:`1px solid ${C.b2}`,borderRadius:5,padding:'6px 8px',color:DC[diff]||C.t,fontSize:11,fontFamily:'monospace',outline:'none'}}>
        {['easy','medium','hard'].map(d=><option key={d} value={d}>{d}</option>)}
      </select>
    </div>
    <textarea value={code} onChange={e=>{setCode(e.target.value);setErr('')}} placeholder="paste your code here…" rows={4} style={{width:'100%',boxSizing:'border-box',background:C.bg3,border:`1px solid ${err?C.rd:C.b2}`,borderRadius:5,padding:'8px 10px',color:C.t,fontSize:13,fontFamily:'monospace',outline:'none',resize:'vertical',lineHeight:1.8}}/>
    {err&&<div style={{color:C.rd,fontSize:10,marginTop:4}}>{err}</div>}
    <div style={{display:'flex',gap:8,marginTop:8,alignItems:'center'}}>
      <span style={{color:C.t3,fontSize:10}}>{code.length} chars</span>
      <button onClick={submit} style={{marginLeft:'auto',padding:'5px 16px',borderRadius:5,fontSize:11,border:`1px solid ${C.or}88`,background:C.or+'18',color:C.or,cursor:'pointer'}}>add snippet</button>
    </div>
  </div>
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
function SettingsPanel({settings,onChange,C}){
  return <div style={{padding:'14px 18px'}}>
    <div style={{color:C.t3,fontSize:9,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.07em'}}>settings</div>
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      {[{l:'username',content:<input value={settings.username||''} onChange={e=>onChange({...settings,username:e.target.value})} placeholder="anonymous" maxLength={20} style={{flex:1,background:C.bg3,border:`1px solid ${C.b2}`,borderRadius:5,padding:'5px 10px',color:C.t,fontSize:11,fontFamily:'monospace',outline:'none'}}/>},
        {l:'theme',content:<div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{Object.entries(THEMES).map(([k,v])=><button key={k} onClick={()=>onChange({...settings,theme:k})} style={{padding:'3px 10px',borderRadius:4,fontSize:10,border:`1px solid ${settings.theme===k?C.bl+'88':C.b}`,background:settings.theme===k?C.bl+'18':'transparent',color:settings.theme===k?C.bl:C.t2,cursor:'pointer'}}>{v.name}</button>)}</div>},
        {l:'sound',content:<button onClick={()=>onChange({...settings,sound:!settings.sound})} style={{padding:'3px 12px',borderRadius:4,fontSize:10,border:`1px solid ${settings.sound?C.gr+'88':C.b}`,background:settings.sound?C.gr+'18':'transparent',color:settings.sound?C.gr:C.t2,cursor:'pointer'}}>{settings.sound?'🔊 on':'🔇 off'}</button>},
        {l:'font size',content:<div style={{display:'flex',gap:6}}>{[12,14,16,18].map(sz=><button key={sz} onClick={()=>onChange({...settings,fontSize:sz})} style={{padding:'3px 10px',borderRadius:4,fontSize:10,border:`1px solid ${settings.fontSize===sz?C.yl+'88':C.b}`,background:settings.fontSize===sz?C.yl+'18':'transparent',color:settings.fontSize===sz?C.yl:C.t2,cursor:'pointer'}}>{sz}px</button>)}</div>},
        {l:'ghost race',content:<button onClick={()=>onChange({...settings,showGhost:!settings.showGhost})} style={{padding:'3px 12px',borderRadius:4,fontSize:10,border:`1px solid ${settings.showGhost?C.bl+'88':C.b}`,background:settings.showGhost?C.bl+'18':'transparent',color:settings.showGhost?C.bl:C.t2,cursor:'pointer'}}>{settings.showGhost?'on':'off'}</button>},
        {l:'error agent',content:<button onClick={()=>onChange({...settings,errorAgent:!settings.errorAgent})} style={{padding:'3px 12px',borderRadius:4,fontSize:10,border:`1px solid ${settings.errorAgent?C.rd+'88':C.b}`,background:settings.errorAgent?C.rd+'18':'transparent',color:settings.errorAgent?C.rd:C.t2,cursor:'pointer'}}>{settings.errorAgent?'🔴 on':'off'}</button>},
      ].map(row=><div key={row.l} style={{display:'flex',alignItems:'center',gap:10}}><span style={{color:C.t2,fontSize:11,width:110}}>{row.l}</span>{row.content}</div>)}
      <div style={{padding:'10px 12px',background:C.bg3,borderRadius:6,border:`1px solid ${C.b}`}}>
        <div style={{color:C.t3,fontSize:9,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>⌨️ shortcuts</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
          {[['Tab','skip snippet'],['↩','next after done'],['⌫','backspace'],['Esc','cancel']].map(([k,v])=>(
            <div key={k} style={{display:'flex',alignItems:'center',gap:6,fontSize:10}}><span style={{padding:'1px 5px',borderRadius:3,border:`1px solid ${C.b2}`,background:C.bg4,color:C.t2,fontSize:9}}>{k}</span><span style={{color:C.t3}}>{v}</span></div>
          ))}
        </div>
      </div>
    </div>
  </div>
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App(){
  const [settings,setSettings]=useState(()=>LS.get('cm_settings',{username:'dev',theme:'dark',sound:true,fontSize:15,showGhost:true,errorAgent:true}))
  const C=THEMES[settings.theme]||THEMES.dark

  const [uid,setUid]=useState(null)
  const [fbLeaderboard,setFbLeaderboard]=useState([])
  const [communitySnips,setCommunitySnips]=useState([])
  const [customSnips,setCustomSnips]=useState(()=>LS.get('cm_custom_snips',[]))
  const [generatedSnips,setGeneratedSnips]=useState([])
  const allSnips=useMemo(()=>[...BUILTIN_SNIPS,...customSnips,...generatedSnips,...communitySnips],[customSnips,generatedSnips,communitySnips])

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
  const [agentsUsed,setAgentsUsed]=useState(()=>new Set(LS.get('cm_agents',[])))
  const [newAch,setNewAch]=useState(null)
  const [lf,setLf]=useState('ALL'),[df,setDf]=useState('ALL')
  const [bgFlash,setBgFlash]=useState('idle')
  const [comboAnim,setComboAnim]=useState(false)
  const [toast,setToast]=useState(null)
  const [rhythmEvents,setRhythmEvents]=useState([])
  const [finalWpm,setFinalWpm]=useState(0),[finalAcc,setFinalAcc]=useState(100),[finalCombo,setFinalCombo]=useState(0),[finalDur,setFinalDur]=useState(0)
  const [aiPeerProgs,setAiPeerProgs]=useState([0,0,0,0,0])
  const [adaptiveOpponent,setAdaptiveOpponent]=useState(null)
  const [lastBattleResult,setLastBattleResult]=useState(null)
  const [statsTab,setStatsTab]=useState('overview')

  // active AI panels
  const [showLesson,setShowLesson]=useState(false)
  const [showGen,setShowGen]=useState(false)
  const [showCoach,setShowCoach]=useState(false)
  const [showBattle,setShowBattle]=useState(false)
  const [showErrorExp,setShowErrorExp]=useState(false)
  const [showReview,setShowReview]=useState(false)
  const [showCustom,setShowCustom]=useState(false)
  const [lastError,setLastError]=useState(null)

  const ref=useRef(null),wRef=useRef(null),stRef=useRef(null),tRef=useRef(''),evRef=useRef([]),peerRef=useRef(null)

  const snip=allSnips[si]||BUILTIN_SNIPS[0],target=snip.code,lm=LM[snip.lang]||LM.CUSTOM
  const filtered=useMemo(()=>allSnips.filter(s=>(lf==='ALL'||s.lang===lf)&&(df==='ALL'||s.diff===df)),[allSnips,lf,df])

  // ── firebase init ─────────────────────────────────────────────────────────
  useEffect(()=>{
    signInAnon().then(u=>{if(u){setUid(u.uid);loadUserProfile(u.uid).then(p=>{if(p){setXp(p.xp||0);setBest(p.bestWpm||0);setStreak(p.streak||0);setUnlocked(p.achievements||[]);setLangStats(p.langStats||{});setWpmH(p.wpmHistory||[])}});}})
    const unsub=subscribeLeaderboard(20,rows=>setFbLeaderboard(rows))
    getCommunitySnippets().then(snips=>setCommunitySnips(snips.map((s,i)=>({...s,id:20000+i}))))
    return()=>unsub()
  },[])

  // ── persist ───────────────────────────────────────────────────────────────
  useEffect(()=>LS.set('cm_settings',settings),[settings])
  useEffect(()=>LS.set('cm_wpmH',wpmH.slice(-100)),[wpmH])
  useEffect(()=>{LS.set('cm_sessions',sessions);LS.set('cm_best',best);LS.set('cm_xp',xp);LS.set('cm_streak',streak);LS.set('cm_bossWins',bossWins);LS.set('cm_hardDone',hardDone);LS.set('cm_perfect',perfect);LS.set('cm_maxCombo',maxComboEver);LS.set('cm_langs',[...langsUsed]);LS.set('cm_unlocked',unlocked);LS.set('cm_langStats',langStats);LS.set('cm_customCreated',customCreated);LS.set('cm_timedBest',timedBest);LS.set('cm_agents',[...agentsUsed])},[sessions,best,xp,streak,bossWins,hardDone,perfect,maxComboEver,langsUsed,unlocked,langStats,customCreated,timedBest,agentsUsed])
  useEffect(()=>LS.set('cm_custom_snips',customSnips),[customSnips])

  // ── firebase sync ─────────────────────────────────────────────────────────
  useEffect(()=>{if(!uid||!sessions)return;saveUserProfile(uid,{xp,bestWpm:best,streak,achievements:unlocked,langStats,wpmHistory:wpmH.slice(-50)})},[sessions])

  // ── helpers ───────────────────────────────────────────────────────────────
  function pick(pool){const arr=pool||filtered;if(!arr.length)return;setSi(allSnips.indexOf(arr[Math.floor(Math.random()*arr.length)]));reset()}
  function reset(){setTyped('');tRef.current='';evRef.current=[];setGs('ready');stRef.current=null;setLiveWpm(0);setCombo(0);setErrs(0);setAiPeerProgs([0,0,0,0,0]);setShowLesson(false);setShowReview(false);setShowErrorExp(false);setLastError(null);clearInterval(wRef.current);clearInterval(peerRef.current)}
  function flashBg(t){setBgFlash(t);setTimeout(()=>setBgFlash('idle'),160)}
  function showToast(m,c){setToast({m,c})}

  function markAgentUsed(name){setAgentsUsed(prev=>{const next=new Set([...prev,name]);LS.set('cm_agents',[...next]);return next})}

  function checkAchievements(stats){
    const toUnlock=ACHIEVEMENTS.filter(a=>!unlocked.includes(a.id)&&a.cond(stats))
    if(!toUnlock.length)return
    setUnlocked(u=>[...u,...toUnlock.map(a=>a.id)])
    setNewAch(toUnlock[0]);if(settings.sound)SFX.achieve()
    showToast(`🏅 ${toUnlock[0].label} unlocked!`,C.pu)
    setTimeout(()=>setNewAch(null),3000)
  }

  // ── keyboard ──────────────────────────────────────────────────────────────
  const handleKey=useCallback(e=>{
    if(tab!=='race')return
    if(gs==='done'&&(e.key==='Tab'||e.key==='Enter')){e.preventDefault();pick();return}
    if(e.key==='Tab'){e.preventDefault();pick();return}
    if(e.key.length!==1&&e.key!=='Backspace')return
    e.preventDefault()
    if(e.key==='Backspace'){if(tRef.current.length>0){evRef.current.push({type:'backspace',t:Date.now()});tRef.current=tRef.current.slice(0,-1);setTyped(tRef.current);setCombo(0)};return}
    const now=Date.now()
    if(gs==='ready'){stRef.current=now;setGs('playing');
      wRef.current=setInterval(()=>{if(!stRef.current)return;const w=Math.round((tRef.current.length/5)/((Date.now()-stRef.current)/60000));setLiveWpm(w);setWpmH(h=>[...h.slice(-80),w])},700)
      if(settings.showGhost)peerRef.current=setInterval(()=>{if(!stRef.current)return;const el=(Date.now()-stRef.current)/1000;const opp=adaptiveOpponent?{wpm:adaptiveOpponent.opponent_wpm}:null;const peers=[...([0,0,0,0,0]).map((_,i)=>{const peer={wpm:[28,52,74,95,130][i]};return Math.min(1,(peer.wpm*5/60*el)/Math.max(target.length,1))})];if(opp)peers[2]=Math.min(1,(opp.wpm*5/60*el)/Math.max(target.length,1));setAiPeerProgs(peers)},100)
    }
    const correct=e.key===target[tRef.current.length],k=e.key.toLowerCase()
    evRef.current.push({type:correct?'keystroke':'error',char:e.key,t:now})
    if(correct){
      tRef.current+=e.key;setTyped(tRef.current)
      if(settings.sound)SFX.keyCorrect()
      setCombo(c=>{const nc=c+1;setMaxC(m=>{if(nc>m){setMaxComboEver(me=>Math.max(me,nc));return nc}return m});if(nc%10===0&&nc>0){setComboAnim(true);setTimeout(()=>setComboAnim(false),500);if(settings.sound)SFX.combo10()};return nc})
      if(ALLK.includes(k))setKHeat(h=>({...h,[k]:(h[k]||0)+1}))
      flashBg('good')
      if(tRef.current.length===target.length){
        clearInterval(wRef.current);clearInterval(peerRef.current)
        const fw=Math.round((tRef.current.length/5)/((Date.now()-stRef.current)/60000))
        const fa=Math.round((tRef.current.length/(tRef.current.length+errs))*100)
        const dur=(Date.now()-stRef.current)/1000
        setLiveWpm(fw);setFinalWpm(fw);setFinalAcc(fa);setFinalCombo(maxC);setFinalDur(dur)
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
        if(adaptiveOpponent){const won=fw>adaptiveOpponent.opponent_wpm;setLastBattleResult(won?'won':'lost')}
        setGs('done');if(settings.sound)SFX.snippetDone()
        showToast(`+${earned} xp  ·  ${fw} wpm`,C.yl)
        if(uid)submitScore(uid,settings.username||'dev',fw,fa,snip.lang,snip.label)
        checkAchievements({sessions:ns,best:Math.max(best,fw),perfect:fa===100?perfect+1:perfect,maxCombo:Math.max(maxComboEver,maxC),xp:nx,langs:nl.size,streak:streak+1,bossWins,hardDone:snip.diff==='hard'?hardDone+1:hardDone,customCreated,timedBest,agentsUsed:agentsUsed.size})
      }
    } else {
      setErrs(m=>m+1);setCombo(0)
      if(ALLK.includes(k))setKErr(h=>({...h,[k]:(h[k]||0)+1}))
      if(settings.sound)SFX.keyError()
      flashBg('bad')
      if(settings.errorAgent&&tRef.current.length<target.length){
        setLastError({expected:target[tRef.current.length],typed:e.key,context:target,lang:snip.lang})
        setShowErrorExp(true)
      }
    }
  },[tab,gs,target,errs,sessions,snip,filtered,allSnips,best,xp,perfect,langsUsed,maxComboEver,maxC,streak,bossWins,hardDone,unlocked,settings,uid,customCreated,timedBest,agentsUsed,adaptiveOpponent])

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
  const TABS=['race','stats','board','badges','settings']

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div ref={ref} tabIndex={0} style={{outline:'none',background:C.bg,borderRadius:16,overflow:'hidden',border:`1px solid ${C.b}`,fontFamily:"'SF Mono','Fira Code','Cascadia Code',monospace",userSelect:'none',position:'relative'}}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}@keyframes popIn{0%{transform:scale(0.8);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}button:hover{opacity:0.82}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:${C.bg}}::-webkit-scrollbar-thumb{background:${C.b2};border-radius:2px}`}</style>
      {toast&&<Toast msg={toast.m} color={toast.c} onDone={()=>setToast(null)}/>}

      {/* TOP BAR */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 20px',borderBottom:`1px solid ${C.b}`,background:C.bg2}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:gs==='playing'?C.gr:gs==='done'?C.bl:C.t3,transition:'background 0.3s'}}/>
          <span style={{color:C.t,fontWeight:700,fontSize:15,letterSpacing:'-0.03em'}}>code<span style={{color:C.bl}}>master</span></span>
          {streak>0&&<span style={{fontSize:10,color:C.or,background:C.or+'18',border:`1px solid ${C.or}44`,padding:'1px 8px',borderRadius:4}}>🔥 {streak}</span>}
          {uid&&<span style={{fontSize:9,color:C.te,background:C.te+'14',padding:'1px 6px',borderRadius:3,border:`1px solid ${C.te}33`}}>● live</span>}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{color:C.t3,fontSize:10}}>@{settings.username||'dev'}</span>
          <ProgressRing pct={xpPct} size={40} stroke={3} color={C.bl} label={`lv${xpLv}`}/>
          <div style={{padding:'3px 10px',borderRadius:5,background:rank.c+'22',border:`1px solid ${rank.c}44`,color:rank.c,fontSize:10,fontWeight:700}}>{rank.l}</div>
          <span style={{color:C.t3,fontSize:10}}>{xp} xp</span>
        </div>
      </div>

      {/* TABS */}
      <div style={{display:'flex',borderBottom:`1px solid ${C.b}`,background:C.bg,overflowX:'auto'}}>
        {TABS.map(t=><button key={t} onClick={()=>{setTab(t);if(t==='race')reset()}} style={{flex:'0 0 auto',padding:'8px 16px',fontSize:10,background:'transparent',border:'none',cursor:'pointer',fontFamily:'inherit',color:tab===t?C.bl:C.t3,borderBottom:`2px solid ${tab===t?C.bl:'transparent'}`,whiteSpace:'nowrap'}}>
          {t==='badges'?'🏅 badges':t==='board'?'🏆 scores':t==='settings'?'⚙️':t}
        </button>)}
      </div>

      {/* ══ RACE ══ */}
      {tab==='race'&&<>
        {/* filter + action bar */}
        <div style={{display:'flex',alignItems:'center',gap:5,padding:'7px 18px',borderBottom:`1px solid ${C.b}`,flexWrap:'wrap'}}>
          {langs2.map(l=>{const ac=lf===l,lm2=LM[l];return <button key={l} onClick={()=>{setLf(l);pick(allSnips.filter(s=>(l==='ALL'||s.lang===l)&&(df==='ALL'||s.diff===df)))}} style={{padding:'2px 8px',borderRadius:4,fontSize:9,cursor:'pointer',border:`1px solid ${ac?(lm2?.c||C.bl)+'88':C.b}`,background:ac?(lm2?.c||C.bl)+'18':'transparent',color:ac?(lm2?.c||C.bl):C.t2}}>{l}</button>})}
          <span style={{color:C.b2,margin:'0 4px'}}>│</span>
          {diffs2.map(d=>{const ac=df===d;return <button key={d} onClick={()=>{setDf(d);pick(allSnips.filter(s=>(lf==='ALL'||s.lang===lf)&&(d==='ALL'||s.diff===d)))}} style={{padding:'2px 8px',borderRadius:4,fontSize:9,cursor:'pointer',border:`1px solid ${ac?(DC[d]||C.t2)+'88':C.b}`,background:ac?(DC[d]||C.t2)+'18':'transparent',color:ac?(DC[d]||C.t2):C.t2}}>{d}</button>})}
          <div style={{marginLeft:'auto',display:'flex',gap:5}}>
            <button onClick={()=>setShowCustom(s=>!s)} style={{padding:'2px 8px',borderRadius:4,fontSize:9,border:`1px solid ${C.or}66`,background:showCustom?C.or+'18':'transparent',color:C.or,cursor:'pointer'}}>✏️ custom</button>
            <button onClick={()=>setShowGen(s=>!s)} style={{padding:'2px 8px',borderRadius:4,fontSize:9,border:`1px solid ${C.pu}66`,background:showGen?C.pu+'18':'transparent',color:C.pu,cursor:'pointer'}}>✨ AI gen</button>
            <button onClick={()=>setShowCoach(s=>!s)} style={{padding:'2px 8px',borderRadius:4,fontSize:9,border:`1px solid ${C.or}66`,background:showCoach?C.or+'18':'transparent',color:C.or,cursor:'pointer'}}>🎯 coach</button>
            <button onClick={()=>setShowBattle(s=>!s)} style={{padding:'2px 8px',borderRadius:4,fontSize:9,border:`1px solid ${C.rd}66`,background:showBattle?C.rd+'18':'transparent',color:C.rd,cursor:'pointer'}}>⚔️ battle AI</button>
            <button onClick={()=>pick()} style={{padding:'2px 8px',borderRadius:4,fontSize:9,border:`1px solid ${C.b2}`,background:C.bg3,color:C.t2,cursor:'pointer'}}>↺ skip</button>
          </div>
        </div>

        {/* AI panels */}
        {showCustom&&<CustomCreator onAdd={s=>{setCustomSnips(c=>[...c,s]);setSi(allSnips.length);setCustomCreated(n=>n+1);reset();setShowCustom(false)}} onClose={()=>setShowCustom(false)} uid={uid} C={C}/>}
        {showGen&&<SnippetGenPanel onAdd={s=>{setGeneratedSnips(g=>[...g,s]);setSi(allSnips.length);reset();setShowGen(false)}} onClose={()=>setShowGen(false)} C={C} onAgentUsed={markAgentUsed}/>}
        {showCoach&&<CoachPanel kHeat={kHeat} kErr={kErr} wpmHistory={wpmH} langStats={langStats} sessions={sessions} C={C} onClose={()=>setShowCoach(false)} onAgentUsed={markAgentUsed}/>}
        {showBattle&&<AdaptiveBattlePanel liveWpm={best||liveWpm} accuracy={finalAcc} sessions={sessions} lastResult={lastBattleResult} onStartBattle={opp=>{setAdaptiveOpponent(opp);setShowBattle(false);pick();showToast(`⚔️ battling ${opp.opponent_name} (${opp.opponent_wpm} wpm)`,C.rd)}} onClose={()=>setShowBattle(false)} C={C} onAgentUsed={markAgentUsed}/>}

        {/* snippet label */}
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 18px',borderBottom:`1px solid ${C.b}`,background:lm.bg+'55'}}>
          <Tag label={snip.lang} color={lm.c}/>
          <span style={{color:C.t,fontSize:13,fontWeight:600}}>{snip.label}</span>
          {snip.custom&&<span style={{fontSize:8,color:C.or,background:C.or+'14',padding:'0 4px',borderRadius:2,border:`1px solid ${C.or}44`}}>custom</span>}
          {snip.generated&&<span style={{fontSize:8,color:C.pu,background:C.pu+'14',padding:'0 4px',borderRadius:2,border:`1px solid ${C.pu}44`}}>AI</span>}
          <span style={{color:C.t3}}>·</span>
          <Tag label={snip.diff} color={DC[snip.diff]||C.t2}/>
          {adaptiveOpponent&&<span style={{fontSize:9,color:C.rd,background:C.rd+'14',padding:'1px 6px',borderRadius:3,border:`1px solid ${C.rd}44`}}>⚔️ vs {adaptiveOpponent.opponent_name}</span>}
          <span style={{marginLeft:'auto',color:C.t3,fontSize:10}}>{snip.xp} xp · {typed.length}/{target.length}</span>
        </div>

        {/* ghost race */}
        {settings.showGhost&&<div style={{padding:'8px 18px',borderBottom:`1px solid ${C.b}`,background:C.bg2}}>
          <div style={{color:C.t3,fontSize:9,marginBottom:7,textTransform:'uppercase',letterSpacing:'0.07em'}}>live race</div>
          {[{name:'you',color:C.bl,prog:typed.length/Math.max(target.length,1),wpm:liveWpm,isYou:true},
            ...([28,52,adaptiveOpponent?.opponent_wpm||74,95,130]).map((w,i)=>({name:i===2&&adaptiveOpponent?adaptiveOpponent.opponent_name:[null,'junior_dev','mid_eng','senior_dev','tech_lead','10x_legend'][i+1]||'peer',color:[C.gr,C.bl,C.rd,C.or,C.rd][i],prog:aiPeerProgs[i]||0,wpm:w,isYou:false,isOpponent:i===2&&!!adaptiveOpponent}))
          ].map(r=>(
            <div key={r.name} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
              <div style={{width:24,height:24,borderRadius:'50%',background:r.color+'22',border:`${r.isOpponent?2:1.5}px solid ${r.color}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:r.color,fontWeight:700}}>{r.name[0].toUpperCase()}</div>
              <span style={{fontSize:9,color:r.isYou?r.color:C.t2,fontWeight:r.isYou||r.isOpponent?700:400,width:90,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{r.name}{r.isOpponent?' ⚔️':''}</span>
              <div style={{flex:1,height:5,background:C.bg3,borderRadius:2,overflow:'hidden'}}>
                <div style={{width:`${Math.min(100,r.prog*100)}%`,height:'100%',background:r.prog>=1?C.gr:r.color,borderRadius:2,transition:r.isYou?'none':'width 0.2s'}}/>
              </div>
              <span style={{fontSize:9,color:r.prog>=1?C.gr:C.t3,width:44,textAlign:'right'}}>{r.prog>=1?'✓':Math.round(r.prog*100)+'%'}</span>
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

        {/* error explainer (auto-shows on mistake) */}
        {showErrorExp&&lastError&&<ErrorExplainerPanel expected={lastError.expected} typed={lastError.typed} context={lastError.context} lang={lastError.lang} onClose={()=>setShowErrorExp(false)} C={C} onAgentUsed={markAgentUsed}/>}

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
              {adaptiveOpponent&&<div style={{fontSize:10,color:lastBattleResult==='won'?C.gr:C.rd,marginBottom:6}}>
                {lastBattleResult==='won'?`🏆 beat ${adaptiveOpponent.opponent_name}!`:`💀 lost to ${adaptiveOpponent.opponent_name} (${adaptiveOpponent.opponent_wpm} wpm)`}
              </div>}
              <div style={{color:C.t3,fontSize:10,marginBottom:10}}>rank: <span style={{color:rank.c,fontWeight:600}}>{rank.l}</span></div>
              <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                <button onClick={()=>pick()} style={{padding:'5px 12px',borderRadius:5,fontSize:10,border:`1px solid ${C.bl}88`,background:C.bl+'14',color:C.bl,cursor:'pointer'}}>↺ next</button>
                <button onClick={reset} style={{padding:'5px 12px',borderRadius:5,fontSize:10,border:`1px solid ${C.b2}`,background:'transparent',color:C.t2,cursor:'pointer'}}>retry</button>
                <button onClick={()=>setShowLesson(l=>!l)} style={{padding:'5px 12px',borderRadius:5,fontSize:10,cursor:'pointer',border:`1px solid ${showLesson?C.cy:C.b2}`,background:showLesson?C.cy+'18':'transparent',color:showLesson?C.cy:C.t2}}>🎓 lesson</button>
                <button onClick={()=>setShowReview(r=>!r)} style={{padding:'5px 12px',borderRadius:5,fontSize:10,cursor:'pointer',border:`1px solid ${showReview?C.pu:C.b2}`,background:showReview?C.pu+'18':'transparent',color:showReview?C.pu:C.t2}}>📊 review</button>
                <button onClick={()=>setShowBattle(b=>!b)} style={{padding:'5px 12px',borderRadius:5,fontSize:10,cursor:'pointer',border:`1px solid ${C.rd}66`,background:'transparent',color:C.rd}}>⚔️ rematch</button>
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

        {/* AI lesson + review panels */}
        {showLesson&&gs==='done'&&<LessonPanel snippet={snip} C={C} onClose={()=>setShowLesson(false)} onAgentUsed={markAgentUsed}/>}
        {showReview&&gs==='done'&&<SessionReviewPanel wpm={finalWpm} accuracy={finalAcc} errors={errs} combo={finalCombo} snippet={snip} duration={finalDur} wpmHistory={wpmH} onClose={()=>setShowReview(false)} C={C} onAgentUsed={markAgentUsed}/>}

        {/* AI agents used indicator */}
        <div style={{padding:'6px 18px',borderTop:`1px solid ${C.b}`,background:C.bg2,display:'flex',alignItems:'center',gap:8}}>
          <span style={{color:C.t3,fontSize:9}}>AI agents:</span>
          {[{k:'lesson',icon:'🎓',label:'Lesson'},{k:'snippetGen',icon:'✨',label:'Gen'},{k:'coach',icon:'🎯',label:'Coach'},{k:'adaptiveBattle',icon:'⚔️',label:'Battle'},{k:'errorExplainer',icon:'🔴',label:'Errors'},{k:'sessionReview',icon:'📊',label:'Review'}].map(a=>(
            <span key={a.k} style={{fontSize:9,color:agentsUsed.has(a.k)?C.gr:C.t3,background:agentsUsed.has(a.k)?C.gr+'14':'transparent',padding:'1px 5px',borderRadius:3,border:`1px solid ${agentsUsed.has(a.k)?C.gr+'44':C.b}`,transition:'all 0.3s'}}>{a.icon} {a.label}</span>
          ))}
          <span style={{marginLeft:'auto',color:C.t3,fontSize:9}}>{agentsUsed.size}/6 used</span>
        </div>

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
        </div>

        {/* snippet library */}
        <div style={{borderTop:`1px solid ${C.b}`,background:C.bg2,padding:'10px 16px'}}>
          <div style={{color:C.t3,fontSize:9,marginBottom:7,textTransform:'uppercase',letterSpacing:'0.07em'}}>library — {filtered.length} snippets</div>
          <div style={{display:'flex',flexDirection:'column',gap:3,maxHeight:130,overflowY:'auto'}}>
            {filtered.map(s=>{const slm=LM[s.lang]||LM.JS,active=allSnips.indexOf(s)===si;return(
              <div key={s.id} onClick={()=>{setSi(allSnips.indexOf(s));reset()}} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 8px',borderRadius:5,cursor:'pointer',transition:'all 0.1s',background:active?C.bg3:'transparent',border:`1px solid ${active?C.b2:'transparent'}`}}>
                <span style={{fontSize:9,fontWeight:700,color:slm.c,width:26,textAlign:'center'}}>{s.lang}</span>
                <span style={{flex:1,color:active?C.t:C.t2,fontSize:11}}>{s.label}</span>
                {s.custom&&<span style={{fontSize:7,color:C.or,background:C.or+'18',padding:'0 3px',borderRadius:2}}>custom</span>}
                {s.generated&&<span style={{fontSize:7,color:C.pu,background:C.pu+'18',padding:'0 3px',borderRadius:2}}>AI</span>}
                <span style={{fontSize:9,color:DC[s.diff]||C.t2}}>{s.diff}</span>
                <span style={{fontSize:9,color:C.yl}}>{s.xp}xp</span>
                <span style={{fontSize:9,color:C.t3,maxWidth:160,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{s.code.replace(/\n/g,' ').slice(0,28)}…</span>
                {active&&<span style={{fontSize:9,color:C.bl}}>●</span>}
              </div>
            )})}
          </div>
        </div>

        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 18px',borderTop:`1px solid ${C.b}`,background:C.bg}}>
          <div style={{display:'flex',gap:10,fontSize:10,color:C.t3}}><span><Kbd c="Tab" C={C}/> skip</span><span><Kbd c="⌫" C={C}/> back</span><span><Kbd c="↩" C={C}/> next</span></div>
          <span style={{color:C.b3,fontSize:9}}>codemaster v2.0 · 6 AI agents</span>
        </div>
      </>}

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
          {['overview','rhythm','langs'].map(t=><button key={t} onClick={()=>setStatsTab(t)} style={{padding:'4px 12px',borderRadius:4,fontSize:10,cursor:'pointer',border:`1px solid ${statsTab===t?C.bl+'88':C.b}`,background:statsTab===t?C.bl+'14':'transparent',color:statsTab===t?C.bl:C.t2}}>{t}</button>)}
        </div>
        <div style={{background:C.bg2,border:`1px solid ${C.b}`,borderRadius:8,padding:'14px 16px'}}>
          {statsTab==='overview'&&<>
            <div style={{color:C.t3,fontSize:9,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.07em'}}>wpm history</div>
            <SparkLine data={wpmH} color={C.bl} width={580} height={80}/>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:14}}>
              {[{l:'boss wins',v:bossWins,c:C.rd},{l:'max combo',v:maxComboEver+'×',c:C.pu},{l:'langs used',v:langsUsed.size,c:C.or},{l:'perfect runs',v:perfect,c:C.te},{l:'hard done',v:hardDone,c:C.rd},{l:'AI agents',v:`${agentsUsed.size}/6`,c:C.cy}].map(s=>(
                <div key={s.l} style={{textAlign:'center',padding:'8px 10px',background:C.bg3,borderRadius:6,border:`1px solid ${C.b}`}}>
                  <div style={{color:C.t3,fontSize:9}}>{s.l}</div>
                  <div style={{color:s.c,fontSize:18,fontWeight:700}}>{s.v}</div>
                </div>
              ))}
            </div>
          </>}
          {statsTab==='rhythm'&&<><div style={{color:C.t3,fontSize:9,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.07em'}}>typing rhythm</div><RhythmViz events={rhythmEvents} C={C}/></>}
          {statsTab==='langs'&&<><div style={{color:C.t3,fontSize:9,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.07em'}}>per-language breakdown</div><LangChart langStats={langStats} C={C}/></>}
        </div>
      </div>}

      {/* ══ LEADERBOARD ══ */}
      {tab==='board'&&<div style={{padding:'14px 18px'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
          <span style={{color:C.t3,fontSize:9,textTransform:'uppercase',letterSpacing:'0.07em'}}>global leaderboard</span>
          {uid&&<span style={{fontSize:9,color:C.te,background:C.te+'14',padding:'1px 5px',borderRadius:3,border:`1px solid ${C.te}33`}}>● live firebase</span>}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          {(fbLeaderboard.length?fbLeaderboard:[{username:'DevGuru',wpm:112,accuracy:97,lang:'RUST'},{username:'Carol',wpm:78,accuracy:94,lang:'GO'},{username:'Alice',wpm:54,accuracy:91,lang:'TS'}]).map((e,i)=>{
            const isYou=(e.username||e.n)===settings.username,medals=['🥇','🥈','🥉'],name=e.username||e.n,w=e.wpm||e.w,a=e.accuracy||e.a,l=e.lang||e.l
            return <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderRadius:7,background:isYou?C.bl+'14':i===0?C.yl+'0d':C.bg3,border:`1px solid ${isYou?C.bl+'55':i===0?C.yl+'33':C.b}`}}>
              <span style={{fontSize:14,width:22,textAlign:'center'}}>{i<3?medals[i]:<span style={{color:C.t3,fontSize:11}}>#{i+1}</span>}</span>
              <div style={{width:26,height:26,borderRadius:'50%',background:isYou?C.bl+'33':C.bg4,border:`1px solid ${isYou?C.bl:C.b2}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:isYou?C.bl:C.t2,fontWeight:700}}>{(name||'?')[0].toUpperCase()}</div>
              <span style={{flex:1,color:isYou?C.bl:i<3?C.t:C.t2,fontWeight:isYou?700:400,fontSize:12}}>{name}</span>
              <span style={{color:C.t3,fontSize:9,marginRight:6}}>{l}</span>
              <span style={{color:C.t2,fontSize:10,marginRight:8}}>{a}%</span>
              <span style={{color:i===0?C.yl:isYou?C.bl:C.t,fontSize:18,fontWeight:700}}>{w}</span>
              <span style={{color:C.t3,fontSize:9}}>wpm</span>
            </div>
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
            <div style={{color:C.t2,fontSize:11}}>{Math.round((unlocked.length/ACHIEVEMENTS.length)*100)}% complete · {xp} xp total</div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
          {ACHIEVEMENTS.map(a=>{const done=unlocked.includes(a.id);return(
            <div key={a.id} title={`${a.label}: ${a.desc}`} style={{padding:'10px 6px',borderRadius:7,textAlign:'center',cursor:'default',transition:'all 0.3s',background:done?C.bg3:'transparent',border:`1px solid ${done?C.b2:C.b}`,opacity:done?1:0.28,animation:newAch?.id===a.id?'popIn 0.5s ease forwards':''}}>
              <div style={{fontSize:20,marginBottom:5}}>{a.icon}</div>
              <div style={{fontSize:9,color:done?C.t:C.t3,lineHeight:1.3}}>{a.label}</div>
              <div style={{fontSize:8,color:C.t3,marginTop:2,lineHeight:1.2}}>{a.desc}</div>
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
