const https = require('https');
const path = require('path');
const fs = require('fs');

// Zero-dependency fallback to parse .env file if process.env is not populated
const loadEnvFile = (envPath) => {
  try {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...vals] = trimmed.split('=');
          const val = vals.join('=').trim().replace(/^["']|["']$/g, '');
          if (key && val && !process.env[key.trim()]) {
            process.env[key.trim()] = val;
          }
        }
      });
    }
  } catch (e) {}
};

loadEnvFile(path.join(__dirname, '..', '.env'));
loadEnvFile(path.join(process.cwd(), '.env'));
loadEnvFile(path.join(process.cwd(), 'backend', '.env'));

// Cooldown map per device IP (1-minute cooldown to prevent notification spam)
const telegramCooldownMap = new Map();
const COOLDOWN_MS = 1 * 60 * 1000; // 1 minute cooldown per device alert

/**
 * Send Telegram Alert Message via Telegram Bot API
 * @param {object} alertData - { deviceName, ipAddress, status, message, cpu, mem }
 */
const sendTelegramAlert = async ({ deviceName, ipAddress, status, message, cpu = 0, mem = 0 }) => {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN || '8943833335:AAG0S-OaaIOmTjry--ed5ry5tIfwzQhoabY';
    const chatId = process.env.TELEGRAM_CHAT_ID || '8586258006';

    if (!botToken || !chatId) {
      console.warn(`[TELEGRAM WARN] Cannot send Telegram alert for ${deviceName}: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing`);
      return { success: false, reason: 'TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing' };
    }

    // Cooldown check per device IP
    const now = Date.now();
    const lastSent = telegramCooldownMap.get(ipAddress) || 0;
    if (now - lastSent < COOLDOWN_MS) {
      console.log(`[TELEGRAM COOLDOWN] Notification for ${deviceName} (${ipAddress}) suppressed (Cooldown active).`);
      return { success: false, reason: 'Cooldown active' };
    }

    const isOffline = status === 'offline';
    const icon = isOffline ? '🔴' : '⚠️';
    const statusText = status.toUpperCase();

    const formattedMessage = `
${icon} <b>[NETMONITOR ALERT]</b>
───────────────────────
<b>Device:</b> <code>${deviceName}</code>
<b>IP Address:</b> <code>${ipAddress}</code>
<b>Status:</b> <b>${statusText}</b>
<b>CPU:</b> ${cpu}% | <b>MEM:</b> ${mem}%
<b>Details:</b> ${message || 'Device unreachable over IPsec VPN tunnel'}
<b>Time:</b> <code>${new Date().toLocaleString()}</code>
───────────────────────
<i>NetMonitor Automated Alert System</i>
`.trim();

    const payload = JSON.stringify({
      chat_id: chatId,
      text: formattedMessage,
      parse_mode: 'HTML'
    });

    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${botToken}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    return new Promise((resolve) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log(`[TELEGRAM ALERT SENT] Notification sent to chat ${chatId} for ${deviceName}`);
            telegramCooldownMap.set(ipAddress, now);
            resolve({ success: true, data: JSON.parse(data) });
          } else {
            console.error(`[TELEGRAM API ERROR] Status Code ${res.statusCode}:`, data);
            resolve({ success: false, error: data });
          }
        });
      });

      req.on('error', (e) => {
        console.error('[TELEGRAM REQUEST ERROR]', e.message);
        resolve({ success: false, error: e.message });
      });

      req.setTimeout(5000, () => {
        req.destroy();
        resolve({ success: false, error: 'Telegram request timeout' });
      });

      req.write(payload);
      req.end();
    });

  } catch (err) {
    console.error('[TELEGRAM SERVICE ERROR]', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  sendTelegramAlert
};
