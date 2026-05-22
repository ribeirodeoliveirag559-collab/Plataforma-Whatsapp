'use client'
import { BarChart3 } from 'lucide-react'

export default function RelatoriosPage() {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-indigo-50 rounded-2xl p-6 mb-4">
        <BarChart3 size={40} className="text-indigo-500" />
      </div>
      <h2 className="text-xl font-semibold text-slate-800 mb-2">Relatórios</h2>
      <p className="text-slate-500 text-sm text-center max-w-sm">
        Em breve: relatórios de atendimentos por período, por departamento e por atendente.
      </p>
    </div>
  )
}
