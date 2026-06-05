const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/rbacMiddleware');

// All routes below require login
router.use(protect);

router.get('/free-model', aiController.freeModel);

router.post('/premium-model', restrictTo('Premium_User', 'Admin'), aiController.premiumModel);

router.delete('/purge-cache', restrictTo('Admin'), aiController.purgeCache);

module.exports = router;