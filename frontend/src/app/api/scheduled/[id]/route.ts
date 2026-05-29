import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

// DELETE /api/scheduled/[id]  — cancela agendamento
export async function DELETE(req: NextRequest, { params }: Params) {
  const payload = getTokenFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  const item = await prisma.scheduledTicket.findUnique({ where: { id: Number(id) } })
  if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  if (item.userId !== payload.id) {
    const dbUser = await prisma.user.findUnique({ where: { id: payload.id }, select: { isManager: true } })
    if (!dbUser?.isManager) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  if (item.status !== 'PENDING') {
    return NextResponse.json({ error: 'Apenas agendamentos pendentes podem ser cancelados' }, { status: 400 })
  }

  const updated = await prisma.scheduledTicket.update({
    where: { id: Number(id) },
    data:  { status: 'CANCELLED' },
  })

  return NextResponse.json(updated)
}
