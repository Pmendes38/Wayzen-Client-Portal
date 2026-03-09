/**
 * Fix Password Hashes no Supabase
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixPasswords() {
  console.log('🔧 Corrigindo password hashes no Supabase...\n');
  
  const fixes = [
    { id: 2, email: 'consultor@wayzen.com.br', hash: '7e31b85bb0182bf78c7ee2f6ed34e746292d8cff61320390cf685d59f878381a', password: 'consultor123' },
    { id: 3, email: 'maria@escolaabc.com.br', hash: '09a31a7001e261ab1e056182a71d3cf57f582ca9a29cff5eb83be0f0549730a9', password: 'cliente123' },
    { id: 4, email: 'joao@techstart.com.br', hash: '09a31a7001e261ab1e056182a71d3cf57f582ca9a29cff5eb83be0f0549730a9', password: 'cliente123' }
  ];
  
  for (const fix of fixes) {
    const { error } = await supabase
      .from('users')
      .update({ password_hash: fix.hash })
      .eq('id', fix.id);
    
    if (error) {
      console.log(`❌ Erro ao atualizar ${fix.email}:`, error.message);
    } else {
      console.log(`✅ ${fix.email} - senha: ${fix.password}`);
    }
  }
  
  console.log('\n✅ Senhas corrigidas com sucesso!');
}

fixPasswords().catch(console.error);
