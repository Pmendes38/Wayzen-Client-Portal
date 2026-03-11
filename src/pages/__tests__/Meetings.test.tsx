import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Meetings from '@/pages/Meetings';

vi.mock('@/hooks/usePortalScope', () => ({
  usePortalScope: () => ({
    isInternal: true,
    activeClientId: 1,
    activeClient: { company_name: 'Escola ABC Educacao' },
    loadingClients: false,
  }),
}));

vi.mock('@/lib/services/portal', () => ({
  portalService: {
    getMeetingEvents: vi.fn().mockResolvedValue([
      {
        id: 1,
        client_id: 1,
        title: 'Reuniao semanal',
        meeting_date: '2026-03-10T13:00:00.000Z',
        meeting_type: 'meeting',
        transcript: null,
        notes: 'Pauta do projeto',
        created_by_user_id: 1,
        created_at: new Date().toISOString(),
      },
    ]),
    getChatContacts: vi.fn().mockResolvedValue([{ id: 9, name: 'Carla', role: 'consultant' }]),
    createMeetingEvent: vi.fn().mockResolvedValue({ success: true }),
  },
}));

describe('Agenda e contatos do projeto', () => {
  it('renderiza calendario e permite criar um contato vinculado ao projeto', async () => {
    window.localStorage.clear();
    render(<Meetings />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Calendario Interativo/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Novo contato/i }));
    fireEvent.change(screen.getByPlaceholderText('Nome'), { target: { value: 'Ana Paula' } });
    fireEvent.change(screen.getByPlaceholderText('Cargo'), { target: { value: 'CMO' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'ana@empresa.com' } });
    fireEvent.change(screen.getByPlaceholderText('Telefone'), { target: { value: '11999999999' } });
    fireEvent.change(screen.getByPlaceholderText('Observacoes'), { target: { value: 'Responsavel pelo marketing' } });
    fireEvent.click(screen.getByRole('button', { name: /Criar contato/i }));

    expect(screen.getByText('Ana Paula')).toBeInTheDocument();
  });
});
