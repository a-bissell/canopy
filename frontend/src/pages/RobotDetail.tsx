import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { ArrowLeft, Send } from 'lucide-react';

export default function RobotDetail() {
  const { serial } = useParams<{ serial: string }>();
  const [robot, setRobot] = useState<any>(null);
  const [command, setCommand] = useState('');
  const [commandResult, setCommandResult] = useState('');
  const [tab, setTab] = useState<'info' | 'command'>('info');

  useEffect(() => {
    if (serial) api.getRobot(serial).then(setRobot).catch(() => {});
  }, [serial]);

  const sendCommand = async () => {
    if (!serial || !command.trim()) return;
    try {
      const payload = JSON.parse(command);
      const res = await api.sendCommand(serial, payload);
      setCommandResult(JSON.stringify(res, null, 2));
    } catch (err: any) {
      setCommandResult(`Error: ${err.message}`);
    }
  };

  if (!robot) return <div className="p-6 text-gray-400">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white font-mono">{robot.serial}</h1>
          <p className="text-sm text-gray-400">{robot.nickname || 'No nickname set'}</p>
        </div>
        <span className={`ml-4 px-2 py-0.5 rounded text-xs font-medium ${robot.status === 'online' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
          {robot.status}
        </span>
      </div>

      <div className="flex gap-2 border-b border-gray-800">
        <TabButton active={tab === 'info'} onClick={() => setTab('info')}>Info</TabButton>
        <TabButton active={tab === 'command'} onClick={() => setTab('command')}>Command</TabButton>
      </div>

      {tab === 'info' && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <InfoRow label="Serial" value={robot.serial} />
          <InfoRow label="Model" value={robot.model || 'Unknown'} />
          <InfoRow label="Firmware" value={robot.firmware_version || 'Unknown'} />
          <InfoRow label="IP Address" value={robot.ip_address || 'Unknown'} />
          <InfoRow label="Group" value={robot.group_name || 'None'} />
          <InfoRow label="First Seen" value={robot.first_seen ? new Date(robot.first_seen).toLocaleString() : '—'} />
          <InfoRow label="Last Seen" value={robot.last_seen ? new Date(robot.last_seen).toLocaleString() : '—'} />
        </div>
      )}

      {tab === 'command' && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <label className="block text-sm text-gray-400 mb-2">MQTT Command (JSON)</label>
            <textarea
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder='{"cmd": "reportVersion", "msgId": "1"}'
              className="w-full h-32 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm font-mono focus:outline-none focus:border-emerald-500 resize-none"
            />
            <button
              onClick={sendCommand}
              disabled={robot.status !== 'online'}
              className="mt-3 flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
          {commandResult && (
            <pre className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 font-mono overflow-auto">
              {commandResult}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${active ? 'border-emerald-400 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
    >
      {children}
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-200 font-mono">{value}</span>
    </div>
  );
}
