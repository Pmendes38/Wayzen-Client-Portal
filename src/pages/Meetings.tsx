import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, PhoneCall, Plus } from 'lucide-react';
import { usePortalScope } from '@/hooks/usePortalScope';
import { portalService } from '@/lib/services/portal';
import { ContactUser, MeetingEvent, ProjectCalendarEvent } from '@/types/domain';
import PageLoader from '@/components/PageLoader';
import InteractiveCalendar from '@/components/reports/InteractiveCalendar';
import { useProjectCalendar } from '@/hooks/useProjectCalendar';
import { useProjectContacts } from '@/hooks/useProjectContacts';
import ProjectContactsPanel from '@/components/project/ProjectContactsPanel';

export default function Meetings() {
  const { isInternal, activeClientId, activeClient, loadingClients } = usePortalScope();
  const [events, setEvents] = useState<MeetingEvent[]>([]);
  const [chatContacts, setChatContacts] = useState<ContactUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: '',
    meetingDate: '',
    meetingType: 'meeting',
    notes: '',
    transcript: '',
  });
  const { contacts, createContact, updateContact, deleteContact } = useProjectContacts(activeClientId);
  const calendarSeed = useMemo<ProjectCalendarEvent[]>(() => events.map((event) => ({
    id: event.id,
    title: event.title,
    start_at: event.meeting_date,
    end_at: new Date(new Date(event.meeting_date).getTime() + 60 * 60 * 1000).toISOString(),
    type: event.transcript ? 'transcript' : 'meeting',
    description: event.notes || event.transcript || null,
    participant_ids: [],
  })), [events]);
  const calendarContacts = useMemo(
    () => [
      ...chatContacts,
      ...contacts.map((contact) => ({ id: contact.id, name: contact.name, role: 'client' as const })),
    ],
    [chatContacts, contacts]
  );
  const { events: calendarEvents, setEvents: setCalendarEvents } = useProjectCalendar(activeClientId, calendarSeed);

  const loadEvents = async () => {
    if (!activeClientId) return;
    const [meetingData, contactData] = await Promise.all([
      portalService.getMeetingEvents(activeClientId),
      portalService.getChatContacts(activeClientId),
    ]);
    setEvents(meetingData as MeetingEvent[]);
    setChatContacts(contactData);
  };

  useEffect(() => {
    if (loadingClients) return;
    if (!activeClientId) {
      setLoading(false);
      return;
    }

    loadEvents()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeClientId, loadingClients]);

  const saveMeeting = async () => {
    if (!isInternal || !activeClientId || !form.title || !form.meetingDate) return;

    await portalService.createMeetingEvent({
      clientId: activeClientId,
      title: form.title,
      meetingDate: form.meetingDate,
      meetingType: form.meetingType as 'meeting' | 'call',
      transcript: form.transcript || undefined,
      notes: form.notes || undefined,
    });

    setForm({ title: '', meetingDate: '', meetingType: 'meeting', notes: '', transcript: '' });
    await loadEvents();
  };

  if (loading || loadingClients) return <PageLoader />;

  if (!activeClientId) {
    return <div className="card p-8 text-center text-gray-500 dark:text-slate-400">Selecione um portal para ver agenda e chamadas.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Agenda e Transcricoes</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">
          {isInternal
            ? `Gerencie compromissos e registre transcricoes de chamadas para ${activeClient?.company_name || ''}.`
            : 'Acompanhe os compromissos e historico de reunioes do seu projeto.'}
        </p>
      </div>

      <InteractiveCalendar
        initialEvents={calendarEvents}
        contacts={calendarContacts}
        onEventsChange={setCalendarEvents}
      />

      {isInternal && (
        <ProjectContactsPanel
          contacts={contacts}
          onCreate={createContact}
          onUpdate={updateContact}
          onDelete={deleteContact}
        />
      )}

      {isInternal && (
        <div className="card p-5 mb-6">
          <h2 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">Novo compromisso</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="input-field" placeholder="Titulo" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            <input className="input-field" type="datetime-local" value={form.meetingDate} onChange={(e) => setForm((p) => ({ ...p, meetingDate: e.target.value }))} />
            <select className="input-field" value={form.meetingType} onChange={(e) => setForm((p) => ({ ...p, meetingType: e.target.value }))}>
              <option value="meeting">Reuniao</option>
              <option value="call">Chamada</option>
            </select>
          </div>
          <textarea className="input-field mt-3 h-20" placeholder="Pauta / notas" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          <textarea className="input-field mt-3 h-24" placeholder="Transcricao da chamada/reuniao" value={form.transcript} onChange={(e) => setForm((p) => ({ ...p, transcript: e.target.value }))} />
          <button onClick={saveMeeting} className="btn-primary mt-3 inline-flex items-center gap-2"><Plus size={16} /> Publicar compromisso</button>
        </div>
      )}

      <div className="space-y-3">
        {events.map((event) => (
          <div key={event.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {event.meeting_type === 'call' ? <PhoneCall size={16} className="text-blue-500" /> : <CalendarClock size={16} className="text-wayzen-600" />}
                <h3 className="font-semibold text-gray-900 dark:text-slate-100">{event.title}</h3>
              </div>
              <span className="text-sm text-gray-500 dark:text-slate-400">{new Date(event.meeting_date).toLocaleString('pt-BR')}</span>
            </div>
            {event.notes && <p className="text-sm text-gray-700 dark:text-slate-300 mt-2">{event.notes}</p>}
            {event.transcript && (
              <div className="mt-2 p-3 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Transcricao</p>
                <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{event.transcript}</p>
              </div>
            )}
          </div>
        ))}

        {!events.length && <div className="card p-8 text-center text-gray-400 dark:text-slate-500">Nenhum compromisso registrado.</div>}
      </div>
    </div>
  );
}
