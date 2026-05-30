/**
 * Porteiro IA — OpenAI GPT-4o-mini
 * Configurações carregadas do banco (tabela ai_config)
 */

import OpenAI from 'openai'
import prisma  from './prisma'

export function isPorterEnabled() {
  return process.env.PORTER_ENABLED !== 'false' && Boolean(process.env.OPENAI_API_KEY)
}

export interface PorterResult {
  message: string
  route: { queueId: number; clientName: string; company: string | null; summary: string } | null
}

export async function runPorter(ticketId: number): Promise<PorterResult> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  /* Carrega config do porteiro + filas ativas em paralelo */
  const [rawConfig, queues, messages] = await Promise.all([
    prisma.aIConfig.findFirst(),
    prisma.queue.findMany({ where: { deletedAt: null }, select: { id: true, name: true }, orderBy: { order: 'asc' } }),
    prisma.message.findMany({ where: { ticketId, isDeleted: false }, orderBy: { createdAt: 'asc' } }),
  ])

  /* Valores padrão se ainda não configurou */
  const cfg = {
    porterName:         rawConfig?.porterName         || 'Sofia',
    companyName:        rawConfig?.companyName        || 'nossa empresa',
    companyCity:        rawConfig?.companyCity        || '',
    companyDescription: rawConfig?.companyDescription || '',
    businessHours:      rawConfig?.businessHours      || '',
    companyAddress:     rawConfig?.companyAddress     || '',
    companyPhone:       rawConfig?.companyPhone       || '',
    greetingMessage:    rawConfig?.greetingMessage    || '',
    additionalRules:    rawConfig?.additionalRules    || '',
    collectCompany:     rawConfig?.collectCompany     ?? true,
  }

  /* Histórico de mensagens */
  const history = messages.map(m => ({
    role:    m.fromMe ? ('assistant' as const) : ('user' as const),
    content: m.body || '',
  }))

  /* Monta bloco de informações da empresa */
  const companyBlock = [
    `Empresa: ${cfg.companyName}${cfg.companyCity ? ` — ${cfg.companyCity}` : ''}`,
    cfg.companyDescription && `Descrição: ${cfg.companyDescription}`,
    cfg.businessHours      && `Horário de atendimento: ${cfg.businessHours}`,
    cfg.companyAddress     && `Endereço: ${cfg.companyAddress}`,
    cfg.companyPhone       && `Telefone: ${cfg.companyPhone}`,
  ].filter(Boolean).join('\n')

  /* Monta lista de departamentos */
  const queuesBlock = queues.map(q => `• ID ${q.id} — ${q.name}`).join('\n')

  /* Regra de coleta de empresa */
  const collectCompanyRule = cfg.collectCompany
    ? '- Pergunte o nome da empresa (se for pessoa jurídica)'
    : '- Não precisa perguntar nome da empresa'

  const systemPrompt = `Você é ${cfg.porterName}, a recepcionista virtual da ${cfg.companyName}.

INFORMAÇÕES DA EMPRESA:
${companyBlock}

DEPARTAMENTOS DISPONÍVEIS:
${queuesBlock}

SUA MISSÃO:
1. Cumprimentar o cliente cordialmente
2. Coletar o nome do cliente
${collectCompanyRule}
3. Entender o motivo do contato
4. Encaminhar para o departamento correto

REGRAS DE CONDUTA:
- Seja simpático, use linguagem informal mas profissional
- Colete as informações naturalmente (1 pergunta de cada vez)
- Quando tiver nome + motivo suficiente, encaminhe — não fique pedindo mais informações
- Responda SEMPRE em português brasileiro
- Use emojis com moderação${cfg.additionalRules ? `\n\nINSTRUÇÕES ADICIONAIS:\n${cfg.additionalRules}` : ''}

AO DECIDIR ROTEAR (quando tiver nome + motivo):
Responda SOMENTE com este JSON (sem texto antes ou depois):
{"action":"route","queueId":<id>,"clientName":"<nome>","company":"<empresa ou null>","summary":"<resumo em 1 frase para o atendente>"}

Enquanto coleta informações, responda normalmente em texto.`

  /* Se tem mensagem de saudação personalizada e é a primeira mensagem do cliente */
  const isFirstMessage = messages.filter(m => !m.fromMe).length === 1
  if (isFirstMessage && cfg.greetingMessage.trim()) {
    return { message: cfg.greetingMessage.trim(), route: null }
  }

  const completion = await openai.chat.completions.create({
    model:       'gpt-4o-mini',
    max_tokens:  450,
    temperature: 0.7,
    messages:    [
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
        queueId: number; clientName: string; company: string | null; summary: string
      }
      const queueName = queues.find(q => q.id === data.queueId)?.name || 'Atendimento'
      return {
        message: `Obrigado, ${data.clientName}! 😊 Vou encaminhar você para nossa equipe de *${queueName}*. Em breve um atendente vai te atender!`,
        route:   { queueId: data.queueId, clientName: data.clientName, company: data.company ?? null, summary: data.summary },
      }
    } catch { /* fallback */ }
  }

  return { message: text, route: null }
}
