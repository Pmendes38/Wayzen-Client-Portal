# ============================================
# 🐳 WAYZEN CLIENT PORTAL - DOCKER
# ============================================
# Este Dockerfile cria uma imagem otimizada para produção
# com Node.js 20 Alpine (imagem leve)
# ============================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Copiar código fonte
COPY . .

# Build do projeto (frontend + backend)
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Instalar apenas produção
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar build da stage anterior
COPY --from=builder /app/dist ./dist

# Copiar código necessário do backend
COPY src/api/*.ts ./src/api/

# Variáveis de ambiente (substituir em runtime)
ENV NODE_ENV=production
ENV PORT=3001

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Usuário não-root para segurança
USER node

# Comando de inicialização
CMD ["npm", "run", "start:prod"]
