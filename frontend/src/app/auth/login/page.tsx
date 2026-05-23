'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

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
  const outOfBounds = nx < 0 || nx > w || ny < 0 || ny > h || nLife > t.maxLife
  if (outOfBounds) return createTracer(w, h)
  const nAngle =
    Math.random() < 0.04
      ? t.angle + (Math.random() < 0.5 ? 1 : -1) * (Math.PI / 2)
      : t.angle
  return { ...t, x: nx, y: ny, angle: nAngle, life: nLife }
}

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
      ctx.fillStyle = 'rgba(5, 5, 16, 0.05)'
      ctx.fillRect(0, 0, w, h)
      tracers = tracers.map(t => {
        const next = updateTracer(t, w, h)
        ctx.beginPath()
        ctx.arc(next.x, next.y, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${next.hue}, 90%, 80%, 1)`
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
        background: '#050510',
        zIndex: 0,
      }}
    />
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
      router.push('/dashboard/atendimentos')
    } catch {
      setError('Erro de conexão com o servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      {/* Fundo animado de circuitos digitais */}
      <CircuitBackground />

      {/* Card de login — por cima da animação */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '384px', padding: '0 16px' }}>
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-500/30">
            <span className="text-white text-2xl font-bold">PH</span>
          </div>
          <h1 className="text-white text-2xl font-bold">PH Informática</h1>
          <p className="text-slate-400 text-sm mt-1">Plataforma de Atendimento</p>
        </div>

        {/* Form com efeito glass */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-8 shadow-2xl space-y-4 border border-white/10"
          style={{ background: 'rgba(15, 23, 42, 0.80)', backdropFilter: 'blur(12px)' }}
        >
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Usuário</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              className="w-full bg-slate-700/60 text-white rounded-lg px-4 py-2.5 border border-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-500"
              placeholder="seu.usuario"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Senha</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full bg-slate-700/60 text-white rounded-lg px-4 py-2.5 border border-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-500"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 transition-colors shadow-lg shadow-indigo-500/20"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
