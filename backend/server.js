const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server: WebSocketServer } = require('ws');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const logRoutes = require('./routes/logRoutes');

const DeviceModel = require('./models/deviceModel');
const LogModel = require('./models/logModel');
const { pollDeviceMetrics } = require('./services/snmpService');
const { initSyslogServer } = require('./services/syslogService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes Registry
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/logs', logRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Create standard HTTP server wrapping Express app
const server = http.createServer(app);

// Instantiate WebSocket Server attached to the HTTP server
const wss = new WebSocketServer({ server });

// Helper to broadcast payloads to all open WebSocket clients
const broadcast = (data) => {
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // 1 represents OPEN state
      client.send(payload);
    }
  });
};

// WebSocket Client Connection Listener
wss.on('connection', async (ws) => {
  console.log('New WebSocket client connected.');
  
  // Immediately dispatch initial snapshot of devices and alerts
  try {
    const devices = await DeviceModel.getAllDevices();
    const alerts = await LogModel.getAlertHistory(15);
    ws.send(JSON.stringify({
      type: 'init',
      data: {
        devices,
        alerts
      }
    }));
  } catch (err) {
    console.error('WebSocket initial broadcast transmission error:', err);
  }

  ws.on('close', () => {
    console.log('WebSocket client connection closed.');
  });
});

// Telemetry baselines matching type categories (used as fallback or for simulation)
const BASELINES = {
  wan: { cpu: 12, mem: 25, latency: 5, trafficIn: 1200, trafficOut: 450 },
  firewall: { cpu: 18, mem: 42, latency: 1, trafficIn: 1195, trafficOut: 448 },
  core_switch: { cpu: 28, mem: 35, latency: 1, trafficIn: 1190, trafficOut: 445 },
  switch: { cpu: 8, mem: 15, latency: 2, trafficIn: 850, trafficOut: 320 },
  pc: { cpu: 20, mem: 35, latency: 3, trafficIn: 280, trafficOut: 110 }
};

// Periodic telemetry loop polling real devices via SNMP with simulation fallback
const runTelemetryLoop = async () => {
  try {
    const devicesList = await DeviceModel.getAllDevices();
    
    for (const dev of devicesList) {
      const base = BASELINES[dev.type] || { cpu: 20, mem: 30, latency: 5, trafficIn: 200, trafficOut: 100 };
      let cpu, mem, status = 'online';

      // 1. Try polling real device via SNMP v2c
      const snmpResult = await pollDeviceMetrics(dev.ipAddress);
      
      if (snmpResult.success && snmpResult.data) {
        // Real SNMP metrics collected
        cpu = snmpResult.data.cpu;
        mem = snmpResult.data.mem;
        status = snmpResult.data.status || 'online';
        console.log(`[SNMP POLLED REAL] Device ${dev.name} (${dev.ipAddress}): CPU ${cpu}%, MEM ${mem}%`);
      } else {
        if (process.env.ENABLE_SIMULATOR === 'true') {
          // Fallback simulation metrics if simulator flag is enabled
          cpu = Math.max(2, Math.min(98, Math.round(base.cpu + (Math.random() - 0.5) * 15)));
          mem = Math.max(5, Math.min(95, Math.round(base.mem + (Math.random() - 0.5) * 8)));
          status = 'online';
        } else {
          // Strict Real Mode: Unreachable device is marked offline with 0 utilization
          cpu = 0;
          mem = 0;
          status = 'offline';
          console.warn(`[SNMP REAL MODE] Device ${dev.name} (${dev.ipAddress}) unreachable -> Marked OFFLINE`);
        }
      }

      const latency = status === 'offline' ? null : Math.max(1, Math.round(base.latency + (Math.random() - 0.5) * 3));
      const trafficIn = status === 'offline' ? 0 : Math.max(10, Math.round(base.trafficIn + (Math.random() - 0.5) * 150));
      const trafficOut = status === 'offline' ? 0 : Math.max(5, Math.round(base.trafficOut + (Math.random() - 0.5) * 50));

      // Append health telemetry status log entry
      await DeviceModel.insertStatusLog(dev.id, status, latency, cpu, mem, trafficIn, trafficOut);

      // In simulation mode, randomly generate background syslogs
      if (process.env.ENABLE_SIMULATOR === 'true' && Math.random() < 0.1) {
        const facilities = ['system', 'daemon', 'auth', 'local0'];
        const severities = ['info', 'notice', 'warning'];
        const facility = facilities[Math.floor(Math.random() * facilities.length)];
        const severity = severities[Math.floor(Math.random() * severities.length)];
        
        const logsMap = {
          info: `Routine health parameters verified. Latency: ${latency}ms, CPU: ${cpu}%.`,
          notice: `Client traffic throughput checks complete. In: ${trafficIn} Mbps, Out: ${trafficOut} Mbps.`,
          warning: `Minor latency drift detected on dev port channel connection.`
        };
        
        await LogModel.insertSyslog(dev.id, facility, severity, logsMap[severity]);
      }
    }

    // Load fresh data sets to broadcast
    const freshDevices = await DeviceModel.getAllDevices();
    const freshAlerts = await LogModel.getAlertHistory(15);
    
    // Broadcast live update payload to all active browser clients via WebSocket
    broadcast({
      type: 'telemetry',
      data: {
        devices: freshDevices,
        alerts: freshAlerts
      }
    });

  } catch (error) {
    console.error('Background telemetry poller worker error:', error);
  }
};

// Start the HTTP / WebSocket combined server
server.listen(PORT, () => {
  console.log(`NetMonitor Combined Server running on port ${PORT}`);
  console.log(`WebSocket Endpoint listening at: ws://localhost:${PORT}`);
  
  // Launch UDP Syslog Receiver on port 514 (or SYSLOG_PORT env)
  initSyslogServer(process.env.SYSLOG_PORT || 514, (event) => {
    broadcast(event);
  });

  // Launch periodic telemetry polling loop (every 5 seconds)
  setInterval(runTelemetryLoop, 5000);
});

