import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import InteractiveCalendar from '@/components/reports/InteractiveCalendar';

describe('InteractiveCalendar', () => {
  it('cria um novo evento ao clicar em um dia', () => {
    render(<InteractiveCalendar />);

    const dayButton = screen.getAllByRole('button').find((button) => {
      const label = button.textContent || '';
      return /^\d{2}$/.test(label.trim()) || /^\d{1}$/.test(label.trim());
    });

    expect(dayButton).toBeTruthy();
    fireEvent.click(dayButton as HTMLElement);

    fireEvent.change(screen.getByPlaceholderText(/Titulo do evento/i), {
      target: { value: 'Reuniao de alinhamento' },
    });
    fireEvent.change(screen.getAllByDisplayValue(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)[0], {
      target: { value: '2026-03-12T09:00' },
    });
    fireEvent.change(screen.getAllByDisplayValue(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)[1], {
      target: { value: '2026-03-12T10:00' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Criar evento/i }));

    expect(screen.getByText(/Reuniao de alinhamento/i)).toBeInTheDocument();
  });

  it('edita e exclui um evento existente', () => {
    render(
      <InteractiveCalendar
        initialEvents={[
          {
            id: 1,
            title: 'Sprint review',
            start_at: '2026-03-12T13:00:00.000Z',
            end_at: '2026-03-12T14:00:00.000Z',
            type: 'meeting',
            description: null,
            participant_ids: [],
          },
        ]}
      />
    );

    fireEvent.click(screen.getByText(/Sprint review/i));
    fireEvent.change(screen.getByPlaceholderText(/Titulo do evento/i), {
      target: { value: 'Sprint review atualizada' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Salvar alteracoes/i }));

    expect(screen.getByText(/Sprint review atualizada/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Sprint review atualizada/i));
    fireEvent.click(screen.getByRole('button', { name: /Excluir/i }));

    expect(screen.queryByText(/Sprint review atualizada/i)).not.toBeInTheDocument();
  });
});
