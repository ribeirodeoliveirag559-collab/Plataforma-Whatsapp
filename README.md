# PH Informática — Plataforma de Atendimento WhatsApp

Sistema multiagente de atendimento WhatsApp com IA porteira, substituindo o Gosac.

## Stack
- **Backend**: Node.js + TypeScript + Express + Prisma
- **Frontend**: Next.js 15 + Tailwind CSS
- **Banco**: PostgreSQL + Redis
- **IA**: Claude (Anthropic SDK)
- **WhatsApp**: Meta WhatsApp Business API

## Estrutura
```
├── backend/          # API REST + WebSocket
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── ai/       # IA porteira (Claude)
│   │   │   └── whatsapp/ # Integração Meta WABA
│   │   └── websocket/
│   └── prisma/       # Schema do banco
├── frontend/         # Dashboard Next.js
├── scripts/          # Migração de dados do Gosac
└── docker-compose.yml
```

## Como rodar localmente

### 1. Banco de dados
```bash
docker-compose up -d
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Editar .env com suas chaves
npm install
npm run prisma:migrate
npm run dev
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## Departamentos
1. Vendas
2. Ordem de Serviço
3. Suporte ao Clipp Pro
4. Laboratório (Assistência Técnica)
5. Solicitação de Serviço
6. Financeiro
7. RH
8. Fornecedor
