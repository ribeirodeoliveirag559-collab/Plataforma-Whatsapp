'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

function CircuitBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let width = 0
    let height = 0

    class Tracer {
      x: number = 0
      y: number = 0
      speed: number = 0
      angle: number = 0
      life: number = 0
      maxLife: number = 0
      hue: number = 0

      constructor() {
        this.reset()
      }

      reset() {
        this.x = Math.random() * width
        this.y = Math.random() * height
        this.speed = 1.5 + Math.random()
        this.angle = Math.floor(Math.random() * 4) * (Math.PI / 2)
        this.life = 0
        this.maxLife = 100 + Math.random() * 200
        this.hue = 200 + Math.random() * 60
      }

      update() {
        this.x += Math.cos(this.angle) * this.speed
        this.y += Math.sin(this.angle) * this.speed
        this.life++

        if (Math.random() < 0.04) {
          this.angle += (Math.random() < 0.5 ? 1 : -1) * (Math.PI / 2)
        }

        if (
          this.x < 0 || this.x > width ||
          this.y < 0 || this.y > height ||
          this.life > this.maxLife
        ) {
          this.reset()
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath()
        ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${this.hue}, 90%, 80%, 1)`
        ctx.fill()
      }
    }

    let tracers: Tracer[] = []

    function setSize() {
      width = canvas!.width = window.innerWidth
      height = canvas!.height = window.innerHeight
    }

    function init() {
      setSize()
      tracers = []
      for (let i = 0; i < 40; i++) {
        tracers.push(new Tracer())
      }
    }

    function animate() {
      ctx!.fillStyle = 'rgba(5, 5, 16, 0.05)'
      ctx!.fillRect(0, 0, width, height)
      tracers.forEach(t => {
        t.update()
        t.draw(ctx!)
      })
      animationId = requestAnimationFrame(animate)
    }

    window.addEventListener('resize', init)
    init()
    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', init)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ background: '#050510' }}
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
        body: JSON.stringify(form)
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
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Fundo animado de circuitos digitais */}
      <CircuitBackground />

      {/* Card de login — por cima da animação */}
      <div className="relative z-10 w-full max-w-sm px-4">
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
          style={{ background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(12px)' }}
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
