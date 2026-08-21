import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'
import * as evolution from '@/lib/evolution'

async function requireManager(req: NextRequest) {
  const payload = getTokenFromRequest(req)
  if (!payload) return null
  const user = await prisma.user.findUnique({ where: { id: payload.id }, select: { isManager: true } })
  return user?.isManager ? payload : null
}

/** GET /api/admin/whatsapp — status + QR code */
export async function GET(req: NextRequest) {
  if (!await requireManager(req)) return NextResponse.json({ error: 'Acesso restrito a gestores' }, { status: 403 })

  const configured = evolution.isConfigured()
  if (!configured) {
    return NextResponse.json({ configured: false, state: 'not_configured' })
  }

  const { state } = await evolution.getConnectionState()

  let qr: { base64?: string; code?: string } | null = null
  if (state === 'close' || state === 'connecting') {
    qr = await evolution.getQRCode()
  }

  return NextResponse.json({
    configured:   true,
    state,        // 'open' | 'close' | 'connecting'
    qr,
    instance:     evolution.INSTANCE,
    webhookUrl:   `${process.env.NEXT_PUBLIC_URL || req.headers.get('origin') || ''}/api/webhook/whatsapp${process.env.WEBHOOK_SECRET ? `?secret=${process.env.WEBHOOK_SECRET}` : ''}`,
    porterEnabled: Boolean(process.env.OPENAI_API_KEY),
  })
}

/** POST /api/admin/whatsapp — ações (connect, logout, create) */
export async function POST(req: NextRequest) {
  if (!await requireManager(req)) return NextResponse.json({ error: 'Acesso restrito a gestores' }, { status: 403 })

  const body = await req.json()
  const { action } = body
  const webhookUrl = `${process.env.NEXT_PUBLIC_URL || req.headers.get('origin') || ''}/api/webhook/whatsapp${process.env.WEBHOOK_SECRET ? `?secret=${process.env.WEBHOOK_SECRET}` : ''}`

  if (action === 'create') {
    const result = await evolution.createInstance(webhookUrl)
    return NextResponse.json(result)
  }

  if (action === 'set_webhook') {
    const result = await evolution.setWebhook(webhookUrl)
    return NextResponse.json(result)
  }

  if (action === 'logout') {
    const result = await evolution.logoutInstance()
    return NextResponse.json(result)
  }

  if (action === 'pairing_code') {
    const result = await evolution.requestPairingCode(body.phone)
    return NextResponse.json(result)
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}
