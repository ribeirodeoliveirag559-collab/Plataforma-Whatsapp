import Anthropic from '@anthropic-ai/sdk'
import prisma from '../../config/database'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Departamentos disponíveis
const QUEUES = [
  { id: 1, name: 'Vendas', description: 'Compra de produtos, orçamentos, preços' },
  { id: 9, name: 'Ordem de Serviço', description: 'Acompanhamento de OS abertas' },
  { id: 3, name: 'Suporte ao Clipp Pro', description: 'Suporte ao sistema Clipp Pro, erros, automação comercial' },
  { id: 6, name: 'Laboratório', description: 'Conserto de computador, notebook, impressora, monitor' },
  { id: 4, name: 'Solicitação de Serviço', description: 'Abertura de nova ordem de serviço' },
  { id: 2, name: 'Financeiro', description: 'Boletos, pagamentos, cobranças, faturas' },
]

interface CollectedInfo {
  clientName?: string
  company?: string
  reason?: string
  problemType?: string
  ready: boolean
  queueId?: number
  summary?: string
}

export const porterResponse = async (
  ticketId: number,
  messageHistory: { role: 'user' | 'assistant'; content: string }[]
): Promise<{ message: string; collected: CollectedInfo }> => {

  const systemPrompt = `Você é a porteira virtual da PH Informática, empresa de informática em Itumbiara-GO.
Sua função é coletar informações do cliente de forma simpática antes de encaminhar para o departamento correto.

DEPARTAMENTOS DISPONÍVEIS:
${QUEUES.map(q => `- ${q.name}: ${q.description}`).join('\n')}

INFORMAÇÕES A COLETAR (em ordem natural de conversa):
1. Nome do cliente
2. Nome da empresa (se for empresa)
3. Motivo do contato / descrição do problema
4. Tipo de problema (se técnico)

REGRAS:
- Seja simpático e profissional
- Colete as informações gradualmente, não faça todas as perguntas de uma vez
- Quando tiver informações suficientes, indique qual departamento vai encaminhar
- Responda em português brasileiro
- Seja breve e direto

Quando tiver informações suficientes, responda em JSON no formato:
{"action":"route","queueId":X,"summary":"Resumo para o atendente"}

Enquanto coleta informações, responda normalmente em texto.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 500,
    system: systemPrompt,
    messages: messageHistory
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  // Verificar se a IA decidiu rotear
  const routeMatch = text.match(/\{"action":"route".*\}/)
  if (routeMatch) {
    try {
      const routeData = JSON.parse(routeMatch[0])
      return {
        message: `Perfeito! Vou te encaminhar para nosso time de ${QUEUES.find(q => q.id === routeData.queueId)?.name}. Em breve um atendente irá te chamar! 😊`,
        collected: {
          ready: true,
          queueId: routeData.queueId,
          summary: routeData.summary
        }
      }
    } catch {
      // fallback
    }
  }

  return {
    message: text,
    collected: { ready: false }
  }
}

export const generateSummary = async (messages: { body: string; fromMe: boolean }[]): Promise<string> => {
  const conversation = messages
    .map(m => `${m.fromMe ? 'Atendente' : 'Cliente'}: ${m.body}`)
    .join('\n')

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Faça um resumo em 2-3 linhas desta conversa de atendimento para o atendente:\n\n${conversation}`
    }]
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}
