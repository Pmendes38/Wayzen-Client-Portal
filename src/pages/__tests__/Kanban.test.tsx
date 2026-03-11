import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import Kanban from '@/pages/Kanban';

const hoisted = vi.hoisted(() => ({
  mockUpdateBacklogItem: vi.fn().mockResolvedValue(undefined),
  mockCreateBacklogItem: vi.fn().mockResolvedValue({}),
  mockGetSprintBacklog: vi.fn(),
  mockGetSprints: vi.fn(),
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
    getSprints: hoisted.mockGetSprints,
    getSprintBacklog: hoisted.mockGetSprintBacklog,
    updateSprintBacklogItem: hoisted.mockUpdateBacklogItem,
    createSprintBacklogItem: hoisted.mockCreateBacklogItem,
  },
}));

const SPRINT_DATA = [
  { id: 1, name: 'Sprint 1', status: 'in_progress', week_number: 1, start_date: '2026-03-01', end_date: '2026-03-12' },
];

const BACKLOG_DATA = [
  {
    id: 10,
    client_id: 1,
    sprint_id: null,
    title: 'Tarefa no Backlog',
    details: 'Descricao da tarefa de backlog',
    due_date: '2026-03-20',
    status: 'planned' as const,
    created_at: new Date().toISOString(),
    created_by_name: 'Ana Silva',
  },
  {
    id: 11,
    client_id: 1,
    sprint_id: 1,
    title: 'Tarefa em Doing',
    details: null,
    due_date: null,
    status: 'in_progress' as const,
    created_at: new Date().toISOString(),
    created_by_name: null,
  },
  {
    id: 12,
    client_id: 1,
    sprint_id: 1,
    title: 'Tarefa Concluida',
    details: null,
    due_date: null,
    status: 'done' as const,
    created_at: new Date().toISOString(),
    created_by_name: null,
  },
];

beforeEach(() => {
  hoisted.mockGetSprints.mockResolvedValue([...SPRINT_DATA]);
  hoisted.mockGetSprintBacklog.mockResolvedValue([...BACKLOG_DATA]);
  hoisted.mockUpdateBacklogItem.mockClear();
  hoisted.mockCreateBacklogItem.mockClear();
});

describe('Kanban — quadro operacional', () => {
  it('renderiza as quatro colunas do kanban', async () => {
    render(<Kanban />);
    await waitFor(() => {
      expect(screen.getByText('Backlog')).toBeInTheDocument();
      expect(screen.getByText('To do')).toBeInTheDocument();
      expect(screen.getByText('Doing')).toBeInTheDocument();
      expect(screen.getByText('Finished')).toBeInTheDocument();
    });
  });

  it('distribui cards nas colunas corretas de acordo com o status', async () => {
    render(<Kanban />);
    await waitFor(() => expect(screen.getByText('Tarefa no Backlog')).toBeInTheDocument());
    expect(screen.getByText('Tarefa em Doing')).toBeInTheDocument();
    expect(screen.getByText('Tarefa Concluida')).toBeInTheDocument();
  });

  it('marca card como concluido ao clicar no botao de conclusao', async () => {
    render(<Kanban />);
    await waitFor(() => screen.getByText('Tarefa em Doing'));

    // Find the complete button within the 'Tarefa em Doing' card
    const doingCard = screen.getByText('Tarefa em Doing').closest('div[draggable="true"]') as HTMLElement;
    const completeBtn = doingCard.querySelector('[aria-label="Marcar como concluida"]') as HTMLElement;
    fireEvent.click(completeBtn);

    await waitFor(() => {
      expect(hoisted.mockUpdateBacklogItem).toHaveBeenCalledWith(
        11,
        expect.objectContaining({ status: 'done' }),
      );
    });
  });

  it('desfaz conclusao ao clicar em card ja concluido', async () => {
    render(<Kanban />);
    await waitFor(() => screen.getByText('Tarefa Concluida'));

    const undoBtn = screen.getByLabelText('Marcar como pendente');
    fireEvent.click(undoBtn);

    await waitFor(() => {
      expect(hoisted.mockUpdateBacklogItem).toHaveBeenCalledWith(
        12,
        expect.objectContaining({ status: 'in_progress' }),
      );
    });
  });

  it('move card via drag and drop para coluna doing', async () => {
    render(<Kanban />);
    await waitFor(() => screen.getByText('Tarefa no Backlog'));

    const card = screen.getByText('Tarefa no Backlog').closest('div[draggable="true"]') as HTMLElement;
    const doingColumn = screen.getByText('Doing').closest('div')?.parentElement as HTMLElement;

    fireEvent.dragStart(card);
    fireEvent.dragOver(doingColumn);
    fireEvent.drop(doingColumn);

    await waitFor(() => {
      expect(hoisted.mockUpdateBacklogItem).toHaveBeenCalledWith(
        10,
        expect.objectContaining({ status: 'in_progress' }),
      );
    });
  });

  it('adiciona nova tarefa ao backlog', async () => {
    hoisted.mockGetSprintBacklog
      .mockResolvedValueOnce([...BACKLOG_DATA])
      .mockResolvedValueOnce([
        ...BACKLOG_DATA,
        { id: 99, client_id: 1, sprint_id: null, title: 'Nova tarefa criada', details: '', due_date: null, status: 'planned', created_at: new Date().toISOString(), created_by_name: null },
      ]);

    render(<Kanban />);
    await waitFor(() => screen.getByPlaceholderText('Nova tarefa de backlog'));

    fireEvent.change(screen.getByPlaceholderText('Nova tarefa de backlog'), { target: { value: 'Nova tarefa criada' } });
    fireEvent.click(screen.getByText('Adicionar'));

    await waitFor(() => {
      expect(hoisted.mockCreateBacklogItem).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Nova tarefa criada', clientId: 1 }),
      );
    });
    await waitFor(() => expect(screen.getByText('Nova tarefa criada')).toBeInTheDocument());
  });

  it('nao chama createSprintBacklogItem com titulo vazio', async () => {
    render(<Kanban />);
    await waitFor(() => screen.getByPlaceholderText('Nova tarefa de backlog'));

    fireEvent.click(screen.getByText('Adicionar'));

    await new Promise((r) => setTimeout(r, 50));
    expect(hoisted.mockCreateBacklogItem).not.toHaveBeenCalled();
  });

  it('nao lanca excecao quando getSprintBacklog falha', async () => {
    hoisted.mockGetSprintBacklog.mockRejectedValueOnce(new Error('DB error'));
    render(<Kanban />);
    // Component should render without crashing
    await waitFor(() => {
      expect(screen.getByText('Kanban do Projeto')).toBeInTheDocument();
    });
  });

  it('nao lanca excecao quando updateSprintBacklogItem falha ao completar card', async () => {
    hoisted.mockUpdateBacklogItem.mockRejectedValueOnce(new Error('update failed'));
    render(<Kanban />);
    await waitFor(() => screen.getByText('Tarefa em Doing'));

    const doingCard = screen.getByText('Tarefa em Doing').closest('div[draggable="true"]') as HTMLElement;
    const completeBtn = doingCard.querySelector('[aria-label="Marcar como concluida"]') as HTMLElement;
    // Should not crash the app
    fireEvent.click(completeBtn);
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.getByText('Tarefa em Doing')).toBeInTheDocument();
  });

  it('mostra placeholder de arrastar quando coluna esta vazia', async () => {
    hoisted.mockGetSprintBacklog.mockResolvedValueOnce([]);
    render(<Kanban />);
    await waitFor(() => {
      const placeholders = screen.getAllByText('Arraste tarefas para esta coluna.');
      expect(placeholders.length).toBe(4);
    });
  });
});
