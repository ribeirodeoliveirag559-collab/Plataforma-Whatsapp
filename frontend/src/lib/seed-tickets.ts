/**
 * seed-tickets.ts
 * Limpa e recria atendimentos de teste alinhados ao novo fluxo:
 *  - Usuários vinculados aos seus departamentos (UserQueue)
 *  - PENDING: aguardando atendente pegar
 *  - OPEN:    atendente já iniciou
 *  - CLOSED:  encerrado
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ── Mapeamento usuário → departamentos ──────────────────
const USER_QUEUES: Record<string, number[]> = {
  gustavo: [3, 4],        // Suporte Clipp Pro + Solicitação de Serviço
  paulo:   [1, 2],        // Vendas + Financeiro
  laura:   [1, 2, 7],     // Vendas + Financeiro + RH
  iara:    [1],           // Vendas
  luiz:    [5, 6],        // Laboratório + Ordem de Serviço
  bruno:   [3, 4, 8],     // Suporte Clipp + Solicitação + Fornecedor
}

// ── Contatos ────────────────────────────────────────────
const CONTACTS = [
  { name: 'João Carlos Ferreira',   number: '6499112233', company: 'Distribuidora Ferreira Ltda'  },
  { name: 'Maria Aparecida Silva',  number: '6498223344', company: 'Papelaria Criativa ME'         },
  { name: 'Roberto Alves Souza',    number: '6497334455', company: 'Auto Peças Souza'              },
  { name: 'Fernanda Lima Costa',    number: '6496445566', company: 'Clínica Odonto Sorriso'        },
  { name: 'Carlos Eduardo Martins', number: '6495556677', company: 'Supermercado Bom Preço'        },
  { name: 'Ana Paula Rodrigues',    number: '6494667788', company: 'Escola Estadual João XXIII'    },
  { name: 'Marcelo Henrique Gomes', number: '6493778899', company: 'Construtora Gomes & Filhos'    },
  { name: 'Patrícia Mendes Borges', number: '6492889900', company: 'Farmácia Saúde Total'          },
  { name: 'Lucas Oliveira Nunes',   number: '6491990011', company: 'Loja Virtual Nunes'            },
  { name: 'Simone Castro Freitas',  number: '6490001122', company: 'Contabilidade Freitas'         },
  { name: 'André Luiz Pinheiro',    number: '6489112233', company: 'Padaria Pão de Mel'            },
  { name: 'Juliana Ramos Vieira',   number: '6488223344', company: 'Salão de Beleza Charme'        },
  { name: 'Ricardo Moura Teixeira', number: '6487334455', company: 'Oficina Mecânica RT'           },
  { name: 'Camila Fonseca Araújo',  number: '6486445566', company: 'Academia Fit Life'             },
  { name: 'Wellington Santos Lima', number: '6485556677', company: 'Transportadora Santos'         },
]

type Msg = { body: string; fromMe: boolean; minsAgo: number }

interface Conv {
  contactIdx: number
  queueId:    number
  status:     'PENDING' | 'OPEN' | 'CLOSED'
  userSlug?:  string          // atendente que assumiu (OPEN/CLOSED)
  aiSummary?: string
  msgs:       Msg[]
}

const CONVERSATIONS: Conv[] = [

  /* ══════════ PENDENTES ══════════
     Chegaram, IA coletou info, aguardando atendente pegar */

  {
    contactIdx: 0, queueId: 3, status: 'PENDING',
    aiSummary: 'Erro NF-e rejeição 539. CNPJ: 12.345.678/0001-99 — Distribuidora Ferreira. Certificado digital vencido.',
    msgs: [
      { body: 'Bom dia! Estou com erro ao emitir NF-e, aparece rejeição 539', fromMe: false, minsAgo: 25 },
      { body: 'Olá! Sou a assistente virtual da PH. Pode me informar o CNPJ da empresa?', fromMe: true, minsAgo: 24 },
      { body: '12.345.678/0001-99 — Distribuidora Ferreira', fromMe: false, minsAgo: 22 },
      { body: 'Obrigada! E qual é o defeito exato que está aparecendo?', fromMe: true, minsAgo: 21 },
      { body: 'Erro 539 — certificado digital inválido ou vencido', fromMe: false, minsAgo: 20 },
      { body: 'Entendido! Vou encaminhar para o Suporte Clipp. Um atendente irá te ajudar em breve!', fromMe: true, minsAgo: 19 },
    ],
  },

  {
    contactIdx: 1, queueId: 3, status: 'PENDING',
    aiSummary: 'Lentidão no Clipp Pro ao abrir relatórios. CNPJ: 98.765.432/0001-11 — Papelaria Criativa. Solicitante: Maria.',
    msgs: [
      { body: 'Boa tarde! O sistema está muito lento hoje nos relatórios', fromMe: false, minsAgo: 10 },
      { body: 'Olá Maria! Pode me informar o CNPJ da empresa?', fromMe: true, minsAgo: 9 },
      { body: '98.765.432/0001-11 — Papelaria Criativa ME', fromMe: false, minsAgo: 8 },
      { body: 'Qual módulo está com lentidão?', fromMe: true, minsAgo: 7 },
      { body: 'Relatórios de vendas e o financeiro', fromMe: false, minsAgo: 6 },
      { body: 'Anotado! Encaminhando para o Suporte Clipp Pro agora.', fromMe: true, minsAgo: 5 },
    ],
  },

  {
    contactIdx: 3, queueId: 4, status: 'PENDING',
    aiSummary: 'Solicitação de visita técnica. Impressora HP Deskjet 2774 sem imprimir. Endereço: Av. Beira Rio, 320.',
    msgs: [
      { body: 'Oi, minha impressora HP parou de imprimir, aparece erro de cartucho', fromMe: false, minsAgo: 18 },
      { body: 'Olá! Qual é o modelo da impressora?', fromMe: true, minsAgo: 17 },
      { body: 'HP Deskjet 2774', fromMe: false, minsAgo: 16 },
      { body: 'Prefere trazer na loja ou visita técnica?', fromMe: true, minsAgo: 15 },
      { body: 'Visita técnica, é pesada. Fica na Av. Beira Rio, 320', fromMe: false, minsAgo: 14 },
      { body: 'Certo! Encaminhando para Solicitação de Serviço. Aguarde um atendente!', fromMe: true, minsAgo: 13 },
    ],
  },

  {
    contactIdx: 5, queueId: 1, status: 'PENDING',
    aiSummary: 'Orçamento para 3 computadores escritório. Uso: financeiro e secretaria. Sem necessidade de placa gráfica.',
    msgs: [
      { body: 'Boa tarde! Preciso de orçamento para 3 computadores para escritório', fromMe: false, minsAgo: 12 },
      { body: 'Boa tarde! Para qual finalidade serão usados?', fromMe: true, minsAgo: 11 },
      { body: 'Financeiro e secretaria, só Office e sistema ERP mesmo', fromMe: false, minsAgo: 10 },
      { body: 'Precisa de monitor junto?', fromMe: true, minsAgo: 9 },
      { body: 'Sim, com monitor mesmo', fromMe: false, minsAgo: 8 },
      { body: 'Perfeito! Encaminhando para nossa equipe de Vendas!', fromMe: true, minsAgo: 7 },
    ],
  },

  {
    contactIdx: 8, queueId: 5, status: 'PENDING',
    aiSummary: 'Notebook com tela quebrada. SN: 5CD1234XYZ. Cliente: Lucas Oliveira / Loja Virtual Nunes.',
    msgs: [
      { body: 'Boa tarde! Quero trazer meu notebook com tela quebrada', fromMe: false, minsAgo: 30 },
      { body: 'Pode sim! Qual a marca e modelo?', fromMe: true, minsAgo: 29 },
      { body: 'Dell Inspiron 15, SN: 5CD1234XYZ', fromMe: false, minsAgo: 28 },
      { body: 'Qual o problema exato?', fromMe: true, minsAgo: 27 },
      { body: 'Tela rachada, aparece manchas e não exibe imagem correta', fromMe: false, minsAgo: 26 },
      { body: 'Entendido! Encaminhando para o Laboratório. Traga o equipamento até nós!', fromMe: true, minsAgo: 25 },
    ],
  },

  {
    contactIdx: 11, queueId: 2, status: 'PENDING',
    aiSummary: 'Segunda via boleto maio. Vencimento dia 10. Empresa: Salão de Beleza Charme.',
    msgs: [
      { body: 'Preciso de segunda via do boleto de maio, vencimento dia 10', fromMe: false, minsAgo: 8 },
      { body: 'Claro! Qual o nome da empresa?', fromMe: true, minsAgo: 7 },
      { body: 'Salão de Beleza Charme, Juliana Ramos', fromMe: false, minsAgo: 6 },
      { body: 'Encaminhando para o Financeiro. Aguarde!', fromMe: true, minsAgo: 5 },
    ],
  },

  /* ══════════ EM ATENDIMENTO ══════════
     Atendente pegou e está em andamento */

  {
    contactIdx: 2, queueId: 3, status: 'OPEN', userSlug: 'gustavo',
    aiSummary: 'NFS-e não configurada para Itumbiara-GO. CNPJ: 33.444.555/0001-66 — Auto Peças Souza.',
    msgs: [
      { body: 'Olá! Como configuro a NFS-e para Itumbiara?', fromMe: false, minsAgo: 90 },
      { body: 'Entendi o problema, vou verificar sua conta.', fromMe: true, minsAgo: 85 },
      { body: 'Acesse: Configurações > Fiscal > NFS-e e selecione Itumbiara-GO', fromMe: true, minsAgo: 80 },
      { body: 'Não aparece a opção de série para selecionar', fromMe: false, minsAgo: 75 },
      { body: 'Seu município ainda não estava habilitado. Acabei de liberar, tente novamente!', fromMe: true, minsAgo: 60 },
      { body: 'Funcionou!! Obrigado Gustavo!', fromMe: false, minsAgo: 55 },
      { body: 'Ótimo! Qualquer dúvida estarei aqui 😊', fromMe: true, minsAgo: 54 },
    ],
  },

  {
    contactIdx: 4, queueId: 4, status: 'OPEN', userSlug: 'bruno',
    aiSummary: 'Formatação notebook + instalação Office e antivírus. Aguardando orçamento aprovado.',
    msgs: [
      { body: 'Bom dia! Quero formatar meu notebook. Quanto fica?', fromMe: false, minsAgo: 120 },
      { body: 'Bom dia! Formatação + Windows + Office fica R$ 180. Com antivírus mais R$ 50.', fromMe: true, minsAgo: 115 },
      { body: 'Pode fazer os dois! Quando posso levar?', fromMe: false, minsAgo: 110 },
      { body: 'Pode trazer hoje até as 17h ou amanhã de manhã.', fromMe: true, minsAgo: 105 },
      { body: 'Vou amanhã de manhã. Preciso levar o carregador?', fromMe: false, minsAgo: 100 },
      { body: 'Sim, traga o carregador junto. Te esperamos!', fromMe: true, minsAgo: 98 },
    ],
  },

  {
    contactIdx: 6, queueId: 1, status: 'OPEN', userSlug: 'iara',
    aiSummary: 'Interesse em compra de 1 notebook para estudante. Orçamento aprovado R$ 1.990.',
    msgs: [
      { body: 'Olá! Vocês têm notebook para estudante? Até R$ 2.000?', fromMe: false, minsAgo: 180 },
      { body: 'Temos! Lenovo IdeaPad i3, 8GB, SSD 256GB por R$ 1.990 em até 10x sem juros', fromMe: true, minsAgo: 175 },
      { body: 'Tem em estoque?', fromMe: false, minsAgo: 170 },
      { body: 'Sim! 2 unidades disponíveis', fromMe: true, minsAgo: 165 },
      { body: 'Posso passar aí hoje à tarde?', fromMe: false, minsAgo: 160 },
      { body: 'Pode sim! Estamos até as 18h 😊', fromMe: true, minsAgo: 158 },
    ],
  },

  {
    contactIdx: 9, queueId: 5, status: 'OPEN', userSlug: 'luiz',
    aiSummary: 'Celular Samsung A54 tela quebrada. Peça em trânsito, prazo 2 dias úteis.',
    msgs: [
      { body: 'Bom dia! Qual o status do meu celular? Samsung A54', fromMe: false, minsAgo: 240 },
      { body: 'Bom dia! A tela foi encomendada ontem. Prazo de chegada: 2 dias úteis.', fromMe: true, minsAgo: 235 },
      { body: 'Tudo bem! E o valor continua R$ 320?', fromMe: false, minsAgo: 230 },
      { body: 'Isso mesmo, valor confirmado conforme orçamento.', fromMe: true, minsAgo: 225 },
      { body: 'Ok! Me avisa quando chegar a peça por favor', fromMe: false, minsAgo: 220 },
      { body: 'Claro! Assim que chegar entro em contato 👍', fromMe: true, minsAgo: 218 },
    ],
  },

  {
    contactIdx: 12, queueId: 6, status: 'OPEN', userSlug: 'luiz',
    aiSummary: 'OS #3012 — instalação rede + 2 pontos Wi-Fi. Técnico executando hoje à tarde.',
    msgs: [
      { body: 'Boa tarde! Qual o status da OS 3012?', fromMe: false, minsAgo: 160 },
      { body: 'Boa tarde! Técnico está a caminho. Previsão de chegada: 14h30', fromMe: true, minsAgo: 155 },
      { body: 'O Wi-Fi está incluso na OS?', fromMe: false, minsAgo: 150 },
      { body: 'Sim! 2 pontos de acesso TP-Link conforme orçado.', fromMe: true, minsAgo: 145 },
      { body: 'Ótimo! Obrigado', fromMe: false, minsAgo: 143 },
    ],
  },

  /* ══════════ ENCERRADOS ══════════ */

  {
    contactIdx: 7, queueId: 2, status: 'CLOSED', userSlug: 'paulo',
    aiSummary: 'Cobrança indevida R$ 189,90 — analisada e estornada. Resolvido.',
    msgs: [
      { body: 'Boa tarde! Tenho uma cobrança que não reconheço na fatura', fromMe: false, minsAgo: 1440 },
      { body: 'Pode informar o valor e competência?', fromMe: true, minsAgo: 1430 },
      { body: 'R$ 189,90, fatura de abril', fromMe: false, minsAgo: 1425 },
      { body: 'Verifiquei aqui. Foi uma duplicidade no sistema. Já realizei o estorno!', fromMe: true, minsAgo: 1400 },
      { body: 'Muito obrigada! Quando cai o estorno?', fromMe: false, minsAgo: 1395 },
      { body: 'Em até 2 dias úteis na sua conta. Qualquer dúvida estamos aqui!', fromMe: true, minsAgo: 1393 },
    ],
  },

  {
    contactIdx: 10, queueId: 7, status: 'CLOSED', userSlug: 'laura',
    aiSummary: 'Candidato para vaga de técnico de informática. Currículo recebido.',
    msgs: [
      { body: 'Boa tarde! Vi que vocês têm vaga para técnico de informática', fromMe: false, minsAgo: 5760 },
      { body: 'Pode enviar seu currículo aqui mesmo ou no email rh@phinformatica.info', fromMe: true, minsAgo: 5750 },
      { body: 'Tenho 3 anos de experiência em hardware e redes. Enviando o currículo!', fromMe: false, minsAgo: 5745 },
      { body: 'Recebemos! Retornaremos em até 5 dias úteis.', fromMe: true, minsAgo: 5740 },
      { body: 'Obrigado! Aguardo o contato', fromMe: false, minsAgo: 5738 },
    ],
  },

  {
    contactIdx: 13, queueId: 1, status: 'CLOSED', userSlug: 'iara',
    aiSummary: 'Venda concluída — HD externo 2TB Seagate. Retirado na loja.',
    msgs: [
      { body: 'Vocês vendem HD externo 2TB? Qual o preço?', fromMe: false, minsAgo: 2880 },
      { body: 'Temos! Seagate 2TB por R$ 389. Aceitamos cartão em 6x sem juros', fromMe: true, minsAgo: 2875 },
      { body: 'Tem em estoque?', fromMe: false, minsAgo: 2870 },
      { body: '1 unidade disponível!', fromMe: true, minsAgo: 2865 },
      { body: 'Vou comprar! Passo hoje à tarde', fromMe: false, minsAgo: 2860 },
      { body: 'Perfeito! Te esperamos 😊', fromMe: true, minsAgo: 2858 },
      { body: 'Peguei! Obrigado pela atenção', fromMe: false, minsAgo: 2700 },
    ],
  },

  {
    contactIdx: 14, queueId: 5, status: 'CLOSED', userSlug: 'luiz',
    aiSummary: 'Computador não ligava — problema na fonte. Substituída e entregue.',
    msgs: [
      { body: 'Meu computador não liga, apertei o botão e nada acontece', fromMe: false, minsAgo: 4320 },
      { body: 'Pode ser problema na fonte de alimentação. Vai precisar trazer para diagnóstico.', fromMe: true, minsAgo: 4315 },
      { body: 'Quanto custa o diagnóstico?', fromMe: false, minsAgo: 4310 },
      { body: 'O diagnóstico é gratuito! Se precisar de peça avisamos antes.', fromMe: true, minsAgo: 4305 },
      { body: 'Ótimo! Levo amanhã de manhã', fromMe: false, minsAgo: 4300 },
      { body: 'Confirmamos: foi a fonte. Substituída por R$ 120. Pode retirar!', fromMe: true, minsAgo: 3000 },
      { body: 'Peguei! Funcionou perfeitamente, obrigado!', fromMe: false, minsAgo: 2900 },
    ],
  },
]

// ────────────────────────────────────────────────────────
async function main() {
  console.log('🔄 Limpando dados de teste anteriores...')

  // Apaga nessa ordem por causa das FK
  await prisma.message.deleteMany({})
  await prisma.ticket.deleteMany({})
  await prisma.contact.deleteMany({ where: { gosacId: null } })
  await prisma.userQueue.deleteMany({})

  console.log('   ✓ Dados limpos\n')

  // ── 1. Vincular usuários aos departamentos ──
  console.log('🔗 Vinculando usuários aos departamentos...')
  const users = await prisma.user.findMany({ where: { active: true } })
  const userMap = Object.fromEntries(users.map(u => [u.username, u]))

  for (const [slug, qids] of Object.entries(USER_QUEUES)) {
    const user = userMap[slug]
    if (!user) { console.log(`   ⚠ Usuário '${slug}' não encontrado`); continue }
    await prisma.userQueue.createMany({
      data: qids.map(qid => ({ userId: user.id, queueId: qid })),
      skipDuplicates: true,
    })
    const queue = await prisma.queue.findMany({ where: { id: { in: qids } }, select: { name: true } })
    console.log(`   ✓ ${slug} → ${queue.map(q => q.name).join(', ')}`)
  }

  // ── 2. Criar contatos ──
  console.log('\n👥 Criando contatos...')
  const contacts = await Promise.all(
    CONTACTS.map(async c => {
      const ex = await prisma.contact.findFirst({ where: { number: c.number } })
      if (ex) return prisma.contact.update({ where: { id: ex.id }, data: { name: c.name, company: c.company } })
      return prisma.contact.create({ data: { name: c.name, number: c.number, company: c.company } })
    })
  )
  console.log(`   ✓ ${contacts.length} contatos prontos`)

  // ── 3. Criar tickets e mensagens ──
  console.log('\n💬 Criando tickets...')
  const now = Date.now()
  let totalMsgs = 0

  for (const conv of CONVERSATIONS) {
    const contact    = contacts[conv.contactIdx]
    const assignedUser = conv.userSlug ? userMap[conv.userSlug] : null
    const lastMsg    = conv.msgs[conv.msgs.length - 1]

    const ticket = await prisma.ticket.create({
      data: {
        status:        conv.status,
        contactId:     contact.id,
        queueId:       conv.queueId,
        userId:        assignedUser?.id ?? null,
        lastMessage:   lastMsg.body,
        unreadMessages: conv.status === 'PENDING' ? 1 : 0,
        aiSummary:     conv.aiSummary ?? null,
        closedAt:      conv.status === 'CLOSED' ? new Date(now - 30 * 60 * 1000) : null,
        createdAt:     new Date(now - conv.msgs[0].minsAgo * 60 * 1000),
        updatedAt:     new Date(now - lastMsg.minsAgo * 60 * 1000),
      },
    })

    for (const msg of conv.msgs) {
      await prisma.message.create({
        data: {
          body:         msg.body,
          fromMe:       msg.fromMe,
          mediaType:    'chat',
          read:         true,
          ticketId:     ticket.id,
          senderUserId: msg.fromMe ? (assignedUser?.id ?? users[0].id) : null,
          createdAt:    new Date(now - msg.minsAgo * 60 * 1000),
          updatedAt:    new Date(now - msg.minsAgo * 60 * 1000),
        },
      })
    }

    const statusIcon = conv.status === 'PENDING' ? '🟡' : conv.status === 'OPEN' ? '🟢' : '✅'
    const dept = { 1:'Vendas', 2:'Financeiro', 3:'Suporte Clipp', 4:'Solicitação', 5:'Laboratório', 6:'OS', 7:'RH', 8:'Fornecedor' }[conv.queueId]
    console.log(`   ${statusIcon} [${conv.status.padEnd(7)}] ${dept?.padEnd(14)} — ${contact.name}${conv.userSlug ? ` (${conv.userSlug})` : ''}`)
    totalMsgs += conv.msgs.length
  }

  console.log(`\n✅ ${CONVERSATIONS.length} tickets | ${totalMsgs} mensagens`)
  console.log('\nResumo por status:')
  console.log(`   🟡 PENDING : ${CONVERSATIONS.filter(c => c.status === 'PENDING').length}`)
  console.log(`   🟢 OPEN    : ${CONVERSATIONS.filter(c => c.status === 'OPEN').length}`)
  console.log(`   ✅ CLOSED  : ${CONVERSATIONS.filter(c => c.status === 'CLOSED').length}`)
  console.log('\nFiltros por usuário:')
  for (const [slug, qids] of Object.entries(USER_QUEUES)) {
    const pendentes = CONVERSATIONS.filter(c => c.status === 'PENDING' && qids.includes(c.queueId)).length
    const abertos   = CONVERSATIONS.filter(c => c.status === 'OPEN' && c.userSlug === slug).length
    console.log(`   ${slug.padEnd(8)} → vê ${pendentes} pendentes | ${abertos} em atendimento (suas)`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
