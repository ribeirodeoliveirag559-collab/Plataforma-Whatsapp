import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

async function requireManager(req: NextRequest) {
  const p = getTokenFromRequest(req)
  if (!p) return null
  const user = await prisma.user.findUnique({ where: { id: p.id } })
  if (!user?.isManager) return null
  return user
}

// GET — listar usuários
export async function GET(req: NextRequest) {
  if (!await requireManager(req)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const users = await prisma.user.findMany({
    where:   { deletedAt: null },
    select:  {
      id: true, name: true, username: true, email: true,
      profileSlug: true, active: true, isManager: true,
      defaultQueueId: true, createdAt: true,
      defaultQueue: { select: { id: true, name: true, color: true } },
      queues: { select: { queue: { select: { id: true, name: true, color: true } } } },
    },
    orderBy: { name: 'asc' },
  })

  // Flatten queues
  const result = users.map(u => ({
    ...u,
    queues: u.queues.map(uq => uq.queue),
  }))

  return NextResponse.json({ users: result })
}

// POST — criar usuário
export async function POST(req: NextRequest) {
  if (!await requireManager(req)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { name, username, email, password, profileSlug, isManager, queueIds } = await req.json()

  if (!name || !username || !password)
    return NextResponse.json({ error: 'Nome, usuário e senha são obrigatórios' }, { status: 400 })

  const exists = await prisma.user.findFirst({ where: { OR: [{ username }, ...(email ? [{ email }] : [])] } })
  if (exists) return NextResponse.json({ error: 'Usuário ou e-mail já existe' }, { status: 409 })

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      name, username, email: email || null, passwordHash,
      profileSlug: profileSlug || 'user',
      isManager:   isManager || false,
      queues: {
        create: (queueIds ?? []).map((qid: number) => ({ queueId: qid })),
      },
    },
    select: {
      id: true, name: true, username: true, email: true,
      profileSlug: true, isManager: true, active: true,
      queues: { select: { queue: { select: { id: true, name: true, color: true } } } },
    },
  })

  return NextResponse.json({ ...user, queues: user.queues.map(uq => uq.queue) }, { status: 201 })
}
