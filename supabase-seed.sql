-- Wayzen Client Portal - Seed Data (Dados de Exemplo)
-- Execute este script APÓS o supabase-schema.sql

-- ============================================================================
-- SEED: clients
-- ============================================================================
INSERT INTO clients (id, company_name, trade_name, cnpj, segment, contact_name, contact_email, contact_phone, status, monthly_fee, contract_start)
VALUES 
  (1, 'Escola ABC Educação', 'ABC Escola', '12.345.678/0001-99', 'Educação', 'Maria Silva', 'maria@escolaabc.com.br', '(11) 98765-4321', 'active', 5000, '2024-01-15'),
  (2, 'TechStart Inovação Ltda', 'TechStart', '98.765.432/0001-11', 'Tecnologia', 'João Santos', 'joao@techstart.com.br', '(11) 91234-5678', 'active', 7500, '2024-02-01')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence para clients se necessário
SELECT setval('clients_id_seq', (SELECT MAX(id) FROM clients));

-- ============================================================================
-- SEED: users
-- Senha: admin123, consultor123, cliente123 
-- (Hash SHA256 - substitua por bcrypt em produção)
-- ============================================================================
INSERT INTO users (id, email, name, password_hash, role, client_id, phone, is_active)
VALUES 
  (1, 'admin@wayzen.com.br', 'Admin Wayzen', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin', NULL, '(11) 99999-0001', TRUE),
  (2, 'consultor@wayzen.com.br', 'Carlos Consultor', '7e31b85bb0182bf78c7ee2f6ed34e746292d8cff61320390cf685d59f878381a', 'consultant', NULL, '(11) 99999-0002', TRUE),
  (3, 'maria@escolaabc.com.br', 'Maria Silva', '09a31a7001e261ab1e056182a71d3cf57f582ca9a29cff5eb83be0f0549730a9', 'client', 1, '(11) 98765-4321', TRUE),
  (4, 'joao@techstart.com.br', 'João Santos', '09a31a7001e261ab1e056182a71d3cf57f582ca9a29cff5eb83be0f0549730a9', 'client', 2, '(11) 91234-5678', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Reset sequence para users
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- ============================================================================
-- SEED: sprints
-- ============================================================================
INSERT INTO sprints (id, client_id, name, week_number, status, start_date, end_date, notes)
VALUES 
  (1, 1, 'Sprint 1 - Setup Inicial', 1, 'completed', '2024-01-15', '2024-01-21', 'Configuração do ambiente e arquitetura inicial'),
  (2, 1, 'Sprint 2 - Módulo de Autenticação', 2, 'completed', '2024-01-22', '2024-01-28', 'Implementação do sistema de login e permissões'),
  (3, 1, 'Sprint 3 - Dashboard e Métricas', 3, 'in_progress', '2024-01-29', '2024-02-04', 'Desenvolvimento do dashboard principal'),
  (4, 2, 'Sprint 1 - Pesquisa & Discovery', 1, 'completed', '2024-02-01', '2024-02-07', 'Levantamento de requisitos e wireframes'),
  (5, 2, 'Sprint 2 - Prototipação', 2, 'in_progress', '2024-02-08', '2024-02-14', 'Protótipos de alta fidelidade no Figma')
ON CONFLICT (id) DO NOTHING;

SELECT setval('sprints_id_seq', (SELECT MAX(id) FROM sprints));

-- ============================================================================
-- SEED: sprint_tasks
-- ============================================================================
INSERT INTO sprint_tasks (sprint_id, title, description, week_number, is_completed, task_order)
VALUES 
  -- Sprint 1
  (1, 'Configurar repositório Git', 'Criar repositório e estrutura de branches', 1, TRUE, 1),
  (1, 'Setup do ambiente de desenvolvimento', 'Docker, Node.js, PostgreSQL', 1, TRUE, 2),
  (1, 'Definir stack tecnológico', 'React, TypeScript, Tailwind CSS', 1, TRUE, 3),
  
  -- Sprint 2
  (2, 'Modelagem do banco de dados', 'Tabelas de users, roles e permissions', 2, TRUE, 1),
  (2, 'API de autenticação JWT', 'Login, logout, refresh token', 2, TRUE, 2),
  (2, 'Tela de login frontend', 'Design e integração com API', 2, TRUE, 3),
  
  -- Sprint 3 (em progresso)
  (3, 'Componentes de gráficos', 'Integração com Recharts', 3, TRUE, 1),
  (3, 'API de métricas', 'Endpoints para dashboard', 3, TRUE, 2),
  (3, 'Layout do dashboard', 'Grid responsivo com cards', 3, FALSE, 3),
  (3, 'Filtros de período', 'Seletor de data e atualização em tempo real', 3, FALSE, 4),
  
  -- Sprint 4
  (4, 'Entrevistas com stakeholders', 'Coleta de requisitos', 1, TRUE, 1),
  (4, 'Mapeamento de jornadas', 'User flows principais', 1, TRUE, 2),
  (4, 'Wireframes low-fidelity', 'Esboços das telas principais', 1, TRUE, 3),
  
  -- Sprint 5
  (5, 'Design system no Figma', 'Cores, tipografia, componentes', 2, TRUE, 1),
  (5, 'Protótipo interativo', 'Fluxo completo clicável', 2, FALSE, 2),
  (5, 'Testes de usabilidade', 'Validação com 5 usuários', 2, FALSE, 3)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED: tickets
-- ============================================================================
INSERT INTO tickets (id, client_id, user_id, title, description, priority, status, category, assigned_user_id)
VALUES 
  (1, 1, 3, 'Erro ao exportar relatório em PDF', 'Quando tento exportar o relatório mensal em PDF, aparece uma mensagem de erro.', 'high', 'in_progress', 'Bug', 2),
  (2, 1, 3, 'Adicionar filtro por período no dashboard', 'Seria útil ter um filtro para visualizar métricas de períodos específicos.', 'medium', 'open', 'Feature Request', NULL),
  (3, 2, 4, 'Dúvida sobre licenciamento', 'Preciso entender as opções de licença para uso comercial.', 'low', 'resolved', 'Dúvida', 2),
  (4, 1, 3, 'Performance lenta ao carregar documentos', 'A página de documentos demora muito para carregar quando há muitos arquivos.', 'urgent', 'open', 'Bug', 2)
ON CONFLICT (id) DO NOTHING;

SELECT setval('tickets_id_seq', (SELECT MAX(id) FROM tickets));

-- ============================================================================
-- SEED: ticket_messages
-- ============================================================================
INSERT INTO ticket_messages (ticket_id, user_id, message, is_internal)
VALUES 
  (1, 3, 'O erro acontece especificamente no relatório de janeiro.', FALSE),
  (1, 2, 'Obrigado pelo relato! Já estamos investigando.', FALSE),
  (1, 2, 'Identificamos que é um problema com a biblioteca de geração de PDF.', TRUE),
  (3, 4, 'Gostaria de usar o sistema em 3 filiais diferentes.', FALSE),
  (3, 2, 'Para uso em múltiplas unidades, recomendo o plano Enterprise.', FALSE),
  (3, 4, 'Perfeito, obrigado pela explicação!', FALSE)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED: shared_documents
-- ============================================================================
INSERT INTO shared_documents (id, client_id, title, description, file_url, file_name, file_size, mime_type, category, uploaded_by_user_id)
VALUES 
  (1, 1, 'Contrato de Prestação de Serviços', 'Contrato assinado em 15/01/2024', '/docs/contrato-abc-2024.pdf', 'contrato-abc-2024.pdf', 524288, 'application/pdf', 'Contratos', 1),
  (2, 1, 'Manual do Usuário v1.0', 'Guia completo de uso da plataforma', '/docs/manual-usuario-v1.pdf', 'manual-usuario-v1.pdf', 2097152, 'application/pdf', 'Documentação', 2),
  (3, 1, 'Arquitetura do Sistema', 'Diagrama técnico da arquitetura', '/docs/arquitetura.png', 'arquitetura.png', 1048576, 'image/png', 'Técnico', 2),
  (4, 2, 'Proposta Comercial TechStart', 'Proposta inicial com escopo e valores', '/docs/proposta-techstart.pdf', 'proposta-techstart.pdf', 768000, 'application/pdf', 'Comercial', 1)
ON CONFLICT (id) DO NOTHING;

SELECT setval('shared_documents_id_seq', (SELECT MAX(id) FROM shared_documents));

-- ============================================================================
-- SEED: shared_reports
-- ============================================================================
INSERT INTO shared_reports (id, client_id, title, type, period_start, period_end, content, metrics, created_by_user_id)
VALUES 
  (1, 1, 'Relatório Semanal - Semana 1', 'weekly', '2024-01-15', '2024-01-21', 
   '# Progresso da Semana\n\n## Realizações\n- Setup do ambiente\n- Definição da arquitetura\n\n## Próximos Passos\n- Iniciar desenvolvimento do módulo de auth', 
   '{"tasks_completed": 8, "tasks_total": 10, "hours_worked": 32}', 2),
  (2, 1, 'Relatório Mensal - Janeiro 2024', 'monthly', '2024-01-01', '2024-01-31',
   '# Resumo do Mês\n\n## Conquistas\n- Projeto iniciado com sucesso\n- 2 sprints concluídas\n- 16 tarefas completadas\n\n## Métricas\n- Velocity: 8 pts/sprint\n- Satisfação: 9/10',
   '{"sprints_completed": 2, "tasks_completed": 16, "velocity": 8, "satisfaction": 9}', 2),
  (3, 2, 'Relatório Semanal - Semana 1', 'weekly', '2024-02-01', '2024-02-07',
   '# Discovery Week\n\n## Entregáveis\n- Documento de requisitos\n- Wireframes iniciais\n- Mapa de jornadas',
   '{"meetings": 5, "deliverables": 3, "stakeholders": 4}', 2)
ON CONFLICT (id) DO NOTHING;

SELECT setval('shared_reports_id_seq', (SELECT MAX(id) FROM shared_reports));

-- ============================================================================
-- SEED: notifications
-- ============================================================================
INSERT INTO notifications (user_id, title, message, type, is_read, link_to)
VALUES 
  (3, 'Novo relatório disponível', 'O relatório mensal de janeiro foi publicado', 'report', FALSE, '/reports'),
  (3, 'Ticket atualizado', 'Seu ticket #1 foi atualizado pela equipe', 'ticket_update', FALSE, '/tickets/1'),
  (3, 'Sprint concluída', 'A Sprint 2 foi marcada como concluída', 'sprint_update', TRUE, '/sprints'),
  (3, 'Novo documento compartilhado', 'Manual do Usuário v1.0 está disponível', 'document', TRUE, '/documents'),
  (4, 'Bem-vindo ao portal!', 'Sua conta foi criada com sucesso', 'system', TRUE, '/dashboard'),
  (4, 'Ticket resolvido', 'Seu ticket #3 foi resolvido', 'ticket_update', FALSE, '/tickets/3')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED: project_updates
-- ============================================================================
INSERT INTO project_updates (client_id, title, content, type, created_by_user_id)
VALUES 
  (1, 'Kick-off Meeting Realizado', 'Primeira reunião de alinhamento do projeto realizada com sucesso. Próximos passos definidos.', 'milestone', 1),
  (1, 'Sprint 1 Concluída', 'Todas as tarefas da Sprint 1 foram completadas. Ambiente configurado e arquitetura aprovada.', 'update', 2),
  (1, 'Atenção: Ajuste no Cronograma', 'Precisaremos de mais 2 dias na Sprint 3 devido à complexidade do dashboard.', 'alert', 2),
  (2, 'Proposta Aprovada', 'Cliente aprovou a proposta comercial. Contrato em andamento.', 'milestone', 1),
  (2, 'Protótipos em Revisão', 'Enviamos os protótipos de alta fidelidade para análise do cliente.', 'delivery', 2)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED COMPLETE!
-- ============================================================================
-- Dados de exemplo inseridos com sucesso!
-- Você pode fazer login com:
-- - admin@wayzen.com.br / admin123
-- - consultor@wayzen.com.br / consultor123  
-- - maria@escolaabc.com.br / cliente123
-- - joao@techstart.com.br / cliente123
