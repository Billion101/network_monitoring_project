const snmp = require('net-snmp');

/**
 * Polls SNMP metrics from a target network device using v2c
 * @param {string} ipAddress - Device IP Address
 * @param {string} [community] - SNMP Community String (Default from ENV)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
const pollDeviceMetrics = (ipAddress, community = process.env.SNMP_COMMUNITY || 'darn@2026') => {
  return new Promise((resolve) => {
    // If IP is 8.8.8.8 or public external WAN IP without SNMP, skip directly
    if (ipAddress === '8.8.8.8') {
      return resolve({ success: false, error: 'External WAN ping-only target' });
    }

    const options = {
      port: 161,
      retries: 1,
      timeout: 2500,
      version: snmp.Version2c
    };

    let session;
    try {
      session = snmp.createSession(ipAddress, community, options);
    } catch (err) {
      return resolve({ success: false, error: err.message });
    }

    // Target OIDs based on Cisco / IOL specification
    const oids = [
      '1.3.6.1.2.1.1.5.0',       // 0: System Name
      '1.3.6.1.4.1.9.2.1.56.0',  // 1: CPU Usage 5-sec (%)
      '1.3.6.1.4.1.9.2.1.8.0',   // 2: RAM Free (Bytes)
      '1.3.6.1.4.1.9.2.1.9.0'    // 3: RAM Used (Bytes)
    ];

    session.get(oids, (error, varbinds) => {
      session.close();

      if (error) {
        return resolve({ success: false, error: error.toString() });
      }

      let sysName = null;
      let cpu = 0;
      let freeRam = 0;
      let usedRam = 0;

      varbinds.forEach((vb, idx) => {
        if (!snmp.isVarbindError(vb) && vb.value !== null && vb.value !== undefined) {
          const val = vb.value;
          if (idx === 0) sysName = val.toString();
          if (idx === 1) cpu = parseInt(val.toString(), 10) || 0;
          if (idx === 2) freeRam = parseInt(val.toString(), 10) || 0;
          if (idx === 3) usedRam = parseInt(val.toString(), 10) || 0;
        }
      });

      let mem = 0;
      if (usedRam + freeRam > 0) {
        mem = Math.round((usedRam / (usedRam + freeRam)) * 100);
      } else if (usedRam > 0) {
        mem = Math.min(100, Math.round(usedRam / 1024 / 1024));
      }

      resolve({
        success: true,
        data: {
          sysName,
          cpu,
          mem,
          status: 'online'
        }
      });
    });
  });
};

module.exports = {
  pollDeviceMetrics
};
