"use client"

import { useState, useEffect, useCallback, useRef } from "react"

export type PomodoroStatus = "idle" | "working" | "break" | "finished"

interface PomodoroRecord {
  date: string // YYYY-MM-DD
  completedAt: string // ISO string
  duration: number // minutes
}

interface PomodoroState {
  status: PomodoroStatus
  timeLeft: number // seconds
  totalWork: number // 今日完成的番茄数
  isRunning: boolean
}

const WORK_DURATION = 25 * 60
const BREAK_DURATION = 5 * 60
const STORAGE_KEY = "lakeside-pomodoro-records"

function getRecords(): PomodoroRecord[] {
  if (typeof window === "undefined") return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveRecord(record: PomodoroRecord) {
  const records = getRecords()
  records.push(record)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

function getTodayCount(): number {
  const today = new Date().toISOString().slice(0, 10)
  return getRecords().filter((r) => r.date === today).length
}

export function usePomodoro() {
  const [state, setState] = useState<PomodoroState>({
    status: "idle",
    timeLeft: WORK_DURATION,
    totalWork: 0,
    isRunning: false,
  })

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 加载今日完成数
  useEffect(() => {
    setState((s) => ({ ...s, totalWork: getTodayCount() }))
  }, [])

  // 倒计时
  useEffect(() => {
    if (!state.isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.timeLeft <= 1) {
          if (prev.status === "working") {
            // 工作结束，记录一个番茄
            const now = new Date()
            saveRecord({
              date: now.toISOString().slice(0, 10),
              completedAt: now.toISOString(),
              duration: 25,
            })
            const newCount = getTodayCount()
            return {
              status: "break",
              timeLeft: BREAK_DURATION,
              totalWork: newCount,
              isRunning: true,
            }
          } else {
            // 休息结束
            return {
              status: "finished",
              timeLeft: 0,
              totalWork: prev.totalWork,
              isRunning: false,
            }
          }
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 }
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [state.isRunning, state.status])

  const start = useCallback(() => {
    setState({
      status: "working",
      timeLeft: WORK_DURATION,
      totalWork: getTodayCount(),
      isRunning: true,
    })
  }, [])

  const pause = useCallback(() => {
    setState((s) => ({ ...s, isRunning: false }))
  }, [])

  const resume = useCallback(() => {
    setState((s) => ({ ...s, isRunning: true }))
  }, [])

  const reset = useCallback(() => {
    setState({
      status: "idle",
      timeLeft: WORK_DURATION,
      totalWork: getTodayCount(),
      isRunning: false,
    })
  }, [])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  return {
    ...state,
    start,
    pause,
    resume,
    reset,
    formatTime: () => formatTime(state.timeLeft),
    getRecords,
  }
}
