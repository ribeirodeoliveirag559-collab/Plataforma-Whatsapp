import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

async function requireManager(req: NextRequest) {
  const p = getTokenFromRequest(req)
  if (!p) return null
  const user = await prisma.user.findUnique({ where: { id: p.id } })
  return user?.isManager ? user : null
}

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  if (!await requireManager(req)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  const { id } = await params
  const { name, color, greetingMessage, order } = await req.json()
  const queue = await prisma.queue.update({
    where: { id: Number(id) },
    data: { ...(name && { name }), ...(color && { color }), ...(greetingMessage !== undefined && { greetingMessage }), ...(order !== undefined && { order }) }
  })
  return NextResponse.json(queue)
}

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!await requireManager(req)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  const { id } = await params
  await prisma.queue.update({ where: { id: Number(id) }, data: { deletedAt: new Date() } })
  return NextResponse.json({ ok: true })
}
