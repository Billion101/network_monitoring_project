const dgram = require('dgram');
const LogModel = require('../models/logModel');
const DeviceModel = require('../models/deviceModel');

const SEVERITY_NAMES = ['emerg', 'alert', 'crit', 'err', 'warning', 'notice', 'info', 'debug'];
const FACILITY_NAMES = [
  'kernel', 'user', 'mail', 'daemon', 'auth', 'syslog', 'lpr', 'news',
  'uucp', 'cron', 'authpriv', 'ftp', 'ntp', 'logaudit', 'logalert', 'clock',
  'local0', 'local1', 'local2', 'local3', 'local4', 'local5', 'local6', 'local7'
];

/**
 * Initializes UDP 514 Syslog Receiver
 * @param {number} port - UDP Port number (Default 514)
 * @param {Function} onNewLogCallback - Callback to broadcast socket updates
 */
const initSyslogServer = (port = process.env.SYSLOG_PORT || 514, onNewLogCallback = null) => {
  const server = dgram.createSocket('udp4');

  server.on('error', (err) => {
    console.error(`Syslog UDP Server Error on port ${port}:`, err.message);
    if (err.code === 'EACCES') {
      console.warn(`[SYSLOG] Port ${port} requires root privileges. Set SYSLOG_PORT=5140 in .env or run with sudo.`);
    }
  });

  server.on('message', async (msg, rinfo) => {
    const rawText = msg.toString('utf-8');
    const senderIp = rinfo.address;

    let facility = 'local0';
    let severity = 'info';
    let severityNum = 6;
    let logMessage = rawText;

    // Parse RFC 5424 / RFC 3164 Priority Header e.g. <189> or <13>
    const priMatch = rawText.match(/^<(\d{1,3})>/);
    if (priMatch) {
      const priVal = parseInt(priMatch[1], 10);
      const facNum = Math.floor(priVal / 8);
      severityNum = priVal % 8;

      facility = FACILITY_NAMES[facNum] || `facility${facNum}`;
      severity = SEVERITY_NAMES[severityNum] || 'info';
      logMessage = rawText.replace(/^<\d{1,3}>/, '').trim();
    }

    // Step 1 RFC 5424 Rule: Discard Debug level 7 logs to avoid DB inflation
    if (severityNum === 7 || severity === 'debug') {
      return;
    }

    try {
      // Find matching device in database by IP address
      const devices = await DeviceModel.getAllDevices();
      const matchedDev = devices.find(d => d.ipAddress === senderIp || d.ipAddress === '127.0.0.1');
      const devId = matchedDev ? matchedDev.id : (devices[0] ? devices[0].id : 1);

      // Save log entry to PostgreSQL
      const savedSyslog = await LogModel.insertSyslog(devId, facility, severity, logMessage);

      // If callback provided, push live alert / syslog to WebSocket clients
      if (onNewLogCallback) {
        onNewLogCallback({
          type: 'syslog',
          data: {
            syslog: savedSyslog,
            device: matchedDev
          }
        });
      }

      console.log(`[SYSLOG INGESTED] [${severity.toUpperCase()}] Device ${senderIp}: ${logMessage}`);
    } catch (err) {
      console.error('Syslog ingestion DB save error:', err.message);
    }
  });

  server.on('listening', () => {
    const address = server.address();
    console.log(`[SYSLOG SERVICE] UDP Syslog Receiver active on ${address.address}:${address.port}`);
  });

  try {
    server.bind(port);
  } catch (err) {
    console.error(`Failed to bind UDP port ${port}:`, err.message);
  }

  return server;
};

module.exports = {
  initSyslogServer
};
