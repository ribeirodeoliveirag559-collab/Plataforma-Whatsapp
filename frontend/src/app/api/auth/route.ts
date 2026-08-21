import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { signToken, getTokenFromRequest } from '@/lib/auth'

// POST /api/auth — login
export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    // Busca minimal para compatibilidade com schema antigo/novo
    const user = await prisma.user.findFirst({
      where: { OR: [{ username }, { email: username }] },
    })

    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 })
    if ((user as any).active === false) return NextResponse.json({ error: 'Usuário inativo' }, { status: 401 })

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })

    const profileSlug = (user as any).profileSlug ?? 'user'
    const token = signToken({ id: user.id, username: user.username, profileSlug })

    // Tenta buscar fila padrão e filas do usuário — não crítico
    let defaultQueue = null
    let userQueues: { id: number; name: string; color: string }[] = []
    try {
      const dq = await prisma.queue.findUnique({
        where:  { id: (user as any).defaultQueueId ?? 0 },
        select: { id: true, name: true, color: true },
      })
      defaultQueue = dq
    } catch { /* ignore */ }
    try {
      const uqs = await prisma.userQueue.findMany({
        where:  { userId: user.id },
        select: { queue: { select: { id: true, name: true, color: true } } },
      })
      userQueues = uqs.map((uq: any) => uq.queue)
    } catch { /* ignore */ }

    return NextResponse.json({
      token,
      user: {
        id:             user.id,
        name:           user.name,
        username:       user.username,
        email:          (user as any).email ?? null,
        profileSlug,
        avatar:         (user as any).avatar ?? null,
        isManager:      (user as any).isManager ?? false,
        defaultQueueId: (user as any).defaultQueueId ?? null,
        defaultQueue,
        queues:         userQueues,
      }
    })
  } catch (e) {
    console.error('[auth POST]', e)
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
