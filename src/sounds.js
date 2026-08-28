let ctx = null
function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  return ctx
}
function beep({ freq=440, type='sine', gain=0.12, duration=0.06, delay=0 }={}) {
  try {
    const ac=getCtx(), osc=ac.createOscillator(), gn=ac.createGain()
    osc.connect(gn); gn.connect(ac.destination)
    osc.type=type; osc.frequency.setValueAtTime(freq, ac.currentTime+delay)
    gn.gain.setValueAtTime(gain, ac.currentTime+delay)
    gn.gain.exponentialRampToValueAtTime(0.001, ac.currentTime+delay+duration)
    osc.start(ac.currentTime+delay); osc.stop(ac.currentTime+delay+duration+0.01)
  } catch(e){}
}
export const SFX = {
  keyCorrect:  ()=>beep({freq:660, type:'sine',    gain:0.08, duration:0.05}),
  keyError:    ()=>beep({freq:180, type:'sawtooth',gain:0.14, duration:0.08}),
  combo10:     ()=>{beep({freq:880,gain:0.1,duration:0.07});beep({freq:1100,gain:0.1,duration:0.07,delay:0.08})},
  snippetDone: ()=>{[0,1,2].forEach(i=>beep({freq:440*Math.pow(1.26,i),gain:0.1,duration:0.1,delay:i*0.1}))},
  bossLife:    ()=>beep({freq:120, type:'sawtooth',gain:0.2, duration:0.15}),
  bossDone:    ()=>{[0,1,2,3].forEach(i=>beep({freq:220*Math.pow(1.5,i),gain:0.1,duration:0.12,delay:i*0.12}))},
  achieve:     ()=>{[0,1,2].forEach(i=>beep({freq:550+i*110,type:'triangle',gain:0.1,duration:0.1,delay:i*0.09}))},
}
