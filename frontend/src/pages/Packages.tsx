import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Plus, Package as PkgIcon } from 'lucide-react';

export default function Packages() {
  const [packages, setPackages] = useState<any[]>([]);

  useEffect(() => {
    api.listPackages().then(setPackages).catch(() => {});
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Packages</h1>
        <Link to="/packages/new" className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded transition-colors no-underline">
          <Plus className="w-4 h-4" />
          Create Package
        </Link>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        {packages.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            <PkgIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No packages yet. Create one to get started.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs border-b border-gray-800">
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Version</th>
                <th className="px-4 py-2 text-left">Module</th>
                <th className="px-4 py-2 text-left">Size</th>
                <th className="px-4 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((p) => (
                <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-2 text-white font-medium">{p.name}</td>
                  <td className="px-4 py-2 text-gray-300 font-mono text-xs">{p.version}</td>
                  <td className="px-4 py-2 text-gray-400 font-mono text-xs">{p.module_name}</td>
                  <td className="px-4 py-2 text-gray-400 text-xs">{formatSize(p.file_size)}</td>
                  <td className="px-4 py-2 text-gray-500 text-xs">{new Date(p.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}
