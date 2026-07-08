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

// Telemetry baselines matching type categories
const BASELINES = {
  wan: { cpu: 12, mem: 25, latency: 5, trafficIn: 1200, trafficOut: 450 },
  firewall: { cpu: 18, mem: 42, latency: 1, trafficIn: 1195, trafficOut: 448 },
  core_switch: { cpu: 28, mem: 35, latency: 1, trafficIn: 1190, trafficOut: 445 },
  switch: { cpu: 8, mem: 15, latency: 2, trafficIn: 850, trafficOut: 320 },
  pc: { cpu: 20, mem: 35, latency: 3, trafficIn: 280, trafficOut: 110 }
};

// Periodic simulator loop checking and updating database
const runTelemetrySimulation = async () => {
  try {
    const devicesList = await DeviceModel.getAllDevices();
    
    for (const dev of devicesList) {
      const base = BASELINES[dev.type] || { cpu: 20, mem: 30, latency: 5, trafficIn: 200, trafficOut: 100 };
      
      const cpu = Math.max(2, Math.min(98, Math.round(base.cpu + (Math.random() - 0.5) * 15)));
      const mem = Math.max(5, Math.min(95, Math.round(base.mem + (Math.random() - 0.5) * 8)));
      const latency = Math.max(1, Math.round(base.latency + (Math.random() - 0.5) * 3));
      const trafficIn = Math.max(10, Math.round(base.trafficIn + (Math.random() - 0.5) * 150));
      const trafficOut = Math.max(5, Math.round(base.trafficOut + (Math.random() - 0.5) * 50));

      // Append health telemetry status log entry
      await DeviceModel.insertStatusLog(dev.id, 'online', latency, cpu, mem, trafficIn, trafficOut);

      // Randomly trigger syslog alerts on Firewall / WAN gateway
      if (Math.random() < 0.15) {
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
    console.error('Background telemetry simulation worker error:', error);
  }
};

// Start the HTTP / WebSocket combined server
server.listen(PORT, () => {
  console.log(`NetMonitor Combined Server running on port ${PORT}`);
  console.log(`WebSocket Endpoint listening at: ws://localhost:${PORT}`);
  
  // Launch periodic simulation checks (every 5 seconds)
  setInterval(runTelemetrySimulation, 5000);
});
