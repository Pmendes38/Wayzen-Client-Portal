import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getClients } from '@/lib/queries';
import type { Client } from '@/types/domain';

const STORAGE_KEY = 'wayzen.activeClientId';

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timer: number | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = window.setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) window.clearTimeout(timer);
  }
}

export function usePortalScope() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [activeClientId, setActiveClientIdState] = useState<number | null>(null);
  const [loadingClients, setLoadingClients] = useState(true);

  const isInternal = user?.role === 'admin' || user?.role === 'consultant';

  useEffect(() => {
    if (!user) {
      setLoadingClients(false);
      setClients([]);
      setActiveClientIdState(null);
      return;
    }

    const timeout = window.setTimeout(() => {
      setLoadingClients(false);
    }, 12000);

    if (!isInternal) {
      setActiveClientIdState(user.clientId ?? null);
      setLoadingClients(false);
      return;
    }

    withTimeout(getClients(), 10000, 'Tempo limite ao carregar clientes.')
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
      .finally(() => {
        window.clearTimeout(timeout);
        setLoadingClients(false);
      });

    return () => {
      window.clearTimeout(timeout);
    };
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
