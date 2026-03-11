import { useEffect, useMemo, useState } from 'react';
import { ProjectCalendarEvent, Sprint } from '@/types/domain';
import { portalService } from '@/lib/services/portal';

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
  const [loading, setLoading] = useState(true);

  const resolvedSeed = useMemo(() => seedEvents, [seedEvents]);
  const seedIds = useMemo(() => new Set(resolvedSeed.map((event) => event.id)), [resolvedSeed]);

  useEffect(() => {
    if (!clientId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    portalService
      .getProjectCalendarEvents(clientId)
      .then((dbEvents) => {
        const merged = mergeEvents(dbEvents as ProjectCalendarEvent[], resolvedSeed);
        setEvents(merged);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [clientId, resolvedSeed]);

  const updateEvents = (nextEvents: ProjectCalendarEvent[]) => {
    setEvents(nextEvents);
    if (clientId) {
      const manualEvents = nextEvents.filter((event) => !seedIds.has(event.id));
      portalService.syncProjectCalendarEvents(clientId, manualEvents).catch(console.error);
    }
  };

  return { events, setEvents: updateEvents, loading };
}
