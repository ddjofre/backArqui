const Stock = require('../models/Stock');
const EventLog = require('../models/EventLog');
const logger = require('../utils/logger');

// Reconciliar inventario basado en eventos
const reconcileInventory = async () => {
  try {
    logger.info('Iniciando reconciliación de inventario...');
    
    // Obtener todos los stocks
    const stocks = await Stock.find();
    
    for (const stock of stocks) {
      // Calcular inventario basado en eventos
      const ipoEvents = await EventLog.find({
        type: { $in: ['IPO', 'EMIT'] },
        'data.symbol': stock.symbol
      });
      
      // Calcular cantidad inicial basada en eventos IPO y EMIT
      let calculatedQuantity = ipoEvents.reduce((total, event) => {
        return total + (event.data.quantity || 0);
      }, 0);
      
      // Restar compras aceptadas (propias)
      const ownPurchases = await EventLog.find({
        type: 'OWN_PURCHASE',
        'data.symbol': stock.symbol,
        'data.status': 'ACCEPTED'
      });
      
      calculatedQuantity -= ownPurchases.reduce((total, event) => {
        return total + (event.data.quantity || 0);
      }, 0);
      
      // Restar compras externas
      const externalPurchases = await EventLog.find({
        type: 'EXTERNAL_PURCHASE',
        'data.symbol': stock.symbol
      });
      
      calculatedQuantity -= externalPurchases.reduce((total, event) => {
        return total + (event.data.quantity || 0);
      }, 0);
      
      // Comparar con cantidad actual y ajustar si es necesario
      if (stock.quantity !== calculatedQuantity) {
        logger.info(`Inconsistencia detectada en ${stock.symbol}: DB=${stock.quantity}, Calculado=${calculatedQuantity}`);
        
        stock.quantity = calculatedQuantity;
        await stock.save();
        
        logger.info(`Inventario reconciliado para ${stock.symbol}`);
      }
    }
    
    logger.info('Reconciliación de inventario completada');
  } catch (error) {
    logger.error('Error durante reconciliación de inventario:', error);
  }
};

// Programar reconciliación periódica
const scheduleReconciliation = (intervalMinutes = 60) => {
  logger.info(`Programando reconciliación cada ${intervalMinutes} minutos`);
  
  // Ejecutar inmediatamente la primera vez
  reconcileInventory();
  
  // Luego programar ejecuciones periódicas
  setInterval(reconcileInventory, intervalMinutes * 60 * 1000);
};

module.exports = {
  reconcileInventory,
  scheduleReconciliation
};