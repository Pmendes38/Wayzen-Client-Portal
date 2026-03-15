import { useEffect, useMemo, useState } from 'react';
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Pencil, Trash2, X, type LucideIcon } from 'lucide-react';
import { CalendarEventType, ContactUser, ProjectCalendarEvent } from '@/types/domain';

const EVENT_TYPE_META: Record<CalendarEventType, { label: string; badge: string; icon: LucideIcon }> = {
  sprint_delivery: { label: 'Fim de Sprint / Entrega', badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200', icon: CalendarDays },
  meeting: { label: 'Reuniao', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200', icon: CalendarDays },
  transcript: { label: 'Transcricao / Gravacao', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200', icon: CalendarDays },
  general: { label: 'Compromisso geral', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200', icon: CalendarDays },
  task_due: { label: 'Prazo da atividade', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200', icon: Clock3 },
  task_completed: { label: 'Atividade concluida', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200', icon: CheckCircle2 },
};

type CalendarForm = {
  title: string;
  startAt: string;
  endAt: string;
  type: CalendarEventType;
  description: string;
  participants: number[];
};

type InteractiveCalendarProps = {
  initialEvents?: ProjectCalendarEvent[];
  contacts?: ContactUser[];
  onEventsChange?: (events: ProjectCalendarEvent[]) => void;
};

const weekdayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const EMPTY_EVENTS: ProjectCalendarEvent[] = [];
const EMPTY_CONTACTS: ContactUser[] = [];

/** Strips well-known backend-generated title prefixes for clean display. */
function stripTitlePrefix(title: string): string {
  return title
    .replace(/^Prazo:\s*/i, '')
    .replace(/^Entrega:\s*/i, '')
    .replace(/^Concluida:\s*/i, '');
}

/**
 * Resolves the sprint name linked to an event.
 * Uses structured backend title/description patterns first, then falls back
 * to regex for user-created events (meeting, transcript, general).
 * Returns null when no sprint context exists for this event type.
 */
function resolveSprintLabel(event: ProjectCalendarEvent): string | null {
  // sprint_delivery: title = "Entrega: {sprint_name}"
  if (event.type === 'sprint_delivery') {
    const fromTitle = event.title?.match(/^Entrega:\s*(.+)/i);
    if (fromTitle?.[1]) return fromTitle[1].trim();
    // fallback: description = 'Entrega da sprint "{name}"'
    const fromDesc = event.description?.match(/sprint\s+"([^"]+)"/i);
    if (fromDesc?.[1]) return fromDesc[1];
    return event.title ?? null;
  }

  // task_due / task_completed: sprint name is stored in description as \nSprint: "{name}"
  if (event.type === 'task_due' || event.type === 'task_completed') {
    const sprintMatch = event.description?.match(/\nSprint:\s*"([^"]+)"/);
    if (sprintMatch?.[1]) return sprintMatch[1];
    return null;
  }

  // meeting / transcript / general: free-form — scan combined text
  const text = `${event.title || ''} ${event.description || ''}`;
  const quotedMatch = text.match(/sprint\s*"([^"]+)"/i);
  if (quotedMatch?.[1]) return quotedMatch[1];

  // Plain match: "Sprint Nome" or "Sprint: Nome" — stop at common Portuguese prepositions
  const plainMatch = text.match(/\bsprint\s*[:\-]?\s*([A-Za-zÀ-ú0-9 _.-]+)/i);
  if (plainMatch?.[1]) {
    const candidate = plainMatch[1]
      .split(/\s+(?:de|da|do|para|com|em)\s+/i)[0]
      .trim();
    if (candidate.length > 1) return candidate;
  }

  return null;
}

function resolveRelevantDate(event: ProjectCalendarEvent): string {
  const parsed = parseISO(event.start_at);
  if (!isValid(parsed)) {
    return event.start_at || 'Nao informada';
  }
  return format(parsed, "dd/MM/yyyy HH:mm");
}

function buildEventTooltip(event: ProjectCalendarEvent): string {
  const lines: string[] = [`Nome: ${stripTitlePrefix(event.title || 'Sem nome')}`];

  const sprint = resolveSprintLabel(event);
  if (sprint !== null) {
    lines.push(`Sprint: ${sprint}`);
  }

  lines.push(`Data: ${resolveRelevantDate(event)}`);
  return lines.join('\n');
}

export default function InteractiveCalendar({ initialEvents = EMPTY_EVENTS, contacts = EMPTY_CONTACTS, onEventsChange }: InteractiveCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<ProjectCalendarEvent[]>(initialEvents);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [form, setForm] = useState<CalendarForm>({
    title: '',
    startAt: '',
    endAt: '',
    type: 'general',
    description: '',
    participants: [],
  });

  const monthLabel = useMemo(
    () => format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR }),
    [currentMonth]
  );

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart);
    const gridEnd = endOfWeek(monthEnd);
    const result: Date[] = [];

    let pointer = gridStart;
    while (pointer <= gridEnd) {
      result.push(pointer);
      pointer = addDays(pointer, 1);
    }

    return result;
  }, [currentMonth]);

  const groupedEvents = useMemo(() => {
    return events.reduce<Record<string, ProjectCalendarEvent[]>>((acc, event) => {
      const key = event.start_at.slice(0, 10);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(event);
      return acc;
    }, {});
  }, [events]);

  const openCreateModal = (date: Date) => {
    const isoDay = format(date, 'yyyy-MM-dd');
    setEditingEventId(null);
    setSelectedDate(isoDay);
    setForm({
      title: '',
      startAt: `${isoDay}T09:00`,
      endAt: `${isoDay}T10:00`,
      type: 'general',
      description: '',
      participants: [],
    });
  };

  const openEditModal = (event: ProjectCalendarEvent) => {
    setEditingEventId(event.id);
    setSelectedDate(event.start_at.slice(0, 10));
    setForm({
      title: event.title,
      startAt: event.start_at.slice(0, 16),
      endAt: event.end_at.slice(0, 16),
      type: event.type,
      description: event.description || '',
      participants: event.participant_ids || [],
    });
  };

  const closeModal = () => {
    setSelectedDate(null);
    setEditingEventId(null);
  };

  const updateEvents = (next: ProjectCalendarEvent[]) => {
    setEvents(next);
    onEventsChange?.(next);
  };

  const submitForm = () => {
    if (!form.title.trim() || !form.startAt || !form.endAt) {
      return;
    }

    const startDate = new Date(form.startAt);
    const endDate = new Date(form.endAt);
    if (!isValid(startDate) || !isValid(endDate) || endDate <= startDate) {
      return;
    }

    if (editingEventId) {
      const updated = events.map((event) =>
        event.id === editingEventId
          ? {
              ...event,
              title: form.title.trim(),
              start_at: startDate.toISOString(),
              end_at: endDate.toISOString(),
              type: form.type,
              description: form.description.trim() || null,
              participant_ids: form.participants,
            }
          : event
      );
      updateEvents(updated);
      closeModal();
      return;
    }

    const created: ProjectCalendarEvent = {
      id: Date.now(),
      title: form.title.trim(),
      start_at: startDate.toISOString(),
      end_at: endDate.toISOString(),
      type: form.type,
      description: form.description.trim() || null,
      participant_ids: form.participants,
    };

    updateEvents([...events, created]);
    closeModal();
  };

  const removeEvent = () => {
    if (!editingEventId) {
      return;
    }
    updateEvents(events.filter((event) => event.id !== editingEventId));
    closeModal();
  };

  return (
    <section className="card p-5 bg-white dark:bg-slate-900 dark:border-slate-700">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Calendario Interativo</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Clique no dia para criar eventos e clique no evento para editar.</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200">
          <CalendarDays size={13} />
          Editavel
        </span>
      </div>

      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
          className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Mes anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="font-semibold capitalize text-slate-800 dark:text-slate-200">{monthLabel}</p>
        <button
          onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
          className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Proximo mes"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekdayLabels.map((label) => (
          <div key={label} className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 px-1 py-2 text-center">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayEvents = groupedEvents[dayKey] || [];
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <button
              key={dayKey}
              onClick={() => openCreateModal(day)}
              className={`min-h-28 rounded-xl border p-2 text-left transition-colors ${
                isCurrentMonth
                  ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700'
                  : 'border-slate-200/60 bg-slate-50/50 text-slate-400 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-semibold ${isSameDay(day, new Date()) ? 'text-emerald-600 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-300'}`}>
                  {format(day, 'dd')}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[10px] rounded-full bg-slate-200 text-slate-700 px-1.5 py-0.5 dark:bg-slate-700 dark:text-slate-200">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  (() => {
                    const EventIcon = EVENT_TYPE_META[event.type].icon;
                    return (
                      <div
                        key={event.id}
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(event);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openEditModal(event);
                          }
                        }}
                        className={`w-full truncate rounded-md px-1.5 py-1 text-[11px] font-medium ${EVENT_TYPE_META[event.type].badge}`}
                        title={buildEventTooltip(event)}
                      >
                        <span className="inline-flex items-center gap-1">
                          <EventIcon size={11} />
                          <span>{format(parseISO(event.start_at), 'HH:mm')} {event.title}</span>
                        </span>
                      </div>
                    );
                  })()
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">+{dayEvents.length - 3} eventos</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {editingEventId ? 'Editar evento' : 'Novo evento'}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">{format(parseISO(`${selectedDate}T12:00:00`), "dd 'de' MMMM", { locale: ptBR })}</p>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Fechar modal">
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                className="input-field md:col-span-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                placeholder="Titulo do evento"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              />
              <input
                type="datetime-local"
                className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                value={form.startAt}
                onChange={(e) => setForm((prev) => ({ ...prev, startAt: e.target.value }))}
              />
              <input
                type="datetime-local"
                className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                value={form.endAt}
                onChange={(e) => setForm((prev) => ({ ...prev, endAt: e.target.value }))}
              />
              <select
                className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                value={form.type}
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as CalendarEventType }))}
              >
                {Object.entries(EVENT_TYPE_META).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </select>
              <select
                multiple
                className="input-field h-24 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                value={form.participants.map(String)}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions).map((option) => Number(option.value));
                  setForm((prev) => ({ ...prev, participants: values }));
                }}
              >
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name} ({contact.role})
                  </option>
                ))}
                {!contacts.length && <option disabled>Nenhum contato disponivel</option>}
              </select>
              <textarea
                className="input-field md:col-span-2 h-24 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                placeholder="Descricao"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              {editingEventId ? (
                <button className="btn-danger" onClick={removeEvent}>
                  <Trash2 size={14} /> Excluir
                </button>
              ) : <span />}
              <div className="flex items-center gap-2">
                <button className="btn-secondary dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" onClick={closeModal}>Cancelar</button>
                <button className="btn-primary" onClick={submitForm}>
                  <Pencil size={14} /> {editingEventId ? 'Salvar alteracoes' : 'Criar evento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
