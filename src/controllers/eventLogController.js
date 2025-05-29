const EventLog = require('../models/EventLog');
const logger = require('../utils/logger');

// Obtener todos los eventos
const getAllEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const count = parseInt(req.query.count) || 25;
    
    const skip = (page - 1) * count;
    
    // Aplicar filtros si existen
    const query = {};
    
    if (req.query.type) {
      query.type = req.query.type;
    }
    
    if (req.query.startDate && req.query.endDate) {
      query.timestamp = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    } else if (req.query.startDate) {
      query.timestamp = { $gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      query.timestamp = { $lte: new Date(req.query.endDate) };
    }
    
    const events = await EventLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(count));
    
    const total = await EventLog.countDocuments(query);
    
    res.json({
      data: events,
      page,
      count,
      totalPages: Math.ceil(total / count),
      total
    });
  } catch (error) {
    logger.error('Error en controlador getAllEvents:', error);
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
};

module.exports = {
  getAllEvents
};