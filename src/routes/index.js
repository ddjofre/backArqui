const express = require('express');
const stockRoutes = require('./stockRoutes');
const userRoutes = require('./userRoutes');
const purchaseRoutes = require('./purchaseRoutes');
const eventRoutes = require('./eventRoutes');

const router = express.Router();

// Montar las rutas
router.use('/stocks', stockRoutes);
router.use('/user', userRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/events', eventRoutes);

module.exports = router;