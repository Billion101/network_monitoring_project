const db = require('../config/db');

const DeviceModel = {
  getAllDevices: async () => {
    const queryText = `
      SELECT 
        d.dev_id AS id,
        d.dev_name AS name,
        d.ip_address AS "ipAddress",
        d.mac_address AS "macAddress",
        d.device_type AS type,
        d.location,
        d.description,
        d.last_boot_time AS "lastBootTime",
        COALESCE(l.status, 'offline') AS status,
        COALESCE(l.cpu_usage, 0) AS "cpuUsage",
        COALESCE(l.memory_usage, 0) AS "memoryUsage",
        COALESCE(l.traffic_in, 0) AS "trafficIn",
        COALESCE(l.traffic_out, 0) AS "trafficOut",
        COALESCE(l.response_time, 0) AS latency
      FROM devices d
      LEFT JOIN (
        SELECT DISTINCT ON (dev_id) * 
        FROM status_logs 
        ORDER BY dev_id, checked_at DESC
      ) l ON d.dev_id = l.dev_id
      WHERE d.is_active = TRUE
      ORDER BY d.dev_id ASC
    `;
    const result = await db.query(queryText);
    return result.rows;
  },

  getDeviceMetricsHistory: async (devId, limit = 10) => {
    const queryText = `
      SELECT 
        log_id AS "logId",
        cpu_usage AS "cpuUsage",
        memory_usage AS "memoryUsage",
        traffic_in AS "trafficIn",
        traffic_out AS "trafficOut",
        response_time AS latency,
        checked_at AS "checkedAt"
      FROM status_logs
      WHERE dev_id = $1
      ORDER BY checked_at DESC
      LIMIT $2
    `;
    const result = await db.query(queryText, [devId, limit]);
    // Return in chronological order for chart drawing
    return result.rows.reverse();
  },

  insertStatusLog: async (devId, status, responseTime, cpu, memory, trafficIn, trafficOut) => {
    const queryText = `
      INSERT INTO status_logs (dev_id, status, response_time, cpu_usage, memory_usage, traffic_in, traffic_out)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await db.query(queryText, [devId, status, responseTime, cpu, memory, trafficIn, trafficOut]);
    return result.rows[0];
  }
};

module.exports = DeviceModel;
