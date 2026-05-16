import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { FileText } from 'lucide-react';

export default function AuditLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.auditLogs({ page: String(page), page_size: '50' })
      .then((res) => { setLogs(res.items); setTotal(res.total); })
      .catch(() => {});
  }, [page]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
        <span className="text-sm text-gray-500">{total} total entries</span>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No audit entries yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs border-b border-gray-800">
                <th className="px-4 py-2 text-left">Timestamp</th>
                <th className="px-4 py-2 text-left">User</th>
                <th className="px-4 py-2 text-left">Action</th>
                <th className="px-4 py-2 text-left">Target</th>
                <th className="px-4 py-2 text-left">Detail</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-2 text-gray-400 text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-2 text-gray-300">{log.username}</td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-300">{log.action}</span>
                  </td>
                  <td className="px-4 py-2 text-gray-400 font-mono text-xs">
                    {log.target_type ? `${log.target_type}:${log.target_id || ''}` : '—'}
                  </td>
                  <td className="px-4 py-2 text-gray-500 text-xs max-w-xs truncate">
                    {log.detail_json || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {total > 50 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-gray-800 text-gray-300 text-sm rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm text-gray-400">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page * 50 >= total}
            className="px-3 py-1 bg-gray-800 text-gray-300 text-sm rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
