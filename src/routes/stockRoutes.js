const express = require('express');
const { getAllStocks, getStock } = require('../controllers/stockController');

const router = express.Router();

// Rutas de stocks
router.get('/', getAllStocks);
router.get('/:symbol', getStock);

module.exports = router;