/**
 * Script de Teste Completo - API Migrada para Supabase
 * Execute: node scripts/test-migrated-api.js
 */

const fetch = require('node-fetch');
require('dotenv').config();

const API_URL = 'http://localhost:3001';
let adminToken = '';
let clientToken = '';

async function testLogin() {
  console.log('\n🔐 Testando Login...');
  
  // Login como admin
  const adminRes = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@wayzen.com.br',
      password: 'admin123'
    })
  });
  
  const adminData = await adminRes.json();
  adminToken = adminData.token;
  console.log(`✅ Admin login: ${adminData.user.name} (${adminData.user.role})`);
  
  // Login como client
  const clientRes = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'maria@escolaabc.com.br',
      password: 'cliente123'
    })
  });
  
  const clientData = await clientRes.json();
  clientToken = clientData.token;
  console.log(`✅ Client login: ${clientData.user.name} (${clientData.user.role})`);
}

async function testTickets() {
  console.log('\n🎫 Testando Tickets...');
  
  const res = await fetch(`${API_URL}/api/tickets`, {
    headers: { 'Cookie': `token=${adminToken}` }
  });
  
  const tickets = await res.json();
  console.log(`✅ Tickets listados: ${tickets.length} encontrados`);
  console.log(`   - Primeiro: "${tickets[0].title}" (${tickets[0].status})`);
}

async function testSprints() {
  console.log('\n🏃 Testando Sprints...');
  
  const res = await fetch(`${API_URL}/api/sprints/1`, {
    headers: { 'Cookie': `token=${adminToken}` }
  });
  
  const sprints = await res.json();
  console.log(`✅ Sprints listados: ${sprints.length} encontrados`);
  console.log(`   - Primeiro: "${sprints[0].name}" (${sprints[0].status})`);
}

async function testDocuments() {
  console.log('\n📄 Testando Documents...');
  
  const res = await fetch(`${API_URL}/api/documents/1`, {
    headers: { 'Cookie': `token=${clientToken}` }
  });
  
  const docs = await res.json();
  console.log(`✅ Documents listados: ${docs.length} encontrados`);
  if (docs.length > 0) {
    console.log(`   - Primeiro: "${docs[0].title}"`);
  }
}

async function testReports() {
  console.log('\n📊 Testando Reports...');
  
  const res = await fetch(`${API_URL}/api/reports/1`, {
    headers: { 'Cookie': `token=${clientToken}` }
  });
  
  const reports = await res.json();
  console.log(`✅ Reports listados: ${reports.length} encontrados`);
  if (reports.length > 0) {
    console.log(`   - Primeiro: "${reports[0].title}" (${reports[0].type})`);
  }
}

async function testNotifications() {
  console.log('\n🔔 Testando Notifications...');
  
  const res = await fetch(`${API_URL}/api/notifications`, {
    headers: { 'Cookie': `token=${clientToken}` }
  });
  
  const notifs = await res.json();
  console.log(`✅ Notifications listadas: ${notifs.length} encontradas`);
}

async function testDashboard() {
  console.log('\n📈 Testando Dashboard...');
  
  const res = await fetch(`${API_URL}/api/portal/dashboard/1`, {
    headers: { 'Cookie': `token=${clientToken}` }
  });
  
  const dashboard = await res.json();
  console.log(`✅ Dashboard carregado:`);
  console.log(`   - Open Tickets: ${dashboard.openTickets}`);
  console.log(`   - Total Documents: ${dashboard.totalDocuments}`);
  console.log(`   - Total Reports: ${dashboard.totalReports}`);
  console.log(`   - Active Sprints: ${dashboard.activeSprints.length}`);
  console.log(`   - Sprint Progress: ${dashboard.sprintProgress.completed}/${dashboard.sprintProgress.total}`);
}

async function runAllTests() {
  console.log('🚀 INICIANDO TESTES DA API MIGRADA PARA SUPABASE');
  console.log('=' .repeat(60));
  
  try {
    await testLogin();
    await testTickets();
    await testSprints();
    await testDocuments();
    await testReports();
    await testNotifications();
    await testDashboard();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ TODOS OS TESTES PASSARAM COM SUCESSO!');
    console.log('🎉 Migração para Supabase concluída!');
    console.log('='.repeat(60));
  } catch (err) {
    console.error('\n❌ ERRO:', err.message);
    process.exit(1);
  }
}

runAllTests();
