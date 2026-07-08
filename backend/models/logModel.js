const db = require('../config/db');

const LogModel = {
  getSyslogs: async (limit = 100) => {
    const queryText = `
      SELECT 
        s.sys_id AS id,
        s.dev_id AS "devId",
        d.dev_name AS "devName",
        s.facility,
        s.severity,
        s.log_message AS "message",
        s.timestamp
      FROM syslogs s
      LEFT JOIN devices d ON s.dev_id = d.dev_id
      ORDER BY s.timestamp DESC
      LIMIT $1
    `;
    const result = await db.query(queryText, [limit]);
    return result.rows;
  },

  getAlertHistory: async (limit = 50) => {
    const queryText = `
      SELECT 
        a.alert_id AS id,
        a.dev_id AS "devId",
        d.dev_name AS "devName",
        a.rec_id AS "recId",
        r.rec_name AS "recName",
        a.status_type AS "statusType",
        a.message_content AS "message",
        a.sent_at AS "sentAt"
      FROM alert_history a
      LEFT JOIN devices d ON a.dev_id = d.dev_id
      LEFT JOIN recipients r ON a.rec_id = r.rec_id
      ORDER BY a.sent_at DESC
      LIMIT $1
    `;
    const result = await db.query(queryText, [limit]);
    return result.rows;
  },

  insertSyslog: async (devId, facility, severity, message) => {
    const queryText = `
      INSERT INTO syslogs (dev_id, facility, severity, log_message)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await db.query(queryText, [devId, facility, severity, message]);
    return result.rows[0];
  }
};

module.exports = LogModel;
