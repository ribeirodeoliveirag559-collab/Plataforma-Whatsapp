/**
 * Evolution API v2 client
 * Docs: https://doc.evolution-api.com
 *
 * Env vars needed:
 *   EVOLUTION_API_URL    = https://your-evolution.up.railway.app
 *   EVOLUTION_API_KEY    = your-global-api-key
 *   EVOLUTION_INSTANCE   = phinfo   (nome da instância)
 */

const BASE    = (process.env.EVOLUTION_API_URL || '').replace(/\/$/, '')
const API_KEY = process.env.EVOLUTION_API_KEY  || ''
export const INSTANCE = process.env.EVOLUTION_INSTANCE || 'phinfo'

function headers(json = true) {
  const h: Record<string, string> = { apikey: API_KEY }
  if (json) h['Content-Type'] = 'application/json'
  return h
}

export function isConfigured() {
  return Boolean(BASE && API_KEY)
}

/* ── instância ─────────────────────────────────────────────── */

export async function createInstance(webhookUrl: string) {
  const res = await fetch(`${BASE}/instance/create`, {
    method:  'POST',
    headers: headers(),
    body:    JSON.stringify({
      instanceName: INSTANCE,
      qrcode:       true,
      integration:  'WHATSAPP-BAILEYS',
      webhook: {
        enabled:          true,
        url:              webhookUrl,
        webhookByEvents:  false,
        webhookBase64:    false,
        events:           ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
      },
    }),
  })
  return res.json()
}

export async function getConnectionState(): Promise<{ state: 'open' | 'close' | 'connecting' }> {
  if (!isConfigured()) return { state: 'close' }
  try {
    const res = await fetch(`${BASE}/instance/connectionState/${INSTANCE}`, {
      headers: headers(false),
    })
    const data = await res.json()
    return { state: data?.instance?.state ?? 'close' }
  } catch {
    return { state: 'close' }
  }
}

export async function getQRCode(): Promise<{ base64?: string; code?: string; error?: string }> {
  try {
    const res = await fetch(`${BASE}/instance/connect/${INSTANCE}`, {
      headers: headers(false),
    })
    return res.json()
  } catch (e) {
    return { error: String(e) }
  }
}

export async function requestPairingCode(phone: string): Promise<{ code?: string; error?: string }> {
  try {
    const res = await fetch(`${BASE}/instance/pairingCode/${INSTANCE}`, {
      method:  'POST',
      headers: headers(),
      body:    JSON.stringify({ number: phone }),
    })
    return res.json()
  } catch (e) {
    return { error: String(e) }
  }
}

export async function logoutInstance() {
  const res = await fetch(`${BASE}/instance/logout/${INSTANCE}`, {
    method:  'DELETE',
    headers: headers(false),
  })
  return res.json()
}

/* ── mensagens ──────────────────────────────────────────────── */

/**
 * Envia mensagem de texto.
 * @param number  Número no formato E.164 sem + (ex: 556499999999)
 * @param text    Texto da mensagem
 */
export async function sendText(number: string, text: string) {
  if (!isConfigured()) {
    console.warn('[Evolution] Não configurado — mensagem não enviada via WhatsApp')
    return null
  }
  try {
    const res = await fetch(`${BASE}/message/sendText/${INSTANCE}`, {
      method:  'POST',
      headers: headers(),
      body:    JSON.stringify({ number, text }),
    })
    return res.json()
  } catch (e) {
    console.error('[Evolution] Erro ao enviar mensagem:', e)
    return null
  }
}

/* ── webhook ────────────────────────────────────────────────── */

export async function setWebhook(webhookUrl: string, webhookSecret?: string) {
  const webhookHeaders = webhookSecret ? { 'x-webhook-secret': webhookSecret } : undefined
  const res = await fetch(`${BASE}/webhook/set/${INSTANCE}`, {
    method:  'POST',
    headers: headers(),
    body:    JSON.stringify({
      webhook: {
        enabled:         true,
        url:             webhookUrl,
        webhookByEvents: false,
        webhookBase64:   false,
        events:          ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
        ...(webhookHeaders && { headers: webhookHeaders }),
      },
    }),
  })
  return res.json()
}

/* ── helpers ────────────────────────────────────────────────── */

/** Extrai número limpo do JID do WhatsApp: "5564999999999@s.whatsapp.net" → "5564999999999" */
export function jidToNumber(jid: string): string {
  return jid.split('@')[0]
}

/** Verifica se é mensagem de grupo */
export function isGroupJid(jid: string): boolean {
  return jid.endsWith('@g.us')
}
