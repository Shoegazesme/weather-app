import type { Metadata } from "next"
import { Geist_Mono } from "next/font/google"
import "./globals.css"

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "湖畔小屋",
  description: "天气 · 专注 · 白噪音",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className={`h-full antialiased ${geistMono.variable}`}>
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  )
}
