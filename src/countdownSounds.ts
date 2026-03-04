/**
 * Countdown sounds using mp3 files from public/sound_effects.
 * - Tick: loops clock-ticking-down.mp3 during last 10 seconds
 * - Alarm: alarm.mp3 when time's up
 * - Bomb: loud-explosion.mp3 when time's up
 */

import { assetPath } from './assetPath';

let tickAudio: HTMLAudioElement | null = null;

/** Start looping the tick sound. Call when entering last 10 seconds. */
export function startTickLoop(): void {
  try {
    stopTickLoop();
    tickAudio = new Audio(assetPath('/sound_effects/clock-ticking-down.mp3'));
    tickAudio.loop = true;
    tickAudio.play().catch(() => {});
  } catch {
    // Ignore
  }
}

/** Stop the tick loop. Call when time hits 0. */
export function stopTickLoop(): void {
  try {
    if (tickAudio) {
      tickAudio.pause();
      tickAudio.currentTime = 0;
      tickAudio = null;
    }
  } catch {
    // Ignore
  }
}

/** Play alarm sound when time's up. */
export function playAlarmEnd(): void {
  try {
    const audio = new Audio(assetPath('/sound_effects/alarm.mp3'));
    audio.play().catch(() => {});
  } catch {
    // Ignore
  }
}

/** Play bomb explosion when time's up. */
export function playBombEnd(): void {
  try {
    const audio = new Audio(assetPath('/sound_effects/loud-explosion.mp3'));
    audio.play().catch(() => {});
  } catch {
    // Ignore
  }
}
