'use client'
import { BarChart3 } from 'lucide-react'
import s from '../dashboard.module.css'

export default function RelatoriosPage() {
  return (
    <div className={s.container}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', textAlign: 'center', padding: 24,
      }}>
        <div style={{
          width: 88, height: 88, borderRadius: 26, marginBottom: 22,
          background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.25) 0%, rgba(99, 102, 241, 0.18) 100%)',
          border: '1px solid rgba(167, 139, 250, 0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#6366f1',
          boxShadow: '0 10px 28px rgba(99, 102, 241, 0.25)',
        }}>
          <BarChart3 size={42} />
        </div>
        <h2 className={s.pageTitle} style={{ marginBottom: 8, fontSize: '1.5rem' }}>Relatórios</h2>
        <p style={{ color: '#64748b', fontSize: '0.9375rem', maxWidth: 400, margin: 0, fontWeight: 500 }}>
          Em breve: relatórios de atendimentos por período, por departamento e por atendente.
        </p>
      </div>
    </div>
  )
}
