# Wayzen Client Portal

Portal do Cliente para acompanhamento de projetos, sprints, tickets de suporte e documentos compartilhados.

## Tecnologias

- **Frontend:** React 18 + TypeScript + Tailwind CSS + React Router
- **Backend:** Express + SQLite (better-sqlite3)
- **Autenticação:** JWT com cookies httpOnly

## Instalação

```bash
# Instalar dependências
npm install

# Inicializar banco de dados
npm run db:setup

# Iniciar em modo desenvolvimento
npm run dev
```

O frontend roda em `http://localhost:5173` e o backend em `http://localhost:3001`.

## Portas

- Frontend (Vite): `http://localhost:5173`
- Backend (API): `http://localhost:3001`

## Requisito de Node.js

Este projeto usa `better-sqlite3` com binarios prebuild na versao atual.

- Versoes suportadas: **Node 20.x ate 24.x**
- Se o prebuild nao estiver disponivel no seu ambiente, instale Visual Studio Build Tools (Desktop development with C++).

## Dados de Demonstração

Após iniciar, acesse `http://localhost:3001/api/seed` (POST) para criar dados de demonstração.

### Credenciais de Teste

| Papel | Email | Senha |
|-------|-------|-------|
| Admin | admin@wayzen.com.br | admin123 |
| Consultor | consultor@wayzen.com.br | consultor123 |
| Cliente | maria@escolaabc.com.br | cliente123 |

## Funcionalidades

- **Dashboard** - Visão geral com KPIs do projeto
- **Sprints** - Acompanhamento de entregas por semana
- **Suporte** - Sistema de tickets com conversa por mensagens
- **Documentos** - Cadastro e compartilhamento por URL
- **Relatórios** - Relatórios semanais e mensais
- **Notificações** - Central de notificacoes (sem tempo real nesta versao)

## Estrutura

```
src/
  api/          → Backend Express + SQLite
  components/   → Componentes reutilizáveis (Sidebar, Layout)
  hooks/        → Hooks customizados (useAuth)
  lib/          → Utilitários (api client)
  pages/        → Páginas da aplicação
```
