/**
 * Porteiro IA — OpenAI GPT-4o-mini
 * Recepcionista que identifica o tipo de atendimento e coleta dados antes de rotear.
 */

import OpenAI from 'openai'
import prisma  from './prisma'

export function isPorterEnabled() {
  return process.env.PORTER_ENABLED !== 'false' && Boolean(process.env.GROQ_API_KEY)
}

export interface PorterResult {
  message: string
  route: { queueId: number; clientName: string; company: string | null; summary: string } | null
}

export async function runPorter(ticketId: number): Promise<PorterResult> {
  const openai = new OpenAI({
    apiKey:  process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  })

  const [rawConfig, queues, messages, ticket] = await Promise.all([
    prisma.aIConfig.findFirst(),
    prisma.queue.findMany({ where: { deletedAt: null }, select: { id: true, name: true }, orderBy: { order: 'asc' } }),
    prisma.message.findMany({ where: { ticketId, isDeleted: false }, orderBy: { createdAt: 'asc' } }),
    prisma.ticket.findUnique({ where: { id: ticketId }, select: { queueId: true } }),
  ])

  const alreadyRouted = !!ticket?.queueId

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
  }

  const userMsgCount = messages.filter(m => !m.fromMe).length

  /* Se tem saudação personalizada e é a 1ª mensagem do cliente, retorna ela direto */
  if (userMsgCount === 1 && cfg.greetingMessage.trim()) {
    return { message: cfg.greetingMessage.trim(), route: null }
  }

  /* Bloqueia roteamento antes de 3 trocas (garante coleta mínima de info) */
  const MIN_EXCHANGES = 3

  const history = messages.map(m => ({
    role:    m.fromMe ? ('assistant' as const) : ('user' as const),
    content: m.body || '',
  }))

  const companyBlock = [
    `Empresa: ${cfg.companyName}${cfg.companyCity ? ` — ${cfg.companyCity}` : ''}`,
    cfg.companyDescription && `Descrição: ${cfg.companyDescription}`,
    cfg.businessHours      && `Horário de atendimento: ${cfg.businessHours}`,
    cfg.companyAddress     && `Endereço: ${cfg.companyAddress}`,
    cfg.companyPhone       && `Telefone: ${cfg.companyPhone}`,
  ].filter(Boolean).join('\n')

  const queuesBlock = queues.map(q => `• ID ${q.id} — ${q.name}`).join('\n')

  const systemPrompt = `Você é ${cfg.porterName}, a recepcionista virtual da ${cfg.companyName}.

${companyBlock ? `INFORMAÇÕES DA EMPRESA:\n${companyBlock}\n` : ''}
DEPARTAMENTOS DISPONÍVEIS:
${queuesBlock}

━━━ FLUXO OBRIGATÓRIO ━━━
Faça APENAS 1 pergunta por mensagem. Analise TODO o histórico antes de responder — nunca peça algo que o cliente já informou.

ETAPA 1 — SAUDAÇÃO
Cumprimente o cliente e pergunte em que pode ajudar.

ETAPA 2 — IDENTIFICAR O TIPO DE ATENDIMENTO
Analise a mensagem do cliente e classifique automaticamente:
  (A) VENDA — interesse em comprar produto ou serviço
  (B) SUPORTE — problema técnico ou dúvida sobre sistema já adquirido
  (C) SERVIÇO — solicitação de instalação, configuração ou serviço

IMPORTANTE: Se o cliente JÁ mencionou palavras como "suporte", "problema", "erro", "não funciona", "comprar", "instalar", etc., identifique o tipo automaticamente e vá direto para a ETAPA 3. Pergunte o tipo SOMENTE se for completamente impossível identificar pela mensagem.

ETAPA 3 — COLETAR DADOS (conforme o tipo identificado)
Verifique o histórico — se o cliente já informou algum dado, NÃO peça de novo. Pergunte apenas o que ainda falta.

▶ Se VENDA:
  Dados necessários: produto de interesse
  Pergunte apenas o que ainda não foi informado.

▶ Se SUPORTE:
  Dados necessários: CNPJ + nome de quem fala + descrição do problema
  Pergunte apenas o que ainda não foi informado.

▶ Se SERVIÇO:
  Dados necessários: descrição do serviço/demanda + CPF ou CNPJ
  Pergunte apenas o que ainda não foi informado.

━━━ REGRAS ABSOLUTAS ━━━
• Faça 1 pergunta por mensagem
• Analise o histórico completo — se o cliente já disse o nome, CNPJ, problema ou tipo, NÃO pergunte de novo
• NUNCA rotee sem ter coletado TODOS os dados obrigatórios do tipo identificado
• Responda SEMPRE em português brasileiro
• Seja simpático, cordial e profissional
• Use emojis com moderação${cfg.additionalRules ? `\n\nINSTRUÇÕES ADICIONAIS:\n${cfg.additionalRules}` : ''}

━━━ COMO ROTEAR ━━━
Somente quando TODOS os dados obrigatórios estiverem coletados, responda APENAS com este JSON (nada antes, nada depois):
{"action":"route","queueId":<id do departamento>,"clientName":"<nome do cliente ou 'Não informado'>","company":"<empresa, CNPJ ou CPF coletado, ou null>","summary":"<resumo para o atendente: tipo de atendimento + dados coletados + demanda>"}`

  const completion = await openai.chat.completions.create({
    model:       'openai/gpt-oss-20b',
    max_tokens:  500,
    temperature: 0.4,
    messages:    [
      { role: 'system', content: systemPrompt },
      ...history,
    ],
  })

  const text = (completion.choices[0].message.content || '').trim()

  /* Extrai JSON de roteamento — só roteia após mínimo de trocas e se ainda não foi roteado */
  const jsonMatch = userMsgCount >= MIN_EXCHANGES && !alreadyRouted
    ? text.match(/\{[^{}]*"action"\s*:\s*"route"[^{}]*\}/)
    : null
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[0]) as {
        queueId: number; clientName: string; company: string | null; summary: string
      }
      const queueName = queues.find(q => q.id === data.queueId)?.name || 'Atendimento'
      return {
        message: `Perfeito, ${data.clientName}! 😊 Já anotei tudo aqui. Vou encaminhar você para nossa equipe de *${queueName}* — em breve um atendente vai te chamar!`,
        route:   { queueId: data.queueId, clientName: data.clientName, company: data.company ?? null, summary: data.summary },
      }
    } catch { /* fallback para texto normal */ }
  }

  return { message: text, route: null }
}
