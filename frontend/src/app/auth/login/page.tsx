'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import styles from './login.module.css'
import { LOGO_BASE64 } from '@/lib/logo'

/* ── Tipos da animação ── */
interface Tracer {
  x: number
  y: number
  speed: number
  angle: number
  life: number
  maxLife: number
  hue: number
}

function createTracer(w: number, h: number): Tracer {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    speed: 1.5 + Math.random(),
    angle: Math.floor(Math.random() * 4) * (Math.PI / 2),
    life: 0,
    maxLife: 100 + Math.random() * 200,
    hue: 200 + Math.random() * 60,
  }
}

function updateTracer(t: Tracer, w: number, h: number): Tracer {
  const nx = t.x + Math.cos(t.angle) * t.speed
  const ny = t.y + Math.sin(t.angle) * t.speed
  const nLife = t.life + 1
  if (nx < 0 || nx > w || ny < 0 || ny > h || nLife > t.maxLife) {
    return createTracer(w, h)
  }
  const nAngle =
    Math.random() < 0.04
      ? t.angle + (Math.random() < 0.5 ? 1 : -1) * (Math.PI / 2)
      : t.angle
  return { ...t, x: nx, y: ny, angle: nAngle, life: nLife }
}

/* ── Fundo animado de circuitos ── */
function CircuitBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId = 0
    let tracers: Tracer[] = []
    let w = 0
    let h = 0

    const resize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
      tracers = Array.from({ length: 40 }, () => createTracer(w, h))
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(232, 244, 255, 0.08)'
      ctx.fillRect(0, 0, w, h)
      tracers = tracers.map(t => {
        const next = updateTracer(t, w, h)
        ctx.beginPath()
        ctx.arc(next.x, next.y, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${next.hue}, 75%, 35%, 0.9)`
        ctx.fill()
        return next
      })
      animationId = requestAnimationFrame(animate)
    }

    window.addEventListener('resize', resize)
    resize()
    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        background: '#e8f4ff',
        zIndex: 0,
      }}
    />
  )
}

/* ── Página de Login ── */
export default function LoginPage() {
  const router = useRouter()
  const [form, setForm]     = useState({ username: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [splash, setSplash] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao fazer login')
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Exibe splash antes de navegar
      setSplash(true)
      setTimeout(() => router.push('/dashboard/atendimentos'), 2000)
    } catch {
      setError('Erro de conexão com o servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* ── Splash de entrada ── */}
      {splash && (
        <div className={styles.splash}>
          <div className={styles.splashRing} />
          <img src={LOGO_BASE64} alt="PHchat" className={styles.splashLogo} />
          <div className={styles.splashBar} />
        </div>
      )}

      <div className={styles.wrapper}>
        <CircuitBackground />

        <div className={styles.content}>
          {/* Formulário centralizado */}
          <form onSubmit={handleSubmit} className={styles.card}>
            <p className={styles.cardTitle}>Bem-vindo</p>
            <p className={styles.cardSubtitle}>Faça login para continuar</p>

            <div className={styles.field}>
              <label className={styles.label}>Usuário</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className={styles.input}
                placeholder="seu.usuario"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Senha</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className={styles.input}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className={styles.error}>{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={styles.button}
            >
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
          </form>

        </div>
      </div>
    </>
  )
}
