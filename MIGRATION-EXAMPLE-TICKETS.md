# 🎯 Exemplo Prático: Migração do Módulo Tickets

Este documento mostra a migração completa de todas as rotas do módulo de tickets de SQLite para Supabase.

---

## 📍 Arquivo: `src/api/server.ts`

### 1️⃣ GET /api/tickets - Listar Tickets

#### ❌ ANTES (SQLite)
```typescript
app.get('/api/tickets', authenticateToken, canAccessClient, async (req, res) => {
  try {
    const db = getDb();
    const clientId = req.query.client_id || req.user.client_id;
    
    const tickets = db
      .prepare(`
        SELECT 
          t.*,
          u.name as user_name,
          u.email as user_email,
          au.name as assigned_user_name
        FROM tickets t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN users au ON t.assigned_user_id = au.id
        WHERE t.client_id = ?
        ORDER BY t.created_at DESC
      `)
      .all(clientId);
    
    res.json(tickets);
  } catch (err) {
    console.error('Error fetching tickets:', err);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});
```

#### ✅ DEPOIS (Supabase)
```typescript
app.get('/api/tickets', authenticateToken, canAccessClient, async (req, res) => {
  try {
    const clientId = req.query.client_id || req.user.client_id;
    
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`
        *,
        user:users!tickets_user_id_fkey(name, email),
        assigned_user:users!tickets_assigned_user_id_fkey(name)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Transformar para formato esperado pelo frontend
    const formattedTickets = tickets.map(t => ({
      ...t,
      user_name: t.user?.name,
      user_email: t.user?.email,
      assigned_user_name: t.assigned_user?.name
    }));
    
    res.json(formattedTickets);
  } catch (err) {
    console.error('Error fetching tickets:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch tickets' });
  }
});
```

**💡 Observações:**
- `select()` com relacionamentos: usar sintaxe `table!foreign_key_name(columns)`
- `.eq()` substitui `WHERE =`
- `.order()` substitui `ORDER BY`

---

### 2️⃣ GET /api/tickets/:id - Buscar Ticket Específico

#### ❌ ANTES (SQLite)
```typescript
app.get('/api/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const ticketId = parseInt(req.params.id);
    
    const ticket = db
      .prepare(`
        SELECT 
          t.*,
          u.name as user_name,
          au.name as assigned_user_name
        FROM tickets t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN users au ON t.assigned_user_id = au.id
        WHERE t.id = ?
      `)
      .get(ticketId);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    // Buscar mensagens
    const messages = db
      .prepare(`
        SELECT 
          tm.*,
          u.name as user_name,
          u.avatar_url as user_avatar
        FROM ticket_messages tm
        LEFT JOIN users u ON tm.user_id = u.id
        WHERE tm.ticket_id = ?
        ORDER BY tm.created_at ASC
      `)
      .all(ticketId);
    
    res.json({ ...ticket, messages });
  } catch (err) {
    console.error('Error fetching ticket:', err);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});
```

#### ✅ DEPOIS (Supabase)
```typescript
app.get('/api/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    
    // Buscar ticket com relacionamentos
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        *,
        user:users!tickets_user_id_fkey(name),
        assigned_user:users!tickets_assigned_user_id_fkey(name)
      `)
      .eq('id', ticketId)
      .single();
    
    if (ticketError || !ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    // Buscar mensagens do ticket
    const { data: messages, error: messagesError } = await supabase
      .from('ticket_messages')
      .select(`
        *,
        user:users(name, avatar_url)
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    
    if (messagesError) throw messagesError;
    
    // Formatar resposta
    const formattedTicket = {
      ...ticket,
      user_name: ticket.user?.name,
      assigned_user_name: ticket.assigned_user?.name,
      messages: messages.map(m => ({
        ...m,
        user_name: m.user?.name,
        user_avatar: m.user?.avatar_url
      }))
    };
    
    res.json(formattedTicket);
  } catch (err) {
    console.error('Error fetching ticket:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch ticket' });
  }
});
```

**💡 Observações:**
- `.single()` para retornar um único resultado (equivalente a `.get()`)
- Queries separadas podem ser feitas em paralelo com `Promise.all()`

---

### 3️⃣ POST /api/tickets - Criar Novo Ticket

#### ❌ ANTES (SQLite)
```typescript
app.post('/api/tickets', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { title, description, priority, category, client_id } = req.body;
    const userId = req.user.id;
    const clientId = client_id || req.user.client_id;
    
    const result = db
      .prepare(`
        INSERT INTO tickets (
          client_id, user_id, title, description, 
          priority, category, status
        ) VALUES (?, ?, ?, ?, ?, ?, 'open')
      `)
      .run(clientId, userId, title, description, priority, category);
    
    const newTicket = db
      .prepare('SELECT * FROM tickets WHERE id = ?')
      .get(result.lastInsertRowid);
    
    res.status(201).json(newTicket);
  } catch (err) {
    console.error('Error creating ticket:', err);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});
```

#### ✅ DEPOIS (Supabase)
```typescript
app.post('/api/tickets', authenticateToken, async (req, res) => {
  try {
    const { title, description, priority, category, client_id } = req.body;
    const userId = req.user.id;
    const clientId = client_id || req.user.client_id;
    
    const { data: newTicket, error } = await supabase
      .from('tickets')
      .insert({
        client_id: clientId,
        user_id: userId,
        title,
        description,
        priority: priority || 'medium',
        category,
        status: 'open'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json(newTicket);
  } catch (err) {
    console.error('Error creating ticket:', err);
    res.status(500).json({ error: err.message || 'Failed to create ticket' });
  }
});
```

**💡 Observações:**
- `.insert()` para criar novos registros
- `.select()` após insert retorna o registro criado
- `.single()` para retornar objeto único ao invés de array

---

### 4️⃣ PATCH /api/tickets/:id - Atualizar Ticket

#### ❌ ANTES (SQLite)
```typescript
app.patch('/api/tickets/:id', authenticateToken, requireRole(['admin', 'consultant']), async (req, res) => {
  try {
    const db = getDb();
    const ticketId = parseInt(req.params.id);
    const { status, priority, assigned_user_id, category } = req.body;
    
    const updates = [];
    const values = [];
    
    if (status) {
      updates.push('status = ?');
      values.push(status);
      if (status === 'resolved') {
        updates.push('resolved_at = datetime("now")');
      }
    }
    if (priority) { updates.push('priority = ?'); values.push(priority); }
    if (category !== undefined) { updates.push('category = ?'); values.push(category); }
    if (assigned_user_id !== undefined) { updates.push('assigned_user_id = ?'); values.push(assigned_user_id); }
    
    updates.push('updated_at = datetime("now")');
    values.push(ticketId);
    
    db.prepare(`
      UPDATE tickets 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);
    
    const updatedTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
    res.json(updatedTicket);
  } catch (err) {
    console.error('Error updating ticket:', err);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});
```

#### ✅ DEPOIS (Supabase)
```typescript
app.patch('/api/tickets/:id', authenticateToken, requireRole(['admin', 'consultant']), async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const { status, priority, assigned_user_id, category } = req.body;
    
    const updates: any = {};
    if (status) {
      updates.status = status;
      if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }
    }
    if (priority) updates.priority = priority;
    if (category !== undefined) updates.category = category;
    if (assigned_user_id !== undefined) updates.assigned_user_id = assigned_user_id;
    
    // updated_at é atualizado automaticamente pelo trigger
    
    const { data: updatedTicket, error } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', ticketId)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json(updatedTicket);
  } catch (err) {
    console.error('Error updating ticket:', err);
    res.status(500).json({ error: err.message || 'Failed to update ticket' });
  }
});
```

**💡 Observações:**
- `.update()` para atualizar registros
- `.eq()` para condição WHERE
- `updated_at` é automático graças ao trigger do schema
- Datas em ISO 8601: `new Date().toISOString()`

---

### 5️⃣ POST /api/tickets/:id/messages - Adicionar Mensagem

#### ❌ ANTES (SQLite)
```typescript
app.post('/api/tickets/:id/messages', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const ticketId = parseInt(req.params.id);
    const { message, is_internal } = req.body;
    const userId = req.user.id;
    
    const result = db
      .prepare(`
        INSERT INTO ticket_messages (ticket_id, user_id, message, is_internal)
        VALUES (?, ?, ?, ?)
      `)
      .run(ticketId, userId, message, is_internal ? 1 : 0);
    
    const newMessage = db
      .prepare(`
        SELECT tm.*, u.name as user_name, u.avatar_url
        FROM ticket_messages tm
        LEFT JOIN users u ON tm.user_id = u.id
        WHERE tm.id = ?
      `)
      .get(result.lastInsertRowid);
    
    res.status(201).json(newMessage);
  } catch (err) {
    console.error('Error adding message:', err);
    res.status(500).json({ error: 'Failed to add message' });
  }
});
```

#### ✅ DEPOIS (Supabase)
```typescript
app.post('/api/tickets/:id/messages', authenticateToken, async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const { message, is_internal } = req.body;
    const userId = req.user.id;
    
    const { data: newMessage, error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        user_id: userId,
        message,
        is_internal: is_internal || false
      })
      .select(`
        *,
        user:users(name, avatar_url)
      `)
      .single();
    
    if (error) throw error;
    
    // Formatar resposta
    const formattedMessage = {
      ...newMessage,
      user_name: newMessage.user?.name,
      avatar_url: newMessage.user?.avatar_url
    };
    
    res.status(201).json(formattedMessage);
  } catch (err) {
    console.error('Error adding message:', err);
    res.status(500).json({ error: err.message || 'Failed to add message' });
  }
});
```

**💡 Observações:**
- Booleanos: usar `true/false` ao invés de `1/0`
- `.select()` com join pode ser feito diretamente no insert

---

### 6️⃣ DELETE /api/tickets/:id - Deletar Ticket

#### ❌ ANTES (SQLite)
```typescript
app.delete('/api/tickets/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const db = getDb();
    const ticketId = parseInt(req.params.id);
    
    // Deletar mensagens primeiro (foreign key)
    db.prepare('DELETE FROM ticket_messages WHERE ticket_id = ?').run(ticketId);
    
    // Deletar ticket
    const result = db.prepare('DELETE FROM tickets WHERE id = ?').run(ticketId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.json({ message: 'Ticket deleted successfully' });
  } catch (err) {
    console.error('Error deleting ticket:', err);
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});
```

#### ✅ DEPOIS (Supabase)
```typescript
app.delete('/api/tickets/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    
    // Com CASCADE na FK, mensagens são deletadas automaticamente
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', ticketId);
    
    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return res.status(404).json({ error: 'Ticket not found' });
      }
      throw error;
    }
    
    res.json({ message: 'Ticket deleted successfully' });
  } catch (err) {
    console.error('Error deleting ticket:', err);
    res.status(500).json({ error: err.message || 'Failed to delete ticket' });
  }
});
```

**💡 Observações:**
- `ON DELETE CASCADE` no schema cuida das foreign keys automaticamente
- Verificar códigos de erro do Postgres para 404 vs 500

---

## 📊 Resumo de Conversões

| Operação | SQLite | Supabase |
|----------|--------|----------|
| **SELECT múltiplos** | `.prepare().all()` | `.select()` |
| **SELECT único** | `.prepare().get()` | `.select().single()` |
| **INSERT** | `.prepare().run()` | `.insert().select()` |
| **UPDATE** | `.prepare().run()` | `.update().eq().select()` |
| **DELETE** | `.prepare().run()` | `.delete().eq()` |
| **WHERE** | `WHERE x = ?` | `.eq('x', value)` |
| **ORDER BY** | `ORDER BY x DESC` | `.order('x', { ascending: false })` |
| **LIMIT** | `LIMIT 10` | `.limit(10)` |
| **JOIN** | `LEFT JOIN` | `select('*, table!fk(cols)')` |

---

## 🚀 Aplicando as Mudanças

Para aplicar essas mudanças no `src/api/server.ts`:

1. Adicione o import no topo:
```typescript
import { supabase } from './supabase';
```

2. Substitua cada rota uma por vez
3. Teste cada endpoint após a mudança
4. Use Postman ou Insomnia para validar

---

## 🧪 Testando as Mudanças

```bash
# Criar ticket
curl -X POST http://localhost:3001/api/tickets \
  -H "Content-Type: application/json" \
  -H "Cookie: token=SEU_JWT" \
  -d '{
    "title": "Teste Supabase",
    "description": "Testando migração",
    "priority": "medium",
    "category": "Teste"
  }'

# Listar tickets
curl http://localhost:3001/api/tickets?client_id=1 \
  -H "Cookie: token=SEU_JWT"

# Buscar ticket específico
curl http://localhost:3001/api/tickets/1 \
  -H "Cookie: token=SEU_JWT"

# Atualizar ticket
curl -X PATCH http://localhost:3001/api/tickets/1 \
  -H "Content-Type: application/json" \
  -H "Cookie: token=SEU_JWT" \
  -d '{"status": "in_progress"}'

# Adicionar mensagem
curl -X POST http://localhost:3001/api/tickets/1/messages \
  -H "Content-Type: application/json" \
  -H "Cookie: token=SEU_JWT" \
  -d '{"message": "Testando mensagem"}'
```

---

✅ **Próximo:** Aplicar o mesmo padrão para os demais módulos (sprints, documents, reports, etc.)
