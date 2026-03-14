-- =====================================================
-- DIAGNÓSTICO: verificar estado dos dados - SEM ERROS
-- =====================================================

-- Execute cada query separadamente (copie uma por vez)

-- QUERY 1: Ver usuários e seus dados
SELECT 
  id, 
  email, 
  auth_user_id, 
  role, 
  client_id,
  is_active
FROM public.users
LIMIT 10;

-- QUERY 2: Verificar se as funções RLS foram criadas
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE 'portal_%'
ORDER BY routine_name;

-- QUERY 3: Verificar total de usuários em auth.users
SELECT COUNT(*) as total_auth_users
FROM auth.users;

-- QUERY 4: Verificar correspondência email entre auth.users e public.users
SELECT 
  u.id as user_id,
  u.email,
  u.auth_user_id,
  u.role,
  u.client_id,
  CASE WHEN au.id IS NOT NULL THEN 'LINKED ✓' ELSE 'NOT_LINKED ✗' END as link_status
FROM public.users u
LEFT JOIN auth.users au ON au.id = u.auth_user_id;

-- QUERY 5: Testar cada função (execute uma por vez após as queries acima)
-- SELECT public.portal_is_admin() as is_admin;
-- SELECT public.portal_is_consultant() as is_consultant;
-- SELECT public.portal_user_client_id() as user_client_id;
