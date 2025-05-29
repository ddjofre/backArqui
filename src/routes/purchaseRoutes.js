const express = require('express');
const { createPurchase, getPurchaseRequests, retryPurchase } = require('../controllers/purchaseController');

const router = express.Router();

router.post('/', createPurchase);
router.get('/', getPurchaseRequests);
router.post('/:requestId/retry', retryPurchase);

module.exports = router;