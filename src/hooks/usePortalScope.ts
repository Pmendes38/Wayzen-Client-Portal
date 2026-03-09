import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getClients } from '@/lib/queries';
import type { Client } from '@/types/domain';

const STORAGE_KEY = 'wayzen.activeClientId';

export function usePortalScope() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [activeClientId, setActiveClientIdState] = useState<number | null>(null);
  const [loadingClients, setLoadingClients] = useState(true);

  const isInternal = user?.role === 'admin' || user?.role === 'consultant';

  useEffect(() => {
    if (!user) return;

    if (!isInternal) {
      setActiveClientIdState(user.clientId ?? null);
      setLoadingClients(false);
      return;
    }

    getClients()
      .then((data) => {
        const normalized = (data || []) as Client[];
        setClients(normalized);

        const stored = Number(localStorage.getItem(STORAGE_KEY) || 0);
        const firstId = normalized[0]?.id ?? null;
        const safeId = normalized.some((c) => c.id === stored) ? stored : firstId;
        setActiveClientIdState(safeId);
      })
      .catch(() => {
        setClients([]);
        setActiveClientIdState(null);
      })
      .finally(() => setLoadingClients(false));
  }, [isInternal, user]);

  const setActiveClientId = (clientId: number) => {
    setActiveClientIdState(clientId);
    localStorage.setItem(STORAGE_KEY, String(clientId));
  };

  const activeClient = useMemo(
    () => clients.find((client) => client.id === activeClientId) ?? null,
    [clients, activeClientId]
  );

  return {
    isInternal,
    clients,
    activeClient,
    activeClientId,
    loadingClients,
    setActiveClientId,
  };
}
