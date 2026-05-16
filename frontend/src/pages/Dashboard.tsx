import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { FleetSocket } from '../api/websocket';
import { Bot, Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const [status, setStatus] = useState({ total: 0, online: 0, offline: 0, updating: 0, error: 0 });
  const [robots, setRobots] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const [s, r] = await Promise.all([api.fleetStatus(), api.listRobots()]);
      setStatus(s);
      setRobots(r);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10000);

    const ws = new FleetSocket();
    ws.connect('/ws/events');
    ws.onMessage((data) => {
      setEvents((prev) => [data, ...prev].slice(0, 50));
      refresh();
    });

    return () => {
      clearInterval(interval);
      ws.disconnect();
    };
  }, []);

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Fleet Dashboard</h1>
        <button onClick={refresh} className="p-2 text-gray-400 hover:text-white transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard label="Total" value={status.total} icon={<Bot className="w-5 h-5" />} color="text-gray-300" />
        <StatCard label="Online" value={status.online} icon={<Wifi className="w-5 h-5" />} color="text-emerald-400" />
        <StatCard label="Offline" value={status.offline} icon={<WifiOff className="w-5 h-5" />} color="text-gray-500" />
        <StatCard label="Updating" value={status.updating} icon={<RefreshCw className="w-5 h-5" />} color="text-blue-400" />
        <StatCard label="Error" value={status.error} icon={<AlertCircle className="w-5 h-5" />} color="text-red-400" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Robot table */}
        <div className="col-span-2 bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <h2 className="text-sm font-medium text-gray-300">Robots</h2>
          </div>
          {robots.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No robots connected. Point a robot's MQTT DNS at this server.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs border-b border-gray-800">
                  <th className="px-4 py-2 text-left">Serial</th>
                  <th className="px-4 py-2 text-left">Nickname</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">IP</th>
                  <th className="px-4 py-2 text-left">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {robots.map((r) => (
                  <tr key={r.serial} className="border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-2">
                      <Link to={`/robot/${r.serial}`} className="text-emerald-400 hover:text-emerald-300 no-underline font-mono text-xs">
                        {r.serial}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-gray-300">{r.nickname || '—'}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-2 text-gray-400 font-mono text-xs">{r.ip_address || '—'}</td>
                    <td className="px-4 py-2 text-gray-500 text-xs">{r.last_seen ? timeAgo(r.last_seen) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Event feed */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <h2 className="text-sm font-medium text-gray-300">Live Events</h2>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {events.length === 0 ? (
              <div className="p-4 text-gray-500 text-xs text-center">Waiting for events...</div>
            ) : (
              events.map((ev, i) => (
                <div key={i} className="px-4 py-2 border-b border-gray-800/50 text-xs">
                  <span className={ev.type === 'connect' ? 'text-emerald-400' : ev.type === 'disconnect' ? 'text-red-400' : 'text-gray-400'}>
                    {ev.type}
                  </span>
                  <span className="ml-2 text-gray-500">{ev.serial}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className={`flex items-center gap-2 mb-1 ${color}`}>
        {icon}
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    online: 'bg-emerald-500/20 text-emerald-400',
    offline: 'bg-gray-500/20 text-gray-400',
    updating: 'bg-blue-500/20 text-blue-400',
    error: 'bg-red-500/20 text-red-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[status] || colors.offline}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'online' ? 'bg-emerald-400' : status === 'error' ? 'bg-red-400' : 'bg-gray-500'}`} />
      {status}
    </span>
  );
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
