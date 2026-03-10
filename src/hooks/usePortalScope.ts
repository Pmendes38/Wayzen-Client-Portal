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
        // Fluxo obrigatorio: interno sempre escolhe o portal antes de acessar os modulos.
        setActiveClientIdState(null);
        localStorage.removeItem(STORAGE_KEY);
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

  const setActiveClientId = (clientId: number | null) => {
    setActiveClientIdState(clientId);
    if (clientId === null) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
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
