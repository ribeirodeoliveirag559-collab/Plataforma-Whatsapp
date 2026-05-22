import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  if (!getTokenFromRequest(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const queueId = searchParams.get('queueId')
  const userId = searchParams.get('userId')
  const page = Number(searchParams.get('pageNumber') || 1)
  const pageSize = 20
  const skip = (page - 1) * pageSize

  const where: Record<string, unknown> = {}
  if (status) where.status = status.toUpperCase()
  if (queueId) where.queueId = Number(queueId)
  if (userId) where.userId = Number(userId)

  const [tickets, count] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        contact: { select: { id: true, name: true, number: true, profilePicUrl: true } },
        queue:   { select: { id: true, name: true, color: true } },
        user:    { select: { id: true, name: true, avatar: true } }
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSize
    }),
    prisma.ticket.count({ where })
  ])

  return NextResponse.json({ tickets, count, hasMore: skip + pageSize < count })
}

export async function POST(req: NextRequest) {
  if (!getTokenFromRequest(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json()

  const ticket = await prisma.ticket.create({
    data: {
      contactId: body.contactId,
      queueId: body.queueId || null,
      userId: body.userId || null,
      status: 'PENDING'
    },
    include: {
      contact: true,
      queue: true,
      user: { select: { id: true, name: true, avatar: true } }
    }
  })
  return NextResponse.json(ticket, { status: 201 })
}
