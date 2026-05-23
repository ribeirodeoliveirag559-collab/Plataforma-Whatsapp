import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

async function requireManager(req: NextRequest) {
  const p = getTokenFromRequest(req)
  if (!p) return null
  const user = await prisma.user.findUnique({ where: { id: p.id } })
  return user?.isManager ? user : null
}

type Params = { params: Promise<{ id: string }> }

// PUT — editar usuário (inclui filas)
export async function PUT(req: NextRequest, { params }: Params) {
  if (!await requireManager(req)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  const { id } = await params
  const uid = Number(id)
  const { name, username, email, password, profileSlug, isManager, active, queueIds } = await req.json()

  const data: Record<string, unknown> = {
    ...(name       && { name }),
    ...(username   && { username }),
    ...(email !== undefined && { email: email || null }),
    ...(profileSlug && { profileSlug }),
    ...(isManager  !== undefined && { isManager }),
    ...(active     !== undefined && { active }),
  }
  if (password) data.passwordHash = await bcrypt.hash(password, 10)

  // Atualiza filas: remove tudo e recria
  await prisma.$transaction([
    prisma.user.update({ where: { id: uid }, data }),
    prisma.userQueue.deleteMany({ where: { userId: uid } }),
    ...(Array.isArray(queueIds) && queueIds.length > 0
      ? [prisma.userQueue.createMany({
          data: queueIds.map((qid: number) => ({ userId: uid, queueId: qid })),
          skipDuplicates: true,
        })]
      : []),
  ])

  const user = await prisma.user.findUnique({
    where:  { id: uid },
    select: {
      id: true, name: true, username: true, email: true,
      profileSlug: true, isManager: true, active: true,
      queues: { select: { queue: { select: { id: true, name: true, color: true } } } },
    },
  })

  return NextResponse.json({ ...user, queues: user!.queues.map(uq => uq.queue) })
}

// DELETE — desativar usuário
export async function DELETE(req: NextRequest, { params }: Params) {
  if (!await requireManager(req)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  const { id } = await params
  await prisma.user.update({ where: { id: Number(id) }, data: { active: false, deletedAt: new Date() } })
  return NextResponse.json({ ok: true })
}
