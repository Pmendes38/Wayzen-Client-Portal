-- =====================================================
-- LIMPAR: Deletar usuários NOT_LINKED com cascata COMPLETA
-- =====================================================

-- Delete de forma mais abrangente
DELETE FROM public.ticket_messages 
WHERE user_id IN (SELECT id FROM public.users WHERE auth_user_id IS NULL);

DELETE FROM public.shared_documents 
WHERE uploaded_by_user_id IN (SELECT id FROM public.users WHERE auth_user_id IS NULL);

DELETE FROM public.project_updates 
WHERE created_by_user_id IN (SELECT id FROM public.users WHERE auth_user_id IS NULL);

DELETE FROM public.shared_reports
WHERE created_by_user_id IN (SELECT id FROM public.users WHERE auth_user_id IS NULL);

DELETE FROM public.tickets
WHERE user_id IN (SELECT id FROM public.users WHERE auth_user_id IS NULL);

-- Finalmente, deletar os usuários
DELETE FROM public.users
WHERE auth_user_id IS NULL;

-- Verificar resultado
SELECT COUNT(*) as users_remaining FROM public.users;
