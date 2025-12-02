// routes/securityRoutes.js
const express = require('express');
const router = express.Router();
const securityController = require('../controllers/securityController');

// Middleware
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Security routes
router.post('/approve', securityController.approveGatePass);
router.post('/reject', securityController.rejectGatePass);
router.get('/pending-passes', securityController.getPendingPasses);
router.get('/approved-passes', securityController.getApprovedPasses);

module.exports = router;