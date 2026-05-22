import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  if (!getTokenFromRequest(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params

  const ticket = await prisma.ticket.findUnique({
    where: { id: Number(id) },
    include: { contact: true, queue: true, user: { select: { id: true, name: true, avatar: true } } }
  })
  if (!ticket) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(ticket)
}

export async function PUT(req: NextRequest, { params }: Params) {
  if (!getTokenFromRequest(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  const ticket = await prisma.ticket.update({
    where: { id: Number(id) },
    data: {
      ...(body.status && { status: body.status, closedAt: body.status === 'CLOSED' ? new Date() : null }),
      ...(body.queueId !== undefined && { queueId: body.queueId }),
      ...(body.userId !== undefined && { userId: body.userId }),
      ...(body.aiSummary && { aiSummary: body.aiSummary })
    },
    include: { contact: true, queue: true, user: { select: { id: true, name: true, avatar: true } } }
  })
  return NextResponse.json(ticket)
}
