import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

async function requireManager(req: NextRequest) {
  const payload = getTokenFromRequest(req)
  if (!payload) return null
  const dbUser = await prisma.user.findUnique({ where: { id: payload.id }, select: { isManager: true } })
  return dbUser?.isManager ? payload : null
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireManager(req)) return NextResponse.json({ error: 'Acesso restrito a gestores' }, { status: 403 })

  const { id } = await params
  const { name, message } = await req.json()

  const data: Record<string, string> = {}
  if (name?.trim())    data.name    = name.trim().toLowerCase().replace(/\s+/g, '_')
  if (message?.trim()) data.message = message.trim()

  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 })

  try {
    const reply = await prisma.quickReply.update({ where: { id: Number(id) }, data })
    return NextResponse.json(reply)
  } catch {
    return NextResponse.json({ error: 'Nome já em uso ou registro não encontrado' }, { status: 409 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireManager(req)) return NextResponse.json({ error: 'Acesso restrito a gestores' }, { status: 403 })

  const { id } = await params
  await prisma.quickReply.delete({ where: { id: Number(id) } })
  return NextResponse.json({ ok: true })
}
