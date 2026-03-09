/**
 * Script de Validação: Verifica se todas as tabelas do Supabase foram criadas
 * Execute: node scripts/validate-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const EXPECTED_TABLES = [
  'users',
  'clients',
  'project_updates',
  'sprints',
  'sprint_tasks',
  'tickets',
  'ticket_messages',
  'shared_documents',
  'shared_reports',
  'notifications'
];

async function validateTables() {
  console.log('🔍 Validando estrutura do Supabase...\n');

  let allValid = true;

  for (const table of EXPECTED_TABLES) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        allValid = false;
      } else {
        console.log(`✅ ${table}: ${count} registros`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
      allValid = false;
    }
  }

  console.log('\n' + '='.repeat(50));
  if (allValid) {
    console.log('✅ TODAS AS TABELAS VALIDADAS COM SUCESSO!');
    console.log('🚀 Pronto para migrar o backend!');
  } else {
    console.log('❌ Algumas tabelas estão faltando ou com erro.');
    console.log('Execute supabase-schema.sql e supabase-seed.sql no Supabase.');
  }
  console.log('='.repeat(50));
}

validateTables().catch(console.error);
