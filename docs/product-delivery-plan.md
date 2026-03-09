# Wayzen Client Portal - Escopo de Entrega

Data: 2026-03-08

## 1) Objetivo do Produto
Substituir o portal no Notion por uma plataforma proprietaria com experiencia premium para clientes Wayzen, focada em transparencia de execucao, percepcao de valor e reducao de friccao na comunicacao.

## 2) Problemas que o Portal Resolve
- Cliente nao sabe o status real do projeto em tempo real.
- Informacoes ficam espalhadas entre WhatsApp, Notion e e-mail.
- Tickets e pendencias sem SLA claro.
- Documentos e relatorios sem historico confiavel.
- Dificuldade de provar valor da consultoria com indicadores.

## 3) Escopo Fechado do MVP (Entrega 1)
### 3.1 Autenticacao e Perfis
- Login por e-mail e senha.
- Perfis: admin, consultant, client.
- Sessao por cookie seguro.

### 3.2 Dashboard do Cliente
- KPIs principais: progresso de sprint, tickets abertos, total de documentos, total de relatorios.
- Timeline de atualizacoes do projeto.

### 3.3 Sprints
- Lista de sprints por semana.
- Status por sprint (planned, in_progress, completed).
- Checklist de tarefas por sprint.

### 3.4 Tickets de Suporte
- Abertura de ticket com prioridade e categoria.
- Conversa dentro do ticket.
- Mudanca de status por time Wayzen.

### 3.5 Documentos Compartilhados
- Cadastro/listagem/download de documentos (via URL nesta fase).
- Categorizacao e historico por cliente.

### 3.6 Relatorios
- Relatorios semanais e mensais por cliente.
- Conteudo textual e campo de metricas.

### 3.7 Notificacoes
- Listagem de notificacoes.
- Marcar lida individual e em massa.

## 4) Fora de Escopo no MVP (Entrega 1)
- Upload fisico de arquivo (S3/Blob/local).
- Notificacoes em tempo real (WebSocket/SSE).
- BI avancado com metas e forecast.
- App mobile nativo.
- Integracoes externas (CRM, WhatsApp API, Slack, etc.).

## 5) Entrega 2 (Upgrade para nivel "300x")
- Upload real de documentos com controle de tamanho/tipo e antivrus.
- Notificacoes em tempo real (SSE).
- SLAs de ticket (tempo de resposta, tempo de resolucao, alerta de vencimento).
- Dashboard executivo com tendencia semanal/mensal e risco de projeto.
- Trilha de auditoria (quem alterou o que e quando).
- Tema visual premium + personalizacao por cliente enterprise.

## 6) Criterios de Aceite do MVP
- Cliente consegue logar e visualizar apenas dados da propria conta.
- Dashboard abre em menos de 2s em ambiente local com base demo.
- Fluxo de ticket completo: criar, responder, atualizar status.
- Fluxo de documento completo: cadastrar, listar, abrir link.
- Fluxo de relatorio completo: cadastrar e visualizar historico.
- Sem erros de TypeScript no workspace.

## 7) KPIs de Sucesso do Produto
- Taxa de clientes ativos no portal (WAU/MAU).
- Tempo medio de primeira resposta em tickets.
- NPS da experiencia digital do cliente.
- Reducao de mensagens fora do portal.
- Retencao (churn) comparando clientes que usam o portal vs nao usam.

## 8) Riscos e Mitigacoes
- Risco: dependencia nativa de SQLite em ambientes com Node muito novo.
  Mitigacao: padronizar Node LTS e CI com versao fixa.
- Risco: escopo inflar antes de estabilizar base.
  Mitigacao: gate de mudancas por sprint e criterio de aceite fechado.
- Risco: cliente nao adotar o portal.
  Mitigacao: onboarding guiado + alertas e valor claro no dashboard.

## 9) Definicao de Pronto (DoD)
- Feature implementada com validacao de permissao por perfil.
- Testada manualmente em fluxos principais.
- Documentada no README/guia de operacao.
- Sem regressao visual em desktop e mobile.

## 10) Proximos Passos de Alinhamento
1. Validar e aprovar escopo do MVP sem adicionar itens novos.
2. Priorizar Entrega 2 em ordem de impacto comercial.
3. Definir data de go-live e clientes piloto.
