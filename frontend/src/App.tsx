import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Map as MapIcon,
  AlertTriangle,
  Network,
  Settings as SettingsIcon,
  Search,
  Bell,
  ChevronDown,
  Cpu,
  HardDrive,
  Activity,
  CheckCircle2,
  Server,
  Terminal,
  Globe
} from 'lucide-react';
import type { NetworkDevice, NetworkSummary } from './types';

// Custom Glowing Icon Components matching example_ui.png
const CloudIcon = () => (
  <svg viewBox="0 0 24 24" className="w-10 h-10 stroke-current text-green-400 drop-shadow-[0_0_8px_#22c55e]" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42 0-.83.07-1.22.2A6 6 0 0 0 3 11.5c0 3.59 3.01 6.5 6.5 6.5h8" />
  </svg>
);

const FirewallIcon = () => (
  <svg viewBox="0 0 24 24" className="w-10 h-10 stroke-current text-green-400 drop-shadow-[0_0_8px_#22c55e]" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M3 15h18M9 3v6M15 3v6M6 9v6M12 9v6M18 9v6M9 15v6M15 15v6" />
  </svg>
);

const CoreSwitchIcon = () => (
  <svg viewBox="0 0 24 24" className="w-10 h-10 stroke-current text-green-400 drop-shadow-[0_0_8px_#22c55e]" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v6M12 16v6M2 12h6M16 12h6M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M19.07 4.93l-4.24 4.24M9.17 14.83l-4.24 4.24" />
    <path d="M12 2l-2 2h4l-2-2zM12 22l-2-2h4l-2 2zM2 12l2-2v4l-2-2zM22 12l-2-2v4l-2 2z" />
  </svg>
);

const SwitchIcon = () => (
  <svg viewBox="0 0 24 24" className="w-10 h-10 stroke-current text-green-400 drop-shadow-[0_0_8px_#22c55e]" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="6" cy="12" r="1.5" fill="currentColor" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <circle cx="18" cy="12" r="1.5" fill="currentColor" />
    <path d="M5 9h2v1H5V9zm6 0h2v1h-2V9zm6 0h2v1h-2V9z" />
  </svg>
);

const PCIcon = ({ status }: { status: string }) => {
  const colorClass = status === 'online'
    ? 'text-green-400 drop-shadow-[0_0_8px_#22c55e]'
    : status === 'warning'
      ? 'text-yellow-400 drop-shadow-[0_0_8px_#eab308]'
      : 'text-gray-500';
  return (
    <svg viewBox="0 0 24 24" className={`w-10 h-10 stroke-current ${colorClass}`} fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
};

// Default setup values used before API completes loading
const INITIAL_DEVICES: NetworkDevice[] = [
  { id: '1', name: 'WAN Link', type: 'wan', status: 'online', ipAddress: '8.8.8.8', macAddress: '00:0A:95:9D:68:16', uptime: '14d 6h 32m', cpuUsage: 12, memoryUsage: 25, trafficIn: 1200, trafficOut: 450, latency: 5, description: 'External Gateway Connection (Google Primary DNS Link)' },
  { id: '2', name: 'Firewall Edge', type: 'firewall', status: 'online', ipAddress: '192.168.1.1', macAddress: '00:14:22:01:23:45', uptime: '14d 6h 30m', cpuUsage: 18, memoryUsage: 42, trafficIn: 1195, trafficOut: 448, latency: 1, description: 'Corporate Edge Threat Management Gateway (pfSense Enterprise)' },
  { id: '3', name: 'Core Switch', type: 'core_switch', status: 'online', ipAddress: '192.168.1.2', macAddress: '3C:5A:B4:EF:01:A2', uptime: '45d 12h 15m', cpuUsage: 28, memoryUsage: 35, trafficIn: 1190, trafficOut: 445, latency: 1, description: 'Backbone L3 Core Switch (Cisco Catalyst 9300)' },
  { id: '4', name: 'Distribution Switch Floor 1', type: 'switch', status: 'online', ipAddress: '192.168.1.3', macAddress: '70:69:79:AB:CD:EF', uptime: '9d 2h 44m', cpuUsage: 8, memoryUsage: 15, trafficIn: 850, trafficOut: 320, latency: 2, description: 'Floor 1 Distribution Switch (Ubiquiti UniFi Pro 24)' },
  { id: '5', name: 'PC-Workstation 1', type: 'pc', status: 'online', ipAddress: '192.168.1.10', macAddress: 'F4:F2:6D:E1:92:03', uptime: '3d 8h 12m', cpuUsage: 45, memoryUsage: 62, trafficIn: 450, trafficOut: 120, latency: 3, description: 'Development Workstation (macOS, Xcode + Docker workloads)' },
  { id: '6', name: 'PC-Workstation 2', type: 'pc', status: 'online', ipAddress: '192.168.1.11', macAddress: 'F4:F2:6D:E1:92:04', uptime: '1d 4h 50m', cpuUsage: 15, memoryUsage: 32, trafficIn: 210, trafficOut: 90, latency: 2, description: 'Finance Workstation (Windows 11 Enterprise)' },
  { id: '7', name: 'PC-Workstation 3', type: 'pc', status: 'online', ipAddress: '192.168.1.12', macAddress: 'F4:F2:6D:E1:92:05', uptime: '5d 11h 22m', cpuUsage: 5, memoryUsage: 18, trafficIn: 190, trafficOut: 110, latency: 4, description: 'Reception Kiosk Terminal (ChromeOS Web App Client)' }
];

const calculateUptime = (lastBootTimeStr: string) => {
  if (!lastBootTimeStr) return '0d 0h 0m';
  const boot = new Date(lastBootTimeStr).getTime();
  const diffMs = Date.now() - boot;
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  const d = diffDays;
  const h = diffHours % 24;
  const m = diffMin % 60;
  return `${d}d ${h}h ${m}m`;
};

// Configuration mappings from .env variables or dynamic window location fallback (for VPS public IP deployments)
const DEFAULT_API_MODE = import.meta.env.VITE_API_MODE || 'real';
const getBackendHost = () => {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.hostname;
  }
  return 'localhost';
};
const backendHost = getBackendHost();
const API_BASE = import.meta.env.VITE_API_URL || `http://${backendHost}:5000/api`;
const WS_BASE = import.meta.env.VITE_WS_URL || `ws://${backendHost}:5000`;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Toggle state to switch between real database API mode and local mockup sandbox mode
  const [apiMode, setApiMode] = useState<'real' | 'mock'>(DEFAULT_API_MODE as 'real' | 'mock');

  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'alerts' | 'nodes' | 'settings'>('dashboard');
  const [devices, setDevices] = useState<NetworkDevice[]>(INITIAL_DEVICES);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('3'); // Defaults to Core Switch ID
  const [searchQuery, setSearchQuery] = useState('');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [trafficHistory, setTrafficHistory] = useState<{ in: number[]; out: number[] }>({
    in: [40, 60, 50, 75, 90],
    out: [30, 40, 35, 55, 60]
  });

  const selectedDevice = devices.find(d => d.id === selectedDeviceId) || devices[2];

  // 1. Establish WebSocket Connection for real-time telemetry & alerts (REAL API mode)
  useEffect(() => {
    if (!isAuthenticated || apiMode !== 'real') return;

    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      console.log('Connecting to WebSocket server...');
      socket = new WebSocket(WS_BASE);

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'init' || message.type === 'telemetry') {
            const { devices: devData, alerts: alertData } = message.data;

            const mapped = devData.map((d: any) => ({
              ...d,
              id: String(d.id),
              uptime: calculateUptime(d.lastBootTime)
            }));
            setDevices(mapped);
            setAlerts(alertData);

            // Dynamically append selected device metrics to trafficHistory in real-time
            const currentSelected = mapped.find((d: any) => d.id === selectedDeviceId);
            if (currentSelected) {
              const maxTraffic = currentSelected.type === 'wan' ? 1500 : 1000;
              const inPct = Math.min(100, Math.round((currentSelected.trafficIn / maxTraffic) * 100));
              const outPct = Math.min(100, Math.round((currentSelected.trafficOut / (maxTraffic * 0.4)) * 100));

              setTrafficHistory(prev => {
                const nextIn = [...prev.in.slice(1)];
                const nextOut = [...prev.out.slice(1)];
                nextIn.push(inPct);
                nextOut.push(outPct);
                return { in: nextIn, out: nextOut };
              });
            }
          }
        } catch (err) {
          console.error('Error parsing WebSocket data:', err);
        }
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected. Reconnecting in 3 seconds...');
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      };

      socket.onerror = (err) => {
        console.error('WebSocket connection error:', err);
        socket?.close();
      };
    };

    connectWebSocket();

    return () => {
      if (socket) {
        socket.onclose = null; // Prevent reconnect on cleanup
        socket.close();
      }
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [isAuthenticated, apiMode, selectedDeviceId]);

  // 2. Fetch initial metrics history once when device selection shifts (REAL API mode)
  useEffect(() => {
    if (!isAuthenticated || apiMode !== 'real') return;

    const fetchInitialMetrics = async () => {
      try {
        const res = await fetch(`${API_BASE}/devices/${selectedDeviceId}/metrics?limit=5`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const currentSelected = devices.find(d => d.id === selectedDeviceId);
            const maxTraffic = currentSelected && currentSelected.type === 'wan' ? 1500 : 1000;

            const inVals = data.map((m: any) => Math.min(100, Math.round((m.trafficIn / maxTraffic) * 100)));
            const outVals = data.map((m: any) => Math.min(100, Math.round((m.trafficOut / (maxTraffic * 0.4)) * 100)));

            while (inVals.length < 5) inVals.unshift(0);
            while (outVals.length < 5) outVals.unshift(0);

            setTrafficHistory({
              in: inVals.slice(-5),
              out: outVals.slice(-5)
            });
          }
        }
      } catch (err) {
        console.error('Error fetching initial metrics history:', err);
      }
    };

    fetchInitialMetrics();
  }, [isAuthenticated, selectedDeviceId, apiMode]);

  // 3. Fallback Local Telemetry simulator loop (MOCK Mode)
  useEffect(() => {
    if (!isAuthenticated || apiMode !== 'mock') return;

    const interval = setInterval(() => {
      // Fluctuate stats locally in state
      setDevices(prev => prev.map(dev => {
        const cpuChange = (Math.random() - 0.5) * 6;
        const memChange = (Math.random() - 0.5) * 3;
        const newCpu = Math.max(2, Math.min(98, Math.round(dev.cpuUsage + cpuChange)));
        const newMem = Math.max(5, Math.min(95, Math.round(dev.memoryUsage + memChange)));

        let trafficInChange = (Math.random() - 0.5) * 60;
        let trafficOutChange = (Math.random() - 0.5) * 30;
        let newIn = Math.max(10, Math.round(dev.trafficIn + trafficInChange));
        let newOut = Math.max(5, Math.round(dev.trafficOut + trafficOutChange));

        if (dev.type === 'wan') {
          newIn = Math.max(1000, Math.min(1500, newIn));
          newOut = Math.max(350, Math.min(600, newOut));
        } else if (dev.type === 'pc') {
          newIn = Math.max(5, Math.min(600, newIn));
          newOut = Math.max(2, Math.min(200, newOut));
        }

        return {
          ...dev,
          cpuUsage: newCpu,
          memoryUsage: newMem,
          trafficIn: newIn,
          trafficOut: newOut,
          latency: Math.max(1, Math.round(dev.latency + (Math.random() - 0.5) * 2))
        };
      }));

      // Update traffic charts
      setTrafficHistory(prev => {
        const nextIn = [...prev.in.slice(1)];
        const nextOut = [...prev.out.slice(1)];

        const selected = devices.find(d => d.id === selectedDeviceId) || devices[2];
        const maxTraffic = selected.type === 'wan' ? 1500 : 1000;
        const inPercentage = Math.round((selected.trafficIn / maxTraffic) * 100);
        const outPercentage = Math.round((selected.trafficOut / (maxTraffic * 0.4)) * 100);

        nextIn.push(Math.max(10, Math.min(100, inPercentage + Math.round((Math.random() - 0.5) * 10))));
        nextOut.push(Math.max(10, Math.min(100, outPercentage + Math.round((Math.random() - 0.5) * 10))));

        return {
          in: nextIn,
          out: nextOut
        };
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isAuthenticated, apiMode, selectedDeviceId, devices]);

  // Credentials Submission Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!username || !password) {
      setLoginError('Please enter both username and password.');
      return;
    }

    // Bypass API check if mock mode is selected
    if (apiMode === 'mock') {
      setIsLoggingIn(true);
      setTimeout(() => {
        setIsLoggingIn(false);
        if (username.toLowerCase() === 'admin' && password === 'admin') {
          setIsAuthenticated(true);
          // Set mock alerts on boot
          setAlerts([
            { id: 1, devName: 'Cisco_Firewall', recName: 'NOC Telegram Admin Group', statusType: 'warning', message: 'Port status latency drift checked.', sentAt: new Date() }
          ]);
        } else {
          setLoginError('Invalid credentials. (Use admin / admin)');
        }
      }, 500);
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      setIsLoggingIn(false);
      const data = await res.json();
      if (res.ok) {
        setIsAuthenticated(true);
      } else {
        setLoginError(data.error || 'Access Denied. Check credentials.');
      }
    } catch (err) {
      setIsLoggingIn(false);
      setLoginError('Connection refused. Is backend running?');
    }
  };

  // Aggregate metrics
  const summary: NetworkSummary = {
    total: devices.length,
    online: devices.filter(d => d.status === 'online').length,
    warning: devices.filter(d => d.status === 'warning').length,
    offline: devices.filter(d => d.status === 'offline').length,
  };

  const formatTraffic = (valueMbps: number) => {
    if (valueMbps >= 1000) {
      return `${(valueMbps / 1000).toFixed(1)} Gbps`;
    }
    return `${valueMbps} Mbps`;
  };

  const radius = 80;
  const circumference = Math.PI * radius;

  const getGaugeStrokeDashoffset = (val: number) => {
    return circumference - (val / 100) * circumference;
  };

  const getNeedleCoords = (val: number) => {
    const angle = 180 - (val / 100) * 180;
    const rad = (angle * Math.PI) / 180;
    const needleLength = 65;
    const cx = 90;
    const cy = 90;
    return {
      x2: cx + needleLength * Math.cos(rad),
      y2: cy - needleLength * Math.sin(rad)
    };
  };

  const needleCoords = getNeedleCoords(selectedDevice.cpuUsage);

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#080b11] text-slate-100 font-sans relative overflow-hidden">
        {/* Glow Background */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Login Box */}
        <div className="w-full max-w-md p-8 rounded-3xl glass-panel border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.4)] relative z-10 mx-4">

          {/* Mode Switcher Toggle in Login */}
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={() => setApiMode(prev => prev === 'real' ? 'mock' : 'real')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${apiMode === 'real'
                  ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                  : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20'
                }`}
            >
              Mode: {apiMode === 'real' ? '🔌 Real API' : '🧪 Mock Data'}
            </button>
          </div>

          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-green-500 to-emerald-400 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.4)] mb-4">
              <span className="text-black font-extrabold text-2xl tracking-tighter">N</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-wide">NetMonitor Console</h2>
            <p className="text-slate-400 text-xs mt-1">Enterprise Network Administration</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Username</label>
              <input
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 placeholder-slate-650 focus:outline-none focus:border-green-500/60 focus:ring-2 focus:ring-green-500/10 transition-all font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 placeholder-slate-650 focus:outline-none focus:border-green-500/60 focus:ring-2 focus:ring-green-500/10 transition-all font-semibold"
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold text-center animate-pulse">
                ⚠️ {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-400 text-black font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800/60 text-center">
            <span className="text-[10px] text-slate-500 font-mono">
              Demo Credentials: <span className="text-green-400/80 font-bold">admin</span> / <span className="text-green-400/80 font-bold">admin</span>
            </span>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden text-slate-100 font-sans">

      {/* 1. Sidebar Panel */}
      <aside className="w-20 lg:w-64 glass-panel border-r border-slate-800 flex flex-col justify-between items-center lg:items-stretch py-6 select-none shrink-0 z-20">

        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-6 pb-8 border-b border-slate-800/60 w-full justify-center lg:justify-start">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-green-500 to-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.4)] animate-pulse">
            <span className="text-black font-extrabold text-xl tracking-tighter">N</span>
          </div>
          <span className="hidden lg:inline text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            NetMonitor
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 w-full px-3 py-6 space-y-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'map', label: 'Map', icon: MapIcon },
            { id: 'alerts', label: 'Alerts', icon: AlertTriangle, badge: summary.warning > 0 ? summary.warning : undefined },
            { id: 'nodes', label: 'Nodes', icon: Network },
            { id: 'settings', label: 'Settings', icon: SettingsIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 relative group ${isActive
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border border-transparent'
                  }`}
              >
                {/* Active side indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1.5 rounded-r-md bg-green-400 shadow-[0_0_8px_#22c55e]"></div>
                )}

                <Icon className={`w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-green-400 drop-shadow-[0_0_6px_#22c55e]' : ''}`} />
                <span className="hidden lg:inline font-medium text-sm">{tab.label}</span>

                {tab.badge && (
                  <span className="hidden lg:inline-flex ml-auto items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer actions in sidebar */}
        <div className="w-full px-3 pt-6 border-t border-slate-800/60 flex flex-col items-center gap-4">
          <button className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors">
            <SettingsIcon className="w-5 h-5" />
          </button>

          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center hover:border-slate-600 transition-colors cursor-pointer overflow-hidden group">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
              alt="Avatar"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>
        </div>
      </aside>

      {/* 2. Main Content Canvas */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto z-10">

        {/* Top Header */}
        <header className="h-20 border-b border-slate-800/50 px-6 lg:px-8 flex items-center justify-between shrink-0 glass-panel">
          <div className="flex items-center gap-4">
            <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-white capitalize">
              {activeTab === 'dashboard' ? 'Network Topology' : `${activeTab} view`}
            </h1>

            {/* Realtime API / Mock Sandbox Interactive Switcher Toggle in Header */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const targetMode = apiMode === 'real' ? 'mock' : 'real';
                  setApiMode(targetMode);
                  if (targetMode === 'mock') {
                    setDevices(INITIAL_DEVICES);
                    setAlerts([
                      { id: 1, devName: 'WAN Link', recName: 'NOC Telegram Admin Group', statusType: 'warning', message: 'Local sandbox latency check warning.', sentAt: new Date() }
                    ]);
                  }
                }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${apiMode === 'real'
                    ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                    : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20'
                  }`}
              >
                {apiMode === 'real' ? '🔌 Real API' : '🧪 Mock Mode'}
              </button>

              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-xs text-green-400 font-medium">
                <span className={`w-1.5 h-1.5 rounded-full ${apiMode === 'real' ? 'bg-green-400 animate-ping' : 'bg-indigo-400 animate-pulse'}`}></span>
                {apiMode === 'real' ? 'Live Server' : 'Sandbox Active'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">

            {/* Search Box */}
            <div className="relative hidden md:block">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search nodes or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 bg-slate-900/60 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all"
              />
            </div>

            {/* Notification Trigger */}
            <button className="relative w-10 h-10 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:border-slate-700/60 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_#22c55e]"></span>
            </button>

            {/* User Dropdown */}
            <div className="flex items-center gap-2 pl-4 border-l border-slate-800/80 cursor-pointer group">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 font-semibold text-sm flex items-center justify-center">
                AD
              </div>
              <span className="hidden sm:inline text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">User info</span>
              <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
            </div>

          </div>
        </header>

        {/* Tab specific rendering */}
        {activeTab === 'dashboard' ? (
          <div className="flex-1 p-4 lg:p-5 space-y-4 flex flex-col justify-between">

            {/* Top Row: Network Metrics Summaries */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              {[
                { label: 'Total Nodes:', value: summary.total, color: 'text-white' },
                { label: 'Online:', value: summary.online, color: 'text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]' },
                { label: 'Warning:', value: summary.warning, color: 'text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]' },
                { label: 'Offline:', value: summary.offline, color: 'text-slate-500' }
              ].map((card, i) => (
                <div key={i} className="glass-panel rounded-xl p-3.5 border border-slate-800/60 flex flex-col justify-between relative overflow-hidden group">
                  <div className="text-slate-400 font-medium text-xs tracking-wider">{card.label}</div>
                  <div className={`text-3xl font-extrabold mt-1 ${card.color}`}>
                    {card.value}
                  </div>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-radial from-slate-800/10 to-transparent pointer-events-none rounded-full transform translate-x-6 -translate-y-6"></div>
                </div>
              ))}
            </div>

            {/* Central Network Topology Map Component */}
            <div className="flex-1 glass-panel border border-slate-800 rounded-2xl p-4 relative overflow-hidden min-h-[500px] flex items-center justify-center my-3">

              {/* Radial Glowing Background Design */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.03)_0%,transparent_70%)] pointer-events-none"></div>

              {/* Dynamic Connection SVG Overlay */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <filter id="neon-glow-green-line" x="-10%" y="-10%" width="120%" height="120%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Connection lines linking nodes dynamically */}
                <line x1="50%" y1="14%" x2="50%" y2="28%" stroke="#10b981" strokeWidth="2.5" className="connection-line" filter="url(#neon-glow-green-line)" />
                <line x1="50%" y1="36%" x2="50%" y2="48%" stroke="#10b981" strokeWidth="2.5" className="connection-line" filter="url(#neon-glow-green-line)" />
                <line x1="50%" y1="56%" x2="50%" y2="68%" stroke="#10b981" strokeWidth="2.5" className="connection-line" filter="url(#neon-glow-green-line)" />
                <line x1="50%" y1="74%" x2="50%" y2="80%" stroke="#10b981" strokeWidth="2.5" filter="url(#neon-glow-green-line)" />
                <line x1="25%" y1="80%" x2="75%" y2="80%" stroke="#10b981" strokeWidth="2.5" filter="url(#neon-glow-green-line)" />

                <line x1="25%" y1="80%" x2="25%" y2="85%" stroke="#10b981" strokeWidth="2" filter="url(#neon-glow-green-line)" />
                <line x1="50%" y1="80%" x2="50%" y2="85%" stroke="#10b981" strokeWidth="2" filter="url(#neon-glow-green-line)" />
                <line x1="75%" y1="80%" x2="75%" y2="85%" stroke="#10b981" strokeWidth="2" filter="url(#neon-glow-green-line)" />
              </svg>

              {/* Node Overlay Elements */}
              <div className="absolute inset-0 w-full h-full flex items-center justify-center">

                {/* 1. WAN (Cloud) Node */}
                <div
                  onClick={() => setSelectedDeviceId('1')}
                  className={`absolute top-[8%] left-[50%] transform -translate-x-1/2 flex flex-col items-center group cursor-pointer z-10`}
                >
                  <div className={`p-4 rounded-2xl glass-panel border transition-all duration-300 ${selectedDeviceId === '1'
                      ? 'border-green-400 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.4)] scale-110'
                      : 'border-green-500/40 hover:border-green-400 hover:scale-105'
                    }`}>
                    <CloudIcon />
                  </div>
                  <span className="mt-2 text-xs font-semibold text-slate-300 tracking-wider group-hover:text-green-400 transition-colors uppercase">WAN</span>
                </div>

                {/* 2. Firewall Node */}
                <div
                  onClick={() => setSelectedDeviceId('2')}
                  className="absolute top-[28%] left-[50%] transform -translate-x-1/2 flex flex-col items-center group cursor-pointer z-10"
                >
                  <div className={`p-4 rounded-2xl glass-panel border transition-all duration-300 ${selectedDeviceId === '2'
                      ? 'border-green-400 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.4)] scale-110'
                      : 'border-green-500/40 hover:border-green-400 hover:scale-105'
                    }`}>
                    <FirewallIcon />
                  </div>
                  <span className="mt-2 text-xs font-semibold text-slate-300 tracking-wider group-hover:text-green-400 transition-colors uppercase">Firewall</span>
                </div>

                {/* 3. Core Switch Node */}
                <div
                  onClick={() => setSelectedDeviceId('3')}
                  className="absolute top-[48%] left-[50%] transform -translate-x-1/2 flex flex-col items-center group cursor-pointer z-10"
                >
                  <div className={`p-4 rounded-2xl glass-panel border transition-all duration-300 ${selectedDeviceId === '3'
                      ? 'border-green-400 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.4)] scale-110'
                      : 'border-green-500/40 hover:border-green-400 hover:scale-105'
                    }`}>
                    <CoreSwitchIcon />
                  </div>
                  <span className="mt-2 text-xs font-semibold text-slate-300 tracking-wider group-hover:text-green-400 transition-colors uppercase">Core_Switch</span>
                </div>

                {/* 4. Switch Node */}
                <div
                  onClick={() => setSelectedDeviceId('4')}
                  className="absolute top-[68%] left-[50%] transform -translate-x-1/2 flex flex-col items-center group cursor-pointer z-10"
                >
                  <div className={`p-4 rounded-2xl glass-panel border transition-all duration-300 ${selectedDeviceId === '4'
                      ? 'border-green-400 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.4)] scale-110'
                      : 'border-green-500/40 hover:border-green-400 hover:scale-105'
                    }`}>
                    <SwitchIcon />
                  </div>
                  <span className="mt-2 text-xs font-semibold text-slate-300 tracking-wider group-hover:text-green-400 transition-colors uppercase">Switch</span>
                </div>

                {/* Bottom Row - PCs */}
                {/* 5. PC1 Node */}
                <div
                  onClick={() => setSelectedDeviceId('5')}
                  className="absolute top-[85%] left-[25%] transform -translate-x-1/2 flex flex-col items-center group cursor-pointer z-10"
                >
                  <div className={`p-4 rounded-2xl glass-panel border transition-all duration-300 ${selectedDeviceId === '5'
                      ? 'border-green-400 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.4)] scale-110'
                      : 'border-green-500/40 hover:border-green-400 hover:scale-105'
                    }`}>
                    <PCIcon status={devices.find(d => d.id === '5')?.status || 'online'} />
                  </div>
                  <span className="mt-2 text-xs font-semibold text-slate-300 tracking-wider group-hover:text-green-400 transition-colors uppercase">PC1</span>
                  <span className="text-[10px] text-green-400 font-medium tracking-wide">Online</span>
                </div>

                {/* 6. PC2 Node */}
                <div
                  onClick={() => setSelectedDeviceId('6')}
                  className="absolute top-[85%] left-[50%] transform -translate-x-1/2 flex flex-col items-center group cursor-pointer z-10"
                >
                  <div className={`p-4 rounded-2xl glass-panel border transition-all duration-300 ${selectedDeviceId === '6'
                      ? 'border-green-400 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.4)] scale-110'
                      : 'border-green-500/40 hover:border-green-400 hover:scale-105'
                    }`}>
                    <PCIcon status={devices.find(d => d.id === '6')?.status || 'online'} />
                  </div>
                  <span className="mt-2 text-xs font-semibold text-slate-300 tracking-wider group-hover:text-green-400 transition-colors uppercase">PC2</span>
                  <span className="text-[10px] text-green-400 font-medium tracking-wide">Online</span>
                </div>

                {/* 7. PC3 Node */}
                <div
                  onClick={() => setSelectedDeviceId('7')}
                  className="absolute top-[85%] left-[75%] transform -translate-x-1/2 flex flex-col items-center group cursor-pointer z-10"
                >
                  <div className={`p-4 rounded-2xl glass-panel border transition-all duration-300 ${selectedDeviceId === '7'
                      ? 'border-green-400 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.4)] scale-110'
                      : 'border-green-500/40 hover:border-green-400 hover:scale-105'
                    }`}>
                    <PCIcon status={devices.find(d => d.id === '7')?.status || 'online'} />
                  </div>
                  <span className="mt-2 text-xs font-semibold text-slate-300 tracking-wider group-hover:text-green-400 transition-colors uppercase">PC3</span>
                  <span className="text-[10px] text-green-400 font-medium tracking-wide">Online</span>
                </div>

              </div>
            </div>

          </div>
        ) : activeTab === 'map' ? (
          <div className="flex-1 p-6 lg:p-8 flex items-center justify-center">
            <div className="glass-panel border border-slate-800 rounded-3xl p-8 max-w-2xl text-center space-y-6">
              <Globe className="w-16 h-16 text-indigo-400 mx-auto animate-spin" style={{ animationDuration: '20s' }} />
              <h2 className="text-2xl font-bold">Network Geographic Map</h2>
              <p className="text-slate-400 max-w-md">
                Geographic location services of primary servers, office gateways and remote user endpoints mapped onto real-time geographic locations.
              </p>
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-semibold max-w-xs mx-auto">
                📍 Head office: Bangkok, TH
              </div>
            </div>
          </div>
        ) : activeTab === 'alerts' ? (
          <div className="flex-1 p-6 lg:p-8 space-y-6">
            <div className="glass-panel border border-slate-800 rounded-3xl p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-400" /> Active Alert Incidents
              </h2>

              <div className="space-y-4">
                {alerts.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 font-medium">
                    No active network incidents logged.
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className="flex items-start justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800 animate-fade-in">
                      <div className="flex gap-4">
                        <span className={`p-2 rounded-xl shrink-0 ${alert.statusType === 'warning'
                            ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            : alert.statusType === 'offline'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-green-500/10 text-green-400 border border-green-500/20'
                          }`}>
                          {alert.statusType === 'warning' ? (
                            <AlertTriangle className="w-5 h-5" />
                          ) : (
                            <CheckCircle2 className="w-5 h-5" />
                          )}
                        </span>
                        <div>
                          <h4 className="font-semibold text-slate-200">{alert.devName} status alert</h4>
                          <p className="text-xs text-slate-400 mt-1">{alert.message}</p>
                          <span className="text-[10px] font-mono text-slate-500 mt-2 block">
                            ID: INC-{alert.id} • {new Date(alert.sentAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${alert.statusType === 'online'
                          ? 'bg-green-500/10 text-green-400'
                          : alert.statusType === 'warning'
                            ? 'bg-yellow-500/10 text-yellow-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                        {alert.statusType === 'online' ? 'Resolved' : 'Active'}
                      </span>
                    </div>
                  ))
                )}
              </div>

            </div>
          </div>
        ) : activeTab === 'nodes' ? (
          <div className="flex-1 p-6 lg:p-8 space-y-6">
            <div className="glass-panel border border-slate-800 rounded-3xl p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
                <Server className="w-6 h-6 text-green-400" /> Managed Network Nodes
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-sm font-semibold">
                      <th className="py-4 px-4">Node Name</th>
                      <th className="py-4 px-4">Type</th>
                      <th className="py-4 px-4">IP Address</th>
                      <th className="py-4 px-4">MAC Address</th>
                      <th className="py-4 px-4">Uptime</th>
                      <th className="py-4 px-4">CPU Usage</th>
                      <th className="py-4 px-4">Memory</th>
                      <th className="py-4 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.map((dev) => (
                      <tr key={dev.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors text-slate-300 text-sm">
                        <td className="py-4 px-4 font-semibold text-white">{dev.name}</td>
                        <td className="py-4 px-4 uppercase text-xs font-mono">{dev.type}</td>
                        <td className="py-4 px-4 font-mono">{dev.ipAddress}</td>
                        <td className="py-4 px-4 font-mono">{dev.macAddress}</td>
                        <td className="py-4 px-4">{dev.uptime}</td>
                        <td className="py-4 px-4">{dev.cpuUsage}%</td>
                        <td className="py-4 px-4">{dev.memoryUsage}%</td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${dev.status === 'online'
                              ? 'bg-green-500/10 text-green-400'
                              : dev.status === 'warning'
                                ? 'bg-yellow-500/10 text-yellow-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${dev.status === 'online'
                                ? 'bg-green-400'
                                : dev.status === 'warning'
                                  ? 'bg-yellow-400'
                                  : 'bg-red-400'
                              }`}></span> {dev.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-6 lg:p-8 space-y-6">
            <div className="glass-panel border border-slate-800 rounded-3xl p-6 max-w-2xl">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
                <SettingsIcon className="w-6 h-6 text-green-400" /> NetMonitor Configuration
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Metrics Polling Interval</label>
                  <select className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-green-500 w-full max-w-xs">
                    <option>3.0 Seconds (Realtime Polling)</option>
                    <option>10.0 Seconds (Standard Polling)</option>
                    <option>30.0 Seconds (Low Load)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Notification Thresholds</label>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="accent-green-500 h-4 w-4 rounded" />
                    <span className="text-sm text-slate-400">Alert on CPU Usage &gt; 90%</span>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <input type="checkbox" defaultChecked className="accent-green-500 h-4 w-4 rounded" />
                    <span className="text-sm text-slate-400">Alert on Link Status Disconnects</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 3. Right Sidebar Metrics & Inspector */}
      <aside className="w-80 glass-panel border-l border-slate-800 flex flex-col p-6 shrink-0 z-20 overflow-y-auto select-none">

        {/* Device Header Inspector Selector */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800/80 mb-6">
          <div>
            <h3 className="text-xs font-bold text-green-400 tracking-widest uppercase">Node Inspector</h3>
            <h2 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
              {selectedDevice.name}
              <span className={`w-2.5 h-2.5 rounded-full ${selectedDevice.status === 'online'
                  ? 'bg-green-400 shadow-[0_0_8px_#22c55e]'
                  : selectedDevice.status === 'warning'
                    ? 'bg-yellow-400 shadow-[0_0_8px_#eab308]'
                    : 'bg-red-400 shadow-[0_0_8px_#ef4444]'
                }`}></span>
            </h2>
          </div>
          <span className="text-[10px] font-mono text-slate-500 bg-slate-900/80 border border-slate-800 px-2 py-1 rounded-md">
            IP: {selectedDevice.ipAddress}
          </span>
        </div>

        {/* Metric Gauges Row */}
        <div className="space-y-6">

          {/* CPU Usage Semi-Circle Gauge with Needle */}
          <div className="glass-panel border border-slate-800 rounded-2xl p-5 relative overflow-hidden flex flex-col items-center">
            <span className="text-xs font-semibold text-slate-400 self-start mb-2 tracking-wide flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-green-400" /> CPU Usage
            </span>

            <div className="relative w-full flex flex-col items-center justify-center pt-2">
              <svg className="w-44 h-24" viewBox="0 0 180 100">
                <defs>
                  <linearGradient id="cpuGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="60%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>

                {/* Base Gauge Arch */}
                <path
                  d="M 15 90 A 75 75 0 0 1 165 90"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="12"
                  strokeLinecap="round"
                />

                {/* Active Filled Arch */}
                <path
                  d="M 15 90 A 75 75 0 0 1 165 90"
                  fill="none"
                  stroke="url(#cpuGrad)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={getGaugeStrokeDashoffset(selectedDevice.cpuUsage)}
                  className="transition-all duration-700 ease-out"
                />

                {/* Dial Indicator Needle */}
                <line
                  x1="90"
                  y1="90"
                  x2={needleCoords.x2}
                  y2={needleCoords.y2}
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />

                {/* Central Needle Pin */}
                <circle cx="90" cy="90" r="6" fill="#151d30" stroke="#ffffff" strokeWidth="2" />
              </svg>

              {/* Large Metric text */}
              <div className="text-center mt-4">
                <span className="text-4xl font-extrabold text-white">{selectedDevice.cpuUsage}</span>
                <span className="text-sm font-semibold text-slate-400 ml-1">%</span>
              </div>
            </div>
          </div>

          {/* Memory Usage Semi-Circle Gauge */}
          <div className="glass-panel border border-slate-800 rounded-2xl p-5 relative overflow-hidden flex flex-col items-center">
            <span className="text-xs font-semibold text-slate-400 self-start mb-2 tracking-wide flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-green-400" /> Memory Usage
            </span>

            <div className="relative w-full flex flex-col items-center justify-center pt-2">
              <svg className="w-44 h-24" viewBox="0 0 180 100">
                <defs>
                  <linearGradient id="memGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>

                {/* Base Gauge Arch */}
                <path
                  d="M 15 90 A 75 75 0 0 1 165 90"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="12"
                  strokeLinecap="round"
                />

                {/* Active Filled Arch */}
                <path
                  d="M 15 90 A 75 75 0 0 1 165 90"
                  fill="none"
                  stroke="url(#memGrad)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={getGaugeStrokeDashoffset(selectedDevice.memoryUsage)}
                  className="transition-all duration-700 ease-out"
                />
              </svg>

              {/* Large Metric text */}
              <div className="text-center mt-4">
                <span className="text-4xl font-extrabold text-white">{selectedDevice.memoryUsage}</span>
                <span className="text-sm font-semibold text-slate-400 ml-1">%</span>
                <div className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-0.5">
                  {(selectedDevice.memoryUsage * 0.32).toFixed(1)} / 32 GB used
                </div>
              </div>
            </div>
          </div>

          {/* Network Traffic glowing vertical bars */}
          <div className="glass-panel border border-slate-800 rounded-2xl p-5 flex flex-col">
            <span className="text-xs font-semibold text-slate-400 mb-4 tracking-wide flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-green-400" /> Network Traffic
            </span>

            <div className="space-y-1 mb-4">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-400">In:</span>
                <span className="text-green-400 font-bold font-mono">{formatTraffic(selectedDevice.trafficIn)}</span>
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-400">Out:</span>
                <span className="text-green-400/90 font-bold font-mono">{formatTraffic(selectedDevice.trafficOut)}</span>
              </div>
            </div>

            {/* Glowing Charts layout */}
            <div className="grid grid-cols-2 gap-4 h-24 mt-2">

              {/* In Traffic Bars */}
              <div className="flex flex-col justify-end items-center h-full gap-2 relative bg-slate-950/20 border border-slate-900/60 rounded-xl p-2">
                <div className="flex items-end justify-center w-full gap-1 h-14">
                  {trafficHistory.in.map((val, idx) => (
                    <div
                      key={idx}
                      style={{ height: `${Math.max(5, val)}%` }}
                      className="w-1.5 rounded-full bg-gradient-to-t from-green-600 to-green-400 shadow-[0_0_8px_rgba(34,197,94,0.3)] transition-all duration-500 relative"
                    >
                      {idx === 2 && (
                        <div className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 text-green-400 animate-bounce">
                          ▲
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">In</span>
              </div>

              {/* Out Traffic Bars */}
              <div className="flex flex-col justify-end items-center h-full gap-2 relative bg-slate-950/20 border border-slate-900/60 rounded-xl p-2">
                <div className="flex items-end justify-center w-full gap-1 h-14">
                  {trafficHistory.out.map((val, idx) => (
                    <div
                      key={idx}
                      style={{ height: `${Math.max(5, val)}%` }}
                      className="w-1.5 rounded-full bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all duration-500 relative"
                    >
                      {idx === 2 && (
                        <div className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 text-emerald-400 animate-bounce">
                          ▲
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Out</span>
              </div>

            </div>
          </div>

          {/* Node Meta Details Inspector Card */}
          <div className="glass-panel border border-slate-800 rounded-2xl p-5 text-xs space-y-3">
            <h4 className="font-semibold text-slate-300 flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-slate-400" /> Device Telemetry Logs
            </h4>

            <div className="space-y-2 border-t border-slate-800/80 pt-3 text-slate-400 font-mono">
              <div className="flex justify-between"><span className="text-slate-500">MAC Address:</span> <span>{selectedDevice.macAddress}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Uptime:</span> <span>{selectedDevice.uptime}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Latency:</span> <span className="text-green-400">{selectedDevice.latency} ms</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Type:</span> <span className="uppercase text-[10px]">{selectedDevice.type}</span></div>
            </div>

            <p className="text-[11px] text-slate-500 border-t border-slate-800/80 pt-3 leading-relaxed">
              {selectedDevice.description}
            </p>
          </div>

        </div>

      </aside>

    </div>
  );
}

export default App;
