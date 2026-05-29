import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  if (!getTokenFromRequest(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')
  const page = Number(searchParams.get('pageNumber') || 1)
  const pageSize = 20

  const where = search
    ? {
        OR: [
          { name:    { contains: search, mode: 'insensitive' as const } },
          { number:  { contains: search } },
          { company: { contains: search, mode: 'insensitive' as const } }
        ],
        deletedAt: null as null
      }
    : { deletedAt: null as null }

  const [contacts, count] = await Promise.all([
    prisma.contact.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: 'asc' },
      include: { tags: { include: { tag: true } } }
    }),
    prisma.contact.count({ where })
  ])

  return NextResponse.json({ contacts, count, hasMore: (page - 1) * pageSize + pageSize < count })
}

export async function POST(req: NextRequest) {
  if (!getTokenFromRequest(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { name, number, company, observation, category, role } = body

  if (!number?.trim()) return NextResponse.json({ error: 'Número é obrigatório' }, { status: 400 })
  if (!name?.trim())   return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })

  // Normaliza o número (remove espaços, hífens, parênteses)
  const cleanNumber = String(number).replace(/[\s\-().+]/g, '')

  const contact = await prisma.contact.create({
    data: {
      name:        name.trim(),
      number:      cleanNumber,
      company:     company?.trim()     || null,
      observation: observation?.trim() || null,
      category:    category            || null,
      role:        role?.trim()        || null,
    },
  })

  return NextResponse.json(contact, { status: 201 })
}
