const PurchaseRequest = require('../models/PurchaseRequest');
const { sendPurchaseRequest } = require('./mqttService');
const { getStockBySymbol } = require('./stockService');
const { getUserById, getUserByEmail, getByEmail } = require('./userService');
const logger = require('../utils/logger');


// Crear solicitud de compra
const createPurchaseRequest = async (email, symbol, quantity) => {
  try {
    // Verificar que el usuario existe
    const user = await getByEmail(email);
    
    // Verificar que el stock existe y obtener su precio
    const stock = await getStockBySymbol(symbol);
    
    // Verificar que hay suficiente cantidad disponible
    if (stock.quantity < quantity) {
      throw new Error('No hay suficientes acciones disponibles');
    }
    
    // Verificar que el usuario tiene saldo suficiente
    const cost = stock.price * quantity;
    
    if (user.wallet.balance < cost) {
      throw new Error('Saldo insuficiente');
    }
    
    // Enviar solicitud al broker MQTT
    const purchaseRequest = await sendPurchaseRequest(email, symbol, quantity);
    
    return purchaseRequest;
  } catch (error) {
    logger.error('Error al crear solicitud de compra:', error);
    throw error;
  }
};

// Obtener solicitudes de un usuario
const getUserPurchaseRequests = async (userId, page = 1, count = 25) => {
  try {
    const skip = (page - 1) * count;
    
    const requests = await PurchaseRequest.find({ user: userId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(count));
    
    const total = await PurchaseRequest.countDocuments({ user: userId });
    
    return {
      data: requests,
      page: parseInt(page),
      count: parseInt(count),
      totalPages: Math.ceil(total / count),
      total
    };
  } catch (error) {
    logger.error('Error al obtener solicitudes de compra:', error);
    throw error;
  }
};

// Reintentar una solicitud fallida
const retryPurchaseRequest = async (requestId, userId) => {
  try {
    // Verificar que la solicitud existe y pertenece al usuario
    const request = await PurchaseRequest.findOne({
      request_id: requestId,
      user: userId,
      status: { $in: ['REJECTED', 'NOT_VALID'] }
    });
    
    if (!request) {
      throw new Error('Solicitud no encontrada o no se puede reintentar');
    }
    
    // Crear una nueva solicitud con los mismos datos
    return await createPurchaseRequest(userId, request.symbol, request.quantity);
  } catch (error) {
    logger.error('Error al reintentar solicitud:', error);
    throw error;
  }
};

module.exports = {
  createPurchaseRequest,
  getUserPurchaseRequests,
  retryPurchaseRequest
};