import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import Sprints from '@/pages/Sprints';

const hoisted = vi.hoisted(() => ({
  mockUpdateSprintTask: vi.fn().mockResolvedValue(undefined),
  mockUpdateSprint: vi.fn().mockResolvedValue(undefined),
  mockCreateSprint: vi.fn().mockResolvedValue({}),
  mockCreateSprintTask: vi.fn().mockResolvedValue({}),
  mockGetSprintTasks: vi.fn(),
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
    getSprintTasks: hoisted.mockGetSprintTasks,
    updateSprintTask: hoisted.mockUpdateSprintTask,
    updateSprint: hoisted.mockUpdateSprint,
    createSprint: hoisted.mockCreateSprint,
    createSprintTask: hoisted.mockCreateSprintTask,
  },
}));

const SPRINTS_DATA = [
  { id: 99, name: 'Sprint Macro', status: 'in_progress', week_number: 12, start_date: '2026-03-01', end_date: '2026-03-12', notes: '' },
];

const TASKS_DATA = [
  { id: 10, sprint_id: 99, title: 'Configurar ambiente', is_completed: false, task_order: 0 },
  { id: 11, sprint_id: 99, title: 'Criar estrutura de dados', is_completed: true, task_order: 1 },
];

beforeEach(() => {
  hoisted.mockGetSprints.mockResolvedValue([...SPRINTS_DATA]);
  hoisted.mockGetSprintTasks.mockResolvedValue([...TASKS_DATA]);
  hoisted.mockUpdateSprintTask.mockClear();
  hoisted.mockUpdateSprint.mockClear();
  hoisted.mockCreateSprint.mockClear();
  hoisted.mockCreateSprintTask.mockClear();
});

describe('Sprints — visao macro', () => {
  it('renderiza lista de sprints sem secao Kanban', async () => {
    render(<Sprints />);
    await waitFor(() => expect(screen.getByText('Sprint Macro')).toBeInTheDocument());
    expect(screen.queryByText('BACKLOG')).not.toBeInTheDocument();
    expect(screen.queryByText('TO DO')).not.toBeInTheDocument();
    expect(screen.queryByText('DOING')).not.toBeInTheDocument();
  });

  it('expande sprint e carrega atividades', async () => {
    render(<Sprints />);
    await waitFor(() => screen.getByText('Sprint Macro'));
    fireEvent.click(screen.getByText('Sprint Macro').closest('button')!);
    await waitFor(() => {
      expect(screen.getByText('Configurar ambiente')).toBeInTheDocument();
      expect(screen.getByText('Criar estrutura de dados')).toBeInTheDocument();
    });
  });

  it('exibe barra de progresso com percentual real', async () => {
    render(<Sprints />);
    await waitFor(() => screen.getByText('Sprint Macro'));
    fireEvent.click(screen.getByText('Sprint Macro').closest('button')!);
    await waitFor(() => screen.getByText('Configurar ambiente'));
    // 1 of 2 completed = 50%
    expect(screen.getByText(/1 de 2 atividades concluidas/)).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('marca atividade pendente como concluida ao clicar no circulo', async () => {
    render(<Sprints />);
    await waitFor(() => screen.getByText('Sprint Macro'));
    fireEvent.click(screen.getByText('Sprint Macro').closest('button')!);
    await waitFor(() => screen.getByText('Configurar ambiente'));

    const unchecked = screen.getAllByLabelText('Marcar como concluida');
    fireEvent.click(unchecked[0]);

    await waitFor(() => {
      expect(hoisted.mockUpdateSprintTask).toHaveBeenCalledWith(10, { isCompleted: true });
    });
  });

  it('desmarca atividade concluida ao clicar em checkmark', async () => {
    render(<Sprints />);
    await waitFor(() => screen.getByText('Sprint Macro'));
    fireEvent.click(screen.getByText('Sprint Macro').closest('button')!);
    await waitFor(() => screen.getByText('Criar estrutura de dados'));

    const checked = screen.getByLabelText('Desmarcar como concluida');
    fireEvent.click(checked);

    await waitFor(() => {
      expect(hoisted.mockUpdateSprintTask).toHaveBeenCalledWith(11, { isCompleted: false });
    });
  });

  it('cria nova sprint ao preencher formulario (usuario interno)', async () => {
    hoisted.mockGetSprints
      .mockResolvedValueOnce([...SPRINTS_DATA])
      .mockResolvedValueOnce([
        ...SPRINTS_DATA,
        { id: 100, name: 'Sprint Q2', status: 'planned', week_number: 13, start_date: '2026-03-15', end_date: '2026-03-28', notes: '' },
      ]);

    render(<Sprints />);
    await waitFor(() => screen.getByPlaceholderText('Nome da sprint'));

    fireEvent.change(screen.getByPlaceholderText('Nome da sprint'), { target: { value: 'Sprint Q2' } });
    fireEvent.click(screen.getByText('Criar Sprint'));

    await waitFor(() => {
      expect(hoisted.mockCreateSprint).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Sprint Q2', clientId: 1 }),
      );
    });
    await waitFor(() => expect(screen.getByText('Sprint Q2')).toBeInTheDocument());
  });

  it('abre formulario de edicao de sprint ao clicar no icone de edicao', async () => {
    render(<Sprints />);
    await waitFor(() => screen.getByText('Sprint Macro'));

    const editBtn = screen.getByLabelText('Editar sprint');
    fireEvent.click(editBtn);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Editar nome da sprint')).toBeInTheDocument();
      expect(screen.getByText('Salvar')).toBeInTheDocument();
    });
  });

  it('salva edicao de sprint ao clicar em Salvar', async () => {
    hoisted.mockGetSprints.mockResolvedValue([...SPRINTS_DATA]);

    render(<Sprints />);
    await waitFor(() => screen.getByText('Sprint Macro'));

    fireEvent.click(screen.getByLabelText('Editar sprint'));
    await waitFor(() => screen.getByPlaceholderText('Editar nome da sprint'));

    fireEvent.change(screen.getByPlaceholderText('Editar nome da sprint'), { target: { value: 'Sprint Editada' } });
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() => {
      expect(hoisted.mockUpdateSprint).toHaveBeenCalledWith(
        99,
        expect.objectContaining({ name: 'Sprint Editada', clientId: 1 }),
      );
    });
  });

  it('abre e cancela edicao de sprint sem salvar', async () => {
    render(<Sprints />);
    await waitFor(() => screen.getByText('Sprint Macro'));

    fireEvent.click(screen.getByLabelText('Editar sprint'));
    await waitFor(() => screen.getByText('Cancelar'));
    fireEvent.click(screen.getByText('Cancelar'));

    await waitFor(() => {
      expect(screen.getByText('Sprint Macro')).toBeInTheDocument();
      expect(hoisted.mockUpdateSprint).not.toHaveBeenCalled();
    });
  });

  it('adiciona nova atividade a sprint existente', async () => {
    render(<Sprints />);
    await waitFor(() => screen.getByText('Sprint Macro'));
    fireEvent.click(screen.getByText('Sprint Macro').closest('button')!);
    await waitFor(() => screen.getByText('Nova atividade'));

    fireEvent.click(screen.getByText('Nova atividade'));
    await waitFor(() => screen.getByPlaceholderText('Titulo da atividade'));

    fireEvent.change(screen.getByPlaceholderText('Titulo da atividade'), { target: { value: 'Tarefa nova' } });
    fireEvent.click(screen.getByText('Adicionar'));

    await waitFor(() => {
      expect(hoisted.mockCreateSprintTask).toHaveBeenCalledWith(
        expect.objectContaining({ sprintId: 99, title: 'Tarefa nova' }),
      );
    });
  });

  it('mostra estado vazio com mensagem correta quando nao ha sprints', async () => {
    hoisted.mockGetSprints.mockResolvedValueOnce([]);
    render(<Sprints />);
    await waitFor(() => {
      expect(screen.getByText(/Nenhuma sprint criada ainda/)).toBeInTheDocument();
    });
  });

  it('nao lanca excecao quando getSprints falha', async () => {
    hoisted.mockGetSprints.mockRejectedValueOnce(new Error('DB error'));
    render(<Sprints />);
    await waitFor(() => {
      // Component renders empty state without crashing
      expect(screen.getByText(/Nenhuma sprint criada ainda/)).toBeInTheDocument();
    });
  });

  it('nao lanca excecao quando getSprintTasks falha ao expandir', async () => {
    hoisted.mockGetSprintTasks.mockRejectedValueOnce(new Error('tasks error'));
    render(<Sprints />);
    await waitFor(() => screen.getByText('Sprint Macro'));
    // Expanding should not crash the component (tasks list stays empty)
    fireEvent.click(screen.getByText('Sprint Macro').closest('button')!);
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.getByText('Sprint Macro')).toBeInTheDocument();
  });
});
