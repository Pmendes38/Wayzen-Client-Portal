-- =====================================================
-- FIX: Adicionar políticas UPDATE e DELETE ao sprint_backlog
-- Causa do bug: RLS habilitado mas sem política UPDATE →
-- .update() retorna 0 rows silenciosamente (sem erro)
-- =====================================================

-- UPDATE: admin e consultant podem atualizar itens do backlog
drop policy if exists "Internal can update sprint backlog" on public.sprint_backlog;
create policy "Internal can update sprint backlog"
on public.sprint_backlog for update
using (public.portal_is_admin() or public.portal_is_consultant())
with check (public.portal_is_admin() or public.portal_is_consultant());

-- DELETE: admin e consultant podem remover itens do backlog
drop policy if exists "Internal can delete sprint backlog" on public.sprint_backlog;
create policy "Internal can delete sprint backlog"
on public.sprint_backlog for delete
using (public.portal_is_admin() or public.portal_is_consultant());
