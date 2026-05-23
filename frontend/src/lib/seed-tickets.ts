import { PrismaClient, TicketStatus } from '@prisma/client'

const prisma = new PrismaClient()

/* ── Contatos fictícios realistas ── */
const CONTACTS = [
  { name: 'João Carlos Ferreira',    number: '6499112233', company: 'Distribuidora Ferreira Ltda' },
  { name: 'Maria Aparecida Silva',   number: '6498223344', company: 'Papelaria Criativa ME' },
  { name: 'Roberto Alves Souza',     number: '6497334455', company: 'Auto Peças Souza' },
  { name: 'Fernanda Lima Costa',     number: '6496445566', company: 'Clínica Odonto Sorriso' },
  { name: 'Carlos Eduardo Martins',  number: '6495556677', company: 'Supermercado Bom Preço' },
  { name: 'Ana Paula Rodrigues',     number: '6494667788', company: 'Escola Estadual João XXIII' },
  { name: 'Marcelo Henrique Gomes',  number: '6493778899', company: 'Construtora Gomes & Filhos' },
  { name: 'Patrícia Mendes Borges',  number: '6492889900', company: 'Farmácia Saúde Total' },
  { name: 'Lucas Oliveira Nunes',    number: '6491990011', company: 'Loja Virtual Nunes' },
  { name: 'Simone Castro Freitas',   number: '6490001122', company: 'Contabilidade Freitas' },
  { name: 'André Luiz Pinheiro',     number: '6489112233', company: 'Padaria Pão de Mel' },
  { name: 'Juliana Ramos Vieira',    number: '6488223344', company: 'Salão de Beleza Charme' },
  { name: 'Ricardo Moura Teixeira',  number: '6487334455', company: 'Oficina Mecânica RT' },
  { name: 'Camila Fonseca Araújo',   number: '6486445566', company: 'Academia Fit Life' },
  { name: 'Wellington Santos Lima',  number: '6485556677', company: 'Transportadora Santos' },
]

/* ── Conversas simuladas por departamento ── */
const CONVERSATIONS: {
  queueId: number
  status: TicketStatus
  aiSummary?: string
  userIdx?: number
  msgs: { body: string; fromMe: boolean; minsAgo: number }[]
}[] = [
  // ── Suporte ao Clipp Pro ──
  {
    queueId: 3, status: 'OPEN', userIdx: 0,
    aiSummary: 'Cliente com erro ao emitir NF-e. Sistema retorna código de rejeição 539.',
    msgs: [
      { body: 'Bom dia! Estou com um problema no Clipp Pro, ao tentar emitir nota fiscal aparece um erro de rejeição 539', fromMe: false, minsAgo: 60 },
      { body: 'Bom dia! Vou verificar aqui pra você. Pode me informar o CNPJ da empresa?', fromMe: true, minsAgo: 58 },
      { body: '12.345.678/0001-99 — Distribuidora Ferreira', fromMe: false, minsAgo: 56 },
      { body: 'Consultei aqui. O certificado digital A1 venceu ontem. Precisa renovar com a Certisign ou outra certificadora.', fromMe: true, minsAgo: 52 },
      { body: 'Ah entendi! Quanto tempo demora para renovar?', fromMe: false, minsAgo: 50 },
      { body: 'Em média 30 minutos se for feito online. Posso te passar o link da Certisign?', fromMe: true, minsAgo: 48 },
      { body: 'Por favor!', fromMe: false, minsAgo: 47 },
    ],
  },
  {
    queueId: 3, status: 'PENDING',
    aiSummary: 'Cliente relata lentidão no sistema Clipp Pro ao carregar relatórios.',
    msgs: [
      { body: 'Boa tarde! O Clipp Pro está muito lento hoje, especialmente nos relatórios de vendas', fromMe: false, minsAgo: 15 },
    ],
  },
  {
    queueId: 3, status: 'CLOSED', userIdx: 0,
    aiSummary: 'Dúvida sobre emissão de NFS-e resolvida. Cliente orientado sobre configuração do município.',
    msgs: [
      { body: 'Olá! Como configuro a NFS-e para o município de Itumbiara?', fromMe: false, minsAgo: 1440 },
      { body: 'Bom dia! Vou te ajudar. Acesse: Configurações > Fiscal > NFS-e e selecione Itumbiara-GO', fromMe: true, minsAgo: 1430 },
      { body: 'Encontrei! Mas não aparece a série para selecionar', fromMe: false, minsAgo: 1425 },
      { body: 'Nesse caso o município precisa estar habilitado na sua conta. Já enviei a liberação, tente novamente', fromMe: true, minsAgo: 1415 },
      { body: 'Funcionou! Muito obrigada!', fromMe: false, minsAgo: 1410 },
      { body: 'Que ótimo! Qualquer dúvida estaremos aqui 😊', fromMe: true, minsAgo: 1408 },
    ],
  },

  // ── Solicitação de Serviço ──
  {
    queueId: 4, status: 'OPEN', userIdx: 2,
    aiSummary: 'Solicitação de serviço técnico em impressora HP que não imprime. Agendado para amanhã.',
    msgs: [
      { body: 'Oi, minha impressora HP parou de imprimir, aparece erro de cartucho mas os cartuchos são novos', fromMe: false, minsAgo: 120 },
      { body: 'Entendido! Pode ser problema de cabeçote ou firmware. Qual modelo da impressora?', fromMe: true, minsAgo: 118 },
      { body: 'HP Deskjet 2774', fromMe: false, minsAgo: 115 },
      { body: 'Vou abrir uma OS para vocês. Preferem trazer na loja ou visita técnica?', fromMe: true, minsAgo: 110 },
      { body: 'Visita técnica, pois é pesada. Fica na Av. Beira Rio, 320', fromMe: false, minsAgo: 105 },
      { body: 'OS #2847 aberta! Agendei o técnico para amanhã entre 14h-17h. Confirma?', fromMe: true, minsAgo: 100 },
      { body: 'Perfeito! Obrigado', fromMe: false, minsAgo: 98 },
    ],
  },
  {
    queueId: 4, status: 'PENDING',
    aiSummary: 'Cliente solicita formatação de notebook e instalação de programas.',
    msgs: [
      { body: 'Bom dia! Quero formatar meu notebook e instalar o pacote Office e antivírus. Quanto fica?', fromMe: false, minsAgo: 30 },
    ],
  },

  // ── Vendas ──
  {
    queueId: 1, status: 'OPEN', userIdx: 3,
    aiSummary: 'Cliente interessado na compra de 3 computadores para escritório. Aguardando orçamento.',
    msgs: [
      { body: 'Boa tarde! Preciso de um orçamento para 3 computadores para escritório', fromMe: false, minsAgo: 90 },
      { body: 'Boa tarde! Com prazer! Para qual finalidade serão usados? Financeiro, atendimento...?', fromMe: true, minsAgo: 88 },
      { body: 'Financeiro e secretaria. Nada muito pesado, só Office e sistema ERP', fromMe: false, minsAgo: 85 },
      { body: 'Perfeito! Tenho uma ótima opção: Intel Core i5, 16GB RAM, SSD 480GB, Windows 11 por R$ 2.890 cada', fromMe: true, minsAgo: 80 },
      { body: 'E tem alguma com monitor incluso?', fromMe: false, minsAgo: 78 },
      { body: 'Sim! Com monitor 21" LED Full HD fica R$ 3.450 por unidade. Para 3 unidades faço 5% de desconto', fromMe: true, minsAgo: 75 },
      { body: 'Ótimo! Pode me mandar o orçamento formal por email?', fromMe: false, minsAgo: 70 },
    ],
  },
  {
    queueId: 1, status: 'CLOSED', userIdx: 3,
    aiSummary: 'Venda concluída. Cliente adquiriu 1 notebook Lenovo IdeaPad. Entrega realizada.',
    msgs: [
      { body: 'Olá! Vocês têm notebook para estudante? Algo em torno de R$ 2.000?', fromMe: false, minsAgo: 2880 },
      { body: 'Temos sim! Lenovo IdeaPad 3, i3, 8GB, SSD 256GB por R$ 1.990', fromMe: true, minsAgo: 2875 },
      { body: 'Tem em estoque?', fromMe: false, minsAgo: 2870 },
      { body: 'Temos 2 unidades. Aceita cartão em até 10x sem juros!', fromMe: true, minsAgo: 2865 },
      { body: 'Vou comprar! Posso passar hoje à tarde?', fromMe: false, minsAgo: 2860 },
      { body: 'Pode sim! Estamos até as 18h. Te esperamos 😊', fromMe: true, minsAgo: 2858 },
    ],
  },
  {
    queueId: 1, status: 'PENDING',
    aiSummary: 'Cliente pergunta sobre disponibilidade de HD externo 2TB.',
    msgs: [
      { body: 'Vocês vendem HD externo 2TB? Tem preço?', fromMe: false, minsAgo: 5 },
    ],
  },

  // ── Laboratório (Assistência Técnica) ──
  {
    queueId: 5, status: 'OPEN', userIdx: 4,
    aiSummary: 'Notebook com tela quebrada. Equipamento no laboratório aguardando peça.',
    msgs: [
      { body: 'Oi! Deixei um notebook semana passada com a tela quebrada. Qual o status?', fromMe: false, minsAgo: 200 },
      { body: 'Bom dia! Deixa eu verificar pelo número de série. Pode me informar?', fromMe: true, minsAgo: 195 },
      { body: 'SN: 5CD1234XYZ', fromMe: false, minsAgo: 190 },
      { body: 'Encontrei! O equipamento está no laboratório. A peça chegou hoje, previsão de conclusão amanhã até o meio dia.', fromMe: true, minsAgo: 185 },
      { body: 'Ótimo! E o valor continua R$ 380 que foi orçado?', fromMe: false, minsAgo: 183 },
      { body: 'Isso mesmo! Valor aprovado conforme orçamento.', fromMe: true, minsAgo: 180 },
    ],
  },
  {
    queueId: 5, status: 'PENDING',
    aiSummary: 'Cliente relata computador que não liga. Provável problema na fonte de alimentação.',
    msgs: [
      { body: 'Meu computador não está ligando, apertei o botão e não acontece nada, nem a luz acende', fromMe: false, minsAgo: 8 },
    ],
  },
  {
    queueId: 5, status: 'CLOSED', userIdx: 4,
    aiSummary: 'Celular com tela quebrada. Reparo concluído e entregue ao cliente.',
    msgs: [
      { body: 'Bom dia! Quero saber se meu celular já ficou pronto. Samsung A54', fromMe: false, minsAgo: 4320 },
      { body: 'Bom dia! Verificando... A troca de tela foi concluída ontem! Pode vir retirar.', fromMe: true, minsAgo: 4315 },
      { body: 'Que ótimo!! Posso ir agora de manhã?', fromMe: false, minsAgo: 4310 },
      { body: 'Pode sim! Estamos abertos das 8h às 18h de segunda a sexta.', fromMe: true, minsAgo: 4308 },
      { body: 'Já peguei! Ficou perfeito, obrigada!', fromMe: false, minsAgo: 4200 },
    ],
  },

  // ── Financeiro ──
  {
    queueId: 2, status: 'OPEN', userIdx: 1,
    aiSummary: 'Cliente questiona cobrança indevida na fatura. Aguardando análise do setor.',
    msgs: [
      { body: 'Bom dia! Recebi uma cobrança que não reconheço na minha fatura do mês passado', fromMe: false, minsAgo: 300 },
      { body: 'Bom dia! Pode me informar o nome da empresa e o valor cobrado?', fromMe: true, minsAgo: 295 },
      { body: 'Supermercado Bom Preço, CNPJ 45.678.901/0001-23, cobrança de R$ 189,90', fromMe: false, minsAgo: 290 },
      { body: 'Vou analisar o contrato e verificar. Pode aguardar?', fromMe: true, minsAgo: 285 },
      { body: 'Sim, fico aguardando', fromMe: false, minsAgo: 284 },
    ],
  },
  {
    queueId: 2, status: 'PENDING',
    aiSummary: 'Solicitação de segunda via de boleto para mensalidade do sistema.',
    msgs: [
      { body: 'Preciso de segunda via do boleto de maio, vencimento dia 10', fromMe: false, minsAgo: 22 },
    ],
  },

  // ── Ordem de Serviço ──
  {
    queueId: 6, status: 'OPEN', userIdx: 2,
    aiSummary: 'Cliente acompanha OS #3012 — instalação de rede no escritório novo.',
    msgs: [
      { body: 'Boa tarde! Quero saber o status da OS 3012', fromMe: false, minsAgo: 160 },
      { body: 'Boa tarde! A OS 3012 está em andamento. O técnico passou ontem para levantamento, hoje à tarde vai executar a instalação dos pontos de rede.', fromMe: true, minsAgo: 155 },
      { body: 'E o Wi-Fi também está incluído na OS?', fromMe: false, minsAgo: 150 },
      { body: 'Sim! Estão inclusos 2 pontos de acesso TP-Link conforme orçado. Estimativa de conclusão: hoje às 17h.', fromMe: true, minsAgo: 145 },
      { body: 'Perfeito! Obrigado pela agilidade', fromMe: false, minsAgo: 143 },
    ],
  },

  // ── RH ──
  {
    queueId: 7, status: 'CLOSED', userIdx: 1,
    aiSummary: 'Candidato enviou currículo para vaga de assistente de TI.',
    msgs: [
      { body: 'Boa tarde! Vi que vocês têm vaga para técnico de informática. Posso enviar meu currículo?', fromMe: false, minsAgo: 5760 },
      { body: 'Boa tarde! Pode sim! Envie aqui no WhatsApp ou pelo email rh@phinformatica.info', fromMe: true, minsAgo: 5755 },
      { body: 'Vou enviar agora! Tenho 3 anos de experiência em manutenção de hardware e redes', fromMe: false, minsAgo: 5750 },
      { body: 'Ótimo! Recebemos seu currículo. Entraremos em contato em até 5 dias úteis.', fromMe: true, minsAgo: 5740 },
      { body: 'Obrigado! Aguardo o contato', fromMe: false, minsAgo: 5738 },
    ],
  },
]

async function main() {
  console.log('🎭 Criando atendimentos de teste...\n')

  // Busca usuários e filas existentes
  const users = await prisma.user.findMany({ where: { active: true } })
  if (users.length === 0) { console.error('❌ Rode o seed principal primeiro: npm run db:seed'); process.exit(1) }

  // Cria contatos
  console.log('👥 Criando contatos...')
  const contacts = await Promise.all(
    CONTACTS.map(async (c) => {
      const existing = await prisma.contact.findFirst({ where: { number: c.number } })
      if (existing) return prisma.contact.update({ where: { id: existing.id }, data: { name: c.name, company: c.company } })
      return prisma.contact.create({ data: { name: c.name, number: c.number, company: c.company } })
    })
  )
  console.log(`   ${contacts.length} contatos prontos\n`)

  // Cria tickets e mensagens
  console.log('💬 Criando tickets com conversas...')
  let totalTickets = 0
  let totalMsgs = 0

  for (let i = 0; i < CONVERSATIONS.length; i++) {
    const conv = CONVERSATIONS[i]
    const contact = contacts[i % contacts.length]
    const assignedUser = conv.userIdx !== undefined ? users[conv.userIdx % users.length] : null

    const now = new Date()
    const lastMsg = conv.msgs[conv.msgs.length - 1]

    const ticket = await prisma.ticket.create({
      data: {
        status:        conv.status,
        contactId:     contact.id,
        queueId:       conv.queueId,
        userId:        assignedUser?.id ?? null,
        lastMessage:   lastMsg.body,
        unreadMessages: conv.status === 'PENDING' ? 1 : 0,
        aiSummary:     conv.aiSummary ?? null,
        closedAt:      conv.status === 'CLOSED' ? new Date(now.getTime() - 60 * 60 * 1000) : null,
        createdAt:     new Date(now.getTime() - conv.msgs[0].minsAgo * 60 * 1000),
        updatedAt:     new Date(now.getTime() - lastMsg.minsAgo * 60 * 1000),
      },
    })

    // Mensagens da conversa
    for (const msg of conv.msgs) {
      await prisma.message.create({
        data: {
          body:         msg.body,
          fromMe:       msg.fromMe,
          mediaType:    'chat',
          read:         true,
          ticketId:     ticket.id,
          senderUserId: msg.fromMe ? (assignedUser?.id ?? users[0].id) : null,
          createdAt:    new Date(now.getTime() - msg.minsAgo * 60 * 1000),
          updatedAt:    new Date(now.getTime() - msg.minsAgo * 60 * 1000),
        },
      })
    }

    totalTickets++
    totalMsgs += conv.msgs.length
    console.log(`   #${ticket.id} [${conv.status.padEnd(7)}] ${conv.queueId === 1 ? 'Vendas' : conv.queueId === 2 ? 'Financeiro' : conv.queueId === 3 ? 'Suporte Clipp' : conv.queueId === 4 ? 'Solicitação' : conv.queueId === 5 ? 'Laboratório' : conv.queueId === 6 ? 'OS' : 'RH'} — ${contact.name} (${conv.msgs.length} msgs)`)
  }

  console.log(`\n✅ ${totalTickets} tickets criados com ${totalMsgs} mensagens!`)
  console.log('\nResumo:')
  console.log(`   PENDING : ${CONVERSATIONS.filter(c => c.status === 'PENDING').length}`)
  console.log(`   OPEN    : ${CONVERSATIONS.filter(c => c.status === 'OPEN').length}`)
  console.log(`   CLOSED  : ${CONVERSATIONS.filter(c => c.status === 'CLOSED').length}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
