const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const anonSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function logSection(title) {
  console.log(`\n=== ${title} ===`);
}

async function expectSelectable(table, columns) {
  const { error } = await supabase.from(table).select(columns, { head: true, count: 'exact' });
  return !error;
}

async function expectTable(table) {
  const { error } = await supabase.from(table).select('*', { head: true, count: 'exact' });
  return !error;
}

async function fetchOne(table, columns, matchers = []) {
  let query = supabase.from(table).select(columns);
  for (const matcher of matchers) {
    query = query.eq(matcher.column, matcher.value);
  }
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

async function main() {
  const results = {
    columns: {},
    rlsTablesReachable: {},
    rlsEnforced: {},
    triggerBehavior: null,
    chatParticipantTrigger: null,
  };

  logSection('COLUNAS');
  results.columns.sprint_tasks = await expectSelectable(
    'sprint_tasks',
    'id,due_date,context_notes,subtasks,attachments,completed_at'
  );
  results.columns.sprint_backlog = await expectSelectable(
    'sprint_backlog',
    'id,context_notes,subtasks,attachments,completed_at'
  );
  results.columns.notifications = await expectSelectable(
    'notifications',
    'id,category,event_type,occurred_at,read_at,link_to,source_entity_type,source_entity_id,metadata'
  );
  results.columns.chat_rooms = await expectSelectable(
    'chat_rooms',
    'id,room_type,created_by_user_id'
  );
  results.columns.chat_room_participants = await expectSelectable(
    'chat_room_participants',
    'room_id,user_id,added_by_user_id,is_admin,last_read_at,joined_at'
  );

  Object.entries(results.columns).forEach(([key, value]) => {
    console.log(`${value ? 'OK' : 'FAIL'} ${key}`);
  });

  logSection('RLS/TABELAS');
  results.rlsTablesReachable.notifications = await expectTable('notifications');
  results.rlsTablesReachable.chat_room_participants = await expectTable('chat_room_participants');
  Object.entries(results.rlsTablesReachable).forEach(([key, value]) => {
    console.log(`${value ? 'OK' : 'FAIL'} ${key}`);
  });

  logSection('RLS EFETIVA');
  const timestamp = Date.now();
  const tempClient = await supabase
    .from('clients')
    .insert({
      company_name: `phase1-client-${timestamp}`,
      trade_name: 'Phase1 Validation',
      contact_name: 'Phase1 Validation',
      contact_email: `phase1-client-${timestamp}@example.com`,
      status: 'active',
    })
    .select('id')
    .single();

  if (tempClient.error) throw tempClient.error;

  const tempUsers = await supabase
    .from('users')
    .insert([
      {
        email: `phase1-user-a-${timestamp}@example.com`,
        name: 'Phase1 User A',
        password_hash: 'phase1-temp',
        role: 'client',
        client_id: tempClient.data.id,
        is_active: true,
      },
      {
        email: `phase1-user-b-${timestamp}@example.com`,
        name: 'Phase1 User B',
        password_hash: 'phase1-temp',
        role: 'client',
        client_id: tempClient.data.id,
        is_active: true,
      },
    ])
    .select('id,client_id')
    .order('id', { ascending: true });

  if (tempUsers.error) throw tempUsers.error;

  const primaryUser = tempUsers.data?.[0] || null;
  const secondaryUser = tempUsers.data?.[1] || null;

  if (!primaryUser || !secondaryUser) {
    console.log('SKIP sem usuarios temporarios suficientes para validar RLS.');
  } else {
    const notificationTitle = `phase1-rls-${timestamp}`;
    const insertedNotification = await supabase
      .from('notifications')
      .insert({
        user_id: primaryUser.id,
        type: 'system',
        category: 'system',
        event_type: 'phase1.verify',
        title: notificationTitle,
        message: 'rls validation',
        occurred_at: new Date().toISOString(),
        metadata: {},
        is_read: false,
        read_at: null,
      })
      .select('id')
      .single();

    if (insertedNotification.error) throw insertedNotification.error;

    const serviceNotificationCount = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('title', notificationTitle);

    const anonNotificationCount = await anonSupabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('title', notificationTitle);

    const serviceNotificationRows = serviceNotificationCount.count || 0;
    const anonNotificationRows = anonNotificationCount.count || 0;
    results.rlsEnforced.notifications = serviceNotificationRows === 1 && anonNotificationRows === 0;

    console.log(`${results.rlsEnforced.notifications ? 'OK' : 'FAIL'} notifications`);
    console.log(`service=${serviceNotificationRows} anon=${anonNotificationRows} anonError=${anonNotificationCount.error?.message || 'none'}`);

    if (secondaryUser) {
      const directRoom = await supabase
        .from('chat_rooms')
        .insert({
          client_id: primaryUser.client_id,
          room_type: 'direct',
          name: `phase1-direct-${timestamp}`,
          direct_user_a_id: Math.min(primaryUser.id, secondaryUser.id),
          direct_user_b_id: Math.max(primaryUser.id, secondaryUser.id),
          created_by_user_id: primaryUser.id,
        })
        .select('id')
        .single();

      if (directRoom.error) throw directRoom.error;

      const serviceParticipants = await supabase
        .from('chat_room_participants')
        .select('user_id', { count: 'exact' })
        .eq('room_id', directRoom.data.id);

      if (serviceParticipants.error) throw serviceParticipants.error;

      const anonParticipants = await anonSupabase
        .from('chat_room_participants')
        .select('user_id', { count: 'exact', head: true })
        .eq('room_id', directRoom.data.id);

      results.rlsEnforced.chat_room_participants =
        (serviceParticipants.data || []).length >= 2 && (anonParticipants.count || 0) === 0;
      results.chatParticipantTrigger = {
        participantCount: (serviceParticipants.data || []).length,
        ok: (serviceParticipants.data || []).length >= 2,
      };

      console.log(`${results.rlsEnforced.chat_room_participants ? 'OK' : 'FAIL'} chat_room_participants`);
      console.log(`service=${(serviceParticipants.data || []).length} anon=${anonParticipants.count || 0} anonError=${anonParticipants.error?.message || 'none'}`);
      console.log(`${results.chatParticipantTrigger.ok ? 'OK' : 'FAIL'} direct chat participant trigger`);

      await supabase.from('chat_messages').delete().eq('room_id', directRoom.data.id);
      await supabase.from('chat_room_participants').delete().eq('room_id', directRoom.data.id);
      await supabase.from('chat_rooms').delete().eq('id', directRoom.data.id);
    }

    await supabase.from('notifications').delete().eq('id', insertedNotification.data.id);
  }

  if (tempUsers.data?.length) {
    await supabase.from('users').delete().in('id', tempUsers.data.map((user) => user.id));
  }
  await supabase.from('clients').delete().eq('id', tempClient.data.id);

  logSection('TRIGGER SPRINT <-> KANBAN');
  const sprint = await fetchOne('sprints', 'id,client_id');
  const user = await fetchOne('users', 'id,client_id', [{ column: 'is_active', value: true }]);

  if (!sprint || !user) {
    console.log('SKIP sem sprint ou usuario base para teste.');
  } else {
    const timestamp = Date.now();
    const backlogInsert = await supabase
      .from('sprint_backlog')
      .insert({
        client_id: sprint.client_id || user.client_id,
        sprint_id: sprint.id,
        title: `phase1-verify-${timestamp}`,
        details: 'trigger validation',
        status: 'planned',
        created_by_user_id: user.id,
      })
      .select('id,status,completed_at')
      .single();

    if (backlogInsert.error) {
      throw backlogInsert.error;
    }

    const taskInsert = await supabase
      .from('sprint_tasks')
      .insert({
        sprint_id: sprint.id,
        backlog_item_id: backlogInsert.data.id,
        title: `phase1-task-${timestamp}`,
        description: 'trigger validation',
        week_number: 0,
        task_order: 0,
        is_completed: false,
      })
      .select('id')
      .single();

    if (taskInsert.error) {
      throw taskInsert.error;
    }

    const taskUpdate = await supabase
      .from('sprint_tasks')
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq('id', taskInsert.data.id)
      .select('id')
      .single();

    if (taskUpdate.error) {
      throw taskUpdate.error;
    }

    const backlogAfter = await supabase
      .from('sprint_backlog')
      .select('id,status,completed_at')
      .eq('id', backlogInsert.data.id)
      .single();

    if (backlogAfter.error) {
      throw backlogAfter.error;
    }

    results.triggerBehavior = {
      status: backlogAfter.data.status,
      completed_at: backlogAfter.data.completed_at,
      ok: backlogAfter.data.status === 'done' && Boolean(backlogAfter.data.completed_at),
    };

    console.log(results.triggerBehavior.ok ? 'OK trigger behavior detected' : 'FAIL trigger behavior not detected');

    await supabase.from('sprint_tasks').delete().eq('id', taskInsert.data.id);
    await supabase.from('sprint_backlog').delete().eq('id', backlogInsert.data.id);
  }

  logSection('SUMMARY');
  console.log(JSON.stringify(results, null, 2));

  const allColumnsOk = Object.values(results.columns).every(Boolean);
  const allRlsReachable = Object.values(results.rlsTablesReachable).every(Boolean);
  const allRlsEnforced = Object.values(results.rlsEnforced).every(Boolean);
  const triggerOk = results.triggerBehavior ? results.triggerBehavior.ok : false;
  const chatTriggerOk = results.chatParticipantTrigger ? results.chatParticipantTrigger.ok : false;

  if (!allColumnsOk || !allRlsReachable || !allRlsEnforced || !triggerOk || !chatTriggerOk) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});