"use client"

import { useState, useEffect } from "react"

interface PomodoroRecord {
  date: string
  completedAt: string
  duration: number
}

interface ReviewProps {
  getRecords: () => PomodoroRecord[]
  onClose: () => void
}

export default function Review({ getRecords, onClose }: ReviewProps) {
  const [tab, setTab] = useState<"week" | "month">("week")
  const records = getRecords()
  const now = new Date()

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthDays: string[] = []
  for (
    let d = new Date(monthStart);
    d.getMonth() === now.getMonth();
    d.setDate(d.getDate() + 1)
  ) {
    monthDays.push(d.toISOString().slice(0, 10))
  }

  const days = tab === "week" ? weekDays : monthDays
  const dailyCounts: Record<string, number> = {}
  records.forEach((r) => {
    dailyCounts[r.date] = (dailyCounts[r.date] || 0) + 1
  })

  const filtered = records.filter((r) => days.includes(r.date))
  const total = filtered.length
  const hours = (filtered.reduce((s, r) => s + r.duration, 0) / 60).toFixed(1)
  const active = days.filter((d) => (dailyCounts[d] || 0) > 0).length
  const max = Math.max(...days.map((d) => dailyCounts[d] || 0), 1)
  const labels = ["日", "一", "二", "三", "四", "五", "六"]

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div className="overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={tab === "week" ? "周回顾" : "月回顾"}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">
            {tab === "week" ? "周回顾" : "月回顾"}
          </span>
          <button onClick={onClose} className="foot-btn" aria-label="关闭回顾">
            关闭
          </button>
        </div>

        <div className="modal-tabs">
          {(["week", "month"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`tab ${tab === t ? "tab-on" : ""}`}
              role="tab"
              aria-selected={tab === t}
            >
              {t === "week" ? "本周" : "本月"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 modal-stats">
          {[
            { v: total, l: "番茄" },
            { v: hours, l: "小时" },
            { v: active, l: "活跃" },
          ].map((s) => (
            <div key={s.l} className="stat-box">
              <div className="stat-num">{s.v}</div>
              <div className="stat-lbl">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="chart-wrap">
          <div className="chart-bars">
            {days.map((day) => {
              const c = dailyCounts[day] || 0
              const h = c > 0 ? (c / max) * 100 : 3
              const d = new Date(day + "T00:00:00")
              const today = day === now.toISOString().slice(0, 10)
              return (
                <div key={day} className="chart-col">
                  <span className="chart-count">
                    {c > 0 ? c : ""}
                  </span>
                  <div
                    className={`bar w-full ${
                      today ? "bar-today" : c > 0 ? "bar-fill" : "bar-empty"
                    }`}
                    style={{ height: `${h}%`, minHeight: 1 }}
                  />
                  {tab === "week" && (
                    <span className={`chart-day ${today ? "chart-day-today" : ""}`}>
                      {labels[d.getDay()]}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {total === 0 && (
          <p className="chart-empty">
            还没有记录
          </p>
        )}
      </div>
    </div>
  )
}
