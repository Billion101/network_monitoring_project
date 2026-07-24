// ===================================================================
// NetMonitor — Telegram Bot Alert Test Script
// Usage:
//   node test_telegram.js <BOT_TOKEN> <CHAT_ID>
//   OR configure TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in backend/.env
// ===================================================================

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
  } catch (e) { }
};

loadEnvFile(path.join(__dirname, '.env'));
loadEnvFile(path.join(__dirname, '..', '.env'));
loadEnvFile(path.join(process.cwd(), '.env'));

const botToken = process.argv[2] || process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.argv[3] || process.env.TELEGRAM_CHAT_ID;

if (!botToken || !chatId) {
  console.log('\n❌ ERROR: Missing Telegram credentials!');
  console.log('\nUsage Options:');
  console.log('  1. Pass credentials as command arguments:');
  console.log('     node test_telegram.js <YOUR_BOT_TOKEN> <YOUR_CHAT_ID>');
  console.log('  2. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in backend/.env file');
  process.exit(1);
}

const mockMessage = `
🔴 <b>[TEST ALERT] NetMonitor Telegram Integration</b>
─────────────────────────────
<b>Device:</b> <code>Core_Switch</code>
<b>IP Address:</b> <code>192.168.100.2</code>
<b>Status:</b> <b>OFFLINE</b>
<b>CPU:</b> 0% | <b>MEM:</b> 0%
<b>Details:</b> Test alert triggered manually from test_telegram.js
<b>Time:</b> <code>${new Date().toLocaleString()}</code>
─────────────────────────────
<i>NetMonitor Automated Alert System - SUCCESS TEST</i>
`.trim();

const payload = JSON.stringify({
  chat_id: chatId,
  text: mockMessage,
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

console.log('🔄 Sending test alert to Telegram...');
console.log(`   Target Chat ID: ${chatId}`);

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('\n✅ SUCCESS! Telegram message sent successfully!');
      console.log('📱 Check your Telegram chat now.');
    } else {
      console.log(`\n❌ FAILED! Telegram API returned HTTP status ${res.statusCode}`);
      console.log('Response Details:', body);
    }
  });
});

req.on('error', (err) => {
  console.error('\n❌ NETWORK ERROR:', err.message);
});

req.setTimeout(8000, () => {
  req.destroy();
  console.error('\n❌ TIMEOUT: Connection to api.telegram.org timed out.');
});

req.write(payload);
req.end();
