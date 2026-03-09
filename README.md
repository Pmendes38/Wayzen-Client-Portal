# Wayzen Client Portal

Portal multi-perfil da Wayzen com autenticacao Supabase e RLS por cliente.

## Stack

- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Dados/Auth: Supabase (PostgreSQL + Auth + RLS)

## Perfis

- `admin` e `consultant`: visao operacional interna, edicao de sprints, backlog interno, relatorios, registros diarios e agenda/transcricoes.
- `client`: visao de acompanhamento, cronograma, documentos, relatorios e agenda do proprio projeto.

## Setup

```bash
npm install
npm run dev
```

## SQL obrigatorio

Execute no Supabase SQL Editor, nesta ordem:

1. `supabase-schema.sql`
2. `supabase-rls-policies.sql`
3. `supabase-internal-ops.sql`
4. `supabase-seed.sql` (opcional)

## Estrutura principal

```txt
src/
  components/
  hooks/
  lib/
  pages/
  types/
```

## Documentacao

- `docs/product-delivery-plan.md`
