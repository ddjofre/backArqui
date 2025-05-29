const { get } = require('mongoose');
const { createPurchaseRequest, getUserPurchaseRequests, retryPurchaseRequest } = require('../services/purchaseService');
const { createOrUpdateDefaultUser, getByEmail } = require('../services/userService');
const logger = require('../utils/logger');

// Crear solicitud de compra
const createPurchase = async (req, res) => {
  try {
    const { symbol, quantity, email } = req.body;
    
    // Validar datos
    if (!symbol || !quantity) {
      return res.status(400).json({ error: 'Símbolo y cantidad son requeridos' });
    }
    
    if (quantity <= 0 || !Number.isInteger(Number(quantity))) {
      return res.status(400).json({ error: 'La cantidad debe ser un número entero positivo' });
    }
    
    // Obtener el usuario por defecto
    const user = await getByEmail(email);
    
    const request = await createPurchaseRequest(email, symbol, quantity);
    
    res.status(201).json({
      message: 'Solicitud de compra creada exitosamente',
      request_id: request.request_id,
      status: request.status
    });
  } catch (error) {
    logger.error('Error en controlador createPurchase:', error);
    
    if (error.message.includes('No hay suficientes acciones') || 
        error.message.includes('Saldo insuficiente') ||
        error.message.includes('no encontrado')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Error al crear solicitud de compra' });
  }
};

// Obtener solicitudes de compra del usuario
const getPurchaseRequests = async (email, req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const count = parseInt(req.query.count) || 25;
    
    // Obtener el usuario por defecto
    const user = await getByEmail(req.user.email);
    
    const requests = await getUserPurchaseRequests(user.email, page, count);
    
    res.json(requests);
  } catch (error) {
    logger.error('Error en controlador getPurchaseRequests:', error);
    res.status(500).json({ error: 'Error al obtener solicitudes de compra' });
  }
};

// Reintentar solicitud de compra fallida
const retryPurchase = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    if (!requestId) {
      return res.status(400).json({ error: 'ID de solicitud es requerido' });
    }
    
    // Obtener el usuario por defecto
    const user = getByEmail(req.user.email);
    
    const newRequest = await retryPurchaseRequest(requestId, user.email);
    
    res.status(201).json({
      message: 'Solicitud de compra reintentada exitosamente',
      request_id: newRequest.request_id,
      status: newRequest.status
    });
  } catch (error) {
    logger.error('Error en controlador retryPurchase:', error);
    
    if (error.message.includes('no encontrada') || 
        error.message.includes('no se puede reintentar')) {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Error al reintentar solicitud de compra' });
  }
};

module.exports = {
  createPurchase,
  getPurchaseRequests,
  retryPurchase
};