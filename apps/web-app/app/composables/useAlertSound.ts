let audioCtx: AudioContext | null = null

function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

// Resume on first user interaction
if (typeof document !== 'undefined') {
  const resume = () => {
    if (audioCtx?.state === 'suspended') {
      audioCtx.resume()
    }
    document.removeEventListener('click', resume)
    document.removeEventListener('keydown', resume)
  }
  document.addEventListener('click', resume)
  document.addEventListener('keydown', resume)
}

function playNote(freq: number, duration: number, delay: number, type: OscillatorType = 'sine', volume = 0.15) {
  const ctx = getContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = type
  osc.frequency.value = freq
  osc.connect(gain)
  gain.connect(ctx.destination)

  const start = ctx.currentTime + delay
  gain.gain.setValueAtTime(volume, start)
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration)

  osc.start(start)
  osc.stop(start + duration)
}

export function useAlertSound() {
  function playQuestComplete() {
    // Triumphant ascending arpeggio
    playNote(523, 0.15, 0, 'square', 0.1) // C5
    playNote(659, 0.15, 0.1, 'square', 0.1) // E5
    playNote(784, 0.15, 0.2, 'square', 0.1) // G5
    playNote(1047, 0.3, 0.3, 'square', 0.12) // C6
    // Sparkle
    playNote(1319, 0.1, 0.5, 'sine', 0.08) // E6
    playNote(1568, 0.15, 0.55, 'sine', 0.06) // G6
  }

  function playDonation() {
    // Epic fanfare
    playNote(392, 0.2, 0, 'square', 0.1) // G4
    playNote(523, 0.2, 0.15, 'square', 0.1) // C5
    playNote(659, 0.2, 0.3, 'square', 0.12) // E5
    playNote(784, 0.4, 0.45, 'square', 0.14) // G5
    // Shimmering high notes
    playNote(1047, 0.15, 0.7, 'sine', 0.08) // C6
    playNote(1319, 0.15, 0.8, 'sine', 0.07) // E6
    playNote(1568, 0.15, 0.9, 'sine', 0.06) // G6
    playNote(2093, 0.3, 1.0, 'sine', 0.05) // C7
  }

  function playLevelUp() {
    // Rising power-up melody
    playNote(440, 0.12, 0, 'square', 0.1) // A4
    playNote(554, 0.12, 0.1, 'square', 0.1) // C#5
    playNote(659, 0.12, 0.2, 'square', 0.1) // E5
    playNote(880, 0.25, 0.3, 'square', 0.12) // A5
    playNote(1047, 0.12, 0.5, 'sine', 0.08) // C6
    playNote(1319, 0.2, 0.58, 'sine', 0.07) // E6
    playNote(1760, 0.3, 0.7, 'sine', 0.06) // A6
  }

  function playNewViewer() {
    // Friendly welcome chime
    playNote(659, 0.15, 0, 'square', 0.08) // E5
    playNote(784, 0.15, 0.12, 'square', 0.08) // G5
    playNote(1047, 0.2, 0.24, 'square', 0.1) // C6
  }

  function playCouponTaken() {
    // Quick coin-like pickup sound
    playNote(880, 0.1, 0, 'square', 0.1) // A5
    playNote(1109, 0.1, 0.08, 'square', 0.1) // C#6
    playNote(1319, 0.2, 0.16, 'square', 0.08) // E6
  }

  function play(type: string) {
    if (type === 'QUEST_COMPLETE') {
      playQuestComplete()
    } else if (type === 'DONATION') {
      playDonation()
    } else if (type === 'LEVEL_UP') {
      playLevelUp()
    } else if (type === 'NEW_VIEWER') {
      playNewViewer()
    } else if (type === 'COUPON_TAKEN') {
      playCouponTaken()
    }
  }

  return { play }
}
