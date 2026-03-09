# 🚀 INSTRUÇÕES DE DEPLOY NO VERCEL

## ✅ PRÉ-REQUISITOS CONCLUÍDOS

Todos os itens do checklist foram preparados:

- ✅ **JWT_SECRET forte gerado:** 128 caracteres
- ✅ **Arquivo .env.production criado** com todas as variáveis
- ✅ **CORS configurado** para produção
- ✅ **Vercel CLI instalado** (versão 50.28.0)
- ✅ **TypeScript validado** sem erros
- ✅ **Build testado** e funcionando

---

## 📋 PASSOS PARA DEPLOY

### 1️⃣ Fazer Login no Vercel

Abra o terminal e execute:

```bash
vercel login
```

**Você verá:**
- Uma mensagem pedindo para escolher método de login
- Opções: Email, GitHub, GitLab, Bitbucket

**Escolha seu método preferido** (recomendo GitHub se você já tem conta)

---

### 2️⃣ Deploy Inicial (Staging)

Após o login, execute:

```bash
vercel
```

**O que acontece:**
1. Vercel detecta automaticamente o projeto
2. Pergunta: "Set up and deploy?"
   - **Responda:** `Y` (Yes)
3. Pergunta: "Which scope?"
   - **Selecione:** Seu username/organização
4. Pergunta: "Link to existing project?"
   - **Responda:** `N` (No - é um projeto novo)
5. Pergunta: "What's your project's name?"
   - **Responda:** `wayzen-client-portal` (ou o nome que preferir)
6. Pergunta: "In which directory is your code located?"
   - **Responda:** `./` (default)
7. Vercel detecta Vite automaticamente
8. Pergunta: "Want to override the settings?"
   - **Responda:** `N` (No)

**Aguarde o build e deploy...**

🎉 Ao final, você receberá:
- **URL de preview:** `https://wayzen-client-portal-xxxx.vercel.app`

---

### 3️⃣ Configurar Variáveis de Ambiente

Acesse o dashboard do Vercel:

1. Vá para: https://vercel.com/dashboard
2. Clique no projeto **wayzen-client-portal**
3. Vá em **Settings** → **Environment Variables**

**Adicione as seguintes variáveis:**

```env
SUPABASE_URL = https://stnnvoqvitenovvpqoia.supabase.co
```
- Environment: Production, Preview, Development ✓

```env
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0bm52b3F2aXRlbm92dnBxb2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMTE3NTUsImV4cCI6MjA4ODU4Nzc1NX0.McoTevwsYXn54Cl35FpDKelC7L9YC23cqgL_cLOAbGc
```
- Environment: Production, Preview, Development ✓

```env
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0bm52b3F2aXRlbm92dnBxb2lhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzAxMTc1NSwiZXhwIjoyMDg4NTg3NzU1fQ.yX66uXzvTmzcxbE9cWIdPuQgOgzcCUGBKjByaAiJ71s
```
- Environment: Production, Preview, Development ✓
- ⚠️ **IMPORTANTE:** Marque como "Sensitive"

```env
JWT_SECRET = 44884d138bae10813582c4558c30fde3e0b6685cacc47789f7be8b6a0012fca11f9f747379623d575eb6f0f54b71785303029fff873a2a3aab873e9393b57d4b
```
- Environment: Production, Preview, Development ✓
- ⚠️ **IMPORTANTE:** Marque como "Sensitive"

```env
NODE_ENV = production
```
- Environment: Production ✓

```env
PORT = 3001
```
- Environment: Production, Preview, Development ✓

**Copie essas variáveis do arquivo .env.production que foi criado!**

---

### 4️⃣ Deploy para Produção

Após configurar as variáveis, execute:

```bash
vercel --prod
```

**O que acontece:**
- Vercel faz build e deploy para produção
- Usa as variáveis de ambiente configuradas
- Gera URL final: `https://wayzen-client-portal.vercel.app`

---

### 5️⃣ Atualizar URLs no Vercel (Opcional mas Recomendado)

Após o deploy, pegue a URL final (ex: `https://wayzen-client-portal.vercel.app`)

**Volte ao dashboard:**
1. Settings → Environment Variables
2. **Edite** `FRONTEND_URL` e `BACKEND_URL` com a URL real
3. Salve e faça redeploy:

```bash
vercel --prod
```

---

## 🎯 VERIFICAÇÕES PÓS-DEPLOY

### 1. Testar o Frontend

Acesse: `https://wayzen-client-portal.vercel.app`

✅ Deve carregar a página de login

### 2. Testar o Backend

Abra: `https://wayzen-client-portal.vercel.app/api`

✅ Deve retornar:
```json
{
  "status": "ok",
  "message": "Wayzen Client Portal API"
}
```

### 3. Testar Login

Use as credenciais de teste:
- **Email:** admin@wayzen.com.br
- **Senha:** admin123

✅ Deve fazer login com sucesso

---

## 🔧 COMANDOS ÚTEIS

```bash
# Ver logs em tempo real
vercel logs

# Ver lista de deploys
vercel ls

# Ver informações do projeto
vercel inspect

# Remover projeto (cuidado!)
vercel remove wayzen-client-portal
```

---

## 🆘 TROUBLESHOOTING

### Erro: "Build failed"

**Solução:**
```bash
# Testar build localmente
npm run build

# Se funcionar, tente deploy novamente
vercel --prod
```

### Erro: "Environment variable missing"

**Solução:**
- Verifique se todas as variáveis foram adicionadas no dashboard
- Verifique se marcou "Production, Preview, Development"
- Faça redeploy: `vercel --prod`

### Erro: CORS

**Solução:**
- Atualize `FRONTEND_URL` e `BACKEND_URL` com URL real do Vercel
- Faça redeploy

### API não responde

**Solução:**
- Verifique logs: `vercel logs`
- Confirme que `SUPABASE_SERVICE_ROLE_KEY` está correto
- Teste conexão Supabase: `npm run db:validate`

---

## 📊 CHECKLIST FINAL

Antes de considerar deployment completo:

- [ ] Deploy feito com sucesso
- [ ] Frontend carrega sem erros
- [ ] API responde em `/api`
- [ ] Login funciona com credenciais de teste
- [ ] Dados carregam do Supabase
- [ ] Sem erros no console do browser
- [ ] Sem erros nos logs do Vercel

---

## 🎉 PRONTO!

Seu Wayzen Client Portal está no ar! 🚀

**URLs:**
- **Frontend:** https://wayzen-client-portal.vercel.app
- **API:** https://wayzen-client-portal.vercel.app/api

**Próximos passos opcionais:**
1. Configurar domínio personalizado
2. Configurar SSL customizado
3. Ativar Analytics do Vercel
4. Configurar notificações de deploy
5. Setup CI/CD com GitHub

---

## 📞 SUPORTE

Se precisar de ajuda:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support)
- Consulte [DEPLOY-GUIDE.md](DEPLOY-GUIDE.md)

**Boa sorte com o deploy! 🎊**
