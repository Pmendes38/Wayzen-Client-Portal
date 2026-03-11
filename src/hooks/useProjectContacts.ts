import { useEffect, useState } from 'react';
import { ProjectContact } from '@/types/domain';

const STORAGE_PREFIX = 'wayzen-project-contacts';

function storageKey(clientId: number) {
  return `${STORAGE_PREFIX}:${clientId}`;
}

function readContacts(clientId: number): ProjectContact[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(storageKey(clientId));
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as ProjectContact[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeContacts(clientId: number, contacts: ProjectContact[]) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(storageKey(clientId), JSON.stringify(contacts));
}

export function useProjectContacts(clientId?: number | null) {
  const [contacts, setContacts] = useState<ProjectContact[]>([]);

  useEffect(() => {
    if (!clientId) {
      setContacts([]);
      return;
    }

    setContacts(readContacts(clientId));
  }, [clientId]);

  const createContact = (payload: Omit<ProjectContact, 'id' | 'client_id' | 'created_at'>) => {
    if (!clientId) {
      return;
    }

    const nextContact: ProjectContact = {
      ...payload,
      id: Date.now(),
      client_id: clientId,
      created_at: new Date().toISOString(),
    };

    const next = [...contacts, nextContact];
    setContacts(next);
    writeContacts(clientId, next);
  };

  const updateContact = (contactId: number, payload: Omit<ProjectContact, 'id' | 'client_id' | 'created_at'>) => {
    if (!clientId) {
      return;
    }

    const next = contacts.map((contact) =>
      contact.id === contactId
        ? { ...contact, ...payload }
        : contact
    );
    setContacts(next);
    writeContacts(clientId, next);
  };

  const deleteContact = (contactId: number) => {
    if (!clientId) {
      return;
    }

    const next = contacts.filter((contact) => contact.id !== contactId);
    setContacts(next);
    writeContacts(clientId, next);
  };

  return { contacts, createContact, updateContact, deleteContact };
}
