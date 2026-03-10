import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Sprints from '@/pages/Sprints';

const hoisted = vi.hoisted(() => ({
  mockUpdateSprintBacklogItem: vi.fn().mockResolvedValue(undefined),
}));

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
    getSprints: vi.fn().mockResolvedValue([
      { id: 99, name: 'Sprint Macro', status: 'in_progress', week_number: 12, start_date: '2026-03-01', end_date: '2026-03-12' },
    ]),
    getSprintBacklog: vi.fn().mockResolvedValue([
      {
        id: 1,
        client_id: 1,
        sprint_id: null,
        title: 'Implementar dashboard operacional',
        details: 'Card principal com resumo da sprint',
        due_date: '2026-03-18',
        status: 'planned',
        created_at: new Date().toISOString(),
        created_by_name: 'Carla Figueiredo',
      },
    ]),
    updateSprintBacklogItem: hoisted.mockUpdateSprintBacklogItem,
    createSprintBacklogItem: vi.fn().mockResolvedValue({}),
    createSprint: vi.fn().mockResolvedValue({}),
    getSprintTasks: vi.fn().mockResolvedValue([]),
  },
}));

describe('Backlog Kanban', () => {
  it('renderiza colunas principais no estilo quadro', async () => {
    render(<Sprints />);

    await waitFor(() => {
      expect(screen.getByText('BACKLOG')).toBeInTheDocument();
    });

    expect(screen.getByText('TO DO')).toBeInTheDocument();
    expect(screen.getByText('DOING')).toBeInTheDocument();
    expect(screen.getByText('FINISHED')).toBeInTheDocument();
  });

  it('move card de backlog para doing via drag and drop', async () => {
    render(<Sprints />);

    await waitFor(() => {
      expect(screen.getByText(/Implementar dashboard operacional/i)).toBeInTheDocument();
    });

    const card = screen.getByText(/Implementar dashboard operacional/i).closest('div[draggable="true"]') as HTMLElement;
    const doingColumn = screen.getByText('DOING').closest('div')?.parentElement as HTMLElement;

    fireEvent.dragStart(card);
    fireEvent.dragOver(doingColumn);
    fireEvent.drop(doingColumn);

    await waitFor(() => {
      expect(hoisted.mockUpdateSprintBacklogItem).toHaveBeenCalledWith(1, expect.objectContaining({ status: 'in_progress' }));
    });
  });
});
