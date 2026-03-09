-- Fix Password Hashes (Execute no Supabase SQL Editor)
-- Atualiza os hashes de senha para os valores corretos SHA256

UPDATE users SET password_hash = '7e31b85bb0182bf78c7ee2f6ed34e746292d8cff61320390cf685d59f878381a' WHERE id = 2; -- consultor123
UPDATE users SET password_hash = '09a31a7001e261ab1e056182a71d3cf57f582ca9a29cff5eb83be0f0549730a9' WHERE id = 3; -- cliente123
UPDATE users SET password_hash = '09a31a7001e261ab1e056182a71d3cf57f582ca9a29cff5eb83be0f0549730a9' WHERE id = 4; -- cliente123

-- Verificar alterações
SELECT id, email, substring(password_hash, 1, 20) as hash_preview FROM users ORDER BY id;
