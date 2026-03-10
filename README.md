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
4. `supabase-chat-backlog-upgrade.sql`
5. `supabase-seed.sql` (opcional)

## Validacao rapida (pos SQL)

Fluxo esperado para usuario interno:

1. Login
2. Escolha do portal em `/portal-select`
3. Acesso ao dashboard e modulos com dados do cliente selecionado

Checklist funcional:

1. Entrar com usuario `admin` ou `consultant`.
2. Confirmar redirecionamento para `/portal-select` antes de abrir dashboard.
3. Em `Sprints`, criar um item de backlog e vincular uma atividade com inicio/fim e descricao.
4. Em `Chat do Projeto`, validar:
  - Grupo Geral visivel para todos do projeto.
  - Grupo Interno visivel apenas para time Wayzen.
  - Conversa direta por contato funcionando (mensagem envia e reaparece ao recarregar).

Validacao SQL (opcional):

1. Execute `supabase-verify-chat-backlog.sql`.
2. Confira que nao retorna erro e que os contadores/tabelas aparecem com dados.

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
