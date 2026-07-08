const DeviceModel = require('../models/deviceModel');

const DeviceController = {
  getDevices: async (req, res) => {
    try {
      const devices = await DeviceModel.getAllDevices();
      return res.json(devices);
    } catch (error) {
      console.error('getDevices controller error:', error);
      return res.status(500).json({ error: 'Failed to retrieve devices.' });
    }
  },

  getDeviceMetrics: async (req, res) => {
    try {
      const { id } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      
      const metrics = await DeviceModel.getDeviceMetricsHistory(id, limit);
      return res.json(metrics);
    } catch (error) {
      console.error('getDeviceMetrics controller error:', error);
      return res.status(500).json({ error: 'Failed to retrieve metrics history.' });
    }
  }
};

module.exports = DeviceController;
