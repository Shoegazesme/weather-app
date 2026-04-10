"use client"

import { useState, useEffect } from "react"

interface WeatherData {
  temperature: number
  weatherCode: number
  windSpeed: number
  humidity: number
  isDay: boolean
  description: string
}

const weatherDescriptions: Record<number, string> = {
  0: "晴",
  1: "大部晴朗",
  2: "局部多云",
  3: "多云",
  45: "雾",
  48: "雾凇",
  51: "小毛毛雨",
  53: "毛毛雨",
  55: "大毛毛雨",
  61: "小雨",
  63: "中雨",
  65: "大雨",
  71: "小雪",
  73: "中雪",
  75: "大雪",
  80: "小阵雨",
  81: "阵雨",
  82: "大阵雨",
  95: "雷阵雨",
  96: "雷阵雨伴冰雹",
  99: "强雷阵雨伴冰雹",
}

async function fetchOpenMeteo(): Promise<WeatherData> {
  const res = await fetch(
    "https://api.open-meteo.com/v1/forecast?latitude=23.1291&longitude=113.2644&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,is_day&timezone=Asia/Shanghai"
  )
  const data = await res.json()
  if (data.error) throw new Error(data.reason || "Open-Meteo 请求失败")
  const current = data.current
  return {
    temperature: Math.round(current.temperature_2m),
    weatherCode: current.weather_code,
    windSpeed: current.wind_speed_10m,
    humidity: current.relative_humidity_2m,
    isDay: current.is_day === 1,
    description: weatherDescriptions[current.weather_code] || "未知",
  }
}

async function fetchWttrFallback(): Promise<WeatherData> {
  const res = await fetch("https://wttr.in/Guangzhou?format=j1")
  if (!res.ok) throw new Error("wttr.in 请求失败")
  const data = await res.json()
  const current = data.current_condition[0]
  const hour = new Date().getHours()
  const isDay = hour >= 6 && hour < 18
  const temp = Math.round(Number(current.temp_C))
  const humidity = Number(current.humidity)
  const windSpeed = Math.round(Number(current.windspeedKmph))
  const desc = current.lang_zh?.[0]?.value || current.weatherDesc?.[0]?.value || "未知"

  return {
    temperature: temp,
    weatherCode: 0,
    windSpeed: windSpeed,
    humidity: humidity,
    isDay: isDay,
    description: desc,
  }
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchWeather() {
      try {
        // 先试 Open-Meteo，失败则用 wttr.in
        try {
          const data = await fetchOpenMeteo()
          setWeather(data)
        } catch {
          const data = await fetchWttrFallback()
          setWeather(data)
        }
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "天气获取失败")
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
    const interval = setInterval(fetchWeather, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return { weather, loading, error }
}
