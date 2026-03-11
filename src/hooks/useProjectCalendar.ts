import { useEffect, useMemo, useState } from 'react';
import { ProjectCalendarEvent, Sprint } from '@/types/domain';

const STORAGE_PREFIX = 'wayzen-calendar';

function storageKey(clientId: number) {
  return `${STORAGE_PREFIX}:${clientId}`;
}

function readCalendar(clientId: number): ProjectCalendarEvent[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(storageKey(clientId));
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as ProjectCalendarEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCalendar(clientId: number, events: ProjectCalendarEvent[]) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(storageKey(clientId), JSON.stringify(events));
}

function mergeEvents(base: ProjectCalendarEvent[], incoming: ProjectCalendarEvent[]) {
  const map = new Map<number, ProjectCalendarEvent>();

  base.forEach((event) => map.set(event.id, event));
  incoming.forEach((event) => {
    if (!map.has(event.id)) {
      map.set(event.id, event);
    }
  });

  return Array.from(map.values());
}

export function buildSprintCalendarEvents(sprints: Sprint[]): ProjectCalendarEvent[] {
  return sprints
    .filter((sprint) => sprint.end_date)
    .map((sprint) => ({
      id: sprint.id * 100,
      title: `Fim da ${sprint.name}`,
      start_at: `${sprint.end_date}T17:00:00.000Z`,
      end_at: `${sprint.end_date}T18:00:00.000Z`,
      type: 'sprint_delivery' as const,
      description: 'Marco automatico gerado a partir da sprint.',
      participant_ids: [],
    }));
}

export function useProjectCalendar(clientId?: number | null, seedEvents: ProjectCalendarEvent[] = []) {
  const [events, setEvents] = useState<ProjectCalendarEvent[]>([]);

  const resolvedSeed = useMemo(() => seedEvents, [seedEvents]);

  useEffect(() => {
    if (!clientId) {
      setEvents([]);
      return;
    }

    const stored = readCalendar(clientId);
    if (stored.length) {
      const merged = mergeEvents(stored, resolvedSeed);
      setEvents(merged);
      writeCalendar(clientId, merged);
      return;
    }

    setEvents(resolvedSeed);
    if (resolvedSeed.length) {
      writeCalendar(clientId, resolvedSeed);
    }
  }, [clientId, resolvedSeed]);

  const updateEvents = (nextEvents: ProjectCalendarEvent[]) => {
    setEvents(nextEvents);
    if (clientId) {
      writeCalendar(clientId, nextEvents);
    }
  };

  return { events, setEvents: updateEvents };
}
