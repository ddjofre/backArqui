const express = require('express');
const { getAllEvents } = require('../controllers/eventLogController');

const router = express.Router();

router.get('/', getAllEvents);

module.exports = router;