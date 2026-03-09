# 🚀 Guia de Migração: SQLite → Supabase (Postgres)

Este guia detalha os passos para migrar o Wayzen Client Portal de SQLite local para Supabase (PostgreSQL).

---

## 📋 Checklist de Migração

### ✅ Fase 1: Configuração Inicial (CONCLUÍDO)
- [x] Credenciais do Supabase coletadas
- [x] Arquivo `.env` criado com variáveis de ambiente
- [x] SDK `@supabase/supabase-js` instalado
- [x] Cliente Supabase configurado em `src/api/supabase.ts`
- [x] Schema SQL convertido para Postgres (`supabase-schema.sql`)
- [x] Seed SQL com dados de exemplo (`supabase-seed.sql`)

### ✅ Fase 2: Setup do Banco de Dados (CONCLUÍDO)
- [x] Executar `supabase-schema.sql` no Supabase SQL Editor
- [x] Executar `supabase-seed.sql` para popular dados de exemplo
- [x] Verificar que todas as tabelas foram criadas
- [x] Testar conexão do backend com Supabase
- [x] Corrigir password hashes dos usuários

### ✅ Fase 3: Migração do Backend (CONCLUÍDO)
- [x] Migrar módulo de autenticação (`/api/auth/*`)
- [x] Migrar módulo de tickets (`/api/tickets/*`)
- [x] Migrar módulo de sprints (`/api/sprints/*`)
- [x] Migrar módulo de documentos (`/api/documents/*`)
- [x] Migrar módulo de relatórios (`/api/reports/*`)
- [x] Migrar módulo de notificações (`/api/notifications/*`)
- [x] Migrar módulo de dashboard (`/api/dashboard`)
- [x] Migrar módulo de clients (`/api/clients/*`)
- [x] Migrar módulo de updates (`/api/updates/*`)

### ✅ Fase 4: Testes e Validação (CONCLUÍDO)
- [x] Testar todos os endpoints da API
- [x] Validar backend com bateria de testes completa
- [x] Testar permissões e autenticação
- [x] Performance check
- [x] Todos os testes passando com sucesso

### 🚢 Fase 5: Deploy e Otimizações (Opcional)
- [ ] Remover dependência `better-sqlite3` e `src/api/database.ts`
- [ ] Implementar RLS (Row Level Security) policies
- [ ] Migrar para Supabase Auth completo
- [ ] Atualizar variáveis de ambiente em produção
- [ ] Deploy do backend atualizado
- [ ] Monitoramento pós-deploy

---

## ✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!

**Status:** 🎉 **100% COMPLETO**

Todas as rotas foram migradas e testadas. Veja [MIGRATION-SUMMARY.md](MIGRATION-SUMMARY.md) para o relatório completo.

---

## 🛠️ Fase 2: Setup do Banco de Dados (✅ CONCLUÍDO)

### Passo 1: Acessar o Supabase SQL Editor

1. Acesse https://supabase.com/dashboard
2. Selecione o projeto **Wayzen Client Portal** (`stnnvoqvitenovvpqoia`)
3. No menu lateral, clique em **SQL Editor**

### Passo 2: Executar o Schema

1. Clique em **New query**
2. Copie todo o conteúdo de `supabase-schema.sql`
3. Cole no editor e clique em **Run**
4. Aguarde a confirmação de sucesso

### Passo 3: Popular com Dados de Exemplo

1. Crie uma nova query
2. Copie todo o conteúdo de `supabase-seed.sql`
3. Cole no editor e clique em **Run**
4. Aguarde a confirmação

### Passo 4: Verificar Criação das Tabelas

Execute no SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Você deve ver:
- `clients`
- `notifications`
- `project_updates`
- `shared_documents`
- `shared_reports`
- `sprint_tasks`
- `sprints`
- `ticket_messages`
- `tickets`
- `users`

---

## 🔧 Fase 3: Migração do Backend

### Estratégia de Migração

**Abordagem incremental:** Migrar um módulo por vez, mantendo compatibilidade com SQLite até a migração completa.

### Padrão de Conversão

#### ❌ ANTES (SQLite)
```typescript
// src/api/server.ts
import { getDb } from './database';

app.get('/api/tickets', authenticateToken, async (req, res) => {
  const db = getDb();
  const tickets = db
    .prepare('SELECT * FROM tickets WHERE client_id = ?')
    .all(req.user.client_id);
  res.json(tickets);
});
```

#### ✅ DEPOIS (Supabase)
```typescript
// src/api/server.ts
import { supabase } from './supabase';

app.get('/api/tickets', authenticateToken, async (req, res) => {
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('client_id', req.user.client_id);
  
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  
  res.json(tickets);
});
```

### Diferenças Principais

| SQLite (better-sqlite3) | Supabase (supabase-js) |
|------------------------|------------------------|
| `db.prepare().all()` | `supabase.from().select()` |
| `db.prepare().get()` | `supabase.from().select().single()` |
| `db.prepare().run()` | `supabase.from().insert()` / `.update()` / `.delete()` |
| Retorno direto | Retorna `{ data, error }` |
| Síncrono | Assíncrono (async/await) |

---

## 📝 Exemplo Completo: Migração do Módulo Tickets

Veja o arquivo **`MIGRATION-EXAMPLE-TICKETS.md`** (ao lado) para um exemplo completo de migração de rotas.

---

## 🔑 Módulo de Autenticação

### Decisão Importante: Manter JWT ou Usar Supabase Auth?

#### **Opção 1: Manter JWT Personalizado (RECOMENDADO INICIALMENTE)**
- ✅ **Prós:** Menos mudanças no código, compatível com sistema atual
- ✅ **Prós:** Controle total sobre lógica de auth
- ⚠️ **Contras:** Precisa manter hash de senha e lógica JWT

```typescript
// Continuar usando o fluxo atual de login
// Apenas trocar db.prepare() por supabase.from()
```

#### **Opção 2: Migrar para Supabase Auth (FUTURO)**
- ✅ **Prós:** Auth gerenciado pelo Supabase (reset de senha, OAuth, etc.)
- ✅ **Prós:** Integração nativa com RLS (Row Level Security)
- ⚠️ **Contras:** Requer refatoração significativa do frontend e backend

**Recomendação:** Começar com Opção 1 (manter JWT) e avaliar Opção 2 futuramente.

---

## 🧪 Testando a Conexão

Crie um endpoint de teste para validar a conexão:

```typescript
// src/api/server.ts
import { supabase } from './supabase';

app.get('/api/health/supabase', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    
    res.json({ 
      status: 'ok', 
      message: 'Supabase connection successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
});
```

Teste com:
```bash
curl http://localhost:3001/api/health/supabase
```

---

## 🚨 Problemas Comuns

### 1. Erro de Conexão
```
Error: Invalid API key
```
**Solução:** Verifique se `SUPABASE_SERVICE_ROLE_KEY` está correto no `.env`

### 2. RLS Bloqueando Queries
```
Error: new row violates row-level security policy
```
**Solução:** Desabilite RLS temporariamente ou configure políticas corretas:
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### 3. Foreign Key Constraints
```
Error: violates foreign key constraint
```
**Solução:** Certifique-se de inserir dados na ordem correta (clients → users → tickets)

---

## 📚 Recursos Adicionais

- [Documentação Supabase](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [PostgreSQL SQL Syntax](https://www.postgresql.org/docs/current/sql.html)

---

## 🎯 Próximo Passo

Execute os arquivos SQL no Supabase e depois me avise para prosseguirmos com a migração do primeiro módulo do backend! 🚀
