-- =====================================================
-- CORRIGIR LOGIN: Vincular users manualmente
-- =====================================================

-- Execute esta query PRIMEIRO para ver os emails em auth.users
SELECT id, email FROM auth.users;

-- Depois, crie UPDATE statements para cada um
-- EXEMPLO (substitua os UUIDs pelos valores reais):

-- UPDATE public.users SET auth_user_id = '98ce61ac-34dd-485f-a13f-630fc38e0b24' WHERE email = 'pedrohemedesds@gmail.com';
-- UPDATE public.users SET auth_user_id = 'UUID_DO_ADMIN_AQUI' WHERE email = 'admin@wayzen.com.br';
-- UPDATE public.users SET auth_user_id = 'UUID_DO_CONSULTOR_AQUI' WHERE email = 'consultor@wayzen.com.br';
-- UPDATE public.users SET auth_user_id = 'UUID_DA_MARIA_AQUI' WHERE email = 'maria@escolaabc.com.br';
-- UPDATE public.users SET auth_user_id = 'UUID_DO_JOAO_AQUI' WHERE email = 'joao@techstart.com.br';

-- =====================================================
-- VERIFICAR SE FUNCIONOU:
-- =====================================================

SELECT 
  u.id,
  u.email,
  u.auth_user_id,
  u.role,
  CASE WHEN u.auth_user_id IS NOT NULL THEN 'LINKED ✓' ELSE 'NOT_LINKED ✗' END as status
FROM public.users u
ORDER BY u.id;
