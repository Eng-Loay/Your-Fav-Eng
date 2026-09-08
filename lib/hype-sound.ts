"use client"

/**
 * Small synthesized "hype" background loop for the live game screen — no
 * external audio asset needed (avoids licensing a real music track).
 * Uses the Web Audio API to arpeggiate a short energetic riff on a loop.
 */

let ctx: AudioContext | null = null
let stopFn: (() => void) | null = null
let started = false

function getCtx(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new AC()
  }
  return ctx
}

function scheduleLoop(audioCtx: AudioContext, master: GainNode) {
  const bpm = 128
  const beat = 60 / bpm
  // upbeat minor-key arcade arpeggio (A minor pentatonic-ish)
  const notes = [220, 261.63, 329.63, 261.63, 220, 261.63, 392, 329.63]
  let step = 0
  let cancelled = false

  const playNote = (time: number, freq: number, dur: number) => {
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = "square"
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(0.22, time + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur)
    osc.connect(gain)
    gain.connect(master)
    osc.start(time)
    osc.stop(time + dur + 0.02)

    // subtle kick on the downbeat for energy
    if (step % 4 === 0) {
      const kick = audioCtx.createOscillator()
      const kickGain = audioCtx.createGain()
      kick.type = "sine"
      kick.frequency.setValueAtTime(120, time)
      kick.frequency.exponentialRampToValueAtTime(45, time + 0.12)
      kickGain.gain.setValueAtTime(0.35, time)
      kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15)
      kick.connect(kickGain)
      kickGain.connect(master)
      kick.start(time)
      kick.stop(time + 0.16)
    }
  }

  let nextTime = audioCtx.currentTime + 0.05
  const lookahead = 0.15
  const interval = setInterval(() => {
    if (cancelled) return
    while (nextTime < audioCtx.currentTime + lookahead) {
      playNote(nextTime, notes[step % notes.length], beat * 0.9)
      nextTime += beat / 2
      step++
    }
  }, 50)

  return () => {
    cancelled = true
    clearInterval(interval)
  }
}

/** Start the looping hype track (idempotent). Safe to call speculatively — will
 * silently no-op if the browser blocks audio until a user gesture occurs; call
 * `resumeHypeMusicOnInteraction` to catch the first tap/click as a fallback. */
export function startHypeMusic() {
  if (started) return
  try {
    const audioCtx = getCtx()
    const master = audioCtx.createGain()
    master.gain.value = 0.5
    master.connect(audioCtx.destination)
    stopFn = scheduleLoop(audioCtx, master)
    started = true
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {})
    }
  } catch {
    // Web Audio unavailable — ignore, this is a cosmetic feature
  }
}

export function stopHypeMusic() {
  if (stopFn) stopFn()
  stopFn = null
  started = false
  if (ctx) {
    ctx.close().catch(() => {})
    ctx = null
  }
}

/** Attach a one-time listener so the very first tap/click anywhere resumes
 * audio if the browser's autoplay policy blocked it on mount. */
export function resumeHypeMusicOnInteraction() {
  if (typeof window === "undefined") return () => {}
  const handler = () => {
    startHypeMusic()
    if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {})
  }
  window.addEventListener("pointerdown", handler, { once: true })
  window.addEventListener("keydown", handler, { once: true })
  return () => {
    window.removeEventListener("pointerdown", handler)
    window.removeEventListener("keydown", handler)
  }
}
