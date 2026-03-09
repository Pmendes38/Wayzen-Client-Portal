# 🚀 Guia de Deploy - Wayzen Client Portal

Este guia detalha como fazer deploy do Wayzen Client Portal em diferentes plataformas de hospedagem.

---

## 📋 Pré-requisitos

Antes de fazer deploy, certifique-se de que:

- [x] Migração para Supabase está completa
- [x] Todas as variáveis de ambiente estão configuradas
- [x] Testes da API estão passando (`npm run test:api`)
- [x] Build local funciona sem erros (`npm run build`)
- [x] RLS policies foram aplicadas (opcional, mas recomendado)

---

## 🎯 Opções de Deploy

### 1. 🚀 Vercel (Recomendado para Full Stack)

**Vantagens:** Deploy automático, CI/CD, edge functions, fácil configuração

#### Passo a Passo:

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login no Vercel
vercel login

# 3. Deploy inicial (configuração interativa)
vercel

# 4. Deploy para produção
vercel --prod
```

#### Configuração no Dashboard:

1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecione o projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione todas as variáveis de `.env.production.example`:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **Sensitive**
   - `SUPABASE_ANON_KEY`
   - `JWT_SECRET` ⚠️ **Sensitive**
   - `NODE_ENV=production`
5. Configure **Build & Development Settings**:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

#### Domínio Personalizado:

```bash
vercel domains add seu-dominio.com.br
```

---

### 2. 🚂 Railway (Recomendado para Backend)

**Vantagens:** Deploy simples, PostgreSQL integrado, preço justo

#### Passo a Passo:

1. Acesse [railway.app](https://railway.app)
2. Crie novo projeto → **Deploy from GitHub repo**
3. Selecione o repositório `Wayzen-Client-Portal`
4. Railway detectará automaticamente o `railway.toml`

#### Configuração de Variáveis:

1. No painel do projeto, clique em **Variables**
2. Adicione:
   ```env
   SUPABASE_URL=https://stnnvoqvitenovvpqoia.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=seu_service_role_key
   SUPABASE_ANON_KEY=seu_anon_key
   JWT_SECRET=seu_jwt_secret_super_forte
   NODE_ENV=production
   PORT=3001
   ```

#### Deploy Manual:

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link ao projeto
railway link

# Deploy
railway up
```

---

### 3. 🐳 Docker (Para qualquer plataforma)

**Vantagens:** Portabilidade total, controle completo, funciona em qualquer cloud

#### Build Local:

```bash
# Build da imagem
docker build -t wayzen-portal .

# Testar localmente
docker run -p 3001:3001 \
  -e SUPABASE_URL=https://stnnvoqvitenovvpqoia.supabase.co \
  -e SUPABASE_SERVICE_ROLE_KEY=sua_key \
  -e JWT_SECRET=seu_secret \
  wayzen-portal

# Ou usar docker-compose
docker-compose up -d
```

#### Deploy no Docker Hub:

```bash
# Login no Docker Hub
docker login

# Tag da imagem
docker tag wayzen-portal seu-usuario/wayzen-portal:latest

# Push para Docker Hub
docker push seu-usuario/wayzen-portal:latest
```

#### Deploy em Cloud (AWS ECS, Google Cloud Run, Azure Container Apps):

```bash
# Exemplo: Google Cloud Run
gcloud run deploy wayzen-portal \
  --image seu-usuario/wayzen-portal:latest \
  --platform managed \
  --region southamerica-east1 \
  --allow-unauthenticated \
  --set-env-vars SUPABASE_URL=...,JWT_SECRET=...
```

---

### 4. 🌐 Render

**Vantagens:** Simples, gratuito para começar, PostgreSQL incluído

#### Passo a Passo:

1. Acesse [render.com](https://render.com)
2. **New** → **Web Service**
3. Conecte o repositório GitHub
4. Configure:
   - **Name:** wayzen-client-portal
   - **Environment:** Node
   - **Build Command:** `npm run build`
   - **Start Command:** `npm run start:prod`
   - **Plan:** Free (ou Starter para produção)

#### Variáveis de Ambiente:

Adicione no painel **Environment**:
```env
SUPABASE_URL=https://stnnvoqvitenovvpqoia.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...
JWT_SECRET=...
NODE_ENV=production
```

---

### 5. ☁️ AWS (Amazon Web Services)

**Vantagens:** Escalabilidade máxima, controle total, infraestrutura robusta

#### Opções:

**A. AWS Elastic Beanstalk (mais fácil)**

```bash
# Instalar EB CLI
pip install awsebcli

# Inicializar
eb init -p node.js wayzen-portal

# Criar ambiente
eb create production

# Deploy
eb deploy

# Configurar variáveis
eb setenv SUPABASE_URL=... JWT_SECRET=...
```

**B. AWS ECS + Fargate (Docker)**

1. Fazer push da imagem para ECR
2. Criar task definition
3. Criar service no ECS
4. Configurar ALB (Application Load Balancer)

**C. AWS Lambda + API Gateway (Serverless)**

```bash
# Instalar Serverless Framework
npm i -g serverless

# Criar serverless.yml
serverless deploy
```

---

## 🔐 Segurança em Produção

### 1. Variáveis de Ambiente

✅ **FAZER:**
- Usar secrets manager da plataforma
- Rotacionar secrets regularmente
- Diferentes secrets por ambiente (dev/staging/prod)
- JWT_SECRET com no mínimo 64 caracteres

❌ **NÃO FAZER:**
- Commitar `.env` com valores reais
- Usar mesmos secrets em dev e prod
- Expor `SUPABASE_SERVICE_ROLE_KEY` no frontend

### 2. CORS Configuration

Em `src/api/server.ts`, configure CORS corretamente:

```typescript
app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'https://seu-dominio.com.br',
  credentials: true 
}));
```

### 3. Rate Limiting (Recomendado)

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // limite de 100 requests por IP
});

app.use('/api/', limiter);
```

### 4. Helmet (Security Headers)

```bash
npm install helmet
```

```typescript
import helmet from 'helmet';
app.use(helmet());
```

---

## 📊 Monitoramento

### 1. Sentry (Error Tracking)

```bash
npm install @sentry/node @sentry/tracing
```

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### 2. Supabase Dashboard

- Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
- Monitore queries lentas em **Database** → **Slow Queries**
- Verifique uso em **Settings** → **Usage**

### 3. Health Checks

O servidor já tem endpoint de health check:

```bash
curl https://seu-backend.com/
# Resposta: { status: 'ok', message: 'Wayzen Client Portal API' }
```

Configure alertas para verificar este endpoint a cada 5 minutos.

---

## 🔄 CI/CD (Continuous Integration/Deployment)

### GitHub Actions

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm run test:api
    
    - name: Type check
      run: npm run type-check
    
    - name: Build
      run: npm run build
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

---

## 📝 Checklist de Deploy

Antes de fazer deploy para produção:

### Preparação
- [ ] Todos os testes passando (`npm run test:api`)
- [ ] Build local funcionando (`npm run build`)
- [ ] Type checking sem erros (`npm run type-check`)
- [ ] Validação do Supabase ok (`npm run db:validate`)

### Configuração
- [ ] Variáveis de ambiente configuradas na plataforma
- [ ] Novo JWT_SECRET gerado (64+ caracteres)
- [ ] CORS configurado com domínios corretos
- [ ] RLS policies aplicadas no Supabase (opcional)
- [ ] SSL/HTTPS configurado

### Segurança
- [ ] `.env` no `.gitignore`
- [ ] Service Role Key APENAS no backend
- [ ] Secrets rotacionados
- [ ] Rate limiting configurado (opcional)
- [ ] Security headers configurados (opcional)

### Monitoramento
- [ ] Error tracking configurado (Sentry/similar)
- [ ] Health checks configurados
- [ ] Alerts para downtimes
- [ ] Backup do banco configurado no Supabase

### Documentação
- [ ] README atualizado com URL de produção
- [ ] Processo de rollback documentado
- [ ] Variáveis de ambiente documentadas
- [ ] Acessos à plataforma compartilhados com time

---

## 🆘 Troubleshooting

### Erro: "Cannot find module 'dotenv'"

**Solução:** Certifique-se de instalar dependências de produção:
```bash
npm ci --only=production
```

### Erro: "CORS policy: No 'Access-Control-Allow-Origin'"

**Solução:** Configure CORS no `server.ts`:
```typescript
app.use(cors({ 
  origin: ['https://seu-dominio.com.br', 'https://outro-dominio.com'],
  credentials: true 
}));
```

### Erro: "Invalid API key" do Supabase

**Solução:** Verifique se `SUPABASE_SERVICE_ROLE_KEY` está configurado corretamente.

### Build Failing

**Solução:** Execute localmente para ver erro detalhado:
```bash
npm run build
npm run type-check
```

### Deploy Slow

**Solução:** 
- Use cache de dependências (npm ci)
- Configure build cache na plataforma
- Otimize bundle size (code splitting)

---

## 📚 Recursos Adicionais

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [Node.js Production Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## 🎯 Próximos Passos

Após deploy bem-sucedido:

1. ✅ Configure domínio personalizado
2. ✅ Configure SSL/HTTPS
3. ✅ Ative monitoramento
4. ✅ Configure backups automáticos
5. ✅ Documente processo de rollback
6. ✅ Treine equipe no processo de deploy
7. ✅ Configure staging environment

---

**🎉 Parabéns! Seu Wayzen Client Portal está no ar!**

Para dúvidas ou problemas, consulte este guia ou a documentação oficial das plataformas.
