const Stock = require('../models/Stock');
const logger = require('../utils/logger');

// Obtener todos los stocks con filtros y paginación
const getStocks = async (filters = {}, page = 1, count = 25) => {
  try {
    const query = {};
    
    // Aplicar filtros si están presentes
    if (filters.symbol) {
      query.symbol = { $regex: filters.symbol, $options: 'i' };
    }
    
    if (filters.name) {
      query.$or = [
        { shortName: { $regex: filters.name, $options: 'i' } },
        { longName: { $regex: filters.name, $options: 'i' } }
      ];
    }
    
    if (filters.minPrice) {
      query.price = query.price || {};
      query.price.$gte = parseFloat(filters.minPrice);
    }
    
    if (filters.maxPrice) {
      query.price = query.price || {};
      query.price.$lte = parseFloat(filters.maxPrice);
    }
    
    if (filters.date) {
      const date = new Date(filters.date);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      query.timestamp = {
        $gte: date,
        $lt: nextDay
      };
    }
    
    // Calcular paginación
    const skip = (page - 1) * count;
    
    // Consulta
    const stocks = await Stock.find(query)
      .sort({ symbol: 1, timestamp: -1 })
      .skip(skip)
      .limit(parseInt(count));
    
    const total = await Stock.countDocuments(query);
    
    return {
      data: stocks,
      page: parseInt(page),
      count: parseInt(count),
      totalPages: Math.ceil(total / count),
      total
    };
  } catch (error) {
    logger.error('Error al obtener stocks:', error);
    throw error;
  }
};

// Obtener stock por símbolo
const getStockBySymbol = async (symbol) => {
  try {
    const stock = await Stock.findOne({ symbol });
    
    if (!stock) {
      throw new Error(`Stock con símbolo ${symbol} no encontrado`);
    }
    
    return stock;
  } catch (error) {
    logger.error(`Error al obtener stock ${symbol}:`, error);
    throw error;
  }
};

// Actualizar cantidad de stock
const updateStockQuantity = async (symbol, quantityChange) => {
  try {
    const stock = await Stock.findOne({ symbol });
    
    if (!stock) {
      throw new Error(`Stock con símbolo ${symbol} no encontrado`);
    }
    
    stock.quantity += quantityChange;
    
    // Asegurar que la cantidad no sea negativa
    if (stock.quantity < 0) {
      stock.quantity = 0;
    }
    
    await stock.save();
    
    return stock;
  } catch (error) {
    logger.error(`Error al actualizar cantidad de stock ${symbol}:`, error);
    throw error;
  }
};

module.exports = {
  getStocks,
  getStockBySymbol,
  updateStockQuantity
};