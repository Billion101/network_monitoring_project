export interface NetworkDevice {
  id: string;
  name: string;
  type: 'wan' | 'firewall' | 'core_switch' | 'switch' | 'pc';
  status: 'online' | 'warning' | 'offline';
  ipAddress: string;
  macAddress: string;
  uptime: string;
  cpuUsage: number; // in percentage
  memoryUsage: number; // in percentage
  trafficIn: number; // in Mbps
  trafficOut: number; // in Mbps
  latency: number; // in ms
  description: string;
}

export interface NetworkSummary {
  total: number;
  online: number;
  warning: number;
  offline: number;
}
