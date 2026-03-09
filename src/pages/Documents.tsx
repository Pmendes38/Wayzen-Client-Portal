import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { portalService } from '@/lib/services/portal';
import PageLoader from '@/components/PageLoader';
import { SharedDocument } from '@/types/domain';
import { FileText, Download, Trash2, Plus, X, FolderOpen, File, Image, FileSpreadsheet } from 'lucide-react';

export default function Documents() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<SharedDocument[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', fileUrl: '', fileName: '', category: '' });
  const [loading, setLoading] = useState(true);

  const clientId = user?.clientId || 1;

  useEffect(() => {
    loadDocs();
  }, [clientId]);

  const loadDocs = async () => {
    try {
      const data = await portalService.getDocuments(clientId);
      setDocuments(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const uploadDoc = async () => {
    if (!form.title || !form.fileUrl) return;
    await portalService.createDocument({ clientId, ...form });
    setShowUpload(false);
    setForm({ title: '', description: '', fileUrl: '', fileName: '', category: '' });
    loadDocs();
  };

  const deleteDoc = async (id: number) => {
    if (!confirm('Excluir este documento?')) return;
    await portalService.deleteDocument(id);
    loadDocs();
  };

  const fileIcon = (name: string) => {
    if (name?.match(/\.(jpg|jpeg|png|gif|svg)$/i)) return <Image size={20} className="text-pink-500" />;
    if (name?.match(/\.(xls|xlsx|csv)$/i)) return <FileSpreadsheet size={20} className="text-green-500" />;
    if (name?.match(/\.(pdf)$/i)) return <FileText size={20} className="text-red-500" />;
    return <File size={20} className="text-blue-500" />;
  };

  const categories = [...new Set(documents.map(d => d.category).filter(Boolean))] as string[];

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          <p className="text-gray-500 mt-1">Documentos compartilhados do seu projeto</p>
        </div>
        {user?.role !== 'client' && (
          <button onClick={() => setShowUpload(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Compartilhar Documento
          </button>
        )}
      </div>

      {categories.length > 0 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {categories.map(cat => (
            <span key={cat} className="badge badge-purple">{cat}</span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map(doc => (
          <div key={doc.id} className="card p-5 hover:border-wayzen-300 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                {fileIcon(doc.file_name)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">{doc.title}</h3>
                {doc.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{doc.description}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-400">{doc.file_name}</span>
                  {doc.category && <span className="badge badge-gray text-xs">{doc.category}</span>}
                </div>
                <p className="text-xs text-gray-400 mt-1">por {doc.uploader_name} • {new Date(doc.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
              <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs flex items-center gap-1 flex-1 justify-center">
                <Download size={14} /> Baixar
              </a>
              {user?.role === 'admin' && (
                <button onClick={() => deleteDoc(doc.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
        {!documents.length && (
          <div className="col-span-full card p-12 text-center">
            <FolderOpen size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">Nenhum documento compartilhado ainda</p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Compartilhar Documento</h2>
              <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="Nome do documento" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field h-20 resize-none" placeholder="Descrição opcional..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL do Arquivo</label>
                <input value={form.fileUrl} onChange={e => setForm({ ...form, fileUrl: e.target.value })} className="input-field" placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Arquivo</label>
                  <input value={form.fileName} onChange={e => setForm({ ...form, fileName: e.target.value })} className="input-field" placeholder="documento.pdf" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-field" placeholder="Contrato, Relatório..." />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setShowUpload(false)} className="btn-secondary">Cancelar</button>
                <button onClick={uploadDoc} className="btn-primary">Compartilhar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
