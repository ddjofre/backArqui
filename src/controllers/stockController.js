const { getStocks, getStockBySymbol } = require('../services/stockService');
const logger = require('../utils/logger');

// Obtener todos los stocks
const getAllStocks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const count = parseInt(req.query.count) || 25;
    
    // Extraer filtros de query
    const filters = {
      symbol: req.query.symbol,
      name: req.query.name,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      date: req.query.date
    };
    
    // Filtrar valores undefined o nulos
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined || filters[key] === null || filters[key] === '') {
        delete filters[key];
      }
    });
    
    const result = await getStocks(filters, page, count);
    
    res.json(result);
  } catch (error) {
    logger.error('Error en controlador getAllStocks:', error);
    res.status(500).json({ error: 'Error al obtener stocks' });
  }
};

// Obtener stock por símbolo
const getStock = async (req, res) => {
  try {
    const { symbol } = req.params;
    
    const stock = await getStockBySymbol(symbol);
    
    res.json(stock);
  } catch (error) {
    logger.error(`Error en controlador getStock:`, error);
    
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Error al obtener stock' });
  }
};


const getStockQuantity = async (req, res) => {
  try {
    const { symbol } = req.params;
    
    const stock = await getStockBySymbol(symbol);
    
    res.json(stock);
  } catch (error) {
    logger.error(`Error en controlador getStock:`, error);
    
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Error al obtener stock' });
  }
};


module.exports = {
  getAllStocks,
  getStock,
  getStockByQuantity
};