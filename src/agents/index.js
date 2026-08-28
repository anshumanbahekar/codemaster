// ─────────────────────────────────────────────────────────────────────────────
//  codemaster — AI Agents (all free via Anthropic claude-haiku-4-5 — fastest + cheapest)
//  6 agents: lesson, snippet-gen, coach, adaptive-battle, error-explainer, review
// ─────────────────────────────────────────────────────────────────────────────

const MODEL = 'claude-haiku-4-5'   // fastest, cheapest, still great
const MAX_TOKENS = 800

async function callClaude(prompt, systemPrompt = '') {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt || 'You are a helpful coding assistant. Reply in JSON only — no markdown fences, no extra text.',
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const d = await res.json()
    if (d.error) throw new Error(d.error.message)
    const text = d.content?.[0]?.text || '{}'
    return JSON.parse(text.trim().replace(/^```json|^```|```$/gm, ''))
  } catch (e) {
    console.warn('[AI Agent] failed:', e.message)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  AGENT 1 — Lesson Agent
//  Explains the snippet concept after completion
// ─────────────────────────────────────────────────────────────────────────────
export async function runLessonAgent({ snippet }) {
  return callClaude(
    `Language: ${snippet.lang}\nCode: ${snippet.code}\n\nJSON: {"concept":"name (2-4 words)","what":"one sentence what it does","why":"one sentence why use it","how":"2-3 sentences how it works","gotcha":"one common mistake","example":"short related code in same language","level":"beginner|intermediate|advanced"}`,
    'You are a concise coding teacher. Reply in JSON only.'
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  AGENT 2 — Snippet Generator
//  Generates a fresh real code snippet on demand
// ─────────────────────────────────────────────────────────────────────────────
export async function runSnippetGeneratorAgent({ lang, difficulty, topic = '' }) {
  const result = await callClaude(
    `Generate a real, typeable code snippet for a developer typing race.\nLanguage: ${lang}\nDifficulty: ${difficulty}\n${topic ? `Topic hint: ${topic}` : ''}\n\nRules:\n- Must be actual runnable code (not pseudocode)\n- Length: easy=20-40 chars, medium=40-80 chars, hard=80-130 chars\n- No comments, just code\n- Single line preferred, multi-line ok with \\n\n\nJSON: {"label":"short name (2-4 words)","code":"the actual code","explanation":"one sentence what it does","xp":${difficulty === 'easy' ? 80 : difficulty === 'medium' ? 140 : 220}}`,
    'You are a developer who creates concise, real code examples. Reply in JSON only.'
  )
  if (!result) return null
  return {
    id: Date.now(),
    lang,
    diff: difficulty,
    xp: result.xp || 120,
    label: result.label || 'Generated',
    code: result.code || '',
    explanation: result.explanation || '',
    generated: true,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  AGENT 3 — Coach Agent
//  Analyzes error patterns and gives personalized drill tips
// ─────────────────────────────────────────────────────────────────────────────
export async function runCoachAgent({ kHeat, kErr, wpmHistory, langStats, sessions }) {
  const topErrors = Object.entries(kErr)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k, v]) => `'${k}' (${v} errors)`)
    .join(', ')

  const topKeys = Object.entries(kHeat)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k, v]) => `'${k}' (${v} hits)`)
    .join(', ')

  const avgWpm = wpmHistory.length
    ? Math.round(wpmHistory.reduce((a, b) => a + b, 0) / wpmHistory.length)
    : 0

  const weakLangs = Object.entries(langStats)
    .sort((a, b) => a[1].wpm - b[1].wpm)
    .slice(0, 2)
    .map(([l, s]) => `${l} (${s.wpm} wpm, ${s.acc}% acc)`)
    .join(', ')

  return callClaude(
    `Developer typing stats:\n- Sessions: ${sessions}\n- Avg WPM: ${avgWpm}\n- Most errors on: ${topErrors || 'none yet'}\n- Most used keys: ${topKeys || 'none yet'}\n- Weakest languages: ${weakLangs || 'none yet'}\n\nJSON: {"grade":"A|B|C|D|F","summary":"2 sentences overall assessment","top_weakness":"one specific key or pattern to fix","drill1":"specific exercise to improve (1 sentence)","drill2":"another specific exercise (1 sentence)","focus_lang":"which language to practice more and why (1 sentence)","encouragement":"one motivating sentence tailored to their stats"}`,
    'You are a developer typing coach. Give specific, actionable advice. Reply in JSON only.'
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  AGENT 4 — Adaptive Battle AI
//  Returns a dynamic opponent WPM that adapts to the player
// ─────────────────────────────────────────────────────────────────────────────
export async function runAdaptiveBattleAgent({ playerWpm, playerAcc, sessions, lastResult }) {
  const result = await callClaude(
    `Player stats:\n- Current WPM: ${playerWpm}\n- Accuracy: ${playerAcc}%\n- Sessions played: ${sessions}\n- Last battle result: ${lastResult || 'first battle'}\n\nDecide the opponent for the next battle. Make it challenging but beatable (should win ~40% of the time).\n\nJSON: {"opponent_name":"creative dev name","opponent_wpm":${Math.max(20, playerWpm - 10)} to ${playerWpm + 25},"personality":"one sentence describing the opponent's typing style","taunt":"a short trash talk message (1 sentence, friendly)","tip":"one tip the player can use to beat this opponent"}`,
    'You are a game designer creating fair but challenging AI opponents. Reply in JSON only.'
  )
  if (!result) {
    return {
      opponent_name: 'Bot_' + Math.floor(Math.random() * 999),
      opponent_wpm: Math.max(25, playerWpm + Math.floor(Math.random() * 20) - 5),
      personality: 'A balanced typist',
      taunt: "Let's see what you've got!",
      tip: 'Stay focused and keep your rhythm steady.',
    }
  }
  return result
}

// ─────────────────────────────────────────────────────────────────────────────
//  AGENT 5 — Error Explainer Agent
//  Real-time explanation when user mistypes a character
// ─────────────────────────────────────────────────────────────────────────────
export async function runErrorExplainerAgent({ expected, typed, context, lang }) {
  const surrounding = context.slice(Math.max(0, context.indexOf(expected) - 10), context.indexOf(expected) + 15)
  return callClaude(
    `The developer is typing ${lang} code and made a mistake.\nExpected character: '${expected}' (char code: ${expected.charCodeAt(0)})\nThey typed: '${typed}' (char code: ${typed.charCodeAt(0)})\nCode context: ...${surrounding}...\n\nJSON: {"why":"one sentence why this character appears here","common_mistake":"one sentence explaining the most common confusion around this character","memory_trick":"a short memorable tip to remember it next time","keyboard_tip":"physical keyboard tip if relevant, else null"}`,
    'You are a coding tutor explaining typing mistakes in code. Be brief and helpful. Reply in JSON only.'
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  AGENT 6 — Session Review Agent
//  Full debrief after completing a session
// ─────────────────────────────────────────────────────────────────────────────
export async function runSessionReviewAgent({ wpm, accuracy, errors, combo, snippet, duration, wpmHistory }) {
  const trend = wpmHistory.length >= 3
    ? wpmHistory.slice(-3).reduce((a, b) => a + b, 0) / 3
    : wpm
  const improving = trend >= (wpmHistory[0] || 0)

  return callClaude(
    `Session complete:\n- Snippet: "${snippet.label}" (${snippet.lang}, ${snippet.diff})\n- WPM: ${wpm}\n- Accuracy: ${accuracy}%\n- Errors: ${errors}\n- Best combo: ${combo}×\n- Duration: ${Math.round(duration)}s\n- Trend: ${improving ? 'improving' : 'declining'}\n\nJSON: {"grade":"A+|A|B+|B|C+|C|D|F","score":0-100,"headline":"short punchy result (5-8 words)","wpm_comment":"one sentence about their speed","accuracy_comment":"one sentence about their accuracy","combo_comment":"one sentence about their combo if notable, else null","code_insight":"one sentence about what the typed code snippet does in real dev work","next_challenge":"recommend what to try next (specific snippet type or mode)","encouragement":"one motivating closing sentence"}`,
    'You are a coding game coach giving a post-session debrief. Be encouraging and specific. Reply in JSON only.'
  )
}
