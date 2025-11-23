import type React from "react"
import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import localFont from "next/font/local"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
})

const irisFont = localFont({
  src: [{ path: "../public/fonts/SpecifyPERSONAL-ExpBold.ttf", weight: "800", style: "normal" }],
  variable: "--font-iris",
})

export const metadata: Metadata = {
  title: "Íris - Assistente de Jardinagem",
  description: "Assistente inteligente para gestão de jardinagem",
  generator: "v0.app",
  icons: { icon: "/img/irislogo.png" },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${poppins.variable} ${irisFont.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
