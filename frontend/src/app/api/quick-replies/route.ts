import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  if (!getTokenFromRequest(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''

  const where = search
    ? { name: { contains: search, mode: 'insensitive' as const } }
    : {}

  const replies = await prisma.quickReply.findMany({
    where,
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(replies)
}

export async function POST(req: NextRequest) {
  const payload = getTokenFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // Apenas gestores podem criar
  const dbUser = await prisma.user.findUnique({ where: { id: payload.id }, select: { isManager: true } })
  if (!dbUser?.isManager) return NextResponse.json({ error: 'Acesso restrito a gestores' }, { status: 403 })

  const { name, message } = await req.json()
  if (!name?.trim())    return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
  if (!message?.trim()) return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 })

  // Normaliza: sem espaços, minúsculo
  const cleanName = name.trim().toLowerCase().replace(/\s+/g, '_')

  try {
    const reply = await prisma.quickReply.create({
      data: { name: cleanName, message: message.trim() },
    })
    return NextResponse.json(reply, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Já existe uma resposta com esse nome' }, { status: 409 })
  }
}
