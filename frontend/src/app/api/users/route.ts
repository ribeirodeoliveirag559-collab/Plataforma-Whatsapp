import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  if (!getTokenFromRequest(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const users = await prisma.user.findMany({
    where: { active: true, deletedAt: null },
    select: { id: true, name: true, username: true, profileSlug: true, avatar: true, defaultQueueId: true }
  })
  return NextResponse.json({ users })
}
