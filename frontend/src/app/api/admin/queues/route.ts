import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

async function requireManager(req: NextRequest) {
  const p = getTokenFromRequest(req)
  if (!p) return null
  const user = await prisma.user.findUnique({ where: { id: p.id } })
  return user?.isManager ? user : null
}

export async function GET(req: NextRequest) {
  if (!getTokenFromRequest(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const queues = await prisma.queue.findMany({
    where: { deletedAt: null }, orderBy: { order: 'asc' },
    include: { _count: { select: { tickets: true } } }
  })
  return NextResponse.json(queues)
}

export async function POST(req: NextRequest) {
  if (!await requireManager(req)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  const { name, color, greetingMessage, order } = await req.json()
  if (!name) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
  const queue = await prisma.queue.create({ data: { name, color: color || '#6366f1', greetingMessage, order: order || 0 } })
  return NextResponse.json(queue, { status: 201 })
}
