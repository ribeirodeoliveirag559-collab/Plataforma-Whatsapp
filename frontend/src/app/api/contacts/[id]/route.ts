import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

// GET /api/contacts/[id]
export async function GET(req: NextRequest, { params }: Params) {
  if (!getTokenFromRequest(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params

  const contact = await prisma.contact.findUnique({
    where: { id: Number(id) },
    include: { tags: { include: { tag: true } } },
  })
  if (!contact) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(contact)
}

// PATCH /api/contacts/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  if (!getTokenFromRequest(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  const allowed = ['name', 'observation', 'category', 'role', 'company', 'email', 'cpf', 'cnpj']
  const data: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) data[key] = body[key] ?? null
  }

  const contact = await prisma.contact.update({
    where: { id: Number(id) },
    data,
  })
  return NextResponse.json(contact)
}
