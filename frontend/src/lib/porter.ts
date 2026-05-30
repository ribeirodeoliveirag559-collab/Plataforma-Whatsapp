/**
 * Porteiro IA — OpenAI GPT-4o-mini
 *
 * Recebe o histórico de mensagens do ticket e decide:
 *  - Coletar mais informações do cliente (responde em texto)
 *  - Rotear para um departamento (retorna JSON de roteamento)
 *
 * Env vars:
 *   OPENAI_API_KEY = sk-...
 *   PORTER_ENABLED = true (default: true)
 */

import OpenAI from 'openai'
import prisma   from './prisma'

export function isPorterEnabled() {
  return process.env.PORTER_ENABLED !== 'false' && Boolean(process.env.OPENAI_API_KEY)
}

export interface PorterResult {
  message: string
  route: { queueId: number; clientName: string; company: string | null; summary: string } | null
}

export async function runPorter(ticketId: number): Promise<PorterResult> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  /* Carrega filas ativas do banco */
  const queues = await prisma.queue.findMany({
    where:   { deletedAt: null },
    select:  { id: true, name: true },
    orderBy: { order: 'asc' },
  })

  /* Carrega histórico completo do ticket */
  const messages = await prisma.message.findMany({
    where:   { ticketId, isDeleted: false },
    orderBy: { createdAt: 'asc' },
  })

  const history = messages.map(m => ({
    role:    m.fromMe ? ('assistant' as const) : ('user' as const),
    content: m.body || '',
  }))

  const systemPrompt = `Você é a recepcionista virtual da PH Informática, empresa de informática em Itumbiara-GO.

SUA MISSÃO: recepcionar o cliente, coletar o nome, entender o motivo do contato e encaminhar para o departamento certo.

DEPARTAMENTOS DISPONÍVEIS:
${queues.map(q => `• ID ${q.id} — ${q.name}`).join('\n')}

REGRAS DE CONDUTA:
- Cumprimente com "Olá! 😊 Seja bem-vindo à PH Informática!" na primeira mensagem
- Colete as informações de forma natural (1 pergunta de cada vez)
- Pergunte primeiro o nome, depois o motivo
- Se for empresa, pergunte o nome da empresa
- Seja objetivo, simpático e use português brasileiro
- Quando tiver nome + motivo suficiente, encaminhe — não fique pedindo mais informações

AO DECIDIR ROTEAR (quando tiver nome + motivo):
Responda SOMENTE com este JSON (sem texto antes ou depois):
{"action":"route","queueId":<id>,"clientName":"<nome do cliente>","company":"<nome da empresa ou null>","summary":"<resumo em 1 frase para o atendente>"}

Enquanto coleta informações, responda em texto normal.`

  const completion = await openai.chat.completions.create({
    model:      'gpt-4o-mini',
    max_tokens: 450,
    temperature: 0.7,
    messages:   [
      { role: 'system', content: systemPrompt },
      ...history,
    ],
  })

  const text = (completion.choices[0].message.content || '').trim()

  /* Tenta extrair JSON de roteamento */
  const jsonMatch = text.match(/\{[^{}]*"action"\s*:\s*"route"[^{}]*\}/)
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[0]) as {
        action: string; queueId: number
        clientName: string; company: string | null; summary: string
      }
      const queueName = queues.find(q => q.id === data.queueId)?.name || 'Atendimento'
      return {
        message: `Obrigado, ${data.clientName}! 😊 Vou encaminhar você para nossa equipe de *${queueName}*. Em breve um atendente vai te atender!`,
        route:   { queueId: data.queueId, clientName: data.clientName, company: data.company ?? null, summary: data.summary },
      }
    } catch { /* fallback para texto */ }
  }

  return { message: text, route: null }
}
