import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

// GET /api/scheduled  — lista agendamentos do usuário (ou todos se gestor)
export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const showAll = searchParams.get('showAll') === 'true'

  const dbUser = await prisma.user.findUnique({
    where:  { id: payload.id },
    select: { isManager: true },
  })
  const isManager = dbUser?.isManager ?? false

  const where = (isManager && showAll)
    ? {}
    : { userId: payload.id }

  const items = await prisma.scheduledTicket.findMany({
    where,
    include: {
      contact: { select: { id: true, name: true, number: true, profilePicUrl: true } },
      queue:   { select: { id: true, name: true, color: true } },
      user:    { select: { id: true, name: true } },
      ticket:  { select: { id: true, status: true } },
    },
    orderBy: { scheduledAt: 'asc' },
  })

  return NextResponse.json(items)
}

// POST /api/scheduled  — cria novo agendamento
export async function POST(req: NextRequest) {
  const payload = getTokenFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { contactId, message, scheduledAt, queueId } = body

  if (!contactId || !message?.trim() || !scheduledAt) {
    return NextResponse.json({ error: 'Campos obrigatórios: contactId, message, scheduledAt' }, { status: 400 })
  }

  const scheduled = await prisma.scheduledTicket.create({
    data: {
      contactId:   Number(contactId),
      userId:      payload.id,
      queueId:     queueId ? Number(queueId) : null,
      message:     message.trim(),
      scheduledAt: new Date(scheduledAt),
      status:      'PENDING',
    },
    include: {
      contact: { select: { id: true, name: true, number: true } },
      queue:   { select: { id: true, name: true, color: true } },
    },
  })

  return NextResponse.json(scheduled, { status: 201 })
}
