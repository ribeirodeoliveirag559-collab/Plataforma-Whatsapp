import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { signToken, getTokenFromRequest } from '@/lib/auth'

// POST /api/auth — login
export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
        active: true,
        deletedAt: null
      },
      include: {
        defaultQueue: { select: { id: true, name: true, color: true } },
      }
    })

    let userQueues: { queue: { id: number; name: string; color: string } }[] = []
    if (user) {
      try {
        userQueues = await prisma.userQueue.findMany({
          where:  { userId: user.id },
          select: { queue: { select: { id: true, name: true, color: true } } },
        })
      } catch {
        userQueues = []
      }
    }

    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 })

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })

    const token = signToken({ id: user.id, username: user.username, profileSlug: user.profileSlug })

    return NextResponse.json({
      token,
      user: {
        id:             user.id,
        name:           user.name,
        username:       user.username,
        email:          user.email,
        profileSlug:    user.profileSlug,
        avatar:         user.avatar,
        isManager:      user.isManager,
        defaultQueueId: user.defaultQueueId,
        defaultQueue:   user.defaultQueue,
        queues:         userQueues.map(uq => uq.queue),
      }
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// GET /api/auth — me
export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: {
      id: true, name: true, username: true, email: true,
      profileSlug: true, avatar: true, isManager: true,
      defaultQueueId: true,
      defaultQueue: { select: { id: true, name: true, color: true } },
    }
  })

  if (!user) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  let userQueues: { queue: { id: number; name: string; color: string } }[] = []
  try {
    userQueues = await prisma.userQueue.findMany({
      where:  { userId: payload.id },
      select: { queue: { select: { id: true, name: true, color: true } } },
    })
  } catch {
    userQueues = []
  }

  return NextResponse.json({
    ...user,
    queues: userQueues.map(uq => uq.queue),
  })
}
