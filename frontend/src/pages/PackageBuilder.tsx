import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

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

  const addCommand = () => setCommands([...commands, { Cmd: '', Delay: 0, ExpectCode: [0], IgnoreUnexpected: true }]);
  const removeCommand = (i: number) => setCommands(commands.filter((_, idx) => idx !== i));
  const updateCommand = (i: number, value: string) => {
    const updated = [...commands];
    updated[i].Cmd = value;
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
    Install: { CmdPreList: commands.filter((c) => c.Cmd.trim()), CmdPostList: [] },
  };

  return (
    <div className="page">
      <div className="page-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="link" onClick={() => navigate('/packages')}>← Back</span>
          <div className="page-title">Create Package</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 980 }}>
        <div className="form-grid" style={{ alignContent: 'start' }}>
          <Field label="Package Name" value={name} onChange={setName} placeholder="ssh-enable" />
          <Field label="Version" value={version} onChange={setVersion} placeholder="1.0.0" />
          <Field label="Module Name" value={moduleName} onChange={setModuleName} placeholder="system_patch" />
          <Field label="Description" value={description} onChange={setDescription} placeholder="Optional description" />

          <div className="field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="field-label">Commands (CmdPreList)</span>
              <span className="link" style={{ fontSize: 11 }} onClick={addCommand}>+ Add</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {commands.map((cmd, i) => (
                <div key={i} className="cmd-row">
                  <input
                    className="cmd-input"
                    value={cmd.Cmd}
                    onChange={(e) => updateCommand(i, e.target.value)}
                    placeholder="echo hello > /tmp/test"
                  />
                  {commands.length > 1 && (
                    <button className="btn btn-danger" style={{ padding: '6px 10px' }} onClick={() => removeCommand(i)}>✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && <div className="err-text">{error}</div>}

          <button className="btn btn-primary" onClick={save} disabled={saving} style={{ justifyContent: 'center', padding: '8px' }}>
            {saving ? 'Building…' : 'Build & Save'}
          </button>
        </div>

        <div className="field">
          <span className="field-label">module.json Preview</span>
          <pre className="code-pre" style={{ height: 380 }}>{JSON.stringify(preview, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
