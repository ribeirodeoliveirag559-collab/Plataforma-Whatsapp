import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LOGO_BASE64 } from '@/lib/logo'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PH Informática — Plataforma',
  description: 'Sistema de atendimento WhatsApp',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href={LOGO_BASE64} type="image/png" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
