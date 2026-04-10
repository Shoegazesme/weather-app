"use client"

import { useEffect, useRef, useState, useCallback } from "react"

export type SoundType = "lake" | "rain" | "fire" | "forest" | "ocean"

const SOUND_LABELS: Record<SoundType, string> = {
  lake: "湖水",
  rain: "雨声",
  fire: "篝火",
  forest: "森林",
  ocean: "海浪",
}

const SOUND_FILES: Record<SoundType, string> = {
  lake: "/sounds/lake.ogg",
  rain: "/sounds/rain.mp3",
  fire: "/sounds/campfire.mp3",
  forest: "/sounds/forest.mp3",
  ocean: "/sounds/ocean.mp3",
}

const FADE_INTERVAL = 30 // ms per step
const FADE_IN_STEP = 0.015 // slow, gentle fade in (~1s to reach 0.5)
const FADE_OUT_STEP = 0.04 // faster fade out (~0.6s)

export function useAmbientSound(isPlaying: boolean) {
  const [currentSound, setCurrentSound] = useState<SoundType>("lake")
  const [volume, setVolume] = useState(0.5)
  const [muted, setMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fadeRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const targetVolRef = useRef(0.5)

  targetVolRef.current = muted ? 0 : volume

  const clearFade = useCallback(() => {
    if (fadeRef.current) {
      clearInterval(fadeRef.current)
      fadeRef.current = null
    }
  }, [])

  const fadeOut = useCallback((audio: HTMLAudioElement, onDone?: () => void) => {
    clearFade()
    fadeRef.current = setInterval(() => {
      if (audio.volume > FADE_OUT_STEP) {
        audio.volume = Math.max(0, audio.volume - FADE_OUT_STEP)
      } else {
        audio.volume = 0
        audio.pause()
        clearFade()
        onDone?.()
      }
    }, FADE_INTERVAL)
  }, [clearFade])

  const fadeIn = useCallback((audio: HTMLAudioElement, target: number) => {
    clearFade()
    audio.volume = 0
    fadeRef.current = setInterval(() => {
      if (audio.volume < target - FADE_IN_STEP) {
        audio.volume = Math.min(1, audio.volume + FADE_IN_STEP)
      } else {
        audio.volume = target
        clearFade()
      }
    }, FADE_INTERVAL)
  }, [clearFade])

  const startSound = useCallback((type: SoundType) => {
    const oldAudio = audioRef.current

    const launch = () => {
      const audio = new Audio(SOUND_FILES[type])
      audio.loop = true
      audio.volume = 0
      audioRef.current = audio

      const target = targetVolRef.current
      audio.play().then(() => {
        fadeIn(audio, target)
      }).catch(() => {})
    }

    if (oldAudio && oldAudio.volume > 0) {
      // Crossfade: fade out old, then start new
      fadeOut(oldAudio, launch)
    } else {
      if (oldAudio) {
        oldAudio.pause()
        audioRef.current = null
      }
      launch()
    }
  }, [fadeIn, fadeOut])

  const stopSound = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    fadeOut(audio)
  }, [fadeOut])

  // Play / stop based on isPlaying
  useEffect(() => {
    if (isPlaying) {
      startSound(currentSound)
    } else {
      stopSound()
    }
    return () => {
      clearFade()
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [isPlaying, currentSound, startSound, stopSound, clearFade])

  // Volume / mute changes while playing
  useEffect(() => {
    const audio = audioRef.current
    if (audio && isPlaying && !fadeRef.current) {
      audio.volume = muted ? 0 : volume
    }
  }, [volume, muted, isPlaying])

  const switchSound = useCallback((type: SoundType) => {
    setCurrentSound(type)
  }, [])

  const toggleMute = useCallback(() => {
    setMuted((m) => !m)
  }, [])

  const adjustVolume = useCallback((v: number) => {
    setVolume(Math.max(0, Math.min(1, v)))
    if (v > 0) setMuted(false)
  }, [])

  return {
    currentSound,
    soundLabel: SOUND_LABELS[currentSound],
    switchSound,
    allSounds: Object.entries(SOUND_LABELS) as [SoundType, string][],
    volume,
    muted,
    toggleMute,
    adjustVolume,
  }
}
