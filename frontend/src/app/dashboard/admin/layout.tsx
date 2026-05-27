'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
import { getStoredUser, isUserManager, type StoredUser } from '@/lib/permissions'
import s from '../dashboard.module.css'

type Status = 'loading' | 'allowed' | 'denied'

/** Decide o status com base no user */
function decide(user: StoredUser | null): Status {
  if (!user) return 'denied'
  // isManager ausente no localStorage (sessão antiga) → aguarda validação do servidor
  if (user.isManager === undefined) return 'loading'
  return isUserManager(user) ? 'allowed' : 'denied'
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    const stored = getStoredUser()
    if (!stored) { router.push('/auth/login'); return }

    const initial = decide(stored)
    setStatus(initial)

    // Sempre valida com o servidor para garantir permissões atualizadas
    const token = localStorage.getItem('token')
    if (!token) { setStatus('denied'); return }

    fetch('/api/auth', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(fresh => {
        if (!fresh?.id) {
          // Servidor não respondeu — mantém decisão local se já tínhamos isManager definido
          if (initial === 'loading') setStatus('denied')
          return
        }
        localStorage.setItem('user', JSON.stringify(fresh))
        setStatus(decide(fresh))
      })
      .catch(() => {
        if (initial === 'loading') setStatus('denied')
      })
  }, [router])

  if (status === 'loading') {
    return <div className={s.spinnerWrap}><div className={s.spinner} /></div>
  }

  if (status === 'denied') {
    return (
      <div className={s.container}>
        <div className={s.card} style={{ textAlign: 'center', padding: '60px 24px', maxWidth: 480, margin: '40px auto' }}>
          <div style={{
            display: 'inline-flex', padding: 18, borderRadius: 22, marginBottom: 16,
            background: 'linear-gradient(135deg, rgba(248, 113, 113, 0.18) 0%, rgba(239, 68, 68, 0.15) 100%)',
            border: '1px solid rgba(248, 113, 113, 0.4)',
            color: '#dc2626',
          }}>
            <ShieldAlert size={36} />
          </div>
          <h2 style={{ fontWeight: 700, color: '#1e293b', margin: '0 0 8px', fontSize: '1.25rem' }}>
            Acesso restrito
          </h2>
          <p style={{ color: '#64748b', margin: '0 0 20px', fontSize: '0.9rem' }}>
            Esta área é exclusiva para gestores. Procure um administrador para liberar seu acesso.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className={`${s.btn} ${s.btnPrimary}`}
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
