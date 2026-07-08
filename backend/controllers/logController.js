const LogModel = require('../models/logModel');

const LogController = {
  getSyslogs: async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const logs = await LogModel.getSyslogs(limit);
      return res.json(logs);
    } catch (error) {
      console.error('getSyslogs controller error:', error);
      return res.status(500).json({ error: 'Failed to retrieve system logs.' });
    }
  },

  getAlerts: async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 30;
      const alerts = await LogModel.getAlertHistory(limit);
      return res.json(alerts);
    } catch (error) {
      console.error('getAlerts controller error:', error);
      return res.status(500).json({ error: 'Failed to retrieve alert history logs.' });
    }
  }
};

module.exports = LogController;
