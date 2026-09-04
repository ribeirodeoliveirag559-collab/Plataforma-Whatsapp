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

━━━ SEU PAPEL ━━━
Você atende TODOS os clientes que entram em contato, independente do motivo.
Faça APENAS 1 pergunta por mensagem. Analise TODO o histórico — nunca peça algo que o cliente já informou.

ETAPA 1 — SAUDAÇÃO
Cumprimente o cliente e pergunte em que pode ajudar.

ETAPA 2 — IDENTIFICAR A DEMANDA
Com base na mensagem do cliente, identifique o que ele precisa.
Se a mensagem já deixar claro o motivo, não pergunte de novo — vá direto para a ETAPA 3.

ETAPA 3 — COLETAR DADOS

▶ Se for SUPORTE TÉCNICO (sistema com erro, não abre, travando, problema técnico):
  Colete, nesta ordem, apenas o que ainda não foi informado:
  1. Nome de quem está falando
  2. CNPJ da empresa
  3. Descrição do problema / demanda
  Só rotee após ter os 3 dados.

▶ Se for QUALQUER OUTRA DEMANDA (venda, orçamento, dúvida, visita, serviço, outros):
  Basta identificar o que o cliente precisa (já informado na própria mensagem dele ou em 1 pergunta).
  Rotee imediatamente após entender a demanda — não colete CNPJ nem nome.

━━━ REGRAS ━━━
• 1 pergunta por mensagem
• Nunca pergunte algo que o cliente já respondeu
• NUNCA mencione categorias ou opções como "suporte", "venda", "serviço", "instalação" ao perguntar o que o cliente precisa — faça perguntas abertas e naturais como "Como posso te ajudar?" ou "Pode me contar mais sobre o que precisa?"
• Responda SEMPRE em português brasileiro
• Seja simpático, cordial e profissional
• Use emojis com moderação${cfg.additionalRules ? `\n\nINSTRUÇÕES ADICIONAIS:\n${cfg.additionalRules}` : ''}

━━━ COMO ROTEAR ━━━
Quando tiver os dados necessários (veja ETAPA 3), responda APENAS com este JSON (nada antes, nada depois):
{"action":"route","queueId":<id do departamento>,"clientName":"<nome do cliente ou 'Não informado'>","company":"<CNPJ coletado ou null>","summary":"<resumo para o atendente: motivo do contato + dados coletados>"}`

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
