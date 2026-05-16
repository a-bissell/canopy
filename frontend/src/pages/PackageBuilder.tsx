import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';

interface CommandEntry {
  Cmd: string;
  Delay: number;
  ExpectCode: number[];
  IgnoreUnexpected: boolean;
}

export default function PackageBuilder() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [moduleName, setModuleName] = useState('system_patch');
  const [description, setDescription] = useState('');
  const [commands, setCommands] = useState<CommandEntry[]>([
    { Cmd: '', Delay: 0, ExpectCode: [0], IgnoreUnexpected: true },
  ]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const addCommand = () => {
    setCommands([...commands, { Cmd: '', Delay: 0, ExpectCode: [0], IgnoreUnexpected: true }]);
  };

  const removeCommand = (i: number) => {
    setCommands(commands.filter((_, idx) => idx !== i));
  };

  const updateCommand = (i: number, field: string, value: any) => {
    const updated = [...commands];
    (updated[i] as any)[field] = value;
    setCommands(updated);
  };

  const save = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    if (commands.some((c) => !c.Cmd.trim())) { setError('All commands must have content'); return; }
    setSaving(true);
    setError('');
    try {
      await api.createPackage({ name, version, description, module_name: moduleName, commands });
      navigate('/packages');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const preview = {
    Name: moduleName,
    Version: version,
    Type: 'NORMAL',
    Install: {
      CmdPreList: commands.filter((c) => c.Cmd.trim()),
      CmdPostList: [],
    },
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/packages')} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-white">Create Package</h1>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <Field label="Package Name" value={name} onChange={setName} placeholder="ssh-enable" />
          <Field label="Version" value={version} onChange={setVersion} placeholder="1.0.0" />
          <Field label="Module Name" value={moduleName} onChange={setModuleName} placeholder="system_patch" />
          <Field label="Description" value={description} onChange={setDescription} placeholder="Optional description" />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-400">Commands (CmdPreList)</label>
              <button onClick={addCommand} className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300">
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {commands.map((cmd, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={cmd.Cmd}
                    onChange={(e) => updateCommand(i, 'Cmd', e.target.value)}
                    placeholder="echo hello > /tmp/test"
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm font-mono focus:outline-none focus:border-emerald-500"
                  />
                  {commands.length > 1 && (
                    <button onClick={() => removeCommand(i)} className="px-2 text-gray-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Building...' : 'Build & Save'}
          </button>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">module.json Preview</label>
          <pre className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-xs text-gray-300 font-mono overflow-auto h-96">
            {JSON.stringify(preview, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-emerald-500"
      />
    </div>
  );
}
