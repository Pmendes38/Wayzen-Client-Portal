import { useEffect, useState } from 'react';
import { ProjectContact } from '@/types/domain';
import { portalService } from '@/lib/services/portal';

export function useProjectContacts(clientId?: number | null) {
  const [contacts, setContacts] = useState<ProjectContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) {
      setContacts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    portalService
      .getProjectContacts(clientId)
      .then((data) => setContacts(data as ProjectContact[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [clientId]);

  const createContact = async (payload: Omit<ProjectContact, 'id' | 'client_id' | 'created_at'>) => {
    if (!clientId) {
      return;
    }

    const created = await portalService.createProjectContact({
      clientId,
      ...payload,
    });

    setContacts((prev) => [created as ProjectContact, ...prev]);
  };

  const updateContact = async (contactId: number, payload: Omit<ProjectContact, 'id' | 'client_id' | 'created_at'>) => {
    if (!clientId) {
      return;
    }

    const updated = await portalService.updateProjectContact(contactId, payload);
    setContacts((prev) => prev.map((contact) => (contact.id === contactId ? (updated as ProjectContact) : contact)));
  };

  const deleteContact = async (contactId: number) => {
    if (!clientId) {
      return;
    }

    await portalService.deleteProjectContact(contactId);
    setContacts((prev) => prev.filter((contact) => contact.id !== contactId));
  };

  return { contacts, createContact, updateContact, deleteContact, loading };
}
