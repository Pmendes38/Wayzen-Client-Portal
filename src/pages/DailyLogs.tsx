import { useEffect, useMemo, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { usePortalScope } from '@/hooks/usePortalScope';
import { useAuth } from '@/hooks/useAuth';
import { portalService } from '@/lib/services/portal';
import { DailyLog } from '@/types/domain';
import PageLoader from '@/components/PageLoader';

export default function DailyLogs() {
  const { user } = useAuth();
  const { isInternal, activeClientId, activeClient, loadingClients } = usePortalScope();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    logDate: new Date().toISOString().slice(0, 10),
    progressScore: 70,
    hoursWorked: 8,
    summary: '',
    blockers: '',
    nextSteps: '',
  });

  const loadLogs = async () => {
    if (!activeClientId) return;
    const data = await portalService.getDailyLogs(activeClientId);
    setLogs(data as DailyLog[]);
  };

  useEffect(() => {
    if (loadingClients) return;
    if (!activeClientId) {
      setLoading(false);
      return;
    }

    loadLogs()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeClientId, loadingClients]);

  const chartData = useMemo(
    () => [...logs].reverse().map((entry) => ({
      date: new Date(entry.log_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      progresso: entry.progress_score,
      horas: entry.hours_worked,
    })),
    [logs]
  );

  const saveLog = async () => {
    if (!isInternal || !activeClientId || !form.summary.trim()) return;

    await portalService.createDailyLog({
      clientId: activeClientId,
      logDate: form.logDate,
      progressScore: Number(form.progressScore),
      hoursWorked: Number(form.hoursWorked),
      summary: form.summary,
      blockers: form.blockers || undefined,
      nextSteps: form.nextSteps || undefined,
    });

    setForm((prev) => ({ ...prev, summary: '', blockers: '', nextSteps: '' }));
    await loadLogs();
  };

  if (loading || loadingClients) return <PageLoader />;

  if (!activeClientId) {
    return <div className="card p-8 text-center text-gray-500">Selecione um portal para acessar os registros diarios.</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Registro Diario de Operacao</h1>
        <p className="text-gray-500 mt-1">
          {isInternal
            ? `Preencha diariamente o consolidado operacional do cliente ${activeClient?.company_name || ''}.`
            : 'Evolucao diaria registrada pelo time de consultoria para dar visibilidade total do processo.'}
        </p>
      </div>

      {isInternal && (
        <div className="card p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Preenchimento do dia</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input type="date" className="input-field" value={form.logDate} onChange={(e) => setForm((p) => ({ ...p, logDate: e.target.value }))} />
            <input type="number" min={0} max={100} className="input-field" value={form.progressScore} onChange={(e) => setForm((p) => ({ ...p, progressScore: Number(e.target.value) }))} placeholder="Progresso 0-100" />
            <input type="number" min={0} max={24} className="input-field" value={form.hoursWorked} onChange={(e) => setForm((p) => ({ ...p, hoursWorked: Number(e.target.value) }))} placeholder="Horas trabalhadas" />
          </div>
          <textarea className="input-field mt-3 h-20" placeholder="Resumo do que foi executado hoje" value={form.summary} onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <textarea className="input-field h-20" placeholder="Bloqueios encontrados" value={form.blockers} onChange={(e) => setForm((p) => ({ ...p, blockers: e.target.value }))} />
            <textarea className="input-field h-20" placeholder="Proximos passos" value={form.nextSteps} onChange={(e) => setForm((p) => ({ ...p, nextSteps: e.target.value }))} />
          </div>
          <button className="btn-primary mt-3" onClick={saveLog}>Salvar registro diario</button>
        </div>
      )}

      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">Grafico de progresso diario</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="progresso" stroke="#3b82f6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="card p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-900">{new Date(log.log_date).toLocaleDateString('pt-BR')}</p>
              <span className="badge badge-blue">{log.progress_score}%</span>
            </div>
            <p className="text-sm text-gray-700 mt-2">{log.summary}</p>
            {log.blockers && <p className="text-sm text-yellow-700 mt-2">Bloqueios: {log.blockers}</p>}
            {log.next_steps && <p className="text-sm text-gray-600 mt-1">Proximos passos: {log.next_steps}</p>}
          </div>
        ))}

        {!logs.length && <div className="card p-8 text-center text-gray-400">Nenhum registro diario cadastrado.</div>}
      </div>

      {isInternal && (
        <div className="mt-6 card p-4 bg-yellow-50 border-yellow-100 text-sm text-yellow-900">
          Lembrete operacional: o consultor deve preencher este bloco no fim de cada dia para manter rastreabilidade do projeto.
        </div>
      )}
    </div>
  );
}
