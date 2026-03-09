# 🎉 Portal Migrado para Supabase - Guia Rápido

## ✅ Status: MIGRAÇÃO CONCLUÍDA

O Wayzen Client Portal foi **100% migrado** de SQLite para Supabase (PostgreSQL) com sucesso!

---

## 🚀 Como Usar

### 1️⃣ Iniciar o Servidor

```bash
# Terminal 1: Backend (API)
npm run dev:server

# Terminal 2: Frontend (React)
npm run dev:client
```

**URLs:**
- Frontend: http://127.0.0.1:5173
- Backend API: http://localhost:3001

### 2️⃣ Fazer Login

Use uma das credenciais abaixo:

**Admin (acesso total):**
```
Email: admin@wayzen.com.br
Senha: admin123
```

**Consultor (gerencia clientes):**
```
Email: consultor@wayzen.com.br
Senha: consultor123
```

**Cliente (visualiza seu projeto):**
```
Email: maria@escolaabc.com.br
Senha: cliente123
```

---

## 🧪 Testar a API

### Teste Rápido (Login)
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@wayzen.com.br","password":"admin123"}'
```

### Bateria Completa de Testes
```bash
node scripts/test-migrated-api.js
```

Resultado esperado:
```
✅ Login
✅ Tickets (4 encontrados)
✅ Sprints (3 encontrados)
✅ Documents (3 encontrados)
✅ Reports (2 encontrados)
✅ Notifications (4 encontradas)
✅ Dashboard (KPIs carregados)
```

---

## 📚 Documentação Completa

- **[MIGRATION-SUMMARY.md](MIGRATION-SUMMARY.md)** - Relatório completo da migração
- **[MIGRATION-GUIDE.md](MIGRATION-GUIDE.md)** - Guia técnico detalhado
- **[MIGRATION-EXAMPLE-TICKETS.md](MIGRATION-EXAMPLE-TICKETS.md)** - Exemplo de código migrado

---

## 🔧 Estrutura do Projeto

```
wayzen-client-portal/
├── src/
│   ├── api/
│   │   ├── server.ts          ✅ Migrado para Supabase
│   │   ├── supabase.ts        ✨ Novo cliente Supabase
│   │   └── database.ts        ⚠️  Deprecated (SQLite)
│   ├── components/
│   ├── pages/
│   └── lib/
├── scripts/
│   ├── validate-supabase.js   🔍 Valida tabelas
│   ├── test-migrated-api.js   🧪 Testa todas as rotas
│   └── fix-passwords.js       🔑 Fix de senhas
├── supabase-schema.sql        📊 Schema completo
├── supabase-seed.sql          🌱 Dados de exemplo
└── .env                       🔐 Credenciais (não commitar!)
```

---

## 🗄️ Banco de Dados

### Supabase (PostgreSQL)

**Project:** Wayzen Client Portal  
**URL:** https://stnnvoqvitenovvpqoia.supabase.co  
**Dashboard:** https://supabase.com/dashboard/project/stnnvoqvitenovvpqoia

**10 Tabelas:**
- users (4 registros)
- clients (2 registros)
- project_updates (5 registros)
- sprints (5 registros)
- sprint_tasks (16 registros)
- tickets (4 registros)
- ticket_messages (6 registros)
- shared_documents (4 registros)
- shared_reports (3 registros)
- notifications (6 registros)

### Validar Estrutura
```bash
node scripts/validate-supabase.js
```

---

## 🔑 Variáveis de Ambiente

Arquivo `.env` configurado com:

```env
SUPABASE_URL=https://stnnvoqvitenovvpqoia.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=wayzen-portal-secret-key-2024
PORT=3001
NODE_ENV=development
```

⚠️ **IMPORTANTE:** Nunca commitar o arquivo `.env` no Git!

---

## 📊 Endpoints da API

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/me` - Perfil do usuário
- `POST /api/auth/logout` - Logout

### Tickets
- `GET /api/tickets` - Listar tickets
- `GET /api/tickets/:id` - Buscar ticket
- `POST /api/tickets` - Criar ticket
- `PATCH /api/tickets/:id` - Atualizar ticket
- `GET /api/ticket-messages/:ticketId` - Mensagens
- `POST /api/ticket-messages` - Adicionar mensagem

### Sprints
- `GET /api/sprints/:clientId` - Listar sprints
- `GET /api/sprint-tasks/:sprintId` - Tarefas da sprint

### Documents
- `GET /api/documents/:clientId` - Listar documentos
- `POST /api/documents` - Upload
- `DELETE /api/documents/:id` - Deletar

### Reports
- `GET /api/reports/:clientId` - Listar relatórios
- `POST /api/reports` - Criar relatório

### Notifications  
- `GET /api/notifications` - Listar notificações
- `GET /api/notifications/unread-count` - Contador
- `PATCH /api/notifications/:id/read` - Marcar como lida
- `PATCH /api/notifications/read-all` - Marcar todas

### Dashboard
- `GET /api/portal/dashboard/:clientId` - KPIs completos

---

## 🎯 Próximos Passos (Opcional)

### Otimizações Futuras
- [ ] Implementar RLS (Row Level Security) no Supabase
- [ ] Migrar para Supabase Auth completo
- [ ] Adicionar cache com Redis
- [ ] Implementar real-time subscriptions
- [ ] Remover dependência SQLite

### Deploy
- [ ] Configurar variáveis de ambiente em produção
- [ ] Deploy do backend
- [ ] Setup de backup automático
- [ ] Monitoramento de performance

---

## ❓ Problemas Comuns

### Erro: "Port 3001 already in use"
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# PowerShell (todos os processos Node)
Get-Process -Name node | Stop-Process -Force
```

### Erro: "Cannot connect to Supabase"
1. Verificar se `.env` existe e tem as credenciais corretas
2. Testar conexão: `node scripts/validate-supabase.js`
3. Verificar firewall/VPN

### Erro: "Credenciais inválidas" no login
```bash
# Re-executar fix de senhas
node scripts/fix-passwords.js
```

---

## 🆘 Suporte

- **Documentação:** [MIGRATION-GUIDE.md](MIGRATION-GUIDE.md)
- **Testes:** `node scripts/test-migrated-api.js`
- **Validação:** `node scripts/validate-supabase.js`

---

**Desenvolvido por:** Full Stack Engineer com Supabase + PostgreSQL  
**Última Atualização:** 08/03/2026  
**Versão:** 1.0.0 (Migrado para Supabase)
