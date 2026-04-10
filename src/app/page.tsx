"use client"

import { useState } from "react"
import Image from "next/image"
import { useWeather } from "@/hooks/useWeather"
import { usePomodoro } from "@/hooks/usePomodoro"
import { useAmbientSound, SoundType } from "@/hooks/useAmbientSound"
import Review from "@/components/Review"

type Scene = "cabin" | "study"

const SCENES: Record<Scene, { day: string; night: string; label: string }> = {
  cabin: { day: "/images/cabin-day.png", night: "/images/cabin-night.png", label: "湖畔小屋" },
  study: { day: "/images/study-day.png", night: "/images/study-night.png", label: "书房" },
}

function IconSwap() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 3l2.5 2.5L11 8" />
      <path d="M2.5 5.5h11" />
      <path d="M5 13l-2.5-2.5L5 8" />
      <path d="M13.5 10.5h-11" />
    </svg>
  )
}

export default function Home() {
  const { weather, loading, error } = useWeather()
  const pomodoro = usePomodoro()
  const [showReview, setShowReview] = useState(false)
  const [manualMode, setManualMode] = useState<"day" | "night" | null>(null)
  const [scene, setScene] = useState<Scene>("cabin")

  const isDay = manualMode !== null
    ? manualMode === "day"
    : (weather?.isDay ?? true)

  const isPlaying = (pomodoro.status === "working" || pomodoro.status === "break") && pomodoro.isRunning

  const {
    currentSound, soundLabel, switchSound, allSounds,
    volume, muted, toggleMute, adjustVolume,
  } = useAmbientSound(isPlaying)

  const statusText =
    pomodoro.status === "idle"
      ? "FOCUS"
      : pomodoro.status === "working"
        ? "FOCUSING"
        : pomodoro.status === "break"
          ? "REST"
          : "DONE"

  const labelClass =
    pomodoro.status === "working"
      ? "t-label-work"
      : pomodoro.status === "break"
        ? "t-label-break"
        : ""

  const C = 2 * Math.PI * 64
  const total = pomodoro.status === "working" ? 25 * 60 : 5 * 60
  const pct =
    pomodoro.status === "idle" || pomodoro.status === "finished"
      ? 0
      : 1 - pomodoro.timeLeft / total
  const offset = C * (1 - pct)

  const toggleDayNight = () => {
    if (manualMode === null) {
      setManualMode(isDay ? "night" : "day")
    } else {
      setManualMode(manualMode === "day" ? "night" : "day")
    }
  }

  const toggleScene = () => {
    setScene(scene === "cabin" ? "study" : "cabin")
  }

  const imgSrc = isDay ? SCENES[scene].day : SCENES[scene].night
  const ambientClass = `ambient-${scene}-${isDay ? "day" : "night"}`
  const sceneAlt = `${SCENES[scene].label} — ${isDay ? "白天" : "夜晚"}`

  return (
    <div className="relative h-screen w-screen overflow-hidden select-none">
      <div className={`ambient ${ambientClass}`} />

      <main className="relative z-10 flex items-center justify-center h-full">
        <div className="shell" role="region" aria-label="湖畔小屋 — 天气与番茄钟">
          {/* Scene */}
          <div className="scene">
            <Image
              src={imgSrc}
              alt={sceneAlt}
              fill
              className="object-cover object-center"
              sizes="360px"
              quality={75}
              priority
            />
            <div className="scene-fade" />

            {/* Toolbar */}
            <div className="scene-toolbar">
              <button
                className="dn-toggle"
                onClick={toggleDayNight}
                role="switch"
                aria-checked={!isDay}
                aria-label={isDay ? "切换到夜晚模式" : "切换到白天模式"}
                data-night={!isDay}
              >
                <span className="dn-thumb">
                  {/* Sun */}
                  <svg className="dn-icon dn-sun" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="8" cy="8" r="3" fill="currentColor" />
                    <line x1="8" y1="1.5" x2="8" y2="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="8" y1="13" x2="8" y2="14.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="1.5" y1="8" x2="3" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="13" y1="8" x2="14.5" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="3.4" y1="3.4" x2="4.5" y2="4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="11.5" y1="11.5" x2="12.6" y2="12.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="3.4" y1="12.6" x2="4.5" y2="11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="11.5" y1="4.5" x2="12.6" y2="3.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  {/* Moon */}
                  <svg className="dn-icon dn-moon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M13 9.5A5.5 5.5 0 0 1 6.5 3 5.5 5.5 0 1 0 13 9.5Z" fill="currentColor" />
                  </svg>
                </span>
              </button>
              <button
                className="scene-btn"
                onClick={toggleScene}
                aria-label={scene === "cabin" ? "切换到书房场景" : "切换到湖畔场景"}
              >
                <IconSwap />
              </button>
            </div>

            <div className="weather" aria-label="天气信息">
              {loading && (
                <div className="flex flex-col gap-1.5" aria-label="加载天气中">
                  <div className="skel" style={{ width: 60, height: 36 }} />
                  <div className="skel" style={{ width: 80, height: 12 }} />
                </div>
              )}
              {error && (
                <span role="alert" style={{ fontSize: 10, color: "rgba(255,100,80,0.5)" }}>
                  {error}
                </span>
              )}
              {weather && (
                <>
                  <div>
                    <div className="weather-temp" aria-label={`温度 ${weather.temperature} 度`}>{weather.temperature}°</div>
                    <div className="weather-desc">
                      {weather.description} · 广州
                    </div>
                  </div>
                  <div>
                    <div className="weather-meta">湿度 {weather.humidity}%</div>
                    <div className="weather-meta" style={{ marginTop: 1 }}>
                      风速 {weather.windSpeed} km/h
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Timer */}
          <div className="timer" role="timer" aria-label="番茄钟" aria-live="polite">
            <div className="ring-wrap">
              <svg viewBox="0 0 148 148" aria-hidden="true">
                <circle
                  cx="74" cy="74" r="64"
                  fill="none" strokeWidth="1" className="ring-track"
                />
                {pomodoro.status !== "idle" && pomodoro.status !== "finished" && (
                  <circle
                    cx="74" cy="74" r="64"
                    fill="none" strokeWidth="1.5" strokeLinecap="round"
                    className={pomodoro.status === "working" ? "ring-work" : "ring-break"}
                    strokeDasharray={C}
                    strokeDashoffset={offset}
                  />
                )}
              </svg>
              <div className="relative text-center">
                <div className="t-digits" aria-label={`剩余时间 ${pomodoro.formatTime()}`}>{pomodoro.formatTime()}</div>
                <div className={`t-label ${labelClass}`}>{statusText}</div>
              </div>
            </div>

            <div className="controls">
              {pomodoro.status === "idle" || pomodoro.status === "finished" ? (
                <button onClick={pomodoro.start} className="btn btn-main" aria-label="开始专注">
                  开始
                </button>
              ) : (
                <>
                  <button
                    onClick={pomodoro.isRunning ? pomodoro.pause : pomodoro.resume}
                    className="btn btn-main"
                    aria-label={pomodoro.isRunning ? "暂停计时" : "继续计时"}
                  >
                    {pomodoro.isRunning ? "暂停" : "继续"}
                  </button>
                  <button onClick={pomodoro.reset} className="btn btn-ghost" aria-label="重置计时器">
                    重置
                  </button>
                </>
              )}
            </div>

            {isPlaying && (
              <div className="playing-tag" aria-live="polite">
                <span className="playing-dot" aria-hidden="true" />
                {soundLabel}
              </div>
            )}
          </div>

          {/* Sep + Sounds — only when pomodoro is active */}
          {pomodoro.status !== "idle" && pomodoro.status !== "finished" && (
            <>
            <div className="sep" aria-hidden="true" />

          {/* Sounds + Volume — only when pomodoro is active */}
            <div className="sounds-section">
            <div className="sounds" role="radiogroup" aria-label="白噪音选择">
              {allSounds.map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => switchSound(type as SoundType)}
                  className={`snd ${currentSound === type ? "snd-on" : ""}`}
                  role="radio"
                  aria-checked={currentSound === type}
                  aria-label={label}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="vol-control">
              <button
                className="vol-mute"
                onClick={toggleMute}
                aria-label={muted ? "取消静音" : "静音"}
              >
                {muted ? "OFF" : Math.round(volume * 100)}
              </button>
              <div className="vol-track">
                <div
                  className="vol-fill"
                  style={{ width: `${muted ? 0 : volume * 100}%` }}
                  aria-hidden="true"
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={muted ? 0 : Math.round(volume * 100)}
                  onChange={(e) => adjustVolume(Number(e.target.value) / 100)}
                  className="vol-input"
                  aria-label="音量"
                />
              </div>
            </div>
          </div>
          </>
          )}

          {/* Footer */}
          <div className="foot">
            <span className="foot-text" aria-label={`今日完成 ${pomodoro.totalWork} 个番茄`}>
              {pomodoro.totalWork} 个番茄
            </span>
            <button onClick={() => setShowReview(true)} className="foot-btn" aria-label="查看回顾">
              回顾
            </button>
          </div>
        </div>
      </main>

      {showReview && (
        <Review
          getRecords={pomodoro.getRecords}
          onClose={() => setShowReview(false)}
        />
      )}
    </div>
  )
}
