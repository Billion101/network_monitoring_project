-- ==========================================
-- Database Schema for NetMonitor App
-- Target Database: PostgreSQL
-- ==========================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'operator', 'viewer')),
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Devices Table
CREATE TABLE IF NOT EXISTS devices (
    dev_id SERIAL PRIMARY KEY,
    dev_name VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    mac_address VARCHAR(17), -- Supporting MAC address mappings
    device_type VARCHAR(50) NOT NULL, -- wan, firewall, core_switch, switch, pc
    location VARCHAR(100),
    description TEXT, -- Supporting visual descriptions
    last_boot_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Supporting Uptime calculations
    is_active BOOLEAN DEFAULT TRUE,
    managed_by INT REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Status_Logs Table (Telemetry logs)
CREATE TABLE IF NOT EXISTS status_logs (
    log_id SERIAL PRIMARY KEY,
    dev_id INT NOT NULL REFERENCES devices(dev_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('online', 'warning', 'offline')),
    response_time INT, -- Ping response speed in ms
    cpu_usage INT, -- CPU utilization (%)
    memory_usage INT, -- Memory utilization (%)
    traffic_in INT, -- Inbound speed in Mbps
    traffic_out INT, -- Outbound speed in Mbps
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Syslogs Table
CREATE TABLE IF NOT EXISTS syslogs (
    sys_id SERIAL PRIMARY KEY,
    dev_id INT NOT NULL REFERENCES devices(dev_id) ON DELETE CASCADE,
    facility VARCHAR(50),
    severity VARCHAR(20) NOT NULL CHECK (severity in ('debug', 'info', 'notice', 'warning', 'err', 'crit', 'alert', 'emerg')),
    log_message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Recipients Table
CREATE TABLE IF NOT EXISTS recipients (
    rec_id SERIAL PRIMARY KEY,
    rec_name VARCHAR(100) NOT NULL,
    telegram_id VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Notification_Settings Table
CREATE TABLE IF NOT EXISTS notification_settings (
    set_id SERIAL PRIMARY KEY,
    created_by INT REFERENCES users(user_id) ON DELETE SET NULL,
    dev_id INT NOT NULL REFERENCES devices(dev_id) ON DELETE CASCADE,
    rec_id INT NOT NULL REFERENCES recipients(rec_id) ON DELETE CASCADE,
    alert_on_status VARCHAR(50), -- e.g., 'all', 'warning,offline'
    alert_on_severity VARCHAR(50), -- e.g., 'critical'
    cooldown_minutes INT DEFAULT 15,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Alert_History Table
CREATE TABLE IF NOT EXISTS alert_history (
    alert_id SERIAL PRIMARY KEY,
    dev_id INT NOT NULL REFERENCES devices(dev_id) ON DELETE CASCADE,
    rec_id INT NOT NULL REFERENCES recipients(rec_id) ON DELETE CASCADE,
    status_type VARCHAR(50),
    message_content TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================
-- Insert User Exported Data Seed
-- ==========================================

-- Populate Users (Export matched)
INSERT INTO users (user_id, username, password, email, role, full_name, created_at) VALUES 
(1, 'admin', '$2b$10$hashed_password_placeholder_for_security', 'admin@darn2026.local', 'admin', 'Network Administrator', '2026-07-03 01:43:55');

-- Populate Alert Recipients (Export matched)
INSERT INTO recipients (rec_id, rec_name, telegram_id, is_active, created_at) VALUES
(1, 'NOC Telegram Admin Group', '-10023456789', true, '2026-07-03 01:43:55');

-- Populate Monitored Devices (Export matched & normalized for app frontend types)
INSERT INTO devices (dev_id, dev_name, ip_address, mac_address, device_type, location, description, last_boot_time, is_active, managed_by, created_at, updated_at) VALUES
(1, 'WAN_Gateway', '8.8.8.8', '00:0A:95:9D:68:16', 'wan', 'Internet Gateway', 'Primary External WAN Route Link (Google DNS Gateway)', '2026-07-03 01:43:55', true, 1, '2026-07-03 01:43:55', '2026-07-09 02:00:00'),
(2, 'Cisco_Firewall', '192.168.100.1', '00:14:22:01:23:45', 'firewall', 'EVE-ng Lab Main Perimeter', 'Primary Boundary Firewall Guard (Cisco ASA Node)', '2026-07-03 01:43:55', true, 1, '2026-07-03 01:43:55', '2026-07-09 02:00:00'),
(3, 'Core_Switch', '192.168.100.2', '3C:5A:B4:EF:01:A2', 'core_switch', 'EVE-ng Lab Aggregation Layer', 'L3 Aggregate Distribution Switch Backbone', '2026-07-03 01:43:55', true, 1, '2026-07-03 01:43:55', '2026-07-09 02:00:00'),
(4, 'Access_Switch', '192.168.100.3', '70:69:79:AB:CD:EF', 'switch', 'EVE-ng Lab Access Layer', 'L2 Client Distribution Switch Access Point', '2026-07-03 01:43:55', true, 1, '2026-07-03 01:43:55', '2026-07-09 02:00:00'),
(5, 'PC1', '192.168.10.10', 'F4:F2:6D:E1:92:03', 'pc', 'VLAN 10 Client', 'Operator Workspace Client Terminal (VLAN 10 Network)', '2026-07-03 01:43:55', true, 1, '2026-07-03 01:43:55', '2026-07-09 02:00:00'),
(6, 'PC2', '192.168.20.10', 'F4:F2:6D:E1:92:04', 'pc', 'VLAN 20 Client', 'Finance Accounting Office Terminal (VLAN 20 Network)', '2026-07-03 01:43:55', true, 1, '2026-07-03 01:43:55', '2026-07-09 02:00:00'),
(7, 'PC3', '192.168.30.10', 'F4:F2:6D:E1:92:05', 'pc', 'VLAN 30 Client', 'Frontdesk Reception Kiosk Display (VLAN 30 Network)', '2026-07-03 01:43:55', true, 1, '2026-07-03 01:43:55', '2026-07-09 02:00:00');

-- Populate Notification Rules (Export matched)
INSERT INTO notification_settings (set_id, dev_id, rec_id, alert_on_status, alert_on_severity, cooldown_minutes, is_active, created_by) VALUES
(1, 2, 1, 'all', 'critical', 15, true, 1);

-- Populate Status Logs / Initial Telemetry points (Export matched)
INSERT INTO status_logs (log_id, dev_id, status, response_time, cpu_usage, memory_usage, traffic_in, traffic_out, checked_at) VALUES
(1, 2, 'online', 2, 15, 38, 920, 280, '2026-07-09 02:20:00'),
(2, 2, 'offline', NULL, 0, 0, 0, 0, '2026-07-09 02:20:30');

-- Populate Syslogs (Export matched)
INSERT INTO syslogs (sys_id, dev_id, log_message, severity, facility, timestamp) VALUES
(1, 2, '%ASA-6-302013: Built source translation from inside:192.168.100.10 to outside:8.8.8.8', 'info', 'local4', '2026-07-09 02:15:00');

-- Populate Incident Alert History (Export matched)
INSERT INTO alert_history (alert_id, dev_id, rec_id, message_content, status_type, sent_at) VALUES
(1, 2, 1, '🔴 [CRITICAL ALERT] SYSTEM NOTICE\nCisco_Firewall (192.168.100.1) is OFFLINE.\nPing connection timed out after 3 retries.', 'acknowledged', '2026-07-09T02:20:35.000Z');


-- ==========================================
-- Reset Serial Sequences for ID Counters
-- ==========================================
SELECT setval(pg_get_serial_sequence('users', 'user_id'), COALESCE(MAX(user_id), 1)) FROM users;
SELECT setval(pg_get_serial_sequence('devices', 'dev_id'), COALESCE(MAX(dev_id), 1)) FROM devices;
SELECT setval(pg_get_serial_sequence('status_logs', 'log_id'), COALESCE(MAX(log_id), 1)) FROM status_logs;
SELECT setval(pg_get_serial_sequence('syslogs', 'sys_id'), COALESCE(MAX(sys_id), 1)) FROM syslogs;
SELECT setval(pg_get_serial_sequence('recipients', 'rec_id'), COALESCE(MAX(rec_id), 1)) FROM recipients;
SELECT setval(pg_get_serial_sequence('notification_settings', 'set_id'), COALESCE(MAX(set_id), 1)) FROM notification_settings;
SELECT setval(pg_get_serial_sequence('alert_history', 'alert_id'), COALESCE(MAX(alert_id), 1)) FROM alert_history;
