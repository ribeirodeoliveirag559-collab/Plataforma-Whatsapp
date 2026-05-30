import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

async function requireManager(req: NextRequest) {
  const payload = getTokenFromRequest(req)
  if (!payload) return null
  const user = await prisma.user.findUnique({ where: { id: payload.id }, select: { isManager: true } })
  return user?.isManager ? payload : null
}

/** Garante que existe exatamente 1 linha de configuração */
async function getOrCreateConfig() {
  const existing = await prisma.aIConfig.findFirst()
  if (existing) return existing
  return prisma.aIConfig.create({ data: {} })
}

export async function GET(req: NextRequest) {
  if (!getTokenFromRequest(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const config = await getOrCreateConfig()
  return NextResponse.json(config)
}

export async function PATCH(req: NextRequest) {
  if (!await requireManager(req)) return NextResponse.json({ error: 'Acesso restrito a gestores' }, { status: 403 })

  const body = await req.json()
  const config = await getOrCreateConfig()

  const allowed = [
    'porterName', 'companyName', 'companyCity', 'companyDescription',
    'businessHours', 'companyAddress', 'companyPhone',
    'greetingMessage', 'additionalRules', 'collectCompany',
  ]

  const data: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) data[key] = body[key]
  }

  const updated = await prisma.aIConfig.update({ where: { id: config.id }, data })
  return NextResponse.json(updated)
}
