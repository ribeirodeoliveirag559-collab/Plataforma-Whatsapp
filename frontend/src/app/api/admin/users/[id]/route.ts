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

// PUT — editar usuário
export async function PUT(req: NextRequest, { params }: Params) {
  if (!await requireManager(req)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  const { id } = await params
  const { name, username, email, password, profileSlug, isManager, active, defaultQueueId } = await req.json()

  const data: Record<string, unknown> = {
    ...(name && { name }),
    ...(username && { username }),
    ...(email !== undefined && { email: email || null }),
    ...(profileSlug && { profileSlug }),
    ...(isManager !== undefined && { isManager }),
    ...(active !== undefined && { active }),
    ...(defaultQueueId !== undefined && { defaultQueueId: defaultQueueId || null }),
  }
  if (password) data.passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.update({
    where: { id: Number(id) },
    data,
    select: { id: true, name: true, username: true, email: true, profileSlug: true, isManager: true, active: true, defaultQueueId: true }
  })
  return NextResponse.json(user)
}

// DELETE — desativar usuário
export async function DELETE(req: NextRequest, { params }: Params) {
  if (!await requireManager(req)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  const { id } = await params
  await prisma.user.update({ where: { id: Number(id) }, data: { active: false, deletedAt: new Date() } })
  return NextResponse.json({ ok: true })
}
