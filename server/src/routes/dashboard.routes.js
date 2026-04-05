const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');

router.get('/', dashboardController.getDashboard);
router.delete('/clear', dashboardController.clearDashboardData);
// router.put('/insight/:insight_id', dashboardController.editInsightData);


module.exports = router;
